import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import GameSidebar from './GameSidebar'
import GameNavBar from './GameNavBar'
import GameChat from './GameChat'
import './game-table.css'
import './initiative.css'
import './game-table-workspace.css'
import './combat-modal.css'
import './initiative-actions.css'
import './initiative-roll.css'
import './player-initiative.css'
import './initiative-inline.css'
import './manual-bloodied.css'

export default function GameTableView({ user }){
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [monsterForm, setMonsterForm] = useState({ name: '', initiative: '', maxHp: '', hidden: false })
  const [hpForms, setHpForms] = useState({})
  const [editingInitiative, setEditingInitiative] = useState(null)
  const [initiativeValue, setInitiativeValue] = useState('')
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0)
  const [currentTurnKey, setCurrentTurnKey] = useState(null)
  const [onlinePlayers, setOnlinePlayers] = useState({})
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  async function loadGame(){
    try{ const nextGame = (await api.get(`/games/${id}`)).data; setGame(nextGame); setCurrentTurnKey(nextGame.currentTurnKey) }
    catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not load game.') }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ loadGame() }, [id])

  if(loading) return <p>Loading game table...</p>
  if(!game) return <p className="game-table-message">{message || 'Game not found.'}</p>

  const isDm = String(game.owner?._id || game.owner) === String(user?._id)
  const myMember = game.members.find(member => String(member.user?._id || member.user) === String(user?._id))
  const initiativeEntries = [
    ...game.members.filter(member => member.inCombat !== false).map(member => ({
      id: `player:${member.user?._id || member.user}`,
      userId: member.user?._id || member.user,
      name: member.character?.name || member.user?.name || member.user?.email || 'Player',
      initiative: member.character?.initiative ?? 0,
      type: member.user?.name || member.user?.email || 'Player',
      currentHp: member.character?.hitPoints?.current ?? 0,
      maxHp: member.character?.hitPoints?.max ?? 0,
      isMine: String(member.user?._id || member.user) === String(user?._id)
    })),
    ...game.monsters.filter(monster => monster.inCombat !== false && (isDm || !monster.hidden)).map(monster => ({ ...monster, id: `monster:${monster._id}`, monsterId: monster._id, type: 'Monster', bloodied: monster.maxHp === 0 ? monster.bloodied : monster.currentHp < monster.maxHp / 2 }))
  ].sort((first, second) => second.initiative - first.initiative)
  const livingEntries = initiativeEntries.filter(entry => !entry.dead)
  const currentTurnId = currentTurnKey

  async function saveInitiative(entry){
    const endpoint = entry.type === 'Monster' ? `/games/${id}/initiative/monsters/${entry.monsterId}/initiative` : `/games/${id}/initiative/players/${entry.userId}`
    try{
      await api.patch(endpoint, { initiative: initiativeValue })
      setEditingInitiative(null)
      setInitiativeValue('')
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not update initiative.') }
  }

  async function rollInitiative(){
    try{
      const response = await api.post(`/games/${id}/initiative/roll`)
      setMessage(`Initiative rolled: ${response.data.roll} ${response.data.dexterityModifier >= 0 ? '+' : ''}${response.data.dexterityModifier} = ${response.data.initiative}`)
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not roll initiative.') }
  }

  async function advanceTurn(){
    try{
      const response = await api.post(`/games/${id}/initiative/next`)
      setCurrentTurnKey(response.data.currentTurnKey)
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not advance turn.') }
  }

  function editInitiative(entry){
    setEditingInitiative(`${entry.type}-${entry.id}`)
    setInitiativeValue(String(entry.initiative))
  }

  async function addMonster(event){
    event.preventDefault()
    try{
      await api.post(`/games/${id}/initiative/monsters`, monsterForm)
      setMonsterForm({ name: '', initiative: '', maxHp: '', hidden: false })
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not add monster.') }
  }

  async function monsterAction(path, body = {}){
    try{ await api.patch(`/games/${id}${path.replace('/monsters/monster:', '/monsters/')}`, body); loadGame() }
    catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not update monster.') }
  }

  async function adjustMonsterHp(monsterId, direction){
    try{
      const rawMonsterId = String(monsterId).replace(/^monster:/, '')
      const monster = game.monsters.find(item => String(item._id) === rawMonsterId)
      const adjustedDirection = monster?.maxHp === 0 ? direction * -1 : direction
      await api.patch(`/games/${id}/initiative/monsters/${rawMonsterId}/hp`, { amount: hpForms[monsterId], direction: adjustedDirection })
      setHpForms(current => ({ ...current, [monsterId]: '' }))
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not update monster health.') }
  }

  async function removeMonster(monsterId){
    try{ await api.delete(`/games/${id}/initiative/monsters/${String(monsterId).replace(/^monster:/, '')}`); loadGame() }
    catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not remove monster.') }
  }

  function handleMonsterUpdated(update){
    setGame(current => current ? { ...current, monsters: current.monsters.map(monster => String(monster._id) === String(update.monsterId) ? { ...monster, ...update } : monster) } : current)
  }

  function handleInitiativeUpdated(update){
    setGame(current => current ? { ...current, members: current.members.map(member => String(member.user?._id || member.user) === String(update.userId) ? { ...member, inCombat: update.inCombat, character: { ...member.character, initiative: update.initiative } } : member) } : current)
  }

  function handleCombatCleared(){
    setGame(current => current ? { ...current, members: current.members.map(member => ({ ...member, inCombat: false })), monsters: current.monsters.map(monster => ({ ...monster, inCombat: false })) } : current)
    setCurrentTurnIndex(0)
    setCurrentTurnKey(null)
  }

  function handlePresenceUpdated({ userId, online }){ setOnlinePlayers(current => ({ ...current, [String(userId)]: online })) }
  function handleTurnUpdated({ currentTurnKey: nextTurnKey }){ setCurrentTurnKey(nextTurnKey) }

  return <div className="game-layout tabletop-layout">
    <GameSidebar gameName={game.name} gameId={id} />
    <div className="game-layout-content game-table-page">
      <GameNavBar gameName={game.name} dmName={game.owner?.name || game.owner?.email} />
      <div className="character-orb-strip" aria-label="Characters in this game">
        {game.members.map((member, index) => { const name = member.character?.name || member.user?.name || member.user?.email || 'Character'; const memberId = String(member.user?._id || member.user); const mine = memberId === String(user?._id); const online = onlinePlayers[memberId]; return <span className={`character-orb${mine ? ' own-character' : ''}`} key={`character-${memberId}-${index}`} title={`${name}${online ? ' (online)' : ''}`} aria-label={`${name}${online ? ', online' : ''}`}>{name.charAt(0).toUpperCase()}{online && <span className="online-indicator" aria-hidden="true" />}</span> })}
      </div>
      <div className="tabletop-main">
        <div className="tabletop-stage" aria-label="Virtual tabletop area">
          <section className="initiative-panel">
            {isDm && <div className="manual-bloodied-controls"><p className="eyebrow">Damage-only monsters</p>{game.monsters.filter(monster => monster.maxHp === 0).map(monster => <div className="manual-bloodied-row" key={monster._id}><span>{monster.name}</span><button type="button" className="initiative-dead-button" onClick={()=>monsterAction(`/initiative/monsters/${monster._id}/bloodied`)}>{monster.bloodied ? 'Clear Bloodied' : 'Mark Bloodied'}</button></div>)}</div>}
            <div className="initiative-heading"><p className="eyebrow">Combat tracker</p><span>{initiativeEntries.length} combatants</span>{myMember?.inCombat === false && <button type="button" className="roll-initiative-button" onClick={rollInitiative}>Roll initiative</button>}{isDm && <button type="button" className="clear-combat-button" onClick={()=>setShowClearConfirm(true)} disabled={!initiativeEntries.length}>Clear</button>}{isDm && livingEntries.length > 0 && <button type="button" className="next-turn-button" onClick={advanceTurn}>Next turn</button>}</div>
            {initiativeEntries.length === 0 ? <p className="initiative-empty">No players or monsters yet.</p> : <ol className="initiative-list">{initiativeEntries.map((entry, index) => { const editKey = `${entry.type}-${entry.id}`; const editing = editingInitiative === editKey; return <li className={`${entry.isMine ? 'initiative-own ' : ''}${entry.id === currentTurnId ? 'initiative-current ' : ''}${entry.dead ? 'initiative-dead ' : ''}${entry.hidden ? 'initiative-hidden ' : ''}`} key={`${editKey}-${index}`}><button type="button" className="initiative-score" onClick={()=>isDm && editInitiative(entry)}>{editing ? <input autoFocus type="text" inputMode="numeric" pattern="-?[0-9]*" value={initiativeValue} onChange={event=>setInitiativeValue(event.target.value.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, ''))} onKeyDown={event=>{ if(event.key === 'Enter'){ event.preventDefault(); saveInitiative(entry) } if(event.key === 'Escape') setEditingInitiative(null) }} onBlur={()=>setEditingInitiative(null)} aria-label={`Initiative for ${entry.name}`} /> : entry.initiative}</button><span className="initiative-name">{entry.name}</span>{entry.type === 'Monster' && entry.bloodied && <span className="bloodied-tag">Bloodied</span>}{isDm && entry.type === 'Monster' && <span className="monster-health-controls"><span className="combatant-hp">{entry.currentHp}/{entry.maxHp} HP</span><button type="button" className="health-adjust-button" onClick={()=>adjustMonsterHp(entry.id, -1)} disabled={!hpForms[entry.id]}>-</button><input className="damage-input" type="text" inputMode="numeric" placeholder="HP" value={hpForms[entry.id] || ''} onChange={event=>setHpForms({...hpForms, [entry.id]:event.target.value.replace(/\D/g, '')})} /><button type="button" className="health-adjust-button" onClick={()=>adjustMonsterHp(entry.id, 1)} disabled={!hpForms[entry.id]}>+</button></span>}{isDm && entry.type !== 'Monster' && <span className="combatant-hp">{entry.currentHp}/{entry.maxHp} HP</span>}{entry.type !== 'Monster' && <span className="initiative-type">{entry.type}</span>}{isDm && entry.type === 'Monster' && <span className="monster-actions"><button type="button" className="initiative-dead-button" onClick={()=>monsterAction(`/initiative/monsters/${entry.id}`)}>{entry.dead ? 'Revive' : 'Mark dead'}</button>{entry.maxHp === 0 && <button type="button" className="initiative-dead-button" onClick={()=>monsterAction(`/initiative/monsters/${entry.id}/bloodied`)}>{entry.bloodied ? 'Clear Bloodied' : 'Mark Bloodied'}</button>}<button type="button" className="initiative-dead-button" onClick={()=>monsterAction(`/initiative/monsters/${entry.id}/visibility`)}>{entry.hidden ? 'Reveal' : 'Hide'}</button><button type="button" className="initiative-remove" onClick={()=>removeMonster(entry.id)} aria-label={`Remove ${entry.name}`}>x</button></span>}</li> })}</ol>}
            {isDm && <form className="monster-form" onSubmit={addMonster}><input placeholder="Monster name" value={monsterForm.name} onChange={event=>setMonsterForm({...monsterForm, name:event.target.value})} required /><input type="number" placeholder="Init." value={monsterForm.initiative} onChange={event=>setMonsterForm({...monsterForm, initiative:event.target.value})} required /><input type="number" min="0" placeholder="Max HP (0 = damage)" value={monsterForm.maxHp} onChange={event=>setMonsterForm({...monsterForm, maxHp:event.target.value})} required /><label className="monster-hidden-option"><input type="checkbox" checked={monsterForm.hidden} onChange={event=>setMonsterForm({...monsterForm, hidden:event.target.checked})} /> Hidden</label><button type="submit">Add monster</button></form>}
          </section>
        </div>
        <GameChat game={game} user={user} onMonsterUpdated={handleMonsterUpdated} onInitiativeUpdated={handleInitiativeUpdated} onCombatCleared={handleCombatCleared} onPresenceUpdated={handlePresenceUpdated} onTurnUpdated={handleTurnUpdated} />
      </div>
    </div>
    {showClearConfirm && <div className="combat-modal-backdrop" role="presentation"><div className="combat-modal" role="dialog" aria-modal="true" aria-labelledby="clear-combat-title"><h2 id="clear-combat-title">Clear combat tracker?</h2><p>This removes all players and monsters from the current tracker. Game membership and characters will be preserved.</p><div className="combat-modal-actions"><button type="button" className="modal-cancel" onClick={()=>setShowClearConfirm(false)}>Cancel</button><button type="button" onClick={async()=>{ await api.post(`/games/${id}/initiative/clear`); setShowClearConfirm(false); handleCombatCleared() }}>Clear tracker</button></div></div></div>}
  </div>
}

