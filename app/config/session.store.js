const mongoose = require('mongoose')

module.exports = class SessionStore {
    constructor() {
        this.model = mongoose.model('Session', new mongoose.Schema({
            _id: String,
            session: mongoose.Schema.Types.Mixed,
            expires: Date
        }, { timestamps: true }))
    }

    get(sid, callback) {
        this.model.findById(sid).then(doc => {
            if (!doc) return callback(null, null)
            callback(null, doc.session)
        }).catch(err => callback(err))
    }

    set(sid, session, callback) {
        const expires = session.cookie?.maxAge
            ? new Date(Date.now() + session.cookie.maxAge)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        this.model.findByIdAndUpdate(sid, {
            session: session,
            expires: expires
        }, { upsert: true, new: true, setDefaultsOnInsert: true }).then(() => {
            callback()
        }).catch(callback)
    }

    destroy(sid, callback) {
        this.model.findByIdAndDelete(sid).then(() => callback()).catch(callback)
    }

    touch(sid, session, callback) {
        callback()
    }
}
