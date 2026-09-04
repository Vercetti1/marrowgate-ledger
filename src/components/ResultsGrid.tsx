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
    return <span className="text-ink-700 select-none">—</span>
  }
  if (typeof value === 'number') {
    return <span className="tabular-nums text-brass-300">{value.toLocaleString()}</span>
  }
  const text = String(value)
  // Transcripts and reports are paragraphs, not values; give them room to read.
  const isProse = text.length > 90
  return <span className={isProse ? 'text-ink-300' : 'text-ink-100'}>{text}</span>
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <p className="font-display text-lg text-ink-500 italic">{title}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-600">{body}</p>
      </div>
    </div>
  )
}

export function ResultsGrid({ result, error, running }: Props) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-ink-850 bg-ink-950">
      <header className="flex shrink-0 items-center gap-3 px-5 py-2.5">
        <h2 className="font-mono text-[10px] font-medium tracking-[0.22em] text-ink-600 uppercase">
          Results
        </h2>

        {running ? (
          <span className="flex items-center gap-2 font-mono text-[11px] text-brass-400">
            <span className="size-1.5 animate-pulse rounded-full bg-brass-400" />
            searching
          </span>
        ) : result && !error ? (
          <span className="font-mono text-[11px] text-ink-600">
            <span className="text-ink-300 tabular-nums">{result.returned.toLocaleString()}</span>{' '}
            {result.returned === 1 ? 'row' : 'rows'}
            {result.truncated ? (
              <span className="text-brass-600"> · capped at {MAX_RESULT_ROWS.toLocaleString()}</span>
            ) : null}
            <span className="mx-1.5 text-ink-800">|</span>
            <span className="tabular-nums">{result.elapsedMs.toFixed(1)}</span> ms
          </span>
        ) : null}
      </header>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto border-t border-ink-900">
        {error ? (
          <div className="p-5">
            <div
              className={`rounded-lg border p-4 ${
                error.kind === 'cancelled'
                  ? 'border-ink-800 bg-ink-900/60'
                  : 'border-stamp-500/40 bg-stamp-500/8'
              }`}
            >
              <p
                className={`mb-1.5 font-mono text-[10px] font-medium tracking-[0.2em] uppercase ${
                  error.kind === 'cancelled' ? 'text-ink-600' : 'text-stamp-500'
                }`}
              >
                {error.kind === 'cancelled' ? 'Stopped' : 'Rejected'}
              </p>
              <p className="font-mono text-[12.5px] leading-relaxed text-ink-300">
                {error.kind === 'cancelled'
                  ? 'The database was restarted. Your evidence is intact.'
                  : error.message}
              </p>
            </div>
          </div>
        ) : !result ? (
          <Placeholder
            title="Nothing on the desk yet."
            body="Write a query and run it. The Constabulary keeps everything, whether or not it means anything."
          />
        ) : result.rows.length === 0 ? (
          <Placeholder
            title="No records match."
            body="The query is sound — the city simply has nobody who fits it. Loosen a condition and try again."
          />
        ) : (
          <table className="w-full border-separate border-spacing-0 font-mono text-[12.5px]">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-11 border-b border-ink-800 bg-ink-900 px-3 py-2.5 text-right text-[10px] font-medium tracking-[0.1em] text-ink-700 uppercase">
                  №
                </th>
                {result.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="border-b border-ink-800 bg-ink-900 px-3.5 py-2.5 text-left text-[10px] font-semibold tracking-[0.16em] whitespace-nowrap text-brass-500 uppercase"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  // Only the visible handful animates; 2,000 animated rows is a
                  // paint cost with no payoff.
                  className={`group transition-colors ${rowIndex < 24 ? 'animate-row-in' : ''}`}
                  style={rowIndex < 24 ? { animationDelay: `${rowIndex * 14}ms` } : undefined}
                >
                  <td className="border-b border-ink-900 px-3 py-2 text-right align-top text-[11px] text-ink-700 tabular-nums group-hover:bg-brass-500/6">
                    {rowIndex + 1}
                  </td>
                  {row.map((value, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="max-w-[62ch] border-b border-ink-900 px-3.5 py-2 align-top leading-relaxed break-words whitespace-pre-wrap group-hover:bg-brass-500/6"
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
