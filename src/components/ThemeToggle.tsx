'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
    setTheme(saved)
    setMounted(true)
  }, [])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  // Avoid hydration mismatch — render placeholder until mounted
  if (!mounted) {
    return (
      <button
        style={{
          padding: '0.4rem 0.6rem',
          fontSize: '1rem',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          opacity: 0,
        }}
        aria-hidden="true"
      >
        🌙
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      style={{
        padding: '0.4rem 0.6rem',
        fontSize: '1.1rem',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderRadius: '0.375rem',
        transition: 'background 0.15s ease',
        lineHeight: 1,
      }}
      title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      onMouseOver={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(128,128,128,0.12)'
      }}
      onMouseOut={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
