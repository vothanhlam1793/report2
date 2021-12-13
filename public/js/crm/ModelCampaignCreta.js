var Campaign = Backbone.Model.extend({
    urlRoot: "/api/campaigns"
})

class Observer {
    constructor(){
        this._oUDs = [];
    }
    bindUpdateData = (cb) => {
        if(typeof cb == "function"){
            this._oUDs.push(cb);
        }
    }
    onUpdateData = () => {
        this._oUDs.forEach(function(f){
            f();
        })
    }
}

class RDigest extends Observer{
    constructor(type, obj){
        super();
        if(obj){
            this.campaign = new Campaign(obj)
        } else {
            this.campaign = new Campaign({
                type: type
            });
        }
    }
    create = () => {
        this.campaign.save({}, {
            success: function(){
                console.log("DONE");
            },
            error: function(){

            }
        })
    }
    save = () => {
        this.campaign.save({}, {
            success: function(){
                console.log("DONE");
            },
            error: function(){

            }
        })
    }
    getName = () => {
        return this.campaign.attributes.name;
    }
    getTag = () => {
        return this.campaign.attributes.tag;
    }
    getModules = () => {
        return this.campaign.attributes.modules || [];
    }
    addModule = (obj) => {
        if(this.campaign.attributes.modules == undefined){
            this.campaign.attributes.modules = [];
        }
        this.campaign.attributes.modules.push(obj);
    }
    removeModule = (i) => {
        this.campaign.attributes.modules.splice(i, 1);
    }
    getCampaigns = () => {
        var camp = this.campaign.attributes.campaigns || [];
        camp = camp.map(function(e){
            return new CretaCampaign(e);
        })
        console.log(camp);
        return camp;
    }
    addCampaign = (obj) => {
        if(this.campaign.attributes.campaigns == undefined){
            this.campaign.attributes.campaigns = [];
        }
        console.log(obj);
        this.campaign.attributes.campaigns.push({
            name: obj.getName(),
            tag: obj.getTag(),
            type: "CAMPAIGN"
        });
    }
    removeCampaign = (i) => {
        console.log(this);
        this.campaign.attributes.campaigns.splice(i, 1);
    }
    getModulesAvailable = () => {
        return [{
            name: "SMS-LINK",
            type: "MODULE_TEMPLATE"
        },{
            name: "ZALO-LINK",
            type: "MODULE_TEMPLATE"
        },{
            name: "MESSENGER-LINK",
            type: "MODULE_TEMPLATE"
        }]
    }
}

class Digest extends RDigest {
    constructor(obj){
        super("DIGEST", obj);
    }

}

class Digests {
    constructor(){
        var that = this;
        that.campaigns = [];
        $.get("/api/campaigns?type=DIGEST", function(data){
            data.forEach(function(e){
                that.campaigns.push(new Digest(e));
            })
        })
    }
}

class CretaCampaign  extends RDigest{
    constructor(obj){
        super("CAMPAIGN", obj);
    }
}

class CretaCampaigns {
    constructor(){
        var that = this;
        this.campaigns = [];
        $.get("/api/campaigns?type=CAMPAIGN", function(data){
            data.forEach(function(e){
                that.campaigns.push(new CretaCampaign(e));
            })
        })
    }
}