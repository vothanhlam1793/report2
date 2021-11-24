const db = require("../models");
const Model = db.campaigns;
var nameController = "Campaign";

function createObj (data) {
    var objArray = ['name', 'tag', 'startDate', 'endDate', 'description'];
    var a = {};
    objArray.forEach(function(e){
        a[e] = data[e];
    });
    return a;
}
// Create and Save a new Tutorial
exports.create = (req, res) => {
    if(!req.body.name){
        res.status(400).send({
            message: "Cannot empty the name"
        })
    }
    const model = new Model(createObj(req.body));
    model.save(model).then(data=>{
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
    conditional = {};
    Model.find(conditional).then(data => {
        res.send(data);
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "Error cannot querry all"
        })
    })  
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
    Model.findById(req.params.id).then(data=>{
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
    Model.findByIdAndUpdate(id, req.body, {useFindAndModify: false}).then(data=>{
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
    Model.findByIdAndRemove(id).then(data=>{
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