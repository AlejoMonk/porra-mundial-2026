'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'

export async function register(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const alias = (formData.get('alias') as string)?.trim() || null
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!name || !email || !password) {
    return { error: 'Todos los campos son obligatorios.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }
  if (alias && alias.length > 30) {
    return { error: 'El alias no puede superar los 30 caracteres.' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Ya existe una cuenta con ese correo electrónico.' }
  }

  // Check if settings allow registration
  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (settings && !settings.registrationOpen) {
    return { error: 'El registro está cerrado.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // First user becomes admin
  const userCount = await prisma.user.count()
  const isAdmin = userCount === 0

  const user = await prisma.user.create({
    data: { name, alias, email, passwordHash, isAdmin },
  })

  // Ensure AppSettings exists
  await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton', registrationOpen: true },
  })

  await createSession({ userId: user.id, email: user.email, name: user.name, alias: user.alias ?? undefined, isAdmin: user.isAdmin })
  redirect('/predict')
}

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Introduce tu correo y contraseña.' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, alias: user.alias ?? undefined, isAdmin: user.isAdmin })

  // If user has locked prediction, go to leaderboard; otherwise predict
  const prediction = await prisma.prediction.findUnique({ where: { userId: user.id } })
  if (prediction?.isLocked) {
    redirect('/leaderboard')
  } else {
    redirect('/predict')
  }
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email) return { success: true } // generic response always

  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    const token = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password/${token.token}`

    try {
      await sendPasswordResetEmail(user.email, resetUrl)
    } catch (err) {
      console.error('Error sending reset email:', err)
      // Don't expose email errors to user
    }
  }

  // Always return success (don't reveal whether email exists)
  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const token = (formData.get('token') as string)?.trim()
  const password = formData.get('password') as string

  if (!token || !password) {
    return { error: 'Datos inválidos.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
    return { error: 'El enlace ha expirado o ya ha sido usado. Solicita uno nuevo.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: { passwordHash },
  })

  await prisma.passwordResetToken.update({
    where: { id: tokenRecord.id },
    data: { usedAt: new Date() },
  })

  redirect('/login?reset=ok')
}
