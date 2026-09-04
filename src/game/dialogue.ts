/**
 * The narrative layer.
 *
 * Story beats play through a visual-novel dialogue box rather than sitting in a
 * sidebar, so the case is delivered *at* the player by people. Nothing in here
 * is a spoiler: the confession and the epilogue arrive at runtime from the
 * sealed payload in the database, and are only turned into dialogue lines once
 * the player has earned them.
 */

export type SpeakerId = 'vance' | 'vole' | 'falk' | 'file' | 'self'

export interface Speaker {
  name: string
  role: string
  /** Tailwind text colour for the nameplate. */
  tone: string
}

export const SPEAKERS: Record<SpeakerId, Speaker> = {
  vance: { name: 'Insp. Vance', role: 'Marrowgate CID', tone: 'text-brass-400' },
  vole: { name: 'Cassian Vole', role: 'in custody', tone: 'text-stamp-500' },
  falk: { name: 'Perpetua Falk', role: 'Falk Shipping', tone: 'text-stamp-500' },
  file: { name: 'Case 1114-OH', role: 'disposition', tone: 'text-ink-300' },
  self: { name: 'You', role: 'investigating officer', tone: 'text-ink-100' },
}

export interface Line {
  speaker: SpeakerId
  text: string
}

/**
 * Splits prose into dialogue-sized beats: whole sentences, grouped so that no
 * single box runs longer than a couple of breaths.
 */
export function toLines(speaker: SpeakerId, prose: string, sentencesPerBox = 2): Line[] {
  const sentences = prose.split(/(?<=[.!?])\s+(?=[A-Z“"‘'])/).filter(Boolean)
  const lines: Line[] = []
  for (let i = 0; i < sentences.length; i += sentencesPerBox) {
    lines.push({ speaker, text: sentences.slice(i, i + sentencesPerBox).join(' ') })
  }
  return lines
}

export const OPENING: Line[] = [
  { speaker: 'vance', text: 'You’re late. Shut the door and sit down.' },
  {
    speaker: 'vance',
    text:
      'Silas Renwick. Customs auditor, twenty-two years on the harbour books. They pulled him out from under Pier 9 this morning with the back of his head opened and his ledger case gone.',
  },
  {
    speaker: 'vance',
    text:
      'You get exactly what I get. The file, and the whole of Marrowgate in that machine — every licence, every club door, every telephone call anyone made this autumn.',
  },
  {
    speaker: 'vance',
    text:
      'Start with the crime scene report. Murder, the fourteenth, Old Harbour district. Everything after that you dig out yourself.',
  },
  { speaker: 'self', text: 'And if I bring you the wrong name?' },
  {
    speaker: 'vance',
    text:
      'Then a guilty man hears we were looking, and walks onto a boat. Be sure. The records don’t lie — people do.',
  },
]

export const WRONG_ACCUSATION: Record<'killer' | 'mastermind', Line[][]> = {
  killer: [
    [
      {
        speaker: 'vance',
        text:
          'No. Nothing in the file puts that person under the pier. Withdraw it before a solicitor hears you say it out loud.',
      },
    ],
    [
      {
        speaker: 'vance',
        text:
          'That’s a name, not a case. Bring me the record that says so — the plate, the membership, both at once.',
      },
    ],
    [
      {
        speaker: 'vance',
        text:
          'Wrong. And half of them will match one clue if you squint. Find the one who matches every clue.',
      },
    ],
  ],
  mastermind: [
    [
      {
        speaker: 'vance',
        text:
          'She’s not your paymaster. Vole gave you three things about her — read them again, and make the records agree with all three.',
      },
    ],
    [
      {
        speaker: 'vance',
        text:
          'No. Plenty of women in this city are the right height with the right hair. Only one of them never missed a recital.',
      },
    ],
  ],
}

export const HANDOVER_TO_ACT_TWO: Line[] = [
  {
    speaker: 'vance',
    text:
      'Cassian Vole. Taken at the ferry terminal with the ledger case still under his arm. He talked before we’d got his coat off.',
  },
]

export const AFTER_CONFESSION: Line[] = [
  {
    speaker: 'vance',
    text:
      'So he was paid. That makes him the hand, not the reason — and I do not close a file on a hand.',
  },
  {
    speaker: 'vance',
    text:
      'His statement is in the file now, on the record, and you can query it like anything else. Three details about the woman who hired him. Go and find her.',
  },
]

export const BEFORE_EPILOGUE: Line[] = [
  {
    speaker: 'vance',
    text:
      'Perpetua Falk. Eleven years shipping through the Old Harbour and never once a crate short on paper. Renwick was the first man to actually count them.',
  },
]

export const CLOSING: Line[] = [
  {
    speaker: 'vance',
    text:
      'Good. Sign it, date it, and go home. Marrowgate will have another one for you by Friday.',
  },
]
