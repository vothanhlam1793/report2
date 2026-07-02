module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            invoice_code: String,
            url: String,
            filename: String,
            type: { type: String, enum: ['packed', 'delivery'], default: 'packed' },
            note: String,
            uploaded_by: String
        },
        { timestamps: true }
    )

    schema.method("toJSON", function() {
        const { __v, _id, ...object } = this.toObject()
        object.id = _id
        return object
    })

    const Image = mongoose.model("invoice_image", schema)
    return Image
}
