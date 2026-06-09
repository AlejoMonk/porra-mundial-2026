import type { Metadata } from 'next'
import './globals.css'
import 'flag-icons/css/flag-icons.min.css'

export const metadata: Metadata = {
  title: 'Porra Mundial 2026 🏆',
  description: 'Haz tus predicciones para el Mundial de fútbol 2026 y compite con tus amigos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply saved theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="stadium-bg">{children}</body>
    </html>
  )
}
