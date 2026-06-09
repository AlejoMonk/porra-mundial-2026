'use client'

import { useState, useTransition, useCallback } from 'react'
import { getTeam, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, THIRD_PLACE_MATCH, FINAL_MATCH } from '@/lib/constants'
import { resolveR32Slots, propagateBracket, GroupPredictions, KnockoutPicks } from '@/lib/bracket'
import { submitPhase2Prediction, savePhase2Prediction } from '@/actions/prediction'
import { TeamFlag } from '@/components/TeamFlag'

interface Phase2Data {
  knockoutPicks: KnockoutPicks
  topScorerTeam: string
  mvpTeam: string
}

const TOTAL_STEPS = 6
const STEP_LABELS = [
  'Dieciseisavos (1-8)',
  'Dieciseisavos (9-16)',
  'Octavos de Final',
  'Cuartos de Final',
  'Semis y Final',
  'Premios y Enviar',
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
  const [data, setData] = useState<Phase2Data>(
    initialData ?? { knockoutPicks: {}, topScorerTeam: '', mvpTeam: '' }
  )
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
        const downstream = getDownstreamMatches(matchNum)
        for (const m of downstream) delete kp[m]
      }
      return { ...prev, knockoutPicks: kp }
    })
  }, [])

  function getDownstreamMatches(matchNum: number): number[] {
    const result: number[] = []
    const queue = [matchNum]
    const TREE: Record<number, number> = {
      74: 89, 77: 89, 73: 90, 75: 90,
      76: 91, 78: 91, 79: 92, 80: 92,
      83: 93, 84: 93, 81: 94, 82: 94,
      86: 95, 88: 95, 85: 96, 87: 96,
      89: 97, 90: 97, 93: 98, 94: 98,
      91: 99, 92: 99, 95: 100, 96: 100,
      97: 101, 98: 101, 99: 102, 100: 102,
      101: 103, 102: 103, 103: 104, 104: 999,
    }
    while (queue.length) {
      const m = queue.shift()!
      const next = TREE[m]
      if (next && next !== 999) { result.push(next); queue.push(next) }
    }
    return result
  }

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
  const champion = data.knockoutPicks[FINAL_MATCH]
  const championTeam = champion ? getTeam(champion) : null

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '0.25rem 0.75rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Fase 2 · Eliminatorias y Premios</span>
              </div>
              {isEditing && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 6, padding: '0.25rem 0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>✏️ Editando</span>
                </div>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isEditing ? '✏️ Editar eliminatorias' : '🏆 Predicción de eliminatorias'}</h1>
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
          <KnockoutStep title="Cuartos de Final" matchNums={QF_MATCHES} allSlots={allSlots} knockoutPicks={data.knockoutPicks} onPick={setKnockoutPick} />
        )}
        {step === 5 && (
          <KnockoutStep title="Semifinales · 3er Puesto · Final" matchNums={[...SF_MATCHES, THIRD_PLACE_MATCH, FINAL_MATCH]} allSlots={allSlots} knockoutPicks={data.knockoutPicks} onPick={setKnockoutPick} />
        )}
        {step === 6 && (
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
          <button onClick={goNext} className="btn-primary" disabled={isPending} style={{ background: '#f59e0b', color: '#0a0f0a' }}>Siguiente →</button>
        ) : (
          <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary" disabled={isPending} style={{ background: '#f59e0b', color: '#0a0f0a' }}>
            {isPending ? '⏳ Guardando...' : isEditing ? '💾 Guardar cambios' : '🏆 Enviar fase 2'}
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
                ? 'Se actualizarán tus predicciones de eliminatorias y premios. Puedes volver a editarlas hasta que cierre el plazo de fase 2.'
                : <>Una vez enviada, podrás <strong style={{ color: '#f59e0b' }}>modificarla</strong> hasta que cierre el plazo de fase 2.</>}
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

// ─── Knockout Step ────────────────────────────────────────────────────────────

function KnockoutStep({
  title,
  matchNums,
  allSlots,
  knockoutPicks,
  onPick,
}: {
  title: string
  matchNums: number[]
  allSlots: ReturnType<typeof propagateBracket>
  knockoutPicks: KnockoutPicks
  onPick: (matchNum: number, code: string) => void
}) {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Selecciona el equipo ganador de cada partido.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {matchNums.map((matchNum) => {
          const slot = allSlots[matchNum]
          const pick = knockoutPicks[matchNum]
          if (!slot) return null

          const matchLabel =
            matchNum === FINAL_MATCH ? '🏆 Final'
            : matchNum === THIRD_PLACE_MATCH ? '🥉 3er Puesto'
            : matchNum >= 101 ? `Semifinal ${matchNum - 100}`
            : matchNum >= 97 ? `Cuartos · P${matchNum - 96}`
            : matchNum >= 89 ? `Octavos · P${matchNum - 88}`
            : `Dieciséisavos · P${matchNum - 72}`

          const teamsReady = slot.home || slot.away

          return (
            <div key={matchNum} className="match-card">
              <div style={{ padding: '0.5rem 1rem', background: 'var(--raised)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{matchLabel}</span>
                {!teamsReady && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Completa el paso anterior</span>}
              </div>
              {[
                { code: slot.home, label: slot.homeLabel },
                { code: slot.away, label: slot.awayLabel },
              ].map((team, idx) => (
                <div
                  key={idx}
                  className={`match-team-row ${pick === team.code ? 'selected' : ''}`}
                  onClick={() => { if (team.code) onPick(matchNum, team.code) }}
                  style={{ opacity: team.code ? 1 : 0.4, cursor: team.code ? 'pointer' : 'not-allowed' }}
                >
                  <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {team.code ? <TeamFlag code={team.code} /> : <span style={{ fontSize: '0.8rem' }}>⏳</span>}
                    {team.label}
                  </span>
                  {pick === team.code && <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.8rem' }}>✓ Ganador</span>}
                </div>
              ))}
            </div>
          )
        })}
      </div>
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
        <h3 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '1.5rem', color: '#f59e0b' }}>📋 Resumen de tu predicción (fase 2)</h3>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.375rem', textTransform: 'uppercase' }}>⚔️ Partidos KO predichos</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{Object.keys(knockoutPicks).length}/32</div>
          </div>
        </div>
      </div>
    </div>
  )
}
