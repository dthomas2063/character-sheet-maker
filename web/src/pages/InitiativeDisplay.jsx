import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../api/axios'
import GameSidebar from './GameSidebar'
import './initiative-display.css'
import './initiative-display-layout.css'
import './initiative-display-bar.css'

export default function InitiativeDisplay(){
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(()=>{
    let active = true
    api.get(`/games/${id}`).then(res=>{
      if(active) setGame(res.data)
    }).catch(err=>{
      if(active) setStatus(err.response?.data?.error || 'Could not load initiative display.')
    })
    const socket = io(import.meta.env.VITE_API_URL || undefined, { auth: { token: localStorage.getItem('authToken') }, reconnection: true })
    socket.on('connect', ()=>socket.emit('joinGame', { gameId: id }))
    socket.on('monsterUpdated', update=>setGame(current => current ? { ...current, monsters: current.monsters.map(monster => String(monster._id) === String(update.monsterId) ? { ...monster, ...update } : monster) } : current))
    socket.on('monsterAdded', monster=>setGame(current => current && current.monsters.some(item => String(item._id) === String(monster._id)) ? current : current ? { ...current, monsters: [...current.monsters, monster] } : current))
    socket.on('monsterRemoved', ({ monsterId })=>setGame(current => current ? { ...current, monsters: current.monsters.filter(monster => String(monster._id) !== String(monsterId)) } : current))
    socket.on('initiativeUpdated', update=>setGame(current => current ? { ...current, members: current.members.map(member => String(member.user?._id || member.user) === String(update.userId) ? { ...member, inCombat: update.inCombat, character: { ...member.character, initiative: update.initiative } } : member) } : current))
    socket.on('turnUpdated', update=>setGame(current => current ? { ...current, currentTurnKey: update.currentTurnKey } : current))
    socket.on('combatCleared', ()=>setGame(current => current ? { ...current, currentTurnKey: null, members: current.members.map(member => ({ ...member, inCombat: false })), monsters: current.monsters.map(monster => ({ ...monster, inCombat: false })) } : current))
    return ()=>{
      active = false
      socket.emit('leaveGame', { gameId: id })
      socket.disconnect()
    }
  }, [id])

  const entries = useMemo(()=>{
    if(!game) return []
    return [
      ...game.members.filter(member => member.inCombat !== false).map(member => ({ key: `player:${member.user?._id || member.user}`, name: member.character?.name || member.user?.name || 'Player', initiative: member.character?.initiative ?? 0, type: 'Player', dead: false })),
      ...game.monsters.filter(monster => monster.inCombat !== false && !monster.hidden).map(monster => ({ key: `monster:${monster._id}`, name: monster.name, initiative: monster.initiative, type: 'Monster', dead: monster.dead, bloodied: monster.maxHp === 0 ? monster.bloodied : monster.currentHp < monster.maxHp / 2 }))
    ].sort((first, second) => second.initiative - first.initiative)
  }, [game])

  if(!game) return <main className="initiative-display-page"><p>{status || 'Loading initiative...'}</p></main>

  return <main className="initiative-display-page">
    <div className="initiative-display-layout">
      <GameSidebar gameName={game.name} gameId={id} />
      <div className="initiative-display-content">
        <section className="display-tracker"><div className="display-tracker-heading"><span>Initiative</span><small>{entries.length} combatants</small></div>
          {entries.length === 0 ? <p className="display-empty">Waiting for combatants</p> : <ol>{entries.map(entry => <li className={`${entry.key === game.currentTurnKey ? 'current ' : ''}${entry.dead ? 'dead' : ''}`} key={entry.key}><strong>{entry.initiative}</strong><span>{entry.name}</span>{entry.bloodied && <em>Bloodied</em>}</li>)}</ol>}
        </section>
      </div>
    </div>
  </main>
}
