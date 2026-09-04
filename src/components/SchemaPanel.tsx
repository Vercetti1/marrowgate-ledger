import { useState } from 'react'
import type { TableSchema } from '../lib/db-protocol'

interface Props {
  schema: TableSchema[]
  onSelectTable: (table: TableSchema) => void
}

export function SchemaPanel({ schema, onSelectTable }: Props) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="p-3">
      <p className="px-2 pb-2 text-[11px] leading-relaxed text-ink-600">
        {schema.length} tables. Click a name to preview it; click again to see its columns.
      </p>
      <ul className="space-y-0.5">
        {schema.map((table) => {
          const expanded = open === table.name
          return (
            <li key={table.name}>
              <button
                type="button"
                onClick={() => {
                  setOpen(expanded ? null : table.name)
                  onSelectTable(table)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/[0.06]"
              >
                <span
                  className={`text-ink-600 transition-transform ${expanded ? 'rotate-90' : ''}`}
                  aria-hidden
                >
                  ▸
                </span>
                <span className="font-mono text-[12.5px] text-ink-200">{table.name}</span>
                <span className="ml-auto text-[10.5px] tabular-nums text-ink-700">
                  {table.rowCount.toLocaleString()}
                </span>
              </button>

              {expanded ? (
                <ul className="mb-1 ml-[26px] border-l border-white/10 pl-3">
                  {table.columns.map((column) => (
                    <li key={column.name} className="flex items-baseline gap-2 py-[3px]">
                      <span className="font-mono text-[12px] text-ink-400">{column.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-ink-700">
                        {column.type}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
