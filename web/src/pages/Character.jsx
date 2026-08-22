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
            {isEditing ? (
              <div>
                {(form.skillProficiencies||[]).map((s,i)=> (
                  <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
                    <input placeholder="Skill" value={s.name||''} onChange={e=>setForm(f=>{ const arr = [...(f.skillProficiencies||[])]; arr[i]={...(arr[i]||{}), name:e.target.value}; return {...f, skillProficiencies:arr} })} />
                    <select value={s.level||'proficient'} onChange={e=>setForm(f=>{ const arr = [...(f.skillProficiencies||[])]; arr[i]={...(arr[i]||{}), level:e.target.value}; return {...f, skillProficiencies:arr} })}>
                      <option value="none">none</option>
                      <option value="half">half</option>
                      <option value="proficient">proficient</option>
                      <option value="expert">expert</option>
                    </select>
                    <button onClick={()=>setForm(f=>{ const arr = [...(f.skillProficiencies||[])]; arr.splice(i,1); return {...f, skillProficiencies:arr} })}>Remove</button>
                  </div>
                ))}
                <button onClick={()=>setForm(f=>({...f, skillProficiencies:[...(f.skillProficiencies||[]), {name:'', level:'proficient'}]}))}>Add Skill</button>
              </div>
            ) : (
              (char.skillProficiencies && char.skillProficiencies.length) ? (<ul>{char.skillProficiencies.map((s,i)=>(<li key={i}>{s.name} ({s.level})</li>))}</ul>) : <div>—</div>
            )}
          </div>

          <h4 className="section-title">Attacks & Spellcasting</h4>
          <div className="box">
            {isEditing ? (
              <div>
                {(form.attacks||[]).map((a,i)=>(
                  <div key={i} style={{marginBottom:8,borderBottom:'1px solid #eee',paddingBottom:8}}>
                    <input placeholder="Name" value={a.name||''} onChange={e=>setForm(f=>{ const arr=[...(f.attacks||[])]; arr[i]={...(arr[i]||{}), name:e.target.value}; return {...f, attacks:arr} })} />
                    <input placeholder="Attack Bonus" type="number" value={a.attackBonus||''} onChange={e=>setForm(f=>{ const arr=[...(f.attacks||[])]; arr[i]={...(arr[i]||{}), attackBonus: e.target.value ? Number(e.target.value) : undefined}; return {...f, attacks:arr} })} style={{width:100,marginLeft:8}} />
                    <input placeholder="Damage" value={a.damage||''} onChange={e=>setForm(f=>{ const arr=[...(f.attacks||[])]; arr[i]={...(arr[i]||{}), damage:e.target.value}; return {...f, attacks:arr} })} style={{marginLeft:8}} />
                    <input placeholder="Notes" value={a.notes||''} onChange={e=>setForm(f=>{ const arr=[...(f.attacks||[])]; arr[i]={...(arr[i]||{}), notes:e.target.value}; return {...f, attacks:arr} })} style={{marginLeft:8}} />
                    <div><button onClick={()=>setForm(f=>{ const arr=[...(f.attacks||[])]; arr.splice(i,1); return {...f, attacks:arr} })}>Remove</button></div>
                  </div>
                ))}
                <button onClick={()=>setForm(f=>({...f, attacks:[...(f.attacks||[]), {name:'', attackBonus:0, damage:'', notes:''}]}))}>Add Attack</button>
              </div>
            ) : (
              (char.attacks && char.attacks.length) ? (<ul>{char.attacks.map((a,i)=>(<li key={i}>{a.name} {a.attackBonus ? `+${a.attackBonus}` : ''} — {a.damage}</li>))}</ul>) : <div>—</div>
            )}

            <div className="spells" style={{marginTop:12}}>
              {isEditing ? (
                <div>
                  <div><strong>Spellcasting:</strong> <input value={form.spells?.spellcastingAbility||''} onChange={e=>setForm(f=>({...f, spells:{...(f.spells||{}), spellcastingAbility: e.target.value}}))} /></div>
                  <div style={{marginTop:8}}><strong>Spell Slots:</strong>
                    <div>
                      {Object.entries(form.spells?.spellSlots||{}).map(([lvl,val],i)=> (
                        <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
                          <input value={lvl} onChange={e=>{ const slots = {...(form.spells?.spellSlots||{})}; const v = slots[lvl]; delete slots[lvl]; slots[e.target.value]=v; setForm(f=>({...f, spells:{...(f.spells||{}), spellSlots: slots}})) }} />
                          <input type="number" value={val||0} onChange={e=>{ const slots = {...(form.spells?.spellSlots||{})}; slots[lvl]= Number(e.target.value); setForm(f=>({...f, spells:{...(f.spells||{}), spellSlots: slots}})) }} style={{width:80}} />
                          <button onClick={()=>{ const slots = {...(form.spells?.spellSlots||{})}; delete slots[lvl]; setForm(f=>({...f, spells:{...(f.spells||{}), spellSlots: slots}})) }}>Remove</button>
                        </div>
                      ))}
                      <button onClick={()=>{ const slots = {...(form.spells?.spellSlots||{})}; let next='1'; while(next in slots) next = String(Number(next)+1); slots[next]=0; setForm(f=>({...f, spells:{...(f.spells||{}), spellSlots: slots}})) }}>Add Slot Level</button>
                    </div>
                  </div>
                  <div style={{marginTop:8}}><strong>Known:</strong>
                    <div>{(form.spells?.knownSpells||[]).map((s,i)=>(<div key={i} style={{display:'flex',gap:8,alignItems:'center'}}><input value={s||''} onChange={e=>setForm(f=>{ const arr=[...(f.spells?.knownSpells||[])]; arr[i]=e.target.value; return {...f, spells:{...(f.spells||{}), knownSpells:arr}} })} /><button onClick={()=>setForm(f=>{ const arr=[...(f.spells?.knownSpells||[])]; arr.splice(i,1); return {...f, spells:{...(f.spells||{}), knownSpells:arr}} })}>Remove</button></div>))}
                      <button onClick={()=>setForm(f=>({...f, spells:{...(f.spells||{}), knownSpells:[...(f.spells?.knownSpells||[]), '']}}))}>Add Known Spell</button>
                    </div>
                  </div>
                  <div style={{marginTop:8}}><strong>Prepared:</strong>
                    <div>{(form.spells?.preparedSpells||[]).map((s,i)=>(<div key={i} style={{display:'flex',gap:8,alignItems:'center'}}><input value={s||''} onChange={e=>setForm(f=>{ const arr=[...(f.spells?.preparedSpells||[])]; arr[i]=e.target.value; return {...f, spells:{...(f.spells||{}), preparedSpells:arr}} })} /><button onClick={()=>setForm(f=>{ const arr=[...(f.spells?.preparedSpells||[])]; arr.splice(i,1); return {...f, spells:{...(f.spells||{}), preparedSpells:arr}} })}>Remove</button></div>))}
                      <button onClick={()=>setForm(f=>({...f, spells:{...(f.spells||{}), preparedSpells:[...(f.spells?.preparedSpells||[]), '']}}))}>Add Prepared Spell</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div><strong>Spellcasting:</strong> {char.spells?.spellcastingAbility || '—'}</div>
                  <div><strong>Known:</strong> {char.spells?.knownSpells?.join(', ') || '—'}</div>
                </div>
              )}
            </div>
          </div>

          <h4 className="section-title">Equipment</h4>
          <div className="box">
            {isEditing ? (
              <div>
                {(form.equipment||[]).map((e,i)=>(<div key={i} style={{display:'flex',gap:8,alignItems:'center'}}><input value={e||''} onChange={ev=>setForm(f=>{ const arr=[...(f.equipment||[])]; arr[i]=ev.target.value; return {...f, equipment:arr} })} /><button onClick={()=>setForm(f=>{ const arr=[...(f.equipment||[])]; arr.splice(i,1); return {...f, equipment:arr} })}>Remove</button></div>))}
                <button onClick={()=>setForm(f=>({...f, equipment:[...(f.equipment||[]), '']}))}>Add Equipment</button>
              </div>
            ) : (
              <div>{char.equipment?.join(', ') || '—'}</div>
            )}
          </div>
        </div>

        <div className="panel right">
          <h4 className="section-title">Profile</h4>
          <div className="box">
            <div><strong>Languages:</strong> {isEditing ? (<div>{(form.languages||[]).map((l,i)=>(<div key={i} style={{display:'flex',gap:8}}><input value={l||''} onChange={e=>setForm(f=>{ const arr=[...(f.languages||[])]; arr[i]=e.target.value; return {...f, languages:arr} })} /><button onClick={()=>setForm(f=>{ const arr=[...(f.languages||[])]; arr.splice(i,1); return {...f, languages:arr} })}>Remove</button></div>))}<button onClick={()=>setForm(f=>({...f, languages:[...(f.languages||[]), '']}))}>Add</button></div>) : (char.languages?.join(', ') || '—')}</div>
            <div><strong>Proficiencies:</strong> {isEditing ? (<div>{(form.proficiencies||[]).map((p,i)=>(<div key={i} style={{display:'flex',gap:8}}><input value={p||''} onChange={e=>setForm(f=>{ const arr=[...(f.proficiencies||[])]; arr[i]=e.target.value; return {...f, proficiencies:arr} })} /><button onClick={()=>setForm(f=>{ const arr=[...(f.proficiencies||[])]; arr.splice(i,1); return {...f, proficiencies:arr} })}>Remove</button></div>))}<button onClick={()=>setForm(f=>({...f, proficiencies:[...(f.proficiencies||[]), '']}))}>Add</button></div>) : (char.proficiencies?.join(', ') || '—')}</div>
            <div><strong>Speed:</strong> {isEditing ? <input type="number" value={form.speed||0} onChange={e=>setForm(f=>({...f, speed: Number(e.target.value)}))} style={{width:80}} /> : (char.speed || '—')}</div>
            <div><strong>AC:</strong> {isEditing ? <input type="number" value={form.armorClass||10} onChange={e=>setForm(f=>({...f, armorClass: Number(e.target.value)}))} style={{width:80}} /> : (char.armorClass || 10)}</div>
          </div>

          <h4 className="section-title">Personality & Notes</h4>
          <div className="box">
            <div><strong>Traits:</strong> {isEditing ? <textarea value={form.personalityTraits||''} onChange={e=>setForm(f=>({...f, personalityTraits: e.target.value}))} /> : (char.personalityTraits || '—')}</div>
            <div><strong>Ideals:</strong> {isEditing ? <textarea value={form.ideals||''} onChange={e=>setForm(f=>({...f, ideals: e.target.value}))} /> : (char.ideals || '—')}</div>
            <div><strong>Bonds:</strong> {isEditing ? <textarea value={form.bonds||''} onChange={e=>setForm(f=>({...f, bonds: e.target.value}))} /> : (char.bonds || '—')}</div>
            <div><strong>Flaws:</strong> {isEditing ? <textarea value={form.flaws||''} onChange={e=>setForm(f=>({...f, flaws: e.target.value}))} /> : (char.flaws || '—')}</div>
            <div style={{marginTop:8}}><strong>Notes:</strong> {isEditing ? <textarea value={form.notes||''} onChange={e=>setForm(f=>({...f, notes: e.target.value}))} /> : (char.notes || '—')}</div>
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
