const { hashPassword } = require('./auth')

async function seedAdminIfNeeded(db) {
  const username = (process.env.ADMIN_USERNAME || '').trim()
  const password = process.env.ADMIN_PASSWORD || ''
  const name = (process.env.ADMIN_NAME || 'Administrator').trim()

  if (!username || !password) {
    return
  }

  const existing = await db.users.findOne({ username })
  if (existing) {
    return
  }

  const passwordHash = await hashPassword(password)
  await db.users.create({
    name,
    username,
    passwordHash,
    role: 'admin',
    isActive: true
  })

  console.log('[auth] Seeded default admin user')
}

module.exports = seedAdminIfNeeded
