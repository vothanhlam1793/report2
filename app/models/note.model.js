module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            customerId: String,
            customerCode: String,
            content: String,
            tags: String, 
            type: String
        },
        { 
            timestamps: true 
        }
    );
  
    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
  
    const Note = mongoose.model("note", schema);
    return Note;
  };