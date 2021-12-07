module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            invoiceCode: String,
            productCode: String,
            codes: Array,
            check: Boolean
        },
        { timestamps: true }
    );
  
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
  
    const Phieu = mongoose.model("phieu", schema);
    return Phieu;
  };