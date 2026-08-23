import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import Spells from './Spells'
import GameSidebar from './GameSidebar'
import GameNavBar from './GameNavBar'
import './game-table.css'
import GamePresence from './GamePresence'

export default function GameSpells(){
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [initialClassFilter, setInitialClassFilter] = useState('all')

  useEffect(()=>{
    Promise.all([api.get(`/games/${id}`), api.get('/characters')]).then(([gameRes, charactersRes])=>{
      setGame(gameRes.data)
      const gameCharacter = charactersRes.data.find(character => String(character.game?._id || character.game) === String(id))
      const characterClass = gameCharacter?.classes?.[0]?.name
      if(characterClass) setInitialClassFilter(characterClass)
    }).catch(()=>{})
  }, [id])

  if(!game) return <p>Loading spells...</p>

  return (
    <div className="game-layout">
      <GamePresence gameId={id} />
      <GameSidebar gameName={game.name} gameId={id} />
      <div className="game-layout-content">
        <GameNavBar gameName={game.name} dmName={game.owner?.name || game.owner?.email || 'Unknown'} />
        <Spells initialClassFilter={initialClassFilter} />
      </div>
    </div>
  )
}