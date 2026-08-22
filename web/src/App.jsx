import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Spells from './pages/Spells'
import Character from './pages/Character'
import Login from './pages/Login'
import Register from './pages/Register'
import api, { setAuthToken } from './api/axios'

export default function App(){
  const [token, setToken] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    try{ const t = localStorage.getItem('authToken'); if(t) setToken(t) }catch(e){}
  },[])

  function handleLogout(){
    setAuthToken(null)
    setToken(null)
    navigate('/')
  }

  return (
    <div className="app">
      <nav>
        <Link to="/">Home</Link> | <Link to="/spells">Spells</Link> | <Link to="/about">About</Link>
        {' '}
        {token ? (
          <button style={{marginLeft:8}} onClick={handleLogout}>Logout</button>
        ) : (
          <>
            <Link to="/login" style={{marginLeft:8}}>Login</Link>
            <Link to="/register" style={{marginLeft:8}}>Register</Link>
          </>
        )}
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/spells" element={<Spells/>}/>
          <Route path="/characters/:id" element={<Character/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
        </Routes>
      </main>
    </div>
  )
}
