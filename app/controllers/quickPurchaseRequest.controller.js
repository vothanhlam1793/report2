const db = require('../models')
const odoo = require('../../routes/adapter/odoo')
const { getReferenceCode } = require('../lib/invoiceReference')

function normalizeQuickPurchaseRequest(item) {
  if (!item) {
    return item
  }
  var normalized = Object.assign({}, item)
  if (!normalized.id && normalized._id) {
    normalized.id = String(normalized._id)
  }
  return normalized
}

function buildQuery(query) {
  const conditional = {}
  if (query.status) {
    conditional.status = query.status
  }
  if (query.referenceCode) {
    conditional.referenceCode = query.referenceCode
  }
  if (query.invoiceCode) {
    conditional.invoiceCode = query.invoiceCode
  }
  return conditional
}

function normalizeItems(items) {
  return (Array.isArray(items) ? items : [])
    .map(function (item) {
      return {
        productCode: item.productCode || '',
        productName: item.productName || '',
        requiredQty: Number(item.requiredQty || 0),
        requestedQty: Number(item.requestedQty || 0)
      }
    })
    .filter(function (item) {
      return item.productCode && item.requestedQty > 0
    })
}

function buildSupplierMessage(items) {
  return normalizeItems(items)
    .filter(function (item) {
      return item.requestedQty > 0
    })
    .map(function (item) {
      return item.productName + ' - SL: ' + item.requestedQty
    })
    .join('\n')
}

function getCurrentUser(req) {
  return (req.session && req.session.user) || {
    name: 'System',
    username: 'system'
  }
}

exports.findAll = async (req, res) => {
  try {
    const conditional = buildQuery(req.query || {})
    const data = await db.quickPurchaseRequests.find(conditional).sort({ updatedAt: -1, createdAt: -1 }).lean()
    res.send((data || []).map(normalizeQuickPurchaseRequest))
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot query quick purchase requests' })
  }
}

exports.findOne = async (req, res) => {
  try {
    const data = await db.quickPurchaseRequests.findById(req.params.id).lean()
    if (!data) {
      return res.status(404).send({ message: 'Quick purchase request not found' })
    }
    res.send(normalizeQuickPurchaseRequest(data))
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot query quick purchase request' })
  }
}

exports.getPrefill = async (req, res) => {
  try {
    const invoiceCode = req.params.code
    const invoice = await odoo.getInvoice(invoiceCode)
    if (!invoice || !invoice.code) {
      return res.status(404).send({ message: 'Invoice not found in Odoo' })
    }

    const invoiceState = await db.invoices.findOne({ code: invoiceCode }).lean()
    const normalizedStatus = invoiceState && invoiceState.status ? invoiceState.status : 'B1'

    res.send({
      invoiceCode: invoice.code,
      referenceCode: getReferenceCode(invoice.code),
      customerName: invoice.customerName || invoice.customerCode || '',
      invoiceStatus: normalizedStatus,
      summary: 'Tạo nhanh từ danh sách phiếu đặt hàng nhanh',
      items: (invoice.invoiceDetails || []).map(function (line) {
        return {
          productCode: line.productCode || '',
          productName: line.productName || '',
          requiredQty: Number(line.quantity || 0),
          requestedQty: Number(line.quantity || 0)
        }
      })
    })
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot build quick purchase prefill' })
  }
}

exports.create = async (req, res) => {
  try {
    const invoiceCode = req.body.invoiceCode || ''
    if (!invoiceCode) {
      return res.status(400).send({ message: 'Thiếu mã đơn.' })
    }

    const invoice = await odoo.getInvoice(invoiceCode)
    if (!invoice || !invoice.code) {
      return res.status(404).send({ message: 'Invoice not found in Odoo' })
    }

    const items = normalizeItems(req.body.items)
    if (!items.length) {
      return res.status(400).send({ message: 'Không có dòng hàng cần đặt.' })
    }

    const user = getCurrentUser(req)
    const created = await db.quickPurchaseRequests.create({
      referenceCode: getReferenceCode(invoice.code),
      invoiceCode: invoice.code,
      status: 'created',
      summary: req.body.summary || 'Tạo nhanh từ danh sách phiếu đặt hàng nhanh',
      supplierMessage: req.body.supplierMessage || buildSupplierMessage(items),
      createdByName: user.name,
      createdByUsername: user.username,
      items: items
    })

    res.send(normalizeQuickPurchaseRequest(created.toJSON()))
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot create quick purchase request' })
  }
}

exports.update = async (req, res) => {
  try {
    const existing = await db.quickPurchaseRequests.findById(req.params.id)
    if (!existing) {
      return res.status(404).send({ message: 'Quick purchase request not found' })
    }

    if (typeof req.body.summary === 'string') {
      existing.summary = req.body.summary
    }

    if (typeof req.body.supplierMessage === 'string') {
      existing.supplierMessage = req.body.supplierMessage
    }

    if (typeof req.body.status === 'string' && req.body.status) {
      existing.status = req.body.status
      if (req.body.status === 'ordered') {
        const user = getCurrentUser(req)
        existing.orderedAt = new Date()
        existing.orderedByName = user.name
        existing.orderedByUsername = user.username
      }
    }

    if (Array.isArray(req.body.items)) {
      existing.items = normalizeItems(req.body.items)
    }

    await existing.save()
    res.send(normalizeQuickPurchaseRequest(existing.toJSON ? existing.toJSON() : existing))
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot update quick purchase request' })
  }
}
