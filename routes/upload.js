var express = require('express')
var router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')

const mongoURI = 'mongodb://black:asrkpvg7@node.creta.work:30042/images'
const conn = mongoose.createConnection(mongoURI, {
  authSource: 'admin',
  useNewUrlParser: true,
  useUnifiedTopology: true
})

let gfs
conn.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads'
  })
})
const storage = new GridFsStorage({
  db: conn,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const fileInfo = {
        filename: Date.now() + '-' + file.originalname,
        bucketName: 'uploads'
      }
      resolve(fileInfo)
    })
  }
})
const upload = multer({ storage })

router.get('/', function (req, res) {
  res.render('index2')
})

//  Tai hinh anh len he thong
router.post('/upload', upload.single('formFile'), (req, res) => {
  res.send(req.file)
})

//  Lay hinh anh ve
router.get('/:filename', (req, res) => {
  var filename = req.params.filename
  gfs.find({ filename: filename }).toArray((e, files) => {
    if (e) {
      console.log(e)
      return
    }
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'no files exist'
      })
    }
    gfs.openDownloadStreamByName(filename).pipe(res)
  })
})

module.exports = router
