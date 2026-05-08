const kiot = require('../../routes/adapter/kiot')

exports.findAll = async (req, res) => {
  try {
    const rows = await kiot.getFullSupplier()
    const normalized = (Array.isArray(rows) ? rows : []).map(function (item) {
      return {
        id: item.id || 0,
        code: item.code || '',
        name: item.name || '',
        contactNumber: item.contactNumber || item.phone || '',
        address: item.address || ''
      }
    }).filter(function (item) {
      return item.id || item.code || item.name
    })
    res.send(normalized)
  } catch (e) {
    res.status(500).send({ message: e.message || 'Cannot query suppliers from KiotViet' })
  }
}
