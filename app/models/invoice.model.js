module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            referenceCode: String,
            code: String,
            actions: Array,
            notes: Array,
            status: String,
            activeInvoiceCode: String,
            latestWarehouseCheckId: String,
            changeWarningLevel: String,
            changeWarningSummary: String,
            relatedInvoiceCodes: Array
        },
        { timestamps: true }
    );
  
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
  
    const Invoice = mongoose.model("invoice", schema);
    return Invoice;
  };
