import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import './game-table.css'
import GameSidebar from './GameSidebar'
import GameNavBar from './GameNavBar'
import './game-table-workspace.css'

export default function GameTable({ user }){
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="game-layout tabletop-layout">
      <GameSidebar gameName={game.name} gameId={id} />
      <div className="game-layout-content game-table-page">
        <GameNavBar gameName={game.name} dmName={game.owner?.name || game.owner?.email} />
        <div className="character-orb-strip" aria-label="Characters in this game">
          {game.members.map(member => {
            const characterName = member.character?.name || member.user?.name || member.user?.email || 'Character'
            return <span className="character-orb" key={member.character?._id || member.user?._id || member.user} title={characterName} aria-label={characterName}>{characterName.charAt(0).toUpperCase()}</span>
          })}
        </div>
      </div>
    </div>
  )
}
