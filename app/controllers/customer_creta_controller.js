var Customer = require("../models/index").customers;
var CustomerKiot = require("../models/kiot.model").CustomerKiot;
exports.getAll = async (req, res) => {
    var kiot = new CustomerKiot();
    var kiots = await kiot.fetchAll();
    var customers = await Customer.find({});
    var result = [];
    kiots.forEach(function(customer){
        var index;
        index = customers.findIndex(function(e){
            return e.codeKiot == customer.code;
        });

        result.push({
            code: customer.code,
            kiot: customer,
            origin: index == -1 ? {} : customers[index]
        });
        if(index >= 0){
            customers.splice(index, 1);
        }
    })
    customers.forEach(function(customer){
        result.push({
            code: customer.code,
            kiot: {},
            origin: customer
        });
    });
    res.send(result);
}

exports.getByCode = async (req, res) => {
    var code = req.params.code;
    var customer = new CustomerKiot(code);
    var kiot = await customer.fetch();
    if(!kiot.code){
        kiot = {};
    }
    var creta = await Customer.find({$or: [{code: code}, {codeKiot: code}]});
    if(creta.length == 0){
        creta[0] = {}
    }
    res.send({
        code: creta[0].code || creta[0].codeKiot,
        origin: creta[0],
        kiot: kiot
    });
}