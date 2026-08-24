import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

export default function PwaInstallPrompt(){
  const [installEvent, setInstallEvent] = useState(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(()=>{
    const handleInstallAvailable = event => {
      event.preventDefault()
      setInstallEvent(event)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleInstallAvailable)
    registerSW({
      onNeedRefresh: () => {
        setUpdateReady(true)
        setVisible(true)
      }
    })

    return ()=>{
      window.removeEventListener('beforeinstallprompt', handleInstallAvailable)
    }
  }, [])

  async function install(){
    if(!installEvent) return
    installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
    setVisible(false)
  }

  function refresh(){
    window.location.reload()
  }

  if(!visible) return null

  return (
    <aside className="pwa-prompt" aria-live="polite">
      <div>
        <strong>{updateReady ? 'A new version is ready' : 'Take your character sheets with you'}</strong>
        <span>{updateReady ? 'Refresh to use the latest version.' : 'Install Character Sheet Maker for quick access.'}</span>
      </div>
      <div className="pwa-prompt-actions">
        <button onClick={updateReady ? refresh : install}>{updateReady ? 'Refresh' : 'Install'}</button>
        <button className="pwa-dismiss" onClick={()=>setVisible(false)} aria-label="Dismiss">&#10005;</button>
      </div>
    </aside>
  )
}
