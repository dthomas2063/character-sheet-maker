async function run(url){
  const res = await fetch(url)
  const html = await res.text()
  function stripTags(html){
    return html.replace(/<br\s*\/?>>?/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
  }
  function extractContent(html){
    const m = html.match(/<div[^>]+id=["']?page-content["']?[^>]*>([\s\S]*?)<\/div>/i)
    const body = m ? m[1] : html
    const text = stripTags(body)
    return text.replace(/\r\n|\r/g,'\n')
  }
  const text = extractContent(html)
  const paras = text.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean)
  function extractField(text,label){ const re = new RegExp(label+'\\s*[:\\-–]\\s*(.+)','i'); const m = text.match(re); if(m) return m[1].split('\n')[0].trim(); return null }
  console.log('--- intro paragraphs ---')
  console.log(paras.slice(0,3))
  console.log('level field:', extractField(text,'Level'))
  console.log('school field:', extractField(text,'School'))
  console.log('casting time:', extractField(text,'Casting Time')||extractField(text,'Cast'))
  // try normalizing
  const KNOWN_SCHOOLS = ['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation']
  function normalizeSchool(s){ if(!s) return null; for(const k of KNOWN_SCHOOLS){ const re = new RegExp('\\b'+k+'\\b','i'); if(re.test(s)) return k } const word = (s||'').trim().replace(/[^A-Za-z]/g,''); if(KNOWN_SCHOOLS.map(x=>x.toLowerCase()).includes(word.toLowerCase())) return KNOWN_SCHOOLS.find(x=>x.toLowerCase()===word.toLowerCase()); return null }
  console.log('normalize intro:', normalizeSchool(paras[0]||''))
  console.log('normalize text:', normalizeSchool(text))
  // find any known schools occurrences
  for(const k of KNOWN_SCHOOLS){ const re = new RegExp('\\b'+k+'\\b','ig'); const m = text.match(re); if(m) console.log('found',k, 'count', m.length) }
}
run(process.argv[2]).catch(e=>{ console.error(e); process.exit(1) })