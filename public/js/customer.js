var view_app_customer = new Vue({
    el: "#app-customer",
    data: {
        init: true,

        // data view
        customers: [],
        // handler

    },
    methods: {
        numberWithCommas: function (x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
    }
})

class ControllerAppCustomer{
    constructor(view, model){
        this.view = view;
        this.model = model;
        this.model.bindDataUpdate(this.onDataUpdate);
    }
    onDataUpdate =  (customers) => {
        this.view.customers = customers;
    }
}

class ModelAppCustomer{
    constructor(){
        this.customers = [];
        var that = this;
        $.get("/crm/customers", function(d){
            var data = d.filter(function(e){
                return e.totalRevenue > 0;
            })
            that.customers = data;
            that.onDataUpdate(that.customers);
        });
    }
    bindDataUpdate = (callback) => {
        this.onDataUpdate = callback;
    }
}

var app_customer = new ControllerAppCustomer(view_app_customer, new ModelAppCustomer());