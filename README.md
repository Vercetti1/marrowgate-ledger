# The Marrowgate Ledger

A SQL murder mystery. You are handed a fictional port city as a SQLite database
and nothing else, and you have to write queries until you know who did it.

The database runs entirely in the browser — there is no backend, no API and no
network call after the initial page load.

> **Play:** _(deploy and drop the link here)_

<!-- TODO: add a screenshot or a short GIF of a query resolving to a single suspect. -->

---

## How it plays

The briefing gives you three facts: a murder, a date, and a district. Everything
else has to be dug out of twelve tables — crime scene reports, interview
transcripts, driving licences, club check-ins, concert seating, telephone
records — by joining them together.

There are two acts. Naming the killer unlocks a confession, which becomes a real
row in a `confession` table you can query like any other evidence, and that
confession is the only lead into the second act.

## Why I built it this way

Four things in here were more interesting than the game itself.

### 1. The case is generated, and the generator proves the case is solvable

`scripts/generate-db.ts` builds the database from a single seed, so it is
byte-reproducible. Roughly 4,200 people and 45,000 supporting rows are generated
randomly — but under constraints, because random background data will happily
ruin a puzzle. No background number plate may contain the fragment a witness
remembered; no background membership id may start with the prefix she recalled;
no unplanted person may have attended all four recitals.

Decoys are then planted deliberately so that **no single clue is sufficient**.
Four people hold the right club tier with the wrong car. Three hold the right
car with the wrong tier. Exactly one holds both.

The important part is the last section of the script. It runs the intended
solution queries against the finished database and asserts on the row counts:

```
verifying the case is solvable and unambiguous:
  ok  exactly one crime scene report matches the murder
  ok  the last house on the witness street resolves to one person
  ok  only one Adaeze holds a club membership
  ok  the membership clue alone is not enough
  ok  the plate clue alone is not enough
  ok  membership and plate together identify exactly one person
  ...
```

If a change to the data ever makes the mystery ambiguous or unsolvable, the
build fails instead of shipping a broken puzzle. Fourteen assertions cover both
acts, in both directions: each clue must narrow the field, and no clue may narrow
it to one on its own.

### 2. The answers are not in the bundle

The obvious way to check an accusation is to compare it against a string. That
puts the murderer's name in the JavaScript, where anyone can find it in about
four seconds.

Instead the database ships a `case_seal` table holding a SHA-256 commitment to
each answer, and the next act's prose XOR-encrypted with a keystream derived
from that same answer (`src/lib/seal.ts`). A correct accusation is the key: it
verifies against the hash *and* decrypts the confession. Neither the bundle nor
the database contains a plaintext spoiler, so a curious player can't ruin the
puzzle for themselves by opening devtools.

It is obfuscation rather than security — the point is spoiler-resistance, not
secrecy — and it costs about sixty lines.

### 3. SQLite runs in a worker, so the player can't lock the tab

Players write exploratory SQL, and exploratory SQL includes
`SELECT COUNT(*) FROM person a, person b, person c` — seventy-four billion rows.
On the main thread that freezes the page with no way out.

sql.js has no way to interrupt a running statement, so cancellation means
terminating the worker. That loses the in-memory database, including the
confession the player has already earned — so `CaseDatabase` records every write
the game makes and replays it against the fresh worker. Cancelling a runaway
query costs you nothing.

### 4. The story is played, not printed

Early on the whole thing looked like a code editor with a plot stapled to the
side, which is the wrong answer for a murder mystery. The presentation is now
built around two ideas.

**Two materials.** The case file is paper — warm, ruled, typed in Courier, and
rubber-stamped when an act closes. The query side is ink and brass inside faux
desktop window chrome. A physical dossier next to a police terminal, on one
desk. The window's traffic lights are `aria-hidden` ornaments rather than
controls wired to fake behaviour, because a control that looks real and does
nothing is worse than an ornament that admits it.

**A dialogue box.** Story beats play through a visual-novel box: Insp. Vance
hands you the case, rebukes a bad charge, and Cassian Vole delivers his own
confession in his own voice. The confession still arrives from the sealed
payload in the database and is only turned into dialogue once it is unlocked, so
the narrative layer holds no spoilers either.

Two details worth the words. The typewriter derives its character count from
elapsed time rather than accumulating one per tick — a per-character
`setInterval` silently loses to render cost, and a `requestAnimationFrame` loop
stops dead in a hidden tab, so a player who switched away mid-scene would come
back to a frozen line. And the charge sheet reports nothing itself: it takes the
name and closes, because a native `<dialog>` renders in the top layer and would
have covered the scene playing underneath it. Outcomes have one home.

### 5. Autocomplete comes from the actual database

The worker reads `sqlite_master` and `PRAGMA table_info` on boot and hands the
schema back to the client, which feeds it to both the schema browser and
CodeMirror's SQL completions. Table and column suggestions can't drift out of
step with the data, because they *are* the data.

## Stack

| | |
|---|---|
| Language | TypeScript, `strict` |
| UI | React 19, Tailwind CSS v4 |
| Editor | CodeMirror 6 (`@codemirror/lang-sql`, SQLite dialect, custom theme) |
| Database | SQLite via sql.js (WebAssembly), in a module Web Worker |
| Type | Playfair Display, Courier Prime, JetBrains Mono, Inter |
| Motion | CSS keyframes only — no animation library |
| Build | Vite 8 |
| Tests | Vitest, plus the generator's own assertions |

No state management library — the whole game is one hook (`useCaseFile`) over a
worker client.

## Running it

```bash
npm install
npm run db:generate   # builds public/marrowgate.db and asserts the case holds
npm run dev
```

| Script | |
|---|---|
| `npm run dev` | Dev server |
| `npm run db:generate` | Regenerate the database and verify the case |
| `npm run test` | Unit tests |
| `npm run typecheck` | `tsc -b` |
| `npm run build` | Generate the database, typecheck, then bundle |

The database is a build artefact and is not committed — `npm run build`
regenerates it, so a clean checkout builds without extra steps.

## Layout

```
scripts/
  generate-db.ts        world generation, clue planting, solvability assertions
  data/case.ts          the case: cast, clues, transcripts, hints  (build-time only)
  data/pools.ts         name and attribute pools for background records
src/
  lib/seal.ts           SHA-256 commitments + keystream sealing of the answers
  lib/db.worker.ts      sql.js, schema introspection, row-capped queries
  lib/db.ts             worker client: request routing, cancel, write replay
  game/case.ts          reading the case out of the database, accusation checking
  game/dialogue.ts      speakers and the static script (no spoilers)
  game/useCaseFile.ts   game state, progress persistence, scene triggers
  components/
    DialogueBox.tsx     visual-novel box: typewriter, queue, skip
    Window.tsx          faux desktop window chrome
    CaseFilePanel.tsx   the paper dossier
    SchemaPanel.tsx     register of holdings
    QueryEditor.tsx     CodeMirror surface
    editorTheme.ts      brass-on-ink syntax theme
    ResultsGrid.tsx     row-capped, staggered results table
    AccusationDialog.tsx  the charge sheet
```

`scripts/data/case.ts` holds the solution and is imported only by the generator,
so it never reaches the browser.

## Things I would do next

- Move the results grid to virtualised rows; it currently caps at 2,000.
- Code-split CodeMirror, which is most of the 210 kB gzipped bundle.
- Self-host the four typefaces instead of hitting Google Fonts.
- Character portraits in the dialogue box; the monogram plates are a stand-in.
- A second case, to find out how much of the generator is actually reusable.
