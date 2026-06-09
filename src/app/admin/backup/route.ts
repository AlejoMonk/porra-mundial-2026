import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [users, predictions, tournament, settings] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        alias: true,
        email: true,
        isAdmin: true,
        createdAt: true,
        // passwordHash deliberately excluded
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.prediction.findMany({
      include: { user: { select: { name: true, alias: true, email: true } } },
      orderBy: { totalPoints: 'desc' },
    }),
    prisma.tournamentResult.findUnique({ where: { id: 'singleton' } }),
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
  ])

  const backup = {
    exportedAt: new Date().toISOString(),
    summary: {
      totalUsers: users.length,
      totalPredictions: predictions.length,
      phase1Submitted: predictions.filter((p: { isLocked: boolean }) => p.isLocked).length,
      phase2Submitted: predictions.filter((p: { isPhase2Locked: boolean }) => p.isPhase2Locked).length,
    },
    users,
    predictions,
    tournamentResult: tournament,
    appSettings: settings,
  }

  const filename = `porra-backup-${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
