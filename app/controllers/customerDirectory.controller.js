const odoo = require('../../routes/adapter/odoo')

exports.findAll = async (req, res) => {
  try {
    const rows = await odoo.getAllCustomers()
    res.send(Array.isArray(rows) ? rows : [])
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot query customers from Odoo' })
  }
}
