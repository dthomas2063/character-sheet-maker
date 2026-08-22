import mongoose from 'mongoose'

const ChatMessageSchema = new mongoose.Schema({
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, enum: ['chat', 'event'], default: 'chat' },
  content: { type: String, required: true, trim: true },
  eventKey: { type: String, default: null },
  eventData: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true })

export default mongoose.model('ChatMessage', ChatMessageSchema)
