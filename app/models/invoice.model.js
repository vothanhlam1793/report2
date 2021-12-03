module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            code: String,
            action: Array,
            notes: Array,
            status: String
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