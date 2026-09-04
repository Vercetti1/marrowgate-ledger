import { describe, expect, it } from 'vitest'
import { answerHash, normalizeAnswer, seal, unseal } from './seal'

describe('normalizeAnswer', () => {
  it('ignores case, spacing and punctuation', () => {
    expect(normalizeAnswer('Cassian Vole')).toBe('cassianvole')
    expect(normalizeAnswer('  cassian   vole!  ')).toBe('cassianvole')
    expect(normalizeAnswer("O'Brien-Smith")).toBe('obriensmith')
  })
})

describe('answerHash', () => {
  it('is stable for equivalent spellings', async () => {
    expect(await answerHash('Cassian Vole')).toBe(await answerHash('  CASSIAN vole '))
  })

  it('differs for different answers', async () => {
    expect(await answerHash('Cassian Vole')).not.toBe(await answerHash('Perpetua Falk'))
  })

  it('does not leak the answer', async () => {
    const hash = await answerHash('Cassian Vole')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain('cassian')
  })
})

describe('seal / unseal', () => {
  const secret = 'She never gave a name — only that she sat in the front row, all four nights.'

  it('round-trips with the right answer', async () => {
    const payload = await seal('Cassian Vole', secret)
    expect(await unseal('cassian vole', payload)).toBe(secret)
  })

  it('does not store the plaintext', async () => {
    const payload = await seal('Cassian Vole', secret)
    expect(payload).not.toContain('front row')
    expect(atob(payload)).not.toContain('front row')
  })

  it('returns garbage rather than the secret for a wrong answer', async () => {
    const payload = await seal('Cassian Vole', secret)
    expect(await unseal('Perpetua Falk', payload)).not.toBe(secret)
  })

  it('survives multi-byte characters and payloads longer than one hash block', async () => {
    const long = `${'—Ada Ọláńrewájú— '.repeat(40)}end`
    const payload = await seal('key', long)
    expect(await unseal('key', payload)).toBe(long)
  })

  it('returns null for a malformed payload', async () => {
    expect(await unseal('key', 'not base64 !!!')).toBeNull()
  })
})
