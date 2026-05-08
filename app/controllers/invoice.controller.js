const db = require("../models");
const Model = db.invoices;
const { normalizeInvoiceStatus, attachInvoiceStatus } = require('../lib/invoiceStatus');
const { getReferenceCode, sortInvoicesByVersion, getLatestInvoice } = require('../lib/invoiceReference')
const odoo = require('../../routes/adapter/odoo')
var nameController = "Invoice";

function createObj (data) {
    var objArray = ['code', 'actions', 'notes', 'status', 'activeInvoiceCode', 'latestWarehouseCheckId', 'changeWarningLevel', 'changeWarningSummary', 'relatedInvoiceCodes'];
    var a = {};
    objArray.forEach(function(e){
        a[e] = data[e];
    });
    a.status = normalizeInvoiceStatus(a.status);
    a.referenceCode = getReferenceCode(a.code)
    if (!a.activeInvoiceCode) {
        a.activeInvoiceCode = a.code
    }
    return a;
}
// Create and Save a new Tutorial
exports.create = (req, res) => {
    // if(!req.body.name){
    //     res.status(400).send({
    //         message: "Cannot empty the name"
    //     })
    // }
    const model = new Model(createObj(req.body));
    model.save(model).then(data=>{
        res.send(data);
    }).catch(e=>{
        console.log(e);
        res.status(500).send({
            message: e.message || "Error cannot create " + nameController
        })
    });  
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
    const conditional = req.query; //
    Model.find(conditional).then(data => {
        res.send(data.map(attachInvoiceStatus));
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "Error cannot querry all"
        })
    })  
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
Model.findById(req.params.id).then(data=>{
        res.send(attachInvoiceStatus(data));
    }).catch(e=>{
        res.status(400).send({
            message: e.message || "Cannot query Transaction with id " + req.params.id
        })
    })    
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
    if (!req.body) {
        return res.status(400).send({
          message: "Data to update can not be empty!"
        });
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'status')) {
        req.body.status = normalizeInvoiceStatus(req.body.status);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'code')) {
        req.body.referenceCode = getReferenceCode(req.body.code)
    }
    const id = req.params.id;
    Model.findByIdAndUpdate(id, req.body, {useFindAndModify: false}).then(data=>{
        if(data){
            res.send({
                message: "OK"
            });
        } else {
            res.status(400).send({
                message: "Cannot update " + id
            })
        }

    }).catch(e=>{
        res.status(400).send({
            message: e.message || "Cannot find and update " + id
        })
    })  
};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Model.findByIdAndRemove(id).then(data=>{
        if(!data){
            res.status(400).send({
                message: "Error - not remove"
            })
        } else {
            res.send({
                message: "Ok - success"
            })
        }
    }).catch(e=>{
        res.status(500).send({
            message: "Cannot delete id " + id
        })
    })  
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
  
};

// Find all published Tutorials
exports.findAllPublished = (req, res) => {
  
};

exports.getByCode = (req, res) => {
    var code = req.params.code;
    // console.log(code);
    const conditional = req.params.code ? {code : code} : {};
    // console.log(conditional);
    Model.find(conditional).then(data => {
        console.log(data);
        if(data[0]){
            res.send(attachInvoiceStatus(data[0]));
        }
        else {
            res.send({});
        }        
    }).catch(e=>{
        res.status(500).send({
            message: e.message || "Error cannot querry all"
        })
    })  
};

exports.getDetailByCode = async (req, res) => {
    try {
        const code = req.params.code
        const referenceCode = getReferenceCode(code)

        const [invoiceState, currentInvoice, allInvoices, allInvoiceStates, allWarehouseChecks, allEvents, allQuickPurchases, allQuickReceipts] = await Promise.all([
            Model.findOne({ code: code }).lean(),
            odoo.getInvoice(code),
            odoo.getAllInvoices(),
            Model.find({}).lean(),
            db.warehouseChecks.find({ referenceCode: referenceCode }).sort({ updatedAt: -1 }).lean(),
            db.invoiceEvents.find({ referenceCode: referenceCode }).sort({ createdAt: -1 }).lean(),
            db.quickPurchaseRequests.find({ referenceCode: referenceCode }).sort({ createdAt: -1 }).lean(),
            db.quickStockReceipts.find({ referenceCode: referenceCode }).sort({ createdAt: -1 }).lean()
        ])

        const invoiceStateMap = new Map((allInvoiceStates || []).map(function (item) {
            return [item.code, attachInvoiceStatus(item)]
        }))

        const relatedInvoiceRows = sortInvoicesByVersion((allInvoices || [])
            .filter(function (invoice) {
                return getReferenceCode(invoice.code) === referenceCode
            }))

        const relatedInvoices = relatedInvoiceRows
            .map(function (invoice) {
                const localState = invoiceStateMap.get(invoice.code) || {}
                const fallbackStatusInfo = attachInvoiceStatus({ status: localState.status || 'B1' }).statusInfo
                return Object.assign({}, invoice, {
                    localStatus: localState.status || 'B1',
                    localStatusInfo: localState.statusInfo || fallbackStatusInfo,
                    changeWarningSummary: localState.changeWarningSummary || ''
                })
            })

        const relatedCodes = relatedInvoices.map(function (invoice) {
            return invoice.code
        })

        const allPhieus = await db.phieus.find({ code: { $in: relatedCodes } }).sort({ createdAt: -1 }).lean()
        const activeInvoice = getLatestInvoice(relatedInvoiceRows) || currentInvoice || {}

        const currentInvoiceState = invoiceState ? attachInvoiceStatus(invoiceState) : {
            code: code,
            referenceCode: referenceCode,
            status: 'B1',
            activeInvoiceCode: activeInvoice.code || code,
            statusInfo: attachInvoiceStatus({ status: 'B1' }).statusInfo,
            notes: [],
            actions: [],
            changeWarningSummary: '',
            relatedInvoiceCodes: []
        }

        if (!currentInvoiceState.activeInvoiceCode) {
            currentInvoiceState.activeInvoiceCode = activeInvoice.code || code
        }

        const latestWarehouseCheck = (allWarehouseChecks || []).length ? allWarehouseChecks[0] : null
        const packageCount = (currentInvoiceState.notes || []).reduce(function (sum, note) {
            if (note && note.type === 'SO_KIEN_HANG') {
                return note.value || sum
            }
            return sum
        }, 0)

        res.send({
            referenceCode: referenceCode,
            currentInvoice: activeInvoice || {},
            invoiceState: currentInvoiceState,
            relatedInvoices: relatedInvoices,
            warehouseChecks: allWarehouseChecks || [],
            latestWarehouseCheck: latestWarehouseCheck,
            invoiceEvents: allEvents || [],
            quickPurchaseRequests: allQuickPurchases || [],
            quickStockReceipts: allQuickReceipts || [],
            phieus: allPhieus || [],
            packageCount: packageCount
        })
    } catch (e) {
        res.status(500).send({
            message: e.message || 'Cannot build invoice detail'
        })
    }
}

exports.upsertByCode = async (req, res) => {
    try {
        if (!req.body || !req.body.code) {
            return res.status(400).send({ message: 'Missing invoice code' })
        }

        const code = req.body.code
        const payload = createObj(req.body)
        const existing = await Model.findOne({ code: code })

        if (existing) {
            Object.keys(payload).forEach(function (key) {
                if (payload[key] !== undefined) {
                    existing[key] = payload[key]
                }
            })
            await existing.save()
            return res.send(attachInvoiceStatus(existing))
        }

        const created = await Model.create(payload)
        return res.send(attachInvoiceStatus(created))
    } catch (e) {
        return res.status(500).send({ message: e.message || 'Cannot upsert invoice' })
    }
}
