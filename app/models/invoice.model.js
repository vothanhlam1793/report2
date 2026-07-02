module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            code: String,
            actions: Array,
            notes: Array,
            status: String,
            has_packed_images: { type: Boolean, default: false },
            has_delivery_images: { type: Boolean, default: false }
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