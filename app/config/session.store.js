const mongoose = require('mongoose')

function collection() {
    return mongoose.connection.db.collection('sessions')
}

class SessionStore {
    constructor() {
        this.ready = false
        mongoose.connection.on('connected', () => { this.ready = true })
    }

    get(sid, callback) {
        if (!this.ready) return callback(null, null)
        collection().findOne({ _id: sid }).then(doc => {
            if (!doc) return callback(null, null)
            callback(null, doc.session)
        }).catch(err => callback(err))
    }

    set(sid, session, callback) {
        if (!this.ready) return callback()
        const expires = session.cookie?.maxAge
            ? new Date(Date.now() + session.cookie.maxAge)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        collection().updateOne({ _id: sid }, { $set: { session, expires } }, { upsert: true })
            .then(() => callback()).catch(callback)
    }

    destroy(sid, callback) {
        if (!this.ready) return callback()
        collection().deleteOne({ _id: sid }).then(() => callback()).catch(callback)
    }

    createSession(req, sess) {
        return sess
    }

    touch(sid, session, callback) {
        callback()
    }
}

module.exports = SessionStore
