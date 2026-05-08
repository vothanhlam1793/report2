const bcrypt = require('bcryptjs')

const ROLE_ORDER = {
  viewer: 1,
  staff: 2,
  admin: 3
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next()
  }

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  return res.redirect('/login')
}

function requireRole(minRole) {
  return function (req, res, next) {
    if (!req.session || !req.session.user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      return res.redirect('/login')
    }

    const currentRole = req.session.user.role || 'viewer'
    if ((ROLE_ORDER[currentRole] || 0) < (ROLE_ORDER[minRole] || 0)) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      return res.status(403).render('error', {
        message: 'Bạn không có quyền truy cập khu vực này.',
        error: {}
      })
    }

    return next()
  }
}

function attachCurrentUser(req, res, next) {
  res.locals.currentUser = req.session ? req.session.user : null
  res.locals.isAuthenticated = Boolean(res.locals.currentUser)
  next()
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

module.exports = {
  ROLE_ORDER,
  requireAuth,
  requireRole,
  attachCurrentUser,
  hashPassword,
  comparePassword
}
