import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.isAdmin) redirect('/leaderboard')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="admin-header-inner">
          <Link href="/admin" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>⚙️ <span className="gradient-text">Admin</span></span>
          </Link>
          <nav className="admin-nav">
            <Link href="/admin" className="nav-link">📊 Dashboard</Link>
            <Link href="/admin/users" className="nav-link">👥 Usuarios</Link>
            <Link href="/admin/results" className="nav-link">⚽ Resultados</Link>
            <Link href="/admin/settings" className="nav-link">⚙️ Ajustes</Link>
            <Link href="/leaderboard" className="nav-link">🏆 Clasificación</Link>
          </nav>
          <form action={logout} style={{ flexShrink: 0 }}>
            <button type="submit" className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Salir</button>
          </form>
        </div>
      </header>
      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  )
}
