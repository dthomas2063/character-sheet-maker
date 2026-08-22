import mongoose from 'mongoose'

const MemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  character: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', default: null },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false })

const InvitationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  invitedAt: { type: Date, default: Date.now }
}, { _id: false })

const GameSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  gameType: { type: String, enum: ['DND 2024', 'Starwars FFG', 'The One Ring'], default: 'DND 2024' },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinCode: { type: String, required: true, unique: true, index: true },
  members: { type: [MemberSchema], default: [] },
  invitations: { type: [InvitationSchema], default: [] }
}, { timestamps: true })

export default mongoose.model('Game', GameSchema)
