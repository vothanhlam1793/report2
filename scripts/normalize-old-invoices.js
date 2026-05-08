require('dotenv').config()

const db = require('../app/models')
const dbConfig = require('../app/config/db.config')
const odoo = require('../routes/adapter/odoo')
const { normalizeInvoiceStatus } = require('../app/lib/invoiceStatus')

function buildDbOptions() {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }

  if (process.env.MONGO_USER) {
    options.user = process.env.MONGO_USER
    options.pass = process.env.MONGO_PASS
    options.authSource = 'admin'
  }

  return options
}

function formatDate(value) {
  return new Date(value).toISOString().slice(0, 10)
}

async function main() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  await db.mongoose.connect(dbConfig.url, buildDbOptions())

  try {
    const sourceInvoices = await odoo.getAllInvoices()
    const sourceMap = new Map()
    sourceInvoices.forEach(function (invoice) {
      sourceMap.set(invoice.code, invoice)
    })

    const localStates = await db.invoices.find({}).lean()
    const openStates = localStates.filter(function (record) {
      const statusKey = normalizeInvoiceStatus(record.status)
      if (['B9', 'B10'].includes(statusKey)) {
        return false
      }

      const sourceInvoice = sourceMap.get(record.code)
      if (!sourceInvoice || !sourceInvoice.purchaseDate) {
        return false
      }

      return new Date(sourceInvoice.purchaseDate) < cutoff
    })

    const beforeCounts = {}
    localStates.forEach(function (record) {
      const statusKey = normalizeInvoiceStatus(record.status)
      beforeCounts[statusKey] = (beforeCounts[statusKey] || 0) + 1
    })

    let updatedCount = 0
    for (const record of openStates) {
      const previousStatus = normalizeInvoiceStatus(record.status)
      await db.invoices.updateOne(
        { _id: record._id },
        {
          $set: {
            status: 'B9',
            changeWarningLevel: '',
            changeWarningSummary: ''
          }
        }
      )

      await db.invoiceEvents.create({
        referenceCode: record.referenceCode || (record.code ? String(record.code).split('.')[0] : ''),
        invoiceCode: record.code || '',
        eventType: 'auto_closed_legacy_invoice',
        actorRole: 'system',
        actorUsername: 'system',
        actorName: 'System Migration',
        fromStatus: previousStatus,
        toStatus: 'B9',
        summary: 'Tự động chuẩn hóa đơn mở quá 30 ngày về Hoàn thành',
        payload: {
          cutoffDate: formatDate(cutoff),
          normalizedAt: formatDate(new Date())
        }
      })

      updatedCount += 1
    }

    const afterStates = await db.invoices.find({}).lean()
    const afterCounts = {}
    afterStates.forEach(function (record) {
      const statusKey = normalizeInvoiceStatus(record.status)
      afterCounts[statusKey] = (afterCounts[statusKey] || 0) + 1
    })

    console.log('Cutoff date:', formatDate(cutoff))
    console.log('Source invoices:', sourceInvoices.length)
    console.log('Local states:', localStates.length)
    console.log('Updated old open states to B9:', updatedCount)
    console.log('Before counts:', beforeCounts)
    console.log('After counts:', afterCounts)
  } finally {
    await db.mongoose.disconnect()
  }
}

main().catch(function (error) {
  console.error(error)
  process.exit(1)
})
