import React, { useState } from 'react'
import api from '../api/axios'

export default function Preferences({ theme, onThemeChange }){
  const [selectedTheme, setSelectedTheme] = useState(theme)
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e){
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try{
      const res = await api.put('/auth/preferences', { theme: selectedTheme })
      onThemeChange(res.data.user.theme)
      setStatus('Preferences saved.')
    }catch(err){
      setStatus(err.response?.data?.error || err.message || 'Could not save preferences.')
    }finally{
      setSaving(false)
    }
  }

  return (
    <section className="preferences-page">
      <h1>Preferences</h1>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Appearance</legend>
          <label>
            <input type="radio" name="theme" value="dark" checked={selectedTheme === 'dark'} onChange={e=>setSelectedTheme(e.target.value)} />
            Dark mode
          </label>
          <label>
            <input type="radio" name="theme" value="light" checked={selectedTheme === 'light'} onChange={e=>setSelectedTheme(e.target.value)} />
            Light mode
          </label>
        </fieldset>
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save preferences'}</button>
        {status && <p role="status">{status}</p>}
      </form>
    </section>
  )
}