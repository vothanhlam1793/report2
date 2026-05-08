var express = require('express')
var router = express.Router()

const db = require('../app/models')
const { requireRole, hashPassword } = require('../app/lib/auth')

router.use(requireRole('admin'))

router.get('/', async function (req, res, next) {
  try {
    const users = await db.users.find({}).sort({ createdAt: -1 }).lean()
    res.render('users/index', {
      title: 'Users',
      users
    })
  } catch (err) {
    next(err)
  }
})

router.post('/', async function (req, res, next) {
  try {
    const name = (req.body.name || '').trim()
    const username = (req.body.username || '').trim().toLowerCase()
    const password = req.body.password || ''
    const role = (req.body.role || 'viewer').trim()
    const isActive = req.body.isActive === 'on'

    if (!name || !username || !password) {
      return res.status(400).render('error', {
        message: 'Thiếu thông tin tạo user.',
        error: {}
      })
    }

    const existing = await db.users.findOne({ username })
    if (existing) {
      return res.status(400).render('error', {
        message: 'Username đã tồn tại.',
        error: {}
      })
    }

    await db.users.create({
      name,
      username,
      passwordHash: await hashPassword(password),
      role,
      isActive
    })

    res.redirect('/users')
  } catch (err) {
    next(err)
  }
})

router.post('/:id/status', async function (req, res, next) {
  try {
    const user = await db.users.findById(req.params.id)
    if (!user) {
      return res.status(404).render('error', {
        message: 'Không tìm thấy user.',
        error: {}
      })
    }

    user.isActive = req.body.isActive === 'true'
    await user.save()
    res.redirect('/users')
  } catch (err) {
    next(err)
  }
})

module.exports = router
