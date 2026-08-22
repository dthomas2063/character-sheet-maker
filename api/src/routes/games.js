import express from 'express'
import auth from '../middleware/auth.js'
import { listGames, createGame, updateGame, invitePlayer, acceptInvitation, joinWithCode, getGame, listGameMessages } from '../controllers/gameController.js'

const router = express.Router()
router.use(auth)

router.get('/', listGames)
router.post('/', createGame)
router.post('/join', joinWithCode)
router.patch('/:id', updateGame)
router.get('/:id', getGame)
router.get('/:id/messages', listGameMessages)
router.post('/:id/invitations', invitePlayer)
router.post('/:id/accept', acceptInvitation)

export default router
