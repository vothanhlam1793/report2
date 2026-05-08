function createActor(req) {
  const user = req.session && req.session.user ? req.session.user : {}
  return {
    actorRole: user.role || 'viewer',
    actorUsername: user.username || '',
    actorName: user.name || ''
  }
}

async function logInvoiceEvent(db, req, event) {
  const actor = createActor(req)
  return db.invoiceEvents.create({
    referenceCode: event.referenceCode || '',
    invoiceCode: event.invoiceCode || '',
    eventType: event.eventType || '',
    actorRole: actor.actorRole,
    actorUsername: actor.actorUsername,
    actorName: actor.actorName,
    fromStatus: event.fromStatus || '',
    toStatus: event.toStatus || '',
    summary: event.summary || '',
    payload: event.payload || {}
  })
}

module.exports = {
  logInvoiceEvent
}
