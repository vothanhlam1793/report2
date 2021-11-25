var express = require('express');
var router = express.Router();
var kiot = require("./adapter/kiot");
var sheet = require("./adapter/sheet");
/* GET home page. */
router.get('/', async function(req, res, next) {
    console.log("CRM");
    res.render("crm/index",{
        title: "CRM - CRETA v1.0"
    })
});
router.get('/customers', async function(req, res, next) {
    var customers = await kiot.getFullCustomer();
    res.send(customers);
});
router.get('/invoices', async function(req, res, next) {
    var invoices = await kiot.getFullInvoice();
    res.send(invoices);
});
router.get("/customer", async (req, res)=>{
    var customer = await kiot.getKiotViet("https://public.kiotapi.com/customers/code/" + req.query.code);
    res.send(customer);
})
router.get("/invoice", async (req, res)=>{
    var customer = await kiot.getFull("https://public.kiotapi.com/invoices?customerCode=" + req.query.code);
    res.send(customer);
})

module.exports = router;