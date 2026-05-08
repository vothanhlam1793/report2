module.exports = app => {
  const controllers = require('../controllers/warehouseCheck.controller')
  var router = require('express').Router()

  router.get('/', controllers.findAll)
  router.get('/shortage-queue', controllers.getShortageQueue)
  router.get('/invoice/:code', controllers.getByInvoiceCode)
  router.post('/invoice/:code/refresh', controllers.refreshByInvoiceCode)
  router.post('/invoice/:code/confirm-enough', controllers.confirmEnough)
  router.post('/invoice/:code/shortage-decision', controllers.submitShortageDecision)
  router.post('/invoice/:code/quick-purchase', controllers.createQuickPurchaseRequest)
  router.post('/invoice/:code/quick-receipt', controllers.createQuickStockReceipt)

  app.use('/api/warehouse-checks', router)
}
