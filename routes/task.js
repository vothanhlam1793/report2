var express = require('express');
var router = express.Router();
var taskController = require("./controller/task_controller");

router.get("/", taskController.getBasic);
router.get("/create", taskController.create);
router.get("/wmonitor", taskController.monitor);
router.get("/monitor", taskController.viewMonitor);
router.post("/shortlink", taskController.getShortlink);
module.exports = router;
