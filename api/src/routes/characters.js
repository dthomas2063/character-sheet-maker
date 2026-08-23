import express from 'express'
import { listCharacters, createCharacter, getCharacter, deleteCharacter, updateCharacter } from '../controllers/characterController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Require auth for character operations — each controller enforces ownership
router.use(auth)

router.get('/', listCharacters)
router.post('/', createCharacter)
router.get('/:id', getCharacter)
router.delete('/:id', deleteCharacter)
router.patch('/:id', updateCharacter)

export default router
