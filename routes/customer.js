var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render("crm/customer", {
        title: "Khách hàng"
    })
});
/* GET users listing. */
router.get('/detail', function(req, res, next) {
    if(!req.query.code){
        return res.redirect("/customer");
    }
    res.render("crm/detail_customer", {
        title: "Khách hàng",
        customerId: req.query.id,
        code: req.query.code
    })
});

module.exports = router;
