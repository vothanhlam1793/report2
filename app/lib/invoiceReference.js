function getReferenceCode(invoiceCode) {
  var value = String(invoiceCode || '').trim()
  if (!value) {
    return ''
  }
  return value.split('.')[0]
}

function parseInvoiceVersion(invoiceCode) {
  var value = String(invoiceCode || '').trim()
  if (!value) {
    return {
      referenceCode: '',
      suffix: 0,
      rawSuffix: ''
    }
  }

  var parts = value.split('.')
  var referenceCode = parts[0]
  var rawSuffix = parts.length > 1 ? parts.slice(1).join('.') : ''
  var suffix = 0
  if (rawSuffix) {
    var parsed = Number(rawSuffix)
    suffix = Number.isFinite(parsed) ? parsed : 0
  }

  return {
    referenceCode: referenceCode,
    suffix: suffix,
    rawSuffix: rawSuffix
  }
}

function compareInvoiceCodeVersions(a, b) {
  var parsedA = parseInvoiceVersion(a)
  var parsedB = parseInvoiceVersion(b)

  if (parsedA.referenceCode !== parsedB.referenceCode) {
    return parsedA.referenceCode.localeCompare(parsedB.referenceCode)
  }

  if (parsedA.suffix !== parsedB.suffix) {
    return parsedA.suffix - parsedB.suffix
  }

  return String(a || '').localeCompare(String(b || ''))
}

function sortInvoicesByVersion(invoices) {
  return (Array.isArray(invoices) ? invoices.slice() : []).sort(function (a, b) {
    return compareInvoiceCodeVersions(a && a.code, b && b.code)
  })
}

function getLatestInvoice(invoices) {
  var sorted = sortInvoicesByVersion(invoices)
  return sorted.length ? sorted[sorted.length - 1] : null
}

function compareInvoiceLines(previousInvoice, currentInvoice) {
  var previousDetails = Array.isArray(previousInvoice && previousInvoice.invoiceDetails)
    ? previousInvoice.invoiceDetails
    : []
  var currentDetails = Array.isArray(currentInvoice && currentInvoice.invoiceDetails)
    ? currentInvoice.invoiceDetails
    : []

  var previousMap = {}
  previousDetails.forEach(function (line) {
    previousMap[line.productCode] = {
      quantity: Number(line.quantity || 0),
      productName: line.productName || ''
    }
  })

  var currentMap = {}
  currentDetails.forEach(function (line) {
    currentMap[line.productCode] = {
      quantity: Number(line.quantity || 0),
      productName: line.productName || ''
    }
  })

  var productCodes = Array.from(new Set(Object.keys(previousMap).concat(Object.keys(currentMap))))
  var changes = []
  var hasQuantityImpact = false

  productCodes.forEach(function (productCode) {
    var previousEntry = previousMap[productCode] || { quantity: 0, productName: '' }
    var currentEntry = currentMap[productCode] || { quantity: 0, productName: '' }
    var previousQty = previousEntry.quantity || 0
    var currentQty = currentEntry.quantity || 0
    if (previousQty === currentQty) {
      return
    }
    hasQuantityImpact = true
    changes.push({
      productCode: productCode,
      productName: currentEntry.productName || previousEntry.productName || '',
      previousQty: previousQty,
      currentQty: currentQty,
      delta: currentQty - previousQty
    })
  })

  return {
    hasChanges: changes.length > 0,
    hasQuantityImpact: hasQuantityImpact,
    changes: changes
  }
}

module.exports = {
  getReferenceCode,
  parseInvoiceVersion,
  compareInvoiceCodeVersions,
  sortInvoicesByVersion,
  getLatestInvoice,
  compareInvoiceLines
}
