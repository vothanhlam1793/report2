const db = require('../models')
const odoo = require('../../routes/adapter/odoo')
const kiot = require('../../routes/adapter/kiot')
const { getReferenceCode, compareInvoiceLines, sortInvoicesByVersion, getLatestInvoice, compareInvoiceCodeVersions } = require('../lib/invoiceReference')
const { ProductKiot } = require('../models/kiot.model')
const { logInvoiceEvent } = require('../lib/invoiceEventLogger')

function isRecentInvoice(invoice) {
  if (!invoice || !invoice.purchaseDate) {
    return false
  }
  return new Date(invoice.purchaseDate).getTime() >= (Date.now() - 30 * 24 * 60 * 60 * 1000)
}

function getCurrentUser(req) {
  const user = req.session && req.session.user ? req.session.user : {}
  return {
    name: user.name || '',
    username: user.username || '',
    role: user.role || 'viewer'
  }
}

function mapQuickReceiptQty(productCode, receipts) {
  return (receipts || []).reduce(function (sum, receipt) {
    if (receipt.status === 'cancelled') {
      return sum
    }
    var matchedItem = (receipt.items || []).find(function (item) {
      return item.productCode === productCode
    })
    return sum + Number(matchedItem ? matchedItem.receivedQty : 0)
  }, 0)
}

function createSummaryForLines(lines) {
  var shortageLines = (lines || []).filter(function (line) {
    return !line.isEnough
  })

  if (!shortageLines.length) {
    return 'Đủ hàng để chuyển sang B4'
  }

  return 'Thiếu ' + shortageLines.length + ' mã sản phẩm, cần Sale quyết định hoặc nhập thêm hàng.'
}

function createDraftSummary() {
  return 'Phiếu kiểm tra kho đã được tạo, chờ nhân sự bắt đầu kiểm tra.'
}

async function syncInvoiceReferenceState(req, options) {
  const referenceCode = options.referenceCode
  const activeInvoiceCode = options.activeInvoiceCode
  const latestWarehouseCheckId = options.latestWarehouseCheckId || ''
  const relatedInvoiceCodes = Array.isArray(options.relatedInvoiceCodes) ? options.relatedInvoiceCodes : []
  const fallbackStatus = options.fallbackStatus || 'B1'
  const changeWarningLevel = options.changeWarningLevel || ''
  const changeWarningSummary = options.changeWarningSummary || ''

  const existing = await db.invoices.findOne({ referenceCode: referenceCode }).sort({ updatedAt: -1 }).lean()
  const previousActiveInvoiceCode = existing && existing.activeInvoiceCode ? existing.activeInvoiceCode : (existing && existing.code ? existing.code : '')
  const nextStatus = existing && existing.status ? existing.status : fallbackStatus

  await db.invoices.findOneAndUpdate(
    { referenceCode: referenceCode },
    {
      code: activeInvoiceCode,
      referenceCode: referenceCode,
      status: nextStatus,
      activeInvoiceCode: activeInvoiceCode,
      latestWarehouseCheckId: latestWarehouseCheckId || (existing && existing.latestWarehouseCheckId) || '',
      relatedInvoiceCodes: relatedInvoiceCodes,
      changeWarningLevel: changeWarningLevel,
      changeWarningSummary: changeWarningSummary
    },
    { upsert: true, new: true, sort: { updatedAt: -1 } }
  )

  if (previousActiveInvoiceCode && previousActiveInvoiceCode !== activeInvoiceCode && compareInvoiceCodeVersions(previousActiveInvoiceCode, activeInvoiceCode) < 0) {
    await logInvoiceEvent(db, req, {
      referenceCode: referenceCode,
      invoiceCode: activeInvoiceCode,
      eventType: 'source_invoice_changed',
      fromStatus: nextStatus,
      toStatus: nextStatus,
      summary: 'Invoice reference chuyển sang version nguồn mới hơn ' + activeInvoiceCode,
      payload: {
        previousInvoiceCode: previousActiveInvoiceCode,
        newInvoiceCode: activeInvoiceCode,
        reason: 'newer_invoice_version_detected'
      }
    })
  }
}

function getInvoiceSnapshot(invoice) {
  return {
    customerCode: invoice.customerCode || '',
    customerName: invoice.customerName || '',
    purchaseDate: invoice.purchaseDate || null,
    total: Number(invoice.total || 0)
  }
}

function shouldUseDynamicLines(warehouseCheck) {
  return !warehouseCheck || warehouseCheck.status !== 'completed'
}

function extractKiotInventory(product) {
  if (!product || typeof product !== 'object') {
    return { qty: 0, branchId: null, branchName: '' }
  }

  var branchIds = kiot.getConfiguredBranchIds()

  var directQty = [product.onHand, product.baseOnHand, product.stock, product.inventory, product.onHandQty]
    .map(function (value) { return Number(value) })
    .find(function (value) { return Number.isFinite(value) })

  if (Number.isFinite(directQty)) {
    return {
      qty: directQty,
      branchId: branchIds[0] || null,
      branchName: ''
    }
  }

  var inventoryEntries = []
  if (Array.isArray(product.inventories)) {
    inventoryEntries = inventoryEntries.concat(product.inventories)
  }
  if (Array.isArray(product.branchInventories)) {
    inventoryEntries = inventoryEntries.concat(product.branchInventories)
  }

  if (inventoryEntries.length) {
    var scopedEntries = inventoryEntries.filter(function (item) {
      var branchId = Number(item.branchId || item.branchID || 0)
      return !branchIds.length || branchIds.includes(branchId)
    })
    var entries = scopedEntries.length ? scopedEntries : inventoryEntries
    return entries.reduce(function (result, item) {
      var qty = Number(
        item.onHand ||
        item.onHandQty ||
        item.quantity ||
        item.baseOnHand ||
        item.reservedOrAvailable ||
        0
      )
      var branchId = Number(item.branchId || item.branchID || 0)
      if (!result.branchId && Number.isFinite(branchId) && branchId > 0) {
        result.branchId = branchId
        result.branchName = item.branchName || item.name || ''
      }
      result.qty += Number.isFinite(qty) ? qty : 0
      return result
    }, { qty: 0, branchId: null, branchName: '' })
  }

  return { qty: 0, branchId: branchIds[0] || null, branchName: '' }
}

async function createDraftWarehouseCheck({ invoice, relatedInvoices, req }) {
  const referenceCode = getReferenceCode(invoice.code)
  const user = getCurrentUser(req)
  const created = await db.warehouseChecks.create({
    referenceCode: referenceCode,
    invoiceCode: invoice.code,
    sourceInvoiceCode: invoice.code,
    status: 'draft',
    decisionStatus: 'pending_stock_review',
    createdByName: user.name,
    createdByUsername: user.username,
    summary: createDraftSummary(),
    relatedInvoiceCodes: (relatedInvoices || []).map(function (item) { return item.code }),
    lines: [],
    invoiceSnapshot: getInvoiceSnapshot(invoice)
  })

  await logInvoiceEvent(db, req, {
    referenceCode: referenceCode,
    invoiceCode: invoice.code,
    eventType: 'warehouse_check_created',
    fromStatus: 'B1',
    toStatus: 'B1',
    summary: 'Tạo phiếu kiểm tra kho ở trạng thái draft',
    payload: {
      relatedInvoiceCodes: (relatedInvoices || []).map(function (item) { return item.code })
    }
  })

  await syncInvoiceReferenceState(req, {
    referenceCode: referenceCode,
    activeInvoiceCode: invoice.code,
    latestWarehouseCheckId: String(created._id),
    relatedInvoiceCodes: (relatedInvoices || []).map(function (item) { return item.code }),
    fallbackStatus: 'B1',
    changeWarningLevel: '',
    changeWarningSummary: ''
  })

  return created
}

function pickActiveWarehouseCheck(checks) {
  var items = Array.isArray(checks) ? checks.slice() : []
  if (!items.length) {
    return null
  }
  items.sort(function (a, b) {
    var aCompleted = a.status === 'completed' ? 1 : 0
    var bCompleted = b.status === 'completed' ? 1 : 0
    if (aCompleted !== bCompleted) {
      return bCompleted - aCompleted
    }
    return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
  })
  return items[0]
}

async function findActiveWarehouseCheckByReference(referenceCode, lean) {
  const query = db.warehouseChecks.find({ referenceCode: referenceCode }).sort({ updatedAt: -1, createdAt: -1 })
  const rows = lean ? await query.lean() : await query
  return pickActiveWarehouseCheck(rows)
}

async function ensureDraftWarehouseChecks(req) {
  const [allInvoices, invoiceStates, existingChecks] = await Promise.all([
    odoo.getAllInvoices(),
    db.invoices.find({}).lean(),
    db.warehouseChecks.find({}).lean()
  ])

  const stateMap = new Map((invoiceStates || []).map(function (item) {
    return [item.code, item]
  }))

  const existingByReference = new Set((existingChecks || []).map(function (item) {
    return item.referenceCode
  }))

  const familyMap = new Map()
  ;(allInvoices || []).forEach(function (invoice) {
    const referenceCode = getReferenceCode(invoice.code)
    if (!familyMap.has(referenceCode)) {
      familyMap.set(referenceCode, [])
    }
    familyMap.get(referenceCode).push(invoice)
  })

  const created = []
  for (const invoice of (allInvoices || [])) {
    const localState = stateMap.get(invoice.code)
    const status = localState && localState.status ? localState.status : 'B1'
    if (status !== 'B1') {
      continue
    }
    if (!isRecentInvoice(invoice)) {
      continue
    }
    const referenceCode = getReferenceCode(invoice.code)
    if (existingByReference.has(referenceCode)) {
      continue
    }
    const relatedInvoices = sortInvoicesByVersion(familyMap.get(referenceCode) || [])
    const draft = await createDraftWarehouseCheck({ invoice: invoice, relatedInvoices: relatedInvoices, req: req })
    created.push(draft.toJSON())
    existingByReference.add(referenceCode)
  }

  return created
}

async function buildLines(invoiceCode) {
  const invoice = await odoo.getInvoice(invoiceCode)
  const referenceCode = getReferenceCode(invoiceCode)
  const receipts = await db.quickStockReceipts.find({ referenceCode: referenceCode }).lean()
  var inventoryBranch = { branchId: null, branchName: '' }

  const lines = await Promise.all((invoice.invoiceDetails || []).map(async function (line) {
    let kiotStockQty = 0
    try {
      const product = await new ProductKiot(line.productCode).fetch()
      const inventory = extractKiotInventory(product)
      kiotStockQty = inventory.qty
      if (!inventoryBranch.branchId && inventory.branchId) {
        inventoryBranch = {
          branchId: inventory.branchId,
          branchName: inventory.branchName || ''
        }
      }
    } catch (e) {
      kiotStockQty = 0
    }

    const quickReceiptQty = mapQuickReceiptQty(line.productCode, receipts)
    const requiredQty = Number(line.quantity || 0)
    const availableQty = kiotStockQty + quickReceiptQty

    return {
      productCode: line.productCode,
      productName: line.productName,
      requiredQty: requiredQty,
      kiotStockQty: kiotStockQty,
      quickReceiptQty: quickReceiptQty,
      availableQty: availableQty,
      isEnough: availableQty >= requiredQty,
      note: ''
    }
  }))

  return {
    invoice: invoice,
    lines: lines,
    quickReceipts: receipts,
    inventoryBranch: inventoryBranch
  }
}

function resolveOperationalInvoiceCode(sortedRelated, warehouseCheck, requestedInvoiceCode) {
  if (warehouseCheck && warehouseCheck.sourceInvoiceCode) {
    return warehouseCheck.sourceInvoiceCode
  }
  var latestInvoice = getLatestInvoice(sortedRelated)
  if (latestInvoice) {
    return latestInvoice.code
  }
  return requestedInvoiceCode
}

async function buildVersionWarning(invoiceCode, currentInvoice, relatedInvoices) {
  var sortedRelated = sortInvoicesByVersion(relatedInvoices || [])

  if (sortedRelated.length <= 1) {
    return null
  }

  var currentIndex = sortedRelated.findIndex(function (invoice) {
    return invoice.code === invoiceCode
  })

  if (currentIndex === -1) {
    return null
  }

  var compareTargetCode = ''
  var summary = ''
  var currentInvoiceCode = currentInvoice.code

  if (currentIndex < sortedRelated.length - 1) {
    compareTargetCode = sortedRelated[currentIndex + 1].code
    summary = 'Đơn hiện tại đã có version mới hơn, cần rà soát thay đổi với bản kế tiếp.'
    currentInvoiceCode = compareTargetCode
  } else if (currentIndex > 0) {
    compareTargetCode = sortedRelated[currentIndex - 1].code
    summary = 'Đơn đã thay đổi sản phẩm hoặc số lượng so với version trước, cần rà soát lại.'
  }

  if (!compareTargetCode) {
    return null
  }

  var compareInvoice = await odoo.getInvoice(compareTargetCode)
  if (!compareInvoice || !Array.isArray(compareInvoice.invoiceDetails)) {
    return null
  }

  var previousInvoice = currentIndex < sortedRelated.length - 1 ? currentInvoice : compareInvoice
  var nextInvoice = currentIndex < sortedRelated.length - 1 ? compareInvoice : currentInvoice
  var diff = compareInvoiceLines(previousInvoice, nextInvoice)

  if (!diff.hasChanges) {
    return null
  }

  return {
    level: diff.hasQuantityImpact ? 'warning' : 'info',
    summary: summary,
    changes: diff.changes,
    previousInvoiceCode: previousInvoice.code,
    currentInvoiceCode: nextInvoice.code
  }
}

exports.findAll = async (req, res) => {
  try {
    if (String(req.query.ensureDrafts || '') === '1') {
      await ensureDraftWarehouseChecks(req)
    }
    const conditional = req.query || {}
    delete conditional.ensureDrafts
    const data = await db.warehouseChecks.find(conditional).sort({ updatedAt: -1 }).lean()
    res.send(data)
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot query warehouse checks' })
  }
}

exports.getShortageQueue = async (req, res) => {
  try {
    const data = await db.warehouseChecks.find({
      stockConclusion: 'shortage',
      decisionStatus: { $in: ['pending_sale_decision', 'purchase_selected'] }
    }).sort({ updatedAt: -1 }).lean()
    res.send(data)
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot query shortage queue' })
  }
}

exports.getByInvoiceCode = async (req, res) => {
  try {
    const invoiceCode = req.params.code
    const referenceCode = getReferenceCode(invoiceCode)
    const [requestedInvoice, familyInvoices, warehouseChecks] = await Promise.all([
      odoo.getInvoice(invoiceCode),
      odoo.getAllInvoices(),
      db.warehouseChecks.find({ referenceCode: referenceCode }).sort({ updatedAt: -1, createdAt: -1 }).lean()
    ])

    const relatedInvoices = (familyInvoices || []).filter(function (invoice) {
      return getReferenceCode(invoice.code) === referenceCode
    })

    const sortedRelated = sortInvoicesByVersion(relatedInvoices)

    const warehouseCheck = pickActiveWarehouseCheck(warehouseChecks)
    const operationalInvoiceCode = resolveOperationalInvoiceCode(sortedRelated, warehouseCheck, invoiceCode)
    const currentInvoice = operationalInvoiceCode === invoiceCode
      ? requestedInvoice
      : await odoo.getInvoice(operationalInvoiceCode)
    const latestWarning = await buildVersionWarning(invoiceCode, requestedInvoice, sortedRelated)

    await syncInvoiceReferenceState(req, {
      referenceCode: referenceCode,
      activeInvoiceCode: currentInvoice.code,
      latestWarehouseCheckId: warehouseCheck ? String(warehouseCheck._id || warehouseCheck.id || '') : '',
      relatedInvoiceCodes: sortedRelated.map(function (invoice) { return invoice.code }),
      fallbackStatus: 'B1',
      changeWarningLevel: latestWarning ? latestWarning.level : '',
      changeWarningSummary: latestWarning ? latestWarning.summary : ''
    })

    if (warehouseCheck) {
      let responseWarehouseCheck = Object.assign({}, warehouseCheck)
      if (shouldUseDynamicLines(warehouseCheck)) {
        const built = await buildLines(operationalInvoiceCode)
        responseWarehouseCheck.lines = built.lines
        responseWarehouseCheck.invoiceSnapshot = getInvoiceSnapshot(built.invoice)
        responseWarehouseCheck.summary = createSummaryForLines(built.lines)
        responseWarehouseCheck.inventoryBranch = built.inventoryBranch
        responseWarehouseCheck.invoiceCode = operationalInvoiceCode
        responseWarehouseCheck.sourceInvoiceCode = operationalInvoiceCode
        if (String(warehouseCheck.invoiceCode || '') !== operationalInvoiceCode || String(warehouseCheck.sourceInvoiceCode || '') !== operationalInvoiceCode) {
          await db.warehouseChecks.findByIdAndUpdate(responseWarehouseCheck.id || responseWarehouseCheck._id, {
            invoiceCode: operationalInvoiceCode,
            sourceInvoiceCode: operationalInvoiceCode,
            relatedInvoiceCodes: sortedRelated.map(function (invoice) { return invoice.code })
          })
        }
      } else if (!responseWarehouseCheck.invoiceSnapshot) {
        responseWarehouseCheck.invoiceSnapshot = getInvoiceSnapshot(currentInvoice)
      }

      const [quickPurchaseRequests, quickStockReceipts] = await Promise.all([
        db.quickPurchaseRequests.find({ referenceCode: referenceCode }).lean(),
        db.quickStockReceipts.find({ referenceCode: referenceCode }).lean()
      ])
      return res.send({
        warehouseCheck: responseWarehouseCheck,
        currentInvoice: currentInvoice,
        latestWarning: latestWarning,
        relatedInvoices: sortedRelated.map(function (invoice) { return invoice.code }),
        quickPurchaseRequests: quickPurchaseRequests,
        quickStockReceipts: quickStockReceipts
      })
    }

    const created = await createDraftWarehouseCheck({
      invoice: currentInvoice,
      relatedInvoices: sortedRelated,
      req: req
    })
    const built = await buildLines(currentInvoice.code)

    res.send({
      warehouseCheck: Object.assign({}, created.toJSON(), {
        lines: built.lines,
        invoiceSnapshot: getInvoiceSnapshot(built.invoice),
        summary: createSummaryForLines(built.lines),
        inventoryBranch: built.inventoryBranch
      }),
      currentInvoice: built.invoice,
      latestWarning: latestWarning,
      relatedInvoices: sortedRelated.map(function (invoice) { return invoice.code }),
      quickPurchaseRequests: [],
      quickStockReceipts: []
    })
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot get warehouse check by invoice code' })
  }
}

exports.refreshByInvoiceCode = async (req, res) => {
  try {
    const invoiceCode = req.params.code
    const referenceCode = getReferenceCode(invoiceCode)
    const existing = await findActiveWarehouseCheckByReference(referenceCode, false)
    if (!existing) {
      return res.status(404).send({ message: 'Warehouse check not found' })
    }

    const built = await buildLines(invoiceCode)
    if (existing.status === 'draft') {
      existing.status = 'checking'
    }
    existing.invoiceCode = invoiceCode
    existing.sourceInvoiceCode = invoiceCode
    existing.checkedAt = new Date()
    existing.summary = createSummaryForLines(built.lines)
    existing.invoiceSnapshot = getInvoiceSnapshot(built.invoice)
    await existing.save()

    await syncInvoiceReferenceState(req, {
      referenceCode: referenceCode,
      activeInvoiceCode: invoiceCode,
      latestWarehouseCheckId: String(existing._id),
      relatedInvoiceCodes: existing.relatedInvoiceCodes || [referenceCode],
      fallbackStatus: 'B1',
      changeWarningLevel: '',
      changeWarningSummary: ''
    })

    await logInvoiceEvent(db, req, {
      referenceCode: existing.referenceCode,
      invoiceCode: invoiceCode,
      eventType: 'warehouse_check_refreshed',
      summary: 'Làm mới phiếu kiểm tra kho',
      payload: {
        shortageCount: built.lines.filter(function (line) { return !line.isEnough }).length
      }
    })

    res.send(Object.assign({}, existing.toJSON(), {
      lines: built.lines,
      summary: createSummaryForLines(built.lines),
      invoiceSnapshot: getInvoiceSnapshot(built.invoice),
      inventoryBranch: built.inventoryBranch
    }))
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot refresh warehouse check' })
  }
}

exports.confirmEnough = async (req, res) => {
  try {
    const invoiceCode = req.params.code
    const referenceCode = getReferenceCode(invoiceCode)
    const warehouseCheck = await findActiveWarehouseCheckByReference(referenceCode, false)
    if (!warehouseCheck) {
      return res.status(404).send({ message: 'Warehouse check not found' })
    }

    const built = await buildLines(invoiceCode)
    const existingInvoiceState = await db.invoices.findOne({ code: invoiceCode }).lean()
    const previousStatus = existingInvoiceState && existingInvoiceState.status ? existingInvoiceState.status : 'B1'
    warehouseCheck.lines = built.lines
    warehouseCheck.stockConclusion = built.lines.every(function (line) { return line.isEnough }) ? 'enough' : 'shortage'
    warehouseCheck.status = 'completed'
    warehouseCheck.decisionStatus = warehouseCheck.stockConclusion === 'enough' ? 'done' : 'pending_sale_decision'
    warehouseCheck.summary = createSummaryForLines(built.lines)
    warehouseCheck.invoiceSnapshot = getInvoiceSnapshot(built.invoice)
    warehouseCheck.invoiceCode = invoiceCode
    warehouseCheck.sourceInvoiceCode = invoiceCode

    const user = getCurrentUser(req)
    warehouseCheck.confirmedByName = user.name
    warehouseCheck.confirmedByUsername = user.username
    warehouseCheck.confirmedAt = new Date()
    await warehouseCheck.save()

    await logInvoiceEvent(db, req, {
      referenceCode: warehouseCheck.referenceCode,
      invoiceCode: invoiceCode,
      eventType: 'warehouse_check_completed',
      fromStatus: previousStatus,
      toStatus: 'B2',
      summary: warehouseCheck.stockConclusion === 'enough'
        ? 'Hoàn tất phiếu kiểm tra kho, kết luận đủ hàng'
        : 'Hoàn tất phiếu kiểm tra kho, kết luận thiếu hàng',
      payload: {
        shortageCount: built.lines.filter(function (line) { return !line.isEnough }).length
      }
    })

    await db.invoices.findOneAndUpdate(
      { code: invoiceCode },
      {
        code: invoiceCode,
        referenceCode: getReferenceCode(invoiceCode),
        status: 'B2',
        activeInvoiceCode: invoiceCode,
        latestWarehouseCheckId: String(warehouseCheck._id),
        changeWarningLevel: '',
        changeWarningSummary: warehouseCheck.stockConclusion === 'enough'
          ? 'Kho đã hoàn tất kiểm tra, đơn chờ bước xử lý tiếp theo.'
          : 'Kho đã hoàn tất kiểm tra, kết luận thiếu hàng và chờ bước xử lý tiếp theo.'
      },
      { upsert: true, new: true }
    )

    res.send(warehouseCheck.toJSON())
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot confirm warehouse check' })
  }
}

exports.submitShortageDecision = async (req, res) => {
  try {
    const invoiceCode = req.params.code
    const referenceCode = getReferenceCode(invoiceCode)
    const saleDecision = req.body.saleDecision || ''
    const summary = req.body.summary || ''
    const replacementInvoiceCode = req.body.replacementInvoiceCode || ''

    const warehouseCheck = await findActiveWarehouseCheckByReference(referenceCode, false)
    if (!warehouseCheck) {
      return res.status(404).send({ message: 'Warehouse check not found' })
    }

    const user = getCurrentUser(req)
    warehouseCheck.stockConclusion = 'shortage'
    warehouseCheck.status = 'completed'
    warehouseCheck.saleDecision = saleDecision
    warehouseCheck.summary = summary
    warehouseCheck.reviewedByName = user.name
    warehouseCheck.reviewedByUsername = user.username
    warehouseCheck.checkedAt = new Date()
    warehouseCheck.invoiceCode = invoiceCode
    warehouseCheck.sourceInvoiceCode = invoiceCode

    if (saleDecision === 'change_order') {
      warehouseCheck.decisionStatus = 'change_order_requested'
      if (replacementInvoiceCode) {
        warehouseCheck.relatedInvoiceCodes = Array.from(new Set((warehouseCheck.relatedInvoiceCodes || []).concat([replacementInvoiceCode])))
      }
      await db.invoices.findOneAndUpdate(
        { code: invoiceCode },
        {
          code: invoiceCode,
          referenceCode: getReferenceCode(invoiceCode),
          status: 'B3',
          activeInvoiceCode: invoiceCode,
          changeWarningLevel: 'warning',
          changeWarningSummary: summary
            ? 'Kho yêu cầu Sale đổi đơn: ' + summary
            : 'Kho yêu cầu Sale đổi đơn.',
          relatedInvoiceCodes: warehouseCheck.relatedInvoiceCodes
        },
        { upsert: true, new: true }
      )

      await logInvoiceEvent(db, req, {
        referenceCode: warehouseCheck.referenceCode,
        invoiceCode: invoiceCode,
        eventType: 'sale_change_requested',
        fromStatus: 'B2',
        toStatus: 'B3',
        summary: summary
          ? 'Kho yêu cầu Sale đổi đơn: ' + summary
          : 'Kho yêu cầu Sale đổi đơn',
        payload: {
          reason: summary,
          replacementInvoiceCode: replacementInvoiceCode,
          relatedInvoiceCodes: warehouseCheck.relatedInvoiceCodes || []
        }
      })
    } else {
      warehouseCheck.decisionStatus = 'purchase_selected'
      await db.invoices.findOneAndUpdate(
        { code: invoiceCode },
        {
          code: invoiceCode,
          referenceCode: getReferenceCode(invoiceCode),
          status: 'B3',
          activeInvoiceCode: invoiceCode,
          changeWarningLevel: 'warning',
          changeWarningSummary: 'Đơn đang chờ đủ hàng theo quyết định đặt hàng thêm.'
        },
        { upsert: true, new: true }
      )

      await logInvoiceEvent(db, req, {
        referenceCode: warehouseCheck.referenceCode,
        invoiceCode: invoiceCode,
        eventType: 'sale_decision_purchase_more',
        fromStatus: 'B2',
        toStatus: 'B3',
        summary: 'Sale chọn hướng đặt hàng thêm cho đơn thiếu hàng',
        payload: {
          summary: summary
        }
      })
    }

    await warehouseCheck.save()
    res.send(warehouseCheck.toJSON())
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot submit shortage decision' })
  }
}

exports.createQuickPurchaseRequest = async (req, res) => {
  try {
    const invoiceCode = req.params.code
    const referenceCode = getReferenceCode(invoiceCode)
    const warehouseCheck = await findActiveWarehouseCheckByReference(referenceCode, true)
    if (!warehouseCheck) {
      return res.status(404).send({ message: 'Warehouse check not found' })
    }

    const sourceLines = (warehouseCheck.lines && warehouseCheck.lines.length)
      ? warehouseCheck.lines
      : (await buildLines(invoiceCode)).lines

    const requestItems = Array.isArray(req.body.items) ? req.body.items : []
    const defaultItems = (sourceLines || []).map(function (line) {
      return {
        productCode: line.productCode,
        productName: line.productName,
        requiredQty: Number(line.requiredQty || 0),
        requestedQty: line.isEnough ? 0 : Math.max(Number(line.requiredQty || 0) - Number(line.availableQty || 0), 0)
      }
    })

    const items = (requestItems.length ? requestItems : defaultItems)
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

    if (!items.length) {
      return res.status(400).send({ message: 'Không có dòng hàng cần đặt.' })
    }

    const user = getCurrentUser(req)
    const created = await db.quickPurchaseRequests.create({
      referenceCode: referenceCode,
      invoiceCode: invoiceCode,
      status: 'created',
      summary: req.body.summary || 'Đặt hàng nhanh cho đơn thiếu hàng',
      createdByName: user.name,
      createdByUsername: user.username,
      items: items
    })

    warehouseCheck.decisionStatus = 'purchase_selected'
    warehouseCheck.saleDecision = 'purchase_more'
    if (!warehouseCheck.summary || warehouseCheck.summary === createSummaryForLines(warehouseCheck.lines || [])) {
      warehouseCheck.summary = 'Kho chọn hướng đặt hàng thêm qua phiếu đặt hàng nhanh.'
    }
    await db.warehouseChecks.findByIdAndUpdate(warehouseCheck._id || warehouseCheck.id, {
      decisionStatus: warehouseCheck.decisionStatus,
      saleDecision: warehouseCheck.saleDecision,
      summary: warehouseCheck.summary,
      invoiceCode: invoiceCode,
      sourceInvoiceCode: invoiceCode
    })

    await db.invoices.findOneAndUpdate(
      { code: invoiceCode },
      {
        code: invoiceCode,
        referenceCode: referenceCode,
        status: 'B3',
        activeInvoiceCode: invoiceCode,
        changeWarningLevel: 'warning',
        changeWarningSummary: 'Đơn đang chờ đủ hàng theo phiếu đặt hàng nhanh.'
      },
      { upsert: true, new: true }
    )

    await logInvoiceEvent(db, req, {
      referenceCode: referenceCode,
      invoiceCode: invoiceCode,
      eventType: 'quick_purchase_created',
      fromStatus: 'B2',
      toStatus: 'B3',
      summary: 'Tạo phiếu đặt hàng nhanh',
      payload: {
        quickPurchaseRequestId: String(created._id),
        itemCount: items.length
      }
    })

    res.send(created.toJSON())
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot create quick purchase request' })
  }
}

exports.createQuickStockReceipt = async (req, res) => {
  try {
    const invoiceCode = req.params.code
    const referenceCode = getReferenceCode(invoiceCode)
    const items = Array.isArray(req.body.items) ? req.body.items : []
    const user = getCurrentUser(req)

    const created = await db.quickStockReceipts.create({
      referenceCode: referenceCode,
      invoiceCode: invoiceCode,
      summary: req.body.summary || 'Nhập hàng nhanh cho đơn',
      createdByName: user.name,
      createdByUsername: user.username,
      items: items.map(function (item) {
        return {
          productCode: item.productCode,
          productName: item.productName,
          receivedQty: Number(item.receivedQty || 0)
        }
      })
    })

    await logInvoiceEvent(db, req, {
      referenceCode: referenceCode,
      invoiceCode: invoiceCode,
      eventType: 'quick_stock_receipt_created',
      fromStatus: 'B3',
      toStatus: 'B3',
      summary: 'Tạo phiếu nhập hàng nhanh',
      payload: {
        quickStockReceiptId: String(created._id),
        itemCount: items.length
      }
    })

    res.send(created.toJSON())
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot create quick stock receipt' })
  }
}
