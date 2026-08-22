import React, { useMemo, useState } from 'react'
import spellsData from '../data/spells_wikidot_full.json'
import './spells.css'

function formatSpellLevel(level){
  return level === 0 || level === '0' || level === 'Cantrip' ? 'Cantrip' : `L${level}`
}

function SpellRow({s, onOpen, selected}){
  return (
    <div className={`spell-row${selected ? ' selected' : ''}`} onClick={()=>onOpen(s)}>
      <div className="spell-name">{s.name}{s.ritual ? <span className="ritual-badge"> ritual</span> : null}</div>
      <div className="spell-meta">{formatSpellLevel(s.level)} • {s.school} • {s.duration || '—'}</div>
    </div>
  )
}

export default function Spells({ initialClassFilter = 'all' }){
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [levelFilter, setLevelFilter] = useState('all')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [classFilter, setClassFilter] = useState(initialClassFilter)

  const levels = useMemo(()=>{
    return Array.from(new Set(spellsData.map(s=>s.level).filter(s=>s!=null))).sort((a,b)=>a-b)
  },[])
  const schools = useMemo(()=>{
    return Array.from(new Set(spellsData.map(s=>s.school))).filter(Boolean).sort()
  },[])
  const classes = useMemo(()=>{
    const set = new Set()
    spellsData.forEach(s=> (s.classes||[]).forEach(c=>set.add(c)))
    return Array.from(set).sort()
  },[])

  const spells = useMemo(()=>{
    const term = q.trim().toLowerCase()
    return spellsData.filter(s=>{
      if(levelFilter !== 'all' && s.level !== Number(levelFilter)) return false
      if(schoolFilter !== 'all' && s.school !== schoolFilter) return false
      if(classFilter !== 'all' && !(s.classes||[]).includes(classFilter)) return false
      if(!term) return true
      return s.name.toLowerCase().includes(term)
        || (s.summary || '').toLowerCase().includes(term)
        || (s.school || '').toLowerCase().includes(term)
    })
  }, [q, levelFilter, schoolFilter, classFilter])

  return (
    <div className="spells-page">
      <h1>Spells</h1>
      <div className="spells-controls">
        <input placeholder="Search spells by name, school, or text" value={q} onChange={e=>setQ(e.target.value)} />
        <div className="filters">
          <select value={levelFilter} onChange={e=>setLevelFilter(e.target.value)} className="filter-select">
            <option value="all">All levels</option>
            {levels.map(l=> (<option key={l} value={l}>{l == 'Cantrip'?'Cantrip':'Level ' + l}</option>))}
          </select>
          <select value={schoolFilter} onChange={e=>setSchoolFilter(e.target.value)} className="filter-select">
            <option value="all">All schools</option>
            {schools.map(sch=> (<option key={sch} value={sch}>{sch}</option>))}
          </select>
          <select value={classFilter} onChange={e=>setClassFilter(e.target.value)} className="filter-select">
            <option value="all">All classes</option>
            {classes.map(c=> (<option key={c} value={c}>{c}</option>))}
          </select>
          <button onClick={()=>{ setLevelFilter('all'); setSchoolFilter('all'); setClassFilter('all'); setQ('') }}>Clear</button>
        </div>
        <div className="spells-count">{spells.length} / {spellsData.length}</div>
      </div>

      <div className="spells-grid">
        <div className="spells-list">
          {spells.map(s => (
            <SpellRow key={s.name} s={s} onOpen={setSelected} selected={selected?.name === s.name} />
          ))}
        </div>

        <div className="spells-detail">
          {selected ? (
            <div>
              <h2>{selected.name} <span className="small">({formatSpellLevel(selected.level)} {selected.school})</span></h2>
                <p><strong>Casting:</strong> {selected.casting_time} • <strong>Range:</strong> {selected.range}</p>
                <p><strong>Duration:</strong> {selected.duration || 'Instantaneous'}{selected.ritual ? ' • Ritual' : ''}</p>
                {selected.components && <p><strong>Components:</strong> {selected.components.join(', ')}{selected.material ? ` — ${selected.material}` : ''}</p>}
              {selected.desc ? <div className="spell-desc">{selected.desc.split('\n\n').map((p,i)=>(<p key={i}>{p}</p>))}</div> : <p>No description available.</p>}
            </div>
          ) : (
            <div className="placeholder">Select a spell to view details</div>
          )}
        </div>
      </div>
    </div>
  )
}
