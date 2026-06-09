/**
 * make-admin.js — Convierte un usuario en administrador.
 *
 * Uso (desde la shell de Railway o en local):
 *   node scripts/make-admin.js email@ejemplo.com
 */

try { require('dotenv').config({ path: '.env.local' }) } catch (_) {}

const Database = require('better-sqlite3')
const path = require('path')

const email = process.argv[2]
if (!email) {
  console.error('Uso: node scripts/make-admin.js <email>')
  process.exit(1)
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL no está definido.')
  process.exit(1)
}

const filePath = databaseUrl.replace(/^file:/, '')
const dbPath = path.isAbsolute(filePath)
  ? filePath
  : path.join(process.cwd(), filePath)

const db = new Database(dbPath)

const user = db.prepare('SELECT id, name, isAdmin FROM User WHERE email = ?').get(email)
if (!user) {
  console.error(`No se encontró ningún usuario con email: ${email}`)
  db.close()
  process.exit(1)
}

if (user.isAdmin) {
  console.log(`El usuario "${user.name}" (${email}) ya es administrador.`)
  db.close()
  process.exit(0)
}

db.prepare('UPDATE User SET isAdmin = 1 WHERE email = ?').run(email)
console.log(`✅ "${user.name}" (${email}) ahora es administrador.`)
db.close()
