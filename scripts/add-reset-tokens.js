const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, '..', 'prisma', 'dev.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS PasswordResetToken (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiresAt DATETIME NOT NULL,
    usedAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  )
`)

console.log('PasswordResetToken table created (or already existed).')
db.close()
