export type Token = {
  raw: string
}

const whitespaceRegex = /\s+/g

export function tokenizeText(input: string): Token[] {
  const normalized = input.replace(whitespaceRegex, ' ').trim()

  if (!normalized) {
    return []
  }

  return normalized
    .split(' ')
    .map((word) => ({ raw: word }))
}
