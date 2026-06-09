'use client'

export function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        color: 'var(--text-muted)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.875rem',
        padding: 0,
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      ← Volver
    </button>
  )
}
