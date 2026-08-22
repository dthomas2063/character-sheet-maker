import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api, { setAuthToken } from '../api/axios'
import './auth.css'

export default function Login({ onLogin }){
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
      onLogin(token, res.data.user)
      navigate('/')
    }catch(err){
      setError(err.response?.data?.error || err.message || 'Login failed')
    }
  }

  return (
    <div className="auth-page">
      <h1>Login</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        <div><input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-actions">
          <button type="submit">Login</button>
          <Link className="auth-link" to="/register">Register</Link>
        </div>
      </form>
    </div>
  )
}
