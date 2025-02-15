var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
require('dotenv').config()

var indexRouter = require('./routes/index')
var crmRouter = require('./routes/crm')
var usersRouter = require('./routes/users')
var customerRouter = require('./routes/customer')
var invoicesRouter = require('./routes/invoices')

var app = express()

// KHỞI ĐỘNG DATABASE
const db = require('./app/models')
db.mongoose
  .connect(db.url, {
    user: 'black',
    pass: 'asrkpvg7',
    authSource: 'admin',
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
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

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

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

module.exports = app
