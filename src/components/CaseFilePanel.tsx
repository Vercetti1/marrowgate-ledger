import { BRIEFING, type Hint, type Stage } from '../game/case'

interface Props {
  hints: Hint[]
  solved: Partial<Record<Stage, string>>
  revealed: Partial<Record<Stage, string>>
  revealedHints: Partial<Record<Stage, number>>
  onRevealHint: (stage: Stage) => void
}

const ACTS: Record<Stage, { ordinal: string; title: string; question: string }> = {
  killer: { ordinal: 'I', title: 'The hand', question: 'Who killed Silas Renwick?' },
  mastermind: { ordinal: 'II', title: 'The purse', question: 'Who paid for it?' },
}

/** Typed prose, broken at sentence boundaries the way a statement is dictated. */
function Typed({ text }: { text: string }) {
  return (
    <div className="space-y-2.5">
      {text.split(/(?<=\.)\s+(?=[A-Z“"])/).map((sentence, index) => (
        <p key={index} className="font-typed text-[13px] leading-[1.75] text-paper-900">
          {sentence}
        </p>
      ))}
    </div>
  )
}

function SectionRule({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <h3 className="font-mono text-[10px] font-medium tracking-[0.22em] text-paper-600 uppercase">
        {label}
      </h3>
      <span className="h-px flex-1 bg-paper-300" />
    </div>
  )
}

export function CaseFilePanel({ hints, solved, revealed, revealedHints, onRevealHint }: Props) {
  const stages: Stage[] = ['killer', 'mastermind']

  return (
    <div className="px-5 pt-5 pb-10">
      {/* Report letterhead */}
      <div className="mb-5 border-b-2 border-paper-900/70 pb-3">
        <p className="font-mono text-[9.5px] font-medium tracking-[0.26em] text-paper-600 uppercase">
          Marrowgate City Constabulary
        </p>
        <h2 className="mt-1.5 font-display text-[26px] leading-none font-bold tracking-tight text-paper-900">
          Death at Pier 9
        </h2>
        <p className="mt-2 font-mono text-[10.5px] tracking-[0.1em] text-paper-600 uppercase">
          Case 1114-OH · Homicide · Open
        </p>
      </div>

      <section className="mb-7">
        <SectionRule label="The assignment" />
        <div className="ruled space-y-2.5">
          {BRIEFING.lines.map((line) => (
            <p key={line} className="font-typed text-[13px] leading-[1.75] text-paper-800">
              {line}
            </p>
          ))}
        </div>

        <dl className="mt-4 border-y border-paper-300 py-2.5">
          {(
            [
              ['Crime', BRIEFING.crime],
              ['Date', BRIEFING.date],
              ['District', BRIEFING.district],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-baseline py-1">
              <dt className="font-mono text-[10.5px] tracking-[0.14em] text-paper-600 uppercase">
                {label}
              </dt>
              <span className="leader" aria-hidden />
              <dd className="font-mono text-[12px] font-medium text-paper-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {stages.map((stage) => {
        // Act II stays sealed until Act I is answered, so the panel can't spoil it.
        if (stage === 'mastermind' && !solved.killer) return null

        const act = ACTS[stage]
        const stageHints = hints.filter((hint) => hint.stage === stage)
        const shown = revealedHints[stage] ?? 0
        const isSolved = Boolean(solved[stage])

        return (
          <section key={stage} className="mb-8">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[9.5px] font-medium tracking-[0.26em] text-paper-600 uppercase">
                  Act {act.ordinal} — {act.title}
                </p>
                <h3 className="mt-1 font-display text-[19px] leading-snug font-semibold text-paper-900">
                  {act.question}
                </h3>
              </div>
              {isSolved ? (
                <span className="stamp stamp-animate mt-1.5 shrink-0 text-[10px] whitespace-nowrap">
                  Charged
                </span>
              ) : null}
            </div>

            {revealed[stage] ? (
              <figure className="mt-4 border-l-2 border-stamp-500/45 pl-3.5">
                <figcaption className="mb-2 font-mono text-[9.5px] font-medium tracking-[0.2em] text-stamp-600 uppercase">
                  {stage === 'killer' ? 'Statement under caution' : 'Case disposition'}
                </figcaption>
                <Typed text={revealed[stage]!} />
              </figure>
            ) : null}

            {stageHints.slice(0, shown).length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {stageHints.slice(0, shown).map((hint) => (
                  <li
                    key={hint.ordinal}
                    className="border-l-2 border-dashed border-paper-400 pl-3"
                  >
                    <p className="mb-1 font-mono text-[9.5px] tracking-[0.2em] text-paper-600 uppercase">
                      Margin note {hint.ordinal}
                    </p>
                    <p className="font-typed text-[12.5px] leading-[1.7] text-paper-800">
                      {hint.text}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            {!isSolved && shown < stageHints.length ? (
              <button
                type="button"
                onClick={() => onRevealHint(stage)}
                className="mt-4 cursor-pointer rounded-sm border border-paper-400 bg-paper-50/60 px-3 py-1.5 font-mono text-[10px] font-medium tracking-[0.14em] text-paper-600 uppercase transition-colors duration-200 hover:border-paper-600 hover:text-paper-900"
              >
                {shown === 0
                  ? 'Consult the margin'
                  : `Next note · ${shown} of ${stageHints.length}`}
              </button>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
