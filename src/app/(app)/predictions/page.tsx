import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AllPredictionsPage() {
  const session = await getSession()

  const [predictions, settings, totalUsers] = await Promise.all([
    prisma.prediction.findMany({
      where: { isLocked: true },
      include: { user: { select: { id: true, name: true, alias: true } } },
      orderBy: { totalPoints: 'desc' },
    }),
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.user.count(),
  ])

  const now = new Date()
  const phase1DeadlinePassed = !!(settings?.predictionDeadline && now > settings.predictionDeadline)
  const canView = phase1DeadlinePassed || session?.isAdmin

  const deadlineStr = settings?.predictionDeadline
    ? new Date(settings.predictionDeadline).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
    : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)' }}>👥 Participantes</h1>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {predictions.length} de {totalUsers} han enviado su predicción
        </span>
      </div>

      {/* Explanation banner */}
      <div
        className="glass"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          borderLeft: `3px solid ${canView ? '#22c55e' : '#f59e0b'}`,
        }}
      >
        <span style={{ fontSize: '1.25rem', lineHeight: 1.4 }}>{canView ? '👁️' : '🔒'}</span>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {canView ? (
            <>Las predicciones de fase 1 son visibles para todos. Haz clic en cualquier participante para ver su predicción.</>
          ) : (
            <>
              Las predicciones de los demás participantes{' '}
              <strong style={{ color: 'var(--text)' }}>se revelarán cuando cierre el plazo de fase 1</strong>
              {deadlineStr ? <> ({deadlineStr})</> : null}.
              {' '}Hasta entonces, solo tú puedes ver la tuya.
            </>
          )}
        </div>
      </div>

      {/* Participants list */}
      {predictions.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', borderRadius: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏃</div>
          <p style={{ color: 'var(--text-muted)' }}>Aún no hay predicciones enviadas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {predictions.map((pred: typeof predictions[0], idx: number) => {
            const rank = idx + 1
            const isMe = pred.user.id === session?.userId
            const clickable = canView || isMe
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`

            const card = (
              <div
                className="glass"
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: clickable ? 'pointer' : 'default',
                  opacity: clickable ? 1 : 0.7,
                  outline: isMe ? '2px solid rgba(34,197,94,0.4)' : undefined,
                  transition: 'opacity 0.15s',
                }}
              >
                {/* Rank */}
                <div style={{ fontSize: rank <= 3 ? '1.4rem' : '1rem', fontWeight: 900, minWidth: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  {rankEmoji}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
                    {pred.user.alias ?? pred.user.name}
                    {isMe && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Tú</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                    {pred.isPhase2Locked
                      ? '✅ Fase 1 y 2 enviadas'
                      : '✅ Fase 1 enviada'}
                  </div>
                </div>

                {/* Points */}
                <div style={{ textAlign: 'right' }}>
                  {pred.totalPoints > 0 ? (
                    <>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>PUNTOS</div>
                      <div style={{ fontWeight: 900, fontSize: '1.25rem', color: rank === 1 ? '#f59e0b' : '#22c55e' }}>
                        {pred.totalPoints}
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Lock icon if not clickable */}
                {!clickable && (
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>🔒</div>
                )}
                {clickable && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ver →</div>
                )}
              </div>
            )

            return clickable ? (
              <Link key={pred.id} href={`/predictions/${pred.user.id}`} style={{ textDecoration: 'none' }}>
                {card}
              </Link>
            ) : (
              <div key={pred.id}>{card}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
