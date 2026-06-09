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
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>⚙️ <span className="gradient-text">Admin</span></span>
          </Link>
          <nav style={{ display: 'flex', gap: '0.25rem' }}>
            <Link href="/admin" className="nav-link">📊 Dashboard</Link>
            <Link href="/admin/users" className="nav-link">👥 Usuarios</Link>
            <Link href="/admin/results" className="nav-link">⚽ Resultados</Link>
            <Link href="/admin/settings" className="nav-link">⚙️ Ajustes</Link>
            <Link href="/leaderboard" className="nav-link">🏆 Clasificación</Link>
          </nav>
          <form action={logout}>
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
