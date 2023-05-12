var fetch = require("node-fetch");
var objToken = {
    date: new Date("2000-01-01"),
    token: ""
};
async function getToken(){
    if(((new Date()).getTime() - objToken.date.getTime()) > 85000*1000){
        var res = await fetch("https://id.kiotviet.vn/connect/token", {
            method: "POST",
            body: "scopes=PublicApi.Access&grant_type=client_credentials&client_id=bae3bcbe-c860-4bac-9e4a-0651dcf4bad0&client_secret=0D92F5E0DF1973CC5385348F42C665D8775E7468",
            headers:{
                "Content-Type": "application/x-www-form-urlencoded"
            } 
        });
        var data = await res.json();
        objToken.date = new Date();
        objToken.token = data.token_type + " " + data.access_token;
    } 
    return objToken.token;
}

async function getKiotViet(url){
    var token = await getToken();
    var res = await fetch(url, {
        method: "GET",
        headers: {
            Retailer: "cretasolu",
            Authorization: token
        }
    });
    var data = await res.json();
    return data;
}

obj = {
    total: 0,
    pageSize: 20,
    data: []
}

//currentItem

async function getFull(_url){
    function appendUrl(aurl, c, p){
        if(aurl.split("?").length == 2){
            var b = aurl.split("?");
            b[1] = b[1] + "&currentItem="+c+"&pageSize="+p;
            return b.join("?");
        } else {
            return aurl + "?currentItem="+c+"&pageSize="+p;
        }
    }
    var currentItem = 0;
    var pageSize = 100;
    var rData = [];
    data = await getKiotViet(appendUrl(_url, currentItem, pageSize));
    rData = rData.concat(data.data);
    for(var j = 1; j <= data.total/pageSize;j++){
        console.log(j, currentItem, data.data.length);
        currentItem = j*pageSize;
        data = await getKiotViet(appendUrl(_url, currentItem, pageSize));
        rData = rData.concat(data.data);
    }
    console.log(rData.length);
    return rData;
}

var customers = [];
var invoices = [];
async function getFullCustomer(pNew) {
    if(pNew){
        var data = await getFull("https://public.kiotapi.com/customers?includeTotal=1&includeCustomerSocial=1&includeCustomerGroup=1");
        customers = data;
    }
    return customers;
}
async function getFullInvoice(pNew) {
    if(pNew){
        var data = await getFull("https://public.kiotapi.com/invoices?lastModifiedFrom=2021-09-15T00:00:00");
        // console.log(data);
        invoices = data.filter(function(invoice){
            return invoice.status != 2;
        })
        // invoices = data;
    }
    return invoices;
}
getFullCustomer(true);
getFullInvoice(true);
setInterval(function(){
    getFullCustomer(true);
    getFullInvoice(true);
}, 10*60000);
module.exports.getKiotViet = getKiotViet;
module.exports.getFull = getFull;
module.exports.getFullCustomer = getFullCustomer;
module.exports.getFullInvoice = getFullInvoice;