import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import api from '../api/axios'
import './game-chat.css'
import './dice-roll.css'
import './dice-groups.css'
import './dice-popup.css'

function nameFor(person){ return person?.name || person?.email || 'Unknown player' }
function idFor(person){ return String(person?._id || person) }

export default function GameChat({ game, user, onMonsterUpdated, onInitiativeUpdated, onCombatCleared, onPresenceUpdated }){
  const [messages, setMessages] = useState([])
  const [recipientId, setRecipientId] = useState('')
  const [draft, setDraft] = useState('')
  const [roll, setRoll] = useState({ label: 'Ability check', dice: [{ count: 1, sides: 20 }], bonus: 0 })
  const [rollOpen, setRollOpen] = useState(false)
  const [status, setStatus] = useState(null)
  const socketRef = useRef(null)
  const endRef = useRef(null)
  const rollComposerRef = useRef(null)

  const recipients = useMemo(()=>{
    const seen = new Set()
    return [game.owner, ...game.members.map(member => member.user)].filter(person => {
      const personId = idFor(person)
      if(personId === idFor(user) || seen.has(personId)) return false
      seen.add(personId)
      return true
    })
  }, [game, user])

  useEffect(()=>{
    let active = true
    api.get(`/games/${game._id}/messages`).then(res=>{
      if(active) setMessages(res.data)
    }).catch(err=>{
      if(active) setStatus(err.response?.data?.error || 'Could not load chat history.')
    })

    const token = localStorage.getItem('authToken')
    const socket = io({
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    })
    socketRef.current = socket
    function joinGame(){
      socket.emit('joinGame', { gameId: game._id }, result=>{
        if(result?.error) setStatus(result.error)
        else setStatus(null)
      })
    }
    socket.on('connect', joinGame)
    socket.on('reconnect', joinGame)
    socket.on('chatMessage', message=>setMessages(current => current.some(existing => existing._id && existing._id === message._id) ? current : [...current, message]))
    socket.on('monsterUpdated', onMonsterUpdated)
    socket.on('initiativeUpdated', onInitiativeUpdated)
    socket.on('combatCleared', onCombatCleared)
      socket.on('playerPresence', onPresenceUpdated)
      socket.on('playerPresenceSnapshot', ({ players })=>players.forEach(userId => onPresenceUpdated({ userId, online: true })))
    socket.on('connect_error', ()=>setStatus('Chat connection unavailable.'))
    socket.on('disconnect', ()=>setStatus('Chat disconnected. Reconnecting...'))

    return ()=>{
      active = false
      socket.emit('leaveGame', { gameId: game._id })
      socket.disconnect()
      socketRef.current = null
    }
  }, [game._id])

  useEffect(()=>{ endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(()=>{
    function closeRollComposer(event){
      if(rollComposerRef.current && !rollComposerRef.current.contains(event.target)) setRollOpen(false)
    }
    document.addEventListener('mousedown', closeRollComposer)
    return ()=>document.removeEventListener('mousedown', closeRollComposer)
  }, [])

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

  function rollDice(e){
    e.preventDefault()
    if(!socketRef.current) return
    socketRef.current.emit('rollDice', { gameId: game._id, ...roll }, result=>{
      if(result?.error) setStatus(result.error)
      else {
        setRoll(current => ({ ...current, dice: [{ count: 1, sides: 20 }], bonus: 0 }))
        setRollOpen(false)
        setStatus(null)
      }
    })
  }

  function updateDie(index, field, value){
    setRoll(current => ({ ...current, dice: current.dice.map((die, dieIndex) => dieIndex === index ? { ...die, [field]: value } : die) }))
  }

  function addDie(){
    setRoll(current => ({ ...current, dice: [...current.dice, { count: 1, sides: 6 }] }))
  }

  function removeDie(index){
    setRoll(current => ({ ...current, dice: current.dice.filter((_, dieIndex) => dieIndex !== index) }))
  }

  return <section className="game-chat" aria-label="Game chat">
    <div className="game-chat-header"><div><p className="eyebrow">Game Chat</p></div><span>{messages.length} messages</span></div>
    <div className="chat-messages" aria-live="polite">
      {messages.length === 0 && <p className="chat-empty">No messages yet. Start the conversation.</p>}
      {messages.map((message, messageIndex) => message.type === 'event' ? <p className="chat-event" key={`event-${message._id || messageIndex}`}>{message.content}</p> : <article className={`chat-message ${idFor(message.sender) === idFor(user) ? 'own-message' : ''}`} key={`message-${message._id || messageIndex}`}>
        <div className="chat-message-meta"><strong>{message.type === 'event' ? 'Game event' : nameFor(message.sender)}</strong>{message.recipient && <span>whisper</span>}<time>{new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div>
        <p>{message.content}</p>
      </article>)}
      <span ref={endRef} />
    </div>
    {status && <p className="chat-status" role="status">{status}</p>}
    <div className="chat-compose">
      <select value={recipientId} onChange={e=>setRecipientId(e.target.value)} aria-label="Message recipient">
        <option value="">Whole table</option>
        {recipients.map((person, index) => <option key={`recipient-${idFor(person)}-${index}`} value={idFor(person)}>Whisper to {nameFor(person)}</option>)}
      </select>
      <form className="chat-input-row" onSubmit={sendMessage}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a message..." maxLength="2000" /><button type="submit">Send</button></form>
      <div className="dice-composer" ref={rollComposerRef}>
        <button type="button" className="dice-composer-toggle" onClick={()=>setRollOpen(current => !current)} aria-expanded={rollOpen}>Roll dice</button>
        {rollOpen && <form className="dice-roll-form" onSubmit={rollDice}>
        <input value={roll.label} onChange={e=>setRoll({...roll, label:e.target.value})} placeholder="Roll type" aria-label="Roll type" maxLength="80" />
        <div className="dice-groups">
          {roll.dice.map((die, index) => <div className="dice-group" key={index}>
            <input type="number" min="1" max="20" value={die.count} onChange={e=>updateDie(index, 'count', e.target.value)} aria-label={`Dice count ${index + 1}`} />
            <span>d</span>
            <select value={die.sides} onChange={e=>updateDie(index, 'sides', e.target.value)} aria-label={`Dice sides ${index + 1}`}><option value="4">4</option><option value="6">6</option><option value="8">8</option><option value="10">10</option><option value="12">12</option><option value="20">20</option><option value="100">100</option></select>
            {roll.dice.length > 1 && <button type="button" className="remove-dice-button" onClick={()=>removeDie(index)} aria-label="Remove dice type">x</button>}
          </div>)}
        </div>
        <button type="button" className="add-dice-button" onClick={addDie} aria-label="Add another dice type">+</button>
        <span>+</span>
        <input type="number" min="-1000" max="1000" value={roll.bonus} onChange={e=>setRoll({...roll, bonus:e.target.value})} aria-label="Roll bonus" />
        <button type="submit">Roll</button>
        </form>}
      </div>
    </div>
  </section>
}
