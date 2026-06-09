const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, '..', 'prisma', 'dev.db'))

// Add thirdPlaceAssignment column to TournamentResult if it doesn't exist
const cols = db.pragma('table_info(TournamentResult)')
const hasCol = cols.some((c) => c.name === 'thirdPlaceAssignment')

if (!hasCol) {
  db.exec(`ALTER TABLE TournamentResult ADD COLUMN thirdPlaceAssignment TEXT NOT NULL DEFAULT '{}'`)
  console.log('Added thirdPlaceAssignment column to TournamentResult.')
} else {
  console.log('thirdPlaceAssignment column already exists.')
}

db.close()
