var fetch = require("node-fetch");
class SheetGoogle {
    constructor(url, sheetName){
        this.url = url;
        this.sheetName = sheetName;
    }
    fetch = async () => {
        var res = await fetch(this.url + "?sheetName=" + this.sheetName);
        var data = await res.json();
        return data;
    }
}

module.exports.SheetGoogle = SheetGoogle;