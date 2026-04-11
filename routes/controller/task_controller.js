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