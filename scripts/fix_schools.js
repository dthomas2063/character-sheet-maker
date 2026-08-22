import fs from 'fs'
import path from 'path'

const FILE = path.resolve('web/src/data/spells_wikidot_full.json')
const KNOWN_SCHOOLS = ['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation']

function stripTags(html){
  return html.replace(/<br\s*\/?>>?/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
}
function extractContent(html){
  const m = html.match(/<div[^>]+id=["']?page-content["']?[^>]*>([\s\S]*?)<\/div>/i)
  const body = m ? m[1] : html
  const text = stripTags(body)
  return text.replace(/\r\n|\r/g,'\n')
}

function detectSchoolInText(text){
  if(!text) return null
  for(const k of KNOWN_SCHOOLS){
    const re = new RegExp('\\b'+k+'\\b','i')
    if(re.test(text)) return k
  }
  return null
}

async function fetchText(url){
  const res = await fetch(url)
  if(!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`)
  return await res.text()
}

async function run(){
  const data = JSON.parse(fs.readFileSync(FILE,'utf8'))
  const toFix = data.filter(s => !(s && KNOWN_SCHOOLS.includes(s.school)))
  console.log('Total spells:', data.length, 'Needs school fix:', toFix.length)
  for(const s of toFix){
    try{
      const html = await fetchText(s.url)
      const text = extractContent(html)
      const found = detectSchoolInText(text)
      if(found){
        console.log('Fixing', s.name, '->', found)
        s.school = found
      }
    }catch(err){
      console.warn('Failed fetch for', s.name, err.message)
    }
  }
  fs.writeFileSync(FILE, JSON.stringify(data,null,2),'utf8')
  console.log('Wrote', FILE)
}

run().catch(e=>{ console.error(e); process.exit(1) })
