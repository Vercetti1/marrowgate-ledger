import { BRIEFING, type Hint, type Stage } from '../game/case'

interface Props {
  hints: Hint[]
  solved: Partial<Record<Stage, string>>
  revealed: Partial<Record<Stage, string>>
  revealedHints: Partial<Record<Stage, number>>
  onRevealHint: (stage: Stage) => void
}

const ACT_TITLES: Record<Stage, string> = {
  killer: 'Act I — Who killed him',
  mastermind: 'Act II — Who paid for it',
}

function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split(/(?<=\.)\s+(?=[A-Z“"])/).map((sentence, index) => (
        <p key={index} className="text-[13px] leading-relaxed text-ink-200">
          {sentence}
        </p>
      ))}
    </div>
  )
}

export function CaseFilePanel({ hints, solved, revealed, revealedHints, onRevealHint }: Props) {
  const stages: Stage[] = ['killer', 'mastermind']

  return (
    <div className="space-y-6 p-4">
      <section>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-400">
          The assignment
        </h3>
        <div className="space-y-2">
          {BRIEFING.lines.map((line) => (
            <p key={line} className="text-[13px] leading-relaxed text-ink-400">
              {line}
            </p>
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border border-white/10 bg-white/[0.02] p-3 font-mono text-[12px]">
          {(
            [
              ['crime', BRIEFING.crime],
              ['date', BRIEFING.date],
              ['district', BRIEFING.district],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="col-span-2 grid grid-cols-subgrid">
              <dt className="text-ink-600">{label}</dt>
              <dd className="text-ink-200">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {stages.map((stage) => {
        // Act II stays sealed until Act I is answered, so the panel can't spoil it.
        if (stage === 'mastermind' && !solved.killer) return null
        const stageHints = hints.filter((hint) => hint.stage === stage)
        const shown = revealedHints[stage] ?? 0

        return (
          <section key={stage}>
            <h3 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-400">
              {ACT_TITLES[stage]}
              {solved[stage] ? <span className="text-brass-500">✓</span> : null}
            </h3>

            {revealed[stage] ? (
              <blockquote className="mb-3 border-l-2 border-brass-500/60 pl-3">
                <Prose text={revealed[stage]!} />
              </blockquote>
            ) : null}

            <ul className="space-y-2">
              {stageHints.slice(0, shown).map((hint) => (
                <li
                  key={hint.ordinal}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[12.5px] leading-relaxed text-ink-400"
                >
                  <span className="mr-1.5 font-mono text-[11px] text-ink-700">
                    {hint.ordinal}.
                  </span>
                  {hint.text}
                </li>
              ))}
            </ul>

            {!solved[stage] && shown < stageHints.length ? (
              <button
                type="button"
                onClick={() => onRevealHint(stage)}
                className="mt-2 rounded-md border border-white/12 px-3 py-1.5 text-[11.5px] font-medium text-ink-400 transition hover:border-white/25 hover:text-ink-200"
              >
                {shown === 0 ? 'Stuck? Take a hint' : `Next hint (${shown}/${stageHints.length})`}
              </button>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
