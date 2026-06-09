'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/actions/auth'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await requestPasswordReset(formData)
      setSent(true)
    })
  }

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
        {sent ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text)' }}>
              ¡Enlace enviado!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Si existe una cuenta con ese correo, recibirás un enlace en breve para restablecer tu contraseña.
              Revisa también la carpeta de spam.
            </p>
            <Link href="/login" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              ← Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Recuperar contraseña
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
              Introduce tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                  Correo electrónico
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="btn-primary"
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                {isPending ? '⏳ Enviando...' : '📧 Enviar enlace'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <Link href="/login" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
                ← Volver al inicio de sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
