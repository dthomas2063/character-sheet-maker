import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import GameSidebar from './GameSidebar'
import GameNavBar from './GameNavBar'
import './game-table.css'

export default function GameSettings({ user }){
  const { id } = useParams()
  const [game, setGame] = useState({ name: 'Game', owner: null, gameType: 'DND 2024' })
  const [gameType, setGameType] = useState('DND 2024')
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    api.get(`/games/${id}`).then(res=>{
      setGame(res.data)
      setGameType(res.data.gameType || 'DND 2024')
    }).catch(()=>{})
  }, [id])

  async function saveGameType(e){
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try{
      const res = await api.patch(`/games/${id}`, { gameType })
      setGame(res.data)
      setStatus('Game type saved.')
    }catch(err){
      setStatus(err.response?.data?.error || err.message || 'Could not save game type.')
    }finally{ setSaving(false) }
  }

  const isDm = String(game.owner?._id || game.owner) === String(user?._id)
  const hasGameTypeChanges = gameType !== (game.gameType || 'DND 2024')

  return (
    <div className="game-layout">
      <GameSidebar gameName={game.name} gameId={id} />
      <section className="game-layout-content preferences-page game-settings-page">
        <GameNavBar gameName={game.name} dmName={game.owner?.name || game.owner?.email || 'Unknown'} />
        <p className="eyebrow">Game Settings</p>
        <p>Game settings will live here as the campaign tools grow.</p>
        <section className="game-info-section">
          <h2>Game info</h2>
          <dl>
            <div><dt>Dungeon Master</dt><dd>{game.owner?.name || game.owner?.email || 'Unknown'}</dd></div>
            <div><dt>Created</dt><dd>{game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'Unknown'}</dd></div>
            <div><dt>Invite code</dt><dd className="invite-code">{game.joinCode || 'Unknown'}</dd></div>
          </dl>
        </section>
        <form className="game-type-form" onSubmit={saveGameType}>
          <label htmlFor="game-type">Game type</label>
          <select id="game-type" value={gameType} onChange={e=>setGameType(e.target.value)} disabled={!isDm}>
            <option value="DND 2024">DND 2024</option>
            <option value="Starwars FFG">Starwars FFG</option>
            <option value="The One Ring">The One Ring</option>
          </select>
          {isDm && hasGameTypeChanges && <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save game type'}</button>}
          {status && <span className="settings-status" role="status">{status}</span>}
        </form>
      </section>
    </div>
  )
}
