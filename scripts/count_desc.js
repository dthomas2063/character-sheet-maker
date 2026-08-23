const fs = require('fs');
const path = 'web/src/data/spells.json';
const s = JSON.parse(fs.readFileSync(path,'utf8'));
const total = s.length;
const withDesc = s.filter(x => x.desc).length;
console.log(`${withDesc}/${total} spells have desc`);
