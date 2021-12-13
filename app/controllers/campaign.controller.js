const db = require("../models");
const Campaign = db.campaigns;
var nameController = "Campaign";

function createObj (data) {
    var objArray = ['name', 'tag', 'startDate', 'endDate', 'description', 'type', 'modules', 'campaigns'];
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
    const campaign = new Campaign(createObj(req.body));
    campaign.save(campaign).then(data=>{
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
    conditional = req.query;
    Campaign.find(conditional).then(data => {
        res.send(data);
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "Error cannot querry all"
        })
    })  
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
    Campaign.findById(req.params.id).then(data=>{
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
    Campaign.findByIdAndUpdate(id, req.body, {useFindAndModify: false}).then(data=>{
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
    Campaign.findByIdAndRemove(id).then(data=>{
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