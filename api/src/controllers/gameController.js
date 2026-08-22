import crypto from 'crypto'
import Game from '../models/Game.js'
import User from '../models/User.js'
import Character from '../models/Character.js'
import ChatMessage from '../models/ChatMessage.js'

const GAME_TYPES = ['DND 2024', 'Starwars FFG', 'The One Ring']

function forbidden(res){ return res.status(403).json({ error: 'Forbidden' }) }
function notFound(res){ return res.status(404).json({ error: 'Not found' }) }
function makeJoinCode(){ return crypto.randomBytes(4).toString('hex').toUpperCase() }
function refId(value){ return value?._id || value }

function canView(game, userId){
  return String(refId(game.owner)) === String(userId) || game.members.some(member => String(refId(member.user)) === String(userId))
}

export async function listGames(req, res){
  try{
    const games = await Game.find({ $or: [{ owner: req.userId }, { 'members.user': req.userId }] })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('members.character', 'name level classes')
      .sort({ createdAt: -1 })
    const invitations = await Game.find({ 'invitations.user': req.userId, 'invitations.status': 'pending' })
      .populate('owner', 'name email')
      .select('name description owner joinCode invitations')
    res.json({ games, invitations })
  }catch(err){
    res.status(500).json({ error: err.message })
  }
}

export async function createGame(req, res){
  try{
    const name = String(req.body.name || '').trim()
    if(!name) return res.status(400).json({ error: 'Game name is required' })
    if(!GAME_TYPES.includes(req.body.gameType)) return res.status(400).json({ error: 'Choose a valid game type' })
    let joinCode = makeJoinCode()
    while(await Game.exists({ joinCode })) joinCode = makeJoinCode()
    const game = await Game.create({
      name,
      gameType: req.body.gameType,
      description: req.body.description || '',
      owner: req.userId,
      joinCode
    })
    res.status(201).json(await game.populate('owner', 'name email'))
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function updateGame(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    if(req.body.gameType !== undefined && !GAME_TYPES.includes(req.body.gameType)) return res.status(400).json({ error: 'Choose a valid game type' })
    if(req.body.name !== undefined) game.name = String(req.body.name).trim()
    if(req.body.description !== undefined) game.description = String(req.body.description)
    if(req.body.gameType !== undefined) game.gameType = req.body.gameType
    await game.save()
    res.json(await game.populate('owner', 'name email'))
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function invitePlayer(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    const email = String(req.body.email || '').trim().toLowerCase()
    if(!email) return res.status(400).json({ error: 'Player email is required' })
    const player = await User.findOne({ email })
    if(!player) return res.status(404).json({ error: 'No registered user found with that email' })
    if(String(player._id) === String(req.userId)) return res.status(400).json({ error: 'The DM is already part of this game' })
    if(game.members.some(member => String(member.user) === String(player._id))) return res.status(400).json({ error: 'Player is already in this game' })
    const existing = game.invitations.find(inv => String(inv.user) === String(player._id))
    if(existing){
      existing.status = 'pending'
      existing.invitedAt = new Date()
    }else{
      game.invitations.push({ user: player._id, email, status: 'pending' })
    }
    await game.save()
    res.status(201).json({ message: `Invitation sent to ${email}` })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

async function joinGame(game, userId, characterId){
  if(game.members.some(member => String(member.user) === String(userId))) return { error: 'You are already in this game' }
  const character = await Character.findOne({ _id: characterId, owner: userId })
  if(!character) return { error: 'Choose a character you own' }
  if(character.game) return { error: 'That character is already part of a game' }
  game.members.push({ user: userId, character: character._id })
  character.game = game._id
  await character.save()
  return { character }
}

export async function acceptInvitation(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    const invitation = game.invitations.find(inv => String(inv.user) === String(req.userId) && inv.status === 'pending')
    if(!invitation) return res.status(404).json({ error: 'Pending invitation not found' })
    const result = await joinGame(game, req.userId, req.body.characterId)
    if(result.error) return res.status(400).json({ error: result.error })
    invitation.status = 'accepted'
    await game.save()
    res.json({ game: await game.populate('members.character', 'name level classes') })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function joinWithCode(req, res){
  try{
    const game = await Game.findOne({ joinCode: String(req.body.joinCode || '').trim().toUpperCase() })
    if(!game) return notFound(res)
    const result = await joinGame(game, req.userId, req.body.characterId)
    if(result.error) return res.status(400).json({ error: result.error })
    await game.save()
    res.json({ game: await game.populate('members.character', 'name level classes') })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function getGame(req, res){
  try{
    const game = await Game.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('members.character', 'name level classes')
    if(!game) return notFound(res)
    if(!canView(game, req.userId)) return forbidden(res)
    res.json(game)
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function listGameMessages(req, res){
  try{
    const game = await Game.findById(req.params.id).select('owner members')
    if(!game) return notFound(res)
    if(!canView(game, req.userId)) return forbidden(res)
    const messages = await ChatMessage.find({
      game: game._id,
      $or: [
        { recipient: null },
        { sender: req.userId },
        { recipient: req.userId }
      ]
    }).populate('sender', 'name email').populate('recipient', 'name email').sort({ createdAt: 1 }).limit(200)
    res.json(messages)
  }catch(err){
    res.status(500).json({ error: err.message })
  }
}
