import { useMemo, useState } from 'react'
import { AccusationDialog } from './components/AccusationDialog'
import { CaseFilePanel } from './components/CaseFilePanel'
import { QueryEditor } from './components/QueryEditor'
import { ResultsGrid } from './components/ResultsGrid'
import { SchemaPanel } from './components/SchemaPanel'
import { STAGES, type Stage } from './game/case'
import { useCaseFile } from './game/useCaseFile'

type Tab = 'case' | 'schema'

export default function App() {
  const caseFile = useCaseFile()
  const [tab, setTab] = useState<Tab>('case')
  const [accusing, setAccusing] = useState<Stage | null>(null)

  const { solved, seals } = caseFile

  /** Act I until it is answered, then Act II. */
  const activeStage = useMemo<Stage>(
    () => STAGES.find((stage) => !solved[stage]) ?? 'mastermind',
    [solved],
  )
  // Solving Act I advances activeStage straight away; the open dialog has to
  // keep the act it was opened for, or its prompt changes under the player.
  const dialogStage = accusing ?? activeStage
  const dialogSeal = seals.find((seal) => seal.stage === dialogStage)
  const allSolved = STAGES.every((stage) => solved[stage])

  if (caseFile.status !== 'ready') {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brass-500">
            Marrowgate Constabulary
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-ink-200">
            {caseFile.status === 'failed' ? 'The case file will not open' : 'Opening the case file…'}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-ink-600">
            {caseFile.status === 'failed'
              ? caseFile.loadError
              : 'Loading three megabytes of Marrowgate into SQLite.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 bg-ink-900/70 px-4 py-3">
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-ink-200">
            The Marrowgate Ledger
          </h1>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-600">
            Case 1114-OH · Old Harbour
          </p>
        </div>

        <ol className="ml-2 flex items-center gap-1.5">
          {STAGES.map((stage, index) => (
            <li
              key={stage}
              title={stage === 'killer' ? 'Act I' : 'Act II'}
              className={`h-1.5 w-8 rounded-full ${
                solved[stage]
                  ? 'bg-brass-500'
                  : stage === activeStage
                    ? 'bg-brass-500/35'
                    : 'bg-white/10'
              }`}
            >
              <span className="sr-only">
                Act {index + 1} {solved[stage] ? 'solved' : 'unsolved'}
              </span>
            </li>
          ))}
        </ol>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={caseFile.reset}
            className="rounded-md px-3 py-1.5 text-[11.5px] font-medium text-ink-600 transition hover:text-ink-200"
          >
            Start over
          </button>
          <button
            type="button"
            onClick={() => setAccusing(activeStage)}
            disabled={allSolved}
            className="rounded-md border border-blood-500/45 bg-blood-500/15 px-3.5 py-1.5 text-[12px] font-semibold text-blood-500 transition hover:bg-blood-500/25 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-ink-700"
          >
            {allSolved ? 'Case closed' : 'Make an accusation'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex max-h-[40vh] min-h-0 w-full shrink-0 flex-col border-b border-white/10 lg:max-h-none lg:w-84 lg:border-b-0 lg:border-r">
          <nav className="flex shrink-0 gap-1 border-b border-white/10 px-3 py-2">
            {(
              [
                ['case', 'Case file'],
                ['schema', 'Database'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition ${
                  tab === key
                    ? 'bg-white/[0.08] text-ink-200'
                    : 'text-ink-600 hover:text-ink-400'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-auto">
            {tab === 'case' ? (
              <CaseFilePanel
                hints={caseFile.hints}
                solved={caseFile.solved}
                revealed={caseFile.revealed}
                revealedHints={caseFile.revealedHints}
                onRevealHint={caseFile.revealNextHint}
              />
            ) : (
              <SchemaPanel
                schema={caseFile.schema}
                onSelectTable={(table) =>
                  caseFile.setSql(`SELECT *\nFROM ${table.name}\nLIMIT 20;`)
                }
              />
            )}
          </div>
        </aside>

        <main className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(9rem,32%)_1fr]">
          <QueryEditor
            value={caseFile.sql}
            onChange={caseFile.setSql}
            onRun={caseFile.run}
            onCancel={caseFile.cancel}
            running={caseFile.running}
            schema={caseFile.schema}
          />
          <ResultsGrid
            result={caseFile.result}
            error={caseFile.queryError}
            running={caseFile.running}
          />
        </main>
      </div>

      {dialogSeal ? (
        <AccusationDialog
          stage={dialogStage}
          prompt={dialogSeal.prompt}
          open={accusing !== null}
          onClose={() => setAccusing(null)}
          onSubmit={caseFile.submitAccusation}
        />
      ) : null}
    </div>
  )
}
