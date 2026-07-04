'use client'

import { useState, useTransition } from 'react'
import { Group, Team, R32Slot, getTeam } from '@/lib/constants'
import { resolveR32Slots, propagateBracket } from '@/lib/bracket'
import { updateGroupResults, updateMatchResult, updateThirdPlaceQualifiers, updateThirdPlaceAssignment, updateSpecialResults, recalculateAllScores } from '@/actions/admin'

// Human-readable label for a knockout match number
function matchRoundLabel(matchNum: number): string {
  if (matchNum >= 73 && matchNum <= 88) return `Dieciseisavos · P${matchNum - 72}`
  if (matchNum >= 89 && matchNum <= 96) return `Octavos · P${matchNum - 88}`
  if (matchNum >= 97 && matchNum <= 100) return `Cuartos · P${matchNum - 96}`
  if (matchNum === 101 || matchNum === 102) return `Semifinal ${matchNum - 100}`
  if (matchNum === 103) return '3er Puesto'
  if (matchNum === 104) return 'Final'
  return `Partido ${matchNum}`
}

type TabKey = 'groups' | 'terceros' | 'r32' | 'r16' | 'qf' | 'sf' | 'special'

export default function ResultsForm({
  groups,
  allTeams,
  r32Matches,
  r16Matches,
  qfMatches,
  sfMatches,
  initialGroupResults,
  initialMatchResults,
  initialThirdPlaceQualifiers,
  initialThirdPlaceAssignment,
  initialTopScorer,
  initialMvp,
}: {
  groups: Group[]
  allTeams: Team[]
  r32Matches: R32Slot[]
  r16Matches: number[]
  qfMatches: number[]
  sfMatches: number[]
  initialGroupResults: Record<string, Record<string, string>>
  initialMatchResults: Record<string, string>
  initialThirdPlaceQualifiers: string[]
  initialThirdPlaceAssignment: Record<number, string>
  initialTopScorer: string
  initialMvp: string
}) {
  const [tab, setTab] = useState<TabKey>('groups')
  const [groupResults, setGroupResults] = useState<Record<string, Record<string, string>>>(initialGroupResults)
  const [matchResults, setMatchResults] = useState<Record<string, string>>(initialMatchResults)
  const [thirdQualifiers, setThirdQualifiers] = useState<string[]>(initialThirdPlaceQualifiers)
  const [thirdAssignment, setThirdAssignment] = useState<Record<number, string>>(initialThirdPlaceAssignment)
  const [topScorer, setTopScorer] = useState(initialTopScorer)
  const [mvp, setMvp] = useState(initialMvp)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function showMessage(text: string, type: 'success' | 'error') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // ── Resolve the real bracket from the admin's actual results ────────────────
  // Group results → {A:{winner,runnerUp}}, then propagate KO winners forward so
  // each match shows the two teams that actually play it (updates live as results
  // are entered). The winner dropdown then only offers those two teams.
  const bracketGroupPredictions: Record<string, { winner: string; runnerUp: string }> = {}
  for (const [group, positions] of Object.entries(groupResults)) {
    if (positions['1'] || positions['2']) {
      bracketGroupPredictions[group] = { winner: positions['1'] ?? '', runnerUp: positions['2'] ?? '' }
    }
  }
  const r32Slots = resolveR32Slots(
    bracketGroupPredictions,
    [],
    Object.keys(thirdAssignment).length > 0 ? thirdAssignment : undefined
  )
  const allSlots = propagateBracket(r32Slots, matchResults as Record<number, string>)

  function saveGroupResults() {
    const formData = new FormData()
    formData.set('data', JSON.stringify(groupResults))
    startTransition(async () => {
      try {
        await updateGroupResults(formData)
        showMessage('Resultados de grupos guardados ✅', 'success')
      } catch { showMessage('Error al guardar', 'error') }
    })
  }

  function saveMatchResult(matchNum: number, code: string) {
    setMatchResults((prev) => ({ ...prev, [matchNum]: code }))
    startTransition(async () => {
      try {
        await updateMatchResult(matchNum, code)
        showMessage(`Partido ${matchNum} guardado ✅`, 'success')
      } catch { showMessage('Error al guardar', 'error') }
    })
  }

  function saveThirdQualifiers() {
    startTransition(async () => {
      try {
        await updateThirdPlaceQualifiers(thirdQualifiers)
        showMessage('Terceros clasificados guardados ✅', 'success')
      } catch { showMessage('Error al guardar', 'error') }
    })
  }

  function saveThirdAssignment() {
    startTransition(async () => {
      try {
        await updateThirdPlaceAssignment(thirdAssignment)
        showMessage('Asignación de terceros guardada ✅', 'success')
      } catch { showMessage('Error al guardar', 'error') }
    })
  }

  function saveSpecial() {
    startTransition(async () => {
      try {
        await updateSpecialResults(topScorer, mvp)
        showMessage('Premios especiales guardados ✅', 'success')
      } catch { showMessage('Error al guardar', 'error') }
    })
  }

  function handleRecalculate() {
    startTransition(async () => {
      try {
        await recalculateAllScores()
        showMessage('Puntuaciones recalculadas ✅', 'success')
      } catch { showMessage('Error al recalcular', 'error') }
    })
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'groups', label: '📋 Grupos' },
    { key: 'terceros', label: '🥉 Terceros R32' },
    { key: 'r32', label: '⚔️ Dieciseisavos' },
    { key: 'r16', label: '🔟 Octavos' },
    { key: 'qf', label: '🏅 Cuartos' },
    { key: 'sf', label: '🏆 Semis/Final' },
    { key: 'special', label: '⭐ Premios' },
  ]

  // R32 matches that have a third-place slot
  const r32ThirdMatches = r32Matches.filter(
    (m) => m.homeSlot.type === 'third' || m.awaySlot.type === 'third'
  )

  function TeamSelector({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    return (
      <div>
        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-input"
          style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
        >
          <option value="">— Sin resultado —</option>
          {allTeams.map((t) => (
            <option key={t.code} value={t.code}>{t.name}</option>
          ))}
        </select>
      </div>
    )
  }

  function MatchResultRow({ matchNum }: { matchNum: number }) {
    const slot = allSlots[matchNum]
    const winner = matchResults[matchNum] ?? ''
    const homeCode = slot?.home ?? null
    const awayCode = slot?.away ?? null
    const homeTeam = homeCode ? getTeam(homeCode) : null
    const awayTeam = awayCode ? getTeam(awayCode) : null
    const bothKnown = !!(homeCode && awayCode)

    // Labels shown when the teams aren't determined yet (placeholders)
    const homeDisplay = homeTeam ? `${homeTeam.flag} ${homeTeam.name}` : (slot?.homeLabel ?? 'Por determinar')
    const awayDisplay = awayTeam ? `${awayTeam.flag} ${awayTeam.name}` : (slot?.awayLabel ?? 'Por determinar')

    const prevHint = matchNum <= 88
      ? 'Completa primero los resultados de grupos y la asignación de terceros.'
      : 'Introduce primero los resultados de la ronda anterior.'

    return (
      <div className="glass" style={{ padding: '1rem', borderRadius: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.5rem' }}>
          {matchRoundLabel(matchNum)} · <span style={{ opacity: 0.7 }}>Partido {matchNum}</span>
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: bothKnown ? 'var(--text)' : 'var(--text-muted)' }}>
          {homeDisplay} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs</span> {awayDisplay}
        </div>
        {bothKnown ? (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={winner}
              onChange={(e) => saveMatchResult(matchNum, e.target.value)}
              className="form-input"
              style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem 0.75rem', minWidth: 200 }}
            >
              <option value="">— Sin resultado —</option>
              <option value={homeCode!}>{homeTeam!.flag} {homeTeam!.name}</option>
              <option value={awayCode!}>{awayTeam!.flag} {awayTeam!.name}</option>
            </select>
            {winner && (
              <span className="badge badge-green" style={{ flexShrink: 0 }}>
                Ganador: {(() => { const t = getTeam(winner); return t ? `${t.flag} ${t.name}` : winner })()}
              </span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
            ⏳ {prevHint}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Message toast */}
      {message && (
        <div
          className={`badge ${message.type === 'success' ? 'badge-green' : 'badge-red'}`}
          style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100, padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}
        >
          {message.text}
        </div>
      )}

      {/* Recalculate button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={handleRecalculate} disabled={isPending} className="btn-secondary" style={{ fontSize: '0.875rem' }}>
          {isPending ? '⏳ Procesando...' : '🔄 Recalcular puntuaciones'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="btn-secondary"
            style={{
              fontSize: '0.8rem',
              padding: '0.375rem 0.75rem',
              background: tab === t.key ? 'rgba(34,197,94,0.15)' : undefined,
              borderColor: tab === t.key ? '#22c55e' : undefined,
              color: tab === t.key ? '#22c55e' : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Groups tab */}
      {tab === 'groups' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {groups.map((group) => {
              const gr = groupResults[group.name] ?? {}
              return (
                <div key={group.name} className="glass" style={{ padding: '1.25rem', borderRadius: '0.75rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: '1rem', color: '#22c55e' }}>Grupo {group.name}</div>
                  {['1', '2', '3', '4'].map((pos) => (
                    <div key={pos} style={{ marginBottom: '0.5rem' }}>
                      <TeamSelector
                        label={pos === '1' ? '🥇 1º' : pos === '2' ? '🥈 2º' : pos === '3' ? '🥉 3º' : '4º'}
                        value={gr[pos] ?? ''}
                        onChange={(v) => {
                          setGroupResults((prev) => ({
                            ...prev,
                            [group.name]: { ...prev[group.name], [pos]: v },
                          }))
                        }}
                      />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Third place qualifiers */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>🥉 Mejores terceros clasificados (selecciona 8)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
              {allTeams.map((team) => {
                const isSelected = thirdQualifiers.includes(team.code)
                const canSelect = isSelected || thirdQualifiers.length < 8
                return (
                  <button
                    key={team.code}
                    className={`team-btn ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
                    onClick={() => {
                      if (!canSelect && !isSelected) return
                      setThirdQualifiers((prev) =>
                        isSelected ? prev.filter((c) => c !== team.code) : [...prev, team.code]
                      )
                    }}
                  >
                    <span>{team.flag}</span>
                    <span style={{ flex: 1, fontSize: '0.8rem' }}>{team.name}</span>
                    {isSelected && <span style={{ color: '#22c55e' }}>✓</span>}
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {thirdQualifiers.length}/8 seleccionados
            </div>
            <button onClick={saveThirdQualifiers} disabled={isPending} className="btn-primary" style={{ fontSize: '0.875rem' }}>
              Guardar terceros
            </button>
          </div>

          <button onClick={saveGroupResults} disabled={isPending} className="btn-primary">
            💾 Guardar resultados de grupos
          </button>
        </div>
      )}

      {/* Terceros R32 tab */}
      {tab === 'terceros' && (
        <div>
          <div className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '0.25rem' }}>
              <strong style={{ color: 'var(--text)' }}>¿Para qué sirve esto?</strong> Al final de la fase de grupos, la FIFA asigna cada uno de los 8 mejores terceros a un partido específico de dieciseisavos.
            </p>
            <p>Usa los desplegables para indicar qué equipo (de los 8 clasificados como 3º) juega en el slot de <em>3º Mejor</em> de cada partido. Así los jugadores verán el bracket correcto al predecir la fase 2.</p>
          </div>

          {thirdQualifiers.length < 8 ? (
            <div className="glass" style={{ padding: '2rem', borderRadius: '0.75rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              ⚠️ Primero selecciona y guarda los 8 mejores terceros en la pestaña <strong style={{ color: 'var(--text)' }}>📋 Grupos</strong>.
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {r32ThirdMatches.map((m) => {
                  const isHome = m.homeSlot.type === 'third'
                  const otherSlot = isHome ? m.awaySlot : m.homeSlot
                  const otherLabel =
                    otherSlot.type === 'winner'
                      ? `1º Grupo ${(otherSlot as { group: string }).group}`
                      : otherSlot.type === 'runnerUp'
                      ? `2º Grupo ${(otherSlot as { group: string }).group}`
                      : '3º Mejor'
                  const currentCode = thirdAssignment[m.match] ?? ''
                  const currentTeam = currentCode ? getTeam(currentCode) : null

                  return (
                    <div key={m.match} className="glass" style={{ padding: '1rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 80, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Partido {m.match}
                      </div>
                      <div style={{ flex: 1, fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {isHome ? '🏠 3º Mejor' : otherLabel}
                        </span>
                        <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }}>vs</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {isHome ? otherLabel : '✈️ 3º Mejor'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <select
                          value={currentCode}
                          onChange={(e) => setThirdAssignment((prev) => ({ ...prev, [m.match]: e.target.value }))}
                          className="form-input"
                          style={{ fontSize: '0.875rem', padding: '0.4rem 0.75rem', minWidth: 200 }}
                        >
                          <option value="">— Sin asignar —</option>
                          {thirdQualifiers.map((code) => {
                            const t = getTeam(code)
                            return (
                              <option key={code} value={code}>
                                {t ? `${t.flag} ${t.name}` : code}
                              </option>
                            )
                          })}
                        </select>
                        {currentTeam && (
                          <span style={{ fontSize: '1.25rem' }}>{currentTeam.flag}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Validation: show which teams have been assigned */}
              <div style={{ marginBottom: '1.5rem', padding: '0.875rem 1rem', background: 'var(--raised)', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  Terceros asignados: {Object.values(thirdAssignment).filter(Boolean).length} / 8
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {thirdQualifiers.map((code) => {
                    const t = getTeam(code)
                    const assigned = Object.values(thirdAssignment).includes(code)
                    return (
                      <span
                        key={code}
                        className={`badge ${assigned ? 'badge-green' : 'badge-red'}`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {t ? `${t.flag} ${t.name}` : code} {assigned ? '✓' : '?'}
                      </span>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={saveThirdAssignment}
                disabled={isPending}
                className="btn-primary"
                style={{ fontSize: '0.875rem' }}
              >
                💾 Guardar asignación
              </button>
            </div>
          )}
        </div>
      )}

      {/* R32 tab — Dieciseisavos */}
      {tab === 'r32' && (
        <div>
          {r32Matches.map((m) => (
            <MatchResultRow key={m.match} matchNum={m.match} />
          ))}
        </div>
      )}

      {/* R16 tab — Octavos */}
      {tab === 'r16' && (
        <div>
          {r16Matches.map((m) => (
            <MatchResultRow key={m} matchNum={m} />
          ))}
        </div>
      )}

      {/* QF tab — Cuartos */}
      {tab === 'qf' && (
        <div>
          {qfMatches.map((m) => (
            <MatchResultRow key={m} matchNum={m} />
          ))}
        </div>
      )}

      {/* SF + Final tab */}
      {tab === 'sf' && (
        <div>
          {[...sfMatches, 103, 104].map((m) => (
            <MatchResultRow key={m} matchNum={m} />
          ))}
        </div>
      )}

      {/* Special awards tab */}
      {tab === 'special' && (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>⭐ Premios especiales</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Escribe el nombre del jugador ganador. La comparación es insensible a mayúsculas.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400, marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>⚽ Pichichi — nombre del máximo goleador</label>
              <input
                type="text"
                value={topScorer}
                onChange={(e) => setTopScorer(e.target.value)}
                placeholder="p.ej. Kylian Mbappé"
                className="form-input"
                autoComplete="off"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>⭐ MVP — nombre del mejor jugador</label>
              <input
                type="text"
                value={mvp}
                onChange={(e) => setMvp(e.target.value)}
                placeholder="p.ej. Pedri"
                className="form-input"
                autoComplete="off"
              />
            </div>
          </div>
          <button onClick={saveSpecial} disabled={isPending} className="btn-primary">
            💾 Guardar premios
          </button>
        </div>
      )}
    </div>
  )
}
