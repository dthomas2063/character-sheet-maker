const url = process.argv[2] || 'https://www.dnd5eapi.co/api/2014/spells/acid-splash'

;(async ()=>{
  try{
    const res = await fetch(url)
    const json = await res.json()
    console.log(Object.keys(json).sort().join('\n'))
    console.log('\nSample fields:')
    for(const k of ['index','name','desc','level','school','document__slug','srd','source']){
      if(k in json) console.log(k+':', JSON.stringify(json[k]).slice(0,200))
    }
  }catch(e){ console.error(e) }
})()
