import axios from 'axios'
import { addQueuedRequest, cacheResponse, getCachedResponse, getQueuedRequests, removeQueuedRequest } from './offlineStore'

const apiOrigin = import.meta.env.VITE_API_URL || ''
const apiBaseUrl = apiOrigin ? apiOrigin : '/api'
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

const statusEvent = 'offline-sync-status'

function notifyStatus(){ window.dispatchEvent(new Event(statusEvent)) }
function cacheKey(config){
  const params = config.params ? JSON.stringify(config.params) : ''
  return `${config.baseURL || ''}${config.url || ''}?${params}`
}
function isMutation(config){ return ['post', 'put', 'patch', 'delete'].includes((config.method || 'get').toLowerCase()) }
function isAuthRequest(config){ return ['/auth/login', '/auth/register'].some(path => (config.url || '').endsWith(path)) }
function isNetworkFailure(error){ return !error.response && error.code !== 'ERR_CANCELED' }

api.interceptors.response.use(async response => {
  if(response.config.method?.toLowerCase() === 'get'){
    await cacheResponse(cacheKey(response.config), {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: {}
    })
  }
  return response
}, async error => {
  const config = error.config
  if(!config || config.headers?.['X-Offline-Replay']) return Promise.reject(error)

  if(config.method?.toLowerCase() === 'get' && isNetworkFailure(error)){
    const cached = await getCachedResponse(cacheKey(config)).catch(()=>null)
    if(cached) return { ...cached, config, request: undefined, fromOfflineCache: true }
  }

  if(isMutation(config) && !isAuthRequest(config) && isNetworkFailure(error) && localStorage.getItem('authToken')){
    await addQueuedRequest({
      url: config.url,
      method: config.method,
      data: config.data,
      headers: { Authorization: config.headers?.Authorization || '' }
    })
    notifyStatus()
    const queuedError = new Error('Saved offline. It will sync when connection returns.')
    queuedError.code = 'OFFLINE_QUEUED'
    return Promise.reject(queuedError)
  }
  return Promise.reject(error)
})

export async function syncQueuedRequests(){
  if(!navigator.onLine) return
  const queued = await getQueuedRequests().catch(()=>[])
  for(const entry of queued){
    try{
      await api.request({
        url: entry.request.url,
        method: entry.request.method,
        data: entry.request.data,
        headers: { ...entry.request.headers, 'X-Offline-Replay': 'true' }
      })
      await removeQueuedRequest(entry.id)
    }catch(error){
      if(error.response?.status >= 400 && error.response.status < 500) await removeQueuedRequest(entry.id)
      break
    }
  }
  notifyStatus()
}

export async function getPendingSyncCount(){ return (await getQueuedRequests().catch(()=>[])).length }
export function subscribeToSyncStatus(listener){
  window.addEventListener(statusEvent, listener)
  return () => window.removeEventListener(statusEvent, listener)
}

export function setAuthToken(token){
  if(token){
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    try{ localStorage.setItem('authToken', token) }catch(e){}
  }else{
    delete api.defaults.headers.common.Authorization
    try{ localStorage.removeItem('authToken') }catch(e){}
  }
}

try{
  const token = localStorage.getItem('authToken')
  if(token) api.defaults.headers.common.Authorization = `Bearer ${token}`
}catch(e){}

export default api
