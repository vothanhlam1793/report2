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
    console.log(req.query);
    const Task = db.tasks;
    const id = req.query.id;
    var d = (new Date()).toLocaleDateString();
    Task.findById(id).then(data=>{
        console.log(data);
        if(data){
            console.log("HERE1", data)
            var temp = 1;
            if(data.result){
                console.log("HERE4", data)
                temp = data.result.counter + 1
            } else {
                data.result = {};
            }
            console.log("HERE5", data);
            var obj = [];
            if(data.result.byDate == undefined){
                console.log("HERE7", data);
                obj = [];
            } else {
                console.log("HERE6", data);
                obj = data.result.byDate;
            }
            console.log("HERE2")
            var t = false;
            obj.forEach(function(e){
                console.log("1", e);
                if(e.date == d){
                    e.temp = e.temp + 1
                    t = true;
                }
            })
            console.log("HERE3")
            if(t == false){
                obj.push({
                    date: d,
                    temp: 1
                });
            }
            data.result = {
                function: "UP",
                counter: temp,
                byDate: obj
            };
            data.save();
            console.log("HERE4")
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