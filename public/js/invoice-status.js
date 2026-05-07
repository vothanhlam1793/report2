window.INVOICE_STATUSES = [
  { key: 'B1', order: 1, title: 'Mới lên đơn', style: 'danger' },
  { key: 'B2', order: 2, title: 'Kiểm tra tồn kho', style: 'secondary' },
  { key: 'B3', order: 3, title: 'Chờ đủ hàng', style: 'warning' },
  { key: 'B4', order: 4, title: 'Sẵn sàng đóng hàng', style: 'info' },
  { key: 'B5', order: 5, title: 'Đã đóng hàng', style: 'primary' },
  { key: 'B6', order: 6, title: 'Đang giao ra chành', style: 'primary' },
  { key: 'B7', order: 7, title: 'Đã tới chành', style: 'info' },
  { key: 'B8', order: 8, title: 'Khách đã nhận', style: 'success' },
  { key: 'B9', order: 9, title: 'Hoàn thành', style: 'success' }
]

window.LEGACY_INVOICE_STATUS_MAP = {
  1: 'B1',
  2: 'B4',
  3: 'B5',
  4: 'B7',
  5: 'B8'
}

window.normalizeInvoiceStatus = function(rawStatus) {
  if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
    return 'B1'
  }

  if (typeof rawStatus === 'number' && window.LEGACY_INVOICE_STATUS_MAP[rawStatus]) {
    return window.LEGACY_INVOICE_STATUS_MAP[rawStatus]
  }

  var value = String(rawStatus).trim()
  var hasKey = window.INVOICE_STATUSES.some(function(status) {
    return status.key === value
  })
  if (hasKey) {
    return value
  }

  var numericValue = Number(value)
  if (!Number.isNaN(numericValue) && window.LEGACY_INVOICE_STATUS_MAP[numericValue]) {
    return window.LEGACY_INVOICE_STATUS_MAP[numericValue]
  }

  return 'B1'
}

window.getInvoiceStatusMeta = function(rawStatus) {
  var key = window.normalizeInvoiceStatus(rawStatus)
  return window.INVOICE_STATUSES.find(function(status) {
    return status.key === key
  }) || window.INVOICE_STATUSES[0]
}
