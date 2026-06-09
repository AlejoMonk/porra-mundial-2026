'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/actions/auth'

export default function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)

    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    formData.set('token', token)

    startTransition(async () => {
      const result = await resetPassword(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text)' }}>
        Nueva contraseña
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Elige una contraseña segura de al menos 6 caracteres.
      </p>

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
            Nueva contraseña
          </label>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            className="form-input"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
            Confirmar contraseña
          </label>
          <input
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
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
          {isPending ? '⏳ Guardando...' : '🔑 Cambiar contraseña'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Volver al inicio de sesión
        </Link>
      </p>
    </>
  )
}
