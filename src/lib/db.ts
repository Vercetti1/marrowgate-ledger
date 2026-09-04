import type { QueryResult, TableSchema, WorkerRequest, WorkerResponse } from './db-protocol'

/** Thrown when the player cancels a query, as distinct from a SQL error. */
export class QueryCancelled extends Error {
  constructor() {
    super('Query cancelled.')
    this.name = 'QueryCancelled'
  }
}

/** Omit that distributes over a union, so each variant keeps its own shape. */
type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never

const MAX_ROWS = 2000

interface Pending {
  resolve: (value: never) => void
  reject: (reason: Error) => void
}

/**
 * Main-thread handle on the case database.
 *
 * Cancellation works by terminating the worker outright — sql.js has no way to
 * interrupt a running statement. Any writes the game has made (the unlocked
 * confession, for instance) are replayed against the fresh worker so that
 * cancelling a slow query never costs the player their progress.
 */
export class CaseDatabase {
  #worker!: Worker
  #pending = new Map<number, Pending>()
  #nextId = 1
  #replay: Array<{ sql: string; params: unknown[] }> = []
  #ready!: Promise<void>

  schema: TableSchema[] = []

  private constructor() {}

  static async open(): Promise<CaseDatabase> {
    const instance = new CaseDatabase()
    await instance.#spawn()
    return instance
  }

  async #spawn(): Promise<void> {
    this.#worker = new Worker(new URL('./db.worker.ts', import.meta.url), { type: 'module' })

    this.#ready = new Promise<void>((resolve, reject) => {
      this.#worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const message = event.data

        if (message.kind === 'ready') {
          this.schema = message.schema
          resolve()
          return
        }
        if (message.kind === 'fatal') {
          reject(new Error(message.message))
          return
        }

        const pending = this.#pending.get(message.id)
        if (!pending) return
        this.#pending.delete(message.id)

        if (message.kind === 'error') pending.reject(new Error(message.message))
        else if (message.kind === 'result') pending.resolve(message.result as never)
        else if (message.kind === 'schemaResult') pending.resolve(message.schema as never)
        else pending.resolve(undefined as never)
      }

      this.#worker.onerror = (event) => {
        const detail = event instanceof ErrorEvent && event.message ? `: ${event.message}` : ''
        reject(new Error(`The database worker failed to start${detail}`))
      }
    })

    await this.#ready
    for (const write of this.#replay) await this.#send({ kind: 'exec', ...write })
  }

  #send<T>(request: WithoutId<WorkerRequest>): Promise<T> {
    const id = this.#nextId++
    return new Promise<T>((resolve, reject) => {
      this.#pending.set(id, { resolve: resolve as (value: never) => void, reject })
      this.#worker.postMessage({ ...request, id } as WorkerRequest)
    })
  }

  query(sql: string): Promise<QueryResult> {
    return this.#send<QueryResult>({ kind: 'query', sql, maxRows: MAX_ROWS })
  }

  /** Persisted for replay, so it survives a cancellation restart. */
  async exec(sql: string, params: unknown[] = []): Promise<void> {
    this.#replay.push({ sql, params })
    await this.#send<void>({ kind: 'exec', sql, params })
  }

  /** Re-reads table and row counts, e.g. after the game inserts evidence. */
  async refreshSchema(): Promise<TableSchema[]> {
    this.schema = await this.#send<TableSchema[]>({ kind: 'schema' })
    return this.schema
  }

  /** Kills the running statement and brings the database back up. */
  async cancel(): Promise<void> {
    this.#worker.terminate()
    for (const pending of this.#pending.values()) {
      pending.reject(new QueryCancelled())
    }
    this.#pending.clear()
    await this.#spawn()
  }
}

export const MAX_RESULT_ROWS = MAX_ROWS
