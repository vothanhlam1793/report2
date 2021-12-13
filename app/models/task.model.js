module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            deadline: Date,
            title: String,
            description: String,
            staff: String,
            result: Object,
            type: String,
            status: String,
            repeat: String,
            repeatObject: Object,
            action: Object,
            info: Object // infor so huu cua doi tuong
        },
        { timestamps: true }
    );
  
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
  
    const Task = mongoose.model("task", schema);
    return Task;
  };