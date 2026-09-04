import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Faux desktop window chrome.
 *
 * The traffic lights are decorative — they are marked aria-hidden rather than
 * wired to fake behaviour, because a control that looks real and does nothing
 * is worse than an ornament that admits it.
 */
export function Window({ title, subtitle, actions, children, className = '' }: Props) {
  return (
    <section
      className={`animate-window-in flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-ink-800 bg-ink-950 shadow-[0_20px_60px_-16px_oklch(0_0_0/0.8)] ${className}`}
    >
      <header className="relative flex shrink-0 items-center gap-3 border-b border-ink-850 bg-gradient-to-b from-ink-850 to-ink-900 px-3.5 py-2.5">
        <div aria-hidden className="flex shrink-0 items-center gap-[6px]">
          <span className="size-[11px] rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_oklch(0_0_0/0.2)]" />
          <span className="size-[11px] rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_oklch(0_0_0/0.2)]" />
          <span className="size-[11px] rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_oklch(0_0_0/0.2)]" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center">
          <span className="font-mono text-[11px] font-medium text-ink-400">{title}</span>
          {subtitle ? (
            <span className="font-mono text-[9.5px] tracking-[0.1em] text-ink-700">{subtitle}</span>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">{actions}</div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </section>
  )
}
