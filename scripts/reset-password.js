/**
 * reset-password.js — Restablece la contraseña de un usuario directamente.
 *
 * Uso (desde la Console de Railway o en local):
 *   node scripts/reset-password.js <email> <nueva-contraseña>
 *
 * Ejemplo:
 *   node scripts/reset-password.js agodoyabad@gmail.com MiClaveNueva123
 */

try { require('dotenv').config({ path: '.env.local' }) } catch (_) {}

const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const path = require('path')

const email = process.argv[2]
const newPassword = process.argv[3]

if (!email || !newPassword) {
  console.error('Uso: node scripts/reset-password.js <email> <nueva-contraseña>')
  process.exit(1)
}

if (newPassword.length < 6) {
  console.error('ERROR: La contraseña debe tener al menos 6 caracteres.')
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

const user = db.prepare('SELECT id, name FROM User WHERE email = ?').get(email)
if (!user) {
  console.error(`No se encontró ningún usuario con email: ${email}`)
  db.close()
  process.exit(1)
}

const passwordHash = bcrypt.hashSync(newPassword, 12)
db.prepare('UPDATE User SET passwordHash = ? WHERE email = ?').run(passwordHash, email)

console.log(`✅ Contraseña restablecida para "${user.name}" (${email}).`)
console.log('   Ya puedes iniciar sesión con la nueva contraseña.')
db.close()
