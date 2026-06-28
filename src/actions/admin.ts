'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { calculateScore } from '@/lib/scoring'

async function requireAdmin() {
  const session = await getSession()
  if (!session?.isAdmin) throw new Error('Unauthorized')
  return session
}

export async function updateGroupResults(formData: FormData) {
  await requireAdmin()
  const rawData = formData.get('data') as string
  const groupResults = JSON.parse(rawData)

  await prisma.tournamentResult.upsert({
    where: { id: 'singleton' },
    update: { groupResults: JSON.stringify(groupResults) },
    create: { id: 'singleton', groupResults: JSON.stringify(groupResults) },
  })

  await recalculateAllScores()
  revalidatePath('/leaderboard')
  revalidatePath('/admin')
}

export async function updateMatchResult(matchNum: number, winnerCode: string) {
  await requireAdmin()

  const result = await prisma.tournamentResult.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  const matchResults = JSON.parse(result.matchResults || '{}')
  matchResults[matchNum] = winnerCode

  await prisma.tournamentResult.update({
    where: { id: 'singleton' },
    data: { matchResults: JSON.stringify(matchResults) },
  })

  await recalculateAllScores()
  revalidatePath('/leaderboard')
  revalidatePath('/admin')
}

export async function updateThirdPlaceQualifiers(teamCodes: string[]) {
  await requireAdmin()

  await prisma.tournamentResult.upsert({
    where: { id: 'singleton' },
    update: { thirdPlaceQualifiers: JSON.stringify(teamCodes) },
    create: { id: 'singleton', thirdPlaceQualifiers: JSON.stringify(teamCodes) },
  })

  await recalculateAllScores()
  revalidatePath('/leaderboard')
}

export async function updateThirdPlaceAssignment(assignment: Record<number, string>) {
  await requireAdmin()

  await prisma.tournamentResult.upsert({
    where: { id: 'singleton' },
    update: { thirdPlaceAssignment: JSON.stringify(assignment) },
    create: { id: 'singleton', thirdPlaceAssignment: JSON.stringify(assignment) },
  })

  revalidatePath('/predict')
  revalidatePath('/admin')
}

export async function updateSpecialResults(topScorer: string, mvp: string) {
  await requireAdmin()

  await prisma.tournamentResult.upsert({
    where: { id: 'singleton' },
    update: { topScorer, mvp },
    create: { id: 'singleton', topScorer, mvp },
  })

  await recalculateAllScores()
  revalidatePath('/leaderboard')
}

export async function updateSettings(formData: FormData) {
  await requireAdmin()
  const deadline = formData.get('deadline') as string
  const phase2Deadline = formData.get('phase2Deadline') as string
  const phase3Deadline = formData.get('phase3Deadline') as string
  const regOpen = formData.get('registrationOpen') === 'true'

  await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    update: {
      predictionDeadline: deadline ? new Date(deadline) : null,
      phase2Deadline: phase2Deadline ? new Date(phase2Deadline) : null,
      phase3Deadline: phase3Deadline ? new Date(phase3Deadline) : null,
      registrationOpen: regOpen,
    },
    create: {
      id: 'singleton',
      predictionDeadline: deadline ? new Date(deadline) : null,
      phase2Deadline: phase2Deadline ? new Date(phase2Deadline) : null,
      phase3Deadline: phase3Deadline ? new Date(phase3Deadline) : null,
      registrationOpen: regOpen,
    },
  })

  revalidatePath('/admin')
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin()
  if (session.userId === userId) throw new Error('No puedes eliminarte a ti mismo')
  await prisma.prediction.deleteMany({ where: { userId } })
  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/admin/users')
  revalidatePath('/leaderboard')
}

export async function recalculateAllScores() {
  const [predictions, tournament] = await Promise.all([
    prisma.prediction.findMany({ where: { isLocked: true } }),
    prisma.tournamentResult.findUnique({ where: { id: 'singleton' } }),
  ])

  if (!tournament) return

  const groupResults = JSON.parse(tournament.groupResults || '{}')
  const matchResults = JSON.parse(tournament.matchResults || '{}')
  const thirdPlaceQualifiers = JSON.parse(tournament.thirdPlaceQualifiers || '[]')

  for (const pred of predictions) {
    const predData = {
      groupPredictions: JSON.parse(pred.groupPredictions || '{}'),
      thirdPlacePicks: JSON.parse(pred.thirdPlacePicks || '[]'),
      knockoutPicks: JSON.parse(pred.knockoutPicks || '{}'),
      topScorerTeam: pred.topScorerTeam,
      mvpTeam: pred.mvpTeam,
    }

    const scores = calculateScore(
      predData,
      groupResults,
      matchResults,
      thirdPlaceQualifiers,
      tournament.topScorer,
      tournament.mvp
    )

    await prisma.prediction.update({
      where: { id: pred.id },
      data: scores,
    })
  }
}
