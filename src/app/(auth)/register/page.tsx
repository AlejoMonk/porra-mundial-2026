'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { register } from '@/actions/auth'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await register(formData)
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
      <Link href="/" style={{ marginBottom: '2rem', textDecoration: 'none' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          ⚽ <span className="gradient-text">Mundial 2026</span>
        </span>
      </Link>

      <div className="glass" style={{ width: '100%', maxWidth: 420, padding: '2.5rem', borderRadius: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Únete a la porra
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Crea tu cuenta y haz tus predicciones
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
              Nombre completo
            </label>
            <input
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Tu nombre"
              className="form-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Alias <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(aparecerá en la clasificación)</span>
            </label>
            <input
              name="alias"
              type="text"
              maxLength={30}
              autoComplete="off"
              placeholder="p.ej. ElReyDelMundial 👑"
              className="form-input"
            />
            <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Opcional — si lo dejas vacío se usará tu nombre.
            </p>
          </div>

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
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary"
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            {isPending ? '⏳ Creando cuenta...' : '⚽ Crear cuenta y predecir'}
          </button>
        </form>

        <div
          className="glass"
          style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
        >
          ℹ️ Podrás modificar tu predicción tantas veces como quieras hasta que se cierre el plazo de cada fase. Una vez cerrado el plazo, las predicciones quedan bloqueadas.
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
