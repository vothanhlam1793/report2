module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      referenceCode: String,
      invoiceCode: String,
      status: {
        type: String,
        default: 'created'
      },
      summary: String,
      supplierMessage: String,
      supplierId: Number,
      supplierCode: String,
      supplierName: String,
      supplierPhone: String,
      createdByName: String,
      createdByUsername: String,
      orderedAt: Date,
      orderedByName: String,
      orderedByUsername: String,
      items: Array
    },
    { timestamps: true }
  )

  schema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    object.id = _id
    return object
  })

  const QuickPurchaseRequest = mongoose.model('quickPurchaseRequest', schema)
  return QuickPurchaseRequest
}
