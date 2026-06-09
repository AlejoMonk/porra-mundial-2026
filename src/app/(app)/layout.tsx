import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'
import { prisma } from '@/lib/prisma'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const myPrediction = await prisma.prediction.findUnique({
    where: { userId: session.userId },
    select: { isLocked: true },
  })
  const predHref = myPrediction?.isLocked ? `/predictions/${session.userId}` : '/predict'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Nav */}
      <header
        style={{
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="app-header-inner">
          {/* Logo */}
          <Link href="/leaderboard" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>
              ⚽ <span className="gradient-text">Mundial 2026</span>
            </span>
          </Link>

          {/* Nav links — on mobile, moves to second row and scrolls horizontally */}
          <nav className="app-nav">
            <Link href="/leaderboard" className="nav-link">📊 Clasificación</Link>
            <Link href={predHref} className="nav-link">🗳️ Mi predicción</Link>
            <Link href="/predictions" className="nav-link">👥 Participantes</Link>
            {session.isAdmin && <Link href="/admin" className="nav-link">⚙️ Admin</Link>}
          </nav>

          {/* User + theme toggle */}
          <div className="app-header-right">
            <ThemeToggle />
            <div className="app-user-info">
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{session.alias ?? session.name}</div>
              {session.isAdmin && (
                <div className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  Admin
                </div>
              )}
            </div>
            <form action={logout}>
              <button type="submit" className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '2rem 1.5rem' }}>
        {children}
      </main>

      <footer style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Creado por
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, background: 'linear-gradient(135deg, #22c55e, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Alejandro Abad
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Señor de Claude y de la IA en general
        </span>
      </footer>
    </div>
  )
}
