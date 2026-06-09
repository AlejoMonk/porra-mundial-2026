import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getTeam, GROUPS, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, THIRD_PLACE_MATCH, FINAL_MATCH } from '@/lib/constants'
import { TeamFlag } from '@/components/TeamFlag'
import { BackButton } from '@/components/BackButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function UserPredictionPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const session = await getSession()

  const [user, prediction, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, alias: true } }),
    prisma.prediction.findUnique({ where: { userId }, include: { user: { select: { name: true, alias: true } } } }),
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
  ])

  if (!user || !prediction) notFound()

  const isMe = session?.userId === userId
  const now = new Date()
  const phase1DeadlinePassed = !!(settings?.predictionDeadline && now > settings.predictionDeadline)
  const phase2DeadlinePassed = !!(settings?.phase2Deadline && now > settings.phase2Deadline)
  const deadlinePassed = phase1DeadlinePassed
  const canEditPhase1 = isMe && !phase1DeadlinePassed && prediction.isLocked
  const canEditPhase2 = isMe && phase1DeadlinePassed && !phase2DeadlinePassed && !!settings?.phase2Deadline && prediction.isLocked
  if (!isMe && !deadlinePassed && !session?.isAdmin) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <p style={{ color: 'var(--text-muted)' }}>Las predicciones de otros jugadores se revelan tras el cierre del plazo.</p>
        <Link href="/leaderboard" className="btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>← Volver</Link>
      </div>
    )
  }

  const gp = JSON.parse(prediction.groupPredictions || '{}') as Record<string, { winner: string; runnerUp: string }>
  const tp = JSON.parse(prediction.thirdPlacePicks || '[]') as string[]
  const kp = JSON.parse(prediction.knockoutPicks || '{}') as Record<string, string>

  function TeamCell({ code }: { code?: string | null }) {
    if (!code) return <span style={{ color: 'var(--text-muted)' }}>—</span>
    const t = getTeam(code)
    if (!t) return <span>{code}</span>
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}><TeamFlag code={t.code} />{t.name}</span>
  }

  function MatchRow({ matchNum, label }: { matchNum: number; label: string }) {
    const winner = kp[matchNum]
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
        <span style={{ color: 'var(--text-muted)', minWidth: 120 }}>{label}</span>
        <span style={{ fontWeight: winner ? 600 : 400 }}>
          <TeamCell code={winner} />
        </span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <BackButton />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, flex: 1, color: 'var(--text)' }}>
          {isMe ? '🗳️ Mi predicción' : `Predicción de ${user.alias ?? user.name}`}
        </h1>
        {isMe && <span className="badge badge-green">Tú</span>}
        {canEditPhase1 && (
          <Link href="/predict" className="btn-primary" style={{ fontSize: '0.875rem', background: '#22c55e', color: '#0a0f0a' }}>
            ✏️ Editar fase 1
          </Link>
        )}
        {canEditPhase2 && (
          <Link href="/predict" className="btn-primary" style={{ fontSize: '0.875rem', background: '#f59e0b', color: '#0a0f0a' }}>
            ✏️ Editar fase 2
          </Link>
        )}
      </div>

      {/* Score summary */}
      {prediction.totalPoints > 0 && (
        <div className="glass pred-score-summary" style={{ padding: '1rem 1.25rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
          {[
            { label: 'Grupos', value: prediction.groupPoints },
            { label: 'Terceros', value: prediction.thirdPlacePoints },
            { label: 'Eliminat.', value: prediction.knockoutPoints },
            { label: 'Premios', value: prediction.specialPoints },
            { label: 'TOTAL', value: prediction.totalPoints, highlight: true },
          ].map(({ label, value, highlight }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: highlight ? '1.75rem' : '1.25rem', fontWeight: 900, color: highlight ? '#22c55e' : 'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Group stage */}
        <section className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', color: '#22c55e' }}>📋 Fase de grupos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {GROUPS.map((group) => {
              const picks = gp[group.name]
              const w = picks?.winner ? getTeam(picks.winner) : null
              const r = picks?.runnerUp ? getTeam(picks.runnerUp) : null
              return (
                <div key={group.name} style={{ background: 'var(--surface)', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.8rem', color: '#22c55e' }}>Grupo {group.name}</div>
                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>🥇 {w ? <><TeamFlag code={w.code} />{w.name}</> : <span style={{ color: 'var(--text-muted)' }}>Sin seleccionar</span>}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>🥈 {r ? <><TeamFlag code={r.code} />{r.name}</> : <span style={{ color: 'var(--text-muted)' }}>Sin seleccionar</span>}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Third place picks */}
        <section className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', color: '#22c55e' }}>🥉 Terceros clasificados</h2>
          {tp.length === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>Ninguno seleccionado</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {tp.map((code) => {
                const t = getTeam(code)
                return t ? (
                  <span key={code} className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}><TeamFlag code={t.code} />{t.name}</span>
                ) : null
              })}
            </div>
          )}
        </section>

        {/* Knockout — only visible when phase 2 is submitted */}
        {prediction.isPhase2Locked ? (
          <>
            <section className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '1rem', color: '#f59e0b' }}>⚔️ Fase eliminatoria</h2>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>⚔️</span> Dieciséisavos
                </div>
                {R32_MATCHES.map((m) => <MatchRow key={m.match} matchNum={m.match} label={`Partido ${m.match - 72}`} />)}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>🔟</span> Octavos de Final
                </div>
                {R16_MATCHES.map((m) => <MatchRow key={m} matchNum={m} label={`Octavo ${m - 88}`} />)}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>🏅</span> Cuartos de Final
                </div>
                {QF_MATCHES.map((m) => <MatchRow key={m} matchNum={m} label={`Cuarto ${m - 96}`} />)}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>🏆</span> Semis y Final
                </div>
                {SF_MATCHES.map((m) => <MatchRow key={m} matchNum={m} label={`Semifinal ${m - 100}`} />)}
                <MatchRow matchNum={THIRD_PLACE_MATCH} label="3er Puesto" />
                <MatchRow matchNum={FINAL_MATCH} label="🏆 Final" />
              </div>
            </section>

            <section className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '1rem', color: '#f59e0b' }}>⭐ Premios especiales</h2>
              <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>⚽ Pichichi</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{prediction.topScorerTeam || <span style={{ color: 'var(--text-muted)' }}>Sin indicar</span>}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>⭐ MVP</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{prediction.mvpTeam || <span style={{ color: 'var(--text-muted)' }}>Sin indicar</span>}</div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text)' }}>Fase 2 pendiente</div>
            <div style={{ fontSize: '0.85rem' }}>Las predicciones de eliminatorias y premios estarán visibles cuando el participante envíe la fase 2.</div>
          </section>
        )}
      </div>
    </div>
  )
}
