import { prisma } from '@/lib/prisma'
import SettingsForm from '@/components/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>⚙️ Ajustes de la porra</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Configura el comportamiento de la aplicación.
      </p>
      <SettingsForm
        initialDeadline={settings?.predictionDeadline?.toISOString().slice(0, 16) ?? ''}
        initialPhase2Deadline={settings?.phase2Deadline?.toISOString().slice(0, 16) ?? ''}
        initialPhase3Deadline={settings?.phase3Deadline?.toISOString().slice(0, 16) ?? ''}
        initialRegOpen={settings?.registrationOpen ?? true}
      />
    </div>
  )
}
