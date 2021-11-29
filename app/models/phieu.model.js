module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            code: String,
            type: String,
            amount: Number,
            implementationDate: Date,
            description: String,
            executorCode: String,
            executorName: String
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