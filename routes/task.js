var express = require('express');
var router = express.Router();
var taskController = require("./controller/task_controller");

router.get("/", taskController.getBasic);
router.get("/create", taskController.create);
module.exports = router;
