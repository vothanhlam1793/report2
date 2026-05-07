const INVOICE_STATUSES = [
  { key: 'B1', order: 1, title: 'Moi len don', style: 'danger' },
  { key: 'B2', order: 2, title: 'Kiem tra ton kho', style: 'secondary' },
  { key: 'B3', order: 3, title: 'Cho du hang', style: 'warning' },
  { key: 'B4', order: 4, title: 'San sang dong hang', style: 'info' },
  { key: 'B5', order: 5, title: 'Da dong hang', style: 'primary' },
  { key: 'B6', order: 6, title: 'Dang giao ra chanh', style: 'primary' },
  { key: 'B7', order: 7, title: 'Da toi chanh', style: 'info' },
  { key: 'B8', order: 8, title: 'Khach da nhan', style: 'success' },
  { key: 'B9', order: 9, title: 'Hoan thanh', style: 'success' }
]

const LEGACY_TO_KEY = {
  1: 'B1',
  2: 'B4',
  3: 'B5',
  4: 'B7',
  5: 'B8'
}

const KEY_TO_STATUS = INVOICE_STATUSES.reduce((acc, item) => {
  acc[item.key] = item
  return acc
}, {})

function normalizeInvoiceStatus(rawStatus) {
  if (rawStatus === null || rawStatus === undefined || rawStatus === '') {
    return 'B1'
  }

  if (typeof rawStatus === 'number') {
    return LEGACY_TO_KEY[rawStatus] || 'B1'
  }

  const value = String(rawStatus).trim()
  if (KEY_TO_STATUS[value]) {
    return value
  }

  const numericValue = Number(value)
  if (!Number.isNaN(numericValue) && LEGACY_TO_KEY[numericValue]) {
    return LEGACY_TO_KEY[numericValue]
  }

  return 'B1'
}

function enrichInvoiceStatus(rawStatus) {
  const key = normalizeInvoiceStatus(rawStatus)
  const meta = KEY_TO_STATUS[key] || KEY_TO_STATUS.B1
  return {
    key: meta.key,
    order: meta.order,
    title: meta.title,
    style: meta.style
  }
}

function attachInvoiceStatus(record) {
  if (!record) {
    return record
  }
  const statusInfo = enrichInvoiceStatus(record.status)
  const plainRecord = typeof record.toObject === 'function' ? record.toObject() : { ...record }
  plainRecord.status = statusInfo.key
  plainRecord.statusInfo = statusInfo
  return plainRecord
}

module.exports = {
  INVOICE_STATUSES,
  normalizeInvoiceStatus,
  enrichInvoiceStatus,
  attachInvoiceStatus
}
