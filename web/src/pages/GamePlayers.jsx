import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import GameSidebar from './GameSidebar'
import './game-table.css'
import './game-players.css'
import GameNavBar from './GameNavBar'
import GamePresence from './GamePresence'

export default function GamePlayers({ user }){
  const { id } = useParams()
  const [game, setGame] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadGame(){
    try{ setGame((await api.get(`/games/${id}`)).data) }
    catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not load players.') }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ loadGame() }, [id])

  async function invitePlayer(e){
    e.preventDefault()
    try{
      await api.post(`/games/${id}/invitations`, { email: inviteEmail })
      setInviteEmail('')
      setMessage('Invitation sent.')
      loadGame()
    }catch(err){ setMessage(err.response?.data?.error || err.message || 'Could not send invitation.') }
  }

  if(loading) return <p>Loading players...</p>
  if(!game) return <p className="game-table-message">{message || 'Game not found.'}</p>

  const isDm = String(game.owner?._id || game.owner) === String(user?._id)

  return <div className="game-layout">
    <GamePresence gameId={id} />
    <GameSidebar gameName={game.name} gameId={id} />
    <div className="game-layout-content game-players-page">
      <GameNavBar gameName={game.name} dmName={game.owner?.name || game.owner?.email} />
      <p className="eyebrow">Party management</p>
      {message && <p className="game-table-message" role="status">{message}</p>}
      <section className="party-section"><div className="section-heading"><h2>Party roster</h2><strong className="roster-count">{game.members.length} players</strong></div>
        {game.members.length === 0 ? <p className="empty-roster">No players have joined yet. Share the join code to gather the party.</p> : <div className="party-grid">{game.members.map((member, index) => { const isMine = String(member.user?._id || member.user) === String(user?._id); return <article className={`party-member${isMine ? ' own-member' : ''}`} key={`party-member-${member.user?._id || member.user}-${index}`}><span className="character-avatar">{(member.character?.name || member.user?.name || member.user?.email)?.charAt(0).toUpperCase()}</span><div><h3>{member.character?.name || 'Character pending'} {isMine && <span className="me-tag">Me</span>}</h3><p>{member.character?.classes?.map(characterClass => characterClass.name).join(' / ') || 'No class selected'} · Level {member.character?.level || '-'}</p><span>{member.user?.name || member.user?.email}</span></div></article> })}</div>}
      </section>
      {isDm && <section className="invite-section"><div><h2>Invite a player</h2><p>Invite a registered user by email, or share code <strong>{game.joinCode}</strong>.</p></div><form onSubmit={invitePlayer}><input type="email" placeholder="Player email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} required /><button type="submit">Send invite</button></form></section>}
    </div>
  </div>
}