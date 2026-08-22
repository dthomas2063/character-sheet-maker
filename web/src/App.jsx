import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom'
import CharacterList from './pages/CharacterList'
import About from './pages/About'
import Spells from './pages/Spells'
import Character from './pages/Character'
import Login from './pages/Login'
import Register from './pages/Register'
import Preferences from './pages/Preferences'
import Games from './pages/Games'
import GameTable from './pages/GameTable'
import GameSettings from './pages/GameSettings'
import GamePlayers from './pages/GamePlayers'
import api, { setAuthToken } from './api/axios'

export default function App(){
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(()=>{
    try{ return localStorage.getItem('theme') || 'dark' }catch(e){ return 'dark' }
  })
  const navigate = useNavigate()

  useEffect(()=>{
    document.documentElement.dataset.theme = theme
    try{ localStorage.setItem('theme', theme) }catch(e){}
  }, [theme])

  useEffect(()=>{
    try{ const t = localStorage.getItem('authToken'); if(t) setToken(t) }catch(e){}
  },[])

  useEffect(()=>{
    async function load(){
      try{
        const res = await api.get('/auth/me')
        setUser(res.data.user)
        if(res.data.user.theme) setTheme(res.data.user.theme)
      }catch(e){ /* ignore */ }
    }
    if(token) load()
  },[token])

  function handleLogout(){
    setAuthToken(null)
    setToken(null)
    navigate('/')
  }

  function handleThemeChange(nextTheme){
    setTheme(nextTheme)
  }

  return (
    <div className="app">
      <nav>
        <div className="nav-links">
          <NavLink to="/" end className="nav-link">Characters</NavLink>
          {user && <NavLink to="/games" className="nav-link">Games</NavLink>}
          <NavLink to="/spells" className="nav-link">Spells</NavLink>
          <NavLink to="/about" className="nav-link">About</NavLink>
        </div>
        {' '}
        {user ? (
          <details className="user-menu">
            <summary>
              <span className="user-avatar">{(user.name || user.email)?.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user.name || user.email}</span>
              <span className="user-menu-arrow" aria-hidden="true">&#9662;</span>
            </summary>
            <div className="user-menu-options">
              <Link to="/preferences">Preferences</Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </details>
        ) : (
          <div className="nav-auth">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </div>
        )}
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<CharacterList/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/spells" element={<Spells/>}/>
          <Route path="/characters/:id" element={<Character/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/preferences" element={<Preferences theme={theme} onThemeChange={handleThemeChange}/>}/>
          <Route path="/games" element={<Games user={user}/>}/>
          <Route path="/games/:id" element={<GameTable user={user}/>}/>
          <Route path="/games/:id/settings" element={<GameSettings user={user}/>}/>
          <Route path="/games/:id/players" element={<GamePlayers user={user}/>}/>
        </Routes>
      </main>
    </div>
  )
}
