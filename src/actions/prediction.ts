'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { isPhase2Match, isPhase3Match } from '@/lib/constants'

// Merge incoming picks for a given phase into the existing knockoutPicks,
// leaving the other phase's picks untouched. `belongsToPhase` selects which
// match numbers this phase owns.
function mergePhasePicks(
  existingRaw: string,
  incoming: Record<string, string>,
  belongsToPhase: (matchNum: number) => boolean
): Record<string, string> {
  const merged: Record<string, string> = JSON.parse(existingRaw || '{}')
  // Clear this phase's slots, then apply the incoming picks for this phase only
  for (const key of Object.keys(merged)) {
    if (belongsToPhase(Number(key))) delete merged[key]
  }
  for (const [key, val] of Object.entries(incoming || {})) {
    if (val && belongsToPhase(Number(key))) merged[key] = val
  }
  return merged
}

// ── Phase 1: group predictions + third-place picks ───────────────────────────

export async function savePrediction(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const rawData = formData.get('data') as string
  if (!rawData) return { error: 'Datos inválidos.' }
  const data = JSON.parse(rawData)

  // Block only after deadline
  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (settings?.predictionDeadline && new Date() > settings.predictionDeadline) {
    return { error: 'El plazo de predicción de fase 1 ha cerrado.' }
  }

  await prisma.prediction.upsert({
    where: { userId: session.userId },
    update: {
      groupPredictions: JSON.stringify(data.groupPredictions ?? {}),
      thirdPlacePicks: JSON.stringify(data.thirdPlacePicks ?? []),
    },
    create: {
      userId: session.userId,
      groupPredictions: JSON.stringify(data.groupPredictions ?? {}),
      thirdPlacePicks: JSON.stringify(data.thirdPlacePicks ?? []),
    },
  })

  return { success: true }
}

export async function submitPrediction(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const rawData = formData.get('data') as string
  if (!rawData) return { error: 'Datos inválidos.' }
  const data = JSON.parse(rawData)

  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (settings?.predictionDeadline && new Date() > settings.predictionDeadline) {
    return { error: 'El plazo de predicción de fase 1 ha cerrado.' }
  }

  await prisma.prediction.upsert({
    where: { userId: session.userId },
    update: {
      groupPredictions: JSON.stringify(data.groupPredictions ?? {}),
      thirdPlacePicks: JSON.stringify(data.thirdPlacePicks ?? []),
      isLocked: true,
      submittedAt: new Date(),
    },
    create: {
      userId: session.userId,
      groupPredictions: JSON.stringify(data.groupPredictions ?? {}),
      thirdPlacePicks: JSON.stringify(data.thirdPlacePicks ?? []),
      isLocked: true,
      submittedAt: new Date(),
    },
  })

  revalidatePath('/leaderboard')
  redirect('/leaderboard')
}

// ── Phase 2: dieciseisavos + octavos (partidos 73-96) ────────────────────────

export async function savePhase2Prediction(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const rawData = formData.get('data') as string
  if (!rawData) return { error: 'Datos inválidos.' }
  const data = JSON.parse(rawData)

  // Block only after deadline
  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (settings?.phase2Deadline && new Date() > settings.phase2Deadline) {
    return { error: 'El plazo de predicción de fase 2 ha cerrado.' }
  }

  const existing = await prisma.prediction.findUnique({ where: { userId: session.userId } })
  if (!existing?.isLocked) return { error: 'Debes completar la fase 1 primero.' }

  const merged = mergePhasePicks(existing.knockoutPicks, data.knockoutPicks ?? {}, isPhase2Match)

  await prisma.prediction.update({
    where: { userId: session.userId },
    data: { knockoutPicks: JSON.stringify(merged) },
  })

  return { success: true }
}

export async function submitPhase2Prediction(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const rawData = formData.get('data') as string
  if (!rawData) return { error: 'Datos inválidos.' }
  const data = JSON.parse(rawData)

  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (settings?.phase2Deadline && new Date() > settings.phase2Deadline) {
    return { error: 'El plazo de predicción de fase 2 ha cerrado.' }
  }

  const existing = await prisma.prediction.findUnique({ where: { userId: session.userId } })
  if (!existing?.isLocked) return { error: 'Debes completar la fase 1 primero.' }

  const merged = mergePhasePicks(existing.knockoutPicks, data.knockoutPicks ?? {}, isPhase2Match)

  await prisma.prediction.update({
    where: { userId: session.userId },
    data: {
      knockoutPicks: JSON.stringify(merged),
      isPhase2Locked: true,
      phase2SubmittedAt: new Date(),
    },
  })

  revalidatePath('/leaderboard')
  redirect('/leaderboard')
}

// ── Phase 3: cuartos → final (partidos 97-104) + premios ─────────────────────

export async function savePhase3Prediction(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const rawData = formData.get('data') as string
  if (!rawData) return { error: 'Datos inválidos.' }
  const data = JSON.parse(rawData)

  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (settings?.phase3Deadline && new Date() > settings.phase3Deadline) {
    return { error: 'El plazo de predicción de fase 3 ha cerrado.' }
  }

  const existing = await prisma.prediction.findUnique({ where: { userId: session.userId } })
  if (!existing?.isPhase2Locked) return { error: 'Debes completar la fase 2 primero.' }

  const merged = mergePhasePicks(existing.knockoutPicks, data.knockoutPicks ?? {}, isPhase3Match)

  await prisma.prediction.update({
    where: { userId: session.userId },
    data: {
      knockoutPicks: JSON.stringify(merged),
      topScorerTeam: data.topScorerTeam || null,
      mvpTeam: data.mvpTeam || null,
    },
  })

  return { success: true }
}

export async function submitPhase3Prediction(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  const rawData = formData.get('data') as string
  if (!rawData) return { error: 'Datos inválidos.' }
  const data = JSON.parse(rawData)

  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (settings?.phase3Deadline && new Date() > settings.phase3Deadline) {
    return { error: 'El plazo de predicción de fase 3 ha cerrado.' }
  }

  const existing = await prisma.prediction.findUnique({ where: { userId: session.userId } })
  if (!existing?.isPhase2Locked) return { error: 'Debes completar la fase 2 primero.' }

  const merged = mergePhasePicks(existing.knockoutPicks, data.knockoutPicks ?? {}, isPhase3Match)

  await prisma.prediction.update({
    where: { userId: session.userId },
    data: {
      knockoutPicks: JSON.stringify(merged),
      topScorerTeam: data.topScorerTeam || null,
      mvpTeam: data.mvpTeam || null,
      isPhase3Locked: true,
      phase3SubmittedAt: new Date(),
    },
  })

  revalidatePath('/leaderboard')
  redirect('/leaderboard')
}
