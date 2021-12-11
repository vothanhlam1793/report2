
class ModelInvoice {
    constructor(){
        // this.ready = false;
        this.invoice = {};
        this.invoice_kiot = {};
        this.onUpdateDate = function(){};
    }
    initInvoice = (code) => {
        var that = this;
        $.ajax({
            url: "/api/invoices/code/" + code,
            method: "GET",
            success: (data) => {
                that.invoice = data;
                that.onUpdateData();
            }
        })
        $.ajax({
            url: "/api/kiot/invoices/" + code,
            method: "GET",
            success: (data) => {
                that.invoice_kiot = data;
                that.onUpdateData();
            }
        })
    }
}

class ModelInvoicePackage extends ModelInvoice {

    save_package_count = (package_count, invoiceCode) => {
        var that = this;
        if(this.invoice.id){
            // console.log(this.invoice.id);
            var invoice = new Invoice({id : this.invoice.id});
            if(this.invoice.notes){
                if (this.invoice.notes.length > 0){
                    var count = 0;
                    this.invoice.notes.forEach((note) => {                                
                        if(note.type == "SO_KIEN_HANG"){
                            count++;
                            note.value = package_count;
                        }
                    })
                    if (count == 0){
                        this.invoice.notes.push({
                            type: "SO_KIEN_HANG",
                            value: package_count
                        })
                    }
                } else {
                    this.invoice.notes.push({
                        type: "SO_KIEN_HANG",
                        value: package_count
                    })
                }
            } else {
                var invoiceNotes = [{
                    type: "SO_KIEN_HANG",
                    value: package_count
                }]
                this.invoice.notes = invoiceNotes;
            }                        
            
            invoice.set("notes", this.invoice.notes);
            
        }
        else {
            var invoice = new Invoice();
            var invoiceNotes = [{
                type: "SO_KIEN_HANG",
                value: package_count
            }]
            invoice.set("notes", invoiceNotes);
        }
        invoice.set("code", invoiceCode);
        
        invoice.save({},{
            success: function(r, e){
                that.initInvoice(invoiceCode);
                alert("SUCCESS: " + invoiceCode);

            }
         })
    }
    get_package_count = () => {
        var notes = this.invoice.notes;
        var result = 0;
        if(notes){
            if(notes.length > 0){
                notes.forEach( (note) => {
                    if(note.type == "SO_KIEN_HANG"){
                        result = note.value;
                    }
                })
            }
        }
        return result;
    }
}

class ModelInvoiceSMS extends ModelInvoice {
    send_SMS = (to, msg, msg_count, invoiceCode) => {
        var that = this;
        var url="http://data.creta.work/creta/action/playsms/send_sms.php";
        $.get(url + "?to=" + to + "&msg=" + msg, function(data){
            // console.log(data);
            if(true){
                if(that.invoice.id){
                    // console.log(that.invoice.id);
                    var invoice = new Invoice({id : that.invoice.id});
                    if(that.invoice.actions){
                        that.invoice.actions.push({
                            type: "SEND_SMS",
                            status: "OK",
                            value: msg_count + 1
                        })
                    } else {
                        var invoiceActions = [{
                            type: "SEND_SMS",
                            status: "OK",
                            value: msg_count + 1
                        }]
                        that.invoice.actions = invoiceActions;
                    }                        
                    invoice.set("actions", that.invoice.actions);
                }
                else {
                    var invoice = new Invoice();
                    var invoiceActions = [{
                        type: "SEND_SMS",
                        status: "OK",
                        value: msg_count + 1
                    }]
                    invoice.set("actions", invoiceActions);
                }
                invoice.set("code", invoiceCode);
                invoice.save({},{
                    success: function(r, e){
                        that.initInvoice(invoiceCode);
                        alert("SUCCESS: " + invoiceCode);
                    }
                })
            }
        } )
    }
    get_msg_count = () => {
        var result = 0;
        if(this.invoice.actions){
            if (this.invoice.actions.length > 0){
                var actions_sms = this.invoice.actions.filter((action)=> {
                    return action.type == "SEND_SMS";
                })

                result = actions_sms.length;
            }
        }
        return result;
    }
    get_to = () => {
        var result = "";
        if(this.invoice_kiot.invoiceDelivery){
            result = this.invoice_kiot.invoiceDelivery.contactNumber || "";
        }
        return result;
    }
}

class ModelInvoiceStatus extends ModelInvoice {
    changeInvoiceStatus = (status, code) => {
        var that = this;
        if(this.invoice.id){
            var inv = new Invoice({id: this.invoice.id});
        } else {
            var inv = new Invoice();
        }
        inv.set("status", status);
        inv.set("code", code);
        inv.save({}, {
            success: function(r, e){
                that.initInvoice(code);
                that.onUpdateData();
            }
        })
    }
}

class ModelInvoices {
    constructor(){
        this.invoices = [];
        this.kiot_invoices = [];
        this.onUpdateData = function(){};
    }
    initInvoices = () => {
        
        this.getAllInvoices();
        this.getAllInvoicesKiot();
    }
    getAllInvoicesKiot = () => {
        
        var that = this;
        $.ajax({
            url: "/api/kiot/invoices",
            method: "GET",
            success: function(data){
                that.kiot_invoices = data;
                that.getInvoicesBetweenDates(moment().format("YYYY-MM-DD"), moment().format("YYYY-MM-DD"))
                that.onUpdateData();
            }
        })
    }
    getAllInvoices = () => {
        
        var that = this;
        $.ajax({
            url: "/api/invoices",
            method: "GET",
            success: function(data){
                that.invoices = data;
                that.onUpdateData();
            }
        })
    }
}

class ModelFilteredInvoices extends ModelInvoices {
    constructor(){
        super();
        this.kiot_filtered_invoices = [];
    }
    getDaysBetweenDates = (firstDate, lastDate) => {
        var result = [];
        try {
            var firstDay = moment(firstDate);
            var lastDay = moment(lastDate);
            var tempDay = firstDay;
            if(firstDay > lastDay){

            } else {
                var count = 0;
                while (tempDay <= lastDay){
                    result.push(moment(tempDay).format("YYYY-MM-DD"))
                    tempDay = moment(tempDay).add(1, "days");
                }                    
            }
        } catch(err){
            console.log(err);
        }
        return result;
    }
    getInvoicesByDays = (arrayOfDays) =>  {
        var result = [];
        var that = this;
        arrayOfDays.forEach( (day) => {
            that.kiot_invoices.forEach( (invoice) => {
                if(moment(invoice.purchaseDate).format("YYYY-MM-DD") == moment(day).format("YYYY-MM-DD")){
                    result.push(invoice);
                }
            } )
        });
        return result;
    }
    getInvoicesBetweenDates = (firstDate, lastDate) => {    
        console.log(firstDate, lastDate);
        var arrayOfDays = this.getDaysBetweenDates(firstDate, lastDate);
        var invoices = this.getInvoicesByDays(arrayOfDays);
        this.kiot_filtered_invoices = invoices;
        this.onUpdateData();
    }
}

class ModelCustomer {
    constructor(){
        this.customer = {}
        this.onUpdateData = function(){}
    }
    initCustomer = (code) => {
        var that = this;
        $.get("/creta/customer/" + code, function(data){
            that.customer = data;
            that.onUpdateData();
        })
    }
}

class ModelTasks {
    constructor(){
        this.tasks = []
        this.onUpdateData = function(){}
    }
    initTasks = (title) => {
        var that = this;
        $.get("/api/tasks?title=" + title, function(tasks){
            that.tasks = tasks;
            that.onUpdateData();
        })
    }
}

class ModelViewTasks extends ModelTasks {
    create_task = (title, description, type) => {
        var that = this;
        var task = new Task();
        task.set("title", title);
        task.set("description", description);
        task.set("type", type);
        
        task.save({}, {
            success: function(r, e){
                that.initTasks(title);
            }
        })
    }
    complete_task = (task_id, title) => {
        var that = this;
        var task = new Task({id: task_id});
        task.set("status", "DONE");
        task.save({}, {
            success: function(r, e){
                that.initTasks(title);
            }
        })
    }
    delete_task = (task_id, title) => {
        var that = this;
        // console.log("deleting...")
        var task = new Task({id: task_id});
        task.destroy({
            success: function(r, e){
                // alert("SUCCESS!");
                that.initTasks(title);
            }
        })
    }
}
