class Shortlink {
    constructor(link){
        if(link == undefined){
            return console.log("Cannot undefined link")
        }
        this.link = link;
        this.short = "";
        this.webhooks = [];
    }
    addWebhook = (wh)=>{
        this.webhooks.push(wh);
    }
    create = ()=>{
        $.post("/task/shortlink", {
            link: this.link,
            whs: JSON.stringify(this.webhooks)
        }, function(data){
            console.log(data);
        })
    }
}
class Monitor {
    constructor(obj){
        if(obj){
            this.task = new Task(obj)
        } else {
            this.task = new Task({
                type: "MONITOR"
            })
        }
    }
}

class Monitors{
    constructor(){
        var that = this;
        $.get("/api/tasks?type=MONITOR", function(data){
            data.forEach(function(task){
                that.tasks.push(new Monitor(task));
            })
        })
    }
}