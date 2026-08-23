import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './game-sidebar.css'
import './game-sidebar-layout.css'

export default function GameSidebar({ gameName, gameId }){
  const [expanded, setExpanded] = useState(false)
  const links = [
    { to: `/games/${gameId}`, label: 'Game table', icon: 'T', end: true },
    { to: `/games/${gameId}/players`, label: 'Players', icon: 'P' },
    { to: `/games/${gameId}/spells`, label: 'Spells', icon: 'S' },
    { to: `/games/${gameId}/initiative-display`, label: 'Initiative display', icon: 'D' },
    { to: `/games/${gameId}/settings`, label: 'Game settings', icon: 'G' }
  ]

  return (
    <aside className={`game-sidebar${expanded ? ' expanded' : ''}`} aria-label="Game navigation">
      <button className="sidebar-toggle" onClick={()=>setExpanded(current => !current)} aria-expanded={expanded} aria-label={expanded ? 'Collapse game navigation' : 'Expand game navigation'}>
        <span aria-hidden="true">{expanded ? '<' : '>'}</span>
      </button>
      <nav className="sidebar-links">
        {links.map(link => <NavLink key={link.to} to={link.to} end={link.end} className="sidebar-link" title={link.label}>
          <span className="sidebar-icon" aria-hidden="true">{link.icon}</span>
          {expanded && <span>{link.label}</span>}
        </NavLink>)}
      </nav>
    </aside>
  )
}
