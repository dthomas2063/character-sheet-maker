import fs from 'fs'
import path from 'path'

const BASE = 'http://dnd2024.wikidot.com'
const LIST_URL = `${BASE}/spell:all`

async function fetchText(url){
  const res = await fetch(url)
  if(!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`)
  return await res.text()
}

function extractSpellLinks(html){
  const re = /<a[^>]+href="(\/spell:[^"#>]+)"[^>]*>([^<]+)<\/a>/gi
  const seen = new Map()
  let m
  while((m = re.exec(html))){
    const rel = m[1]
    const name = m[2].trim()
    if(!seen.has(rel)) seen.set(rel, name)
  }
  return Array.from(seen.entries()).map(([rel,name])=>({ name, url: BASE + rel }))
}

async function run(){
  console.log('Fetching', LIST_URL)
  const html = await fetchText(LIST_URL)
  const spells = extractSpellLinks(html)
  console.log(`Found ${spells.length} links`) 
  const outPath = path.resolve('web/src/data/spells_wikidot.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(spells, null, 2), 'utf8')
  console.log('Wrote', outPath)
}

run().catch(err=>{ console.error(err); process.exit(1) })
