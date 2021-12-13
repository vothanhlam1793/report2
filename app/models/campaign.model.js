module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            name: String,           // Ten hien thi
            tag: {
                type: String,
                unique: true 
            },                      // Tao tag theo doi voi khach
            startDate: Date,        // Ngay bat dau
            endDate: Date,          // Ngay ket thuc
            description: String,     // Mo ta du an
            type: String,
            modules: Array,
            campaigns: Array
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