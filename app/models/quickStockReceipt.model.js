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
      createdByName: String,
      createdByUsername: String,
      confirmedAt: Date,
      confirmedByName: String,
      confirmedByUsername: String,
      linkedQuickPurchaseRequestIds: Array,
      receiptImages: Array,
      items: Array
    },
    { timestamps: true }
  )

  schema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    object.id = _id
    return object
  })

  const QuickStockReceipt = mongoose.model('quickStockReceipt', schema)
  return QuickStockReceipt
}
