import Character from '../models/Character.js'

function notFound(res){ return res.status(404).json({ error: 'Not found' }) }
function forbidden(res){ return res.status(403).json({ error: 'Forbidden' }) }

export async function listCharacters(req, res){
  try{
    if(!req.userId) return res.status(401).json({ error: 'Unauthorized' })
    const items = await Character.find({ owner: req.userId }).sort({createdAt:-1}).limit(100)
    res.json(items)
  }catch(err){
    res.status(500).json({error: err.message})
  }
}

export async function createCharacter(req, res){
  try{
    const body = { ...req.body }
    if(req.userId) body.owner = req.userId
    const doc = new Character(body)
    const saved = await doc.save()
    res.status(201).json(saved)
  }catch(err){
    res.status(400).json({error: err.message})
  }
}

export async function getCharacter(req, res){
  try{
    const doc = await Character.findById(req.params.id)
    if(!doc) return notFound(res)
    if(doc.owner && (!req.userId || String(doc.owner) !== String(req.userId))) return forbidden(res)
    res.json(doc)
  }catch(err){
    res.status(400).json({error: err.message})
  }
}

export async function deleteCharacter(req, res){
  try{
    const doc = await Character.findById(req.params.id)
    if(!doc) return notFound(res)
    if(!req.userId || String(doc.owner) !== String(req.userId)) return forbidden(res)
    await doc.deleteOne()
    res.json({ok:true})
  }catch(err){
    res.status(400).json({error: err.message})
  }
}

export async function updateCharacter(req, res){
  try{
    const updates = req.body || {}
    const doc = await Character.findById(req.params.id)
    if(!doc) return notFound(res)
    if(!req.userId || String(doc.owner) !== String(req.userId)) return forbidden(res)
    Object.assign(doc, updates)
    await doc.save()
    res.json(doc)
  }catch(err){
    res.status(400).json({error: err.message})
  }
}
