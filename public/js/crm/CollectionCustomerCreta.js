// Collection
class CustomersApp {
    constructor(){
        var that = this;
        that._oUDs = [];
        that.customers = [];
        that.initModel();
    }
    initModel = () => {
        var that = this;
        that.customers = [];
        $.get("/creta/customer", function(data){
            data.forEach(function(customer){
                var c = new CretaCustomer(customer);
                c.bindUpdateData(that.initModel);
                that.customers.push(c);
            })
            that.onUpdateData();
        });
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
}