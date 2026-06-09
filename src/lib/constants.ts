export type TeamCode = string

export interface Team {
  code: string
  name: string
  flag: string
  group: string
}

export interface Group {
  name: string
  teams: Team[]
}

export const GROUPS: Group[] = [
  {
    name: 'A',
    teams: [
      { code: 'MEX', name: 'México', flag: '🇲🇽', group: 'A' },
      { code: 'RSA', name: 'Sudáfrica', flag: '🇿🇦', group: 'A' },
      { code: 'KOR', name: 'Corea del Sur', flag: '🇰🇷', group: 'A' },
      { code: 'CZE', name: 'Chequia', flag: '🇨🇿', group: 'A' },
    ],
  },
  {
    name: 'B',
    teams: [
      { code: 'CAN', name: 'Canadá', flag: '🇨🇦', group: 'B' },
      { code: 'BIH', name: 'Bosnia-Herzegovina', flag: '🇧🇦', group: 'B' },
      { code: 'QAT', name: 'Catar', flag: '🇶🇦', group: 'B' },
      { code: 'SUI', name: 'Suiza', flag: '🇨🇭', group: 'B' },
    ],
  },
  {
    name: 'C',
    teams: [
      { code: 'BRA', name: 'Brasil', flag: '🇧🇷', group: 'C' },
      { code: 'MAR', name: 'Marruecos', flag: '🇲🇦', group: 'C' },
      { code: 'SCO', name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
      { code: 'HAI', name: 'Haití', flag: '🇭🇹', group: 'C' },
    ],
  },
  {
    name: 'D',
    teams: [
      { code: 'USA', name: 'Estados Unidos', flag: '🇺🇸', group: 'D' },
      { code: 'PAR', name: 'Paraguay', flag: '🇵🇾', group: 'D' },
      { code: 'AUS', name: 'Australia', flag: '🇦🇺', group: 'D' },
      { code: 'TUR', name: 'Türkiye', flag: '🇹🇷', group: 'D' },
    ],
  },
  {
    name: 'E',
    teams: [
      { code: 'GER', name: 'Alemania', flag: '🇩🇪', group: 'E' },
      { code: 'CUW', name: 'Curazao', flag: '🇨🇼', group: 'E' },
      { code: 'CIV', name: 'Costa de Marfil', flag: '🇨🇮', group: 'E' },
      { code: 'ECU', name: 'Ecuador', flag: '🇪🇨', group: 'E' },
    ],
  },
  {
    name: 'F',
    teams: [
      { code: 'NED', name: 'Países Bajos', flag: '🇳🇱', group: 'F' },
      { code: 'JPN', name: 'Japón', flag: '🇯🇵', group: 'F' },
      { code: 'SWE', name: 'Suecia', flag: '🇸🇪', group: 'F' },
      { code: 'TUN', name: 'Túnez', flag: '🇹🇳', group: 'F' },
    ],
  },
  {
    name: 'G',
    teams: [
      { code: 'BEL', name: 'Bélgica', flag: '🇧🇪', group: 'G' },
      { code: 'EGY', name: 'Egipto', flag: '🇪🇬', group: 'G' },
      { code: 'IRN', name: 'Irán', flag: '🇮🇷', group: 'G' },
      { code: 'NZL', name: 'Nueva Zelanda', flag: '🇳🇿', group: 'G' },
    ],
  },
  {
    name: 'H',
    teams: [
      { code: 'ESP', name: 'España', flag: '🇪🇸', group: 'H' },
      { code: 'CPV', name: 'Cabo Verde', flag: '🇨🇻', group: 'H' },
      { code: 'KSA', name: 'Arabia Saudí', flag: '🇸🇦', group: 'H' },
      { code: 'URU', name: 'Uruguay', flag: '🇺🇾', group: 'H' },
    ],
  },
  {
    name: 'I',
    teams: [
      { code: 'FRA', name: 'Francia', flag: '🇫🇷', group: 'I' },
      { code: 'SEN', name: 'Senegal', flag: '🇸🇳', group: 'I' },
      { code: 'IRQ', name: 'Irak', flag: '🇮🇶', group: 'I' },
      { code: 'NOR', name: 'Noruega', flag: '🇳🇴', group: 'I' },
    ],
  },
  {
    name: 'J',
    teams: [
      { code: 'ARG', name: 'Argentina', flag: '🇦🇷', group: 'J' },
      { code: 'ALG', name: 'Argelia', flag: '🇩🇿', group: 'J' },
      { code: 'AUT', name: 'Austria', flag: '🇦🇹', group: 'J' },
      { code: 'JOR', name: 'Jordania', flag: '🇯🇴', group: 'J' },
    ],
  },
  {
    name: 'K',
    teams: [
      { code: 'POR', name: 'Portugal', flag: '🇵🇹', group: 'K' },
      { code: 'COD', name: 'R. D. Congo', flag: '🇨🇩', group: 'K' },
      { code: 'UZB', name: 'Uzbekistán', flag: '🇺🇿', group: 'K' },
      { code: 'COL', name: 'Colombia', flag: '🇨🇴', group: 'K' },
    ],
  },
  {
    name: 'L',
    teams: [
      { code: 'ENG', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
      { code: 'CRO', name: 'Croacia', flag: '🇭🇷', group: 'L' },
      { code: 'GHA', name: 'Ghana', flag: '🇬🇭', group: 'L' },
      { code: 'PAN', name: 'Panamá', flag: '🇵🇦', group: 'L' },
    ],
  },
]

export const ALL_TEAMS: Team[] = GROUPS.flatMap((g) => g.teams)

export const FIFA_TO_ISO2: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz',
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', SCO: 'gb-sct', HAI: 'ht',
  USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz',
  ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
}

export function getTeam(code: string): Team | undefined {
  return ALL_TEAMS.find((t) => t.code === code)
}

export function getTeamsByGroup(groupName: string): Team[] {
  return GROUPS.find((g) => g.name === groupName)?.teams ?? []
}

// R32 bracket: match number → slot descriptors
export interface R32Slot {
  match: number
  homeSlot: { type: 'winner' | 'runnerUp'; group: string } | { type: 'third'; eligibleGroups: string[] }
  awaySlot: { type: 'winner' | 'runnerUp'; group: string } | { type: 'third'; eligibleGroups: string[] }
}

export const R32_MATCHES: R32Slot[] = [
  { match: 73, homeSlot: { type: 'runnerUp', group: 'A' }, awaySlot: { type: 'runnerUp', group: 'B' } },
  { match: 74, homeSlot: { type: 'winner', group: 'E' }, awaySlot: { type: 'third', eligibleGroups: ['A', 'B', 'C', 'D', 'F'] } },
  { match: 75, homeSlot: { type: 'winner', group: 'F' }, awaySlot: { type: 'runnerUp', group: 'C' } },
  { match: 76, homeSlot: { type: 'winner', group: 'C' }, awaySlot: { type: 'runnerUp', group: 'F' } },
  { match: 77, homeSlot: { type: 'winner', group: 'I' }, awaySlot: { type: 'third', eligibleGroups: ['C', 'D', 'F', 'G', 'H'] } },
  { match: 78, homeSlot: { type: 'runnerUp', group: 'E' }, awaySlot: { type: 'runnerUp', group: 'I' } },
  { match: 79, homeSlot: { type: 'winner', group: 'A' }, awaySlot: { type: 'third', eligibleGroups: ['C', 'E', 'F', 'H', 'I'] } },
  { match: 80, homeSlot: { type: 'winner', group: 'L' }, awaySlot: { type: 'third', eligibleGroups: ['E', 'H', 'I', 'J', 'K'] } },
  { match: 81, homeSlot: { type: 'winner', group: 'D' }, awaySlot: { type: 'third', eligibleGroups: ['B', 'E', 'F', 'I', 'J'] } },
  { match: 82, homeSlot: { type: 'winner', group: 'G' }, awaySlot: { type: 'third', eligibleGroups: ['A', 'E', 'H', 'I', 'J'] } },
  { match: 83, homeSlot: { type: 'runnerUp', group: 'K' }, awaySlot: { type: 'runnerUp', group: 'L' } },
  { match: 84, homeSlot: { type: 'winner', group: 'H' }, awaySlot: { type: 'runnerUp', group: 'J' } },
  { match: 85, homeSlot: { type: 'winner', group: 'B' }, awaySlot: { type: 'third', eligibleGroups: ['E', 'F', 'G', 'I', 'J'] } },
  { match: 86, homeSlot: { type: 'winner', group: 'J' }, awaySlot: { type: 'runnerUp', group: 'H' } },
  { match: 87, homeSlot: { type: 'winner', group: 'K' }, awaySlot: { type: 'third', eligibleGroups: ['D', 'E', 'I', 'J', 'L'] } },
  { match: 88, homeSlot: { type: 'runnerUp', group: 'D' }, awaySlot: { type: 'runnerUp', group: 'G' } },
]

// Knockout bracket tree: which R32/R16/QF matches feed into next round
// key = match number, value = {feedsInto, slot}
export const BRACKET_TREE: Record<number, { feedsInto: number; slot: 'home' | 'away' }> = {
  // R32 → R16
  74: { feedsInto: 89, slot: 'home' },
  77: { feedsInto: 89, slot: 'away' },
  73: { feedsInto: 90, slot: 'home' },
  75: { feedsInto: 90, slot: 'away' },
  76: { feedsInto: 91, slot: 'home' },
  78: { feedsInto: 91, slot: 'away' },
  79: { feedsInto: 92, slot: 'home' },
  80: { feedsInto: 92, slot: 'away' },
  83: { feedsInto: 93, slot: 'home' },
  84: { feedsInto: 93, slot: 'away' },
  81: { feedsInto: 94, slot: 'home' },
  82: { feedsInto: 94, slot: 'away' },
  86: { feedsInto: 95, slot: 'home' },
  88: { feedsInto: 95, slot: 'away' },
  85: { feedsInto: 96, slot: 'home' },
  87: { feedsInto: 96, slot: 'away' },
  // R16 → QF
  89: { feedsInto: 97, slot: 'home' },
  90: { feedsInto: 97, slot: 'away' },
  93: { feedsInto: 98, slot: 'home' },
  94: { feedsInto: 98, slot: 'away' },
  91: { feedsInto: 99, slot: 'home' },
  92: { feedsInto: 99, slot: 'away' },
  95: { feedsInto: 100, slot: 'home' },
  96: { feedsInto: 100, slot: 'away' },
  // QF → SF
  97: { feedsInto: 101, slot: 'home' },
  98: { feedsInto: 101, slot: 'away' },
  99: { feedsInto: 102, slot: 'home' },
  100: { feedsInto: 102, slot: 'away' },
  // SF → Final/3rd
  // losers of 101 and 102 go to 103 (3rd place)
  // winners of 101 and 102 go to 104 (Final)
}

export const R16_MATCHES = [89, 90, 91, 92, 93, 94, 95, 96]
export const QF_MATCHES = [97, 98, 99, 100]
export const SF_MATCHES = [101, 102]
export const THIRD_PLACE_MATCH = 103
export const FINAL_MATCH = 104

export const ROUND_LABELS: Record<string, string> = {
  r32: 'Octavos de Final',
  r16: 'Octavos',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  third: 'Tercer Puesto',
  final: 'Final',
}

export function getMatchRound(matchNum: number): string {
  if (matchNum >= 73 && matchNum <= 88) return 'r32'
  if (matchNum >= 89 && matchNum <= 96) return 'r16'
  if (matchNum >= 97 && matchNum <= 100) return 'qf'
  if (matchNum === 101 || matchNum === 102) return 'sf'
  if (matchNum === 103) return 'third'
  if (matchNum === 104) return 'final'
  return 'unknown'
}
