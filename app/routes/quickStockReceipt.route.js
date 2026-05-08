module.exports = app => {
  const controllers = require('../controllers/quickStockReceipt.controller')
  var router = require('express').Router()

  router.get('/', controllers.findAll)
  router.post('/', controllers.create)
  router.get('/prefill', controllers.getPrefill)
  router.get('/:id', controllers.findOne)
  router.put('/:id', controllers.update)

  app.use('/api/quick-stock-receipts', router)
}
