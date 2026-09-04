/**
 * Builds public/marrowgate.db.
 *
 * Everything is derived from a single seed, so the database is byte-reproducible.
 * Background records are generated under constraints that make the planted clue
 * chain the *only* chain that resolves — and the script asserts exactly that at
 * the end by running the intended solution queries and checking the row counts.
 * If a change to the data ever makes the case ambiguous or unsolvable, the build
 * fails instead of shipping a broken puzzle.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'
import { answerHash, seal } from '../src/lib/seal.ts'
import * as CASE from './data/case.ts'
import {
  CARS,
  CLUB_TIERS,
  DISTRICTS,
  EMPLOYERS,
  EYE_COLOURS,
  FIRST_NAMES,
  HAIR_COLOURS,
  JOB_TITLES,
  LAST_NAMES,
  OTHER_CRIME_TYPES,
  STREETS,
} from './data/pools.ts'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const OUT_FILE = path.join(ROOT, 'public', 'marrowgate.db')
const SEED = 0xc0ffee

const BACKGROUND_PEOPLE = 4200
const LICENCE_RATE = 0.72
const MEMBERSHIP_RATE = 0.28
const CHECKIN_COUNT = 9000
const ATTENDANCE_COUNT = 11000
const CALL_COUNT = 12000

// ---------------------------------------------------------------------------
// Deterministic randomness
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = mulberry32(SEED)
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1))
const pick = <T,>(items: readonly T[]): T => items[int(0, items.length - 1)]!
const chance = (p: number) => random() < p

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = int(0, i)
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
const token = (length: number) =>
  Array.from({ length }, () => ALNUM[int(0, ALNUM.length - 1)]).join('')

/** Rejection sampling: keeps generating until the value clears a constraint. */
function until<T>(make: () => T, ok: (value: T) => boolean): T {
  for (let attempt = 0; attempt < 10_000; attempt++) {
    const value = make()
    if (ok(value)) return value
  }
  throw new Error('rejection sampling failed to converge')
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function randomAutumnDate(): string {
  const month = pick([9, 10, 11])
  return isoDate(2025, month, int(1, month === 11 ? 28 : 30))
}

function randomTime(minHour = 6, maxHour = 23): string {
  return `${String(int(minHour, maxHour)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Specs
// ---------------------------------------------------------------------------

type Tier = (typeof CLUB_TIERS)[number]

interface LicenceSpec {
  age: number
  heightCm: number
  eyeColour: string
  hairColour: string
  gender: string
  plateNumber: string
  carMake: string
  carModel: string
}

interface PersonSpec {
  name: string
  addressNumber: number
  street: string
  /** undefined = decide randomly, null = deliberately unlicensed. */
  licence?: Partial<LicenceSpec> | null
  membership?: { id: string; tier: Tier } | null
  employment?: { employer: string; jobTitle: string }
  /** Pins how many of the four autumn recitals this person attended. */
  recitals?: number
  excludeFromCalls?: boolean

  // Filled in later.
  id?: number
  licenceId?: number | null
  nationalId?: string
  phoneNumber?: string
}

const P = CASE.PLANTED

// ---------------------------------------------------------------------------
// Background population
// ---------------------------------------------------------------------------

// Cast names are held back so that every cast member is unambiguous: there is
// exactly one Vole in Marrowgate, and every Adaeze is planted on purpose.
const RESERVED_FIRST = new Set(['Adaeze'])
const RESERVED_LAST = new Set(['Vole', 'Falk', 'Quist', 'Renwick', 'Nwachukwu'])

const firstNames = FIRST_NAMES.filter((n) => !RESERVED_FIRST.has(n))
const lastNames = LAST_NAMES.filter((n) => !RESERVED_LAST.has(n))

const allCombinations = firstNames.flatMap((first) => lastNames.map((last) => `${first} ${last}`))
if (allCombinations.length < BACKGROUND_PEOPLE) {
  throw new Error(`name pool too small: ${allCombinations.length} < ${BACKGROUND_PEOPLE}`)
}

const background: PersonSpec[] = shuffle(allCombinations)
  .slice(0, BACKGROUND_PEOPLE)
  .map((name) => {
    const street = pick(STREETS)
    return {
      name,
      street,
      // Nobody on Cobbler's Row may out-number the witness in the last house.
      addressNumber:
        street === P.witnessStreet ? int(1, P.witnessStreetCeiling) : int(1, 340),
    }
  })

// ---------------------------------------------------------------------------
// Decoys — near misses that make each single clue insufficient on its own
// ---------------------------------------------------------------------------

const decoyOrder = shuffle(background.map((_, index) => index))
let decoyCursor = 0
const nextDecoy = (): PersonSpec => background[decoyOrder[decoyCursor++]!]!

/** Right membership prefix and tier, wrong plate. */
for (const membershipId of ['4BQ2M', '4B9XW', '4BZ04', '4BH8T']) {
  const person = nextDecoy()
  person.membership = { id: membershipId, tier: 'platinum' }
}

/** Right membership prefix, wrong tier. */
for (const [membershipId, tier] of [
  ['4BX15', 'gold'],
  ['4BM3P', 'silver'],
  ['4BT7R', 'bronze'],
] as const) {
  const person = nextDecoy()
  person.membership = { id: membershipId, tier }
}

/** Right plate fragment, no club membership at all. */
for (const plateNumber of ['K7Q3LZ', 'T9K7QD']) {
  const person = nextDecoy()
  person.licence = { plateNumber }
  person.membership = null
}

/** Right plate fragment and a membership, but the wrong prefix and tier. */
{
  const person = nextDecoy()
  person.licence = { plateNumber: 'RK7Q88' }
  person.membership = { id: '9CW2E', tier: 'gold' }
}

/** Matches the mastermind's description but did not attend every recital. */
for (const [heightCm, recitals] of [
  [170, 1],
  [171, 3],
  [172, 2],
] as const) {
  const person = nextDecoy()
  person.licence = {
    hairColour: P.mastermindHairColour,
    heightCm,
    carMake: 'Volvo',
    carModel: 'V70',
    gender: 'female',
  }
  person.recitals = recitals
}

/** Attended every recital, but looks nothing like the description. */
for (const [hairColour, heightCm, carMake] of [
  ['brown', 164, 'Saab'],
  ['blonde', 178, 'Citroen'],
  ['black', 158, 'Peugeot'],
  ['grey', 181, 'Rover'],
] as const) {
  const person = nextDecoy()
  person.licence = { hairColour, heightCm, carMake, carModel: pick(['900', 'DS', '405', '75']) }
  person.recitals = P.recitalCount
}

/** Red hair and the right height, every recital — but the wrong marque. */
for (const heightCm of [171, 170] as const) {
  const person = nextDecoy()
  person.licence = {
    hairColour: P.mastermindHairColour,
    heightCm,
    carMake: 'Saab',
    carModel: '900',
    gender: 'female',
  }
  person.recitals = P.recitalCount
}

/** Extra Adaezes, so the second witness must be found by her club membership. */
const adaezeDecoys: PersonSpec[] = [
  'Adaeze Okonjo',
  'Adaeze Ijeoma',
  'Adaeze Sowande',
  'Adaeze Balliol',
  'Adaeze Fairweather',
  'Adaeze Larkspur',
].map((name) => ({
  name,
  street: pick(STREETS.filter((s) => s !== P.witnessStreet)),
  addressNumber: int(1, 340),
  membership: null,
}))

// ---------------------------------------------------------------------------
// Cast
// ---------------------------------------------------------------------------

const victim: PersonSpec = {
  name: CASE.CAST.victim,
  street: 'Ferrymans Walk',
  addressNumber: 11,
  employment: { employer: 'Marrowgate Port Authority', jobTitle: 'customs auditor' },
  membership: null,
  recitals: 0,
  excludeFromCalls: true,
}

const witnessAddress: PersonSpec = {
  name: CASE.CAST.witnessAddress,
  street: P.witnessStreet,
  addressNumber: P.witnessHouseNumber,
  licence: { age: 71, heightCm: 168, hairColour: 'white', gender: 'male' },
  membership: null,
  employment: { employer: 'Independent', jobTitle: 'night watchman' },
  recitals: 0,
}

const witnessClub: PersonSpec = {
  name: CASE.CAST.witnessClub,
  street: 'Kelp Street',
  addressNumber: 48,
  membership: { id: 'W20QF', tier: 'gold' },
  employment: { employer: 'Old Harbour Rowing Club', jobTitle: 'clerk' },
  recitals: 1,
}

const killer: PersonSpec = {
  name: CASE.CAST.killer,
  street: 'Gallowgate',
  addressNumber: 204,
  licence: {
    age: 38,
    heightCm: P.killerHeightCm,
    eyeColour: 'grey',
    hairColour: 'black',
    gender: 'male',
    plateNumber: P.killerPlate,
    carMake: 'Ford',
    carModel: 'Granada',
  },
  membership: { id: P.killerMembershipId, tier: P.killerMembershipTier },
  employment: { employer: 'Independent', jobTitle: 'stevedore' },
  recitals: 0,
  excludeFromCalls: true,
}

const mastermind: PersonSpec = {
  name: CASE.CAST.mastermind,
  street: 'Vantry Hill Terrace',
  addressNumber: 1,
  licence: {
    age: 54,
    heightCm: P.mastermindHeightCm,
    eyeColour: 'green',
    hairColour: P.mastermindHairColour,
    gender: 'female',
    carMake: P.mastermindCarMake,
    carModel: P.mastermindCarModel,
  },
  membership: { id: 'PF001', tier: 'platinum' },
  employment: { employer: 'Falk Shipping & Bonded Stores', jobTitle: 'shipping agent' },
  recitals: P.recitalCount,
  excludeFromCalls: true,
}

const CAST_MEMBERS = new Set<PersonSpec>([victim, witnessAddress, witnessClub, killer, mastermind])

const people: PersonSpec[] = shuffle([
  ...background,
  ...adaezeDecoys,
  victim,
  witnessAddress,
  witnessClub,
  killer,
  mastermind,
])

// ---------------------------------------------------------------------------
// Derive the remaining columns
// ---------------------------------------------------------------------------

/** Draws values until it finds one not already taken, then reserves it. */
function uniqueValue(seen: Set<string>, make: () => string): string {
  const value = until(make, (candidate) => !seen.has(candidate))
  seen.add(value)
  return value
}

const usedNationalIds = new Set<string>()
const usedPhones = new Set<string>()

people.forEach((person, index) => {
  person.id = 1000 + index
  person.nationalId = uniqueValue(usedNationalIds, () =>
    String(int(100_000_000, 999_999_999)),
  )
  person.phoneNumber = uniqueValue(
    usedPhones,
    () => `MG-${String(int(100, 989)).padStart(3, '0')}-${String(int(1000, 9999))}`,
  )
})

interface LicenceRow extends LicenceSpec {
  id: number
}

const usedPlates = new Set<string>([P.killerPlate, 'K7Q3LZ', 'T9K7QD', 'RK7Q88'])
const licences: LicenceRow[] = []
let nextLicenceId = 100_000

for (const person of people) {
  const wantsLicence = person.licence === null ? false : person.licence ? true : chance(LICENCE_RATE)
  if (!wantsLicence) {
    person.licenceId = null
    continue
  }

  const [carMake, carModels] = pick(CARS)
  const base: LicenceSpec = {
    age: int(18, 84),
    heightCm: int(150, 200),
    eyeColour: pick(EYE_COLOURS),
    hairColour: pick(HAIR_COLOURS),
    gender: pick(['female', 'male']),
    // Background plates must never contain the fragment the witness remembered.
    plateNumber: until(
      () => token(6),
      (value) => !value.includes(P.killerPlateFragment) && !usedPlates.has(value),
    ),
    carMake,
    carModel: pick(carModels),
  }
  usedPlates.add(base.plateNumber)

  const row: LicenceRow = { id: nextLicenceId++, ...base, ...(person.licence ?? {}) }
  licences.push(row)
  person.licenceId = row.id
}

// ---------------------------------------------------------------------------
// Club memberships and check-ins
// ---------------------------------------------------------------------------

interface MembershipRow {
  id: string
  personId: number
  tier: Tier
  startDate: string
}

const usedMembershipIds = new Set<string>()
const memberships: MembershipRow[] = []

for (const person of people) {
  let assigned = person.membership
  if (assigned === null) continue
  if (assigned === undefined) {
    if (!chance(MEMBERSHIP_RATE)) continue
    assigned = {
      // Background ids must never collide with the prefix the witness recalled.
      id: until(
        () => token(5),
        (value) => !value.startsWith(P.killerMembershipPrefix) && !usedMembershipIds.has(value),
      ),
      tier: pick(CLUB_TIERS),
    }
  }
  usedMembershipIds.add(assigned.id)
  memberships.push({
    id: assigned.id,
    personId: person.id!,
    tier: assigned.tier,
    startDate: isoDate(int(2011, 2025), int(1, 12), int(1, 28)),
  })
}

interface CheckinRow {
  membershipId: string
  checkInDate: string
  checkInTime: string
  checkOutTime: string | null
}

const checkins: CheckinRow[] = []
for (let i = 0; i < CHECKIN_COUNT; i++) {
  const membership = pick(memberships)
  if (membership.id === P.killerMembershipId) continue
  const checkInTime = randomTime(6, 22)
  const forgotToSwipeOut = chance(0.04)
  checkins.push({
    membershipId: membership.id,
    checkInDate: randomAutumnDate(),
    checkInTime,
    checkOutTime: forgotToSwipeOut
      ? null
      : `${String(Math.min(23, Number(checkInTime.slice(0, 2)) + int(1, 2))).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}`,
  })
}

// The killer's own visit: late, on the night, and never swiped out.
checkins.push({
  membershipId: P.killerMembershipId,
  checkInDate: CASE.CRIME_DATE,
  checkInTime: P.killerCheckInTime,
  checkOutTime: null,
})

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

interface EventRow {
  eventId: number
  name: string
  venue: string
  date: string
}

const events: EventRow[] = []
let nextEventId = 500

const recitalDates = ['2025-09-19', '2025-10-03', '2025-10-24', '2025-11-07']
const recitalIds: number[] = []
recitalDates.forEach((date, index) => {
  const eventId = nextEventId++
  recitalIds.push(eventId)
  events.push({
    eventId,
    name: `${P.recitalSeriesPrefix} ${['I', 'II', 'III', 'IV'][index]}`,
    venue: 'Vellum Street Assembly Rooms',
    date,
  })
})

for (const name of [
  'Marrowgate Boat Show',
  'Brasswick Foundry Centenary',
  'Old Harbour Regatta',
  'Gallowgate Assize Ball',
  'Kelp Street Winter Market',
  'Cinderfield Cycle Criterium',
  'The Marrowgate Courier Press Dinner',
  'Tidal Hospital Charity Gala',
  'Saltmarsh Bird Count',
  'Vantry Hill Fireworks',
  'Corvid Syndicate Annual Lunch',
  'Marrowgate Chess Open',
  'Ropewalk Craft Fair',
  'Dunmoor Steeplechase',
  'Elsgate Film Festival',
]) {
  events.push({
    eventId: nextEventId++,
    name,
    venue: pick(['Vellum Street Assembly Rooms', 'The Gilded Anchor', 'Pier 9 Pavilion', 'Gallowgate Hall']),
    date: randomAutumnDate(),
  })
}

const nonRecitalEvents = events.filter((e) => !recitalIds.includes(e.eventId))

interface AttendanceRow {
  attendanceId: number
  eventId: number
  personId: number
  seat: string
}

const attendance: AttendanceRow[] = []
let nextAttendanceId = 9000
const seat = () => `${pick(['A', 'B', 'C', 'D', 'E', 'F', 'G'])}${int(1, 40)}`

for (const person of people) {
  // Only people with a pinned count may reach all four recitals; everyone else
  // is capped at three, which keeps the "attended all four" clue decisive.
  const recitals = person.recitals ?? int(0, 3)
  for (const eventId of shuffle(recitalIds).slice(0, recitals)) {
    attendance.push({ attendanceId: nextAttendanceId++, eventId, personId: person.id!, seat: seat() })
  }
}

for (let i = 0; i < ATTENDANCE_COUNT; i++) {
  attendance.push({
    attendanceId: nextAttendanceId++,
    eventId: pick(nonRecitalEvents).eventId,
    personId: pick(people).id!,
    seat: seat(),
  })
}

// ---------------------------------------------------------------------------
// Telephone records
// ---------------------------------------------------------------------------

interface CallRow {
  callId: number
  callerId: number
  receiverId: number
  date: string
  time: string
  durationSeconds: number
}

const calls: CallRow[] = []
let nextCallId = 70_000
const callable = people.filter((person) => !person.excludeFromCalls)

for (let i = 0; i < CALL_COUNT; i++) {
  const caller = pick(callable)
  const receiver = until(
    () => pick(callable),
    (candidate) => candidate.id !== caller.id,
  )
  calls.push({
    callId: nextCallId++,
    callerId: caller.id!,
    receiverId: receiver.id!,
    date: randomAutumnDate(),
    time: randomTime(7, 23),
    durationSeconds: int(12, 1800),
  })
}

// The three calls that hang the mastermind, plus enough ordinary traffic around
// the pair that neither number looks conspicuously empty.
for (const [date, time, duration] of [
  ['2025-11-10', '21:14', 96],
  ['2025-11-11', '22:02', 41],
  ['2025-11-13', '20:47', 158],
] as const) {
  calls.push({
    callId: nextCallId++,
    callerId: mastermind.id!,
    receiverId: killer.id!,
    date,
    time,
    durationSeconds: duration,
  })
}

for (let i = 0; i < 9; i++) {
  const other = pick(callable)
  calls.push({
    callId: nextCallId++,
    callerId: mastermind.id!,
    receiverId: other.id!,
    date: randomAutumnDate(),
    time: randomTime(9, 20),
    durationSeconds: int(30, 900),
  })
}

for (const [callerSpec, date] of [
  [killer, '2025-10-02'],
  [killer, '2025-10-19'],
  [killer, '2025-11-02'],
] as const) {
  calls.push({
    callId: nextCallId++,
    callerId: callerSpec.id!,
    receiverId: pick(callable).id!,
    date,
    time: randomTime(9, 21),
    durationSeconds: int(30, 600),
  })
}

// ---------------------------------------------------------------------------
// Income, employment, interviews, reports
// ---------------------------------------------------------------------------

const incomes = people
  .filter(() => chance(0.7))
  .map((person) => ({ nationalId: person.nationalId!, annualIncome: int(9_000, 210_000) }))
incomes.push({ nationalId: mastermind.nationalId!, annualIncome: 1_480_000 })

const employments = people.map((person) => {
  const pinned = person.employment
  return {
    personId: person.id!,
    employer: pinned?.employer ?? pick(EMPLOYERS),
    jobTitle: pinned?.jobTitle ?? pick(JOB_TITLES),
    startYear: int(1998, 2025),
  }
})

const interviews: Array<{ personId: number; transcript: string }> = [
  { personId: witnessAddress.id!, transcript: CASE.INTERVIEWS.witnessAddress },
  { personId: witnessClub.id!, transcript: CASE.INTERVIEWS.witnessClub },
]

const FILLER_INTERVIEWS = [
  'I have told the constable twice already. I was at the market all morning and half the stalls will say so.',
  'The tram was late, as it always is. I saw nothing worth writing down.',
  'My brother borrowed the van in October and I have not seen it since. That is the whole of my statement.',
  'There was shouting on the landing but there is always shouting on the landing.',
  'I keep the books for the chandlery. If money went missing it did not go through me.',
  'I found the door open and the lock scratched. I did not go inside.',
  'He owed me eleven pounds. I would hardly kill a man over eleven pounds.',
  'I was rowing until dusk. Ask the club, they log everyone in and out.',
  'The dog barked around two but the dog barks at gulls.',
  'I signed for the delivery and thought nothing of it until you telephoned.',
  'I do not know the woman in the photograph and I resent the suggestion that I do.',
  'The smell of smoke woke me. By the time I was at the window the yard was already alight.',
  'My husband was with me the entire evening. We were listening to the wireless.',
  'I sold him the rope. People buy rope in a port town.',
]

const fillerInterviewees = shuffle(
  people.filter((person) => !CAST_MEMBERS.has(person)),
).slice(0, 44)

for (const person of fillerInterviewees) {
  interviews.push({ personId: person.id!, transcript: pick(FILLER_INTERVIEWS) })
}

interface ReportRow {
  reportId: number
  date: string
  type: string
  district: string
  description: string
}

const reports: ReportRow[] = [
  {
    reportId: 1,
    date: CASE.CRIME_DATE,
    type: 'murder',
    district: CASE.CRIME_DISTRICT,
    description: CASE.CRIME_SCENE_DESCRIPTION,
  },
]

const FILLER_REPORTS = [
  'Warehouse door forced overnight. Two crates of bonded spirits missing. No witnesses came forward.',
  'Fire in a disused net loft. Arson suspected; a paraffin can was recovered from the alley.',
  'Complainant reports letters demanding money in exchange for silence about a debt.',
  'Public disorder outside a public house at closing time. Three arrests, no charges.',
  'Body recovered from the tidal basin. Coroner recorded misadventure.',
  'Counterfeit manifests presented at the customs house. Clerk detained and released.',
  'Assault on a tram conductor during a fare dispute. Assailant fled on foot.',
  'Bicycle theft from outside the library. Recovered the following week in Cinderfield.',
  'Shots reported near the foundry wall. Nothing found on search.',
  'Woman reports being followed home along Ropewalk on three consecutive evenings.',
]

let nextReportId = 2
for (let i = 0; i < 44; i++) {
  // Decoy murders exist, but never on the night in the Old Harbour.
  const type = pick([...OTHER_CRIME_TYPES, 'murder'])
  const district = pick(DISTRICTS)
  const date =
    type === 'murder' && district === CASE.CRIME_DISTRICT
      ? isoDate(2025, 10, int(1, 30))
      : randomAutumnDate()
  reports.push({
    reportId: nextReportId++,
    date,
    type,
    district,
    description: pick(FILLER_REPORTS),
  })
}

// ---------------------------------------------------------------------------
// Write the database
// ---------------------------------------------------------------------------

const SQL = await initSqlJs({
  locateFile: () => path.join(ROOT, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
})
const db = new SQL.Database()

db.run(`
CREATE TABLE person (
  id                  INTEGER PRIMARY KEY,
  name                TEXT    NOT NULL,
  national_id         TEXT    NOT NULL UNIQUE,
  licence_id          INTEGER,
  address_number      INTEGER NOT NULL,
  address_street_name TEXT    NOT NULL,
  phone_number        TEXT    NOT NULL UNIQUE
);

CREATE TABLE drivers_licence (
  id           INTEGER PRIMARY KEY,
  age          INTEGER,
  height_cm    INTEGER,
  eye_colour   TEXT,
  hair_colour  TEXT,
  gender       TEXT,
  plate_number TEXT,
  car_make     TEXT,
  car_model    TEXT
);

CREATE TABLE crime_scene_report (
  report_id   INTEGER PRIMARY KEY,
  date        TEXT,
  type        TEXT,
  district    TEXT,
  description TEXT
);

CREATE TABLE interview (
  person_id  INTEGER,
  transcript TEXT
);

CREATE TABLE confession (
  person_id  INTEGER,
  transcript TEXT
);

CREATE TABLE club_membership (
  id         TEXT PRIMARY KEY,
  person_id  INTEGER,
  tier       TEXT,
  start_date TEXT
);

CREATE TABLE club_checkin (
  membership_id  TEXT,
  check_in_date  TEXT,
  check_in_time  TEXT,
  check_out_time TEXT
);

CREATE TABLE event (
  event_id INTEGER PRIMARY KEY,
  name     TEXT,
  venue    TEXT,
  date     TEXT
);

CREATE TABLE event_attendance (
  attendance_id INTEGER PRIMARY KEY,
  event_id      INTEGER,
  person_id     INTEGER,
  seat          TEXT
);

CREATE TABLE phone_call (
  call_id          INTEGER PRIMARY KEY,
  caller_id        INTEGER,
  receiver_id      INTEGER,
  date             TEXT,
  time             TEXT,
  duration_seconds INTEGER
);

CREATE TABLE income (
  national_id   TEXT PRIMARY KEY,
  annual_income INTEGER
);

CREATE TABLE employment (
  person_id  INTEGER,
  employer   TEXT,
  job_title  TEXT,
  start_year INTEGER
);

CREATE TABLE case_seal (
  stage       TEXT PRIMARY KEY,
  prompt      TEXT,
  answer_hash TEXT,
  payload     TEXT
);

CREATE TABLE hint (
  stage   TEXT,
  ordinal INTEGER,
  text    TEXT
);

CREATE INDEX idx_person_licence   ON person (licence_id);
CREATE INDEX idx_person_street    ON person (address_street_name);
CREATE INDEX idx_membership_person ON club_membership (person_id);
CREATE INDEX idx_checkin_member   ON club_checkin (membership_id);
CREATE INDEX idx_attendance_person ON event_attendance (person_id);
CREATE INDEX idx_attendance_event ON event_attendance (event_id);
CREATE INDEX idx_call_receiver    ON phone_call (receiver_id);
`)

function insertMany(sql: string, rows: ReadonlyArray<ReadonlyArray<unknown>>): void {
  const statement = db.prepare(sql)
  for (const row of rows) statement.run(row as never)
  statement.free()
}

db.run('BEGIN')

insertMany('INSERT INTO person VALUES (?,?,?,?,?,?,?)', people.map((p) => [
  p.id, p.name, p.nationalId, p.licenceId, p.addressNumber, p.street, p.phoneNumber,
]))

insertMany('INSERT INTO drivers_licence VALUES (?,?,?,?,?,?,?,?,?)', licences.map((l) => [
  l.id, l.age, l.heightCm, l.eyeColour, l.hairColour, l.gender, l.plateNumber, l.carMake, l.carModel,
]))

insertMany('INSERT INTO crime_scene_report VALUES (?,?,?,?,?)', reports.map((r) => [
  r.reportId, r.date, r.type, r.district, r.description,
]))

insertMany('INSERT INTO interview VALUES (?,?)', interviews.map((i) => [i.personId, i.transcript]))

insertMany('INSERT INTO club_membership VALUES (?,?,?,?)', memberships.map((m) => [
  m.id, m.personId, m.tier, m.startDate,
]))

insertMany('INSERT INTO club_checkin VALUES (?,?,?,?)', checkins.map((c) => [
  c.membershipId, c.checkInDate, c.checkInTime, c.checkOutTime,
]))

insertMany('INSERT INTO event VALUES (?,?,?,?)', events.map((e) => [e.eventId, e.name, e.venue, e.date]))

insertMany('INSERT INTO event_attendance VALUES (?,?,?,?)', attendance.map((a) => [
  a.attendanceId, a.eventId, a.personId, a.seat,
]))

insertMany('INSERT INTO phone_call VALUES (?,?,?,?,?,?)', calls.map((c) => [
  c.callId, c.callerId, c.receiverId, c.date, c.time, c.durationSeconds,
]))

insertMany('INSERT INTO income VALUES (?,?)', incomes.map((i) => [i.nationalId, i.annualIncome]))

insertMany('INSERT INTO employment VALUES (?,?,?,?)', employments.map((e) => [
  e.personId, e.employer, e.jobTitle, e.startYear,
]))

insertMany('INSERT INTO hint VALUES (?,?,?)', CASE.HINTS.map((h) => [h.stage, h.ordinal, h.text]))

insertMany('INSERT INTO case_seal VALUES (?,?,?,?)', [
  [
    'killer',
    'Name the person who killed Silas Renwick.',
    await answerHash(CASE.CAST.killer),
    await seal(CASE.CAST.killer, CONFESSION_PAYLOAD()),
  ],
  [
    'mastermind',
    'Name the person who paid for the killing.',
    await answerHash(CASE.CAST.mastermind),
    await seal(CASE.CAST.mastermind, EPILOGUE_PAYLOAD()),
  ],
])

db.run('COMMIT')

/** The killer's confession, plus the row the app inserts once it is unlocked. */
function CONFESSION_PAYLOAD(): string {
  return JSON.stringify({ personId: killer.id, transcript: CASE.CONFESSION })
}

function EPILOGUE_PAYLOAD(): string {
  return JSON.stringify({ personId: mastermind.id, transcript: CASE.EPILOGUE })
}

// ---------------------------------------------------------------------------
// Assertions: the case must be solvable, and solvable only one way
// ---------------------------------------------------------------------------

function queryColumn(sql: string): unknown[] {
  const statement = db.prepare(sql)
  const values: unknown[] = []
  while (statement.step()) values.push(statement.get()[0])
  statement.free()
  return values
}

function expect(label: string, sql: string, expected: readonly unknown[]): void {
  const actual = queryColumn(sql)
  const same =
    actual.length === expected.length && expected.every((value, i) => value === actual[i])
  if (!same) {
    throw new Error(
      `case assertion failed — ${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`,
    )
  }
  console.log(`  ok  ${label}`)
}

console.log('\nverifying the case is solvable and unambiguous:')

expect(
  'exactly one crime scene report matches the murder',
  `SELECT COUNT(*) FROM crime_scene_report
   WHERE type = 'murder' AND date = '${CASE.CRIME_DATE}' AND district = '${CASE.CRIME_DISTRICT}'`,
  [1],
)

expect(
  'the last house on the witness street resolves to one person',
  `SELECT name FROM person
   WHERE address_street_name = '${P.witnessStreet.replace(/'/g, "''")}'
   ORDER BY address_number DESC LIMIT 1`,
  [CASE.CAST.witnessAddress],
)

expect(
  'only one Adaeze holds a club membership',
  `SELECT p.name FROM person p
   JOIN club_membership m ON m.person_id = p.id
   WHERE p.name LIKE 'Adaeze%'`,
  [CASE.CAST.witnessClub],
)

expect(
  'several Adaezes exist, so the join is necessary',
  `SELECT COUNT(*) > 3 FROM person WHERE name LIKE 'Adaeze%'`,
  [1],
)

expect(
  'both witnesses have an interview on file',
  `SELECT COUNT(*) FROM interview i JOIN person p ON p.id = i.person_id
   WHERE p.name IN ('${CASE.CAST.witnessAddress}', '${CASE.CAST.witnessClub}')`,
  [2],
)

expect(
  'the membership clue alone is not enough',
  `SELECT COUNT(*) > 1 FROM club_membership
   WHERE id LIKE '${P.killerMembershipPrefix}%' AND tier = '${P.killerMembershipTier}'`,
  [1],
)

expect(
  'the plate clue alone is not enough',
  `SELECT COUNT(*) > 1 FROM drivers_licence WHERE plate_number LIKE '%${P.killerPlateFragment}%'`,
  [1],
)

expect(
  'membership and plate together identify exactly one person',
  `SELECT p.name FROM person p
   JOIN club_membership m ON m.person_id = p.id
   JOIN drivers_licence d ON d.id = p.licence_id
   WHERE m.id LIKE '${P.killerMembershipPrefix}%'
     AND m.tier = '${P.killerMembershipTier}'
     AND d.plate_number LIKE '%${P.killerPlateFragment}%'`,
  [CASE.CAST.killer],
)

expect(
  'the check-in record corroborates the same person',
  `SELECT p.name FROM person p
   JOIN club_membership m ON m.person_id = p.id
   JOIN club_checkin c ON c.membership_id = m.id
   WHERE c.check_in_date = '${CASE.CRIME_DATE}'
     AND c.check_in_time >= '23:00'
     AND c.check_out_time IS NULL
     AND m.tier = '${P.killerMembershipTier}'`,
  [CASE.CAST.killer],
)

expect(
  'the physical description alone is not enough',
  `SELECT COUNT(*) > 1 FROM drivers_licence
   WHERE hair_colour = '${P.mastermindHairColour}'
     AND height_cm BETWEEN ${P.mastermindHeightCm - 1} AND ${P.mastermindHeightCm + 1}
     AND car_make = '${P.mastermindCarMake}'`,
  [1],
)

expect(
  'attending every recital alone is not enough',
  `SELECT COUNT(*) > 1 FROM (
     SELECT a.person_id FROM event_attendance a
     JOIN event e ON e.event_id = a.event_id
     WHERE e.name LIKE '${P.recitalSeriesPrefix}%'
     GROUP BY a.person_id
     HAVING COUNT(DISTINCT a.event_id) = ${P.recitalCount}
   )`,
  [1],
)

expect(
  'description and attendance together identify exactly one person',
  `SELECT p.name FROM person p
   JOIN drivers_licence d ON d.id = p.licence_id
   JOIN event_attendance a ON a.person_id = p.id
   JOIN event e ON e.event_id = a.event_id
   WHERE d.hair_colour = '${P.mastermindHairColour}'
     AND d.height_cm BETWEEN ${P.mastermindHeightCm - 1} AND ${P.mastermindHeightCm + 1}
     AND d.car_make = '${P.mastermindCarMake}'
     AND e.name LIKE '${P.recitalSeriesPrefix}%'
   GROUP BY p.id
   HAVING COUNT(DISTINCT e.event_id) = ${P.recitalCount}`,
  [CASE.CAST.mastermind],
)

expect(
  'the telephone records corroborate the mastermind',
  `SELECT p.name FROM phone_call c
   JOIN person p ON p.id = c.caller_id
   JOIN person k ON k.id = c.receiver_id
   WHERE k.name = '${CASE.CAST.killer}' AND c.date BETWEEN '2025-11-08' AND '${CASE.CRIME_DATE}'
   GROUP BY p.id
   HAVING COUNT(*) = ${P.mastermindCallCount}`,
  [CASE.CAST.mastermind],
)

expect('the confession table starts empty', 'SELECT COUNT(*) FROM confession', [0])

// ---------------------------------------------------------------------------

fs.writeFileSync(OUT_FILE, Buffer.from(db.export()))
db.close()

// sql.js fetches its runtime by URL, so the .wasm has to sit in public/.
// Copying it here keeps `npm run build` self-sufficient on a clean checkout.
const WASM_SOURCE = path.join(ROOT, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
const WASM_TARGET = path.join(ROOT, 'public', 'sql-wasm.wasm')
fs.copyFileSync(WASM_SOURCE, WASM_TARGET)
console.log(`copied ${path.relative(ROOT, WASM_TARGET)}`)

const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(0)
console.log(`\nwrote ${path.relative(ROOT, OUT_FILE)} (${sizeKb} KB)`)
console.log(
  `  ${people.length} people · ${licences.length} licences · ${memberships.length} memberships · ` +
    `${checkins.length} check-ins · ${attendance.length} attendances · ${calls.length} calls`,
)
