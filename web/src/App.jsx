import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Spells from './pages/Spells'
import Character from './pages/Character'

export default function App(){
  return (
    <div className="app">
      <nav>
        <Link to="/">Home</Link> | <Link to="/spells">Spells</Link> | <Link to="/about">About</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/about" element={<About/>}/>
          <Route path="/spells" element={<Spells/>}/>
          <Route path="/characters/:id" element={<Character/>}/>
        </Routes>
      </main>
    </div>
  )
}
