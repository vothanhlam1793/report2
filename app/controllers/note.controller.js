const db = require("../models");
const Note = db.notes;
var nameController = "Note";

function createObj (data) {
    var objArray = ['customerId', 'customerCode','content', 'tags', 'type'];
    var a = {};
    objArray.forEach(function(e){
        a[e] = data[e];
    });
    return a;
}
// Create and Save a new Tutorial
exports.create = (req, res) => {
    if(!req.body.customerId){
        res.status(400).send({
            message: "Cannot create note with not customer"
        })
    }
    const note = new Note(createObj(req.body));
    note.save(note).then(data=>{
        res.send(data);
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "Cannot create note"
        })
    })
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
    Note.find({}).then(data=>{
        res.send(data);
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "error query notes"
        })
    })
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Note.findById(id).then(data=>{
        res.send(data);
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "error query notes"
        })
    })
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
    if(!req.body){
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }
    const id = req.params.id;
    Note.findByIdAndUpdate(id, req.body, {useFindAndModify: false}).then(data=>{
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
    Note.findByIdAndRemove(id).then(data=>{
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