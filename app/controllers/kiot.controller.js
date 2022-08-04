var CustomerKiot = require("../models/kiot.model").CustomerKiot;
var InvoiceKiot = require("../models/kiot.model").InvoiceKiot;
var ProductKiot = require("../models/kiot.model").ProductKiot;
exports.getCustomer = function(req, res){
    if(!req.params.code){
        return res.status(500).send({
            message: "Query with /api/kiot/customers/<code>"
        });
    }
    var customer = new CustomerKiot(req.params.code);
    customer.fetch().then(data=>{
        res.send(data);
    })
}

exports.getAllCustomer = function(req, res){
    var customer = new CustomerKiot();
    if(req.query.new){
        customer.fetchAll(true).then(data => {
            res.send(data);
        });
    } else {
        customer.fetchAll().then(data => {
            res.send(data);
        });
    }
}

exports.getInvoice = function(req, res){
    if(!req.params.code){
        return res.status(500).send({
            message: "Query with /api/kiot/invoices/<code>"
        });
    }
    var invoice = new InvoiceKiot(req.params.code);    
    invoice.fetch().then(data=>{
        res.send(data);
    });
}

exports.getAllInvoice = function(req, res){
    var invoice = new InvoiceKiot();
    if(req.query.new){
        invoice.fetchAll(true).then(data => {
            res.send(data);
        });
    } else {
        invoice.fetchAll().then(data => {
            res.send(data);
        });
    }
}

exports.getProduct = function(req, res){
    if(!req.params.code){
        return res.status(500).send({
            message: "Query with /api/kiot/products/<code>"
        });
    }
    var product = new ProductKiot(req.params.code);    
    product.fetch().then(data=>{
        res.send(data);
    });
}

exports.getAllProduct = function(req, res){
    var product = new ProductKiot();
    if(req.query.new){
        product.fetchAll(true).then(data => {
            res.send(data);
        });
    } else {
        product.fetchAll().then(data => {
            res.send(data);
        });
    }
}

// exports.getInvoiceWithQuery = function(req, res){
//     var invoice = new InvoiceKiot();
//     invoice.fetchByQuery(req.query).then(data => {
//         res.send(data);
//     })


// }