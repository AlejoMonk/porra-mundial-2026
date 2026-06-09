import { R32_MATCHES, BRACKET_TREE, ALL_TEAMS, getTeam } from './constants'

export interface GroupPredictions {
  [group: string]: { winner: string; runnerUp: string }
}

export interface KnockoutPicks {
  [matchNum: number]: string
}

export interface MatchSlot {
  home: string | null // team code or null if not yet determined
  away: string | null
  homeLabel: string
  awayLabel: string
}

// Resolve R32 slots given group predictions and the admin's third-place assignment.
// Third-place slots only show a team when the admin has explicitly assigned one via adminAssignment.
// Until the admin saves the assignment, those slots display a placeholder ("3º Mejor · Por determinar").
export function resolveR32Slots(
  groupPredictions: GroupPredictions,
  thirdPlacePicks: string[], // kept for API compatibility, no longer used for display
  adminAssignment?: Record<number, string> // admin-only source of truth for third-place slots
): Record<number, MatchSlot> {
  const slots: Record<number, MatchSlot> = {}

  // Third-place slots come exclusively from adminAssignment.
  // No bipartite matching — avoids showing "guessed" teams before the admin confirms the draw.
  const thirdAssignment: Record<number, string | null> = {}
  if (adminAssignment) {
    for (const r32 of R32_MATCHES) {
      if (r32.homeSlot.type === 'third' || r32.awaySlot.type === 'third') {
        thirdAssignment[r32.match] = adminAssignment[r32.match] ?? null
      }
    }
  }

  // Resolve all slots
  for (const r32 of R32_MATCHES) {
    const resolveSlot = (slot: typeof r32.homeSlot): { code: string | null; label: string } => {
      if (slot.type === 'winner') {
        const gp = groupPredictions[slot.group]
        const code = gp?.winner ?? null
        const team = code ? getTeam(code) : null
        return { code, label: team ? team.name : `1º Grupo ${slot.group}` }
      }
      if (slot.type === 'runnerUp') {
        const gp = groupPredictions[slot.group]
        const code = gp?.runnerUp ?? null
        const team = code ? getTeam(code) : null
        return { code, label: team ? team.name : `2º Grupo ${slot.group}` }
      }
      // type === 'third' — use admin assignment only; placeholder if not yet assigned
      const code = thirdAssignment[r32.match] ?? null
      const team = code ? getTeam(code) : null
      return { code, label: team ? team.name : '3º Mejor · Por determinar' }
    }

    const home = resolveSlot(r32.homeSlot)
    const away = resolveSlot(r32.awaySlot)
    slots[r32.match] = { home: home.code, away: away.code, homeLabel: home.label, awayLabel: away.label }
  }

  return slots
}

// Given R32 picks, compute all subsequent match slots
export function propagateBracket(
  r32Slots: Record<number, MatchSlot>,
  knockoutPicks: KnockoutPicks
): Record<number, MatchSlot> {
  const allSlots: Record<number, MatchSlot> = { ...r32Slots }

  // Initialize higher-round slots
  const higherMatches = [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104]
  for (const m of higherMatches) {
    if (!allSlots[m]) {
      allSlots[m] = { home: null, away: null, homeLabel: 'Por determinar', awayLabel: 'Por determinar' }
    }
  }

  // Propagate winners forward through the bracket tree
  const processedMatches = [...Object.keys(r32Slots).map(Number), ...higherMatches.slice(0, -2)]
  for (const matchNum of processedMatches) {
    const winner = knockoutPicks[matchNum]
    if (!winner) continue
    const next = BRACKET_TREE[matchNum]
    if (!next) continue

    const team = getTeam(winner)
    const label = team ? team.name : winner

    if (!allSlots[next.feedsInto]) {
      allSlots[next.feedsInto] = { home: null, away: null, homeLabel: 'Por determinar', awayLabel: 'Por determinar' }
    }

    if (next.slot === 'home') {
      allSlots[next.feedsInto].home = winner
      allSlots[next.feedsInto].homeLabel = label
    } else {
      allSlots[next.feedsInto].away = winner
      allSlots[next.feedsInto].awayLabel = label
    }
  }

  // SF losers → match 103 (3rd place)
  const sf1Pick = knockoutPicks[101]
  const sf2Pick = knockoutPicks[102]
  const sf1Slots = allSlots[101]
  const sf2Slots = allSlots[102]

  if (sf1Slots && sf1Pick) {
    const loser = sf1Pick === sf1Slots.home ? sf1Slots.away : sf1Slots.home
    const loserTeam = loser ? getTeam(loser) : null
    allSlots[103].home = loser
    allSlots[103].homeLabel = loserTeam ? loserTeam.name : 'Perdedor SF1'
  }
  if (sf2Slots && sf2Pick) {
    const loser = sf2Pick === sf2Slots.home ? sf2Slots.away : sf2Slots.home
    const loserTeam = loser ? getTeam(loser) : null
    allSlots[103].away = loser
    allSlots[103].awayLabel = loserTeam ? loserTeam.name : 'Perdedor SF2'
  }

  // SF winners → match 104 (Final)
  if (sf1Slots && sf1Pick) {
    const winnerTeam = getTeam(sf1Pick)
    allSlots[104].home = sf1Pick
    allSlots[104].homeLabel = winnerTeam ? winnerTeam.name : 'Ganador SF1'
  }
  if (sf2Slots && sf2Pick) {
    const winnerTeam = getTeam(sf2Pick)
    allSlots[104].away = sf2Pick
    allSlots[104].awayLabel = winnerTeam ? winnerTeam.name : 'Ganador SF2'
  }

  return allSlots
}

// Get all team codes not chosen as winner or runner-up in any group prediction
export function getAvailableThirdPlaceTeams(
  groupPredictions: GroupPredictions,
  allTeams: typeof ALL_TEAMS
): { team: typeof ALL_TEAMS[0]; group: string }[] {
  const chosen = new Set<string>()
  for (const gp of Object.values(groupPredictions)) {
    if (gp.winner) chosen.add(gp.winner)
    if (gp.runnerUp) chosen.add(gp.runnerUp)
  }
  return allTeams
    .filter((t) => !chosen.has(t.code))
    .map((t) => ({ team: t, group: t.group }))
}
