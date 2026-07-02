const db = require("../models")
const UserModel = db.users
const bcrypt = require('bcryptjs')

const DEFAULT_USERS = [
    { username: 'admin', password: 'admin123', display_name: 'Admin', role: 'admin' },
    { username: 'huu', password: 'huu123', display_name: 'Hữu', role: 'user' },
    { username: 'huyen', password: 'huyen123', display_name: 'Huyền', role: 'user' },
    { username: 'nhien', password: 'nhien123', display_name: 'Nhiên', role: 'user' },
    { username: 'lam', password: 'lam123', display_name: 'Lâm', role: 'user' },
    { username: 'trang', password: 'trang123', display_name: 'Trang', role: 'user' }
]

async function seedUsers() {
    try {
        const count = await UserModel.countDocuments()
        if (count > 0) return

        for (const u of DEFAULT_USERS) {
            const hash = await bcrypt.hash(u.password, 10)
            await UserModel.create({
                username: u.username,
                password: hash,
                display_name: u.display_name,
                role: u.role
            })
        }
        console.log('Seeded', DEFAULT_USERS.length, 'users into database')
    } catch (e) {
        console.log('Seed users error:', e.message)
    }
}

async function login(username, password) {
    const user = await UserModel.findOne({ username, active: true })
    if (!user) return null
    const match = await bcrypt.compare(password, user.password)
    if (!match) return null
    return {
        username: user.username,
        display_name: user.display_name,
        role: user.role
    }
}

module.exports = { seedUsers, login }
