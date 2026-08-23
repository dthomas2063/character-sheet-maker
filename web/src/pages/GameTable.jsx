import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import './game-table.css'
import GameSidebar from './GameSidebar'
import GameNavBar from './GameNavBar'
import GameChat from './GameChat'
import './initiative.css'
import './game-table-workspace.css'
import './combat-modal.css'
import './initiative-actions.css'
import './initiative-roll.css'

export default function GameTable({ user }){
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [monsterForm, setMonsterForm] = useState({ name: '', initiative: '', maxHp: '', hidden: false })
  const [hpForms, setHpForms] = useState({})
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  async function loadGame(){
    try{
      const res = await api.get(`/games/${id}`)
      setGame(res.data)
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not load game.') }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ loadGame() }, [id])

  if(loading) return <p>Loading game table...</p>
  if(!game) return <p className="game-table-message">{message || 'Game not found.'}</p>

  const isDm = String(game.owner?._id || game.owner) === String(user?._id)
  const myMember = game.members.find(member => String(member.user?._id || member.user) === String(user?._id))
  const initiativeEntries = [
    ...game.members.filter(member => member.inCombat !== false).map(member => ({
      id: member.character?._id || member.user?._id,
      name: member.character?.name || member.user?.name || member.user?.email || 'Player',
      initiative: member.character?.initiative ?? 0,
      type: member.user?.name || member.user?.email || 'Player',
      currentHp: member.character?.hitPoints?.current ?? 0,
      maxHp: member.character?.hitPoints?.max ?? 0,
      isMine: String(member.user?._id || member.user) === String(user?._id)
    })),
    ...game.monsters.filter(monster => monster.inCombat !== false && (isDm || !monster.hidden)).map(monster => ({ ...monster, id: monster._id, type: 'Monster', bloodied: monster.currentHp < monster.maxHp / 2 }))
  ].sort((first, second) => second.initiative - first.initiative)
  const livingEntries = initiativeEntries.filter(entry => !entry.dead)
  const currentTurnId = livingEntries.length ? livingEntries[currentTurnIndex % livingEntries.length].id : null

  async function addMonster(e){
    e.preventDefault()
    try{
      await api.post(`/games/${id}/initiative/monsters`, monsterForm)
      setMonsterForm({ name: '', initiative: '', maxHp: '', hidden: false })
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not add monster.') }
  }

  async function removeMonster(monsterId){
    try{
      await api.delete(`/games/${id}/initiative/monsters/${monsterId}`)
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not remove monster.') }
  }

  function handleMonsterUpdated(update){
    setGame(current => current ? {
      ...current,
      monsters: current.monsters.map(monster => String(monster._id) === String(update.monsterId) ? { ...monster, ...update } : monster)
    } : current)
  }

  async function toggleMonsterDead(monsterId){
    try{
      await api.patch(`/games/${id}/initiative/monsters/${monsterId}`)
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not update monster.') }
  }

  async function adjustMonsterHp(monsterId, direction){
    try{
      await api.patch(`/games/${id}/initiative/monsters/${monsterId}/hp`, { amount: hpForms[monsterId], direction })
      setHpForms(current => ({ ...current, [monsterId]: '' }))
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not apply damage.') }
  }

  async function toggleMonsterHidden(monsterId){
    try{
      await api.patch(`/games/${id}/initiative/monsters/${monsterId}/visibility`)
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not update monster visibility.') }
  }

  async function clearCombatTracker(){
    try{
      await api.post(`/games/${id}/initiative/clear`)
      setShowClearConfirm(false)
      setCurrentTurnIndex(0)
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not clear combat tracker.') }
  }

  async function rollInitiative(){
    try{
      const response = await api.post(`/games/${id}/initiative/roll`)
      setMessage(`Initiative rolled: ${response.data.roll} ${response.data.dexterityModifier >= 0 ? '+' : ''}${response.data.dexterityModifier} = ${response.data.initiative}`)
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not roll initiative.') }
  }

  function handleInitiativeUpdated(update){
    setGame(current => current ? {
      ...current,
      members: current.members.map(member => String(member.user?._id || member.user) === String(update.userId)
        ? { ...member, inCombat: update.inCombat, character: { ...member.character, initiative: update.initiative } }
        : member)
    } : current)
  }

  function handleCombatCleared(){
    setGame(current => current ? {
      ...current,
      members: current.members.map(member => ({ ...member, inCombat: false })),
      monsters: current.monsters.map(monster => ({ ...monster, inCombat: false }))
    } : current)
    setCurrentTurnIndex(0)
  }

  return (
    <div className="game-layout tabletop-layout">
      <GameSidebar gameName={game.name} gameId={id} />
      <div className="game-layout-content game-table-page">
        <GameNavBar gameName={game.name} dmName={game.owner?.name || game.owner?.email} />
        <div className="character-orb-strip" aria-label="Characters in this game">
          {game.members.map(member => {
            const characterName = member.character?.name || member.user?.name || member.user?.email || 'Character'
            const isMine = String(member.user?._id || member.user) === String(user?._id)
            return <span className={`character-orb${isMine ? ' own-character' : ''}`} key={member.character?._id || member.user?._id || member.user} title={isMine ? `${characterName} (me)` : characterName} aria-label={isMine ? `${characterName}, my character` : characterName}>{characterName.charAt(0).toUpperCase()}</span>
          })}
        </div>
        <div className="tabletop-main">
          <div className="tabletop-stage" aria-label="Virtual tabletop area">
            <section className="initiative-panel">
              <div className="initiative-heading"><p className="eyebrow">Combat tracker</p><span>{initiativeEntries.length} combatants</span>{myMember && myMember.inCombat === false && <button type="button" className="roll-initiative-button" onClick={rollInitiative}>Roll initiative</button>}{isDm && <button type="button" className="clear-combat-button" onClick={()=>setShowClearConfirm(true)} disabled={initiativeEntries.length === 0}>Clear</button>}{isDm && livingEntries.length > 0 && <button type="button" className="next-turn-button" onClick={()=>setCurrentTurnIndex(index => (index + 1) % livingEntries.length)}>Next turn</button>}</div>
              {initiativeEntries.length === 0 ? <p className="initiative-empty">No players or monsters yet.</p> : <ol className="initiative-list">
                {initiativeEntries.map(entry => <li className={`${entry.isMine ? 'initiative-own ' : ''}${entry.id === currentTurnId ? 'initiative-current ' : ''}${entry.dead ? 'initiative-dead ' : ''}${entry.hidden ? 'initiative-hidden' : ''}`} key={entry.id}><span className="initiative-score">{entry.initiative}</span><span className="initiative-name">{entry.name}</span>{entry.type === 'Monster' && entry.bloodied && <span className="bloodied-tag">Bloodied</span>}{isDm && entry.type === 'Monster' && <span className="monster-health-controls"><span className="combatant-hp">{entry.currentHp}/{entry.maxHp} HP</span><button type="button" className="health-adjust-button" onClick={()=>adjustMonsterHp(entry.id, -1)} disabled={!hpForms[entry.id]} aria-label={`Remove ${hpForms[entry.id] || 0} health from ${entry.name}`}>-</button><input className="damage-input" type="number" min="0" max={entry.maxHp} placeholder="HP" value={hpForms[entry.id] ?? ''} onChange={e=>setHpForms({...hpForms, [entry.id]:e.target.value})} aria-label={`Health amount for ${entry.name}`} /><button type="button" className="health-adjust-button" onClick={()=>adjustMonsterHp(entry.id, 1)} disabled={!hpForms[entry.id]} aria-label={`Add ${hpForms[entry.id] || 0} health to ${entry.name}`}>+</button></span>}{isDm && entry.type !== 'Monster' && <span className="combatant-hp">{entry.currentHp}/{entry.maxHp} HP</span>}{entry.type !== 'Monster' && <span className="initiative-type">{entry.type}</span>}{isDm && entry.type === 'Monster' && <span className="monster-actions"><button type="button" className="initiative-dead-button" onClick={()=>toggleMonsterDead(entry.id)}>{entry.dead ? 'Revive' : 'Mark dead'}</button><button type="button" className="initiative-dead-button" onClick={()=>toggleMonsterHidden(entry.id)}>{entry.hidden ? 'Reveal' : 'Hide'}</button><button type="button" className="initiative-remove" onClick={()=>removeMonster(entry.id)} aria-label={`Remove ${entry.name}`}>x</button></span>}</li>)}
              </ol>}
              {isDm && <form className="monster-form" onSubmit={addMonster}><input placeholder="Monster name" value={monsterForm.name} onChange={e=>setMonsterForm({...monsterForm, name:e.target.value})} required /><input type="number" placeholder="Init." value={monsterForm.initiative} onChange={e=>setMonsterForm({...monsterForm, initiative:e.target.value})} required /><input type="number" min="1" placeholder="Max HP" value={monsterForm.maxHp} onChange={e=>setMonsterForm({...monsterForm, maxHp:e.target.value})} required /><label className="monster-hidden-option"><input type="checkbox" checked={monsterForm.hidden} onChange={e=>setMonsterForm({...monsterForm, hidden:e.target.checked})} /> Hidden</label><button type="submit">Add monster</button></form>}
            </section>
          </div>
          <GameChat game={game} user={user} onMonsterUpdated={handleMonsterUpdated} onInitiativeUpdated={handleInitiativeUpdated} onCombatCleared={handleCombatCleared} />
        </div>
      </div>
      {showClearConfirm && <div className="combat-modal-backdrop" role="presentation"><div className="combat-modal" role="dialog" aria-modal="true" aria-labelledby="clear-combat-title"><h2 id="clear-combat-title">Clear combat tracker?</h2><p>This removes all players and monsters from the current tracker. Game membership and characters will be preserved.</p><div className="combat-modal-actions"><button type="button" className="modal-cancel" onClick={()=>setShowClearConfirm(false)}>Cancel</button><button type="button" onClick={clearCombatTracker}>Clear tracker</button></div></div></div>}
    </div>
  )
}
