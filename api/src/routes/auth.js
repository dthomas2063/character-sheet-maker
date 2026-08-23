import express from 'express'
import { register, login, me, updatePreferences } from '../controllers/authController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', auth, me)
router.put('/preferences', auth, updatePreferences)

export default router
