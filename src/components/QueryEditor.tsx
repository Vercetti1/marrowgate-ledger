import { sql as sqlLanguage, SQLite } from '@codemirror/lang-sql'
import { Prec } from '@codemirror/state'
import CodeMirror, { keymap, type Extension } from '@uiw/react-codemirror'
import { useMemo } from 'react'
import type { TableSchema } from '../lib/db-protocol'
import { marrowgateEditorTheme, marrowgateHighlight } from './editorTheme'

interface Props {
  value: string
  onChange: (value: string) => void
  /** Bound to Cmd/Ctrl+Enter; the visible button lives in the window title bar. */
  onRun: () => void
  schema: TableSchema[]
}

export function QueryEditor({ value, onChange, onRun, schema }: Props) {
  // Completions come from the real database, so table and column names are
  // always in step with whatever the case file actually contains.
  const extensions = useMemo<Extension[]>(() => {
    const completionSchema = Object.fromEntries(
      schema.map((table) => [table.name, table.columns.map((column) => column.name)]),
    )
    return [
      sqlLanguage({ dialect: SQLite, schema: completionSchema, upperCaseKeywords: true }),
      marrowgateEditorTheme,
      marrowgateHighlight,
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
    <div className="min-h-0 min-w-0 overflow-hidden border-b border-ink-850">
      <CodeMirror
        value={value}
        onChange={onChange}
        // "none" suppresses the wrapper's built-in light theme, which would
        // otherwise outrank the theme supplied as an extension.
        theme="none"
        extensions={extensions}
        basicSetup={{
          foldGutter: false,
          highlightSelectionMatches: false,
          bracketMatching: true,
          closeBrackets: false,
        }}
        height="100%"
      />
    </div>
  )
}
