var fetch = require("node-fetch");
var url_shortlink = "https://creta.link";
class Shortlink {
    constructor(link){
        this.link = link;
        this.webhooks = [];
    }
    addWebhook = (wh) => {
        return this.webhooks.push(wh);
    }
    setWebhook = (whs)=>{
        this.webhooks = whs;
    }
    general = async () => {
        var ret = await fetch(url_shortlink + "/general", {
            method: "POST"
        });
        var res = await ret.json();
        this.short = res.short;
        return res;
    }
    create = async () => {
        if(this.short == undefined){
            await this.general();
        }
        var ret = await fetch(url_shortlink + "/", {
            method: "POST",
            body: JSON.stringify({
                long: this.link,
                short: this.short,
                webhooks: this.webhooks
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        var res = await ret.json();
        this.url = url_shortlink + "/" + this.short
        return res;
    }
}

module.exports.Shortlink = Shortlink;