import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

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
    <div>
      <h1>Characters</h1>
      <form onSubmit={handleCreate} style={{marginBottom:12}}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="className" placeholder="Class" value={form.className} onChange={handleChange} />
        <input name="level" type="number" min="1" value={form.level} onChange={handleChange} style={{width:72}} />
        <button type="submit">Create</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}

      <ul>
        {chars.map(c => (
          <li key={c._id}>
            <Link to={`/characters/${c._id}`}><strong>{c.name}</strong></Link>
            {' '}— Level {c.level} — {c.classes && c.classes.map(x=>x.name).join('/')}
          </li>
        ))}
      </ul>
    </div>
  )
}
