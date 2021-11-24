module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            name: String,
            phoneNumber: String,
            description: String,
            type: String,
            tags: Array,
            links: Array,
            lifetime: String,
            codeKiot: String,
            code: String,
            notes: Array,
            health: String,
        },
        { timestamps: true }
    );
  
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
  
    const Customer = mongoose.model("customer", schema);
    return Customer;
  };