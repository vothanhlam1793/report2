module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      name: String,
      username: {
        type: String,
        unique: true,
        trim: true
      },
      passwordHash: String,
      role: {
        type: String,
        default: 'viewer'
      },
      isActive: {
        type: Boolean,
        default: true
      },
      lastLoginAt: Date
    },
    { timestamps: true }
  )

  schema.method('toJSON', function () {
    const { __v, _id, passwordHash, ...object } = this.toObject()
    object.id = _id
    return object
  })

  const User = mongoose.model('user', schema)
  return User
}
