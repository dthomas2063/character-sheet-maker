import React from 'react'
import './game-nav-bar.css'
import './game-nav-dm.css'

export default function GameNavBar({ gameName, dmName }){
  return (
    <div className="game-nav-bar">
      <span className="game-nav-mark" aria-hidden="true">G</span>
      <strong>{gameName}</strong>
      <span className="game-nav-dm">DM: {dmName}</span>
      <span className="game-status"><span aria-hidden="true"></span>Active</span>
    </div>
  )
}
