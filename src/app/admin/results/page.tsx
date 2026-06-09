import { prisma } from '@/lib/prisma'
import { GROUPS, R32_MATCHES, R16_MATCHES, QF_MATCHES, SF_MATCHES, ALL_TEAMS, getTeam } from '@/lib/constants'
import ResultsForm from '@/components/ResultsForm'

export const dynamic = 'force-dynamic'

export default async function AdminResultsPage() {
  const tournament = await prisma.tournamentResult.findUnique({ where: { id: 'singleton' } })

  const groupResults = JSON.parse(tournament?.groupResults || '{}')
  const matchResults = JSON.parse(tournament?.matchResults || '{}')
  const thirdPlaceQualifiers = JSON.parse(tournament?.thirdPlaceQualifiers || '[]')
  const thirdPlaceAssignment = JSON.parse(tournament?.thirdPlaceAssignment || '{}')

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>⚽ Introducir resultados</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Introduce los resultados reales para calcular la puntuación de todos los jugadores.
      </p>

      <ResultsForm
        groups={GROUPS}
        allTeams={ALL_TEAMS}
        r32Matches={R32_MATCHES}
        r16Matches={R16_MATCHES}
        qfMatches={QF_MATCHES}
        sfMatches={SF_MATCHES}
        initialGroupResults={groupResults}
        initialMatchResults={matchResults}
        initialThirdPlaceQualifiers={thirdPlaceQualifiers}
        initialThirdPlaceAssignment={thirdPlaceAssignment}
        initialTopScorer={tournament?.topScorer ?? ''}
        initialMvp={tournament?.mvp ?? ''}
      />
    </div>
  )
}
