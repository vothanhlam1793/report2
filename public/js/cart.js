class ProductCart{
    constructor(obj){
        this.data = obj;
    }
    getName=()=>{
        return this.data.name;
    }
    getPrice=()=>{
        return this.data.price;
    }
    getQuanlity=()=>{
        return this.data.quanlity;
    }
    getTotal=()=>{
        return this.data.quanlity*this.data.price;
    }
}
class Cart{
    constructor(obj){
        this.data = obj || {cart:[]};
    }
    getName = () => {
        return this.data.name;
    }
    getPhone = () => {
        return this.data.phone;
    }
    getCode = () => {
        return this.data.code;
    }
    getProducts = () => {
        return this.data.cart.map(function(e){
            return new ProductCart(e);
        })
    }
    getDateCreated = () => {
        return (new Date(this.data.createdAt)).toISOString().split("T")[0];
    }
    getTotal = () => {
        var t = 0;
        this.getProducts().forEach(function(e){
            t += e.getTotal();
        })
        return t;
    }
}

class Carts{
    constructor(){
        var that = this;
        that.carts = [];
        $.get("/cart/api", function(d){
            d.forEach(function(e){
                that.carts.push(new Cart(e));
            })
        })
    }
}