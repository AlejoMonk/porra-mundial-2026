import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [userCount, predictionCount, settings, tournament] = await Promise.all([
    prisma.user.count(),
    prisma.prediction.count({ where: { isLocked: true } }),
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }),
    prisma.tournamentResult.findUnique({ where: { id: 'singleton' } }),
  ])

  const matchResults = JSON.parse(tournament?.matchResults || '{}')
  const groupResults = JSON.parse(tournament?.groupResults || '{}')
  const matchCount = Object.keys(matchResults).length
  const groupCount = Object.keys(groupResults).length

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>
        ⚙️ Panel de Administración
      </h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Participantes registrados', value: userCount, icon: '👥' },
          { label: 'Predicciones enviadas', value: predictionCount, icon: '🗳️' },
          { label: 'Grupos con resultado', value: `${groupCount}/12`, icon: '📋' },
          { label: 'Partidos KO con resultado', value: `${matchCount}/32`, icon: '⚽' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="glass" style={{ padding: '1.25rem', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#22c55e' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <Link href="/admin/results" className="card-link">
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'border-color 0.15s' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚽</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Introducir resultados</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Añade los resultados de los partidos para actualizar la clasificación.
            </p>
          </div>
        </Link>

        <Link href="/admin/settings" className="card-link">
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', cursor: 'pointer', transition: 'border-color 0.15s' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚙️</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Ajustes de la porra</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Configura el plazo de predicciones y el registro.
            </p>
          </div>
        </Link>

        <Link href="/admin/users" className="card-link">
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👥</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Gestionar participantes</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Ve quién está registrado y elimina usuarios si es necesario.
            </p>
          </div>
        </Link>

        <Link href="/leaderboard" className="card-link">
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', cursor: 'pointer' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Ver clasificación</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Consulta el ranking actual de todos los jugadores.
            </p>
          </div>
        </Link>
      </div>

      {/* Current settings */}
      <div className="glass" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '1rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Estado actual</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Registro: </span>
            <span className={`badge ${settings?.registrationOpen !== false ? 'badge-green' : 'badge-red'}`}>
              {settings?.registrationOpen !== false ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Cierre predicciones: </span>
            <span style={{ fontWeight: 600 }}>
              {settings?.predictionDeadline
                ? new Date(settings.predictionDeadline).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
                : 'Sin establecer'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Pichichi registrado: </span>
            <span style={{ fontWeight: 600 }}>{tournament?.topScorer || 'No'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>MVP registrado: </span>
            <span style={{ fontWeight: 600 }}>{tournament?.mvp || 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
