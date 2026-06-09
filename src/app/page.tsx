import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function Home() {
  const session = await getSession()
  if (session) redirect('/leaderboard')

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
        <div className="landing-header-inner">
          {/* Logo */}
          <span style={{ fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>
            ⚽ <span className="gradient-text">Mundial 2026</span>
          </span>

          {/* Attribution — centrado absoluto, solo visible en desktop */}
          <div className="landing-attribution">
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Creado por
            </span>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #22c55e, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Alejandro Abad
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Señor de Claude y de la IA en general
            </span>
          </div>

          {/* Botones */}
          <div className="landing-buttons">
            <ThemeToggle />
            <Link href="/login" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              Unirse
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="landing-hero"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '5rem 1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: 600,
            height: '90vw',
            maxHeight: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="badge badge-green" style={{ marginBottom: '1.5rem' }}>
          🏆 FIFA World Cup 2026 · USA · Canadá · México
        </div>

        <h1 className="hero-title" style={{ marginBottom: '1.5rem', textShadow: '0 2px 12px rgba(0,0,0,0.4)', color: '#fff' }}>
          La{' '}
          <span className="gradient-text">porra</span>
          <br />
          del Mundial 2026
        </h1>

        <p className="hero-subtext" style={{
          fontSize: '1.125rem',
          maxWidth: 540,
          marginBottom: '3rem',
          lineHeight: 1.75,
          fontWeight: 400,
        }}>
          Predice todos los partidos, demuestra que eres un friki del fúbol y que tus 2 neuronas están bien engrasadas.
          Compite con tus peores amigos y demuestra que sabes de fúbol más que Enrique Riquelme.
        </p>

        <div className="landing-hero-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/register" className="btn-primary glow-green" style={{ fontSize: '1.1rem', padding: '0.875rem 2rem' }}>
            ⚽ Hacer mis predicciones
          </Link>
          <Link href="/login" className="btn-secondary" style={{ fontSize: '1.1rem', padding: '0.875rem 2rem' }}>
            Ya tengo cuenta
          </Link>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
          {['🌍 48 equipos', '📋 12 grupos', '⚔️ 104 partidos', '🏆 1 Campeón'].map((chip) => (
            <span key={chip} className="badge badge-green" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>{chip}</span>
          ))}
        </div>

        {/* Two-phase explanation */}
        <div style={{ marginTop: '4rem', maxWidth: 760, width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: 'var(--text)' }}>
            ¿Cómo funciona la porra?
          </h3>
          <div className="landing-phase-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '3px solid #22c55e' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Fase 1 — Antes del torneo
              </div>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>Grupos y Terceros</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Predice el 1º y 2º de cada uno de los 12 grupos, y elige los 8 mejores terceros que crees que pasarán a la siguiente ronda.
              </div>
            </div>
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Fase 2 — Tras la fase de grupos
              </div>
              <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>Eliminatorias y Premios</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Una vez cerrada la fase de grupos, el admin abre la fase 2: predice los ganadores de dieciséisavos hasta la final, el Pichichi y el MVP.
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1rem',
            marginTop: '2rem',
            width: '100%',
            maxWidth: 860,
          }}
        >
          {[
            { icon: '🗓️', title: 'Fase de grupos', desc: '12 grupos, predice el 1º y 2º de cada uno' },
            { icon: '🏆', title: 'Fase final', desc: 'Desde dieciséisavos hasta la gran final' },
            { icon: '⭐', title: 'Premios especiales', desc: 'Pichichi y MVP del torneo' },
            { icon: '📊', title: 'Clasificación', desc: 'Ranking en tiempo real con puntuación' },
          ].map((f) => (
            <div
              key={f.title}
              className="glass"
              style={{ padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'left' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{f.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text)' }}>{f.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Scoring legend */}
        <div className="glass" style={{ marginTop: '3rem', padding: '2rem', borderRadius: '1rem', maxWidth: 680, width: '100%' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', color: '#f59e0b' }}>
            🎯 Sistema de puntuación
          </h3>
          <div className="two-col-grid" style={{ textAlign: 'left', fontSize: '0.85rem' }}>
            {[
              ['1º de grupo correcto', '5 pts'],
              ['2º de grupo correcto', '3 pts'],
              ['Ambos correctos (bonus)', '+2 pts'],
              ['Dieciséisavo de final', '3 pts'],
              ['Cuarto de final', '6 pts'],
              ['Semifinal', '8 pts'],
              ['Campeón', '15 pts'],
              ['Pichichi (nombre)', '10 pts'],
              ['MVP (nombre)', '8 pts'],
            ].map(([desc, pts]) => (
              <div key={desc} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{desc}</span>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>{pts}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(34,197,94,0.06)', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>🥉 Mejores terceros (escalonado):</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>1-2 acertados → 1 pt · 3-4 → 3 pts · 5-6 → 5 pts · 7-8 → 10 pts</span>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--glass-border)' }}>
        🌍 Mundial 2026 · 48 equipos · 104 partidos · ¡Que empiece la fiesta!
      </footer>
    </main>
  )
}
