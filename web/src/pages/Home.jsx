import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import './home.css'

export default function Home(){
  const [chars, setChars] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({name:'', className:'', level:1})

  function fetchChars(){
    setLoading(true)
    api.get('/characters')
      .then(res => setChars(res.data))
      .catch(err => setError(err.message || 'Request failed'))
      .finally(()=> setLoading(false))
  }

  useEffect(()=>{ fetchChars() }, [])

  function handleChange(e){
    const {name, value} = e.target
    setForm(f=>({ ...f, [name]: value }))
  }

  function handleCreate(e){
    e.preventDefault()
    const payload = {
      name: form.name,
      classes: [{ name: form.className || 'Adventurer', level: Number(form.level) || 1 }]
    }
    api.post('/characters', payload)
      .then(()=>{
        setForm({name:'', className:'', level:1})
        fetchChars()
      })
      .catch(err => setError(err.message || 'Create failed'))
  }

  return (
    <div className="home-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Character vault</p>
          <h1>Characters</h1>
          <p className="page-intro">Build, browse, and refine your adventurers.</p>
        </div>
        <span className="character-count">{chars.length} {chars.length === 1 ? 'character' : 'characters'}</span>
      </div>

      <form className="character-form" onSubmit={handleCreate}>
        <div className="form-heading">
          <h2>New character</h2>
          <span>Start with the essentials</span>
        </div>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="className" placeholder="Class" value={form.className} onChange={handleChange} />
        <input name="level" type="number" min="1" value={form.level} onChange={handleChange} aria-label="Level" />
        <button type="submit">Create character</button>
      </form>

      {loading && <p className="list-message">Loading characters...</p>}
      {error && <p className="list-message error-message">{error}</p>}

      {!loading && !error && chars.length === 0 && <p className="list-message">No characters yet. Create your first adventurer above.</p>}

      <ul className="character-list">
        {chars.map(c => (
          <li key={c._id}>
            <Link className="character-card" to={`/characters/${c._id}`}>
              <span className="character-avatar">{c.name?.charAt(0).toUpperCase()}</span>
              <span className="character-summary">
                <strong>{c.name}</strong>
                <span>{c.classes && c.classes.map(x=>x.name).join(' / ')}</span>
              </span>
              <span className="character-level">Level {c.level}</span>
              <span className="card-arrow" aria-hidden="true">-&gt;</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
