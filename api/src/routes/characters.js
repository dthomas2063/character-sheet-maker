import express from 'express'
import { listCharacters, createCharacter, getCharacter, deleteCharacter, updateCharacter } from '../controllers/characterController.js'

const router = express.Router()

router.get('/', listCharacters)
router.post('/', createCharacter)
router.get('/:id', getCharacter)
router.delete('/:id', deleteCharacter)
router.patch('/:id', updateCharacter)

export default router
