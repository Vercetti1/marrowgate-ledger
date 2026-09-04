import { useCallback, useEffect, useRef, useState } from 'react'
import { CaseDatabase, QueryCancelled } from '../lib/db'
import type { QueryResult, TableSchema } from '../lib/db-protocol'
import { accuse, loadHints, loadSeals, OPENING_QUERY, type Hint, type Seal, type Stage } from './case'

const PROGRESS_KEY = 'marrowgate.progress.v1'
const DRAFT_KEY = 'marrowgate.draft.v1'

/** Accepted answers, keyed by stage. Enough to restore everything else. */
type Progress = Partial<Record<Stage, string>>

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private windows and blocked site data are fine; progress is a convenience.
  }
}

export interface QueryFailure {
  kind: 'sql' | 'cancelled'
  message: string
}

export interface CaseFile {
  status: 'loading' | 'ready' | 'failed'
  loadError: string | null
  schema: TableSchema[]
  seals: Seal[]
  hints: Hint[]

  sql: string
  setSql: (sql: string) => void
  run: () => void
  cancel: () => void
  running: boolean
  result: QueryResult | null
  queryError: QueryFailure | null

  solved: Progress
  revealed: Partial<Record<Stage, string>>
  submitAccusation: (stage: Stage, guess: string) => Promise<boolean>
  revealedHints: Partial<Record<Stage, number>>
  revealNextHint: (stage: Stage) => void
  reset: () => void
}

export function useCaseFile(): CaseFile {
  const database = useRef<CaseDatabase | null>(null)
  const booted = useRef(false)

  const [status, setStatus] = useState<CaseFile['status']>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [schema, setSchema] = useState<TableSchema[]>([])
  const [seals, setSeals] = useState<Seal[]>([])
  const [hints, setHints] = useState<Hint[]>([])

  const [sql, setSql] = useState(() => readStored(DRAFT_KEY, OPENING_QUERY))
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [queryError, setQueryError] = useState<QueryFailure | null>(null)

  const [solved, setSolved] = useState<Progress>({})
  const [revealed, setRevealed] = useState<Partial<Record<Stage, string>>>({})
  const [revealedHints, setRevealedHints] = useState<Partial<Record<Stage, number>>>({})

  useEffect(() => {
    // React re-runs effects in development; one worker is plenty.
    if (booted.current) return
    booted.current = true

    void (async () => {
      try {
        const db = await CaseDatabase.open()
        database.current = db
        setSchema(db.schema)
        setSeals(await loadSeals(db))
        setHints(await loadHints(db))

        // Replaying the stored answers restores both the unlocked prose and the
        // confession row, without ever persisting a plaintext spoiler.
        const stored = readStored<Progress>(PROGRESS_KEY, {})
        const restored: Partial<Record<Stage, string>> = {}
        const confirmed: Progress = {}
        for (const [stage, answer] of Object.entries(stored) as Array<[Stage, string]>) {
          const outcome = await accuse(db, stage, answer)
          if (outcome.correct && outcome.revealed) {
            confirmed[stage] = answer
            restored[stage] = outcome.revealed
          }
        }
        setSolved(confirmed)
        setRevealed(restored)
        setStatus('ready')
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : String(error))
        setStatus('failed')
      }
    })()
  }, [])

  useEffect(() => {
    writeStored(DRAFT_KEY, sql)
  }, [sql])

  const run = useCallback(() => {
    const db = database.current
    if (!db) return
    const statement = sql.trim().replace(/;\s*$/, '')
    if (!statement) return

    setRunning(true)
    setQueryError(null)
    db.query(statement)
      .then((next) => {
        setResult(next)
        setQueryError(null)
      })
      .catch((error: Error) => {
        setResult(null)
        setQueryError({
          kind: error instanceof QueryCancelled ? 'cancelled' : 'sql',
          message: error.message,
        })
      })
      .finally(() => setRunning(false))
  }, [sql])

  const cancel = useCallback(() => {
    void database.current?.cancel()
  }, [])

  const submitAccusation = useCallback(
    async (stage: Stage, guess: string): Promise<boolean> => {
      const db = database.current
      if (!db) return false
      const outcome = await accuse(db, stage, guess)
      if (!outcome.correct) return false

      setSolved((previous) => {
        const next = { ...previous, [stage]: guess }
        writeStored(PROGRESS_KEY, next)
        return next
      })
      setRevealed((previous) => ({ ...previous, [stage]: outcome.revealed }))
      // The confession is new evidence: surface the row count immediately.
      setSchema(await db.refreshSchema())
      return true
    },
    [],
  )

  const revealNextHint = useCallback((stage: Stage) => {
    setRevealedHints((previous) => ({ ...previous, [stage]: (previous[stage] ?? 0) + 1 }))
  }, [])

  const reset = useCallback(() => {
    writeStored(PROGRESS_KEY, {})
    writeStored(DRAFT_KEY, OPENING_QUERY)
    location.reload()
  }, [])

  return {
    status,
    loadError,
    schema,
    seals,
    hints,
    sql,
    setSql,
    run,
    cancel,
    running,
    result,
    queryError,
    solved,
    revealed,
    submitAccusation,
    revealedHints,
    revealNextHint,
    reset,
  }
}
