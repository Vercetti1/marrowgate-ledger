import { useEffect, useRef, useState } from 'react'
import type { Stage } from '../game/case'

interface Props {
  stage: Stage
  prompt: string
  open: boolean
  onClose: () => void
  onSubmit: (stage: Stage, guess: string) => Promise<boolean>
}

/**
 * The charge sheet only *takes* the name.
 *
 * Whether the charge sticks is delivered by Insp. Vance in the dialogue box, so
 * the outcome has one home instead of two competing ones — and a native
 * <dialog> lives in the top layer, so anything it reported would have covered
 * the scene playing underneath it anyway.
 */
export function AccusationDialog({ stage, prompt, open, onClose, onSubmit }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [guess, setGuess] = useState('')
  const [filing, setFiling] = useState(false)

  // Native <dialog> gives us focus trapping, Esc-to-close and an inert backdrop
  // for free, so it only needs opening and closing imperatively.
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      setGuess('')
      setFiling(false)
      element.showModal()
    } else if (!open && element.open) {
      element.close()
    }
  }, [open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!guess.trim() || filing) return
    setFiling(true)
    await onSubmit(stage, guess)
    // Close either way; the scene that follows says how it went.
    dialog.current?.close()
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="paper m-auto w-[min(29rem,calc(100vw-2rem))] rounded-sm p-0 shadow-[0_30px_70px_-12px_oklch(0_0_0/0.7)] backdrop:bg-ink-950/70 backdrop:backdrop-blur-[3px]"
    >
      <form onSubmit={handleSubmit} className="px-7 py-6">
        <div className="mb-4 border-b-2 border-paper-900/70 pb-3">
          <p className="font-mono text-[9.5px] font-medium tracking-[0.26em] text-paper-600 uppercase">
            Form 9 · Charge sheet
          </p>
          <h2 className="mt-1.5 font-display text-[22px] leading-tight font-bold text-paper-900">
            {prompt}
          </h2>
        </div>

        <label className="block">
          <span className="mb-2 block font-mono text-[10px] font-medium tracking-[0.2em] text-paper-600 uppercase">
            Name of the accused
          </span>
          <input
            autoFocus
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            placeholder="As it appears in the register"
            className="w-full border-0 border-b-2 border-paper-400 bg-transparent px-0.5 pb-1.5 font-typed text-[16px] text-paper-900 outline-none transition-colors placeholder:text-paper-400 focus:border-stamp-500"
          />
        </label>

        <p className="mt-3 font-typed text-[12.5px] leading-relaxed text-paper-600 italic">
          A charge cannot be withdrawn quietly. Be sure of the record first.
        </p>

        <div className="mt-5 flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="cursor-pointer rounded-sm px-3.5 py-2 font-mono text-[10.5px] font-medium tracking-[0.14em] text-paper-600 uppercase transition-colors duration-200 hover:text-paper-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!guess.trim() || filing}
            className="cursor-pointer rounded-sm bg-stamp-500 px-4 py-2 font-mono text-[10.5px] font-semibold tracking-[0.14em] text-paper-50 uppercase transition-all duration-200 hover:bg-stamp-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-paper-400 disabled:text-paper-100"
          >
            {filing ? 'Filing…' : 'Sign the charge'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
