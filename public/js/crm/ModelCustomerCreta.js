// Model
class CretaCustomer {
    constructor(obj){
        this._oUDs = [];
        this.customer = obj || {
            code: "",   // Code chung
            kiot: "",   // Danh cho KiotViet
            origin: ""  // Danh cho Creta
        }
    }
    
    // Tao cho nhieu he thong theo doi
    bindUpdateData = (cb) => {
        this._oUDs.push(cb);
    }
    
    // Danh cho chay noi bo
    onUpdateData = () => {
        this._oUDs.forEach(function(e){
            if(typeof e == "function"){
                e();
            }
        });
    }

    getName = () => {
        return this.customer.kiot.name || this.customer.origin.name;
    }

    getTotal = () => {
        return this.customer.kiot.totalRevenue || 0;
    }

    getCode = () => {
        return this.customer.code;
    }

    getTags = () => {
        return this.customer.origin.tags || [];
    }

    removeTag = (i) => {
        var that = this;
        var c = new Customer(this.customer.origin);
        c.attributes.tags.splice(i,1);
        c.save({}, {
            success: function(){
                that.onUpdateData();
            },
            error: function(){
                console.log("REMOVE TAG FAIL");
            }
        })
    }

    addTag = (tag) => {
        console.log(this, tag);
        if(tag == "" || tag == undefined){
            return;
        }
        var that = this;
        if((this.customer.origin.code || this.customer.origin.codeKiot) == undefined){
            // truong hop chi co KIOT
            this.create({
                code: this.customer.kiot.code,
                codeKiot: this.customer.kiot.code,
                name: this.customer.kiot.name,
                phoneNumber: this.customer.kiot.contactNumber,
            }, function(){
                that.fetch(function(){
                    that.addTag(tag);
                })
            })
            return;
        }
        var c = new Customer(this.customer.origin);
        c.attributes.tags.push(tag);
        c.attributes.tags = Array.from(new Set(c.attributes.tags));
        c.save({}, {
            success: function(){
                that.onUpdateData();
            },
            error: function(){
                console.log("ADD TAG FAIL");
            }
        })
    }
    checkTag = (tag) => {
        var temp = -1;
        if(this.customer.origin.tags){
            temp = this.customer.origin.tags.indexOf(tag);
        }
        if(temp >= 0) {
            return true;
        } else {
            return false;
        }
    }
    // Xoa du lieu Creta
    delete = () => {
        console.log(this);
        var that = this;
        var c = new Customer({id: this.customer.origin.id});
        c.destroy({
            success: function(){
                that.onUpdateData();
            }
        });
    }
    
    fetch = (next) => {
        var that = this;
        $.get("/creta/customer/" + this.customer.code, (data)=>{
            that.customer = data;
            if(typeof next == "function"){
                next();
            } else {
                that.onUpdateData();
            }
        })    
    }
    
    // Tao trong Creta
    create = (obj, next) => {
        var c = new Customer(obj);
        c.save({}, {
            success: function(){
                if(typeof next == "function"){
                    next();
                }
            }
        })
    }

    // Get Address
    getAddress = () => {
        return this.customer.kiot.address || this.customer.origin.addresss || "";
    }
}

class CretaCustomers {
    constructor(){
        var that = this;
        that.customers = [];
        $.get("/creta/customer", function(data){
            data.forEach(function(customer){
                var c = new CretaCustomer(customer);
                that.customers.push(c);
            })
        });
    }
}