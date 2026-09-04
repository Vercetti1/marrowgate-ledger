import { useEffect, useRef, useState } from 'react'
import type { Stage } from '../game/case'

interface Props {
  stage: Stage
  prompt: string
  open: boolean
  onClose: () => void
  onSubmit: (stage: Stage, guess: string) => Promise<boolean>
}

type Verdict = 'idle' | 'checking' | 'wrong' | 'correct'

export function AccusationDialog({ stage, prompt, open, onClose, onSubmit }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [guess, setGuess] = useState('')
  const [verdict, setVerdict] = useState<Verdict>('idle')

  // Native <dialog> gives us focus trapping, Esc-to-close and inert backdrop
  // for free, so it only needs opening and closing imperatively.
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      setGuess('')
      setVerdict('idle')
      element.showModal()
    } else if (!open && element.open) {
      element.close()
    }
  }, [open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!guess.trim() || verdict === 'checking') return
    setVerdict('checking')
    const correct = await onSubmit(stage, guess)
    setVerdict(correct ? 'correct' : 'wrong')
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-xl border border-white/12 bg-ink-900 p-0 text-ink-200 shadow-2xl backdrop:bg-ink-950/75 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-400">
          Formal accusation
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed">{prompt}</p>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-ink-600">
            Full name
          </span>
          <input
            autoFocus
            value={guess}
            onChange={(event) => {
              setGuess(event.target.value)
              if (verdict !== 'checking') setVerdict('idle')
            }}
            placeholder="e.g. Silas Renwick"
            className="w-full rounded-lg border border-white/15 bg-ink-950 px-3 py-2.5 font-mono text-[13.5px] text-ink-200 outline-none transition placeholder:text-ink-700 focus:border-brass-500/70"
          />
        </label>

        {verdict === 'wrong' ? (
          <p className="mt-3 text-[13px] text-blood-500">
            That is not your killer. Go back to the evidence.
          </p>
        ) : null}
        {verdict === 'correct' ? (
          <p className="mt-3 text-[13px] text-brass-400">
            Charged. The case file has been updated — close this and read on.
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-md px-3.5 py-2 text-[12.5px] font-medium text-ink-400 transition hover:text-ink-200"
          >
            {verdict === 'correct' ? 'Continue' : 'Cancel'}
          </button>
          {verdict === 'correct' ? null : (
            <button
              type="submit"
              disabled={!guess.trim() || verdict === 'checking'}
              className="rounded-md bg-brass-500 px-4 py-2 text-[12.5px] font-semibold text-ink-950 transition hover:bg-brass-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {verdict === 'checking' ? 'Checking…' : 'Charge them'}
            </button>
          )}
        </div>
      </form>
    </dialog>
  )
}
