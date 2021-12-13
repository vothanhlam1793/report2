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
    create = (next)=>{
        var that = this;
        $.post("/task/shortlink", {
            link: this.link,
            whs: JSON.stringify(this.webhooks)
        }, function(data){
            that.url = data;
            if(typeof next == "function"){
                next();
            }
        })
    }
}

class Monitor{
    constructor(){
        this.task = new Task({type: "MONITOR"});
    }

    setLink = (link) => {
        this.shortlink = new Shortlink(link);
        var obj = {};
        try {
            obj = JSON.parse(this.task.get("description"));
        } catch (e) {

        }
        obj.link = link;
        this.task.set("description", JSON.stringify(obj));
    }

    create = () => {
        this.task.save({}, {
            success: function(){
                console.log("DONE");
            },
            error: function(){
                console.log("ERROR");
            }
        })
    }

    createMonitor = () => {
        var that = this;
        this.shortlink.addWebhook("http://node.creta.work:30004/task/wmonitor?id=" + this.task.get("id"));
        this.shortlink.create(function(){
            var obj = JSON.parse(that.task.get("description"));
            obj.short = that.shortlink.url;
            that.task.set("description", JSON.stringify(obj));
            that.create();
        });
    }
}

// class Monitor {
//     constructor(obj){
//         if(obj){
//             this.task = new Task(obj)
//         } else {
//             this.task = new Task({
//                 type: "MONITOR"
//             })
//         }
//     }
//     create = () => {
//         this.task.save({}, {
//             success: function(){
//                 console.log("DONE");
//             },
//             error: function(){
//                 console.log("ERROR");
//             }
//         })
//     }
//     setLink = (link) => {
//         this.task.set("description", link);
//     }
//     createMonitor = () => {
//         var that = this;
//         this.shortlink = new Shortlink(this.task.get("description"));
//         this.shortlink.addWebhook("http://node.creta.work:30004/task/wmonitor?id=" + this.task.get("id"));
//     }
// }

// class Monitors{
//     constructor(){
//         var that = this;
//         $.get("/api/tasks?type=MONITOR", function(data){
//             data.forEach(function(task){
//                 that.tasks.push(new Monitor(task));
//             })
//         })
//     }
// }