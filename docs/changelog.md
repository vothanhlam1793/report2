# Changelog

## v1.1.0 — (upcoming)
### Added
- Merge 2 nhánh phát triển song song thành 1 source duy nhất
- Tính năng quét barcode bằng camera điện thoại (`barcode.ejs` + `barcodeApp2.js`)
- Route `/invoices/barcode/:invoiceCode/:productCode`
- Thư mục `docs/` — tài liệu kiến trúc, deployment, changelog

### Fixed
- WebSocket barcode URL: `node.creta.work` → `node.creta.vn` (svr3)
- Crash khi `creta.vn/api/carts` trả HTML thay vì JSON
- `sms.js` không có try/catch gây crash

### Removed
- Tính năng Monitor/Shortlink (`creta.link` đã ngừng hoạt động)
- Dead code SMS (`node.creta.work/playsms` chết)
- Upload ảnh GridFS (`node.creta.work:30042` chết)
- `routes/adapter/hubot.js`, `routes/adapter/test.js`

---

## v1.0.0 — snapshot trước khi nâng cấp
- Snapshot trạng thái ban đầu khi bắt đầu nâng cấp
- Node 16, credentials hardcode trong source

---

## Lịch sử container (image vothanhlam1793/report)

| Tag | Nội dung |
|---|---|
| :38 | Version production cuối cùng trước khi merge — WS dùng `svr3.creta.vn` |
| :latest | Version sau merge (v1.1.0+) |
