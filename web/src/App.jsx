import React, { useEffect, useRef, useState } from 'react'
import { Routes, Route, Link, NavLink, Navigate, useNavigate } from 'react-router-dom'
import CharacterList from './pages/CharacterList'
import About from './pages/About'
import Spells from './pages/Spells'
import Character from './pages/Character'
import Login from './pages/Login'
import Register from './pages/Register'
import Preferences from './pages/Preferences'
import Games from './pages/Games'
import GameTableView from './pages/GameTableView'
import GameSettings from './pages/GameSettings'
import GamePlayers from './pages/GamePlayers'
import GameSpells from './pages/GameSpells'
import InitiativeDisplay from './pages/InitiativeDisplay'
import api, { setAuthToken } from './api/axios'
import PwaInstallPrompt from './PwaInstallPrompt'

function ProtectedRoute({ token, children }){
  return token ? children : <Navigate to="/login" replace />
}

export default function App(){
  const [token, setToken] = useState(()=>{
    try{ return localStorage.getItem('authToken') }
    catch(e){ return null }
  })
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(()=>{
    try{ return localStorage.getItem('theme') || 'dark' }catch(e){ return 'dark' }
  })
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(()=>{
    function closeMenu(event){
      if(userMenuRef.current && !userMenuRef.current.contains(event.target)) userMenuRef.current.open = false
    }
    document.addEventListener('mousedown', closeMenu)
    return ()=>document.removeEventListener('mousedown', closeMenu)
  }, [])

  useEffect(()=>{
    document.documentElement.dataset.theme = theme
    try{ localStorage.setItem('theme', theme) }catch(e){}
  }, [theme])

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
    if(userMenuRef.current) userMenuRef.current.open = false
    setAuthToken(null)
    setToken(null)
    setUser(null)
    navigate('/')
  }

  function handleLogin(nextToken, nextUser){
    setToken(nextToken)
    setUser(nextUser)
  }

  function closeUserMenu(){
    if(userMenuRef.current) userMenuRef.current.open = false
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
          <details className="user-menu" ref={userMenuRef}>
            <summary>
              <span className="user-avatar">{(user.name || user.email)?.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user.name || user.email}</span>
              <span className="user-menu-arrow" aria-hidden="true">&#9662;</span>
            </summary>
            <div className="user-menu-options">
              <Link to="/preferences" onClick={closeUserMenu}>Preferences</Link>
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
          <Route path="/" element={<ProtectedRoute token={token}><CharacterList/></ProtectedRoute>}/>
          <Route path="/about" element={<ProtectedRoute token={token}><About/></ProtectedRoute>}/>
          <Route path="/spells" element={<ProtectedRoute token={token}><Spells/></ProtectedRoute>}/>
          <Route path="/characters/:id" element={<ProtectedRoute token={token}><Character/></ProtectedRoute>}/>
          <Route path="/login" element={<Login onLogin={handleLogin}/>}/>
          <Route path="/register" element={<Register onLogin={handleLogin}/>}/>
          <Route path="/preferences" element={<ProtectedRoute token={token}><Preferences theme={theme} onThemeChange={handleThemeChange}/></ProtectedRoute>}/>
          <Route path="/games" element={<ProtectedRoute token={token}><Games user={user}/></ProtectedRoute>}/>
          <Route path="/games/:id" element={<ProtectedRoute token={token}><GameTableView user={user}/></ProtectedRoute>}/>
          <Route path="/games/:id/settings" element={<ProtectedRoute token={token}><GameSettings user={user}/></ProtectedRoute>}/>
          <Route path="/games/:id/players" element={<ProtectedRoute token={token}><GamePlayers user={user}/></ProtectedRoute>}/>
          <Route path="/games/:id/spells" element={<ProtectedRoute token={token}><GameSpells/></ProtectedRoute>}/>
          <Route path="/games/:id/initiative-display" element={<ProtectedRoute token={token}><InitiativeDisplay/></ProtectedRoute>}/>
        </Routes>
      </main>
      <PwaInstallPrompt />
    </div>
  )
}
