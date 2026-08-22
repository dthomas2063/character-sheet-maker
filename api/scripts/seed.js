import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Character from '../src/models/Character.js'
import User from '../src/models/User.js'
import Game from '../src/models/Game.js'

dotenv.config()
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/character-sheet'

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

  const playerSamples = [
    {
      name: 'Mira Thornwood',
      player: 'Morgan',
      race: 'Human',
      background: 'Folk Hero',
      alignment: 'Chaotic Good',
      classes: [{ name: 'Rogue', level: 2 }],
      level: 2,
      proficiencyBonus: 2,
      abilityScores: { str: 10, dex: 16, con: 13, int: 12, wis: 14, cha: 11 },
      hitPoints: { max: 17, current: 17, temporary: 0 },
      hitDice: { total: '2d8', used: 0 },
      armorClass: 14,
      initiative: 3,
      speed: 30,
      attacks: [
        { name: 'Shortsword', attackBonus: 5, damage: '1d6+3 piercing', notes: 'Finesse' },
        { name: 'Shortbow', attackBonus: 5, damage: '1d6+3 piercing', notes: 'Range 80/320' }
      ],
      equipment: ['Shortsword', 'Shortbow', 'Leather Armor', 'Thieves\' Tools'],
      features: [
        { name: 'Sneak Attack', description: 'Deal extra damage once per turn when the attack qualifies.' },
        { name: 'Cunning Action', description: 'Dash, Disengage, or Hide as a bonus action.' }
      ],
      languages: ['Common', 'Halfling'],
      proficiencies: ['Light armor', 'Simple weapons', 'Thieves\' tools'],
      notes: 'Mira knows every back road between the villages.'
    },
    {
      name: 'Pip Emberstone',
      player: 'Morgan',
      race: 'Halfling',
      subrace: 'Lightfoot Halfling',
      background: 'Entertainer',
      alignment: 'Neutral Good',
      classes: [{ name: 'Bard', level: 1 }],
      level: 1,
      proficiencyBonus: 2,
      abilityScores: { str: 8, dex: 14, con: 12, int: 10, wis: 13, cha: 16 },
      hitPoints: { max: 9, current: 9, temporary: 0 },
      hitDice: { total: '1d8', used: 0 },
      armorClass: 13,
      initiative: 2,
      speed: 25,
      spells: {
        spellcastingAbility: 'Cha',
        spellSlots: { '1': 2 },
        knownSpells: ['Healing Word', 'Vicious Mockery'],
        preparedSpells: ['Healing Word', 'Vicious Mockery']
      },
      equipment: ['Rapier', 'Lute', 'Leather Armor', 'Entertainer\'s Pack'],
      features: [
        { name: 'Bardic Inspiration', description: 'Inspire an ally with a bonus action.' },
        { name: 'Brave', description: 'Advantage on saving throws against being frightened.' }
      ],
      languages: ['Common', 'Halfling', 'Elvish'],
      proficiencies: ['Light armor', 'Rapier', 'Musical instruments'],
      notes: 'Pip has a song for every tavern and an entrance for every occasion.'
    }
  ]

  try{
    // ensure demo user exists
    let demo = await User.findOne({ email: 'dev@example.com' })
    if(!demo){
      demo = new User({ email: 'dev@example.com', password: 'password', name: 'Dev' })
      await demo.save()
      console.log('Created demo user: dev@example.com / password')
    }else{
      console.log('Demo user already exists: dev@example.com')
    }

    let player = await User.findOne({ email: 'player@example.com' })
    if(!player){
      player = new User({ email: 'player@example.com', password: 'password', name: 'Morgan' })
      await player.save()
      console.log('Created test player: player@example.com / password')
    }else{
      console.log('Test player already exists: player@example.com')
    }

    await Game.deleteMany({})
    await Character.deleteMany({})
    const demoCharacters = samples.map(s => ({ ...s, owner: demo._id }))
    const playerCharacters = playerSamples.map(s => ({ ...s, owner: player._id }))
    const created = await Character.insertMany([...demoCharacters, ...playerCharacters])
    console.log(`Inserted ${demoCharacters.length} characters for demo and ${playerCharacters.length} for test player`)

    const campaign = await Game.create({
      name: 'The Lost Mine',
      gameType: 'DND 2024',
      description: 'A test campaign for the party invitation flow.',
      owner: demo._id,
      joinCode: 'LOSTMINE',
      members: [
        { user: demo._id, character: created[0]._id },
        { user: player._id, character: created[2]._id }
      ]
    })
    await Character.updateOne({ _id: created[0]._id }, { game: campaign._id })
    await Character.updateOne({ _id: created[2]._id }, { game: campaign._id })
    console.log(`Created DND game "${campaign.name}" with Aelwyn and Mira`)
  }catch(err){
    console.error('Seed error', err)
  }finally{
    await mongoose.disconnect()
    console.log('Disconnected')
  }
}

run().catch(err => { console.error(err); process.exit(1) })
