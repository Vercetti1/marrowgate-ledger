import type { CaseDatabase } from '../lib/db'
import { answerHash, unseal } from '../lib/seal'

export type Stage = 'killer' | 'mastermind'

export const STAGES: readonly Stage[] = ['killer', 'mastermind']

export interface Seal {
  stage: Stage
  prompt: string
  answerHash: string
}

export interface Hint {
  stage: Stage
  ordinal: number
  text: string
}

/**
 * The briefing is the one piece of the case that is *meant* to be free: it names
 * the crime, the date and the district so the player knows where to start. Every
 * other fact has to be dug out of the database.
 */
export const BRIEFING = {
  crime: 'murder',
  date: '2025-11-14',
  district: 'Old Harbour',
  city: 'Marrowgate',
  lines: [
    'A body was pulled out from under Pier 9 in the Old Harbour district of Marrowgate on the morning of 14 November 2025.',
    'The Constabulary has given you the case file: the whole city, as a database, and nothing else.',
    'Everything you need is in there. Start with the crime scene report.',
  ],
} as const

export const OPENING_QUERY = `-- Marrowgate Constabulary · case file 1114-OH
-- Find the report for the murder. You know the date and the district.

SELECT *
FROM crime_scene_report
LIMIT 20;`

export async function loadSeals(db: CaseDatabase): Promise<Seal[]> {
  const { rows } = await db.query('SELECT stage, prompt, answer_hash FROM case_seal')
  return rows.map(([stage, prompt, hash]) => ({
    stage: stage as Stage,
    prompt: String(prompt),
    answerHash: String(hash),
  }))
}

export async function loadHints(db: CaseDatabase): Promise<Hint[]> {
  const { rows } = await db.query('SELECT stage, ordinal, text FROM hint ORDER BY stage, ordinal')
  return rows.map(([stage, ordinal, text]) => ({
    stage: stage as Stage,
    ordinal: Number(ordinal),
    text: String(text),
  }))
}

export interface AccusationResult {
  correct: boolean
  /** Present only on a correct accusation. */
  revealed?: string
}

/**
 * Checks a name against the sealed answer.
 *
 * Nothing here compares against a plaintext name — the database only holds a
 * hash. A correct guess also derives the key that decrypts the next act, and for
 * Act I the decrypted confession is inserted into the `confession` table so the
 * player can go on querying it like any other evidence.
 */
export async function accuse(
  db: CaseDatabase,
  stage: Stage,
  guess: string,
): Promise<AccusationResult> {
  const { rows } = await db.query(
    `SELECT answer_hash, payload FROM case_seal WHERE stage = '${stage}'`,
  )
  const row = rows[0]
  if (!row) throw new Error(`No sealed answer for stage "${stage}".`)

  const [expectedHash, payload] = [String(row[0]), String(row[1])]
  if ((await answerHash(guess)) !== expectedHash) return { correct: false }

  const plaintext = await unseal(guess, payload)
  if (!plaintext) throw new Error('The seal is damaged, could not read the next act.')

  const { personId, transcript } = JSON.parse(plaintext) as {
    personId: number
    transcript: string
  }

  if (stage === 'killer') {
    const { rows: existing } = await db.query(
      `SELECT COUNT(*) FROM confession WHERE person_id = ${personId}`,
    )
    if (Number(existing[0]?.[0] ?? 0) === 0) {
      await db.exec('INSERT INTO confession (person_id, transcript) VALUES (?, ?)', [
        personId,
        transcript,
      ])
    }
  }

  return { correct: true, revealed: transcript }
}
