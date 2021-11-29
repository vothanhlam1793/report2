module.exports = app => {
    const controllers = require("../controllers/sheet.controller");
    var router = require("express").Router();
    router.post("/fetch", controllers.getSheet);
    app.use('/api/sheet', router);
};