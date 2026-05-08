var fetch = require('node-fetch')

var tokenCache = {
  uid: 0,
  db: '',
  checkedAt: 0
}

function getConfig() {
  return {
    baseUrl: (process.env.ODOO_URL || '').replace(/\/$/, ''),
    db: process.env.ODOO_DB || '',
    username: process.env.ODOO_USERNAME || '',
    password: process.env.ODOO_PASSWORD || '',
    companyName: process.env.ODOO_COMPANY_NAME || 'CRETA'
  }
}

async function jsonrpc(service, method, args) {
  var config = getConfig()
  if (!config.baseUrl) {
    throw new Error('Missing ODOO_URL')
  }

  var res = await fetch(config.baseUrl + '/jsonrpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: service,
        method: method,
        args: args
      },
      id: 1
    })
  })
  var body = await res.json()
  if (body.error) {
    throw new Error(body.error.message || 'Odoo RPC error')
  }
  return body.result
}

async function authenticate() {
  var config = getConfig()
  var now = Date.now()
  if (tokenCache.uid > 0 && tokenCache.db === config.db && now - tokenCache.checkedAt < 10 * 60 * 1000) {
    return tokenCache
  }

  var uid = await jsonrpc('common', 'authenticate', [config.db, config.username, config.password, {}])
  if (!uid) {
    throw new Error('Odoo authentication failed')
  }

  tokenCache = {
    uid: uid,
    db: config.db,
    checkedAt: now
  }
  return tokenCache
}

async function executeKw(model, method, args, kwargs) {
  var auth = await authenticate()
  var config = getConfig()
  return jsonrpc('object', 'execute_kw', [
    auth.db,
    auth.uid,
    config.password,
    model,
    method,
    args || [],
    kwargs || {}
  ])
}

async function getCompanyId() {
  var config = getConfig()
  var rows = await executeKw('res.company', 'search_read', [[['name', '=', config.companyName]]], {
    fields: ['id', 'name'],
    limit: 1
  })
  if (!rows || !rows.length) {
    throw new Error('Cannot find Odoo company ' + config.companyName)
  }
  return rows[0].id
}

function parseKiotMeta(noteValue) {
  if (!noteValue) {
    return {}
  }
  try {
    return JSON.parse(noteValue)
  } catch (e) {
    return {}
  }
}

async function mapProductsById(productIds) {
  if (!productIds.length) {
    return {}
  }
  var rows = await executeKw('product.product', 'search_read', [[['id', 'in', productIds]]], {
    fields: ['id', 'default_code', 'name', 'barcode'],
    limit: productIds.length
  })
  var result = {}
  rows.forEach(function (row) {
    result[row.id] = row
  })
  return result
}

async function mapPartnersById(partnerIds) {
  if (!partnerIds.length) {
    return {}
  }
  var rows = await executeKw('res.partner', 'search_read', [[['id', 'in', partnerIds]]], {
    fields: ['id', 'name', 'ref', 'x_kiotviet_1'],
    limit: partnerIds.length
  })
  var result = {}
  rows.forEach(function (row) {
    result[row.id] = row
  })
  return result
}

async function getAllCustomers() {
  var companyId = await getCompanyId()
  var allRows = []
  var offset = 0
  var limit = 500
  while (true) {
    var rows = await executeKw('res.partner', 'search_read', [[['company_id', 'in', [false, companyId]], ['customer_rank', '>', 0]]], {
      fields: ['id', 'name', 'ref', 'x_kiotviet_1', 'phone', 'mobile', 'street'],
      limit: limit,
      offset: offset,
      order: 'id desc'
    })
    if (!rows || !rows.length) {
      break
    }
    rows.forEach(function (row) {
      allRows.push({
        id: row.id,
        code: row.x_kiotviet_1 || row.ref || '',
        name: row.name || '',
        phone: row.phone || row.mobile || '',
        address: row.street || ''
      })
    })
    offset += rows.length
    if (rows.length < limit) {
      break
    }
  }
  return allRows
}

async function getInvoice(code) {
  var companyId = await getCompanyId()
  var orders = await executeKw('sale.order', 'search_read', [[['client_order_ref', '=', code], ['company_id', '=', companyId]]], {
    fields: ['id', 'name', 'client_order_ref', 'date_order', 'amount_total', 'note', 'partner_id', 'company_id'],
    limit: 1
  })
  if (!orders || !orders.length) {
    return {}
  }

  var order = orders[0]
  var meta = parseKiotMeta(order.note)
  var partnerId = order.partner_id && order.partner_id[0]
  var partnerMap = await mapPartnersById(partnerId ? [partnerId] : [])
  var partner = partnerMap[partnerId] || {}
  var lines = await executeKw('sale.order.line', 'search_read', [[['order_id', '=', order.id], ['product_uom_qty', '>', 0]]], {
    fields: ['id', 'name', 'product_id', 'product_uom_qty', 'price_unit', 'discount', 'price_subtotal'],
    limit: 500,
    order: 'id asc'
  })
  var productIds = lines
    .map(function (line) { return line.product_id && line.product_id[0] })
    .filter(Boolean)
  var productMap = await mapProductsById(productIds)

  return {
    id: order.id,
    code: order.client_order_ref,
    purchaseDate: order.date_order,
    customerCode: meta.kiot_customer_code || partner.x_kiotviet_1 || partner.ref || '',
    customerName: partner.name || (order.partner_id ? order.partner_id[1] : ''),
    total: order.amount_total || 0,
    status: meta.kiot_status || null,
    invoiceDetails: lines.map(function (line) {
      var productId = line.product_id && line.product_id[0]
      var product = productMap[productId] || {}
      var quantity = Number(line.product_uom_qty || 0)
      var price = Number(line.price_unit || 0)
      var discountPercent = Number(line.discount || 0)
      var discountValue = price * discountPercent / 100
      return {
        id: line.id,
        productId: productId || 0,
        productCode: product.default_code || '',
        productName: line.name || product.name || '',
        quantity: quantity,
        price: price,
        discount: discountValue,
        subTotal: Number(line.price_subtotal || 0),
        serialNumbers: '',
        invoiceDetailTaxs: [],
        returnQuantity: 0
      }
    })
  }
}

async function getAllInvoices() {
  var companyId = await getCompanyId()
  var allRows = []
  var offset = 0
  var limit = 500
  while (true) {
    var rows = await executeKw('sale.order', 'search_read', [[['company_id', '=', companyId], ['client_order_ref', '!=', false]]], {
      fields: ['id', 'client_order_ref', 'date_order', 'amount_total', 'note', 'partner_id'],
      limit: limit,
      offset: offset,
      order: 'date_order desc, id desc'
    })
    if (!rows || !rows.length) {
      break
    }
    var partnerIds = rows
      .map(function (row) { return row.partner_id && row.partner_id[0] })
      .filter(Boolean)
    var partnerMap = await mapPartnersById(partnerIds)
    rows.forEach(function (row) {
      var meta = parseKiotMeta(row.note)
      var partnerId = row.partner_id && row.partner_id[0]
      var partner = partnerMap[partnerId] || {}
      allRows.push({
        id: row.id,
        code: row.client_order_ref,
        purchaseDate: row.date_order,
        customerCode: meta.kiot_customer_code || partner.x_kiotviet_1 || partner.ref || '',
        customerName: partner.name || (row.partner_id ? row.partner_id[1] : ''),
        total: row.amount_total || 0,
        status: meta.kiot_status || null,
        invoiceDetails: []
      })
    })
    offset += rows.length
    if (rows.length < limit) {
      break
    }
  }
  return allRows
}

module.exports = {
  getInvoice: getInvoice,
  getAllInvoices: getAllInvoices,
  getAllCustomers: getAllCustomers
}
