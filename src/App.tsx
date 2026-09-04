import { useMemo, useState } from 'react'
import { AccusationDialog } from './components/AccusationDialog'
import { CaseFilePanel } from './components/CaseFilePanel'
import { DialogueBox } from './components/DialogueBox'
import { QueryEditor } from './components/QueryEditor'
import { ResultsGrid } from './components/ResultsGrid'
import { SchemaPanel } from './components/SchemaPanel'
import { Window } from './components/Window'
import { STAGES, type Stage } from './game/case'
import { useCaseFile } from './game/useCaseFile'

type Tab = 'case' | 'records'

const TABS: ReadonlyArray<readonly [Tab, string]> = [
  ['case', 'Case file'],
  ['records', 'Records'],
]

function Shell({ title, body }: { title: string; body: string }) {
  return (
    <div className="desk grid h-full place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-[10px] font-medium tracking-[0.3em] text-brass-500 uppercase">
          Marrowgate City Constabulary
        </p>
        <h1 className="mt-4 font-display text-3xl leading-tight font-bold text-ink-100">{title}</h1>
        <span className="mx-auto mt-5 block h-px w-16 bg-brass-600/60" />
        <p className="mt-5 font-typed text-[13px] leading-relaxed text-ink-500">{body}</p>
      </div>
    </div>
  )
}

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
  const totalRecords = useMemo(
    () => caseFile.schema.reduce((sum, table) => sum + table.rowCount, 0),
    [caseFile.schema],
  )

  if (caseFile.status !== 'ready') {
    return caseFile.status === 'failed' ? (
      <Shell
        title="The case file will not open"
        body={caseFile.loadError ?? 'Unknown error.'}
      />
    ) : (
      <Shell
        title="Opening the case file"
        body="Three megabytes of Marrowgate, loading into SQLite."
      />
    )
  }

  return (
    <div className="desk flex h-full flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 border-b border-ink-850 px-5 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[19px] leading-none font-bold tracking-tight text-ink-100">
            The Marrowgate Ledger
          </h1>
          <span className="hidden font-mono text-[10px] tracking-[0.2em] text-ink-600 uppercase sm:inline">
            A SQL murder mystery
          </span>
        </div>

        <ol className="flex items-center gap-1.5">
          {STAGES.map((stage, index) => {
            const isSolved = Boolean(solved[stage])
            const isActive = stage === activeStage && !isSolved
            return (
              <li
                key={stage}
                className={`rounded-sm border px-2 py-1 font-mono text-[9.5px] font-medium tracking-[0.16em] uppercase transition-colors duration-300 ${
                  isSolved
                    ? 'border-brass-600/50 bg-brass-500/12 text-brass-400'
                    : isActive
                      ? 'border-ink-700 bg-ink-900 text-ink-300'
                      : 'border-ink-850 text-ink-700'
                }`}
              >
                Act {index === 0 ? 'I' : 'II'}
                <span className="ml-1.5 text-[8.5px]">
                  {isSolved ? 'charged' : isActive ? 'open' : 'sealed'}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={caseFile.replayBriefing}
            className="cursor-pointer rounded-sm px-3 py-1.5 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-600 uppercase transition-colors duration-200 hover:text-ink-300"
          >
            Briefing
          </button>
          <button
            type="button"
            onClick={caseFile.reset}
            className="cursor-pointer rounded-sm px-3 py-1.5 font-mono text-[10px] font-medium tracking-[0.14em] text-ink-600 uppercase transition-colors duration-200 hover:text-ink-300"
          >
            Start over
          </button>
          <button
            type="button"
            onClick={() => setAccusing(activeStage)}
            disabled={allSolved}
            className="cursor-pointer rounded-sm border border-stamp-500/55 px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-stamp-500 uppercase transition-colors duration-200 hover:border-stamp-500 hover:bg-stamp-500/12 disabled:cursor-not-allowed disabled:border-ink-850 disabled:bg-transparent disabled:text-ink-700"
          >
            {allSolved ? 'Case closed' : 'Name a suspect'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* The dossier: a paper sheet laid on the desk, with folder tabs. */}
        <aside className="flex max-h-[46vh] min-h-0 w-full shrink-0 flex-col lg:max-h-none lg:w-[25.5rem]">
          <div role="tablist" className="flex shrink-0 items-end gap-0.5 px-4 pt-2">
            {TABS.map(([key, label]) => {
              const selected = tab === key
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={selected}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`cursor-pointer rounded-t-md px-3.5 pt-1.5 pb-2 font-mono text-[10px] font-medium tracking-[0.16em] uppercase transition-colors duration-200 ${
                    selected
                      ? 'bg-paper-100 text-paper-900'
                      : 'bg-ink-900 text-ink-600 hover:bg-ink-850 hover:text-ink-300'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="paper min-h-0 min-w-0 flex-1 overflow-auto shadow-[0_-1px_24px_oklch(0_0_0/0.45)]">
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

        {/* The terminal, as a window on the desk. */}
        <main className="min-h-0 min-w-0 flex-1 p-3 sm:p-4">
          <Window
            title="sqlite3 — marrowgate.db"
            subtitle={`${totalRecords.toLocaleString()} records · read-only`}
            className="h-full"
            actions={
              <>
                <span className="mr-1 hidden items-center gap-1 sm:flex">
                  <kbd className="rounded border border-ink-700 bg-ink-950 px-1.5 py-px font-mono text-[10px] text-ink-500">
                    ⌘
                  </kbd>
                  <kbd className="rounded border border-ink-700 bg-ink-950 px-1.5 py-px font-mono text-[10px] text-ink-500">
                    ↵
                  </kbd>
                </span>
                {caseFile.running ? (
                  <button
                    type="button"
                    onClick={caseFile.cancel}
                    className="cursor-pointer rounded-md border border-stamp-500/50 bg-stamp-500/12 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-stamp-500 uppercase transition-colors duration-200 hover:bg-stamp-500/22 active:scale-[0.98]"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={caseFile.run}
                    className="cursor-pointer rounded-md bg-brass-500 px-3.5 py-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-ink-950 uppercase transition-all duration-200 hover:bg-brass-400 active:scale-[0.98]"
                  >
                    Run
                  </button>
                )}
              </>
            }
          >
            <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[minmax(7.5rem,34%)_1fr]">
              <QueryEditor
                value={caseFile.sql}
                onChange={caseFile.setSql}
                onRun={caseFile.run}
                schema={caseFile.schema}
              />
              <ResultsGrid
                result={caseFile.result}
                error={caseFile.queryError}
                running={caseFile.running}
              />
            </div>
          </Window>
        </main>
      </div>

      {caseFile.dialogue ? (
        <DialogueBox
          // Remounting per scene resets the typewriter without an effect.
          key={caseFile.dialogue.id}
          lines={caseFile.dialogue.lines}
          onDismiss={caseFile.dismissDialogue}
        />
      ) : null}

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
