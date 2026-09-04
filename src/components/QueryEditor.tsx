import { sql as sqlLanguage, SQLite } from '@codemirror/lang-sql'
import { Prec } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import CodeMirror, { EditorView, keymap, type Extension } from '@uiw/react-codemirror'
import { useMemo } from 'react'
import type { TableSchema } from '../lib/db-protocol'

interface Props {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  onCancel: () => void
  running: boolean
  schema: TableSchema[]
}

const editorTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', fontSize: '13px', height: '100%' },
  '.cm-gutters': { backgroundColor: 'transparent', borderRight: '1px solid #ffffff14' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#ffffff08' },
  '.cm-content': { fontFamily: 'var(--font-mono)', padding: '12px 0' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)' },
})

export function QueryEditor({ value, onChange, onRun, onCancel, running, schema }: Props) {
  // Completions come from the real database, so table and column names are
  // always in step with whatever the case file actually contains.
  const extensions = useMemo<Extension[]>(() => {
    const completionSchema = Object.fromEntries(
      schema.map((table) => [table.name, table.columns.map((column) => column.name)]),
    )
    return [
      sqlLanguage({ dialect: SQLite, schema: completionSchema, upperCaseKeywords: true }),
      editorTheme,
      // Highest precedence, or CodeMirror's own Enter handling swallows it.
      Prec.highest(
        keymap.of([
          { key: 'Mod-Enter', preventDefault: true, run: () => (onRun(), true) },
          { key: 'Shift-Enter', preventDefault: true, run: () => (onRun(), true) },
        ]),
      ),
    ]
  }, [schema, onRun])

  return (
    <section className="flex min-h-0 min-w-0 flex-col border-b border-white/10">
      <header className="flex items-center gap-3 border-b border-white/10 bg-ink-900/60 px-4 py-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
          Query
        </h2>
        <span className="ml-auto hidden text-[11px] text-ink-600 sm:block">
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono">⌘</kbd>
          <span className="mx-1">+</span>
          <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono">↵</kbd>
          <span className="ml-2">to run</span>
        </span>
        {running ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-blood-500/40 bg-blood-500/15 px-3 py-1.5 text-xs font-semibold text-blood-500 transition hover:bg-blood-500/25"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={onRun}
            className="rounded-md bg-brass-500 px-3.5 py-1.5 text-xs font-semibold text-ink-950 transition hover:bg-brass-400"
          >
            Run query
          </button>
        )}
      </header>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <CodeMirror
          value={value}
          onChange={onChange}
          theme={oneDark}
          extensions={extensions}
          basicSetup={{ foldGutter: false, highlightSelectionMatches: false }}
          height="100%"
        />
      </div>
    </section>
  )
}
