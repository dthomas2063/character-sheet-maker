import { useEffect, useState } from 'react'
import { getPendingSyncCount, subscribeToSyncStatus, syncQueuedRequests } from './api/axios'

export default function OfflineStatus(){
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(0)

  useEffect(()=>{
    const refresh = () => getPendingSyncCount().then(setPending)
    const handleOnline = () => {
      setOnline(true)
      syncQueuedRequests().then(refresh)
    }
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    const unsubscribe = subscribeToSyncStatus(refresh)
    refresh()
    syncQueuedRequests().then(refresh)
    return ()=>{
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [])

  if(online && pending === 0) return null

  return (
    <div className={`offline-status${online ? '' : ' is-offline'}`} role="status">
      <span className="offline-status-dot" aria-hidden="true" />
      {online ? `${pending} change${pending === 1 ? '' : 's'} waiting to sync` : 'Offline - changes will sync when you reconnect'}
    </div>
  )
}
