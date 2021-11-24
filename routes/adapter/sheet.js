var url= "https://script.google.com/macros/s/AKfycbyiL1biuCCIp6doX5Ab3d-DwXkHscStGMHezW3bUw9pMJUagyedKRbnmdHPpSr8gwd-/exec";
var urlMinh = "https://script.google.com/macros/s/AKfycbzd9fmojI-9ecwaxXRapnNs8kthPw6QCSZLf1Z85ttHFfURhehJNxF7_L9qicGpiDZYqA/exec";
var urlTelesale_Bao = "https://script.google.com/macros/s/AKfycbwnEuKnhbh6-UezE637HNBKLPTbD8yG-yiVtl6iwqkzm-YnujktoiCsbGYrQq8rJOGuwA/exec";
var urlTelesale_Huy = "https://script.google.com/macros/s/AKfycbzMoHB91SFTbPTNwzrOpiOEqH8rkUOD72hOK9tMTcyJ4uJli-kA0JVDbiYFixr98hyq/exec";
var fetch = require("node-fetch");

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
