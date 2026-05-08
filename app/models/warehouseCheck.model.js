module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      referenceCode: String,
      invoiceCode: String,
      sourceInvoiceCode: String,
      status: {
        type: String,
        default: 'draft'
      },
      decisionStatus: {
        type: String,
        default: 'pending_stock_review'
      },
      stockConclusion: {
        type: String,
        default: ''
      },
      saleDecision: {
        type: String,
        default: ''
      },
      summary: String,
      warnings: Array,
      createdByName: String,
      createdByUsername: String,
      reviewedByName: String,
      reviewedByUsername: String,
      confirmedByName: String,
      confirmedByUsername: String,
      checkedAt: Date,
      confirmedAt: Date,
      invoiceSnapshot: Object,
      relatedInvoiceCodes: Array,
      lines: Array
    },
    { timestamps: true }
  )

  schema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    object.id = _id
    return object
  })

  const WarehouseCheck = mongoose.model('warehouseCheck', schema)
  return WarehouseCheck
}
