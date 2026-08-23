function stripTags(html){
  return html.replace(/<br\s*\/?>>?/gi,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
}
function extractContent(html){
  const m = html.match(/<div[^>]+id=["']?page-content["']?[^>]*>([\s\S]*?)<\/div>/i)
  const body = m ? m[1] : html
  const text = stripTags(body)
  return text.replace(/\r\n|\r/g,'\n')
}

async function run(url){
  const res = await fetch(url)
  const html = await res.text()
  const text = extractContent(html)
  const lines = text.split('\n')
  for(let i=0;i<lines.length;i++){
    if(/school/i.test(lines[i]) || /detect magic/i.test(lines[i])){
      console.log('---',i,lines[i])
      for(let j=Math.max(0,i-3); j<=Math.min(lines.length-1,i+3); j++){
        console.log(j+1, lines[j])
      }
      console.log('\n')
    }
  }
}

const url = process.argv[2]
if(!url){ console.error('Usage: node debug_spell.js <url>'); process.exit(1)}
run(url).catch(e=>{console.error(e); process.exit(1)})