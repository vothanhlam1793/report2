// Show my task
function ShowTask(el, mix){
    return new Vue({
        el: "#show-task",
        data: {
            // models: {},
            tasks: [],
            btnDeleteTask: function(){},
        },
        methods: {
            // Cap nhat giao dien
            drawTable: function(){
                this.tasks = this.model.tasks;
            }
        },
        // Khoi tao doi tuong ban dau - bo qua lop controller
        created: function(){
            this.model = new ModelShowTask();
            this.model.onUpdateData=this.drawTable;
            this.btnDeleteTask = this.model.deleteTask;
        }
    })
}

class ModelShowTask{
    constructor(){
        var that = this;
        this.tasks = [];
        this.onUpdateData = function(){}
        this.fetchData();
    }
    // Cap nhat data
    fetchData = () => {
        var that = this;
        $.get("/api/tasks", function(data){
            that.tasks = data;
            that.onUpdateData();
        });
    }
    deleteTask = (id)=>{
        var that = this;
        var t = new Task({id: id});
        t.destroy({
            success: function(){
                that.fetchData();
            }
        })
    }
}