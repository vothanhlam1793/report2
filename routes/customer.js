var express = require('express')
var router = express.Router()
var detailController = require('./controller/detail')

router.get('/', detailController.getAll)
router.get('/detail', detailController.getDetail)
router.get('/:code/info', detailController.getInfo)
router.get('/:code/health', detailController.getHealth)
module.exports = router
