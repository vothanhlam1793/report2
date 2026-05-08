var kiot = require("../../routes/adapter/kiot");
class CustomerKiot {
    constructor(code){
        this.code = code;
    }
    fetch = () => {
        return kiot.getKiotViet("https://public.kiotapi.com/customers/code/" + this.code + "?");
    }
    fetchAll = (pNew) => {
        return kiot.getFullCustomer();
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
        return kiot.getFullInvoice();
    }
}

class ProductKiot {
    constructor(code){
        this.code = code;
    }
    fetch = () => {
        return kiot.getProductByCodeWithInventory(this.code);
    }
    fetchAll = (pNew) => {
        return kiot.getFullProduct();
    }
}

module.exports.CustomerKiot = CustomerKiot;
module.exports.ProductKiot = ProductKiot;
module.exports.InvoiceKiot = InvoiceKiot;
