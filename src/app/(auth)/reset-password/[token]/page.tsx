import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ResetPasswordForm from './ResetPasswordForm'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  const isValid =
    tokenRecord &&
    !tokenRecord.usedAt &&
    tokenRecord.expiresAt > new Date()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ marginBottom: '2rem', textDecoration: 'none' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          ⚽ <span className="gradient-text">Mundial 2026</span>
        </span>
      </Link>

      <div
        className="glass"
        style={{ width: '100%', maxWidth: 420, padding: '2.5rem', borderRadius: '1rem' }}
      >
        {isValid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text)' }}>
              Enlace expirado
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Este enlace ya ha sido usado o ha expirado (tienen validez de 1 hora).
              Solicita uno nuevo y úsalo enseguida.
            </p>
            <Link href="/forgot-password" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Solicitar nuevo enlace
            </Link>
            <p style={{ marginTop: '1rem' }}>
              <Link href="/login" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                ← Volver al inicio de sesión
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
