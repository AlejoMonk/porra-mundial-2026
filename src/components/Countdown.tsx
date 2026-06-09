'use client'

import { useEffect, useState } from 'react'

function calcRemaining(deadline: Date) {
  const diff = deadline.getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1_000)
  return { days, hours, minutes, seconds, diff }
}

export function Countdown({
  deadline,
  label,
  color = '#22c55e',
}: {
  deadline: string // ISO string
  label: string
  color?: string
}) {
  const [remaining, setRemaining] = useState(() => calcRemaining(new Date(deadline)))

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(calcRemaining(new Date(deadline)))
    }, 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (!remaining) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span style={{ color: '#ef4444', fontWeight: 700 }}>⏰</span>
        <span>{label}: plazo cerrado</span>
      </div>
    )
  }

  const units = [
    { v: remaining.days, u: 'd' },
    { v: remaining.hours, u: 'h' },
    { v: remaining.minutes, u: 'm' },
    { v: remaining.seconds, u: 's' },
  ].filter((x, i) => i === 0 || x.v > 0 || i < 3)

  const urgent = remaining.diff < 24 * 3_600_000 // less than 24h

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
        {units.map(({ v, u }) => (
          <span
            key={u}
            style={{
              background: 'var(--raised)',
              border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
              borderRadius: '0.375rem',
              padding: '0.2rem 0.45rem',
              fontSize: '0.875rem',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              color: urgent ? '#f87171' : color,
              minWidth: '2.2rem',
              textAlign: 'center',
            }}
          >
            {String(v).padStart(2, '0')}{u}
          </span>
        ))}
      </div>
    </div>
  )
}
