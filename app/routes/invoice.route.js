module.exports = (app, requireRole) => {
    var name = "invoice";
    const controllers = require("../controllers/" + name + ".controller.js");
  
    var router = require("express").Router();
  
    // Create a new
    router.post("/", controllers.create);
  
    // Retrieve all
    router.get("/", controllers.findAll);

    // Upsert by code
    router.post("/upsert", controllers.upsertByCode);

    // Aggregate detail by code
    router.get("/detail/:code", controllers.getDetailByCode);

    // Get By Code
    router.get("/code/:code", controllers.getByCode);
  
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

    if (typeof requireRole === 'function') {
      app.use('/api/' + name + "s", requireRole('viewer'), router);
      return;
    }

    app.use('/api/' + name + "s", router);
};
