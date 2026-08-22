const fs = require('fs');
const name = process.argv[2];
if(!name){ console.error('Usage: node print_spell_school.js "Spell Name"'); process.exit(1)}
const data = JSON.parse(fs.readFileSync('web/src/data/spells_wikidot_full.json','utf8'))
const s = data.find(x=>x && x.name === name)
if(!s) { console.error('Not found'); process.exit(1)}
console.log(JSON.stringify(s,null,2))
