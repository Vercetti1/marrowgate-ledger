/**
 * The case specification. Build-time only — this file is never bundled into the
 * app, so the answers cannot be read out of the shipped JavaScript.
 */

export const CRIME_DATE = '2025-11-14'
export const CRIME_DISTRICT = 'Old Harbour'

/** Cast members whose attributes are pinned so the clue chain resolves uniquely. */
export const CAST = {
  victim: 'Silas Renwick',
  witnessAddress: 'Bartholomew Quist',
  witnessClub: 'Adaeze Nwachukwu',
  killer: 'Cassian Vole',
  mastermind: 'Perpetua Falk',
} as const

/** Planted identifiers referenced by the interview transcripts. */
export const PLANTED = {
  witnessStreet: "Cobbler's Row",
  witnessHouseNumber: 219,
  /** No background resident of Cobbler's Row may exceed this. */
  witnessStreetCeiling: 198,

  killerMembershipId: '4B71K',
  killerMembershipPrefix: '4B',
  killerMembershipTier: 'platinum',
  killerPlate: 'MK7QB2',
  killerPlateFragment: 'K7Q',
  killerCheckInTime: '23:41',
  killerHeightCm: 193,

  mastermindHairColour: 'red',
  mastermindHeightCm: 171,
  mastermindCarMake: 'Volvo',
  mastermindCarModel: 'V70',
  recitalSeriesPrefix: 'Marrowgate Symphony Autumn Recital',
  recitalCount: 4,
  mastermindCallCount: 3,
} as const

export const CRIME_SCENE_DESCRIPTION = [
  'Silas Renwick, customs auditor, found dead beneath Pier 9 at first light.',
  'Cause of death: single blow to the back of the head. His ledger case is missing.',
  'Two people gave statements at the scene and were taken in for interview.',
  "The first witness lives in the last house on Cobbler's Row.",
  'The second witness is named Adaeze; she keeps a membership at the Old Harbour Rowing Club.',
].join(' ')

export const INTERVIEWS = {
  witnessAddress: [
    'I walk the dog along the water at midnight, rain or no rain.',
    'A man came up off the pier steps in a hurry and went towards the ferry terminal.',
    'He had a rowing club kit bag over his shoulder — the platinum-tier sort, they have the crest stitched in gold thread.',
    'I never saw his face. He got into a dark saloon and the plate had K7Q in it. I am certain of the K7Q.',
  ].join(' '),
  witnessClub: [
    'I was locking up the club that night. A man let himself in past eleven to use the showers.',
    'His membership number began with 4B — I remember because the card reader chirped twice.',
    'Enormously tall, well over six foot, and soaked through.',
    'He went out the side door in a state and never swiped back out, which the system hates.',
  ].join(' '),
} as const

/** Sealed with the killer's name. Unlocked by a correct Act I accusation. */
export const CONFESSION = [
  'I did it, and I was paid to do it.',
  'A woman found me at the Gilded Anchor on the ninth. Red hair, a shade under five foot eight, and she drove a Volvo estate — I watched her park it badly.',
  'She wanted the ledger case and nothing else. She said Renwick had been reading columns that were not his to read.',
  'She never gave a name. She only bragged that she had not missed a single one of the Symphony’s autumn recitals — all four of them, front row.',
  'She telephoned me three times that week from the same number, and I have not heard from her since.',
].join(' ')

export const EPILOGUE = [
  'Perpetua Falk, sole proprietor of Falk Shipping & Bonded Stores.',
  'Renwick’s missing ledger surfaces four months later in a bonded warehouse on Tannery Bank: eleven years of short-weighted cargo manifests, every page countersigned in her hand.',
  'She is convicted on the strength of three telephone records and a seating plan.',
  'Cassian Vole gives evidence against her and is sentenced separately.',
  'Case closed. The Old Harbour is quiet again, which around here never lasts.',
].join(' ')

export const HINTS: ReadonlyArray<{ stage: 'killer' | 'mastermind'; ordinal: number; text: string }> = [
  {
    stage: 'killer',
    ordinal: 1,
    text: 'Start at crime_scene_report. You need one row: the murder, on 2025-11-14, in the Old Harbour district.',
  },
  {
    stage: 'killer',
    ordinal: 2,
    text: `"The last house on the street" means the highest address_number for that address_street_name. Watch the apostrophe in Cobbler's Row — inside a SQL string you double it: 'Cobbler''s Row'.`,
  },
  {
    stage: 'killer',
    ordinal: 3,
    text: 'There is more than one Adaeze. The one you want is the one who appears in club_membership. Try name LIKE \'Adaeze%\' and join.',
  },
  {
    stage: 'killer',
    ordinal: 4,
    text: 'Feed both witness person ids into the interview table. Each transcript hands you one filter.',
  },
  {
    stage: 'killer',
    ordinal: 5,
    text: 'Two filters, two tables: club_membership (id LIKE \'4B%\' and the tier the witness described) and drivers_licence (plate_number LIKE \'%K7Q%\'). Several people satisfy one. Exactly one satisfies both.',
  },
  {
    stage: 'mastermind',
    ordinal: 1,
    text: 'The confession is now a row in the confession table. Query it like anything else.',
  },
  {
    stage: 'mastermind',
    ordinal: 2,
    text: 'Three physical details go to drivers_licence: hair_colour, height_cm, car_make. "A shade under five foot eight" is about 171 cm — allow yourself a centimetre either side.',
  },
  {
    stage: 'mastermind',
    ordinal: 3,
    text: 'Attending all four recitals is a GROUP BY over event_attendance joined to event, with HAVING COUNT(DISTINCT event_id) = 4.',
  },
  {
    stage: 'mastermind',
    ordinal: 4,
    text: 'To confirm, look in phone_call for three calls to the killer’s number in the week of the murder.',
  },
]
