const db = require('../models')

exports.findAll = async (req, res) => {
  try {
    const conditional = req.query || {}
    const data = await db.invoiceEvents.find(conditional).sort({ createdAt: -1 }).lean()
    res.send(data)
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot query invoice events' })
  }
}
