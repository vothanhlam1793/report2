const mongoose = require('mongoose')
const EventEmitter = require('events')

class SessionStore extends EventEmitter {
    constructor() {
        super()
        this.model = mongoose.model('Session', new mongoose.Schema({
            _id: String,
            session: mongoose.Schema.Types.Mixed,
            expires: Date
        }, { timestamps: true }))
        this.model.collection.createIndex({ expires: 1 }, { expireAfterSeconds: 0 }).catch(() => {})
    }

    get(sid, callback) {
        this.model.findById(sid).then(doc => {
            if (!doc || (doc.expires && doc.expires < new Date())) {
                return callback(null, null)
            }
            callback(null, doc.session)
        }).catch(() => callback(null, null))
    }

    set(sid, session, callback) {
        const expires = session.cookie && session.cookie.maxAge
            ? new Date(Date.now() + session.cookie.maxAge)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        this.model.findByIdAndUpdate(sid, {
            session: session,
            expires: expires
        }, { upsert: true, new: true }).then(() => {
            callback()
        }).catch(callback)
    }

    destroy(sid, callback) {
        this.model.findByIdAndDelete(sid).then(() => {
            callback()
        }).catch(callback)
    }

    createSession(req, sess) {
        return sess
    }

    touch(sid, session, callback) {
        if (session && session.cookie && session.cookie.maxAge) {
            this.model.findByIdAndUpdate(sid, {
                expires: new Date(Date.now() + session.cookie.maxAge)
            }).then(() => {
                callback()
            }).catch(callback)
        } else {
            callback()
        }
    }
}

module.exports = SessionStore
