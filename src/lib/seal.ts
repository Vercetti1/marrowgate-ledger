/**
 * Progressive disclosure without a server.
 *
 * The confession and epilogue live inside the SQLite file, encrypted with a
 * keystream derived from the correct answer. That means the shipped bundle and
 * the shipped database contain no plaintext spoilers: the only way to read the
 * next act is to actually name the right person.
 *
 * This is obfuscation with a real key, not security — the point is that a
 * curious player can't accidentally spoil the puzzle by opening devtools.
 */

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const DOMAIN = 'marrowgate/v1:'

/** Collapses "Cassian  Vole!" and "cassian vole" to the same key. */
export function normalizeAnswer(answer: string): string {
  return answer.toLowerCase().replace(/[^a-z0-9]/g, '')
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer)
  return new Uint8Array(digest)
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Public commitment to an answer, safe to store in the database. */
export async function answerHash(answer: string): Promise<string> {
  return toHex(await sha256(encoder.encode(`${DOMAIN}hash:${normalizeAnswer(answer)}`)))
}

/** SHA-256 in counter mode: enough keystream to cover the payload. */
async function keystream(answer: string, length: number): Promise<Uint8Array> {
  const out = new Uint8Array(length)
  const seed = `${DOMAIN}key:${normalizeAnswer(answer)}:`
  for (let offset = 0, counter = 0; offset < length; offset += 32, counter++) {
    const block = await sha256(encoder.encode(seed + counter))
    out.set(block.subarray(0, Math.min(32, length - offset)), offset)
  }
  return out
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export async function seal(answer: string, plaintext: string): Promise<string> {
  const body = encoder.encode(plaintext)
  const key = await keystream(answer, body.length)
  const sealed = body.map((byte, i) => byte ^ key[i]!)
  return toBase64(sealed)
}

/** Returns null when the answer is wrong or the payload is malformed. */
export async function unseal(answer: string, payload: string): Promise<string | null> {
  try {
    const sealed = fromBase64(payload)
    const key = await keystream(answer, sealed.length)
    return decoder.decode(sealed.map((byte, i) => byte ^ key[i]!))
  } catch {
    return null
  }
}
