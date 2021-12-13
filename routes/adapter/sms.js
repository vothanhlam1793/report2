var fetch = require("node-fetch");
class SMS{
    constructor(user, pass){
        this.url = "http://node.creta.work/playsms/index.php?app=ws&";
        this.user = user || "admin";
        this.pass = pass || "admin";
        this.token = "1035f3c394656b3d17c501cfe74fb68c";
        this.state = "INIT";
        this.getToken();
        this.messages = [];
    }
    startAuto = () => {
        for(var i = 0; i < this.messages.length; i++){
            console.log(this.messages[i]);
            if(this.messages[i].status != "OK"){
                this._send(i);
                return;
            }
        }
    }
    urlQuery = (o) => {
        var a = [];
        for (const [key, value] of Object.entries(o)) {
            a.push(key + "=" + value);
        }
        return this.url + a.join("&");
    }
    getToken = () => {
        var that = this;
        fetch(this.urlQuery({
            u: this.user,
            p: this.pass,
            op: "get_token"
        })).then(data => data.json()).then(data => {
            that.token = data.token;
            that.state = "READY";
            // setInterval(that.startAuto, that.time || 60000);
        })
    }
    send = async (phone, content) => {
        var res = await fetch(this.urlQuery({
            u: this.user,
            h: this.token,
            op: "pv",
            to: phone,
            msg: content,
        }));
        var ret = await res.json();
        return ret;
    }
    sendQueue = (phone, content) => {
        var t = (new Date()).getTime();
        var o = {
            phone: phone,
            message: content,
            code: t.toString(),
            status: "QUEUE",
        }
        this.messages.push(o);
        console.log("QUEUE:", o);
    }
    _send = (i) => {
        console.log("SEND:", i);
        var that = this;
        fetch(this.urlQuery({
            u: this.user,
            h: this.token,
            op: "pv",
            to: this.messages[i].phone,
            msg: this.messages[i].message,
        })).then(data=>data.json()).then(data=>{
            that.messages[i].status = data.data[0].status;
            that.messages[i].queue = data.data[0].queue;
            that.messages[i].smslog_id = data.data[0].smslog_id;
            that.messages[i].timestamp = data.timestamp;
        })
    }
}
var s = new SMS();
module.exports.SMS = SMS;