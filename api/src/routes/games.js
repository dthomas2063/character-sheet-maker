import express from 'express'
import auth from '../middleware/auth.js'
import { listGames, createGame, updateGame, invitePlayer, acceptInvitation, joinWithCode, getGame, listGameMessages, addMonster, adjustMonsterHp, removeMonster, toggleMonsterDead, toggleMonsterHidden, clearCombatTracker, rollPlayerInitiative } from '../controllers/gameController.js'

const router = express.Router()
router.use(auth)

router.get('/', listGames)
router.post('/', createGame)
router.post('/join', joinWithCode)
router.patch('/:id', updateGame)
router.get('/:id', getGame)
router.get('/:id/messages', listGameMessages)
router.post('/:id/initiative/monsters', addMonster)
router.patch('/:id/initiative/monsters/:monsterId/hp', adjustMonsterHp)
router.delete('/:id/initiative/monsters/:monsterId', removeMonster)
router.patch('/:id/initiative/monsters/:monsterId', toggleMonsterDead)
router.patch('/:id/initiative/monsters/:monsterId/visibility', toggleMonsterHidden)
router.post('/:id/initiative/clear', clearCombatTracker)
router.post('/:id/initiative/roll', rollPlayerInitiative)
router.post('/:id/invitations', invitePlayer)
router.post('/:id/accept', acceptInvitation)

export default router
