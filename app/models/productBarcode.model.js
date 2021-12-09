module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            productName: String,
            productCode: String,
            code: String,
            infos: Array
        },
        { timestamps: true }
    );
  
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
  
    const ProductBarcode = mongoose.model("productBarcode", schema);
    return ProductBarcode;
  };