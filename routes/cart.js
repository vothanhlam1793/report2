var express = require('express');
var router = express.Router();
var cart = require("./adapter/cart");
router.get("/", (req, res)=>{
    res.render("cart/index", {
        "title": "Giỏ hàng"
    })
})

router.get("/api/", async (req, res)=>{
    var d = await cart.getAll();
    res.send(d);
})

module.exports = router;