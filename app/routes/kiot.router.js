module.exports = app => {
    const controllers = require("../controllers/kiot.controller");
    var router = require("express").Router();

    // Get a customer in with code
    router.get("/customers/:code", controllers.getCustomer);

    // Get all customer
    router.get("/customers", controllers.getAllCustomer);

    // Get a invoice
    router.get("/invoices/:code", controllers.getInvoice);

    // Get all invoices
    router.get("/invoices", controllers.getAllInvoice);

    // Get a product
    router.get("/products/:code", controllers.getProduct);

    // Get all products
    router.get("/products", controllers.getAllProduct);
    
    // Create a new
    // router.post("/", controllers.create);
  
    // Retrieve all
    // router.get("/", controllers.findAll);
  
    // Retrieve all published
    // router.get("/published", controllers.findAllPublished);
  
    // Retrieve a single with id
    // router.get("/:id", controllers.findOne);
  
    // Update with id
    // router.put("/:id", controllers.update);
  
    // Delete with id
    // router.delete("/:id", controllers.delete);
  
    // Create a new
    // router.delete("/", controllers.deleteAll);
  
    app.use('/api/kiot', router);
};