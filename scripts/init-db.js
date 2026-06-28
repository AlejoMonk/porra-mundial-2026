/**
 * init-db.js — Inicializa la base de datos SQLite en producción.
 * Se ejecuta antes de `next start` para garantizar que las tablas existen.
 * Lee DATABASE_URL del entorno (o de .env.local en desarrollo).
 */

try { require('dotenv').config({ path: '.env.local' }) } catch (_) {}

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('[init-db] ERROR: DATABASE_URL no está definido.')
  process.exit(1)
}

// Extraer la ruta del archivo desde la URL (e.g. "file:/data/porra.db" → "/data/porra.db")
const filePath = databaseUrl.replace(/^file:/, '')
const dbPath = path.isAbsolute(filePath)
  ? filePath
  : path.join(process.cwd(), filePath)

// Crear directorio si no existe (útil para volumenes nuevos en Railway)
const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
  console.log(`[init-db] Directorio creado: ${dir}`)
}

console.log(`[init-db] Iniciando base de datos en: ${dbPath}`)
const db = new Database(dbPath)

// WAL mode: mejor rendimiento en concurrencia
db.pragma('journal_mode = WAL')

db.exec(`
  -- ── Usuarios ────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS User (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    alias        TEXT,
    email        TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    isAdmin      INTEGER NOT NULL DEFAULT 0,
    createdAt    DATETIME NOT NULL DEFAULT (datetime('now'))
  );

  -- ── Predicciones ────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS Prediction (
    id                TEXT    PRIMARY KEY,
    userId            TEXT    NOT NULL UNIQUE,
    submittedAt       DATETIME NOT NULL DEFAULT (datetime('now')),
    isLocked          INTEGER NOT NULL DEFAULT 0,
    isPhase2Locked    INTEGER NOT NULL DEFAULT 0,
    phase2SubmittedAt DATETIME,
    isPhase3Locked    INTEGER NOT NULL DEFAULT 0,
    phase3SubmittedAt DATETIME,
    groupPredictions  TEXT NOT NULL DEFAULT '{}',
    thirdPlacePicks   TEXT NOT NULL DEFAULT '[]',
    knockoutPicks     TEXT NOT NULL DEFAULT '{}',
    topScorerTeam     TEXT,
    mvpTeam           TEXT,
    groupPoints       INTEGER NOT NULL DEFAULT 0,
    thirdPlacePoints  INTEGER NOT NULL DEFAULT 0,
    knockoutPoints    INTEGER NOT NULL DEFAULT 0,
    specialPoints     INTEGER NOT NULL DEFAULT 0,
    totalPoints       INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  );

  -- ── Tokens de reseteo de contraseña ─────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS PasswordResetToken (
    id        TEXT PRIMARY KEY,
    userId    TEXT NOT NULL,
    token     TEXT NOT NULL UNIQUE,
    expiresAt DATETIME NOT NULL,
    usedAt    DATETIME,
    createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  );

  -- ── Resultados del torneo (singleton) ───────────────────────────────────────
  CREATE TABLE IF NOT EXISTS TournamentResult (
    id                   TEXT PRIMARY KEY DEFAULT 'singleton',
    groupResults         TEXT NOT NULL DEFAULT '{}',
    matchResults         TEXT NOT NULL DEFAULT '{}',
    thirdPlaceQualifiers TEXT NOT NULL DEFAULT '[]',
    thirdPlaceAssignment TEXT NOT NULL DEFAULT '{}',
    topScorer            TEXT,
    mvp                  TEXT,
    updatedAt            DATETIME NOT NULL DEFAULT (datetime('now'))
  );

  -- ── Ajustes de la app (singleton) ───────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS AppSettings (
    id                 TEXT PRIMARY KEY DEFAULT 'singleton',
    predictionDeadline DATETIME,
    phase2Deadline     DATETIME,
    phase3Deadline     DATETIME,
    registrationOpen   INTEGER NOT NULL DEFAULT 1,
    updatedAt          DATETIME NOT NULL DEFAULT (datetime('now'))
  );
`)

// ── Migraciones idempotentes: añadir columnas nuevas a tablas existentes ──────
// CREATE TABLE IF NOT EXISTS no añade columnas a tablas ya creadas, así que
// comprobamos con PRAGMA table_info y hacemos ALTER TABLE ADD COLUMN si faltan.
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
    console.log(`[init-db] + Columna añadida: ${table}.${column}`)
  }
}

ensureColumn('Prediction', 'isPhase3Locked', 'INTEGER NOT NULL DEFAULT 0')
ensureColumn('Prediction', 'phase3SubmittedAt', 'DATETIME')
ensureColumn('AppSettings', 'phase3Deadline', 'DATETIME')

// Garantizar que los singletons existen
db.prepare(`INSERT OR IGNORE INTO TournamentResult (id, updatedAt) VALUES ('singleton', datetime('now'))`).run()
db.prepare(`INSERT OR IGNORE INTO AppSettings (id, updatedAt) VALUES ('singleton', datetime('now'))`).run()

console.log('[init-db] ✅ Base de datos inicializada correctamente.')
db.close()
