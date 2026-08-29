import mongoose from 'mongoose'

const MemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  character: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', default: null },
  inCombat: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false })

const InvitationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  invitedAt: { type: Date, default: Date.now }
}, { _id: false })

const MonsterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  initiative: { type: Number, required: true },
  maxHp: { type: Number, required: true, min: 0, default: 10 },
  currentHp: { type: Number, required: true, min: 0, default: 10 },
  bloodied: { type: Boolean, default: false },
  dead: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  inCombat: { type: Boolean, default: true }
})

const InventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, default: 1, min: 0 },
  notes: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isContainer: { type: Boolean, default: false },
  parentItem: { type: mongoose.Schema.Types.ObjectId, default: null },
  value: {
    amount: { type: Number, default: null, min: 0 },
    denomination: { type: String, enum: ['CP', 'SP', 'GP', 'PP'], default: 'GP' }
  }
}, { timestamps: true })

const GameSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  gameType: { type: String, enum: ['DND 2024', 'Starwars FFG', 'The One Ring'], default: 'DND 2024' },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinCode: { type: String, required: true, unique: true, index: true },
  members: { type: [MemberSchema], default: [] },
  invitations: { type: [InvitationSchema], default: [] },
  monsters: { type: [MonsterSchema], default: [] },
  partyInventory: { type: [InventoryItemSchema], default: [] },
  partyCurrency: {
    pp: { type: Number, default: 0, min: 0 },
    gp: { type: Number, default: 0, min: 0 },
    sp: { type: Number, default: 0, min: 0 },
    cp: { type: Number, default: 0, min: 0 }
  },
  currentTurnKey: { type: String, default: null }
}, { timestamps: true })

export default mongoose.model('Game', GameSchema)
