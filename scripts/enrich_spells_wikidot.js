import fs from 'fs'
import path from 'path'

const LIST_PATH = path.resolve('web/src/data/spells_wikidot.json')
const OUT_PATH = path.resolve('web/src/data/spells_wikidot_full.json')
const CONCURRENCY = 8

function stripTags(html){
  return html.replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
}

function extractContent(html){
  const m = html.match(/<div[^>]+id=["']?page-content["']?[^>]*>([\s\S]*?)<\/div>/i)
  const body = m ? m[1] : html
  const text = stripTags(body)
  return text.replace(/\r\n|\r/g,'\n')
}

function extractField(text, label){  
  const re = new RegExp(label + '\\s*[:\-–]\\s*(.+)', 'i')
  const m = text.match(re)
  if(m) return m[1].split('\n')[0].trim()
  return null
}

function extractActualDescription(text){
  let index = text.indexOf('Duration');

  if (index == -1) return null

  let result = text.substring(index);
  const allLines = result.split('\n')
  allLines.shift()
  return allLines.join('\n').trim()
}

function extractDescription(text){
  // take text up to 'At Higher Levels' or 'At higher levels' or 'Higher Level' or until double newline > 2 paragraphs
  const markers = [/At Higher Levels/i, /At higher levels/i, /At Higher Level/i]
  let idx = Infinity
  for(const r of markers){ const m = text.search(r); if(m>=0 && m<idx) idx = m }
  const snippet = idx===Infinity ? text : text.slice(0, idx)
  // take first 3 paragraphs
  const paras = snippet.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean)
  return paras.slice(0,3).join('\n\n')
}

function parseIntroParagraphs(text){
  const paras = text.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean)
  return paras
}

function splitTopLevelCommas(s){
  const parts = []
  let cur = ''
  let depth = 0
  for(let i=0;i<s.length;i++){
    const ch = s[i]
    if(ch === '('){ depth++; cur += ch }
    else if(ch === ')'){ if(depth>0) depth--; cur += ch }
    else if(ch === ',' && depth === 0){ parts.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  if(cur.trim()) parts.push(cur.trim())
  return parts
}

async function fetchText(url){
  const res = await fetch(url)
  if(!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`)
  return await res.text()
}

async function enrich(){
  if(!fs.existsSync(LIST_PATH)) throw new Error('spells_wikidot.json not found; run generate_spells_wikidot.js first')
  const list = JSON.parse(fs.readFileSync(LIST_PATH,'utf8'))
  console.log('Enriching', list.length, 'spells')

  const out = []
  let i = 0
  async function worker(){
    while(i < list.length){
      const idx = i++
      const item = list[idx]
      try{
        const html = await fetchText(item.url)
        const text = extractContent(html)
        const desc = extractDescription(text)
        const actDesc = extractActualDescription(text)
        const paras = parseIntroParagraphs(text)
        // debug logging removed
        // debug logging removed
        // basic pulls from labelled fields
        let level = extractField(text, 'Level') || extractField(text, 'Spell Level') || null
        let school = extractField(text, 'School') || null
        // Try to extract numeric level and school from the intro (examples: "Level 1 Abjuration (Artificer, Ranger, Wizard)" or "1st-level Abjuration")
        const intro = (paras[0] || paras[1] || '')
        const mLevelA = intro.match(/\bLevel\s+(\d+)\b\s*([A-Za-z]+)/i)
        const mLevelB = intro.match(/(\d+)(?:st|nd|rd|th)[-\s]*level\s+([A-Za-z]+)/i)
        const mLevelC = intro.match(/([A-Za-z]+)\s+(\d+)(?:st|nd|rd|th)[-\s]*level/i)
        if(mLevelA){ level = parseInt(mLevelA[1],10); school = school || mLevelA[2] }
        else if(mLevelB){ level = parseInt(mLevelB[1],10); school = school || mLevelB[2] }
        else if(mLevelC){ level = parseInt(mLevelC[2],10); school = school || mLevelC[1] }

        // Normalize school: prefer known school names, otherwise try to detect from intro/description
        const KNOWN_SCHOOLS = ['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation']
        function normalizeSchool(s){
          if(!s) return null
          for(const k of KNOWN_SCHOOLS){
            const re = new RegExp('\\b'+k+'\\b','i')
            if(re.test(s)) return k
          }
          // also accept single-word school-like values
          const word = (s||'').trim().replace(/[^A-Za-z]/g,'')
          if(KNOWN_SCHOOLS.map(x=>x.toLowerCase()).includes(word.toLowerCase())) return KNOWN_SCHOOLS.find(x=>x.toLowerCase()===word.toLowerCase())
          return null
        }
        school = normalizeSchool(school) || normalizeSchool(intro) || (desc ? normalizeSchool(desc) : null) || normalizeSchool(text)
        const casting_time = extractField(text, 'Casting Time') || extractField(text, 'Cast') || null
        // build a map of labeled lines like "Range: 30 feet" for robustness (whitelist expected labels)
        const labelMap = {}
        const keyMap = {
          'range':'range', 'components':'components', 'material':'material', 'ritual':'ritual', 'concentration':'concentration', 'duration':'duration', 'casting time':'casting_time', 'cast':'casting_time', 'classes':'classes', 'available to':'classes', 'level':'level', 'school':'school'
        }
        for(const line of text.split('\n')){
          const m = line.match(/^([A-Za-z][A-Za-z \-]+)\s*[:\-–]\s*(.+)$/)
          if(!m) continue
          const rawKey = m[1].trim().toLowerCase()
          if(keyMap[rawKey]){
            const k = keyMap[rawKey]
            if(!labelMap[k]) labelMap[k] = m[2].trim()
          }
        }
        const range = labelMap['range'] || extractField(text, 'Range') || null
        const componentsLabel = labelMap['components'] || extractField(text, 'Components') || null
        let material = labelMap['material'] || extractField(text, 'Material') || null
        // determine ritual and concentration from explicit labels or from context (duration/intro)
        let ritual = (labelMap['ritual'] || extractField(text, 'Ritual') || '').toLowerCase().startsWith('y') ? true : false
        let concentration = (labelMap['concentration'] || extractField(text, 'Concentration') || '').toLowerCase().startsWith('y') ? true : false
        // if duration mentions 'Concentration', honor that
        const durationLabel = labelMap['duration'] || extractField(text, 'Duration') || ''
        if(!concentration && /concentration/i.test(durationLabel)) concentration = true
        // detect ritual when intro or nearby text includes (ritual) or 'ritual' marker
        const introText = (paras[0] || paras[1] || '')
        if(!ritual && /\(\s*ritual\s*\)/i.test(introText)) ritual = true
        if(!ritual && /\britual\b/i.test(durationLabel)) ritual = true
        if(!ritual && casting_time && /\britual\b/i.test(casting_time)) ritual = true
        const duration = labelMap['duration'] || extractField(text, 'Duration') || null
        let classesRaw = labelMap['classes'] || extractField(text, 'Classes') || extractField(text, 'Available to') || null
        function parseClassList(s){
          return s.split(/[,\/;]|\band\b/i).map(x=>x.trim()).filter(Boolean)
        }
        let classes = null
        if(classesRaw){
          classes = parseClassList(classesRaw)
        }
        // Try to extract classes from intro parenthetical like "Evocation 1 (Bard, Wizard)"
        if(!classes || classes.length === 0){
          const intro = (paras[0] || paras[1] || '')
          const paren = intro.match(/\(([^)]+)\)/)
          if(paren && paren[1]){
            const cand = paren[1].trim()
            // crude check: parentheses content that's not too long probably lists classes
            if(cand.length < 120 && /[A-Z]/.test(cand)){
              classes = parseClassList(cand)
            }
          }
        }

        // Heuristic: pages often have an intro like "Evocation Cantrip (Artificer, Sorcerer, Wizard)"
        if(paras.length > 1){
          const m = paras[1].match(/^(\w+)\s+Cantrip(?:s)?\s*(?:\(([^)]+)\))?/i)
          if(m){
            school = school || m[1]
            level = 'Cantrip'
            classes = classes || (m[2] ? m[2].split(',').map(s=>s.trim()).filter(Boolean) : null)
          }
        }

        // Force cantrip level when the description or intro mentions 'Cantrip'
        if(/\bcantrip\b/i.test(desc) || (paras[1] && /\bcantrip\b/i.test(paras[1]))){
          level = 'Cantrip'
        }

        // If the description's first lines contain "Evocation Cantrip (...)", extract school and classes
        const mdesc = desc.match(/^(?:Source:\s*.*\n)?([A-Za-z]+)\s+Cantrip\s*(?:\(([^)]+)\))?/i)
        if(mdesc){
          school = school || mdesc[1]
          classes = classes || (mdesc[2] ? mdesc[2].split(',').map(s=>s.trim()).filter(Boolean) : null)
        }

        // Extract cantrip upgrade info if present
        let cantrip_upgrade = null
        const up = text.match(/Cantrip Upgrade\.([\s\S]*?)(?:\n\n|$)/i)
        if(up) cantrip_upgrade = up[1].trim().replace(/\n/g,' ')
        // normalize components into array when possible and extract material from "M ( ... )" if present
        const componentsRaw = componentsLabel || null
        let components = null
        if(componentsRaw){
          const parts = splitTopLevelCommas(componentsRaw)
          components = parts.map(p=>{
            const m = p.match(/^M\b(?:\s*\((.+)\))?$/i)
            if(m){
              // prefer explicit material label when available, otherwise use parenthetical
              if(!material && m[1]) material = m[1].trim()
              return 'M'
            }
            return p
          })
        }

        
        out.push({ name: item.name, url: item.url, level, school, casting_time, range, components, material, ritual, concentration, duration, classes, cantrip_upgrade, desc: actDesc })
        if((idx+1) % 25 === 0) console.log('Processed', idx+1)
      }catch(err){
        console.warn('Failed', item.url, err.message)
        out.push({ name: item.name, url: item.url, error: err.message })
      }
    }
  }

  const workers = Array.from({length: CONCURRENCY}, ()=>worker())
  await Promise.all(workers)

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8')
  console.log('Wrote', OUT_PATH)
}

enrich().catch(err=>{ console.error(err); process.exit(1) })
