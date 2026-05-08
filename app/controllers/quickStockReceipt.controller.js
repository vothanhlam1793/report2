const db = require('../models')

function normalizeQuickStockReceipt(item) {
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
        receivedQty: Number(item.receivedQty || 0),
        linkedQuickPurchaseRequestIds: Array.isArray(item.linkedQuickPurchaseRequestIds) ? item.linkedQuickPurchaseRequestIds : []
      }
    })
    .filter(function (item) {
      return item.productCode && item.receivedQty > 0
    })
}

function getCurrentUser(req) {
  return (req.session && req.session.user) || {
    name: 'System',
    username: 'system'
  }
}

async function syncLinkedPurchases(receipt) {
  const linkedIds = Array.isArray(receipt.linkedQuickPurchaseRequestIds) ? receipt.linkedQuickPurchaseRequestIds : []
  if (!linkedIds.length) {
    return
  }

  const allReceipts = await db.quickStockReceipts.find({
    linkedQuickPurchaseRequestIds: { $in: linkedIds },
    status: 'confirmed'
  }).lean()

  const purchases = await db.quickPurchaseRequests.find({ _id: { $in: linkedIds } })

  for (const purchase of purchases) {
    const confirmedReceipts = allReceipts.filter(function (receiptItem) {
      return Array.isArray(receiptItem.linkedQuickPurchaseRequestIds) && receiptItem.linkedQuickPurchaseRequestIds.includes(String(purchase._id))
    })

    const receivedByProduct = new Map()
    confirmedReceipts.forEach(function (receiptItem) {
      (receiptItem.items || []).forEach(function (line) {
        const key = line.productCode || ''
        receivedByProduct.set(key, (receivedByProduct.get(key) || 0) + Number(line.receivedQty || 0))
      })
    })

    const requestedTotal = (purchase.items || []).reduce(function (sum, line) {
      return sum + Number(line.requestedQty || 0)
    }, 0)
    const receivedTotal = (purchase.items || []).reduce(function (sum, line) {
      return sum + Math.min(Number(receivedByProduct.get(line.productCode) || 0), Number(line.requestedQty || 0))
    }, 0)

    let nextStatus = purchase.status || 'created'
    if (purchase.status !== 'cancelled') {
      if (receivedTotal >= requestedTotal && requestedTotal > 0) {
        nextStatus = 'received'
      } else if (receivedTotal > 0) {
        nextStatus = 'partially_received'
      } else if (purchase.status === 'received' || purchase.status === 'partially_received') {
        nextStatus = 'ordered'
      }
    }

    purchase.status = nextStatus
    await purchase.save()
  }
}

exports.findAll = async (req, res) => {
  try {
    const conditional = buildQuery(req.query || {})
    const data = await db.quickStockReceipts.find(conditional).sort({ updatedAt: -1, createdAt: -1 }).lean()
    res.send((data || []).map(normalizeQuickStockReceipt))
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot query quick stock receipts' })
  }
}

exports.findOne = async (req, res) => {
  try {
    const data = await db.quickStockReceipts.findById(req.params.id).lean()
    if (!data) {
      return res.status(404).send({ message: 'Quick stock receipt not found' })
    }
    res.send(normalizeQuickStockReceipt(data))
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot query quick stock receipt' })
  }
}

exports.getPrefill = async (req, res) => {
  try {
    const rawIds = String(req.query.quickPurchaseRequestIds || '').split(',').map(function (value) {
      return value.trim()
    }).filter(Boolean)

    if (!rawIds.length) {
      return res.status(400).send({ message: 'Thiếu quick purchase ids.' })
    }

    const purchases = await db.quickPurchaseRequests.find({ _id: { $in: rawIds } }).lean()
    if (!purchases.length) {
      return res.status(404).send({ message: 'Không tìm thấy phiếu đặt hàng nhanh để tham chiếu.' })
    }

    const referenceCode = purchases[0].referenceCode || ''
    const invoiceCode = purchases[0].invoiceCode || ''
    const invalidReference = purchases.some(function (item) {
      return item.referenceCode !== referenceCode
    })

    if (invalidReference) {
      return res.status(400).send({ message: 'Các phiếu đặt hàng nhanh phải cùng một referenceCode.' })
    }

    const mergedMap = new Map()
    purchases.forEach(function (purchase) {
      (purchase.items || []).forEach(function (item) {
        const key = item.productCode || ''
        if (!key) {
          return
        }
        const existing = mergedMap.get(key) || {
          productCode: item.productCode || '',
          productName: item.productName || '',
          requiredQty: 0,
          receivedQty: 0,
          linkedQuickPurchaseRequestIds: []
        }
        existing.requiredQty += Number(item.requestedQty || 0)
        existing.receivedQty = existing.requiredQty
        existing.linkedQuickPurchaseRequestIds = Array.from(new Set(existing.linkedQuickPurchaseRequestIds.concat([String(purchase._id)])))
        mergedMap.set(key, existing)
      })
    })

    res.send({
      referenceCode: referenceCode,
      invoiceCode: invoiceCode,
      summary: 'Tạo nhanh từ phiếu đặt hàng nhanh',
      linkedQuickPurchaseRequestIds: purchases.map(function (item) { return String(item._id) }),
      items: Array.from(mergedMap.values())
    })
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot build quick stock receipt prefill' })
  }
}

exports.create = async (req, res) => {
  try {
    const referenceCode = req.body.referenceCode || ''
    const invoiceCode = req.body.invoiceCode || ''
    const linkedQuickPurchaseRequestIds = Array.isArray(req.body.linkedQuickPurchaseRequestIds) ? req.body.linkedQuickPurchaseRequestIds : []
    const items = normalizeItems(req.body.items)

    if (!referenceCode || !invoiceCode) {
      return res.status(400).send({ message: 'Thiếu referenceCode hoặc invoiceCode.' })
    }
    if (!items.length) {
      return res.status(400).send({ message: 'Không có dòng hàng nhận.' })
    }

    if (linkedQuickPurchaseRequestIds.length) {
      const purchases = await db.quickPurchaseRequests.find({ _id: { $in: linkedQuickPurchaseRequestIds } }).lean()
      const requiredByProduct = new Map()
      purchases.forEach(function (purchase) {
        (purchase.items || []).forEach(function (item) {
          const key = item.productCode || ''
          requiredByProduct.set(key, (requiredByProduct.get(key) || 0) + Number(item.requestedQty || 0))
        })
      })

      for (const item of items) {
        const requiredQty = Number(requiredByProduct.get(item.productCode) || 0)
        const fromPurchase = Array.isArray(item.linkedQuickPurchaseRequestIds) && item.linkedQuickPurchaseRequestIds.length
        if (fromPurchase && item.receivedQty < requiredQty) {
          return res.status(400).send({ message: 'Sản phẩm ' + item.productCode + ' không được nhận ít hơn tổng số lượng từ Quick Purchase tham chiếu.' })
        }
      }
    }

    const user = getCurrentUser(req)
    const created = await db.quickStockReceipts.create({
      referenceCode: referenceCode,
      invoiceCode: invoiceCode,
      status: 'created',
      summary: req.body.summary || 'Tạo nhanh từ phiếu nhập hàng nhanh',
      createdByName: user.name,
      createdByUsername: user.username,
      linkedQuickPurchaseRequestIds: linkedQuickPurchaseRequestIds,
      items: items
    })

    res.send(normalizeQuickStockReceipt(created.toJSON()))
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot create quick stock receipt' })
  }
}

exports.update = async (req, res) => {
  try {
    const existing = await db.quickStockReceipts.findById(req.params.id)
    if (!existing) {
      return res.status(404).send({ message: 'Quick stock receipt not found' })
    }

    if (typeof req.body.summary === 'string') {
      existing.summary = req.body.summary
    }

    if (typeof req.body.status === 'string' && req.body.status) {
      existing.status = req.body.status
    }

    if (Array.isArray(req.body.linkedQuickPurchaseRequestIds)) {
      existing.linkedQuickPurchaseRequestIds = req.body.linkedQuickPurchaseRequestIds
    }

    if (Array.isArray(req.body.items)) {
      const items = normalizeItems(req.body.items)
      const linkedIds = Array.isArray(existing.linkedQuickPurchaseRequestIds) ? existing.linkedQuickPurchaseRequestIds : []
      if (linkedIds.length) {
        const purchases = await db.quickPurchaseRequests.find({ _id: { $in: linkedIds } }).lean()
        const requiredByProduct = new Map()
        purchases.forEach(function (purchase) {
          (purchase.items || []).forEach(function (item) {
            const key = item.productCode || ''
            requiredByProduct.set(key, (requiredByProduct.get(key) || 0) + Number(item.requestedQty || 0))
          })
        })

        for (const item of items) {
          const requiredQty = Number(requiredByProduct.get(item.productCode) || 0)
          const fromPurchase = Array.isArray(item.linkedQuickPurchaseRequestIds) && item.linkedQuickPurchaseRequestIds.length
          if (fromPurchase && item.receivedQty < requiredQty) {
            return res.status(400).send({ message: 'Sản phẩm ' + item.productCode + ' không được nhận ít hơn tổng số lượng từ Quick Purchase tham chiếu.' })
          }
        }
      }
      existing.items = items
    }

    await existing.save()
    if (existing.status === 'confirmed') {
      await syncLinkedPurchases(existing)
    }
    res.send(normalizeQuickStockReceipt(existing.toJSON ? existing.toJSON() : existing))
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot update quick stock receipt' })
  }
}
