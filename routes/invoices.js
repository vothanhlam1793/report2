var express = require('express')
var router = express.Router()

router.get('/', (req, res) => {
  res.render('invoices/index')
})
router.get('/detail', (req, res) => {
  res.render('invoices/detail')
})

router.get('/barcode/:invoiceCode/:productCode', (req, res) => {
  const { invoiceCode, productCode } = req.params
  res.render('invoices/barcode', { invoiceCode, productCode })
})

router.get('/dashboard', (req, res) => {
  res.render('invoices/dashboard')
})

router.get('/package', (req, res) => {
  res.render('invoices/package')
})

router.get('/prepare', (req, res) => {
  res.render('invoices/prepare')
})

router.get('/ship', (req, res) => {
  res.render('invoices/ship')
})

router.get('/shortage', (req, res) => {
  res.render('invoices/shortage')
})

router.get('/warehouse-check', (req, res) => {
  res.render('invoices/warehouse-check')
})

router.get('/quick-purchase', (req, res) => {
  res.render('invoices/quick-purchase')
})

router.get('/quick-purchase/:id', (req, res) => {
  res.render('invoices/quick-purchase-detail', { quickPurchaseRequestId: req.params.id })
})

router.get('/quick-receipt', (req, res) => {
  res.render('invoices/quick-receipt')
})

router.get('/quick-receipt/:id', (req, res) => {
  res.render('invoices/quick-receipt-detail', { quickStockReceiptId: req.params.id })
})

router.get('/summary', (req, res) => {
  res.render('invoices/summary')
})

router.get('/demo', (req, res) => {
  res.render('invoices/demo')
})

router.get('/customer_notes', (req, res) => {
  res.render('invoices/customer_notes')
})

module.exports = router
