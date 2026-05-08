const kiot = require('../../routes/adapter/kiot')

function parseProductCodes(req) {
  if (Array.isArray(req.body && req.body.productCodes)) {
    return req.body.productCodes.map(function (item) {
      return String(item || '').trim()
    }).filter(Boolean)
  }
  if (req.query && req.query.productCodes) {
    return String(req.query.productCodes)
      .split(',')
      .map(function (item) { return String(item || '').trim() })
      .filter(Boolean)
  }
  return []
}

function normalizeSupplier(item) {
  return {
    supplierCode: item && item.supplierCode ? item.supplierCode : '',
    supplierName: item && item.supplierName ? item.supplierName : '',
    supplierId: item && item.supplierId ? Number(item.supplierId || 0) : 0,
    lastPurchaseDate: item && item.lastPurchaseDate ? item.lastPurchaseDate : null,
    count: Number(item && item.count ? item.count : 0)
  }
}

function parseSupplierHintsFromText(text, suppliers) {
  var normalizedText = String(text || '').trim().toLowerCase()
  if (!normalizedText) {
    return []
  }
  return (Array.isArray(suppliers) ? suppliers : []).filter(function (supplier) {
    var code = String(supplier.code || '').trim().toLowerCase()
    var name = String(supplier.name || '').trim().toLowerCase()
    return (code && normalizedText.includes(code)) || (name && normalizedText.includes(name))
  }).map(function (supplier) {
    return {
      supplierCode: supplier.code || '',
      supplierName: supplier.name || '',
      supplierId: Number(supplier.id || 0),
      source: 'product_note'
    }
  })
}

function parseStructuredNcc(orderTemplate) {
  var text = String(orderTemplate || '')
  var lines = text.split(/\r?\n/)
  var result = {
    noteLines: [],
    structuredSuppliers: []
  }

  lines.forEach(function (line) {
    var trimmed = String(line || '').trim()
    if (!trimmed) {
      return
    }
    var matched = trimmed.match(/^#NCC-(\d+)\s*:\s*(.*)$/i)
    if (matched) {
      var payload = String(matched[2] || '').trim()
      var parts = payload.split('|').map(function (item) {
        return String(item || '').trim()
      }).filter(Boolean)
      result.structuredSuppliers.push({
        rank: Number(matched[1] || 0),
        supplierCode: parts[0] || '',
        supplierName: parts.length > 1 ? parts.slice(1).join(' | ') : '',
        raw: payload
      })
      return
    }
    result.noteLines.push(trimmed)
  })

  result.structuredSuppliers.sort(function (a, b) {
    return Number(a.rank || 0) - Number(b.rank || 0)
  })

  return result
}

exports.findByProducts = async (req, res) => {
  try {
    const productCodes = parseProductCodes(req)
    if (!productCodes.length) {
      return res.send({})
    }

    const [suppliers, purchaseOrders, products] = await Promise.all([
      kiot.getFullSupplier(),
      kiot.getFullPurchaseOrders(),
      Promise.all(productCodes.map(function (code) {
        return kiot.getProductByCodeWithInventory(code).catch(function () {
          return { code: code, description: '', orderTemplate: '' }
        })
      }))
    ])

    const supplierList = Array.isArray(suppliers) ? suppliers : []
    const productMap = new Map((products || []).map(function (product) {
      return [String(product.code || '').trim(), product]
    }))

    const result = {}
    productCodes.forEach(function (productCode) {
      var code = String(productCode || '').trim()
      var product = productMap.get(code) || {}
      var orderTemplate = product.orderTemplate || ''
      var productDescription = product.description || ''
      var parsedTemplate = parseStructuredNcc(orderTemplate)
      var noteText = orderTemplate || productDescription || ''
      var noteSuppliers = parsedTemplate.structuredSuppliers.length
        ? parsedTemplate.structuredSuppliers.map(function (item) {
            return {
              supplierCode: item.supplierCode || '',
              supplierName: item.supplierName || '',
              supplierId: 0,
              source: 'product_note'
            }
          })
        : parseSupplierHintsFromText(noteText, supplierList)
      var receiptMap = new Map()

      ;(Array.isArray(purchaseOrders) ? purchaseOrders : []).forEach(function (order) {
        if (!order || Number(order.status) !== 3) {
          return
        }
        var details = Array.isArray(order.purchaseOrderDetails) ? order.purchaseOrderDetails : []
        var matched = details.some(function (line) {
          return String(line.productCode || '').trim() === code
        })
        if (!matched || !order.supplierCode) {
          return
        }
        var existing = receiptMap.get(order.supplierCode) || {
          supplierCode: order.supplierCode || '',
          supplierName: order.supplierName || '',
          supplierId: Number(order.supplierId || 0),
          lastPurchaseDate: order.purchaseDate || order.createdDate || null,
          count: 0,
          source: 'purchase_history'
        }
        existing.count += 1
        var currentTime = new Date(existing.lastPurchaseDate || 0).getTime()
        var nextTime = new Date(order.purchaseDate || order.createdDate || 0).getTime()
        if (nextTime > currentTime) {
          existing.lastPurchaseDate = order.purchaseDate || order.createdDate || null
        }
        receiptMap.set(order.supplierCode, existing)
      })

      var recentSuppliers = Array.from(receiptMap.values())
        .sort(function (a, b) {
          var countDiff = Number(b.count || 0) - Number(a.count || 0)
          if (countDiff !== 0) {
            return countDiff
          }
          return new Date(b.lastPurchaseDate || 0).getTime() - new Date(a.lastPurchaseDate || 0).getTime()
        })
        .slice(0, 5)
        .map(normalizeSupplier)

      var recommendedMap = new Map()
      noteSuppliers.forEach(function (item, index) {
        recommendedMap.set(item.supplierCode, Object.assign({}, normalizeSupplier(item), {
          source: 'product_note',
          score: 100 - index
        }))
      })
      recentSuppliers.forEach(function (item, index) {
        var existing = recommendedMap.get(item.supplierCode)
        if (existing) {
          existing.score += 50
          existing.count = Math.max(Number(existing.count || 0), Number(item.count || 0))
          existing.lastPurchaseDate = item.lastPurchaseDate || existing.lastPurchaseDate
          recommendedMap.set(item.supplierCode, existing)
          return
        }
        recommendedMap.set(item.supplierCode, Object.assign({}, item, {
          source: 'purchase_history',
          score: 50 - index
        }))
      })

      result[code] = {
        productCode: code,
        productName: product.name || '',
        orderTemplate: orderTemplate,
        orderTemplateNote: parsedTemplate.noteLines.join('\n'),
        structuredSuppliers: parsedTemplate.structuredSuppliers,
        productDescription: product.description || '',
        noteSuppliers: noteSuppliers.map(normalizeSupplier),
        recentSuppliers: recentSuppliers,
        recommendedSuppliers: Array.from(recommendedMap.values())
          .sort(function (a, b) { return Number(b.score || 0) - Number(a.score || 0) })
          .map(function (item) {
            return {
              supplierCode: item.supplierCode || '',
              supplierName: item.supplierName || '',
              supplierId: Number(item.supplierId || 0),
              source: item.source || '',
              count: Number(item.count || 0),
              lastPurchaseDate: item.lastPurchaseDate || null
            }
          })
      }
    })

    res.send(result)
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot build supplier suggestions' })
  }
}
