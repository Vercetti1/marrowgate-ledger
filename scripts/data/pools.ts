/** Name and attribute pools for background (non-cast) records. */

export const FIRST_NAMES = [
  'Adaeze', 'Adrian', 'Agnes', 'Ainsley', 'Alasdair', 'Amara', 'Ambrose', 'Anneke',
  'Arthur', 'Astrid', 'Aurelia', 'Bartholomew', 'Beatrix', 'Bexley', 'Blythe', 'Callum',
  'Cassian', 'Cecily', 'Chidera', 'Clementine', 'Conrad', 'Cordelia', 'Cyril', 'Delphine',
  'Desmond', 'Dorothea', 'Eamon', 'Edwina', 'Eleni', 'Elias', 'Esperanza', 'Ezra',
  'Fennimore', 'Fiadh', 'Florian', 'Frances', 'Gideon', 'Giulia', 'Gwendolyn', 'Halvard',
  'Harriet', 'Hester', 'Horatio', 'Ida', 'Ignatius', 'Imelda', 'Ines', 'Isolde',
  'Jasper', 'Jocasta', 'Kaveh', 'Keturah', 'Lachlan', 'Leocadia', 'Lior', 'Lucinda',
  'Magnus', 'Maeve', 'Marisol', 'Mateo', 'Meredith', 'Mirembe', 'Mordecai', 'Nadia',
  'Nkechi', 'Norah', 'Octavia', 'Olamide', 'Oswin', 'Patience', 'Perpetua', 'Phineas',
  'Quentin', 'Rafiq', 'Ramona', 'Rosalind', 'Rufus', 'Saoirse', 'Seraphina', 'Silas',
  'Sunniva', 'Tamsin', 'Thaddeus', 'Theodora', 'Tobias', 'Ulla', 'Ursula', 'Vesper',
  'Vidal', 'Wilhelmina', 'Winsome', 'Xanthe', 'Yolanda', 'Zephyrine', 'Zora',
]

export const LAST_NAMES = [
  'Achebe', 'Ashgrove', 'Balliol', 'Barrowman', 'Beckwith', 'Blackwood', 'Bramhall',
  'Calloway', 'Carrick', 'Chettleworth', 'Coldwell', 'Cormack', 'Crozier', 'Dalgleish',
  'Dunmore', 'Eberhardt', 'Ellery', 'Fairweather', 'Falk', 'Fenwick', 'Fitzgibbon',
  'Gallagher', 'Garrick', 'Glaister', 'Grimsby', 'Hallowell', 'Hardacre', 'Hawksmoor',
  'Ijeoma', 'Inkpen', 'Jardine', 'Kettleby', 'Kirkbride', 'Lammermoor', 'Larkspur',
  'Ledger', 'Lindqvist', 'Loveridge', 'Marchetti', 'Mordaunt', 'Netherwood', 'Nwachukwu',
  'Oakhurst', 'Okonjo', 'Pemberton', 'Pennycuick', 'Quist', 'Rackham', 'Ravensworth',
  'Renwick', 'Rothschild', 'Salterton', 'Sandhu', 'Scattergood', 'Shackleton', 'Sowande',
  'Standish', 'Sterlington', 'Thackeray', 'Thorncroft', 'Trelawney', 'Underhill', 'Vole',
  'Wadsworth', 'Wexford', 'Whitlock', 'Winterbourne', 'Yarrow', 'Zaharoff',
]

export const STREETS = [
  "Cobbler's Row", 'Anchor Lane', 'Bleaker Terrace', 'Candlewick Street', 'Dray Yard',
  'Ferrymans Walk', 'Gallowgate', 'Hemlock Rise', 'Iron Bridge Road', 'Jetty Approach',
  'Kelp Street', 'Lamplighter Way', 'Mercers Passage', 'Netting Green', 'Oyster Hill',
  'Pilchard Street', 'Quarrel Court', 'Ropewalk', 'Saltmarsh Avenue', 'Tannery Bank',
  'Underbridge Way', 'Vellum Street', 'Whaler Crescent', 'Yardarm Close',
]

export const DISTRICTS = [
  'Old Harbour', 'Brasswick', 'Cinderfield', 'Dunmoor', 'Elsgate',
  'The Rookery', 'Saltmarsh', 'Vantry Hill',
]

export const EYE_COLOURS = ['brown', 'blue', 'green', 'hazel', 'grey', 'amber'] as const
export const HAIR_COLOURS = ['black', 'brown', 'blonde', 'red', 'grey', 'auburn', 'white'] as const

export const CARS: ReadonlyArray<readonly [make: string, models: readonly string[]]> = [
  ['Volvo', ['V70', 'S60', 'XC90', '240']],
  ['Rover', ['75', 'P5', 'SD1']],
  ['Citroen', ['DS', 'CX', 'BX', '2CV']],
  ['Saab', ['900', '9-5', '96']],
  ['Wolseley', ['6/110', '18/85']],
  ['Peugeot', ['505', '405', '205']],
  ['Mercedes', ['W123', 'W124', '190E']],
  ['Ford', ['Granada', 'Cortina', 'Sierra']],
  ['Lancia', ['Fulvia', 'Beta']],
  ['Datsun', ['240Z', 'Cherry']],
]

export const EMPLOYERS = [
  'Marrowgate Port Authority', 'Falk Shipping & Bonded Stores', 'Corvid Insurance Syndicate',
  'The Marrowgate Courier', 'Brasswick Foundry', 'Old Harbour Rowing Club',
  'Marrowgate City Constabulary', 'Vellum Street Library', 'Sisters of the Tidal Hospital',
  'Kelp Street Fish Market', 'Marrowgate Symphony Orchestra', 'Trelawney & Sons Chandlery',
  'Cinderfield Tram Depot', 'Gallowgate Assize Court', 'Independent',
]

export const JOB_TITLES = [
  'clerk', 'stevedore', 'customs auditor', 'ledger keeper', 'crane operator', 'nurse',
  'compositor', 'solicitor', 'rope maker', 'fishmonger', 'violinist', 'tram conductor',
  'harbour pilot', 'night watchman', 'chandler', 'insurance assessor', 'librarian',
  'constable', 'foundry hand', 'shipping agent',
]

export const CLUB_TIERS = ['bronze', 'silver', 'gold', 'platinum'] as const

export const OTHER_CRIME_TYPES = ['theft', 'arson', 'blackmail', 'assault', 'smuggling', 'fraud'] as const
