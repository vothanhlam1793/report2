const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;
db.transactions = require("./transaction.model.js")(mongoose);
db.notes = require("./note.model")(mongoose);
db.customers = require("./customer.model")(mongoose);
db.campaigns = require("./campaign.model")(mongoose);
db.tasks = require("./task.model")(mongoose);
module.exports = db;