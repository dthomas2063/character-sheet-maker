import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Character from '../src/models/Character.js'

dotenv.config()
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/character-sheet'

async function run(){
  await mongoose.connect(MONGO_URI, {useNewUrlParser:true, useUnifiedTopology:true})
  console.log('Connected to MongoDB for seeding')

  const samples = [
    {
      name: 'Aelwyn Silverleaf',
      player: 'Alice',
      race: 'Elf',
      subrace: 'High Elf',
      background: 'Sage',
      alignment: 'Neutral Good',
      experience: 2500,
      classes: [{name:'Wizard', level:5}],
      level: 5,
      proficiencyBonus: 3,
      inspiration: false,
      abilityScores: { str:8, dex:14, con:12, int:18, wis:10, cha:13 },
      hitPoints: { max:27, current:27, temporary: 0 },
      hitDice: { total: '5d6', used: 0 },
      armorClass: 12,
      initiative: 2,
      speed: 30,
      savingThrowProficiencies: ['Int', 'Wis'],
      skillProficiencies: [
        { name: 'Arcana', level: 'expert' },
        { name: 'History', level: 'proficient' },
        { name: 'Investigation', level: 'proficient' }
      ],
      attacks: [
        { name: 'Quarterstaff', attackBonus: 0, damage: '1d6 bludgeoning', notes: 'Versatile (1d8)' }
      ],
      spells: {
        spellcastingAbility: 'Int',
        spellSlots: { '1': 4, '2': 3 },
        knownSpells: ['Magic Missile', 'Shield', 'Sleep', 'Mage Armor', 'Detect Magic', 'Fire Bolt'],
        preparedSpells: ['Magic Missile', 'Shield', 'Mage Armor', 'Detect Magic']
      },
      equipment: ['Spellbook', 'Quarterstaff', 'Component Pouch', 'Scholar\'s Pack'],
      features: [
        { name: 'Darkvision', description: 'Can see in dim light within 60 feet as if it were bright light.' },
        { name: 'Fey Ancestry', description: 'Advantage on saving throws against being charmed.' },
        { name: 'Cantrip (High Elf)', description: 'One wizard cantrip from the wizard spell list.' }
      ],
      personalityTraits: 'Curious, driven to collect knowledge',
      ideals: 'Knowledge: The path to power and self-improvement is through knowledge.',
      bonds: 'The library in my hometown saved my life.',
      flaws: 'I can be dismissive of those who lack education.',
      languages: ['Common', 'Elvish', 'Draconic'],
      proficiencies: ['Daggers', 'Quarterstaffs', 'Light Crossbows'],
      inventory: ['Parchment', 'Ink', 'Quill', '10 gp'],
      notes: 'Aelwyn keeps detailed research notes in the spellbook.'
    },
    {
      name: 'Borin Ironfist',
      player: 'Greg',
      race: 'Dwarf',
      subrace: 'Hill Dwarf',
      background: 'Soldier',
      alignment: 'Lawful Neutral',
      experience: 1300,
      classes: [{name:'Fighter', level:3}],
      level: 3,
      proficiencyBonus: 2,
      inspiration: false,
      abilityScores: { str:16, dex:11, con:16, int:10, wis:12, cha:9 },
      hitPoints: { max:30, current:30, temporary: 0 },
      hitDice: { total: '3d10', used: 0 },
      armorClass: 18,
      initiative: 0,
      speed: 25,
      savingThrowProficiencies: ['Str','Con'],
      skillProficiencies: [
        { name: 'Athletics', level: 'proficient' },
        { name: 'Intimidation', level: 'proficient' }
      ],
      attacks: [
        { name: 'Battleaxe', attackBonus: 5, damage: '1d8+3 slashing', notes: 'Versatile 1d10' },
        { name: 'Handaxe', attackBonus: 5, damage: '1d6+3 slashing', notes: '' }
      ],
      spells: { spellcastingAbility: null, spellSlots: {}, knownSpells: [], preparedSpells: [] },
      equipment: ['Battleaxe', 'Shield', 'Chain Mail', 'Explorer\'s Pack'],
      features: [
        { name: 'Second Wind', description: 'Once per short rest you can use a bonus action to regain hit points.' },
        { name: 'Dwarven Resilience', description: 'Advantage on saving throws against poison, resistance to poison damage.' }
      ],
      personalityTraits: 'Gruff, loyal to comrades',
      ideals: 'Duty: I do what I must and obey my orders.',
      bonds: 'I will bring honor to my family name.',
      flaws: 'I have little patience for cowardice.',
      languages: ['Common','Dwarvish'],
      proficiencies: ['All armor', 'Shields', 'Simple and martial weapons'],
      inventory: ['5 gp', 'Rations (5 days)', 'Tinderbox'],
      notes: 'Borin bears the clan tattoo of the Ironfists.'
    }
  ]

  try{
    await Character.deleteMany({})
    const created = await Character.insertMany(samples)
    console.log(`Inserted ${created.length} characters`)
  }catch(err){
    console.error('Seed error', err)
  }finally{
    await mongoose.disconnect()
    console.log('Disconnected')
  }
}

run().catch(err => { console.error(err); process.exit(1) })
