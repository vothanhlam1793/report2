var app = new Vue({
    el: "#app",
    data: {

    },
    created: function(){
        var that = this;
        setInterval(()=>{
            that.counter += 1;
        }, 100)
    }
})