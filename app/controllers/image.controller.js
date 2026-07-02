const db = require("../models")
const ImageModel = db.images
const InvoiceModel = db.invoices
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/invoices')

exports.upload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng chọn file" })
        }

        const invoice_code = req.params.code
        const type = req.body.type || 'packed'
        const note = req.body.note || ''

        if (!['packed', 'delivery'].includes(type)) {
            return res.status(400).json({ message: "Type không hợp lệ" })
        }

        const originalPath = req.file.path
        const baseName = path.parse(req.file.filename).name
        const compressedFilename = baseName + '.jpg'
        const compressedPath = path.join(UPLOAD_DIR, compressedFilename)

        await sharp(originalPath)
            .resize({ width: 1920, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(compressedPath)

        fs.unlinkSync(originalPath)

        const image = new ImageModel({
            invoice_code: invoice_code,
            url: '/uploads/invoices/' + compressedFilename,
            filename: compressedFilename,
            type: type,
            note: note,
            uploaded_by: req.session.user || 'unknown'
        })

        const data = await image.save()

        const flagField = type === 'delivery' ? 'has_delivery_images' : 'has_packed_images'

        await InvoiceModel.findOneAndUpdate(
            { code: invoice_code },
            { $set: { [flagField]: true }, $setOnInsert: { code: invoice_code } },
            { upsert: true, new: true }
        )

        res.send(data)
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: e.message || "Lỗi upload ảnh" })
    }
}

exports.findAll = async (req, res) => {
    try {
        const invoice_code = req.params.code
        const filter = { invoice_code: invoice_code }
        if (req.query.type) {
            filter.type = req.query.type
        }
        const data = await ImageModel.find(filter).sort({ createdAt: -1 })
        res.send(data)
    } catch (e) {
        res.status(500).json({ message: e.message || "Lỗi lấy danh sách ảnh" })
    }
}

exports.delete = async (req, res) => {
    try {
        const image = await ImageModel.findById(req.params.image_id)
        if (!image) {
            return res.status(404).json({ message: "Không tìm thấy ảnh" })
        }

        const filePath = path.join(__dirname, '../../public/uploads/invoices/', image.filename)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        await ImageModel.findByIdAndRemove(req.params.image_id)

        const remaining = await ImageModel.countDocuments({ invoice_code: image.invoice_code, type: image.type })
        if (remaining === 0) {
            const flagField = image.type === 'delivery' ? 'has_delivery_images' : 'has_packed_images'
            await InvoiceModel.findOneAndUpdate(
                { code: image.invoice_code },
                { $set: { [flagField]: false } }
            )
        }

        res.json({ message: "Ok - success" })
    } catch (e) {
        res.status(500).json({ message: e.message || "Lỗi xóa ảnh" })
    }
}
