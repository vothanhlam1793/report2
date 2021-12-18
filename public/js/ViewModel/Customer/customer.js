// Model
serialize = function(obj, prefix) {
    var str = [],
      p;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        var k = prefix ? prefix + "[" + p + "]" : p,
          v = obj[p];
        str.push((v !== null && typeof v === "object") ?
          serialize(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
  }

class CretaCustomer {
    constructor(obj){
        this._oUDs = [];
        this.customer = {}
        if(obj){
            this.customer.origin = new Customer(obj.origin || {});
            this.customer.kiot = obj.kiot || {};
            this.customer.code = obj.code || "";
        } else {
            this.customer.origin = new Customer();
            this.customer.kiot = {};
            this.customer.code = "";
        }
        
        
    }
    // Danh cho chay noi bo
    onUpdateData = () => {
        this._oUDs.forEach(function(e){
            if(typeof e == "function"){
                e();
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
    getKiotAttribute = (attribute) => {
        return this.customer.kiot[attribute];
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

// class ModelTask {
//     constructor(obj){
//         this.oUDs = [];
//         this.task = new Task(obj);        
//     }
//     onUpdateData = () => {
//         this._oUDs.forEach(function(e){
//             if(typeof e == "function"){
//                 e();
//             }
//         });
//     }
// }

class ModelCustomerTask extends Task {
    constructor(obj){
        super(obj);
        this._oUDs = [];
        this.set("type", "NHAC_GOI_HANG");
    }
    onUpdateData = () => {
        this._oUDs.forEach(function(e){
            if(typeof e == "function"){
                e();
            }
        });
    }
    create_task = (description) => {
        this.set("description", description);
        this.set("status","TODO");
        this.save({}, {
            succress: (r, e) => {
                this.onUpdateData();
            }
        })
    }
    complete_task = () => {
        this.set("status","DONE");
        this.save({}, {
            success: (r, e) => {
                this.onUpdateData();
            }
        })
    }
    delete_task = () => {
        this.destroy({success: () =>{
            this.onUpdateData();
        }})
    }
}

class ModelTasks {
    constructor(query){
        this.query = query;
        var that = this;
        that.tasks = [];
        $.get("/api/tasks?" + serialize(query), function(data){
            data.forEach(function(e){
                that.tasks.push(new ModelCustomerTask(e));
            })
        })
    }
    init(){
        $.get("/api/tasks?" + serialize(this.query), function(data){
            data.forEach(function(e){
                that.tasks.push(new ModelCustomerTask(e));
                this.onUpdateData();
            })
        })
    }
    

}

// class ModelViewTasks extends ModelTasks {
//     create_task = (title, description, type) => {
//         var that = this;
//         var task = new Task();
//         task.set("title", title);
//         task.set("description", description);
//         task.set("type", type);
        
//         task.save({}, {
//             success: function(r, e){
//                 that.initTasks(title);
//             }
//         })
//     }
//     complete_task = (task_id, title) => {
//         var that = this;
//         var task = new Task({id: task_id});
//         task.set("status", "DONE");
//         task.save({}, {
//             success: function(r, e){
//                 that.initTasks(title);
//             }
//         })
//     }
//     delete_task = (task_id, title) => {
//         var that = this;
//         // console.log("deleting...")
//         var task = new Task({id: task_id});
//         task.destroy({
//             success: function(r, e){
//                 // alert("SUCCESS!");
//                 that.initTasks(title);
//             }
//         })
//     }
// }

class ModelCustomer {
    constructor(code_or_object){
        this.customer = {}
        if( typeof code_or_object == "string"){
            this.customer.origin = new Customer({ code: code_or_object });
            this.customer.kiot = {};
            this.customer.code = code_or_object;
        } else if (typeof code_or_object == "object"){
            this.customer.origin = new Customer(code_or_object.origin || {});
            this.customer.kiot = code_or_object.kiot || {};
            this.customer.code = code_or_object.code || "";
        } else {
            this.customer.origin = new Customer();
            this.customer.kiot = {};
            this.customer.code = "";
        }
    }

    fetch = (next) => {
        var that = this;
        $.get("/creta/customer/" + this.customer.code, (data)=>{
            that.customer = data;
            if(typeof next == "function"){
                next();
            }
        })    
    }

    get = ( attribute ) => {
        if( attribute == "code" ){
            return this.customer.code;
        }
        
        if( this.customer.kiot[attribute] ){
            return this.customer.kiot[attribute];
        } 
        
        if (this.customer.origin.get(attribute)){
            return this.customer.origin.get(attribute);
        }
    }
    getName = () => {
        return this.get("name") || "";
    }
    getLastDate = () => {
        return moment(this.get("modifiedDate") || "").format("YYYY-MM-DD");
    }
    getDebt = () => {
        return this.get("debt") || 0;
    }
    getCode = () => {
        return this.get("code");
    }
}

class ModelCustomers {
    constructor(){        
        this.customers = [];        
    }
    fetch = () =>{
        var that = this;
        $.get("/creta/customer", function(data){
            data.forEach(function(customer){
                var c = new ModelCustomer(customer);
                that.customers.push(c);
            })
        });
    }
    filterByName(input){
        var regex_input = new RegExp(input, 'i');
        var result = this.customers;
        if(!input){
            return result;
        } else {
            result = this.customers.filter((customer) => {
                return  ( customer.getName().search(regex_input) > -1 ) ;
            }) 
            return result;
        }        
    }
}