import mongoose from 'mongoose'

const Schema = mongoose.Schema

const CharacterSchema = new Schema({
  name: { type: String, required: true },
  player: { type: String },
  race: { type: String },
  subrace: { type: String },
  background: { type: String },
  alignment: { type: String },
  experience: { type: Number, default: 0 },

  // Support multiclass via array of { name, level }
  classes: [
    {
      name: { type: String },
      level: { type: Number, default: 1 }
    }
  ],
  level: { type: Number, default: 1 },

  // Core ability scores (D&D standard)
  abilityScores: {
    str: { type: Number, default: 10 },
    dex: { type: Number, default: 10 },
    con: { type: Number, default: 10 },
    int: { type: Number, default: 10 },
    wis: { type: Number, default: 10 },
    cha: { type: Number, default: 10 }
  },

  proficiencyBonus: { type: Number, default: 2 },
  inspiration: { type: Boolean, default: false },

  hitPoints: {
    max: { type: Number, default: 1 },
    current: { type: Number, default: 1 },
    temporary: { type: Number, default: 0 }
  },

  hitDice: {
    // store as string like "1d8" or as aggregate
    total: { type: String, default: '1d8' },
    used: { type: Number, default: 0 }
  },

  armorClass: { type: Number, default: 10 },
  initiative: { type: Number, default: 0 },
  speed: { type: Number, default: 30 },

  savingThrowProficiencies: [String],

  skillProficiencies: [
    {
      name: { type: String },
      level: { type: String, enum: ['none', 'half', 'proficient', 'expert'], default: 'proficient' }
    }
  ],

  attacks: [
    {
      name: { type: String },
      attackBonus: { type: Number },
      damage: { type: String },
      notes: { type: String }
    }
  ],

  spells: {
    spellcastingAbility: { type: String },
    spellSlots: { type: Map, of: Number, default: {} },
    knownSpells: [String],
    preparedSpells: [String]
  },

  equipment: [String],
  features: [
    {
      name: { type: String },
      description: { type: String }
    }
  ],

  personalityTraits: { type: String },
  ideals: { type: String },
  bonds: { type: String },
  flaws: { type: String },

  languages: [String],
  proficiencies: [String],
  inventory: [String],
  notes: { type: String }
  ,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ,game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', default: null }
}, { timestamps: true })

// Virtuals: ability modifiers and computed level
CharacterSchema.virtual('abilityModifiers').get(function(){
  const s = this.abilityScores || {}
  function mod(val){ return Math.floor(((val || 10) - 10) / 2) }
  return {
    str: mod(s.str),
    dex: mod(s.dex),
    con: mod(s.con),
    int: mod(s.int),
    wis: mod(s.wis),
    cha: mod(s.cha)
  }
})

CharacterSchema.virtual('computedLevel').get(function(){
  if(Array.isArray(this.classes) && this.classes.length){
    return this.classes.reduce((sum, c) => sum + (c.level || 0), 0)
  }
  return this.level || 1
})

// Ensure JSON includes virtuals
CharacterSchema.set('toJSON', { virtuals: true })
CharacterSchema.set('toObject', { virtuals: true })

// Keep `level` consistent with `classes` on save
CharacterSchema.pre('save', function(next){
  try{
    this.level = this.computedLevel
  }catch(e){}
  next()
})

export default mongoose.model('Character', CharacterSchema)
