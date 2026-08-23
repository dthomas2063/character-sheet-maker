import express from 'express'
import { createServer } from 'http'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import morgan from 'morgan'
import cors from 'cors'
import characterRoutes from './routes/characters.js'
import authRoutes from './routes/auth.js'
import gameRoutes from './routes/games.js'
import { Server } from 'socket.io'
import { setupSocket } from './socket.js'

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, { cors: { origin: true, credentials: true } })
setupSocket(io)
app.set('io', io)
const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/character-sheet'

app.use(morgan('dev'))
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.json({ok: true, message: 'Character Sheet API'}))
app.use('/auth', authRoutes)
app.use('/characters', characterRoutes)
app.use('/games', gameRoutes)

app.get('/example', (req, res) => {
  res.json({message: 'This is an example response from the API'})
})

mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(()=>{
    console.log('Connected to MongoDB')
    server.listen(PORT, ()=> console.log(`API running on http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('Mongo connection error:', err.message)
    process.exit(1)
  })
