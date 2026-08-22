import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const signToken = (user) => jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })

export async function register(req, res){
  try{
    const { email, password, name } = req.body
    if(!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const exists = await User.findOne({ email })
    if(exists) return res.status(400).json({ error: 'Email already registered' })
    const user = new User({ email, password, name })
    await user.save()
    const token = signToken(user)
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function login(req, res){
  try{
    const { email, password } = req.body
    if(!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const user = await User.findOne({ email })
    if(!user) return res.status(400).json({ error: 'Invalid credentials' })
    const ok = await user.comparePassword(password)
    if(!ok) return res.status(400).json({ error: 'Invalid credentials' })
    const token = signToken(user)
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function me(req, res){
  try{
    if(!req.userId) return res.status(401).json({ error: 'Not authorized' })
    const user = await User.findById(req.userId).select('-password')
    if(!user) return res.status(404).json({ error: 'Not found' })
    res.json({ user })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}

export async function updatePreferences(req, res){
  try{
    if(!req.userId) return res.status(401).json({ error: 'Not authorized' })
    const { theme } = req.body
    if(!['dark', 'light'].includes(theme)) return res.status(400).json({ error: 'Theme must be dark or light' })
    const user = await User.findByIdAndUpdate(
      req.userId,
      { theme },
      { new: true, runValidators: true }
    ).select('-password')
    if(!user) return res.status(404).json({ error: 'Not found' })
    res.json({ user })
  }catch(err){
    res.status(400).json({ error: err.message })
  }
}
