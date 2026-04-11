var fetch = require("node-fetch");

var urlMain         = process.env.SHEET_URL_MAIN         || "";
var urlMinh         = process.env.SHEET_URL_MINH         || "";
var urlTelesale_Bao = process.env.SHEET_URL_TELESALE_BAO || "";
var urlTelesale_Huy = process.env.SHEET_URL_TELESALE_HUY || "";

async function getMinh(){
    console.log(await getSheet(urlTelesale_Huy + "?sheetName=REPORT"));
}
async function getSheet(url){
    var res = await fetch(url);
    var data = await res.json();
    return data;
}

// getMinh();

module.exports.getSheet = getSheet;
