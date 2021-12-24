Vue.component("create-customer-note", {
    props: ['code','customer','task_model'],
    data: function(){
        return {
            task_description: "",
            // customerModel: this._props.customer,
            // taskModel: new ModelCustomerTask({title: this.code})
        }
    },
    methods: {
        onUpdateData: function(){
            this.$forceUpdate();
        },
        // create_customer_note: function(title, description, type){
        //     this.taskModel.create_task(title, description, type);
        // },
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
                            {{ customer.getName() }}</strong></span>
                            <textarea class="form-control" v-model="task_description"></textarea>
                        </div>
                    </div>
                    <!-- Modal footer -->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" @click="task_model.create_task(task_description), open_box()">Lưu</button>
                        <button type="button" class="btn btn-danger" @click="open_box()">Close</button>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    created(){
        this.task_model._oUDs.push(this.onUpdateData);
    }
})

Vue.component("customer-notes", {
    props: ['code'],
    data: function(){
        return {
            tasksModel: new ModelTasks({title: this.code}),
            customerModel: new ModelCustomer({ code: this.code })
        }
    },
    methods: {
        onUpdateData: function(){
            this.$forceUpdate();
        }
    },
    template: `
        <div>
            <h5><strong>{{ customerModel.getKiotAttribute("name") }}</strong> - có ghi chú sau: </h5>
            <table class="table table-bordered">
                
                <tbody>
                    <tr v-for="(taskModel, index) in tasksModel.tasks">
                        <td>{{ index + 1 }}</td>
                        <td>{{ taskModel.get("description") }}</td>
                        <td><button class="btn btn-success" @click="taskModel.complete_task()" :disabled="(taskModel.get('status') == 'DONE') ? true : false ">{{ (taskModel.get('status') == "DONE") ? "Đã hoàn thành" : "Hoàn thành"}}</button></td>
                        <td><button class="btn btn-danger" @click="taskModel.delete_task()">Xóa</button></td>
                    </tr>    
                </tbody>    
            </table>
        </div>
    `,
    created(){
        this.customerModel.fetch();
        this.tasksModel.onUpdateData = this.onUpdateData;
        // this.tasksModel.tasks.forEach( (taskModel) => {
        //     taskModel._oUDs.push(tasksModel.init())
        // })
    }
})

Vue.component("create-customer-note-v2", {
    props: ['code','customer','task_model'],
    data: function(){
        return {
            task_description: "",
            // customerModel: this._props.customer,
            // taskModel: new ModelCustomerTask({title: this.code})
        }
    },
    methods: {
        onUpdateData: function(){
            this.$forceUpdate();
        },
        // create_customer_note: function(title, description, type){
        //     this.taskModel.create_task(title, description, type);
        // },
        open_box: function(){
            // console.log("Here");
            // console.log(jQuery("#modal"+this.code));
            jQuery("#modal-create-customer-task"+this.task_model.getType()+this.code).toggle();
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
            <button class="btn btn-info" @click="open_box()">{{ task_model.getType() }}</button>
            <!-- The Modal -->
            <div class="modal" :id="'modal-create-customer-task' + task_model.getType() + code">
                <div class="modal-dialog">
                    <div class="modal-content">
                    <!-- Modal Header -->
                    <div class="modal-header ">
                        <h4 class="modal-title">{{ task_model.getType() }}</h4>
                        <button type="button" @click="open_box()">&times;</button>
                    </div>
                    <!-- Modal body -->
                    <div class="modal-body">
                        <div>
                            <span>Khách hàng: </span><span><strong>{{ customer.getCode() }} - 
                            {{ customer.getName() }}</strong></span>
                            <textarea class="form-control" v-model="task_description"></textarea>
                        </div>
                    </div>
                    <!-- Modal footer -->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" @click="task_model.create_task(task_description), open_box()">Lưu</button>
                        <button type="button" class="btn btn-danger" @click="open_box()">Close</button>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    created(){
        this.task_model._oUDs.push(this.onUpdateData);
    }
})

Vue.component("customer-notes-v2", {
    props: ['code', 'customer', 'type'],
    data: function(){
        return {
            tasks_model: new ModelTasks({title: this.code, type: this.type}),
            // customerModel: new ModelCustomer({ code: this.code })
        }
    },
    methods: {
        onUpdateData: function(){
            this.$forceUpdate();
        }
    },
    template: `
        <div>
            <h5><strong>{{ customer.getName() }}</strong> - có ghi chú sau: </h5>
            <table class="table table-bordered">

                <tbody>
                    <tr v-for="(taskModel, index) in tasks_model.tasks">
                        <td>{{ index + 1 }}</td>
                        <td>{{ taskModel.get("description") }}</td>
                        <td><button class="btn btn-success" @click="taskModel.complete_task()" :disabled="(taskModel.get('status') == 'DONE') ? true : false ">{{ (taskModel.get('status') == "DONE") ? "Đã hoàn thành" : "Hoàn thành"}}</button></td>
                        <td><button class="btn btn-danger" @click="taskModel.delete_task()">Xóa</button></td>
                    </tr>    
                </tbody>    
            </table>
        </div>
    `,
    created(){
        // console.log(this.tasks_model); 
        // this.tasks_model.init();
    }
})