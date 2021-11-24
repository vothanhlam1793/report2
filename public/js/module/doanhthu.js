function getEndDate(d){
    return new Date(Math.round((new Date(d)).getTime()/86400000)*86400000 + (86400000 - 1)); 
}
function getStartDate(d){
    return new Date(Math.round((new Date(d)).getTime()/86400000)*86400000);
}
var view_revenue = new Vue({
    el: "#app-revenue",
    data: {
        init: true,

        // variable in view
        invoices: [],
        target: 50000000,
        contacts: [],
        invoicesToday: [],

        // handler in controller

    },
    methods: {
        drawTable: function(invoices){
            this.init = false;
            this.invoices = invoices;
            var a = getStartDate(new Date());
            var b = getEndDate(new Date());
            this.invoicesToday = this.invoices.filter(function(e){
                return (e.purchaseDate >= a.toISOString()) && (e.purchaseDate <= b.toISOString());
            })
        },
        getTotalToday: function(){
            var temp = {
                total: 0
            }
            try {
                temp = this.invoicesToday.reduce(function(t, e){
                    return {
                        total: t.total + e.total
                    }
                })
            } catch (e) {

            }
            return temp.total;
        },
        numberWithCommas: function (x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        },
        isMobile() {
            if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
              return true
            } else {
              return false
            }
        }
    },
    created: function(){

    }
})

class ControllerRevenue {
    constructor(view, model){
        this.view = view;
        this.model = model;
        this.model.bindUpdateData(this.onUpdateData);
    }
    onUpdateData = (invoices) => {
        this.view.drawTable(invoices);
    }
}

class ModelRevenue {
    constructor(start, end){
        this.invoices = [];
        this.startDate = new Date(Math.round((new Date(start)).getTime()/86400000)*86400000);
        this.endDate = new Date(Math.round((new Date(end)).getTime()/86400000)*86400000);
        var that = this;
        $.get("/sales?from=" + (this.startDate).toISOString().split("T")[0]+ "&to=" + (this.endDate).toISOString().split("T")[0], function(d){
            that.invoices = d.data;
            that.onUpdateData(that.invoices);
        });
    }
    bindUpdateData = function(callback){
        this.onUpdateData = callback;
    }
    reloadData = ()=>{
        var that = this;
        $.get("/sales?from=" + (this.startDate).toISOString().split("T")[0]+ "&to=" + (this.endDate).toISOString().split("T")[0], function(d){
            that.invoices = d.data;
            that.onUpdateData(that.invoices);
        });
    }
}
var appRevenue = new ControllerRevenue(view_revenue, new ModelRevenue("2021-11-01", "2021-11-30"));