import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PredictionWizard from '@/components/PredictionWizard'
import Phase2Wizard from '@/components/Phase2Wizard'
import { GROUPS, ALL_TEAMS, getTeam } from '@/lib/constants'
import { TeamFlag } from '@/components/TeamFlag'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PredictPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [existing, settings, tournament] = await Promise.all([
    prisma.prediction.findUnique({ where: { userId: session.userId } }),
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.tournamentResult.findUnique({ where: { id: 'singleton' }, select: { thirdPlaceAssignment: true, groupResults: true } }),
  ])

  const now = new Date()
  const phase1DeadlinePassed = !!(settings?.predictionDeadline && now > settings.predictionDeadline)
  const phase2DeadlinePassed = !!(settings?.phase2Deadline && now > settings.phase2Deadline)
  const phase1Locked = existing?.isLocked ?? false
  const phase2Locked = existing?.isPhase2Locked ?? false

  // ── Phase 1 still open → always show wizard (editable, even if already submitted) ──
  if (!phase1DeadlinePassed) {
    const draftData = existing
      ? {
          groupPredictions: JSON.parse(existing.groupPredictions || '{}'),
          thirdPlacePicks: JSON.parse(existing.thirdPlacePicks || '[]'),
        }
      : null
    return (
      <PredictionWizard
        initialData={draftData}
        groups={GROUPS}
        allTeams={ALL_TEAMS}
        isEditing={phase1Locked}
      />
    )
  }

  // ── Phase 1 closed ──────────────────────────────────────────────────────────
  if (!phase1Locked) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏰</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Plazo fase 1 cerrado</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>El plazo para la fase 1 ha finalizado y no enviaste tu predicción.</p>
        <Link href="/leaderboard" className="btn-primary">Ver clasificación</Link>
      </div>
    )
  }

  // ── Phase 1 submitted. Both phases over → complete summary ─────────────────
  if (phase2DeadlinePassed) {
    const kp = JSON.parse(existing!.knockoutPicks || '{}')
    const championCode = kp[104] as string | undefined
    const championTeam = championCode ? getTeam(championCode) : null

    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{phase2Locked ? '✅' : '⏰'}</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {phase2Locked ? 'Predicción completa' : 'Plazo fase 2 cerrado'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {phase2Locked
            ? '¡Las dos fases enviadas! Buena suerte.'
            : 'El plazo para la fase 2 ha finalizado sin que enviaras tus predicciones de eliminatorias.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
          <Link href={`/predictions/${session.userId}`} className="btn-primary">Ver mi predicción</Link>
          <Link href="/leaderboard" className="btn-secondary">Ver clasificación</Link>
        </div>
        {phase2Locked && (
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'left' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', color: '#f59e0b' }}>📋 Resumen</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fase 1 enviada</div>
                <div style={{ fontWeight: 600 }}>{new Date(existing!.submittedAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
              {existing!.phase2SubmittedAt && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fase 2 enviada</div>
                  <div style={{ fontWeight: 600 }}>{new Date(existing!.phase2SubmittedAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
              )}
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>🏆 Campeón</div>
                <div style={{ fontWeight: 700, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {championTeam ? <><TeamFlag code={championCode!} />{championTeam.name}</> : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>⚽ Pichichi</div>
                <div style={{ fontWeight: 600 }}>{existing!.topScorerTeam || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>⭐ MVP</div>
                <div style={{ fontWeight: 600 }}>{existing!.mvpTeam || '—'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Phase 2 not activated yet ───────────────────────────────────────────────
  if (!settings?.phase2Deadline) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Fase 1 enviada</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          La fase 2 (eliminatorias) aún no está habilitada. El admin la abrirá tras la fase de grupos.
        </p>
        <Link href="/leaderboard" className="btn-secondary">Ver clasificación</Link>
      </div>
    )
  }

  // ── Phase 2 open → show Phase2Wizard (editable until deadline) ─────────────

  // Build bracket from admin's ACTUAL group results, not the user's own predictions.
  // If the admin hasn't entered results yet, all slots render as placeholders ("1º Grupo X" dimmed).
  const adminGroupResultsRaw: Record<string, Record<string, string>> =
    tournament?.groupResults ? JSON.parse(tournament.groupResults) : {}
  // Convert {A:{"1":"MEX","2":"KOR",...}} → {A:{winner:"MEX",runnerUp:"KOR"}}
  const bracketGroupPredictions: Record<string, { winner: string; runnerUp: string }> = {}
  for (const [group, positions] of Object.entries(adminGroupResultsRaw)) {
    if (positions['1'] || positions['2']) {
      bracketGroupPredictions[group] = {
        winner: positions['1'] ?? '',
        runnerUp: positions['2'] ?? '',
      }
    }
  }

  const adminThirdPlaceAssignment: Record<number, string> = tournament?.thirdPlaceAssignment
    ? JSON.parse(tournament.thirdPlaceAssignment)
    : {}

  const hasPhase2Draft = existing!.knockoutPicks && existing!.knockoutPicks !== '{}'
  const phase2Draft = hasPhase2Draft
    ? {
        knockoutPicks: JSON.parse(existing!.knockoutPicks || '{}'),
        topScorerTeam: existing!.topScorerTeam ?? '',
        mvpTeam: existing!.mvpTeam ?? '',
      }
    : null

  return (
    <Phase2Wizard
      initialData={phase2Draft}
      phase1GroupPredictions={bracketGroupPredictions}
      phase1ThirdPlacePicks={[]}
      adminThirdPlaceAssignment={Object.keys(adminThirdPlaceAssignment).length > 0 ? adminThirdPlaceAssignment : undefined}
      isEditing={phase2Locked}
    />
  )
}
