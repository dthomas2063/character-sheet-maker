import jwt from 'jsonwebtoken'

export default function auth(req, res, next){
  const header = req.headers.authorization || ''
  const token = header.replace('Bearer ', '')
  if(!token) return res.status(401).json({ error: 'Not authorized' })
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
    req.userId = payload.userId
    next()
  }catch(err){
    res.status(401).json({ error: 'Invalid token' })
  }
}
