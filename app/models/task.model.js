module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            deadline: Date,
            description: String,
            staff: String,
            result: String,
            type: String,
            status: String,
            repeat: String,
            repeatObject: Object
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