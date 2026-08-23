import fs from 'fs'
import path from 'path'

const spellsFile = path.resolve('web','src','data','spells.json')

async function fetchJson(url){
  const res = await fetch(url)
  if(!res.ok) throw new Error(`${res.status} ${res.statusText} when fetching ${url}`)
  return res.json()
}

function looksLikeSRD(detail){
  if(!detail) return false
  if(detail.srd === true) return true
  if(detail.document__slug && detail.document__slug.toLowerCase().includes('srd')) return true
  if(detail._id && String(detail._id).toLowerCase().includes('srd')) return true
  // fallback: many SRD spells appear in module named 'dnd-5e-srd' in some datasets
  if(detail.source && String(detail.source).toLowerCase().includes('srd')) return true
  return false
}

async function main(){
  if(!fs.existsSync(spellsFile)){
    console.error('spells.json not found at', spellsFile)
    process.exit(1)
  }
  const raw = fs.readFileSync(spellsFile, 'utf8')
  const spells = JSON.parse(raw)
  console.log(`Loaded ${spells.length} spells`)

  let updated = 0
  for(const sp of spells){
    if(!sp.source_url) continue
    try{
      const detail = await fetchJson(sp.source_url)
      if(detail && detail.desc){
        sp.desc = Array.isArray(detail.desc) ? detail.desc.join('\n\n') : detail.desc
        updated++
      }
    }catch(err){
      console.warn('Failed to fetch detail for', sp.name, err.message)
    }
  }

  fs.writeFileSync(spellsFile, JSON.stringify(spells, null, 2), 'utf8')
  console.log(`Done. Added descriptions to ${updated} spells (SRD).`)
}

main().catch(err=>{ console.error(err); process.exit(1) })
