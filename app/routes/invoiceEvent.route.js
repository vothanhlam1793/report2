module.exports = app => {
  const controllers = require('../controllers/invoiceEvent.controller')
  var router = require('express').Router()

  router.get('/', controllers.findAll)

  app.use('/api/invoice-events', router)
}
