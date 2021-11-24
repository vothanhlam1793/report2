module.exports = app => {
    var name = "transaction";
    const controllers = require("../controllers/" + name + ".controller.js");
  
    var router = require("express").Router();
  
    // Create a new
    router.post("/", controllers.create);
  
    // Retrieve all
    router.get("/", controllers.findAll);
  
    // Retrieve all published
    router.get("/published", controllers.findAllPublished);
  
    // Retrieve a single with id
    router.get("/:id", controllers.findOne);
  
    // Update with id
    router.put("/:id", controllers.update);
  
    // Delete with id
    router.delete("/:id", controllers.delete);
  
    // Create a new
    router.delete("/", controllers.deleteAll);
  
    app.use('/api/' + name + "s", router);
};