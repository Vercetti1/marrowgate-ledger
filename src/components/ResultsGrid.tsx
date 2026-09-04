import type { QueryFailure } from '../game/useCaseFile'
import { MAX_RESULT_ROWS } from '../lib/db'
import type { QueryResult } from '../lib/db-protocol'

interface Props {
  result: QueryResult | null
  error: QueryFailure | null
  running: boolean
}

function Cell({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="italic text-ink-600">NULL</span>
  }
  if (typeof value === 'number') {
    return <span className="tabular-nums text-brass-400/90">{value}</span>
  }
  return <span>{String(value)}</span>
}

export function ResultsGrid({ result, error, running }: Props) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 bg-ink-900/60 px-4 py-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
          Results
        </h2>
        {result && !error ? (
          <span className="text-[11px] text-ink-600">
            {result.returned.toLocaleString()} {result.returned === 1 ? 'row' : 'rows'}
            {result.truncated ? ` (first ${MAX_RESULT_ROWS.toLocaleString()})` : ''} ·{' '}
            {result.elapsedMs.toFixed(1)} ms
          </span>
        ) : null}
        {running ? <span className="text-[11px] text-brass-400">running…</span> : null}
      </header>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        {error ? (
          <div
            className={`m-4 rounded-lg border p-4 ${
              error.kind === 'cancelled'
                ? 'border-white/12 bg-white/[0.02]'
                : 'border-blood-500/35 bg-blood-500/10'
            }`}
          >
            <p
              className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                error.kind === 'cancelled' ? 'text-ink-600' : 'text-blood-500'
              }`}
            >
              {error.kind === 'cancelled' ? 'Cancelled' : 'SQLite error'}
            </p>
            <p className="font-mono text-[13px] leading-relaxed text-ink-200">
              {error.kind === 'cancelled'
                ? 'The database was restarted. Your evidence is intact.'
                : error.message}
            </p>
          </div>
        ) : !result ? (
          <p className="p-6 text-sm text-ink-600">
            Run a query to see what the Constabulary has on file.
          </p>
        ) : result.rows.length === 0 ? (
          <p className="p-6 text-sm text-ink-600">
            No rows. The query is valid — nothing in the case file matches it.
          </p>
        ) : (
          <table className="w-full border-separate border-spacing-0 font-mono text-[12.5px]">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-12 border-b border-white/10 bg-ink-900 px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-ink-600">
                  #
                </th>
                {result.columns.map((column) => (
                  <th
                    key={column}
                    className="border-b border-white/10 bg-ink-900 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-brass-400"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="group">
                  <td className="border-b border-white/5 px-3 py-1.5 text-right align-top text-ink-700 tabular-nums group-hover:bg-white/[0.03]">
                    {rowIndex + 1}
                  </td>
                  {row.map((value, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="max-w-[52ch] border-b border-white/5 px-3 py-1.5 align-top break-words whitespace-pre-wrap group-hover:bg-white/[0.03]"
                    >
                      <Cell value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
