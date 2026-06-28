'use client'

import { useState, useTransition, useCallback } from 'react'
import { getTeam, QF_MATCHES, SF_MATCHES, THIRD_PLACE_MATCH, FINAL_MATCH } from '@/lib/constants'
import { resolveR32Slots, propagateBracket, getDownstreamMatches, GroupPredictions, KnockoutPicks } from '@/lib/bracket'
import { submitPhase3Prediction, savePhase3Prediction } from '@/actions/prediction'
import { KnockoutStep } from '@/components/KnockoutStep'
import { TeamFlag } from '@/components/TeamFlag'

interface Phase3Data {
  knockoutPicks: KnockoutPicks
  topScorerTeam: string
  mvpTeam: string
}

const TOTAL_STEPS = 3
const STEP_LABELS = [
  'Cuartos de Final',
  'Semis · 3er · Final',
  'Premios y Enviar',
]

export default function Phase3Wizard({
  initialData,
  phase1GroupPredictions,
  phase1ThirdPlacePicks,
  adminThirdPlaceAssignment,
  lockedKnockoutPicks,
  isEditing = false,
}: {
  initialData: Phase3Data | null
  phase1GroupPredictions: GroupPredictions
  phase1ThirdPlacePicks: string[]
  adminThirdPlaceAssignment?: Record<number, string>
  // The user's locked phase-2 picks (R32 + R16), needed to build the QF bracket
  lockedKnockoutPicks: KnockoutPicks
  isEditing?: boolean
}) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<Phase3Data>(
    initialData ?? { knockoutPicks: lockedKnockoutPicks, topScorerTeam: '', mvpTeam: '' }
  )
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Bracket is built from admin group results + the user's locked phase-2 winners.
  // Phase 3 only edits matches 97-104; phase-2 picks (73-96) stay fixed.
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
    startTransition(async () => { await savePhase3Prediction(formData) })
  }

  function goNext() { autoSave(); setStep((s) => Math.min(s + 1, TOTAL_STEPS)) }
  function goPrev() { setStep((s) => Math.max(s - 1, 1)) }

  function handleSubmit() {
    setError(null)
    const formData = new FormData()
    formData.set('data', JSON.stringify(data))
    startTransition(async () => {
      const result = await submitPhase3Prediction(formData)
      if (result && 'error' in result) {
        setError(result.error ?? null)
        setShowSubmitConfirm(false)
      }
    })
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100)
  const champion = data.knockoutPicks[FINAL_MATCH]
  const championTeam = champion ? getTeam(champion) : null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '0.25rem 0.75rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase' }}>Fase 3 · Cuartos a la Final y Premios</span>
              </div>
              {isEditing && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 6, padding: '0.25rem 0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase' }}>✏️ Editando</span>
                </div>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isEditing ? '✏️ Editar fase 3' : '🏆 Cuartos, semis, final y premios'}</h1>
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Paso {step} de {TOTAL_STEPS}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: '#22c55e' }} />
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
          <KnockoutStep title="Cuartos de Final" description="Tus ganadores salen de los octavos que predijiste en la fase 2. Elige quién pasa a semifinales." matchNums={QF_MATCHES} allSlots={allSlots} knockoutPicks={data.knockoutPicks} onPick={setKnockoutPick} />
        )}
        {step === 2 && (
          <KnockoutStep title="Semifinales · 3er Puesto · Final" matchNums={[...SF_MATCHES, THIRD_PLACE_MATCH, FINAL_MATCH]} allSlots={allSlots} knockoutPicks={data.knockoutPicks} onPick={setKnockoutPick} />
        )}
        {step === 3 && (
          <SpecialAwardsStep
            topScorerTeam={data.topScorerTeam}
            mvpTeam={data.mvpTeam}
            onChange={(field, val) => setData((prev) => ({ ...prev, [field]: val }))}
            knockoutPicks={data.knockoutPicks}
            championTeam={championTeam}
            champion={champion}
          />
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
          <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary" disabled={isPending}>
            {isPending ? '⏳ Guardando...' : isEditing ? '💾 Guardar cambios' : '🏆 Enviar fase 3'}
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
              {isEditing ? '💾 Guardar cambios' : '⚠️ Confirmar envío — Fase 3'}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {isEditing
                ? 'Se actualizarán tus predicciones de cuartos, semis, final y premios. Puedes volver a editarlas hasta que cierre el plazo de fase 3.'
                : <>Una vez enviada, podrás <strong style={{ color: '#22c55e' }}>modificarla</strong> hasta que cierre el plazo de fase 3.</>}
            </p>
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

// ─── Special Awards Step ──────────────────────────────────────────────────────

// Defined outside SpecialAwardsStep so React doesn't remount it on every keystroke
function PlayerInput({ value, onC, label, description, placeholder }: {
  value: string
  onC: (v: string) => void
  label: string
  description: string
  placeholder: string
}) {
  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem' }}>
      <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{label}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>{description}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onC(e.target.value)}
        placeholder={placeholder}
        className="form-input"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  )
}

function SpecialAwardsStep({
  topScorerTeam,
  mvpTeam,
  onChange,
  knockoutPicks,
  championTeam,
  champion,
}: {
  topScorerTeam: string
  mvpTeam: string
  onChange: (field: string, val: string) => void
  knockoutPicks: KnockoutPicks
  championTeam: ReturnType<typeof getTeam> | null
  champion: string | undefined
}) {
  const phase3Picked = [...QF_MATCHES, ...SF_MATCHES, THIRD_PLACE_MATCH, FINAL_MATCH].filter((m) => knockoutPicks[m]).length
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Premios especiales y resumen final</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Escribe el nombre del jugador que crees que ganará cada premio.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <PlayerInput
          value={topScorerTeam}
          onC={(v) => onChange('topScorerTeam', v)}
          label="⚽ Pichichi (máximo goleador)"
          description="Nombre del jugador que crees que será el máximo goleador del torneo."
          placeholder="p.ej. Kylian Mbappé"
        />
        <PlayerInput
          value={mvpTeam}
          onC={(v) => onChange('mvpTeam', v)}
          label="⭐ MVP del torneo"
          description="Nombre del jugador que crees que recibirá el premio al mejor jugador."
          placeholder="p.ej. Pedri"
        />
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '1.5rem', color: '#22c55e' }}>📋 Resumen de tu predicción (fase 3)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>🏆 Campeón del mundo</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {championTeam ? <><TeamFlag code={champion!} />{championTeam.name}</> : <span style={{ color: 'var(--text-muted)' }}>Sin seleccionar</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>⚽ Pichichi</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              {topScorerTeam || <span style={{ color: 'var(--text-muted)' }}>Sin indicar</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>⭐ MVP</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              {mvpTeam || <span style={{ color: 'var(--text-muted)' }}>Sin indicar</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>⚔️ Partidos predichos</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{phase3Picked}/8</div>
          </div>
        </div>
      </div>
    </div>
  )
}
