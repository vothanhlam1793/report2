const db = require("../models");
const Transaction = db.transactions;
var nameController = "Transaction";
const { getReferenceCode } = require('../lib/invoiceReference')

function getCurrentUser(req) {
    return (req.session && req.session.user) || {
        name: 'System',
        username: 'system'
    }
}

// Create and Save a new Tutorial
function createObj (data) {
    var a = {};
    var objArray = [
        'code', 'bank', 'content', 'amount', 'date', 'accuracy', 'protected',
        'referenceCode', 'invoiceCode', 'customerCode', 'customerName',
        'staffUsername', 'staffName', 'counterpartyType', 'counterpartyCode', 'counterpartyName',
        'direction', 'category', 'description', 'note', 'transactionDate',
        'createdByName', 'createdByUsername'
    ];
    objArray.forEach(function(e){
        a[e] = data[e];
    });
    a.amount = Number(data.amount || 0)
    a.direction = data.direction || 'expense'
    a.category = data.category || 'other_operational'
    a.transactionDate = data.transactionDate || data.date || new Date()
    a.date = a.transactionDate
    if (!a.referenceCode && data.invoiceCode) {
        a.referenceCode = getReferenceCode(data.invoiceCode)
    }
    if (!a.code) {
        a.code = a.referenceCode || a.invoiceCode || ''
    }
    return a;
}

exports.create = (req, res) => {
    if(!req.body.referenceCode && !req.body.invoiceCode && !req.body.code){
        res.status(400).send({
            message: "Cannot empty the reference or invoice code"
        })
    }
    const payload = createObj(req.body)
    const user = getCurrentUser(req)
    payload.createdByName = payload.createdByName || user.name
    payload.createdByUsername = payload.createdByUsername || user.username
    const transaction = new Transaction(payload);
    transaction.save(transaction).then(data=>{
        res.send(data);
    }).catch(e=>{
        console.log(e);
        res.status(500).send({
            message: e.message || "Error cannot create " + nameController
        })
    });
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
    const conditional = {};
    var objArray = [
        'code', 'bank', 'content', 'amount', 'date', 'accuracy', 'protected',
        'referenceCode', 'invoiceCode', 'customerCode', 'customerName', 'staffUsername', 'staffName',
        'counterpartyType', 'counterpartyCode', 'counterpartyName', 'direction', 'category'
    ];
    objArray.forEach(function(e){
        if(req.query[e]){
            conditional[e] = req.query[e];
        }
    })

    if (req.query.startDate || req.query.endDate) {
        conditional.transactionDate = {}
        if (req.query.startDate) {
            conditional.transactionDate.$gte = new Date(req.query.startDate + 'T00:00:00')
        }
        if (req.query.endDate) {
            conditional.transactionDate.$lte = new Date(req.query.endDate + 'T23:59:59')
        }
    }

    if (req.query.search) {
        const search = String(req.query.search).trim()
        conditional.$or = [
            { referenceCode: new RegExp(search, 'i') },
            { invoiceCode: new RegExp(search, 'i') },
            { customerCode: new RegExp(search, 'i') },
            { customerName: new RegExp(search, 'i') },
            { counterpartyName: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') }
        ]
    }

    Transaction.find(conditional).sort({ transactionDate: -1, createdAt: -1 }).then(data => {
        res.send(data);
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "Error cannot querry all"
        })
    })
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
    Transaction.findById(req.params.id).then(data=>{
        res.send(data);
    }).catch(e=>{
        res.status(400).send({
            message: e.message || "Cannot query Transaction with id " + req.params.id
        })
    })  
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
    if (!req.body) {
        return res.status(400).send({
          message: "Data to update can not be empty!"
        });
    }
    const id = req.params.id;
    Transaction.findByIdAndUpdate(id, req.body, {useFindAndModify: false}).then(data=>{
        if(data){
            res.send({
                message: "OK"
            });
        } else {
            res.status(400).send({
                message: "Cannot update " + id
            })
        }

    }).catch(e=>{
        res.status(400).send({
            message: e.message || "Cannot find and update " + id
        })
    })
};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Transaction.findById(id).then(r=>{
        if(r.protected){
            res.send({
                message: "Cannot remove model PROTECTED"
            });
        } else {
            Transaction.findByIdAndRemove(id).then(data=>{
                if(!data){
                    res.status(400).send({
                        message: "Error - not remove"
                    })
                } else {
                    res.send({
                        message: "Ok - success"
                    })
                }
            }).catch(e=>{
                res.status(500).send({
                    message: "Cannot delete id " + id
                })
            })
        }
    })
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
  
};

// Find all published Tutorials
exports.findAllPublished = (req, res) => {
  
};
