var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    res.send("Hello");
});
router.get('/detail', (req, res) => {
    res.render("invoices/detail")
});

module.exports = router;
