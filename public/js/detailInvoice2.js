var Invoice = Backbone.Model.extend({
  urlRoot: '/api/invoices'
})

var ProductBarcode = Backbone.Model.extend({
  urlRoot: '/api/productBarcodes'
})
class ModelInvoice {
  constructor(code) {
    this.invoice = {}
    this.invoice_kiot = {}
    // this.invoice_products = [];
    this.onUpdateData = function () {}
    this.getInvoiceByCode(code)
  }
  getInvoiceByCode = code => {
    $.ajax({
      url: '/api/invoices/code/' + code,
      method: 'GET',
      success: data => {
        this.invoice = data
      }
    })
    $.ajax({
      url: '/api/kiot/invoices/' + code,
      method: 'GET',
      success: data => {
        this.invoice_kiot = data
      }
    })
  }
  getAllInvoiceProducts = invoiceCode => {
    var that = this

    $.ajax({
      url: '/api/invoiceProducts' + '?invoiceCode=' + invoiceCode,
      method: 'GET',
      success: function (data) {
        that.invoice_products = data
      }
    })
  }

  addInvoiceProductCode = (invoiceCode, productCode, code) => {
    $.ajax({
      url:
        '/api/invoiceProducts' +
        '?invoiceCode=' +
        invoiceCode +
        '&productCode=' +
        productCode,
      method: 'GET',
      success: function (data) {
        if (data.length > 0) {
          var ip = new InvoiceProduct({ id: data[0].id })
          if (data.codes) {
            data.codes.push(code)
            ip.set('codes', data.codes)
          } else {
            ip.set('codes', [code])
          }
        } else {
          var ip = new InvoiceProduct()
          ip.set('codes', [code])
        }
        ip.save(
          {},
          {
            success: function (r, e) {
              alert('SUCCESS: ' + productCode)
            }
          }
        )
      }
    })
  }

  changeInvoiceStatus = (status, code) => {
    var that = this
    if (this.invoice.id) {
      var inv = new Invoice({ id: this.invoice.id })
    } else {
      var inv = new Invoice()
    }
    inv.set('status', status)
    inv.set('code', code)
    inv.save(
      {},
      {
        success: function (r, e) {
          // alert("Success: " + code);
          that.getInvoiceByCode(code)
          that.onUpdateData()
        }
      }
    )
  }
}
class ModelProDuctBarcodes {
  constructor(productCode, invoiceCode) {
    this.productBarcodes = []
    this.invoiceProductBarcodes = []
    this.invoiceKiot = {}
    this.onUpdateData = function () {}
    this.initProductBarcodes(productCode, invoiceCode)
  }
  initProductBarcodes = (productCode, invoiceCode) => {
    this.getProductBarcodeByProductCode(productCode, invoiceCode)
    // console.log(invoiceCode);

    this.getInvoiceKiot(invoiceCode)
  }
  getInvoiceKiot = invoiceCode => {
    var that = this
    $.ajax({
      url: '/api/kiot/invoices/' + invoiceCode,
      method: 'GET',
      success: data => {
        that.invoiceKiot = data
        // console.log(that.invoiceKiot);
        that.onUpdateData()
      }
    })
  }
  filterBarcodesByInvoice = (invoiceCode, barcodes) => {
    var that = this
    var ipBarcodes = []
    this.productBarcodes.forEach(barcode => {
      if (barcode.infos) {
        var flag = false
        barcode.infos.forEach(info => {
          if (info.code == invoiceCode) {
            flag = true
          }
        })
        if (flag) {
          ipBarcodes.push(barcode)
        }
      }
    })
    return ipBarcodes
  }
  getProductBarcodeByProductCode = (productCode, invoiceCode) => {
    var that = this
    $.ajax({
      url: '/api/productBarcodes' + '?productCode=' + productCode,
      method: 'GET',
      success: function (data) {
        // console.log(data);
        that.productBarcodes = data
        that.invoiceProductBarcodes = that.filterBarcodesByInvoice(
          invoiceCode,
          data
        )
        // console.log(that.invoiceProductBarcodes);
        that.onUpdateData()
      }
    })
  }
  addInvoiceProductBarcode = (invoiceCode, productCode, productName, code) => {
    console.log(invoiceCode, productCode, productName, code)
    var that = this
    var info = {
      code: invoiceCode,
      type: 'HOA DON',
      content: 'Xuất hàng',
      date: moment().format()
    }

    $.ajax({
      url:
        '/api/productBarcodes' +
        '?productCode=' +
        productCode +
        '&code=' +
        code,
      method: 'GET',
      success: function (barcodes) {
        // console.log(barcodes);
        if (barcodes.length > 0) {
          console.log('1')
          var product_barcode = new ProductBarcode({ id: barcodes[0].id })
          if (barcodes[0].infos) {
            barcodes[0].infos.push(info)
            product_barcode.set('infos', barcodes[0].infos)
          } else {
            product_barcode.set('infos', [info])
          }
          product_barcode.save(
            {},
            {
              sucess: function (r, e) {
                console.log('success')
                that.initProductBarcodes()
              },
              error: function (e) {
                console.log('err', e)
              }
            }
          )
        } else {
          // console.log("2");
          var product_barcode = new ProductBarcode()
          product_barcode.set('productCode', productCode)
          product_barcode.set('productName', productName)

          product_barcode.set('code', code)
          product_barcode.set('infos', [info])
          // console.log(product_barcode);

          product_barcode.save(
            {},
            {
              success: function (r, e) {
                // console.log("succees")
                // console.log(r);
                that.initProductBarcodes(productCode, invoiceCode)
              },
              error: function (e) {
                console.log('err', e)
              }
            }
          )
        }
      }
    })
  }
  deleteInvoiveProductBarcode = (invoiceCode, productCode, code) => {
    // console.log(invoiceCode, productCode, code);
    var that = this
    $.ajax({
      url:
        '/api/productBarcodes' +
        '?productCode=' +
        productCode +
        '&code=' +
        code,
      method: 'GET',
      success: function (barcodes) {
        // console.log(barcodes);
        if (barcodes.length > 0) {
          var bc = barcodes[0].infos.filter(info => {
            return info.code != invoiceCode
          })
          if (bc.length == barcodes[0].infos.length) {
          } else {
            var product_barcode = new ProductBarcode({
              id: barcodes[0].id
            })
            product_barcode.set('infos', bc)
            product_barcode.save(
              {},
              {
                success: function (r, e) {
                  that.initProductBarcodes(productCode, invoiceCode)
                }
              }
            )
          }
        }
      }
    })
  }
}
class ModelInvoiceSMS {
  constructor() {
    // this.ready = false;
    this.invoice = {}
    this.invoice_kiot = {}
    this.onUpdateDate = function () {}
  }
  initInvoice = code => {
    var that = this
    $.ajax({
      url: '/api/invoices/code/' + code,
      method: 'GET',
      success: data => {
        that.invoice = data
        that.onUpdateData()
      }
    })
    $.ajax({
      url: '/api/kiot/invoices/' + code,
      method: 'GET',
      success: data => {
        that.invoice_kiot = data
        that.onUpdateData()
      }
    })
  }
  send_SMS = (to, msg, msg_count, invoiceCode) => {
    var that = this
    var url = 'http://data.creta.work/creta/action/playsms/send_sms.php'
    $.get(url + '?to=' + to + '&msg=' + msg, function (data) {
      // console.log(data);
      if (true) {
        if (that.invoice.id) {
          // console.log(that.invoice.id);
          var invoice = new Invoice({ id: that.invoice.id })
          if (that.invoice.actions) {
            that.invoice.actions.push({
              type: 'SEND_SMS',
              status: 'OK',
              value: msg_count + 1
            })
          } else {
            var invoiceActions = [
              {
                type: 'SEND_SMS',
                status: 'OK',
                value: msg_count + 1
              }
            ]
            that.invoice.actions = invoiceActions
          }
          invoice.set('actions', that.invoice.actions)
        } else {
          var invoice = new Invoice()
          var invoiceActions = [
            {
              type: 'SEND_SMS',
              status: 'OK',
              value: msg_count + 1
            }
          ]
          invoice.set('actions', invoiceActions)
        }
        invoice.set('code', invoiceCode)

        invoice.save(
          {},
          {
            success: function (r, e) {
              that.initInvoice(invoiceCode)
              alert('SUCCESS: ' + invoiceCode)
            }
          }
        )
      }
    })
  }
  get_msg_count = () => {
    var result = 0
    if (this.invoice.actions) {
      if (this.invoice.actions.length > 0) {
        var actions_sms = this.invoice.actions.filter(action => {
          return action.type == 'SEND_SMS'
        })

        result = actions_sms.length
      }
    }
    return result
  }
  get_to = () => {
    var result = ''
    if (this.invoice_kiot.invoiceDelivery) {
      result = this.invoice_kiot.invoiceDelivery.contactNumber || ''
    }
    return result
  }
}
