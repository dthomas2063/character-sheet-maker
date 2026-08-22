import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import './games.css'

export default function Games({ user }){
  const [games, setGames] = useState([])
  const [invitations, setInvitations] = useState([])
  const [characters, setCharacters] = useState([])
  const [newGame, setNewGame] = useState({ name: '', gameType: 'DND 2024', description: '' })
  const [joinCode, setJoinCode] = useState('')
  const [inviteEmails, setInviteEmails] = useState({})
  const [selections, setSelections] = useState({})
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadGames(){
    setLoading(true)
    try{
      const [gamesRes, charactersRes] = await Promise.all([api.get('/games'), api.get('/characters')])
      setGames(gamesRes.data.games)
      setInvitations(gamesRes.data.invitations)
      setCharacters(charactersRes.data)
    }catch(err){
      setMessage(err.response?.data?.error || err.message || 'Could not load games.')
    }finally{ setLoading(false) }
  }

  useEffect(()=>{ loadGames() }, [])

  async function createGame(e){
    e.preventDefault()
    setMessage(null)
    try{
      await api.post('/games', newGame)
      setNewGame({ name: '', gameType: 'DND 2024', description: '' })
      setMessage('Game created.')
      loadGames()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not create game.') }
  }

  async function invite(gameId){
    setMessage(null)
    try{
      await api.post(`/games/${gameId}/invitations`, { email: inviteEmails[gameId] })
      setInviteEmails(current => ({ ...current, [gameId]: '' }))
      setMessage('Invitation sent.')
      loadGames()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not send invitation.') }
  }

  async function accept(gameId){
    setMessage(null)
    try{
      await api.post(`/games/${gameId}/accept`, { characterId: selections[gameId] })
      setMessage('You joined the game.')
      loadGames()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not accept invitation.') }
  }

  async function join(){
    setMessage(null)
    try{
      await api.post('/games/join', { joinCode, characterId: selections.joinCode })
      setJoinCode('')
      setMessage('You joined the game.')
      loadGames()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not join game.') }
  }

  if(loading) return <p>Loading games...</p>

  return (
    <div className="games-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Campaign table</p>
          <h1>Games</h1>
          <p className="page-intro">Gather your party and keep every character in the same story.</p>
        </div>
      </div>

      {message && <p className="games-message" role="status">{message}</p>}

      <section className="game-actions">
        <form onSubmit={createGame} className="game-form">
          <h2>Start a game</h2>
          <input placeholder="Game name" value={newGame.name} onChange={e=>setNewGame({...newGame, name:e.target.value})} required />
          <select value={newGame.gameType} onChange={e=>setNewGame({...newGame, gameType:e.target.value})} required>
            <option value="DND 2024">DND 2024</option>
            <option value="Starwars FFG">Starwars FFG</option>
            <option value="The One Ring">The One Ring</option>
          </select>
          <input placeholder="Description (optional)" value={newGame.description} onChange={e=>setNewGame({...newGame, description:e.target.value})} />
          <button type="submit">Create game</button>
        </form>
        <form onSubmit={join} className="game-form join-form">
          <h2>Join with a code</h2>
          <input placeholder="Join code" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} required />
          <select value={selections.joinCode || ''} onChange={e=>setSelections({...selections, joinCode:e.target.value})} required>
            <option value="">Choose character</option>
            {characters.map(character => <option key={character._id} value={character._id}>{character.name}</option>)}
          </select>
          <button type="submit">Join game</button>
        </form>
      </section>

      {invitations.length > 0 && <section className="game-section">
        <h2>Pending invitations</h2>
        <div className="game-grid">
          {invitations.map(game => <article className="game-card invitation-card" key={game._id}>
            <h3>{game.name}</h3>
            <p>{game.description || 'You have been invited to this campaign.'}</p>
            <span className="game-meta">DM: {game.owner?.name || game.owner?.email}</span>
            <div className="join-controls">
              <select value={selections[game._id] || ''} onChange={e=>setSelections({...selections, [game._id]:e.target.value})}>
                <option value="">Choose character</option>
                {characters.map(character => <option key={character._id} value={character._id}>{character.name}</option>)}
              </select>
              <button onClick={()=>accept(game._id)}>Accept invite</button>
            </div>
          </article>)}
        </div>
      </section>}

      <section className="game-section">
        <h2>Your games</h2>
        {games.length === 0 ? <p className="list-message">No games yet. Start one above or join with a code.</p> : <div className="game-grid">
          {games.map(game => <article className="game-card" key={game._id}>
            <div className="game-card-heading"><h3><Link to={`/games/${game._id}`}>{game.name}</Link></h3><span>{game.members.length} players</span></div>
            <p>{game.description || 'No description yet.'}</p>
            <span className="game-meta">Join code: <strong>{game.joinCode}</strong></span>
            <div className="members-list">
              {game.members.length === 0 ? <span>Waiting for players</span> : game.members.map(member => <span key={member.user._id}>{member.character?.name || member.user.name || member.user.email}</span>)}
            </div>
            {String(game.owner?._id) === String(user?._id) && <form className="invite-form" onSubmit={e=>{ e.preventDefault(); invite(game._id) }}>
              <input placeholder="Player email" type="email" value={inviteEmails[game._id] || ''} onChange={e=>setInviteEmails({...inviteEmails, [game._id]:e.target.value})} required />
              <button type="submit">Invite player</button>
            </form>}
          </article>)}
        </div>}
      </section>
    </div>
  )
}
