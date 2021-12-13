const db = require("../models");
const noteModel = require("../models/note.model");
const Customer = db.customers;
var nameController = "Note";

function createObj (data) {
    var objArray = ['name', 'phoneNumber', 'description', 'type', 'tags', 'links', 'code', 'codeKiot', "lifetime", "notes", 'health'];
    var a = {};
    objArray.forEach(function(e){
        a[e] = data[e];
    });
    return a;
}

// Create and Save a new Tutorial
exports.create = (req, res) => {
    const customer = new Customer(createObj(req.body));
    customer.save(customer).then(data=>{
        if(req.body._url){
            res.redirect(req.body._url);
        } else {
            res.send(data);
        }
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "Error cannot create " + nameController
        })
    });  
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
    var condition = {};
    Customer.find(condition).then(data=>{
        res.send(data);
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "Cannot query Customers"
        })
    })
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
    Customer.findById(req.params.id).then(data=>{
        res.send(data);
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "Cannot get customer with id " + req.params.id
        })
    })
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
    if(!req.body){
        return res.status(400).send({
            message: "Cannot empty"
        })
    }
    console.log(req.body);
    const id = req.params.id;
    Customer.findByIdAndUpdate(id, req.body, {useFindAndModify: false}).then(data=>{
        if(data){
            res.send({
                message: "OK"
            })
        } else {
            res.status(400).send({
                message: "Cannot update customer id " + id
            })
        }
    }).catch(e=>{
        res.status(400).send({
            message: "Cannot update customer id " + id
        })
    })
};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Customer.findByIdAndRemove(id).then(data=>{
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
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
  
};

// Find all published Tutorials
exports.findAllPublished = (req, res) => {
  
};