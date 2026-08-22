import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import api from '../api/axios'
import './game-chat.css'

function nameFor(person){ return person?.name || person?.email || 'Unknown player' }
function idFor(person){ return String(person?._id || person) }

export default function GameChat({ game, user }){
  const [messages, setMessages] = useState([])
  const [recipientId, setRecipientId] = useState('')
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState(null)
  const socketRef = useRef(null)
  const endRef = useRef(null)

  const recipients = useMemo(()=>[
    game.owner,
    ...game.members.map(member => member.user)
  ].filter(person => idFor(person) !== idFor(user)), [game, user])

  useEffect(()=>{
    let active = true
    api.get(`/games/${game._id}/messages`).then(res=>{
      if(active) setMessages(res.data)
    }).catch(err=>{
      if(active) setStatus(err.response?.data?.error || 'Could not load chat history.')
    })

    const token = localStorage.getItem('authToken')
    const socket = io({ auth: { token } })
    socketRef.current = socket
    socket.on('connect', ()=>{
      socket.emit('joinGame', { gameId: game._id }, result=>{
        if(result?.error) setStatus(result.error)
      })
    })
    socket.on('chatMessage', message=>setMessages(current => [...current, message]))
    socket.on('connect_error', ()=>setStatus('Chat connection unavailable.'))

    return ()=>{
      active = false
      socket.disconnect()
      socketRef.current = null
    }
  }, [game._id])

  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function sendMessage(e){
    e.preventDefault()
    const content = draft.trim()
    if(!content || !socketRef.current) return
    socketRef.current.emit('sendMessage', { gameId: game._id, content, recipientId: recipientId || null }, result=>{
      if(result?.error) setStatus(result.error)
      else {
        setDraft('')
        setStatus(null)
      }
    })
  }

  return <section className="game-chat" aria-label="Game chat">
    <div className="game-chat-header"><div><p className="eyebrow">Game Chat</p></div><span>{messages.length} messages</span></div>
    <div className="chat-messages" aria-live="polite">
      {messages.length === 0 && <p className="chat-empty">No messages yet. Start the conversation.</p>}
      {messages.map(message => <article className={`chat-message ${message.type === 'event' ? 'chat-event' : ''} ${idFor(message.sender) === idFor(user) ? 'own-message' : ''}`} key={message._id || `${message.createdAt}-${message.content}`}>
        <div className="chat-message-meta"><strong>{message.type === 'event' ? 'Game event' : nameFor(message.sender)}</strong>{message.recipient && <span>whisper</span>}<time>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div>
        <p>{message.content}</p>
      </article>)}
      <span ref={endRef} />
    </div>
    {status && <p className="chat-status" role="status">{status}</p>}
    <form className="chat-compose" onSubmit={sendMessage}>
      <select value={recipientId} onChange={e=>setRecipientId(e.target.value)} aria-label="Message recipient">
        <option value="">Whole table</option>
        {recipients.map(person => <option key={idFor(person)} value={idFor(person)}>Whisper to {nameFor(person)}</option>)}
      </select>
      <div className="chat-input-row"><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a message..." maxLength="2000" /><button type="submit">Send</button></div>
    </form>
  </section>
}
