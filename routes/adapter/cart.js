var fetch = require("node-fetch");
class Cart {
    constructor(obj){
        this.data = obj;
    }
}

class Carts {
    constructor(){
        var that = this;
        that.carts = [];
        fetch("https://creta.vn/api/carts?pass=asrkpvg7").then(data=>data.json()).then(d => {
            d.forEach(function(e){
                that.carts.push(new Cart(e));
            })
        })
    }
}

exports.getAll = async () => {
    var res = await fetch("https://creta.vn/api/carts?pass=asrkpvg7");
    var d = await res.json();
    return d;
}