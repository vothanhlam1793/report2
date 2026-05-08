var express = require('express')
var router = express.Router()
const { requireAuth, requireRole } = require('../app/lib/auth')

router.use(requireAuth)
router.use(requireRole('staff'))

router.get('/', function (req, res) {
  res.render('directories/suppliers', {
    title: 'Suppliers',
    currentUser: req.session ? req.session.user : null
  })
})

module.exports = router
