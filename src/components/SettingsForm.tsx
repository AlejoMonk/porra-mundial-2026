'use client'

import { useState, useTransition } from 'react'
import { updateSettings } from '@/actions/admin'

// Convert a UTC ISO string (from DB) → local datetime-local input value
function utcToLocalInput(utcIso: string): string {
  if (!utcIso) return ''
  const d = new Date(utcIso.endsWith('Z') ? utcIso : utcIso + 'Z')
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

// Convert a local datetime-local value → UTC ISO string to send to the server
function localInputToUtcIso(local: string): string {
  if (!local) return ''
  return new Date(local).toISOString()
}

export default function SettingsForm({
  initialDeadline,
  initialPhase2Deadline,
  initialRegOpen,
}: {
  initialDeadline: string
  initialPhase2Deadline: string
  initialRegOpen: boolean
}) {
  const [deadline, setDeadline] = useState(() => utcToLocalInput(initialDeadline))
  const [phase2Deadline, setPhase2Deadline] = useState(() => utcToLocalInput(initialPhase2Deadline))
  const [regOpen, setRegOpen] = useState(initialRegOpen)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('deadline', localInputToUtcIso(deadline))
    formData.set('phase2Deadline', localInputToUtcIso(phase2Deadline))
    formData.set('registrationOpen', regOpen ? 'true' : 'false')
    startTransition(async () => {
      await updateSettings(formData)
      setMessage('Ajustes guardados ✅')
      setTimeout(() => setMessage(null), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <div className="badge badge-green" style={{ marginBottom: '1.5rem', padding: '0.75rem', borderRadius: '0.5rem' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 500 }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>⏰ Fase 1 — Grupos y Terceros</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Fecha límite para enviar predicciones de fase de grupos y mejores terceros.
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Cierre fase 1 (hora local)
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="form-input"
            />
            {deadline && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Cierre: {new Date(deadline).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            )}
          </div>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', marginTop: '1.5rem' }}>🏆 Fase 2 — Eliminatorias y Premios</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Fecha límite para enviar predicciones de dieciséisavos en adelante. Déjala vacía hasta que quieras abrir la fase 2.
          </p>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Cierre fase 2 (hora local)
            </label>
            <input
              type="datetime-local"
              value={phase2Deadline}
              onChange={(e) => setPhase2Deadline(e.target.value)}
              className="form-input"
            />
            {phase2Deadline && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Cierre: {new Date(phase2Deadline).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}
              </p>
            )}
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>👥 Registro de usuarios</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <div
              style={{
                width: 48,
                height: 26,
                borderRadius: 13,
                background: regOpen ? '#22c55e' : '#374151',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onClick={() => setRegOpen(!regOpen)}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: 2,
                  left: regOpen ? 24 : 2,
                  transition: 'left 0.2s',
                }}
              />
            </div>
            <span style={{ fontWeight: 500 }}>
              {regOpen ? '✅ Registro abierto' : '🔒 Registro cerrado'}
            </span>
          </label>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            {regOpen
              ? 'Cualquier persona puede crear una cuenta y unirse a la porra.'
              : 'Nadie nuevo puede registrarse. Los usuarios existentes pueden seguir accediendo.'}
          </p>
        </div>

        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? '⏳ Guardando...' : '💾 Guardar ajustes'}
        </button>
      </div>
    </form>
  )
}
