var express = require('express');
var router = express.Router();
const db = require('../app/models')
const { requireAuth, requireRole } = require('../app/lib/auth')

router.use(requireAuth)
router.use(requireRole('staff'))

router.get('/', async function(req, res, next) {
  try {
    const users = await db.users.find({ isActive: true }).sort({ name: 1 }).lean()
    res.render('finance/index', {
      title: 'Finance',
      currentUser: req.session ? req.session.user : null,
      users: users || []
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router;
