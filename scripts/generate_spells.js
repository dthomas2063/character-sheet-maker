import fs from 'fs'
import path from 'path'

const API_ROOT = 'https://www.dnd5eapi.co/api'
const outDir = path.resolve('web','src','data')
const outFile = path.join(outDir,'spells.json')

async function fetchJson(url){
  const res = await fetch(url)
  if(!res.ok) throw new Error(`${res.status} ${res.statusText} when fetching ${url}`)
  return res.json()
}

function makeSummary(detail){
  const lvl = detail.level === 0 ? 'Cantrip' : `Level ${detail.level}`
  const school = detail.school?.name || 'Unknown school'
  const casting = detail.casting_time || 'Unknown casting time'
  const rng = detail.range || 'Varies'
  return `${lvl} ${school} spell, casting time ${casting}, range ${rng}.` 
}

async function main(){
  console.log('Fetching spell index...')
  const index = await fetchJson(`${API_ROOT}/spells`)
  const results = index.results || []
  console.log(`Found ${results.length} spells in index`)

  const spells = []
  for(const item of results){
    try{
      // item.url may already be a full or root-relative path
      let detailUrl = null
      if(!item.url) continue
      if(item.url.startsWith('http')) detailUrl = item.url
      else if(item.url.startsWith('/')) detailUrl = `https://www.dnd5eapi.co${item.url}`
      else detailUrl = `${API_ROOT}/${item.url}`

      const detail = await fetchJson(detailUrl)
      const entry = {
        name: detail.name,
        level: detail.level,
        school: detail.school?.name || null,
        casting_time: detail.casting_time || null,
        range: detail.range || null,
        components: detail.components || [],
        material: detail.material || null,
        ritual: detail.ritual || false,
        concentration: detail.concentration || false,
        duration: detail.duration || null,
        classes: (detail.classes || []).map(c=>c.name),
        subclasses: (detail.subclasses || []).map(s=>s.name),
        // Avoid storing long copyrighted description text; include short generated summary
        summary: makeSummary(detail),
        source_url: `https://www.dnd5eapi.co${item.url}`
      }
      spells.push(entry)
      if(spells.length % 50 === 0) console.log(`Fetched ${spells.length} spells...`)
    }catch(err){
      console.error('Failed to fetch', item.url, err.message)
    }
  }

  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(spells, null, 2), 'utf8')
  console.log(`Wrote ${spells.length} spells to ${outFile}`)
}

main().catch(err=>{ console.error(err); process.exit(1) })
