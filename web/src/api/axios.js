import axios from 'axios'

const apiOrigin = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${apiOrigin}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

export function setAuthToken(token){
  if(token){
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    try{ localStorage.setItem('authToken', token) }catch(e){}
  }else{
    delete api.defaults.headers.common['Authorization']
    try{ localStorage.removeItem('authToken') }catch(e){}
  }
}

// initialize from localStorage if present
try{
  const t = localStorage.getItem('authToken')
  if(t) api.defaults.headers.common['Authorization'] = `Bearer ${t}`
}catch(e){}

export default api
