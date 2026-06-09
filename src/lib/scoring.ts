export interface GroupResultsData {
  [group: string]: { '1': string; '2': string; '3': string; '4': string }
}

export interface MatchResultsData {
  [matchNum: number]: string // team code that won
}

export interface PredictionData {
  groupPredictions: Record<string, { winner: string; runnerUp: string }>
  thirdPlacePicks: string[]
  knockoutPicks: Record<number, string>
  topScorerTeam: string | null
  mvpTeam: string | null
}

export interface ScoringBreakdown {
  groupPoints: number
  thirdPlacePoints: number
  knockoutPoints: number
  specialPoints: number
  totalPoints: number
}

// Tiered scoring for third-place qualifiers (based on % correct out of 8)
export const THIRD_TIERS = [
  { min: 7, pts: 10 }, // 7-8 correct → 10 pts
  { min: 5, pts: 5 },  // 5-6 correct → 5 pts
  { min: 3, pts: 3 },  // 3-4 correct → 3 pts
  { min: 1, pts: 1 },  // 1-2 correct → 1 pt
]                       // 0 correct → 0 pts

export const POINTS = {
  groupWinner: 5,
  groupRunnerUp: 3,
  groupBothBonus: 2,
  r32Winner: 3,
  r16Winner: 4,
  qfWinner: 6,
  sfWinner: 8,
  thirdPlaceWinner: 5,
  finalWinner: 15,
  topScorer: 10,
  mvp: 8,
}

export function calculateScore(
  prediction: PredictionData,
  groupResults: GroupResultsData,
  matchResults: MatchResultsData,
  thirdPlaceQualifiers: string[],
  topScorer: string | null,
  mvp: string | null
): ScoringBreakdown {
  let groupPoints = 0
  let thirdPlacePoints = 0
  let knockoutPoints = 0
  let specialPoints = 0

  // Group stage scoring
  for (const [group, picks] of Object.entries(prediction.groupPredictions)) {
    const actual = groupResults[group]
    if (!actual) continue

    let correct = 0
    if (picks.winner && picks.winner === actual['1']) {
      groupPoints += POINTS.groupWinner
      correct++
    }
    if (picks.runnerUp && picks.runnerUp === actual['2']) {
      groupPoints += POINTS.groupRunnerUp
      correct++
    }
    if (correct === 2) groupPoints += POINTS.groupBothBonus
  }

  // Third-place qualifiers — tiered scoring
  const thirdCorrect = prediction.thirdPlacePicks.filter((p) => thirdPlaceQualifiers.includes(p)).length
  const tier = THIRD_TIERS.find((t) => thirdCorrect >= t.min)
  thirdPlacePoints = tier ? tier.pts : 0

  // Knockout stage scoring
  for (const [matchStr, winnerPick] of Object.entries(prediction.knockoutPicks)) {
    const matchNum = Number(matchStr)
    const actual = matchResults[matchNum]
    if (!actual || !winnerPick) continue
    if (winnerPick !== actual) continue

    if (matchNum >= 73 && matchNum <= 88) knockoutPoints += POINTS.r32Winner
    else if (matchNum >= 89 && matchNum <= 96) knockoutPoints += POINTS.r16Winner
    else if (matchNum >= 97 && matchNum <= 100) knockoutPoints += POINTS.qfWinner
    else if (matchNum === 101 || matchNum === 102) knockoutPoints += POINTS.sfWinner
    else if (matchNum === 103) knockoutPoints += POINTS.thirdPlaceWinner
    else if (matchNum === 104) knockoutPoints += POINTS.finalWinner
  }

  // Special awards — case-insensitive player name comparison
  const norm = (s: string | null) => s?.toLowerCase().trim() ?? ''
  if (prediction.topScorerTeam && topScorer && norm(prediction.topScorerTeam) === norm(topScorer)) {
    specialPoints += POINTS.topScorer
  }
  if (prediction.mvpTeam && mvp && norm(prediction.mvpTeam) === norm(mvp)) {
    specialPoints += POINTS.mvp
  }

  const totalPoints = groupPoints + thirdPlacePoints + knockoutPoints + specialPoints
  return { groupPoints, thirdPlacePoints, knockoutPoints, specialPoints, totalPoints }
}

export const MAX_POINTS =
  12 * (POINTS.groupWinner + POINTS.groupRunnerUp + POINTS.groupBothBonus) +
  10 + // max third-place tier
  16 * POINTS.r32Winner +
  8 * POINTS.r16Winner +
  4 * POINTS.qfWinner +
  2 * POINTS.sfWinner +
  POINTS.thirdPlaceWinner +
  POINTS.finalWinner +
  POINTS.topScorer +
  POINTS.mvp
