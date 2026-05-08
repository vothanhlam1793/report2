module.exports = app => {
  const { requireRole } = require('../lib/auth')
  const controller = require('../controllers/supplier.controller')
  var router = require('express').Router()

  router.get('/', requireRole('staff'), controller.findAll)

  app.use('/api/suppliers', router)
}
