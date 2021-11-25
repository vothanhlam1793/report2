var Customer = require('../../app/models/index').customers;
var CustomerKiot = require("../../app/models/kiot.model").CustomerKiot;
class FactoryCustomer {
    constructor(){
        
    }
    getIdCustomerByCode = function(code, cb){
        if(!cb){
            cb = function(){};
        }
        Customer.find({$or: [{codeKiot: code},{code: code}]}).then(data=>{
            if(data.length == 0){
                // Lay du lieu tu kiotviet ve
                var customerKiot = new CustomerKiot(code)
                customerKiot.fetch().then(cusKiot=>{
                    if(!cusKiot.name){
                        cb({
                            message: "Có lỗi gì đó với code này trên KIOT"
                        });
                    }
                    var customer = new Customer({
                        name: cusKiot.name,
                        phoneNumber: cusKiot.contactNumber,
                        codeKiot: cusKiot.code
                    });
                    customer.save(customer).then(cusNew=>{
                        cb(cusNew);
                    })
                });
            } else {
                cb(data[0]);
            }
        })
    }
}
exports.getDetail = function(req, res){
    if(!req.query.code){
        return res.redirect("/customer");
    }
    var fCustomer = new FactoryCustomer();
    fCustomer.getIdCustomerByCode(req.query.code, function(customer){
        res.render("crm/detail_customer", {
            title: "Khách hàng",
            customerId: customer._id,
            code: req.query.code
        })
    })
}
exports.getInfo = function(req, res){
    if(!req.params.code){
        return res.redirect("/customer");
    }
    var code = req.params.code;
    var fCustomer = new FactoryCustomer();
    fCustomer.getIdCustomerByCode(code, function(customer){
        res.render("customer/index", {
            mainPage: "INFO",
            customer: customer
        });
    })

}

exports.getHealth = function(req, res){
    if(!req.params.code){
        return res.redirect("/customer");
    }
    var code = req.params.code;
    var fCustomer = new FactoryCustomer();
    fCustomer.getIdCustomerByCode(code, function(customer){
        res.render("customer/index", {
            mainPage: "HEATH",
            customer: customer
        });
    })
}

exports.getAll = function(req, res){
    res.render("customer/index", {
        mainPage: "ALL",
        customer: {
            name: "Tất cả khách",
            code: ""
        }
    });
}