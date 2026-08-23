import crypto from 'crypto'
import Game from '../models/Game.js'
import User from '../models/User.js'
import Character from '../models/Character.js'
import ChatMessage from '../models/ChatMessage.js'
import { rollDice, formatDiceRoll } from '../dice.js'

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
      .populate('members.character', 'name level classes initiative hitPoints')
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
      .populate('members.character', 'name level classes initiative hitPoints')
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

export async function addMonster(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    const name = String(req.body.name || '').trim()
    const initiative = Number(req.body.initiative)
    const maxHp = Number(req.body.maxHp)
    if(!name || !Number.isFinite(initiative) || !Number.isFinite(maxHp) || maxHp < 1) return res.status(400).json({ error: 'Monster name, initiative, and positive max HP are required' })
    game.monsters.push({ name, initiative, maxHp, currentHp: maxHp, hidden: req.body.hidden === true })
    await game.save()
    res.status(201).json(game.monsters[game.monsters.length - 1])
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function adjustMonsterHp(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    const monster = game.monsters.id(req.params.monsterId)
    if(!monster) return notFound(res)
    const amount = Number(req.body.amount)
    const direction = Number(req.body.direction)
    if(!Number.isFinite(amount) || amount < 0 || ![1, -1].includes(direction)) return res.status(400).json({ error: 'Health amount must be positive' })
    monster.currentHp = Math.max(0, Math.min(monster.maxHp, monster.currentHp + amount * direction))
    await game.save()
    req.app.get('io')?.to(`game:${game._id}`).emit('monsterUpdated', {
      monsterId: monster._id,
      currentHp: monster.currentHp,
      maxHp: monster.maxHp,
      dead: monster.dead
    })
    res.json({ currentHp: monster.currentHp, bloodied: monster.currentHp < monster.maxHp / 2 })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function removeMonster(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    const monster = game.monsters.id(req.params.monsterId)
    if(!monster) return notFound(res)
    monster.deleteOne()
    await game.save()
    res.json({ ok: true })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function setMonsterInitiative(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    const monster = game.monsters.id(req.params.monsterId)
    if(!monster) return notFound(res)
    const initiative = Number(req.body.initiative)
    if(!Number.isInteger(initiative)) return res.status(400).json({ error: 'Initiative must be a whole number' })
    monster.initiative = initiative
    await game.save()
    req.app.get('io')?.to(`game:${game._id}`).emit('monsterUpdated', { monsterId: monster._id, initiative: monster.initiative })
    res.json({ initiative: monster.initiative })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function toggleMonsterDead(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    const monster = game.monsters.id(req.params.monsterId)
    if(!monster) return notFound(res)
    const wasDead = monster.dead
    monster.dead = !monster.dead
    await game.save()
    req.app.get('io')?.to(`game:${game._id}`).emit('monsterUpdated', {
      monsterId: monster._id,
      currentHp: monster.currentHp,
      maxHp: monster.maxHp,
      dead: monster.dead
    })
    if(!wasDead && monster.dead){
      const event = await ChatMessage.create({
        game: game._id,
        type: 'event',
        content: `${monster.name} dies.`,
        eventKey: 'monster.dead',
        eventData: { monsterId: monster._id }
      })
      req.app.get('io')?.to(`game:${game._id}`).emit('chatMessage', event.toObject())
    }
    res.json(monster)
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function toggleMonsterHidden(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    const monster = game.monsters.id(req.params.monsterId)
    if(!monster) return notFound(res)
    monster.hidden = !monster.hidden
    await game.save()
    req.app.get('io')?.to(`game:${game._id}`).emit('monsterUpdated', {
      monsterId: monster._id,
      currentHp: monster.currentHp,
      maxHp: monster.maxHp,
      dead: monster.dead,
      hidden: monster.hidden
    })
    res.json(monster)
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function clearCombatTracker(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    game.members.forEach(member => { member.inCombat = false })
    game.monsters.forEach(monster => { monster.inCombat = false })
    await game.save()
    req.app.get('io')?.to(`game:${game._id}`).emit('combatCleared')
    res.json({ ok: true })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function rollPlayerInitiative(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    const member = game.members.find(item => String(item.user) === String(req.userId))
    if(!member) return forbidden(res)
    const character = await Character.findOne({ _id: member.character, owner: req.userId })
    if(!character) return res.status(400).json({ error: 'You need a character in this game' })
    const dexterity = character.abilityScores?.dex ?? 10
    const dexterityModifier = Math.floor((dexterity - 10) / 2)
    const roll = rollDice({ dice: [{ count: 1, sides: 20 }], bonus: dexterityModifier })
    const initiative = roll.total
    character.initiative = initiative
    await character.save()
    member.inCombat = true
    await game.save()
    req.app.get('io')?.to(`game:${game._id}`).emit('initiativeUpdated', {
      userId: req.userId,
      characterId: character._id,
      initiative,
      inCombat: true
    })
    const player = await User.findById(req.userId).select('name email')
    const event = await ChatMessage.create({
      game: game._id,
      sender: req.userId,
      type: 'event',
      content: formatDiceRoll({ roller: player?.name || player?.email || 'A player', label: 'Initiative', roll }),
      eventKey: 'initiative.roll',
      eventData: { ...roll, characterId: character._id }
    })
    req.app.get('io')?.to(`game:${game._id}`).emit('chatMessage', event.toObject())
    res.json({ roll: roll.dice[0].values[0], dexterityModifier, initiative })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function setPlayerInitiative(req, res){
  try{
    const game = await Game.findById(req.params.id)
    if(!game) return notFound(res)
    if(String(game.owner) !== String(req.userId)) return forbidden(res)
    const member = game.members.find(item => String(item.user) === String(req.params.userId))
    if(!member) return notFound(res)
    const initiative = Number(req.body.initiative)
    if(!Number.isInteger(initiative)) return res.status(400).json({ error: 'Initiative must be a whole number' })
    const character = await Character.findById(member.character)
    if(!character) return res.status(400).json({ error: 'Player does not have a character in this game' })
    character.initiative = initiative
    await character.save()
    member.inCombat = true
    await game.save()
    req.app.get('io')?.to(`game:${game._id}`).emit('initiativeUpdated', {
      userId: member.user,
      characterId: character._id,
      initiative,
      inCombat: true
    })
    res.json({ initiative })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}
