import { randomInt } from 'crypto'

const MAX_DICE = 20
const MAX_SIDES = 1000

export function rollDice({ dice, count = 1, sides = 20, bonus = 0 } = {}){
  const groups = Array.isArray(dice) && dice.length ? dice : [{ count, sides }]
  const diceBonus = Number(bonus)
  if(!Number.isInteger(diceBonus) || diceBonus < -1000 || diceBonus > 1000) throw new Error('Bonus must be an integer between -1000 and 1000')
  const rolledDice = groups.map(group => {
    const diceCount = Number(group.count)
    const diceSides = Number(group.sides)
    if(!Number.isInteger(diceCount) || diceCount < 1 || diceCount > MAX_DICE) throw new Error(`Dice count must be between 1 and ${MAX_DICE}`)
    if(!Number.isInteger(diceSides) || diceSides < 2 || diceSides > MAX_SIDES) throw new Error(`Dice sides must be between 2 and ${MAX_SIDES}`)
    const values = Array.from({ length: diceCount }, () => randomInt(1, diceSides + 1))
    return { count: diceCount, sides: diceSides, values, subtotal: values.reduce((sum, value) => sum + value, 0) }
  })
  return { dice: rolledDice, bonus: diceBonus, total: rolledDice.reduce((sum, group) => sum + group.subtotal, diceBonus) }
}

export function formatDiceRoll({ roller, label, roll }){
  const dice = roll.dice.map(group => `${group.count}d${group.sides} [${group.values.join(', ')}]`).join(' + ')
  const bonus = roll.bonus === 0 ? '' : ` ${roll.bonus > 0 ? '+' : '-'} ${Math.abs(roll.bonus)}`
  return `${roller} rolled ${label}: ${dice}${bonus} = ${roll.total}`
}
