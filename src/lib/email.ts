import { Resend } from 'resend'

// Lazy init: created on first use, not at module load time (avoids build-time errors)
function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to,
    subject: '🔑 Recuperar contraseña — Porra Mundial 2026',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Inter, system-ui, sans-serif; background: #f0f4f8; padding: 2rem; color: #0f172a;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 1rem; padding: 2rem; border: 1px solid #e2e8f0;">
          <div style="font-size: 1.5rem; font-weight: 900; margin-bottom: 1rem;">
            ⚽ <span style="background: linear-gradient(135deg,#22c55e,#f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Mundial 2026</span>
          </div>
          <h1 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem;">Recuperar contraseña</h1>
          <p style="color: #64748b; margin-bottom: 1.5rem; line-height: 1.6;">
            Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva
            (el enlace es válido durante <strong>1 hora</strong>).
          </p>
          <a href="${resetUrl}"
             style="display: inline-block; padding: 0.75rem 1.5rem; background: #22c55e; color: #0a0f0a;
                    font-weight: 700; border-radius: 0.5rem; text-decoration: none; font-size: 1rem;">
            🔑 Restablecer contraseña
          </a>
          <p style="margin-top: 1.5rem; font-size: 0.8rem; color: #94a3b8;">
            Si no has solicitado este cambio, ignora este correo. Tu contraseña no cambiará.
          </p>
          <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 0.75rem; color: #94a3b8;">
            O copia este enlace en tu navegador:<br/>
            <a href="${resetUrl}" style="color: #22c55e; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
      </body>
      </html>
    `,
  })
}
