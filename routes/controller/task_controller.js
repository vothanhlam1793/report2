exports.getBasic = function(req, res){
    res.render("task/index", {
        title: "Công việc",
        query: req.query,
        page: ""
    })
}

exports.create = function(req, res){
    res.render("task/index", {
        title: "Công việc",
        query: req.query,
        page: "CREATE"
    })
}

// Monitor task monitor
const db = require("../../app/models");
exports.monitor = function(req, res){
    const Task = db.tasks;
    const id = req.query.id;
    Task.findById(id).then(data=>{
        if(data){
            console.log(data);
            var temp = 1;
            if(data.result){
                temp = data.result.counter + 1
            }
            data.result = {
                function: "UP",
                counter: temp
            };
            data.save();
            res.send(data);
        } else {
            res.send({
                message: "NOT FOUND"
            });
        }
    }).catch(e=>{
        
    })
}

exports.viewMonitor = (req, res)=>{
    res.render("monitor/index", {
        title: "Monitor"
    })
}

var Shortlink = require("../adapter/shortlink").Shortlink;
exports.getShortlink = async (req, res) => {
    console.log(req.body);
    var s = new Shortlink(req.body.link);
    s.setWebhook(JSON.parse(req.body.whs));
    var d = await s.create();
    if(d.data == "OK"){
        res.send(s.url);
    } else {
        res.send(d);
    }
}