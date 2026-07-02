var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var helmet = require('helmet')
var rateLimit = require('express-rate-limit')
var session = require('express-session')
require('dotenv').config()

var indexRouter = require('./routes/index')
var crmRouter = require('./routes/crm')
var usersRouter = require('./routes/users')
var customerRouter = require('./routes/customer')
var invoicesRouter = require('./routes/invoices')

var app = express()

// KHỞI ĐỘNG DATABASE
const db = require('./app/models')
const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
if (process.env.MONGO_USER) {
  dbOptions.user = process.env.MONGO_USER
  dbOptions.pass = process.env.MONGO_PASS
  dbOptions.authSource = 'admin'
}
db.mongoose
  .connect(db.url, dbOptions)
  .then(() => {
    console.log('Connected to the database!')
  })
  .catch(err => {
    console.log('Cannot connect to the database!', err)
    process.exit()
  })

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
}))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(session({
  secret: process.env.SESSION_SECRET || 'report2-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: (parseInt(process.env.SESSION_MAX_AGE_DAYS) || 7) * 24 * 60 * 60 * 1000
  }
}))

app.use(express.static(path.join(__dirname, 'public')))

app.get('/login', function (req, res) {
  if (req.session.user) {
    return res.redirect(req.query.redirect || '/')
  }
  res.render('login', { error: null })
})

app.post('/login', function (req, res) {
  const users = {
    admin: process.env.ADMIN_PASSWORD || 'admin123',
    huu: process.env.HUU_PASSWORD || 'huu123',
    huyen: process.env.HUYEN_PASSWORD || 'huyen123'
  }
  const { username, password } = req.body
  if (users[username] && users[username] === password) {
    req.session.user = username
    return res.redirect(req.query.redirect || '/')
  }
  res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu' })
})

app.get('/logout', function (req, res) {
  req.session.destroy()
  res.redirect('/login')
})

const auth = require('./app/middleware/auth')
app.use(auth)

app.use('/', indexRouter)
app.use('/crm', crmRouter)
app.use('/cart', require('./routes/cart'))
app.use('/users', usersRouter)
app.use('/customer', customerRouter)
app.use('/invoices', invoicesRouter)
app.use('/task', require('./routes/task'))
app.use('/finance', require('./routes/finance'))

require('./app/routes/task.route')(app)
require('./app/routes/customer.route')(app)
require('./app/routes/invoice.route')(app)
require('./app/routes/note.route')(app)
require('./app/routes/kiot.router')(app)
require('./app/routes/customer_creta_route')(app)
require('./app/routes/sheet.route')(app)
require('./app/routes/phieu.route')(app)
require('./app/routes/transaction.route')(app)
require('./app/routes/productBarcode.route')(app)
require('./app/routes/campaign.route')(app)
require('./app/routes/image.route')(app)

// 404 handler
app.use(function (req, res, next) {
  next(createError(404))
})

// Global error handler
app.use(function (err, req, res, next) {
  const status = err.status || 500
  const isDev = req.app.get('env') === 'development'
  res.status(status)
  // API requests get JSON errors
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ error: err.message, status })
  }
  res.render('error', {
    message: err.message,
    error: isDev ? err : {}
  })
})

module.exports = app
