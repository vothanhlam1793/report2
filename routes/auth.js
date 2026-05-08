var express = require('express')
var router = express.Router()

const db = require('../app/models')
const { comparePassword } = require('../app/lib/auth')

router.get('/login', function (req, res) {
  if (req.session && req.session.user) {
    return res.redirect('/invoices/dashboard')
  }

  res.render('auth/login', {
    title: 'Đăng nhập',
    errorMessage: ''
  })
})

router.post('/login', async function (req, res, next) {
  try {
    const username = (req.body.username || '').trim().toLowerCase()
    const password = req.body.password || ''

    const user = await db.users.findOne({ username })
    if (!user || !user.isActive) {
      return res.status(401).render('auth/login', {
        title: 'Đăng nhập',
        errorMessage: 'Tài khoản không tồn tại hoặc đã bị khóa.'
      })
    }

    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).render('auth/login', {
        title: 'Đăng nhập',
        errorMessage: 'Sai thông tin đăng nhập.'
      })
    }

    user.lastLoginAt = new Date()
    await user.save()

    req.session.user = {
      id: String(user._id),
      name: user.name,
      username: user.username,
      role: user.role
    }

    return res.redirect('/invoices/dashboard')
  } catch (err) {
    next(err)
  }
})

router.post('/logout', function (req, res, next) {
  if (!req.session) {
    return res.redirect('/login')
  }

  req.session.destroy(function (err) {
    if (err) {
      return next(err)
    }

    res.clearCookie('report2.sid')
    return res.redirect('/login')
  })
})

module.exports = router
