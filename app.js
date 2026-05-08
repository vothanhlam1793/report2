var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var helmet = require('helmet')
var session = require('express-session')
var MongoStore = require('connect-mongo')
var rateLimit = require('express-rate-limit')
require('dotenv').config()

var indexRouter = require('./routes/index')
var authRouter = require('./routes/auth')
var crmRouter = require('./routes/crm')
var usersRouter = require('./routes/users')
var customerRouter = require('./routes/customer')
var customerDirectoryRouter = require('./routes/customer-directory')
var supplierDirectoryRouter = require('./routes/supplier-directory')
var invoicesRouter = require('./routes/invoices')
const { attachCurrentUser, requireAuth, requireRole } = require('./app/lib/auth')
const seedAdminIfNeeded = require('./app/lib/seedAdmin')
const db = require('./app/models')

var app = express()
const sessionMaxAgeDays = Number(process.env.SESSION_MAX_AGE_DAYS || 7)
const sessionMaxAgeMs = sessionMaxAgeDays * 24 * 60 * 60 * 1000

app.set('trust proxy', 1)

function buildMongoSessionUrl() {
  if (!process.env.MONGO_USER || !process.env.MONGO_PASS) {
    return db.url
  }

  const encodedUser = encodeURIComponent(process.env.MONGO_USER)
  const encodedPass = encodeURIComponent(process.env.MONGO_PASS)
  const parts = db.url.split('://')
  if (parts.length !== 2) {
    return db.url
  }

  const protocol = parts[0]
  const rest = parts[1]
  if (rest.includes('@')) {
    return db.url
  }

  const separator = rest.includes('?') ? '&' : '?'
  return `${protocol}://${encodedUser}:${encodedPass}@${rest}${separator}authSource=admin`
}

// KHỞI ĐỘNG DATABASE
const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
if (process.env.MONGO_USER) {
  dbOptions.user = process.env.MONGO_USER
  dbOptions.pass = process.env.MONGO_PASS
  dbOptions.authSource = 'admin'
}
const mongoSessionUrl = buildMongoSessionUrl()

db.mongoose
  .connect(db.url, dbOptions)
  .then(() => {
    console.log('Connected to the database!')
    return seedAdminIfNeeded(db)
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
  name: 'report2.sid',
  secret: process.env.SESSION_SECRET || 'report2-dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoSessionUrl,
    ttl: Math.floor(sessionMaxAgeMs / 1000),
    collectionName: 'sessions'
  }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: sessionMaxAgeMs
  }
}))
app.use(attachCurrentUser)
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', authRouter)
app.use('/', indexRouter)
app.use('/crm', crmRouter)
app.use('/cart', require('./routes/cart'))
app.use('/users', usersRouter)
app.use('/customer', customerRouter)
app.use('/customers', customerDirectoryRouter)
app.use('/suppliers', supplierDirectoryRouter)
app.use('/invoices', requireAuth, invoicesRouter)
app.use('/task', require('./routes/task'))
app.use('/finance', require('./routes/finance'))

require('./app/routes/task.route')(app)
require('./app/routes/customer.route')(app)
require('./app/routes/invoice.route')(app, requireRole)
require('./app/routes/note.route')(app)
require('./app/routes/kiot.router')(app)
require('./app/routes/customer_creta_route')(app)
require('./app/routes/sheet.route')(app)
require('./app/routes/phieu.route')(app)
require('./app/routes/transaction.route')(app)
require('./app/routes/productBarcode.route')(app)
require('./app/routes/campaign.route')(app)
require('./app/routes/warehouseCheck.route')(app)
require('./app/routes/invoiceEvent.route')(app)
require('./app/routes/quickPurchaseRequest.route')(app)
require('./app/routes/quickStockReceipt.route')(app)
require('./app/routes/supplier.route')(app)
require('./app/routes/customerDirectory.route')(app)
require('./app/routes/supplierSuggestion.route')(app)

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
