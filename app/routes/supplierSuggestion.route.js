module.exports = app => {
  const { requireRole } = require('../lib/auth')
  const controller = require('../controllers/supplierSuggestion.controller')
  var router = require('express').Router()

  router.post('/by-products', requireRole('staff'), controller.findByProducts)

  app.use('/api/supplier-suggestions', router)
}
