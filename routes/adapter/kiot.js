var fetch = require('node-fetch')

var tokenCache = {
  checkedAt: 0,
  token: ''
}

function getRetailer() {
  return process.env.KIOT_RETAILER || 'cretasolu'
}

function getConfiguredBranchIds() {
  var raw = process.env.KIOT_BRANCH_ID || process.env.KIOT_BRANCH_IDS || ''
  var parsed = String(raw)
    .split(',')
    .map(function (item) { return Number(String(item).trim()) })
    .filter(function (item) { return Number.isFinite(item) && item > 0 })
  if (parsed.length) {
    return parsed
  }
  return [12961]
}

function appendQuery(url, query) {
  if (!query) {
    return url
  }
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + query
}

async function getToken() {
  var now = Date.now()
  if (tokenCache.token && now - tokenCache.checkedAt < 23 * 60 * 60 * 1000) {
    return tokenCache.token
  }

  var clientId = process.env.KIOT_CLIENT_ID || ''
  var clientSecret = process.env.KIOT_CLIENT_SECRET || ''
  var res = await fetch('https://id.kiotviet.vn/connect/token', {
    method: 'POST',
    body: 'scopes=PublicApi.Access&grant_type=client_credentials&client_id=' + clientId + '&client_secret=' + clientSecret,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  if (!res.ok) {
    throw new Error('KiotViet auth failed with status ' + res.status)
  }

  var data = await res.json()
  tokenCache.checkedAt = now
  tokenCache.token = data.token_type + ' ' + data.access_token
  return tokenCache.token
}

async function getKiotViet(url) {
  var token = await getToken()
  var res = await fetch(url, {
    method: 'GET',
    headers: {
      Retailer: getRetailer(),
      Authorization: token
    }
  })

  if (!res.ok) {
    var bodyText = await res.text()
    throw new Error('KiotViet GET failed ' + res.status + ': ' + bodyText)
  }

  return res.json()
}

async function getFull(url) {
  var currentItem = 0
  var pageSize = 100
  var result = []

  while (true) {
    var pageUrl = appendQuery(url, 'currentItem=' + currentItem + '&pageSize=' + pageSize)
    var data = await getKiotViet(pageUrl)
    var rows = Array.isArray(data.data) ? data.data : []
    result = result.concat(rows)
    if (!rows.length || rows.length < pageSize) {
      break
    }
    currentItem += rows.length
  }

  return result
}

async function getFullCustomer() {
  return getFull('https://public.kiotapi.com/customers?includeTotal=1&includeCustomerSocial=1&includeCustomerGroup=1')
}

async function getFullInvoice() {
  return getFull('https://public.kiotapi.com/invoices')
}

async function getFullProduct() {
  var url = 'https://public.kiotapi.com/products?includeInventory=true'
  var branchIds = getConfiguredBranchIds()
  if (branchIds.length) {
    url = appendQuery(url, 'BranchIds=' + branchIds.join(','))
  }
  return getFull(url)
}

async function getFullSupplier() {
  return getFull('https://public.kiotapi.com/suppliers')
}

async function getFullPurchaseOrders() {
  return getFull('https://public.kiotapi.com/purchaseorders')
}

async function getProductByCodeWithInventory(code) {
  var url = 'https://public.kiotapi.com/products/code/' + code + '?includeInventory=true'
  var branchIds = getConfiguredBranchIds()
  if (branchIds.length) {
    url = appendQuery(url, 'BranchIds=' + branchIds.join(','))
  }
  return getKiotViet(url)
}

async function getProductHistory(productId, options) {
  var query = options || {}
  var params = []
  params.push('format=json')
  params.push('BranchId=' + encodeURIComponent(query.branchId || -1))
  params.push('$inlinecount=allpages')
  params.push('$top=' + encodeURIComponent(query.top || 15))
  if (query.skip) {
    params.push('$skip=' + encodeURIComponent(query.skip))
  }

  var token = await getToken()
  var url = 'https://api-man1.kiotviet.vn/api/products/' + encodeURIComponent(productId) + '/history?' + params.join('&')
  var res = await fetch(url, {
    method: 'GET',
    headers: {
      Retailer: getRetailer(),
      Authorization: token,
      Accept: 'application/json'
    }
  })

  if (!res.ok) {
    var bodyText = await res.text()
    throw new Error('KiotViet product history failed ' + res.status + ': ' + bodyText)
  }

  return res.json()
}

module.exports.getKiotViet = getKiotViet
module.exports.getConfiguredBranchIds = getConfiguredBranchIds
module.exports.getProductByCodeWithInventory = getProductByCodeWithInventory
module.exports.getProductHistory = getProductHistory
module.exports.getFull = getFull
module.exports.getFullCustomer = getFullCustomer
module.exports.getFullInvoice = getFullInvoice
module.exports.getFullProduct = getFullProduct
module.exports.getFullSupplier = getFullSupplier
module.exports.getFullPurchaseOrders = getFullPurchaseOrders
