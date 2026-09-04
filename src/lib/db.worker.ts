/**
 * SQLite lives here, off the main thread.
 *
 * A player is free to write `SELECT * FROM person, person` — seventeen million
 * rows. On the main thread that locks the tab; in a worker the UI stays
 * responsive and the client can terminate this thread to cancel.
 */

import initSqlJs, { type Database } from 'sql.js'
import type { QueryResult, TableSchema, WorkerRequest, WorkerResponse } from './db-protocol'

const post = (message: WorkerResponse) => self.postMessage(message)

let database: Database | null = null

function readSchema(db: Database): TableSchema[] {
  const tables: TableSchema[] = []
  const listing = db.prepare(
    `SELECT name, sql FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
     ORDER BY name`,
  )

  while (listing.step()) {
    const [name, sql] = listing.get() as [string, string]
    const columns = db.exec(`PRAGMA table_info("${name}")`)[0]
    const countRow = db.exec(`SELECT COUNT(*) FROM "${name}"`)[0]
    tables.push({
      name,
      sql: sql ?? '',
      columns: (columns?.values ?? []).map((row) => ({
        name: String(row[1]),
        type: String(row[2] || 'TEXT'),
      })),
      rowCount: Number(countRow?.values[0]?.[0] ?? 0),
    })
  }

  listing.free()
  return tables
}

function runQuery(db: Database, sql: string, maxRows: number): QueryResult {
  const startedAt = performance.now()
  const statement = db.prepare(sql)
  const rows: unknown[][] = []
  let truncated = false

  try {
    while (statement.step()) {
      if (rows.length >= maxRows) {
        truncated = true
        break
      }
      rows.push(statement.get() as unknown[])
    }
    const columns = statement.getColumnNames()
    return {
      columns,
      rows,
      returned: rows.length,
      truncated,
      elapsedMs: performance.now() - startedAt,
    }
  } finally {
    statement.free()
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  if (!database) {
    post({ kind: 'error', id: request.id, message: 'The case file is still loading.' })
    return
  }

  try {
    if (request.kind === 'query') {
      post({ kind: 'result', id: request.id, result: runQuery(database, request.sql, request.maxRows) })
    } else if (request.kind === 'schema') {
      post({ kind: 'schemaResult', id: request.id, schema: readSchema(database) })
    } else {
      database.run(request.sql, request.params as never)
      post({ kind: 'done', id: request.id })
    }
  } catch (error) {
    post({
      kind: 'error',
      id: request.id,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

async function boot(): Promise<void> {
  try {
    const [SQL, response] = await Promise.all([
      initSqlJs({ locateFile: () => `${import.meta.env.BASE_URL}sql-wasm.wasm` }),
      fetch(`${import.meta.env.BASE_URL}marrowgate.db`),
    ])
    if (!response.ok) throw new Error(`could not fetch the case file (HTTP ${response.status})`)
    database = new SQL.Database(new Uint8Array(await response.arrayBuffer()))
    post({ kind: 'ready', schema: readSchema(database) })
  } catch (error) {
    post({ kind: 'fatal', message: error instanceof Error ? error.message : String(error) })
  }
}

void boot()
