module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            username: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            display_name: String,
            role: { type: String, default: 'user' },
            active: { type: Boolean, default: true }
        },
        { timestamps: true }
    )

    schema.method("toJSON", function() {
        const { __v, _id, password, ...object } = this.toObject()
        object.id = _id
        return object
    })

    const User = mongoose.model("user", schema)
    return User
}
