var Task = Backbone.Model.extend({
    urlRoot: "/api/tasks"
})

var Customer = Backbone.Model.extend({
    urlRoot: "/api/customers"
})

var Note = Backbone.Model.extend({
    urlRoot: "/api/notes"
})

var Notes = Backbone.Collection.extend({
    model: Note,
})

class CustomerKiot{
    constructor(code){
        this.code = code;
        this.onUpdateData = function(){};
        var that = this;
        $.get("/api/kiot/customers/" + this.code, function(data){
            for(const [key, value] of Object.entries(data)){
                that[key] = value;
            }
            that.onUpdateData();
        })
    }
    bindUpdateData = (callback) => {
        this.onUpdateData = callback;
    }
}