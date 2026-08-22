import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/axios'
import './character.css'

export default function Character(){
  const { id } = useParams()
  const [char, setChar] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(()=>{
    if(!id) return
    setLoading(true)
    api.get(`/characters/${id}`)
      .then(res => setChar(res.data))
      .catch(err => setError(err.response?.data?.error || err.message || 'Failed'))
      .finally(()=> setLoading(false))
  },[id])

  useEffect(()=>{ if(char) setForm(char) }, [char])

  if(loading) return <p>Loading character...</p>
  if(error) return <p style={{color:'red'}}>{error}</p>
  if(!char) return <p>No character found.</p>

  const mods = char.abilityModifiers || {}

  return (
    <div className="sheet print-friendly">
      <div className="sheet-top">
        <div className="left-top">
          <h1 className="char-name">{isEditing ? <input value={form.name||''} onChange={e=>setForm(f=>({...f, name:e.target.value}))} /> : (char.name || 'Unnamed')}</h1>
          <div className="submeta">
            <span>{isEditing ? <input value={form.race||''} onChange={e=>setForm(f=>({...f, race:e.target.value}))} /> : (char.race || '—')}</span>
            <span>{isEditing ? <input value={form.subrace||''} onChange={e=>setForm(f=>({...f, subrace:e.target.value}))} /> : (char.subrace || '')}</span>
            <span>{isEditing ? <input value={form.background||''} onChange={e=>setForm(f=>({...f, background:e.target.value}))} /> : (char.background || '')}</span>
          </div>
          <div className="small-meta">Player: {isEditing ? <input value={form.player||''} onChange={e=>setForm(f=>({...f, player:e.target.value}))} /> : (char.player || '—')} • Alignment: {isEditing ? <input value={form.alignment||''} onChange={e=>setForm(f=>({...f, alignment:e.target.value}))} /> : (char.alignment || '—')}</div>
        </div>

        <div className="right-top">
          <div className="block">
            <div className="label">Level</div>
            <div className="value">{isEditing ? <input type="number" value={form.level||1} onChange={e=>setForm(f=>({...f, level: Number(e.target.value)}))} style={{width:64}} /> : char.level}</div>
          </div>
          <div className="block">
            <div className="label">Class</div>
            <div className="value">{isEditing ? <input value={(form.classes||[]).map(c=>c.name).join(',')} onChange={e=>setForm(f=>({...f, classes:(e.target.value||'').split(',').filter(Boolean).map(name=>({name: name.trim(), level:1}) )}))} /> : (char.classes?.map(c=>c.name).join('/') || '—')}</div>
          </div>
          <div className="block">
            <div className="label">HP</div>
            <div className="value">{isEditing ? <span><input type="number" value={form.hitPoints?.current||0} onChange={e=>setForm(f=>({...f, hitPoints:{...(f.hitPoints||{}), current: Number(e.target.value)}}))} style={{width:64}} /> / <input type="number" value={form.hitPoints?.max||0} onChange={e=>setForm(f=>({...f, hitPoints:{...(f.hitPoints||{}), max: Number(e.target.value)}}))} style={{width:64}} /></span> : `${char.hitPoints?.current}/${char.hitPoints?.max}`}</div>
          </div>
        </div>
      </div>

      <section className="abilities-grid">
        {['str','dex','con','int','wis','cha'].map(key => (
          <div key={key} className="ability big">
            <div className="abbr">{key.toUpperCase()}</div>
            <div className="score">{isEditing ? <input type="number" value={form.abilityScores?.[key] ?? 10} onChange={e=>setForm(f=>({...f, abilityScores:{...(f.abilityScores||{}), [key]: Number(e.target.value)}}))} style={{width:64}} /> : (char.abilityScores?.[key] ?? 10)}</div>
            <div className="mod">{mods[key] >= 0 ? `+${mods[key]}` : mods[key]}</div>
            <div className="label-small">{key === 'str' ? 'Strength' : key === 'dex' ? 'Dexterity' : key === 'con' ? 'Constitution' : key === 'int' ? 'Intelligence' : key === 'wis' ? 'Wisdom' : 'Charisma'}</div>
          </div>
        ))}
      </section>

      <section className="main-panels">
        <div className="panel left">
          <h4 className="section-title">Skills</h4>
          <div className="box">
            {char.skillProficiencies && char.skillProficiencies.length ? (
              <ul>{char.skillProficiencies.map((s,i)=>(<li key={i}>{s.name} ({s.level})</li>))}</ul>
            ) : <div>—</div>}
          </div>

          <h4 className="section-title">Attacks & Spellcasting</h4>
          <div className="box">
            {char.attacks && char.attacks.length ? (
              <ul>{char.attacks.map((a,i)=>(<li key={i}>{a.name} {a.attackBonus ? `+${a.attackBonus}` : ''} — {a.damage}</li>))}</ul>
            ) : <div>—</div>}
            <div className="spells">
              <div><strong>Spellcasting:</strong> {char.spells?.spellcastingAbility || '—'}</div>
              <div><strong>Known:</strong> {char.spells?.knownSpells?.join(', ') || '—'}</div>
            </div>
          </div>

          <h4 className="section-title">Equipment</h4>
          <div className="box">{char.equipment?.join(', ') || '—'}</div>
        </div>

        <div className="panel right">
          <h4 className="section-title">Profile</h4>
          <div className="box">
            <div><strong>Languages:</strong> {char.languages?.join(', ') || '—'}</div>
            <div><strong>Proficiencies:</strong> {char.proficiencies?.join(', ') || '—'}</div>
            <div><strong>Speed:</strong> {char.speed || '—'}</div>
            <div><strong>AC:</strong> {char.armorClass || 10}</div>
          </div>

          <h4 className="section-title">Personality & Notes</h4>
          <div className="box">
            <div><strong>Traits:</strong> {char.personalityTraits || '—'}</div>
            <div><strong>Ideals:</strong> {char.ideals || '—'}</div>
            <div><strong>Bonds:</strong> {char.bonds || '—'}</div>
            <div><strong>Flaws:</strong> {char.flaws || '—'}</div>
          </div>
        </div>
      </section>

      <footer className="sheet-footer">
        <div className="actions">
          {isEditing ? (
            <>
              <button onClick={async ()=>{
                try{
                  setLoading(true)
                  const payload = { ...form }
                  const res = await api.patch(`/characters/${id}`, payload)
                  setChar(res.data)
                  setIsEditing(false)
                }catch(err){
                  setError(err.response?.data?.error || err.message || 'Save failed')
                }finally{ setLoading(false) }
              }}>Save</button>
              <button onClick={()=>{ setForm(char); setIsEditing(false) }}>Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => window.print()}>Print Sheet</button>
              <button onClick={()=>setIsEditing(true)}>Edit</button>
            </>
          )}
          <Link to="/">← Back</Link>
        </div>
      </footer>
    </div>
  )
}
