'use client'

import { useState, useTransition, useCallback } from 'react'
import { Group, Team, getTeam } from '@/lib/constants'
import { getAvailableThirdPlaceTeams, GroupPredictions } from '@/lib/bracket'
import { submitPrediction, savePrediction } from '@/actions/prediction'
import { TeamFlag } from '@/components/TeamFlag'

interface Phase1Data {
  groupPredictions: GroupPredictions
  thirdPlacePicks: string[]
}

const TOTAL_STEPS = 3
const STEP_LABELS = ['Grupos A-F', 'Grupos G-L', 'Terceros clasificados']

export default function PredictionWizard({
  initialData,
  groups,
  allTeams,
  isEditing = false,
}: {
  initialData: Phase1Data | null
  groups: Group[]
  allTeams: Team[]
  isEditing?: boolean
}) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<Phase1Data>(
    initialData ?? { groupPredictions: {}, thirdPlacePicks: [] }
  )
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const setGroupPick = useCallback((group: string, role: 'winner' | 'runnerUp', teamCode: string) => {
    setData((prev) => {
      const gp = { ...prev.groupPredictions }
      const existing = gp[group] ?? { winner: '', runnerUp: '' }

      if (role === 'winner') {
        if (existing.winner === teamCode) {
          gp[group] = { ...existing, winner: '' }
        } else if (existing.runnerUp === teamCode) {
          gp[group] = { winner: teamCode, runnerUp: existing.winner }
        } else {
          gp[group] = { ...existing, winner: teamCode }
        }
      } else {
        if (existing.runnerUp === teamCode) {
          gp[group] = { ...existing, runnerUp: '' }
        } else if (existing.winner === teamCode) {
          gp[group] = { winner: existing.runnerUp, runnerUp: teamCode }
        } else {
          gp[group] = { ...existing, runnerUp: teamCode }
        }
      }
      return { ...prev, groupPredictions: gp }
    })
  }, [])

  const toggleThirdPick = useCallback((code: string) => {
    setData((prev) => {
      const picks = prev.thirdPlacePicks
      if (picks.includes(code)) return { ...prev, thirdPlacePicks: picks.filter((p) => p !== code) }
      if (picks.length >= 8) return prev
      return { ...prev, thirdPlacePicks: [...picks, code] }
    })
  }, [])

  function autoSave() {
    const formData = new FormData()
    formData.set('data', JSON.stringify(data))
    startTransition(async () => { await savePrediction(formData) })
  }

  function goNext() { autoSave(); setStep((s) => Math.min(s + 1, TOTAL_STEPS)) }
  function goPrev() { setStep((s) => Math.max(s - 1, 1)) }

  function handleSubmit() {
    setError(null)
    const formData = new FormData()
    formData.set('data', JSON.stringify(data))
    startTransition(async () => {
      const result = await submitPrediction(formData)
      if (result && 'error' in result) {
        setError(result.error ?? null)
        setShowSubmitConfirm(false)
      }
    })
  }

  const groupsFirstHalf = groups.slice(0, 6)
  const groupsSecondHalf = groups.slice(6, 12)
  const availableThird = getAvailableThirdPlaceTeams(data.groupPredictions, allTeams)
  const progress = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '0.25rem 0.75rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>Fase 1 · Grupos y Terceros</span>
              </div>
              {isEditing && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, padding: '0.25rem 0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>✏️ Editando</span>
                </div>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isEditing ? '✏️ Editar predicción' : '🗳️ Haz tu predicción'}</h1>
          </div>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Paso {step} de {TOTAL_STEPS}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.75rem' }}>
          {STEP_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => { autoSave(); setStep(i + 1) }}
              style={{
                flexShrink: 0,
                padding: '0.25rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.7rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: step === i + 1 ? 700 : 400,
                background: step === i + 1 ? '#22c55e' : step > i + 1 ? 'rgba(34,197,94,0.2)' : '#1f2937',
                color: step === i + 1 ? '#0a0f0a' : step > i + 1 ? '#22c55e' : '#6b7280',
                transition: 'all 0.15s',
              }}
            >
              {step > i + 1 ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>
      </div>

      <div className="fade-in" key={step}>
        {step === 1 && (
          <GroupsStep groups={groupsFirstHalf} groupPredictions={data.groupPredictions} onPick={setGroupPick} title="Fase de Grupos · Grupo A al F" />
        )}
        {step === 2 && (
          <GroupsStep groups={groupsSecondHalf} groupPredictions={data.groupPredictions} onPick={setGroupPick} title="Fase de Grupos · Grupo G al L" />
        )}
        {step === 3 && (
          <ThirdPlaceStep availableTeams={availableThird} picks={data.thirdPlacePicks} onToggle={toggleThirdPick} groupPredictions={data.groupPredictions} />
        )}
      </div>

      {error && (
        <div className="badge badge-red" style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', justifyContent: 'flex-start' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(55,65,81,0.4)' }}>
        <button onClick={goPrev} disabled={step === 1} className="btn-secondary">← Anterior</button>
        {step < TOTAL_STEPS ? (
          <button onClick={goNext} className="btn-primary" disabled={isPending}>Siguiente →</button>
        ) : (
          <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary glow-green" disabled={isPending}>
            {isPending ? '⏳ Guardando...' : isEditing ? '💾 Guardar cambios' : '✅ Enviar fase 1'}
          </button>
        )}
      </div>

      {showSubmitConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' }}
          onClick={() => setShowSubmitConfirm(false)}
        >
          <div className="glass" style={{ maxWidth: 440, width: '100%', padding: '2rem', borderRadius: '1rem' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
              {isEditing ? '💾 Guardar cambios' : '⚠️ Confirmar envío — Fase 1'}
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '0.75rem' }}>
              {isEditing
                ? 'Se actualizará tu predicción de fase 1. Puedes volver a editarla hasta que cierre el plazo.'
                : <>Una vez enviada, podrás <strong style={{ color: '#22c55e' }}>modificarla</strong> hasta que cierre el plazo de fase 1.</>}
            </p>
            {!isEditing && (
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
                Podrás hacer la <strong style={{ color: '#22c55e' }}>fase 2 (eliminatorias)</strong> cuando el admin la habilite.
              </p>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowSubmitConfirm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSubmit} className="btn-primary" disabled={isPending} style={{ flex: 1 }}>
                {isPending ? '⏳ Enviando...' : '✅ Sí, enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Group Step ───────────────────────────────────────────────────────────────

function GroupsStep({
  groups,
  groupPredictions,
  onPick,
  title,
}: {
  groups: Group[]
  groupPredictions: GroupPredictions
  onPick: (group: string, role: 'winner' | 'runnerUp', code: string) => void
  title: string
}) {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Click en el equipo para seleccionar <span style={{ color: '#f59e0b' }}>1º</span> y <span style={{ color: '#94a3b8' }}>2º</span>.
        Vuelve a hacer click en el seleccionado para <strong style={{ color: '#ef4444' }}>deshacerlo</strong>.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {groups.map((group) => {
          const gp = groupPredictions[group.name] ?? { winner: '', runnerUp: '' }
          return (
            <div key={group.name} className="glass" style={{ padding: '1.25rem', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#22c55e', color: '#0a0f0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.875rem' }}>
                  {group.name}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  {gp.winner && gp.runnerUp ? '✅ Completo' : gp.winner ? '🥇 Falta el 2º' : 'Selecciona el 1º primero'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {group.teams.map((team) => {
                  const isWinner = gp.winner === team.code
                  const isRunnerUp = gp.runnerUp === team.code
                  const status = isWinner ? 'winner' : isRunnerUp ? 'runner-up' : ''
                  return (
                    <button
                      key={team.code}
                      className={`team-btn ${status}`}
                      style={{ justifyContent: 'space-between' }}
                      onClick={() => {
                        if (isWinner) onPick(group.name, 'winner', team.code)
                        else if (isRunnerUp) onPick(group.name, 'runnerUp', team.code)
                        else if (!gp.winner) onPick(group.name, 'winner', team.code)
                        else onPick(group.name, 'runnerUp', team.code)
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TeamFlag code={team.code} />
                        {team.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                        {isWinner ? '🥇 1º' : isRunnerUp ? '🥈 2º' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Third Place Step ─────────────────────────────────────────────────────────

function ThirdPlaceStep({
  availableTeams,
  picks,
  onToggle,
  groupPredictions,
}: {
  availableTeams: { team: Team; group: string }[]
  picks: string[]
  onToggle: (code: string) => void
  groupPredictions: GroupPredictions
}) {
  const groupsComplete = Object.keys(groupPredictions).filter(
    (g) => groupPredictions[g]?.winner && groupPredictions[g]?.runnerUp
  ).length

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Mejores terceros clasificados</h2>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
        Selecciona exactamente <strong style={{ color: '#22c55e' }}>8 equipos</strong> que clasificarán como los mejores terceros.
      </p>
      <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#9ca3af' }}>
        🏆 Puntuación: <strong style={{ color: '#f59e0b' }}>1-2 acertados → 1 pt · 3-4 → 3 pts · 5-6 → 5 pts · 7-8 → 10 pts</strong>
      </div>
      <div className="badge badge-gold" style={{ marginBottom: '1.5rem' }}>{picks.length}/8 seleccionados</div>
      {availableTeams.length === 0 && (
        <div className="glass" style={{ padding: '2rem', borderRadius: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
          Completa primero las predicciones de fase de grupos (pasos 1 y 2). ({groupsComplete}/12 completados)
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
        {availableTeams.map(({ team }) => {
          const isSelected = picks.includes(team.code)
          const canSelect = isSelected || picks.length < 8
          return (
            <button
              key={team.code}
              className={`team-btn ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
              onClick={() => onToggle(team.code)}
              disabled={!canSelect && !isSelected}
            >
              <TeamFlag code={team.code} />
              <span style={{ flex: 1 }}>{team.name}</span>
              {isSelected && <span style={{ color: '#22c55e' }}>✓</span>}
            </button>
          )
        })}
      </div>
      {picks.length > 0 && (
        <div className="glass" style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '0.75rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.875rem', color: '#22c55e' }}>✅ Tus terceros clasificados:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {picks.map((code) => {
              const t = getTeam(code)
              return t ? (
                <span key={code} className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <TeamFlag code={t.code} />{t.name}
                </span>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}
