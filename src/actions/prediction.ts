'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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

// ── Phase 2: knockout picks + special awards ─────────────────────────────────

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

  await prisma.prediction.update({
    where: { userId: session.userId },
    data: {
      knockoutPicks: JSON.stringify(data.knockoutPicks ?? {}),
      topScorerTeam: data.topScorerTeam || null,
      mvpTeam: data.mvpTeam || null,
    },
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

  await prisma.prediction.update({
    where: { userId: session.userId },
    data: {
      knockoutPicks: JSON.stringify(data.knockoutPicks ?? {}),
      topScorerTeam: data.topScorerTeam || null,
      mvpTeam: data.mvpTeam || null,
      isPhase2Locked: true,
      phase2SubmittedAt: new Date(),
    },
  })

  revalidatePath('/leaderboard')
  redirect('/leaderboard')
}
