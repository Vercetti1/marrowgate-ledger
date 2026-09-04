import { useEffect, useRef, useState } from 'react'
import { SPEAKERS, type Line } from '../game/dialogue'

interface Props {
  lines: Line[]
  onDismiss: () => void
}

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Long speeches type faster, so no single box outlasts the player's patience. */
function msPerChar(length: number): number {
  return Math.min(26, Math.max(6, 1800 / Math.max(length, 1)))
}

function initials(name: string): string {
  return name
    .replace(/^(Insp|Sgt|Dr)\.\s*/, '')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Which line we are on, when it started, and how much of it is showing. */
interface Cursor {
  index: number
  startedAt: number
  revealed: number
}

/**
 * The scene is reset by remounting (App keys this on the scene id) rather than
 * by an effect that writes state, so there is no render-then-correct pass.
 */
export function DialogueBox({ lines, onDismiss }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [cursor, setCursor] = useState<Cursor>(() => ({
    index: 0,
    startedAt: performance.now(),
    revealed: prefersReducedMotion() ? (lines[0]?.text.length ?? 0) : 0,
  }))

  const line = lines[cursor.index]
  const full = line?.text ?? ''
  const finished = cursor.revealed >= full.length
  const isLast = cursor.index >= lines.length - 1

  // Take focus so Space and Enter advance the scene instead of reaching the editor.
  useEffect(() => {
    container.current?.focus({ preventScroll: true })
  }, [])

  /*
   * One timer for the whole scene, and the character count is derived from
   * elapsed time rather than accumulated per tick.
   *
   * A per-character setInterval silently loses to render cost, and a
   * requestAnimationFrame loop stops dead in a hidden tab — a player who
   * switches away mid-scene would return to a frozen line. Computing from the
   * clock means throttling costs smoothness, never progress. Ticks that change
   * nothing return the previous state object, so React bails out of the render.
   */
  useEffect(() => {
    if (prefersReducedMotion()) return
    const timer = setInterval(() => {
      setCursor((previous) => {
        const length = lines[previous.index]?.text.length ?? 0
        if (previous.revealed >= length) return previous
        const next = Math.min(
          length,
          Math.floor((performance.now() - previous.startedAt) / msPerChar(length)),
        )
        return next === previous.revealed ? previous : { ...previous, revealed: next }
      })
    }, 16)
    return () => clearInterval(timer)
  }, [lines])

  function advance() {
    if (!finished) {
      setCursor((previous) => ({ ...previous, revealed: full.length }))
      return
    }
    if (isLast) {
      onDismiss()
      return
    }
    setCursor((previous) => ({
      index: previous.index + 1,
      startedAt: performance.now(),
      revealed: prefersReducedMotion() ? (lines[previous.index + 1]?.text.length ?? 0) : 0,
    }))
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight') {
      event.preventDefault()
      advance()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onDismiss()
    }
  }

  if (!line) return null
  const speaker = SPEAKERS[line.speaker]

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      {/* Scrim: the case pauses while somebody is talking. */}
      <button
        type="button"
        aria-label="Advance dialogue"
        onClick={advance}
        className="animate-fade-in absolute inset-0 cursor-pointer bg-ink-950/55 backdrop-blur-[2px]"
      />

      <div
        ref={container}
        role="dialog"
        aria-live="polite"
        aria-label={`${speaker.name} speaking`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={advance}
        className="animate-rise relative mx-auto mb-5 w-[min(56rem,calc(100vw-1.5rem))] cursor-pointer rounded-xl border border-brass-600/30 bg-ink-900/95 shadow-[0_24px_70px_-10px_oklch(0_0_0/0.8)] outline-none focus-visible:border-brass-500/60"
      >
        {/* Brass hairline along the top, like a lit edge. */}
        <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brass-500/50 to-transparent" />

        <div className="flex gap-4 px-5 py-4 sm:px-6 sm:py-5">
          <div className="hidden shrink-0 sm:block">
            <div className="grid size-14 place-items-center rounded-lg border border-ink-700 bg-ink-850">
              <span className={`font-display text-lg font-bold ${speaker.tone}`}>
                {initials(speaker.name)}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-baseline gap-2.5">
              <span
                className={`font-mono text-[11px] font-semibold tracking-[0.18em] uppercase ${speaker.tone}`}
              >
                {speaker.name}
              </span>
              <span className="truncate font-mono text-[10px] tracking-[0.12em] text-ink-600 uppercase">
                {speaker.role}
              </span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-ink-700 tabular-nums">
                {cursor.index + 1}/{lines.length}
              </span>
            </div>

            {/*
              The full text stays in the DOM but invisible, so the box does not
              reflow line by line as the typewriter runs.
            */}
            <p className="relative font-typed text-[14.5px] leading-[1.75] text-ink-100 sm:text-[15.5px]">
              <span aria-hidden className="invisible">
                {full}
              </span>
              <span className="absolute inset-0">
                {full.slice(0, cursor.revealed)}
                {!finished ? (
                  <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-brass-400" />
                ) : null}
              </span>
            </p>

            <div className="mt-3 flex items-center gap-4">
              <span className="font-mono text-[10px] tracking-[0.14em] text-ink-700 uppercase">
                {finished ? (
                  <span className="animate-blink text-brass-500">
                    {isLast ? '▸ close' : '▸ continue'}
                  </span>
                ) : (
                  'click to skip'
                )}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDismiss()
                }}
                className="ml-auto cursor-pointer font-mono text-[10px] tracking-[0.14em] text-ink-700 uppercase transition-colors hover:text-ink-300"
              >
                Skip scene
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
