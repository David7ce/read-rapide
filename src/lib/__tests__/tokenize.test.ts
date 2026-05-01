import { describe, expect, it } from 'vitest'
import { tokenizeText } from '../tokenize'

describe('tokenizeText', () => {
  it('returns empty array for blank input', () => {
    expect(tokenizeText('   \n \t ')).toEqual([])
  })

  it('normalizes whitespace and splits words', () => {
    const tokens = tokenizeText('Hola   mundo\nesto\tes rapido')
    expect(tokens.map((token) => token.raw)).toEqual(['Hola', 'mundo', 'esto', 'es', 'rapido'])
  })

  it('keeps punctuation attached to words', () => {
    const tokens = tokenizeText('Hola, mundo. Fin!')
    expect(tokens.map((token) => token.raw)).toEqual(['Hola,', 'mundo.', 'Fin!'])
  })
})
