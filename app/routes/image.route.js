const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/uploads/invoices'))
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext
    cb(null, name)
  }
})

const fileFilter = function (req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Chỉ chấp nhận file jpg, png, webp'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
})

module.exports = app => {
  const router = require("express").Router()
  const imageController = require("../controllers/image.controller.js")

  router.post("/:code/images", upload.single("file"), imageController.upload)
  router.get("/:code/images", imageController.findAll)
  router.delete("/:code/images/:image_id", imageController.delete)

  router.use(function (err, req, res, next) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File quá lớn. Tối đa 10MB' })
      }
      return res.status(400).json({ message: err.message })
    }
    if (err.message && err.message.includes('Chỉ chấp nhận')) {
      return res.status(400).json({ message: err.message })
    }
    next(err)
  })

  app.use('/api/invoices', router)
}
