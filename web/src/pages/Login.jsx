import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api, { setAuthToken } from '../api/axios'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    try{
      const res = await api.post('/auth/login', { email, password })
      const token = res.data.token
      setAuthToken(token)
      navigate('/')
    }catch(err){
      setError(err.response?.data?.error || err.message || 'Login failed')
    }
  }

  return (
    <div style={{padding:12}}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit} style={{maxWidth:420}}>
        <div><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        <div><input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
        {error && <div style={{color:'red'}}>{error}</div>}
        <div style={{marginTop:8}}>
          <button type="submit">Login</button>
          <Link to="/register" style={{marginLeft:8}}>Register</Link>
        </div>
      </form>
    </div>
  )
}
