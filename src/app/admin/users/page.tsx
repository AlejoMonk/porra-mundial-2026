import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { DeleteUserButton } from '@/components/DeleteUserButton'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await getSession()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      prediction: { select: { isLocked: true, isPhase2Locked: true, totalPoints: true } },
    },
  })

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>👥 Participantes</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
        {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {users.map((u: typeof users[0]) => {
          const isMe = u.id === session?.userId
          const pred = u.prediction
          return (
            <div
              key={u.id}
              className="glass"
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                outline: isMe ? '2px solid rgba(34,197,94,0.4)' : undefined,
              }}
            >
              {/* Name */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {u.alias ?? u.name}
                  {isMe && <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Tú</span>}
                  {u.isAdmin && (
                    <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                      Admin
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{u.email}</div>
              </div>

              {/* Joined */}
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>REGISTRO</div>
                <div style={{ fontSize: '0.8rem' }}>
                  {new Date(u.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </div>
              </div>

              {/* Phase 1 */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>FASE 1</div>
                <div style={{ fontSize: '0.85rem' }}>
                  {pred?.isLocked
                    ? <span style={{ color: '#22c55e', fontWeight: 700 }}>✓ Enviada</span>
                    : <span style={{ color: 'var(--text-muted)' }}>Pendiente</span>}
                </div>
              </div>

              {/* Phase 2 */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>FASE 2</div>
                <div style={{ fontSize: '0.85rem' }}>
                  {pred?.isPhase2Locked
                    ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>✓ Enviada</span>
                    : <span style={{ color: 'var(--text-muted)' }}>Pendiente</span>}
                </div>
              </div>

              {/* Points */}
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>PUNTOS</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#22c55e' }}>
                  {pred?.totalPoints ?? '—'}
                </div>
              </div>

              {/* Delete */}
              {!isMe && (
                <DeleteUserButton userId={u.id} name={u.alias ?? u.name} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
