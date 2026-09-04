/** Messages exchanged with the SQLite worker. */

export interface ColumnSchema {
  name: string
  type: string
}

export interface TableSchema {
  name: string
  sql: string
  columns: ColumnSchema[]
  rowCount: number
}

export interface QueryResult {
  columns: string[]
  rows: unknown[][]
  /** Rows actually returned; may be fewer than the query would produce. */
  returned: number
  truncated: boolean
  elapsedMs: number
}

export type WorkerRequest =
  | { kind: 'query'; id: number; sql: string; maxRows: number }
  | { kind: 'exec'; id: number; sql: string; params: unknown[] }
  | { kind: 'schema'; id: number }

export type WorkerResponse =
  | { kind: 'ready'; schema: TableSchema[] }
  | { kind: 'result'; id: number; result: QueryResult }
  | { kind: 'schemaResult'; id: number; schema: TableSchema[] }
  | { kind: 'done'; id: number }
  | { kind: 'error'; id: number; message: string }
  | { kind: 'fatal'; message: string }
