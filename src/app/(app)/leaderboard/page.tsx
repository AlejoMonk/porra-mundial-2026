import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getTeam } from '@/lib/constants'
import { TeamFlag } from '@/components/TeamFlag'
import { Countdown } from '@/components/Countdown'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const session = await getSession()

  const [predictions, settings, tournament] = await Promise.all([
    prisma.prediction.findMany({
      where: { isLocked: true },
      include: { user: { select: { id: true, name: true, alias: true } } },
      orderBy: { totalPoints: 'desc' },
    }),
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.tournamentResult.findUnique({ where: { id: 'singleton' } }),
  ])

  const now = new Date()
  const deadlinePassed = settings?.predictionDeadline && now > settings.predictionDeadline
  const phase2DeadlinePassed = settings?.phase2Deadline && now > settings.phase2Deadline
  const phase3DeadlinePassed = settings?.phase3Deadline && now > settings.phase3Deadline
  const totalParticipants = await prisma.user.count()
  const submittedCount = predictions.length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem' }}>
            📊 Clasificación
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {submittedCount} de {totalParticipants} participantes han enviado su predicción
          </p>
        </div>
        {(() => {
          const myPred = predictions.find((p: { user: { id: string } }) => p.user.id === session?.userId)
          return (
            <Link
              href={myPred ? `/predictions/${session?.userId}` : '/predict'}
              className="btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              {myPred ? '✅ Mi predicción' : '⚽ Predecir'}
            </Link>
          )
        })()}
      </div>

      {/* Countdowns */}
      {(settings?.predictionDeadline || settings?.phase2Deadline || settings?.phase3Deadline) && (
        <div className="glass" style={{ padding: '0.875rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {settings?.predictionDeadline && !deadlinePassed && (
            <Countdown
              deadline={settings.predictionDeadline.toISOString()}
              label="⏳ Fase 1 cierra en"
              color="#22c55e"
            />
          )}
          {settings?.predictionDeadline && deadlinePassed && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✅ Fase 1 cerrada</span>
          )}
          {settings?.phase2Deadline && !phase2DeadlinePassed && (
            <Countdown
              deadline={settings.phase2Deadline.toISOString()}
              label="⏳ Fase 2 cierra en"
              color="#f59e0b"
            />
          )}
          {settings?.phase2Deadline && phase2DeadlinePassed && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✅ Fase 2 cerrada</span>
          )}
          {settings?.phase3Deadline && !phase3DeadlinePassed && (
            <Countdown
              deadline={settings.phase3Deadline.toISOString()}
              label="⏳ Fase 3 cierra en"
              color="#3b82f6"
            />
          )}
          {settings?.phase3Deadline && phase3DeadlinePassed && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✅ Fase 3 cerrada</span>
          )}
        </div>
      )}

      {/* Tournament status */}
      {tournament && (tournament.topScorer || tournament.mvp) && (
        <div className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {tournament.topScorer && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>⚽ Pichichi</div>
              <div style={{ fontWeight: 700 }}>{(() => { const t = getTeam(tournament.topScorer!); return t ? `${t.flag} ${t.name}` : tournament.topScorer })()}</div>
            </div>
          )}
          {tournament.mvp && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>⭐ MVP</div>
              <div style={{ fontWeight: 700 }}>{(() => { const t = getTeam(tournament.mvp!); return t ? `${t.flag} ${t.name}` : tournament.mvp })()}</div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard table */}
      {predictions.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', borderRadius: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
          <p style={{ color: 'var(--text-muted)' }}>Aún no hay predicciones enviadas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {predictions.map((pred: typeof predictions[0], idx: number) => {
            const rank = idx + 1
            const isMe = pred.user.id === session?.userId
            const kp = JSON.parse(pred.knockoutPicks || '{}')
            const championCode = kp[104] as string | undefined
            const champion = championCode ? getTeam(championCode) : null
            const canViewPrediction = deadlinePassed || isMe || session?.isAdmin

            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`

            return (
              <div
                key={pred.id}
                className={`leaderboard-entry glass ${rankClass}${rank === 1 ? ' glow-gold' : ''}`}
                style={{
                  padding: '0.875rem 1.25rem',
                  borderRadius: '0.75rem',
                  outline: isMe ? '2px solid rgba(34,197,94,0.5)' : undefined,
                  borderLeft: rank === 1 ? '3px solid #f59e0b' : rank === 2 ? '3px solid #94a3b8' : rank === 3 ? '3px solid #d97706' : undefined,
                }}
              >
                {/* Rank */}
                <div className="lb-rank" style={{ fontSize: rank <= 3 ? '1.5rem' : '1.125rem', fontWeight: 900 }}>
                  {rankEmoji}
                </div>

                {/* Name + champion */}
                <div className="lb-name">
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {pred.user.alias ?? pred.user.name}
                    {isMe && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Tú</span>}
                  </div>
                  {champion && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                      🏆 <TeamFlag code={championCode!} /> {champion.name}
                    </div>
                  )}
                </div>

                {/* Score breakdown */}
                <div className="leaderboard-score-row" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  {[
                    { label: 'Grupos', value: pred.groupPoints },
                    { label: 'Terceros', value: pred.thirdPlacePoints },
                    { label: 'Eliminat.', value: pred.knockoutPoints },
                    { label: 'Premios', value: pred.specialPoints },
                  ].map(({ label, value }) => (
                    <div key={label} className="score-detail" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700 }}>{value}</div>
                    </div>
                  ))}
                  <div className="leaderboard-total-sep" style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL</div>
                    <div className="leaderboard-total-pts" style={{ fontSize: rank === 1 ? '1.75rem' : '1.35rem', fontWeight: 900, color: rank === 1 ? '#f59e0b' : '#22c55e' }}>
                      {pred.totalPoints}
                    </div>
                  </div>
                </div>

                {/* Ver button */}
                {canViewPrediction && (
                  <div className="lb-actions">
                    <Link
                      href={`/predictions/${pred.user.id}`}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.625rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      Ver →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Scoring info */}
      <details style={{ marginTop: '2rem' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', userSelect: 'none' }}>
          ℹ️ Sistema de puntuación
        </summary>
        <div className="glass" style={{ marginTop: '0.75rem', padding: '1.25rem', borderRadius: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 2rem' }}>
            {[
              ['1º de grupo', '5 pts'], ['2º de grupo', '3 pts'], ['Ambos (bonus)', '+2 pts'],
              ['Dieciséisavo de final', '3 pts'], ['Octavo de final', '4 pts'],
              ['Cuarto de final', '6 pts'], ['Semifinal', '8 pts'],
              ['3er Puesto', '5 pts'], ['Campeón', '15 pts'],
              ['Pichichi (nombre)', '10 pts'], ['MVP (nombre)', '8 pts'],
            ].map(([desc, pts]) => (
              <div key={desc} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.125rem 0' }}>
                <span>{desc}</span>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>{pts}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(34,197,94,0.06)', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>🥉 Mejores terceros (escalonado):</span>
            <span style={{ marginLeft: '0.5rem' }}>1-2 acertados → 1 pt · 3-4 → 3 pts · 5-6 → 5 pts · 7-8 → 10 pts</span>
          </div>
        </div>
      </details>
    </div>
  )
}
