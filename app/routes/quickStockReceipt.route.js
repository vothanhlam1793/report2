module.exports = app => {
  const controllers = require('../controllers/quickStockReceipt.controller')
  var router = require('express').Router()
  var multer = require('multer')
  var path = require('path')

  controllers.ensureUploadDir()

  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, controllers.QUICK_RECEIPT_UPLOAD_DIR)
    },
    filename: function (req, file, cb) {
      var ext = path.extname(file.originalname || '').toLowerCase()
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext)
    }
  })

  var upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
      if (!file.mimetype || file.mimetype.indexOf('image/') !== 0) {
        return cb(new Error('Chỉ hỗ trợ file hình ảnh.'))
      }
      cb(null, true)
    }
  })

  router.get('/', controllers.findAll)
  router.post('/', controllers.create)
  router.get('/prefill', controllers.getPrefill)
  router.post('/:id/upload-image', upload.single('image'), controllers.uploadReceiptImage)
  router.get('/:id', controllers.findOne)
  router.put('/:id', controllers.update)

  app.use('/api/quick-stock-receipts', router)
}
