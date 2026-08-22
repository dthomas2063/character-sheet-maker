import jwt from 'jsonwebtoken'
import Game from './models/Game.js'
import ChatMessage from './models/ChatMessage.js'

const gameSockets = new Map()

function roomName(gameId){ return `game:${gameId}` }
function userIdFromRef(value){ return String(value?._id || value) }
function isGameMember(game, userId){
  return userIdFromRef(game.owner) === String(userId) || game.members.some(member => userIdFromRef(member.user) === String(userId))
}

function addSocket(gameId, userId, socket){
  if(!gameSockets.has(gameId)) gameSockets.set(gameId, new Map())
  const users = gameSockets.get(gameId)
  if(!users.has(userId)) users.set(userId, new Set())
  users.get(userId).add(socket)
}

function removeSocket(socket){
  for(const [gameId, users] of gameSockets){
    for(const [userId, sockets] of users){
      sockets.delete(socket)
      if(sockets.size === 0) users.delete(userId)
    }
    if(users.size === 0) gameSockets.delete(gameId)
  }
}

function emitToUser(gameId, userId, event, payload){
  const sockets = gameSockets.get(gameId)?.get(String(userId)) || []
  for(const socket of sockets) socket.emit(event, payload)
}

export function setupSocket(io){
  io.use((socket, next)=>{
    try{
      const token = socket.handshake.auth?.token
      if(!token) return next(new Error('Not authorized'))
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
      socket.userId = String(payload.userId)
      next()
    }catch(err){ next(new Error('Invalid token')) }
  })

  io.on('connection', socket=>{
    socket.joinedGames = new Set()

    socket.on('joinGame', async ({ gameId } = {}, acknowledge = ()=>{})=>{
      try{
        const game = await Game.findById(gameId).select('owner members')
        if(!game || !isGameMember(game, socket.userId)) return acknowledge({ error: 'You are not a member of this game' })
        socket.join(roomName(gameId))
        socket.joinedGames.add(String(gameId))
        addSocket(String(gameId), socket.userId, socket)
        acknowledge({ ok: true })
      }catch(err){ acknowledge({ error: err.message }) }
    })

    socket.on('sendMessage', async ({ gameId, content, recipientId = null } = {}, acknowledge = ()=>{})=>{
      try{
        const normalizedGameId = String(gameId)
        if(!socket.joinedGames.has(normalizedGameId)) return acknowledge({ error: 'Join the game before sending messages' })
        const game = await Game.findById(normalizedGameId).select('owner members')
        if(!game || !isGameMember(game, socket.userId)) return acknowledge({ error: 'You are not a member of this game' })
        const text = String(content || '').trim()
        if(!text) return acknowledge({ error: 'Message cannot be empty' })
        if(text.length > 2000) return acknowledge({ error: 'Message is too long' })

        let recipient = null
        if(recipientId){
          recipient = String(recipientId)
          if(!isGameMember(game, recipient)) return acknowledge({ error: 'That player is not in this game' })
          if(recipient === socket.userId) return acknowledge({ error: 'Choose the table or another player' })
        }

        const message = await ChatMessage.create({ game: normalizedGameId, sender: socket.userId, recipient, content: text, type: 'chat' })
        const payload = await message.populate('sender', 'name email')
        await payload.populate('recipient', 'name email')
        const serialized = payload.toObject()

        if(recipient){
          emitToUser(normalizedGameId, socket.userId, 'chatMessage', serialized)
          emitToUser(normalizedGameId, recipient, 'chatMessage', serialized)
        }else{
          io.to(roomName(normalizedGameId)).emit('chatMessage', serialized)
        }
        acknowledge({ ok: true })
      }catch(err){ acknowledge({ error: err.message }) }
    })

    socket.on('disconnect', ()=>removeSocket(socket))
  })
}

export async function publishGameEvent(io, gameId, { content, eventKey, eventData = null }){
  const message = await ChatMessage.create({ game: gameId, type: 'event', content, eventKey, eventData })
  const payload = await message.toObject()
  io.to(roomName(gameId)).emit('chatMessage', payload)
  return payload
}
