var express = require('express');
var router = express.Router();
var Customer = require('../app/models/index').customers;
var CustomerKiot = require("../app/models/kiot.model").CustomerKiot;
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
    Customer.find({codeKiot: req.query.code}).then(data=>{
        console.log(data);
        if(data.length == 0){
            // Tao moi
            var customerKiot = new CustomerKiot(req.query.code)
            customerKiot.fetch().then(cusKiot=>{
                if(!cusKiot.name){
                    return res.status(500).send({
                        message: "Có lỗi gì đó với code này trên KIOT"
                    });
                }
                var customer = new Customer({
                    name: cusKiot.name,
                    phoneNumber: cusKiot.contactNumber,
                    codeKiot: cusKiot.code
                });
                customer.save(customer).then(cusNew=>{
                    console.log(cusNew);
                    res.render("crm/detail_customer", {
                        title: "Khách hàng",
                        customerId: cusNew._id,
                        code: req.query.code
                    })
                })
            });

        } else {
            res.render("crm/detail_customer", {
                title: "Khách hàng",
                customerId: data[0]._id,
                code: req.query.code
            })
        }
    })
});

module.exports = router;
