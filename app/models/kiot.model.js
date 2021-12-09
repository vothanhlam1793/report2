var kiot = require("../../routes/adapter/kiot");
class CustomerKiot {
    constructor(code){
        this.code = code;
    }
    fetch = () => {
        return kiot.getKiotViet("https://public.kiotapi.com/customers/code/" + this.code + "?");
    }
    fetchAll = (pNew) => {
        return kiot.getFullCustomer(pNew);
    }
}

class InvoiceKiot {
    constructor(code){
        this.code = code;
    }
    fetch = () => {
        return kiot.getKiotViet("https://public.kiotapi.com/invoices/code/" + this.code + "?");
    }
    fetchAll = (pNew) => {
        return kiot.getFullInvoice(pNew);
    }
    // fetchByQuery = (query) => {
    //     var serialize = function(obj, prefix) {
    //     var str = [],
    //         p;
    //     for (p in obj) {
    //         if (obj.hasOwnProperty(p)) {
    //         var k = prefix ? prefix + "[" + p + "]" : p,
    //             v = obj[p];
    //         str.push((v !== null && typeof v === "object") ?
    //             serialize(v, k) :
    //             encodeURIComponent(k) + "=" + encodeURIComponent(v));
    //         }
    //     }
    //     return str.join("&");
    //     }
    //     return kiot.getKiotViet("https://public.kiotapi.com/invoices?" + serialize(query));
    // }
}

module.exports.CustomerKiot = CustomerKiot;
module.exports.InvoiceKiot = InvoiceKiot;