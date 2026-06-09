'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { login } from '@/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [resetOk, setResetOk] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setResetOk(params.get('reset') === 'ok')
    }
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setError(result.error)
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
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text)' }}>
          Iniciar sesión
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Accede a tu porra del Mundial
        </p>

        {resetOk && (
          <div
            className="badge badge-green"
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', justifyContent: 'flex-start' }}
          >
            ✅ Contraseña cambiada correctamente. Ya puedes iniciar sesión.
          </div>
        )}

        {error && (
          <div
            className="badge badge-red"
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', justifyContent: 'flex-start' }}
          >
            ⚠️ {error}
          </div>
        )}

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

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                Contraseña
              </label>
              <Link
                href="/forgot-password"
                style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary"
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            {isPending ? '⏳ Entrando...' : '🔑 Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
