
class ModelProDuctBarcodes {
    constructor(productCode, invoiceCode){
        this.productBarcodes = [];
        this.invoiceProductBarcodes = [];
        this.invoiceKiot = {}
        this.onUpdateData = function(){}
        this.initProductBarcodes(productCode, invoiceCode);
    }
    initProductBarcodes = (productCode, invoiceCode) => {
        this.getProductBarcodeByProductCode(productCode, invoiceCode);
        // console.log(invoiceCode);
        
        this.getInvoiceKiot(invoiceCode);
    }
    getInvoiceKiot = (invoiceCode) => {
        var that = this;
        $.ajax({
            url: "/api/kiot/invoices/" + invoiceCode,
            method: "GET",
            success: (data) => {
                that.invoiceKiot = data;
                // console.log(that.invoiceKiot);
                that.onUpdateData();
            }
        })
    }
    filterBarcodesByInvoice = (invoiceCode, barcodes) => {
        var that = this;
        var ipBarcodes = [];
        this.productBarcodes.forEach( barcode => {
            if(barcode.infos){
                var flag = false;
                barcode.infos.forEach( (info) =>{
                    if( info.code == invoiceCode ){
                        flag = true;
                    }
                })
                if (flag){
                    ipBarcodes.push(barcode);
                }
            }                    
        })
        return ipBarcodes;
    }
    getProductBarcodeByProductCode = (productCode, invoiceCode) => {
        var that = this;
        $.ajax({
            url: "/api/productBarcodes" + "?productCode=" + productCode,
            method: "GET",
            success: function(data){
                // console.log(data);
                that.productBarcodes = data;
                that.invoiceProductBarcodes = that.filterBarcodesByInvoice(invoiceCode, data);
                // console.log(that.invoiceProductBarcodes);
                that.onUpdateData();
            }
        })
    }
    addInvoiceProductBarcode = (invoiceCode, productCode, productName, code) => {
        console.log(invoiceCode, productCode, productName, code);
        var that = this;
        var info = {
            code: invoiceCode,
            type: "HOA DON",
            content: "Xuất hàng",
            date: moment().format()
        }
        
        $.ajax({
            url : "/api/productBarcodes" + "?productCode=" + productCode + "&code=" + code,
            method: "GET",
            success: function(barcodes){
                // console.log(barcodes);
                if( barcodes.length > 0 ){
                    console.log("1");
                    var product_barcode = new ProductBarcode({ id: barcodes[0].id});
                    if(barcodes[0].infos){
                        barcodes[0].infos.push(info);
                        product_barcode.set("infos", barcodes[0].infos);
                    }
                    else {
                        product_barcode.set("infos", [info]);
                    }
                    product_barcode.save({}, {
                        sucess: function(r, e){
                            console.log("success")
                            that.initProductBarcodes();
                        },
                        error: function(e){
                            console.log("err", e);
                        }
                    })
                }
                else {
                    // console.log("2");
                    var product_barcode = new ProductBarcode();
                    product_barcode.set("productCode", productCode);
                    product_barcode.set("productName", productName);
                    
                    product_barcode.set("code", code);
                    product_barcode.set("infos", [info]);
                    // console.log(product_barcode);
                    
                    product_barcode.save({}, {
                        success: function(r, e){
                            // console.log("succees")
                            // console.log(r);
                            that.initProductBarcodes(productCode, invoiceCode);
                        },
                        error: function(e){
                            console.log("err", e);
                        }
                    })
                }
            }
        })
    }
    deleteInvoiveProductBarcode = (invoiceCode, productCode, code) => {
        // console.log(invoiceCode, productCode, code);
        var that =this;
        $.ajax({
            url : "/api/productBarcodes" + "?productCode=" + productCode + "&code=" + code,
            method: "GET",
            success: function(barcodes){
                // console.log(barcodes);
                if( barcodes.length > 0 ){
                    var bc = barcodes[0].infos.filter((info)=>{
                        return (info.code != invoiceCode)                            
                    })
                    if( bc.length == barcodes[0].infos.length){

                    }
                    else{
                        var product_barcode = new ProductBarcode({id: barcodes[0].id});
                        product_barcode.set("infos", bc);
                        product_barcode.save({},{
                            success: function(r, e){
                                that.initProductBarcodes(productCode, invoiceCode);
                            }
                        })
                    }
                }
            }
        })
    }
}