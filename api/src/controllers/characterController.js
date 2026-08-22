import Character from '../models/Character.js'

export async function listCharacters(req, res){
  try{
    const items = await Character.find().sort({createdAt:-1}).limit(100)
    res.json(items)
  }catch(err){
    res.status(500).json({error: err.message})
  }
}

export async function createCharacter(req, res){
  try{
    const doc = new Character(req.body)
    const saved = await doc.save()
    res.status(201).json(saved)
  }catch(err){
    res.status(400).json({error: err.message})
  }
}

export async function getCharacter(req, res){
  try{
    const doc = await Character.findById(req.params.id)
    if(!doc) return res.status(404).json({error:'Not found'})
    res.json(doc)
  }catch(err){
    res.status(400).json({error: err.message})
  }
}

export async function deleteCharacter(req, res){
  try{
    const doc = await Character.findByIdAndDelete(req.params.id)
    if(!doc) return res.status(404).json({error:'Not found'})
    res.json({ok:true})
  }catch(err){
    res.status(400).json({error: err.message})
  }
}

export async function updateCharacter(req, res){
  try{
    const updates = req.body || {}
    const doc = await Character.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
    if(!doc) return res.status(404).json({error:'Not found'})
    res.json(doc)
  }catch(err){
    res.status(400).json({error: err.message})
  }
}
