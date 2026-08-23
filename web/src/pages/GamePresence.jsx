import { useEffect } from 'react'
import { io } from 'socket.io-client'

export default function GamePresence({ gameId }){
  useEffect(()=>{
    const token = localStorage.getItem('authToken')
    const socket = io(import.meta.env.VITE_API_URL || undefined, { auth: { token } })
    socket.on('connect', ()=>socket.emit('joinGame', { gameId }))
    return ()=>{
      socket.emit('leaveGame', { gameId })
      socket.disconnect()
    }
  }, [gameId])

  return null
}
