import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PredictionWizard from '@/components/PredictionWizard'
import Phase2Wizard from '@/components/Phase2Wizard'
import Phase3Wizard from '@/components/Phase3Wizard'
import { GROUPS, ALL_TEAMS, getTeam } from '@/lib/constants'
import { TeamFlag } from '@/components/TeamFlag'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Small reusable info screen
function InfoScreen({ icon, title, body, children }: { icon: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{icon}</div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>{title}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{body}</p>
      {children}
    </div>
  )
}

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
  const phase3DeadlinePassed = !!(settings?.phase3Deadline && now > settings.phase3Deadline)
  const phase1Locked = existing?.isLocked ?? false
  const phase2Locked = existing?.isPhase2Locked ?? false
  const phase3Locked = existing?.isPhase3Locked ?? false

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

  // ── Phase 1 closed but never submitted ──────────────────────────────────────
  if (!phase1Locked) {
    return (
      <InfoScreen icon="⏰" title="Plazo fase 1 cerrado" body="El plazo para la fase 1 ha finalizado y no enviaste tu predicción.">
        <Link href="/leaderboard" className="btn-primary">Ver clasificación</Link>
      </InfoScreen>
    )
  }

  // ── Phase 1 locked. Build the shared knockout bracket from admin's group results ──
  const adminGroupResultsRaw: Record<string, Record<string, string>> =
    tournament?.groupResults ? JSON.parse(tournament.groupResults) : {}
  const bracketGroupPredictions: Record<string, { winner: string; runnerUp: string }> = {}
  for (const [group, positions] of Object.entries(adminGroupResultsRaw)) {
    if (positions['1'] || positions['2']) {
      bracketGroupPredictions[group] = { winner: positions['1'] ?? '', runnerUp: positions['2'] ?? '' }
    }
  }
  const adminThirdPlaceAssignment: Record<number, string> = tournament?.thirdPlaceAssignment
    ? JSON.parse(tournament.thirdPlaceAssignment)
    : {}
  const thirdAssignmentProp = Object.keys(adminThirdPlaceAssignment).length > 0 ? adminThirdPlaceAssignment : undefined

  // ── FASE 2: dieciseisavos + octavos (partidos 73-96) ────────────────────────
  if (!phase2DeadlinePassed) {
    // Phase 2 window is current (or not yet opened by admin)
    if (!settings?.phase2Deadline) {
      return (
        <InfoScreen icon="✅" title="Fase 1 enviada" body="La fase 2 (dieciseisavos y octavos) aún no está habilitada. El admin la abrirá tras la fase de grupos.">
          <Link href="/leaderboard" className="btn-secondary">Ver clasificación</Link>
        </InfoScreen>
      )
    }

    const phase2Draft = existing!.knockoutPicks && existing!.knockoutPicks !== '{}'
      ? { knockoutPicks: JSON.parse(existing!.knockoutPicks || '{}') }
      : null

    return (
      <Phase2Wizard
        initialData={phase2Draft}
        phase1GroupPredictions={bracketGroupPredictions}
        phase1ThirdPlacePicks={[]}
        adminThirdPlaceAssignment={thirdAssignmentProp}
        isEditing={phase2Locked}
      />
    )
  }

  // ── Phase 2 window closed but never submitted → cannot continue to phase 3 ───
  if (!phase2Locked) {
    return (
      <InfoScreen icon="⏰" title="Plazo fase 2 cerrado" body="El plazo para la fase 2 ha finalizado sin que enviaras tus dieciseisavos y octavos.">
        <Link href="/leaderboard" className="btn-primary">Ver clasificación</Link>
      </InfoScreen>
    )
  }

  // ── FASE 3: cuartos → final + premios (partidos 97-104) ─────────────────────
  if (!phase3DeadlinePassed) {
    if (!settings?.phase3Deadline) {
      return (
        <InfoScreen icon="✅" title="Fase 2 enviada" body="La fase 3 (cuartos, semis, final y premios) aún no está habilitada. El admin la abrirá tras los octavos de final.">
          <Link href="/leaderboard" className="btn-secondary">Ver clasificación</Link>
        </InfoScreen>
      )
    }

    const lockedKnockoutPicks = JSON.parse(existing!.knockoutPicks || '{}')
    const phase3Draft = {
      knockoutPicks: lockedKnockoutPicks,
      topScorerTeam: existing!.topScorerTeam ?? '',
      mvpTeam: existing!.mvpTeam ?? '',
    }

    return (
      <Phase3Wizard
        initialData={phase3Draft}
        phase1GroupPredictions={bracketGroupPredictions}
        phase1ThirdPlacePicks={[]}
        adminThirdPlaceAssignment={thirdAssignmentProp}
        lockedKnockoutPicks={lockedKnockoutPicks}
        isEditing={phase3Locked}
      />
    )
  }

  // ── All phases over → complete summary ──────────────────────────────────────
  const kp = JSON.parse(existing!.knockoutPicks || '{}')
  const championCode = kp[104] as string | undefined
  const championTeam = championCode ? getTeam(championCode) : null

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{phase3Locked ? '✅' : '⏰'}</div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        {phase3Locked ? 'Predicción completa' : 'Plazo fase 3 cerrado'}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        {phase3Locked
          ? '¡Las tres fases enviadas! Buena suerte.'
          : 'El plazo para la fase 3 ha finalizado sin que enviaras tus cuartos, semis, final y premios.'}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <Link href={`/predictions/${session.userId}`} className="btn-primary">Ver mi predicción</Link>
        <Link href="/leaderboard" className="btn-secondary">Ver clasificación</Link>
      </div>
      {phase3Locked && (
        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'left' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', color: '#22c55e' }}>📋 Resumen</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
