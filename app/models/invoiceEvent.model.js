module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      referenceCode: String,
      invoiceCode: String,
      eventType: String,
      actorRole: String,
      actorUsername: String,
      actorName: String,
      fromStatus: String,
      toStatus: String,
      summary: String,
      payload: Object
    },
    { timestamps: true }
  )

  schema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject()
    object.id = _id
    return object
  })

  const InvoiceEvent = mongoose.model('invoiceEvent', schema)
  return InvoiceEvent
}
