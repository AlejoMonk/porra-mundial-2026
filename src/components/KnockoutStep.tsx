'use client'

import { FINAL_MATCH, THIRD_PLACE_MATCH } from '@/lib/constants'
import { propagateBracket, KnockoutPicks } from '@/lib/bracket'
import { TeamFlag } from '@/components/TeamFlag'

export function KnockoutStep({
  title,
  description,
  matchNums,
  allSlots,
  knockoutPicks,
  onPick,
  accent = '#f59e0b',
}: {
  title: string
  description?: string
  matchNums: number[]
  allSlots: ReturnType<typeof propagateBracket>
  knockoutPicks: KnockoutPicks
  onPick: (matchNum: number, code: string) => void
  accent?: string
}) {
  const checkColor = accent ?? '#22c55e'
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {description ?? 'Selecciona el equipo ganador de cada partido.'}
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
                  {pick === team.code && <span style={{ color: checkColor, fontWeight: 700, fontSize: '0.8rem' }}>✓ Ganador</span>}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
