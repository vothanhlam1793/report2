var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    res.render("invoices/index");
});
router.get('/detail', (req, res) => {
    res.render("invoices/detail")
});

router.get('/dashboard', (req, res) => {
    res.render("invoices/dashboard");
});

router.get('/package', (req, res) => {
    res.render("invoices/package");
});

router.get('/prepare', (req, res) => {
    res.render("invoices/prepare");
});

router.get('/ship', (req, res) => {
    res.render("invoices/ship");
});

router.get('/summary', (req, res) => {
    res.render("invoices/summary");
});

router.get('/demo', (req, res) => {
    res.render("invoices/demo");
})

router.get('/customer_notes', (req, res) => {
    res.render("invoices/customer_notes");
})
module.exports = router;
