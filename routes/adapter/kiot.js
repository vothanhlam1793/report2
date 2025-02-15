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

// Dữ liệu sau khi lấy hàng loạt sẽ được lưu ở đây 100%
var customers = [];
var invoices = [];

async function getFullCustomer(pNew) {
    // Lấy dữ liệu với số lượng lớn
    if(pNew){
        // Khi nào đúng thì nó mới tải lại hàng loạt rồi gởi ra
        var data = await getFull("https://public.kiotapi.com/customers?includeTotal=1&includeCustomerSocial=1&includeCustomerGroup=1");
        customers = data;
    }
    return customers;
}

var dateCounter = ((new Date()).getTime() - 86400*1000*90);
var dateCounterLast = 0;
var dateCounterCounter = 0;
async function getFullInvoice(pNew) {
    if(pNew){
        if(dateCounterCounter == 0){
            dateCounterCounter += 1;
        } else {
            dateCounter = dateCounterLast;
        }
        var data = await getFull(`https://public.kiotapi.com/invoices?lastModifiedFrom=${(new Date(dateCounter)).toISOString()}`);
        dateCounterLast = (new Date()).getTime();
        data.forEach(function(inv1){
            var temp = false;

            invoices.forEach(function(inv2){
                if(inv1.code == inv2.code){
                    inv2.status = inv1.status;
                    temp = true;
                }
            });
            if(temp == false){
                invoices.push(inv1);
            }
        });
        invoices = invoices.filter(function(invoice){
            return invoice.status != 2;
        })
        // invoices = data;
    }
    return invoices;
}
console.log("Đây là chỗ tải lần đầu");
getFullCustomer(true);
getFullInvoice(true);

// Định kỳ nó phải lấy hết data của kiotviet để cập nhật - nó hơi ngu học thì phải :v
setInterval(function(){
    getFullInvoice(true);
}, 2*60000);
setInterval(function(){
    getFullCustomer(true);
}, 120*60000);

module.exports.getKiotViet = getKiotViet;
module.exports.getFull = getFull;
module.exports.getFullCustomer = getFullCustomer;
module.exports.getFullInvoice = getFullInvoice;