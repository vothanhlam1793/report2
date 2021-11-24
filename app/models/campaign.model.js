module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            name: String,           // Ten hien thi
            tag: String,            // Tao tag theo doi voi khach
            startDate: Date,        // Ngay bat dau
            endDate: Date,          // Ngay ket thuc
            description: String     // Mo ta du an
        },
        { timestamps: true }
    );
  
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
  
    const Campaign = mongoose.model("campaign", schema);
    return Campaign;
  };