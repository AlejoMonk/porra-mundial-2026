'use client'

import { useState, useTransition, useCallback } from 'react'
import { getTeam, R32_MATCHES, R16_MATCHES } from '@/lib/constants'
import { resolveR32Slots, propagateBracket, getDownstreamMatches, GroupPredictions, KnockoutPicks } from '@/lib/bracket'
import { submitPhase2Prediction, savePhase2Prediction } from '@/actions/prediction'
import { KnockoutStep } from '@/components/KnockoutStep'
import { TeamFlag } from '@/components/TeamFlag'

interface Phase2Data {
  knockoutPicks: KnockoutPicks
}

const TOTAL_STEPS = 4
const STEP_LABELS = [
  'Dieciseisavos (1-8)',
  'Dieciseisavos (9-16)',
  'Octavos de Final',
  'Revisar y enviar',
]

export default function Phase2Wizard({
  initialData,
  phase1GroupPredictions,
  phase1ThirdPlacePicks,
  adminThirdPlaceAssignment,
  isEditing = false,
}: {
  initialData: Phase2Data | null
  phase1GroupPredictions: GroupPredictions
  phase1ThirdPlacePicks: string[]
  adminThirdPlaceAssignment?: Record<number, string>
  isEditing?: boolean
}) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<Phase2Data>(initialData ?? { knockoutPicks: {} })
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const r32Slots = resolveR32Slots(phase1GroupPredictions, phase1ThirdPlacePicks, adminThirdPlaceAssignment)
  const allSlots = propagateBracket(r32Slots, data.knockoutPicks)

  const setKnockoutPick = useCallback((matchNum: number, teamCode: string) => {
    setData((prev) => {
      const kp = { ...prev.knockoutPicks }
      if (kp[matchNum] === teamCode) {
        delete kp[matchNum]
      } else {
        kp[matchNum] = teamCode
        for (const m of getDownstreamMatches(matchNum)) delete kp[m]
      }
      return { ...prev, knockoutPicks: kp }
    })
  }, [])

  function autoSave() {
    const formData = new FormData()
    formData.set('data', JSON.stringify(data))
    startTransition(async () => { await savePhase2Prediction(formData) })
  }

  function goNext() { autoSave(); setStep((s) => Math.min(s + 1, TOTAL_STEPS)) }
  function goPrev() { setStep((s) => Math.max(s - 1, 1)) }

  function handleSubmit() {
    setError(null)
    const formData = new FormData()
    formData.set('data', JSON.stringify(data))
    startTransition(async () => {
      const result = await submitPhase2Prediction(formData)
      if (result && 'error' in result) {
        setError(result.error ?? null)
        setShowSubmitConfirm(false)
      }
    })
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100)
  const r16Picked = R16_MATCHES.filter((m) => data.knockoutPicks[m]).length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '0.25rem 0.75rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Fase 2 · Dieciseisavos y Octavos</span>
              </div>
              {isEditing && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, padding: '0.25rem 0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>✏️ Editando</span>
                </div>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isEditing ? '✏️ Editar fase 2' : '⚔️ Dieciseisavos y Octavos'}</h1>
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Paso {step} de {TOTAL_STEPS}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: '#f59e0b' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
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
                background: step === i + 1 ? '#f59e0b' : step > i + 1 ? 'rgba(245,158,11,0.2)' : '#1f2937',
                color: step === i + 1 ? '#0a0f0a' : step > i + 1 ? '#f59e0b' : '#6b7280',
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
          <KnockoutStep title="Dieciséisavos de Final · Partidos 1-8" matchNums={R32_MATCHES.slice(0, 8).map((m) => m.match)} allSlots={allSlots} knockoutPicks={data.knockoutPicks} onPick={setKnockoutPick} />
        )}
        {step === 2 && (
          <KnockoutStep title="Dieciséisavos de Final · Partidos 9-16" matchNums={R32_MATCHES.slice(8).map((m) => m.match)} allSlots={allSlots} knockoutPicks={data.knockoutPicks} onPick={setKnockoutPick} />
        )}
        {step === 3 && (
          <KnockoutStep title="Octavos de Final" matchNums={R16_MATCHES} allSlots={allSlots} knockoutPicks={data.knockoutPicks} onPick={setKnockoutPick} />
        )}
        {step === 4 && (
          <Phase2Summary knockoutPicks={data.knockoutPicks} r16Picked={r16Picked} />
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
          <button onClick={goNext} className="btn-primary" disabled={isPending} style={{ background: '#f59e0b', color: '#0a0f0a' }}>Siguiente →</button>
        ) : (
          <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary" disabled={isPending} style={{ background: '#f59e0b', color: '#0a0f0a' }}>
            {isPending ? '⏳ Guardando...' : isEditing ? '💾 Guardar cambios' : '⚔️ Enviar fase 2'}
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
              {isEditing ? '💾 Guardar cambios' : '⚠️ Confirmar envío — Fase 2'}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {isEditing
                ? 'Se actualizarán tus predicciones de dieciseisavos y octavos. Puedes volver a editarlas hasta que cierre el plazo de fase 2.'
                : <>Una vez enviada, podrás <strong style={{ color: '#f59e0b' }}>modificarla</strong> hasta que cierre el plazo de fase 2. Los cuartos, semis, final y premios se predicen en la fase 3.</>}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowSubmitConfirm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={handleSubmit} className="btn-primary" disabled={isPending} style={{ flex: 1, background: '#f59e0b', color: '#0a0f0a' }}>
                {isPending ? '⏳ Enviando...' : '✅ Sí, enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Phase 2 Summary ──────────────────────────────────────────────────────────

function Phase2Summary({
  knockoutPicks,
  r16Picked,
}: {
  knockoutPicks: KnockoutPicks
  r16Picked: number
}) {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Revisa tus octavos de final</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Estos son los 8 equipos que, según tus dieciseisavos, pasan a octavos. Los cuartos, semis, final y premios se predicen en la fase 3.
      </p>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#f59e0b' }}>🔟 Tus ganadores de octavos</h3>
          <span className="badge badge-gold">{r16Picked}/8 elegidos</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {R16_MATCHES.map((m) => {
            const code = knockoutPicks[m]
            const team = code ? getTeam(code) : null
            return (
              <div key={m} style={{ background: 'var(--surface)', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Octavo {m - 88}</div>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {team ? <><TeamFlag code={code} />{team.name}</> : <span style={{ color: 'var(--text-muted)' }}>Sin elegir</span>}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ⚔️ Dieciseisavos predichos: <strong style={{ color: 'var(--text)' }}>{R32_MATCHES.filter((m) => knockoutPicks[m.match]).length}/16</strong>
        </div>
      </div>
    </div>
  )
}
