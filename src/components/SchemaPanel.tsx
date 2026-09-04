import { useState } from 'react'
import type { TableSchema } from '../lib/db-protocol'

interface Props {
  schema: TableSchema[]
  onSelectTable: (table: TableSchema) => void
}

export function SchemaPanel({ schema, onSelectTable }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const totalRows = schema.reduce((sum, table) => sum + table.rowCount, 0)

  return (
    <div className="px-5 pt-5 pb-10">
      <div className="mb-5 border-b-2 border-paper-900/70 pb-3">
        <p className="font-mono text-[9.5px] font-medium tracking-[0.26em] text-paper-600 uppercase">
          Records office
        </p>
        <h2 className="mt-1.5 font-display text-[26px] leading-none font-bold tracking-tight text-paper-900">
          Register of holdings
        </h2>
        <p className="mt-2 font-mono text-[10.5px] tracking-[0.1em] text-paper-600 uppercase">
          {schema.length} registers · {totalRows.toLocaleString()} entries
        </p>
      </div>

      <ul>
        {schema.map((table) => {
          const expanded = open === table.name
          return (
            <li key={table.name} className="border-b border-paper-300/70 last:border-b-0">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => {
                  setOpen(expanded ? null : table.name)
                  onSelectTable(table)
                }}
                className="group flex w-full cursor-pointer items-baseline py-2 text-left"
              >
                <span className="font-mono text-[12.5px] text-paper-900 transition-colors group-hover:text-stamp-600">
                  {table.name}
                </span>
                <span className="leader" aria-hidden />
                <span className="font-mono text-[11px] text-paper-600 tabular-nums">
                  {table.rowCount.toLocaleString()}
                </span>
              </button>

              {expanded ? (
                <ul className="mb-3 ml-3 border-l border-paper-400 pl-3.5">
                  {table.columns.map((column) => (
                    <li key={column.name} className="flex items-baseline py-[3px]">
                      <span className="font-mono text-[11.5px] text-paper-800">{column.name}</span>
                      <span className="leader" aria-hidden />
                      <span className="font-mono text-[9.5px] tracking-[0.12em] text-paper-600 uppercase">
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

      <p className="mt-5 font-typed text-[12px] leading-[1.7] text-paper-600 italic">
        Select a register to lay it out on the desk.
      </p>
    </div>
  )
}
