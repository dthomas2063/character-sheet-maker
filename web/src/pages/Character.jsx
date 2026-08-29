import React from 'react'
import { useParams } from 'react-router-dom'
import CharacterSheet from './CharacterSheet'

export default function Character(){
  const { id } = useParams()
  return <CharacterSheet characterId={id} backTo="/" />
}
