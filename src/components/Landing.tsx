const PLAY = '#/play'

/** Static, hand-coloured SQL — the landing should not pull in the editor. */
function SampleQuery() {
  const K = 'text-brass-400'
  const S = 'text-[oklch(0.81_0.1_148)]'
  const N = 'text-[oklch(0.81_0.085_232)]'
  const P = 'text-ink-500'

  return (
    <div className="animate-window-in overflow-hidden rounded-xl border border-ink-800 bg-ink-950 shadow-[0_24px_60px_-20px_oklch(0_0_0/0.8)]">
      <header className="relative flex items-center gap-3 border-b border-ink-850 bg-gradient-to-b from-ink-850 to-ink-900 px-3.5 py-2.5">
        <div aria-hidden className="flex shrink-0 items-center gap-[6px]">
          <span className="size-[11px] rounded-full bg-[#ff5f57]" />
          <span className="size-[11px] rounded-full bg-[#febc2e]" />
          <span className="size-[11px] rounded-full bg-[#28c840]" />
        </div>
        <span className="pointer-events-none absolute inset-x-0 text-center font-mono text-[11px] text-ink-400">
          sqlite3 · marrowgate.db
        </span>
      </header>

      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-[1.75]">
        <code>
          <span className={K}>SELECT</span> p.name<span className={P}>,</span> m.tier{'\n'}
          <span className={K}>FROM</span> person p{'\n'}
          <span className={K}>JOIN</span> club_membership m{'\n'}
          {'  '}
          <span className={K}>ON</span> m.person_id <span className={P}>=</span> p.id{'\n'}
          <span className={K}>WHERE</span> m.tier <span className={P}>=</span>{' '}
          <span className={S}>&#39;platinum&#39;</span>{'\n'}
          <span className={K}>LIMIT</span> <span className={N}>4</span>
          <span className={P}>;</span>
        </code>
      </pre>

      <div className="border-t border-ink-900">
        <div className="px-5 py-2 font-mono text-[10px] tracking-[0.22em] text-ink-600 uppercase">
          Results <span className="ml-2 text-ink-700 normal-case">4 rows · 1.2 ms</span>
        </div>
        <table className="w-full border-separate border-spacing-0 font-mono text-[12px]">
          <thead>
            <tr>
              {['name', 'tier'].map((column) => (
                <th
                  key={column}
                  className="border-y border-ink-850 bg-ink-900 px-5 py-2 text-left text-[10px] font-semibold tracking-[0.16em] text-brass-500 uppercase"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Horatio Grimsby', 'platinum'],
              ['Tamsin Larkspur', 'platinum'],
              ['Rufus Coldwell', 'platinum'],
              ['Ida Netherwood', 'platinum'],
            ].map(([name, tier]) => (
              <tr key={name}>
                <td className="border-b border-ink-900 px-5 py-1.5 text-ink-100">{name}</td>
                <td className="border-b border-ink-900 px-5 py-1.5 text-ink-400">{tier}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-5 py-3 font-typed text-[12px] text-ink-600 italic">
          Four names. Only one of them was under the pier.
        </p>
      </div>
    </div>
  )
}

/** A torn-out corner of the paper dossier, to set the two materials against each other. */
function DossierCard() {
  return (
    <div className="paper animate-rise rounded-sm p-6 shadow-[0_20px_50px_-20px_oklch(0_0_0/0.7)]">
      <p className="font-mono text-[9.5px] font-medium tracking-[0.26em] text-paper-600 uppercase">
        Marrowgate City Constabulary
      </p>
      <h3 className="mt-1.5 font-display text-[22px] leading-none font-bold text-paper-900">
        Death at Pier 9
      </h3>
      <span className="mt-3 mb-3 block h-px w-full bg-paper-900/70" />
      <p className="font-typed text-[12.5px] leading-[1.75] text-paper-800">
        Silas Renwick, customs auditor, found beneath Pier 9 at first light. His ledger case is
        missing. Two people gave statements at the scene.
      </p>
      <dl className="mt-4 border-t border-paper-300 pt-2.5">
        {[
          ['Crime', 'murder'],
          ['Date', '2025-11-14'],
          ['District', 'Old Harbour'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-baseline py-1">
            <dt className="font-mono text-[10px] tracking-[0.14em] text-paper-600 uppercase">
              {label}
            </dt>
            <span className="leader" aria-hidden />
            <dd className="font-mono text-[11.5px] font-medium text-paper-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const STEPS = [
  {
    n: 'I',
    title: 'Read the report',
    body: 'Find the crime scene report for the right date and district. It points at two witnesses without naming either of them.',
  },
  {
    n: 'II',
    title: 'Cross-reference everything',
    body: 'Interviews, driving licences, club check-ins, concert seating, telephone records. No single clue narrows it to one person. The answer is where they intersect.',
  },
  {
    n: 'III',
    title: 'Sign the charge',
    body: 'Name your suspect. Get it right and they talk, and what they say opens a second case you did not know you had.',
  },
]

const CRAFT = [
  {
    title: 'Real SQLite, really in your browser',
    body: 'Not a fake parser matching strings. SQLite compiled to WebAssembly, running in a Web Worker so even a runaway join leaves the page responsive.',
  },
  {
    title: 'A city generated from a seed',
    body: 'Around 4,200 people and 50,000 supporting records (licences, memberships, check-ins, calls), reproducible byte for byte from one number.',
  },
  {
    title: 'The build proves it is solvable',
    body: 'Fourteen assertions run the intended solution against the finished database and check the row counts. An ambiguous case fails the build instead of shipping.',
  },
  {
    title: 'Devtools will not spoil it',
    body: 'No answer appears in plaintext anywhere. The database carries a hash of each answer and the next act sealed with a key derived from it.',
  },
]

export function Landing() {
  return (
    <div className="desk min-h-full">
      <header className="sticky top-0 z-20 border-b border-ink-850/80 bg-ink-950/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#/" className="font-display text-[17px] font-bold tracking-tight text-ink-100">
            The Marrowgate Ledger
          </a>
          <div className="flex items-center gap-6">
            <a
              href="#how"
              className="hidden font-mono text-[11px] tracking-[0.14em] text-ink-500 uppercase transition-colors hover:text-ink-200 sm:block"
            >
              How it plays
            </a>
            <a
              href={PLAY}
              className="rounded-md bg-brass-500 px-3.5 py-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-ink-950 uppercase transition-colors hover:bg-brass-400"
            >
              Play
            </a>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div className="animate-fade-in">
            <p className="font-mono text-[10px] font-medium tracking-[0.28em] text-brass-500 uppercase">
              Case 1114-OH · Old Harbour
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[0.95] font-bold tracking-tight text-ink-100 sm:text-6xl lg:text-7xl">
              The Marrowgate
              <br />
              Ledger
            </h1>
            <p className="mt-5 font-mono text-[11px] tracking-[0.28em] text-ink-500 uppercase">
              A SQL murder mystery
            </p>

            <p className="mt-7 max-w-lg font-typed text-[14.5px] leading-[1.8] text-ink-300">
              A man is dead under Pier 9. You are handed the whole city as a SQLite database and
              nothing else: every licence, every club door, every telephone call made this autumn.
            </p>
            <p className="mt-3 max-w-lg font-typed text-[14.5px] leading-[1.8] text-ink-500">
              Everything you need is in there. You just have to write the query that finds it.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={PLAY}
                className="rounded-md bg-brass-500 px-5 py-3 font-mono text-[12px] font-semibold tracking-[0.14em] text-ink-950 uppercase transition-all hover:bg-brass-400 active:scale-[0.99]"
              >
                Open the case file
              </a>
              <a
                href="#how"
                className="rounded-md border border-ink-700 px-5 py-3 font-mono text-[12px] font-medium tracking-[0.14em] text-ink-300 uppercase transition-colors hover:border-ink-600 hover:text-ink-100"
              >
                How it plays
              </a>
            </div>

            <p className="mt-6 font-mono text-[10.5px] tracking-[0.12em] text-ink-600 uppercase">
              Runs in your browser · No account · Nothing is uploaded
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-[1fr_1.25fr] lg:gap-6">
            <DossierCard />
            <SampleQuery />
          </div>
        </div>
      </section>

      {/* How it plays */}
      <section id="how" className="border-t border-ink-850">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <p className="font-mono text-[10px] font-medium tracking-[0.28em] text-brass-500 uppercase">
            How it plays
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight font-bold text-ink-100 sm:text-5xl">
            You are not answering questions. You are doing the work.
          </h2>

          <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step) => (
              <li key={step.n}>
                <span className="font-display text-3xl font-bold text-brass-600">{step.n}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-ink-100">{step.title}</h3>
                <p className="mt-2.5 font-typed text-[13px] leading-[1.8] text-ink-500">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Two acts */}
      <section className="border-t border-ink-850 bg-ink-950/60">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                act: 'Act I',
                title: 'The hand',
                body: 'Who killed Silas Renwick? Two witnesses, two half-remembered details, and four thousand people who might fit one of them.',
                open: true,
              },
              {
                act: 'Act II',
                title: 'The purse',
                body: 'Whoever swung it was paid. Charge the right person in Act I and they will tell you three things about the woman who hired them.',
                open: false,
              },
            ].map((card) => (
              <div
                key={card.act}
                className={`rounded-xl border p-7 ${
                  card.open ? 'border-brass-600/40 bg-brass-500/[0.05]' : 'border-ink-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-500 uppercase">
                    {card.act}
                  </span>
                  <span
                    className={`rounded-sm border px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] uppercase ${
                      card.open
                        ? 'border-brass-600/50 text-brass-400'
                        : 'border-ink-800 text-ink-700'
                    }`}
                  >
                    {card.open ? 'Open' : 'Sealed'}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold text-ink-100">{card.title}</h3>
                <p className="mt-3 font-typed text-[13px] leading-[1.8] text-ink-500">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Craft */}
      <section className="border-t border-ink-850">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <p className="font-mono text-[10px] font-medium tracking-[0.28em] text-brass-500 uppercase">
            Under the bonnet
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight font-bold text-ink-100 sm:text-5xl">
            The database is real. So is the case.
          </h2>

          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {CRAFT.map((item) => (
              <div key={item.title}>
                <h3 className="text-[15px] font-semibold text-ink-100">{item.title}</h3>
                <p className="mt-2.5 font-typed text-[13px] leading-[1.8] text-ink-500">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="rounded-2xl border border-brass-600/25 bg-gradient-to-b from-ink-900 to-ink-950 px-8 py-16 text-center sm:px-12">
          <h2 className="font-display text-4xl leading-tight font-bold text-ink-100 sm:text-5xl">
            Somebody in this city did it.
          </h2>
          <p className="mx-auto mt-4 max-w-md font-typed text-[14px] leading-[1.8] text-ink-500">
            The records do not lie. People do. You have about forty minutes and four thousand
            suspects.
          </p>
          <a
            href={PLAY}
            className="mt-9 inline-block rounded-md bg-brass-500 px-6 py-3 font-mono text-[12px] font-semibold tracking-[0.14em] text-ink-950 uppercase transition-all hover:bg-brass-400 active:scale-[0.99]"
          >
            Open the case file
          </a>
        </div>
      </section>

      <footer className="border-t border-ink-850">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 font-mono text-[11px] tracking-[0.1em] text-ink-600 uppercase sm:flex-row sm:px-8">
          <p>Built by Tomisin Adeyinka</p>
          <a
            href="https://adeyinkatomisin.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink-300"
          >
            adeyinkatomisin.netlify.app
          </a>
        </div>
      </footer>
    </div>
  )
}
