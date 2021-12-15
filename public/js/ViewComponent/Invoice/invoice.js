// Cần các Model ở public/js/ViewModel/Invoice/ để hoạt động

// Các component hỗ trợ theo dõi đơn hàng (invoice):

// 1. invoice-packages : Thay đổi số lượng đóng gói của đơn hàng. 
//   - props: ['code'] (mã hóa đơn)

// 2. send-invoice-sms : Điều chỉnh và gửi tin nhắn tới khách hàng, dựa trên thông tin cung cấp từ hóa đơn.
//   - props: ['code'] (mã hóa đơn)

// 3. create-customer-note : Tạo Note cho khách hàng.
//   - props: ['code'] (mã khách hàng)
  
// 4. customer-notes : xem, hoàn thành, xóa các note khách hàng.
//   - props: ['code'] (mã khách hàng)

// 5. change-invoice-status : đổi trạng thái đơn hàng
//   - props: ['code'] (mã hóa đơn)

// 6. save-barcodes-product : lưu barcode cho sản phẩm theo đơn hàng
//   - props: ['invoice_code', 'product_code'] (mã hóa đơn, mã sản phẩm)


Vue.component('invoice-packages', {
    props: ['code'],
    data: function(){
        return {
            invoiceModel : new ModelInvoicePackage(),
            package_count: 0
        }
    },
    methods: {
        save_package_count: function(package_count){
            if(this.invoiceModel.invoice.code){
                this.invoiceModel.save_package_count(package_count, this.invoiceModel.invoice.code);
            }
            else {
                console.log("code cannot be empty");
            }
            
        },
        get_package_count: function(){
            return this.invoiceModel.get_package_count();
        },
        onUpdateData: function(){
            this.package_count = this.invoiceModel.get_package_count();
            this.$forceUpdate();
        }
    },
    template:`
        <div>
            <h3>Số kiện hàng</h3>
            <input v-model="package_count" type="number">
            <button @click="save_package_count(package_count)">Lưu</button>
        </div>
    `,
    created(){
        this.invoiceModel.onUpdateData = this.onUpdateData;
        this.invoiceModel.initInvoice(this.code);  
        
    }
})

Vue.component('send-invoice-sms', {
    props:['code'],
    data: function(){
        return {
            to: "",
            msg: "",
            msg_count: "",
            invoiceModel : new ModelInvoiceSMS()
        }
    },
    methods: {
        onUpdateData: function(){

            this.to = this.invoiceModel.get_to();
            this.msg_count = this.invoiceModel.get_msg_count();

            this.$forceUpdate();
        },
        
        send_SMS: function(to, msg){
            this.invoiceModel.send_SMS(to, msg, this.msg_count, this.code);
        },
        open_box: function(){
            // console.log("Here");
            // console.log(jQuery("#modal"+this.code));
            jQuery("#modal-send-invoice-sms" + this.code).toggle();
            // if(!this.customer.code){
            //     var that = this;
            //     $.get("/creta/customer/"+this.code, function(data){
            //         that.customer = data;
            //     })
            // }
        }
    },
    template: `
    <div>
        <button class="btn btn-info" @click="open_box()">Gửi SMS <span class="badge badge-light">{{ msg_count }}</span></button>
        <!-- The Modal -->
        <div class="modal" :id="'modal-send-invoice-sms'+code">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                <!-- Modal Header -->
                <div class="modal-header ">
                    <h4 class="modal-title">Gửi tin nhắn</h4>
                    <button type="button" @click="open_box()">&times;</button>
                </div>
                <!-- Modal body -->
                <div class="modal-body">
                    <table class="table table-bordered">
                        <tbody>
                            <tr>
                                <td>Gửi tin nhắn đến số: </td>
                                <td><input class="form-control" v-model="to"></td>    
                            </tr>
                            <tr>
                                <td>Đơn hàng: </td>
                                <td>{{ invoiceModel.invoice_kiot.code }}</td>    
                            </tr>
                            <tr>
                                <td>Lần gửi: </td>
                                <td>{{ msg_count }}</td>    
                            </tr>
                            <tr>
                                <td>Nội dung: </td>
                                <td><textarea class="form-control" v-model="msg" rows="3"></textarea></td>    
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- Modal footer -->
                <div class="modal-footer">
                    <button class="btn btn-success" @click="send_SMS(to, msg)">Gửi</button>
                    <button type="button" class="btn btn-danger" @click="open_box()">Close</button>
                </div>
                </div>
            </div>
        </div>
    </div>
    `,
    created(){
        this.msg = "Đơn hàng " + this.code + " đã sẵn sàng tại kho CRETA. Đơn hàng sẽ sớm vận chuyển. Cảm ơn bạn đã ủng hộ CRETA.";
        this.invoiceModel.onUpdateData
         = this.onUpdateData;
        this.invoiceModel.initInvoice(this.code);
    }
})

Vue.component("create-customer-note", {
    props: ['code'],
    data: function(){
        return {
            task_description: "",
            customerModel: new ModelCustomer(),
            taskModel: new ModelViewTasks()
        }
    },
    methods: {
        onUpdateData: function(){
            this.$forceUpdate();
        },
        create_customer_note: function(title, description, type){
            this.taskModel.create_task(title, description, type);
        },
        open_box: function(){
            // console.log("Here");
            // console.log(jQuery("#modal"+this.code));
            jQuery("#modal-create-customer-task"+this.code).toggle();
            // if(!this.customer.code){
            //     var that = this;
            //     $.get("/creta/customer/"+this.code, function(data){
            //         that.customer = data;
            //     })
            // }
        }
    },
    template: `
        <div>
            <button class="btn btn-info" @click="open_box()">Thêm ghi chú</button>
            <!-- The Modal -->
            <div class="modal" :id="'modal-create-customer-task'+code">
                <div class="modal-dialog">
                    <div class="modal-content">
                    <!-- Modal Header -->
                    <div class="modal-header ">
                        <h4 class="modal-title">GHI CHÚ GỬI HÀNG</h4>
                        <button type="button" @click="open_box()">&times;</button>
                    </div>
                    <!-- Modal body -->
                    <div class="modal-body">
                        <div>
                            <span>Khách hàng: </span><span><strong>
                            {{ customerModel.customer.kiot? customerModel.customer.kiot.name : "" }}</strong></span>
                            <textarea class="form-control" v-model="task_description"></textarea>
                        </div>
                    </div>
                    <!-- Modal footer -->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" @click="create_customer_note(code, task_description, 'NHAC_GOI_HANG'), open_box()">Lưu</button>
                        <button type="button" class="btn btn-danger" @click="open_box()">Close</button>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    created(){
        this.taskModel.onUpdateData = this.onUpdateData;
        this.customerModel.initCustomer(this.code);
        this.taskModel.initTasks(this.code);
    }
})

Vue.component("customer-notes", {
    props: ['code'],
    data: function(){
        return {
            taskModel: new ModelViewTasks(),
            customerModel: new ModelCustomer()
        }
    },
    methods: {
        onUpdateData: function(){
            this.$forceUpdate();
        },
        complete_task: function(task_id, title){
            this.taskModel.complete_task(task_id, title);
        },
        delete_task: function(task_id, title){
            this.taskModel.delete_task(task_id, title);
        }
    },
    template: `
        <div>
            <h5><strong>{{ customerModel.customer.kiot? customerModel.customer.kiot.name : "" }}</strong> - có ghi chú sau: </h5>
            <table class="table table-bordered">
                
                <tbody>
                    <tr v-for="(task, index) in taskModel.tasks">
                        <td>{{ index + 1 }}</td>
                        <td>{{ task.description }}</td>
                        <td><button class="btn btn-success" @click="complete_task(task.id, code)" :disabled="(task.status == 'DONE') ? true : false ">{{ (task.status == "DONE") ? "Đã hoàn thành" : "Hoàn thành"}}</button></td>
                        <td><button class="btn btn-danger" @click="delete_task(task.id, code)">Xóa</button></td>
                    </tr>    
                </tbody>    
            </table>
        </div>
    `,
    created(){
        this.taskModel.onUpdateData = this.onUpdateData;
        this.customerModel.initCustomer(this.code);
        this.taskModel.initTasks(this.code);
    }
})

Vue.component('change-invoice-status', {
    props: ["code"],
    data: function(){
        return {
            // View
            statuss: [{
                title: "Mới lên đơn",
                value: 1
            },{
                title: "Đã soạn hàng",
                value: 2
            },{
                title: "Đã đóng hàng",
                value: 3
            },{
                title: "Đã giao hàng",
                value: 4
            },{
                title: "Khách đã nhận",
                value: 5
            }],

            // Model
            invoiceModel: new ModelInvoiceStatus(this.code)
        }
    },
    methods: {
        // Model - VM Functions

        change_invoice_status: function(status){
            this.invoiceModel.changeInvoiceStatus(status, this.code);
        },
        onUpdateData: function(){
            this.$forceUpdate();
        },

        // View Functions Only
        open_box: function(){
            jQuery("#modal-change-invoice-status"+this.code).toggle();
        },

        compare_value( invoiceValue, value){
            return (invoiceValue == value);
        },

        getTitleByStatus (iStatus){
            var title = "Mới lên đơn";
            this.statuss.forEach( (status) => {
                if(iStatus == status.value){
                    title = status.title;
                }
            })
            return title;
        }
    },
    template: `
        <div>
            <button class="btn btn-info" @click="open_box()">Trạng thái đơn hàng</button>
            <!-- The Modal -->
            <div class="modal" :id="'modal-change-invoice-status' + code">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <!-- Modal Header -->
                        <div class="modal-header ">
                            <h4 class="modal-title">TRẠNG THÁI ĐƠN HÀNG</h4>
                            <button type="button" @click="open_box()">&times;</button>
                        </div>
                        <!-- Modal body -->
                        <div class="modal-body">
                            <div v-for="status in statuss">
                                <button class="btn btn-block" :class="{ 'btn-info' : (invoiceModel.invoice.status == status.value), 'btn-outline-info' : !(invoiceModel.invoice.status == status.value)}" @click="change_invoice_status(status.value)">{{ status.title }}</button>
                            </div>
                            
                        </div>
                        <!-- Modal footer -->
                        <div class="modal-footer">
                            
                            <button type="button" class="btn btn-danger" @click="open_box()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    created(){
        // Init
        // Bind with model
        this.invoiceModel.onUpdateData = this.onUpdateData;
        // this.init_component();
    }
})

Vue.component('save-barcodes-product', {
    props: ['invoice_code', 'product_code'],
    data: function(){
        return{
            productBarcodesModel : new ModelProDuctBarcodes(this.product_code, this.invoice_code),
            new_barcode: ""
        }
    },
    methods: {
        init_component: function(){
            // console.log(this.invoice_code, this.product_code);
        },
        onUpdateData: function(){
            this.$forceUpdate();
        },
        delete_barcode: function(barcode){
            if(barcode.length == 0){
                // console.log("barcode ko duoc de trong");
            } else{
                this.productBarcodesModel.deleteInvoiveProductBarcode(this.invoice_code, this.product_code, barcode);
            }                    
        },
        add_barcode: function(barcode){
            if(barcode.length == 0){
                // console.log("barcode ko duoc de trong");
            }
            else {
                this.productBarcodesModel.addInvoiceProductBarcode(this.invoice_code, this.product_code, this.getName(this.product_code, this.productBarcodesModel.invoiceKiot) , barcode);
            }                    
        },
        getName: function(productCode, invoice){
            var result = "";
            if(invoice.invoiceDetails){
                invoice.invoiceDetails.forEach((product) => {
                    if(product.productCode == productCode){
                        result = product.productName;
                    }
                })
            }                    
            return result;
        },
        // View Functions Only
        open_box: function(){
            jQuery("#modal-save-barcodes-product"+this.product_code).show();
            f1 = this.add_barcode;
        },
        close_box: function(){
            jQuery("#modal-save-barcodes-product"+this.product_code).hide();
            f1 = function(){}
        },
    },
    template: `
        <div>
            <button class="btn btn-info" @click="open_box()">Nhập code <span class="badge badge-light">{{ productBarcodesModel.invoiceProductBarcodes.length }}</span> </button>
            <!-- The Modal -->
            <div class="modal" :id="'modal-save-barcodes-product' + product_code">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <!-- Modal Header -->
                        <div class="modal-header ">
                            <h4 class="modal-title">{{ invoice_code }} - {{ getName(product_code, productBarcodesModel.invoiceKiot) }}</h4>
                            <button type="button" @click="close_box()">&times;</button>
                        </div>
                        <!-- Modal body -->
                        <div class="modal-body">
                            <div v-for="barcode in productBarcodesModel.invoiceProductBarcodes" class="text-center alert alert-info">
                                <strong>{{ barcode.code }}</strong> <button @click="delete_barcode(barcode.code)">&times;</button>
                            </div>
                            
                            <div>
                                <strong>Nhập tay: </strong><input class="form-control" v-model="new_barcode" @keyup.enter="add_barcode(new_barcode)">
                                <button class="btn btn-warning" @click="add_barcode(new_barcode)">Thêm</button>
                            </div>
                        </div>
                        <!-- Modal footer -->
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger" @click="close_box()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    created(){
        this.productBarcodesModel.onUpdateData = this.onUpdateData;
        this.init_component()                
        // this.productBarcodesModel.initProductBarcodes(this.productCode, this.invoiceCode);
    }
})

Vue.component("customer-notes-count", {
    props: ['code'],
    data: function(){
        return {
            tasksModel: new ModelTasks({title: this.code}),
            // customerModel: new CretaCustomer({ code: this.code })
        }
    },
    methods: {
        onUpdateData: function(){
            this.$forceUpdate();
        }
    },
    template: `
        <div>
            <span class="badge" :class="{ 'badge-danger': ( tasksModel.tasks.length > 0 )}">{{ ( tasksModel.tasks.length > 0 ) ? tasksModel.tasks.length : "" }}<span>
        </div>
    `,
    created(){
        // this.customerModel.fetch();
        this.tasksModel.onUpdateData = this.onUpdateData;
        // this.tasksModel.tasks.forEach( (taskModel) => {
        //     taskModel._oUDs.push(tasksModel.init())
        // })
    }
})

Vue.component('change-invoice-status-2', {
    props: ["code"],
    data: function(){
        return {
            // View
            statuss: [{
                title: "Mới lên đơn",
                value: 1,
                style: "btn-danger"
            },{
                title: "Đã soạn hàng",
                value: 2,
                style: "btn-warning"
            },{
                title: "Đã đóng hàng",
                value: 3,
                style: "btn-primary"
            },{
                title: "Đã giao hàng",
                value: 4,
                style: "btn-info"
            },{
                title: "Khách đã nhận",
                value: 5,
                style: "btn-success"
            }],

            // Model
            invoiceModel: new ModelInvoiceStatus(this.code)
        }
    },
    methods: {
        // Model - VM Functions

        change_invoice_status: function(status){
            this.invoiceModel.changeInvoiceStatus(status, this.code);
        },
        onUpdateData: function(){
            this.$forceUpdate();
        },

        // View Functions Only
        open_box: function(){
            jQuery("#modal-change-invoice-status"+this.code).toggle();
        },

        compare_value( invoiceValue, value){
            return (invoiceValue == value);
        },

        getTitleByStatus (iStatus){
            var title = "Mới lên đơn";
            this.statuss.forEach( (status) => {
                if(iStatus == status.value){
                    title = status.title;
                }
            })
            return title;
        },

        getStyleByStatus (iStatus){
            var style = "btn-danger";
            this.statuss.forEach( (status) => {
                if(iStatus == status.value){
                    style = status.style;
                }
            })
            return style;
        }
    },
    template: `
        <div>
            <button class="btn" :class="[getStyleByStatus(invoiceModel.invoice.status)]" @click="open_box()">{{ getTitleByStatus(invoiceModel.invoice.status) }}</button>
            <!-- The Modal -->
            <div class="modal" :id="'modal-change-invoice-status' + code">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <!-- Modal Header -->
                        <div class="modal-header ">
                            <h4 class="modal-title">TRẠNG THÁI ĐƠN HÀNG</h4>
                            <button type="button" @click="open_box()">&times;</button>
                        </div>
                        <!-- Modal body -->
                        <div class="modal-body">
                            <div v-for="status in statuss">
                                <button class="btn btn-block" :class="{ 'btn-info' : (invoiceModel.invoice.status == status.value), 'btn-outline-info' : !(invoiceModel.invoice.status == status.value)}" @click="change_invoice_status(status.value)">{{ status.title }}</button>
                            </div>
                            
                        </div>
                        <!-- Modal footer -->
                        <div class="modal-footer">
                            
                            <button type="button" class="btn btn-danger" @click="open_box()">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    created(){
        // Init
        // Bind with model
        this.invoiceModel.onUpdateData = this.onUpdateData;
        
        // this.init_component();
    }
})