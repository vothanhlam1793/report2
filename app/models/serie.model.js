module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            invoiceCode: String,
            productCode: String,
            series: Array
        },
        { timestamps: true }
    );
  
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
  
    const Serie = mongoose.model("serie", schema);
    return Serie;
  };