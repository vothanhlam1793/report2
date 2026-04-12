# Development Plan — report.creta.vn

## Phase 1 — Sync & Merge (Ưu tiên cao) ← ĐANG LÀM

| # | Task | Status |
|---|---|---|
| 1.1 | Pull source từ container REPORT (image :38) ra local | ✅ Done |
| 1.2 | Lấy `detail.ejs` từ container (WS đúng `svr3.creta.vn`) làm base | ✅ Done |
| 1.3 | Merge route `/barcode/:invoice/:product` vào | ✅ Done |
| 1.4 | Merge `barcode.ejs` + `barcodeApp2.js` (camera phone) vào | ✅ Done |
| 1.5 | Tạo thư mục `docs/` + tài liệu kiến trúc | ✅ Done |
| 1.6 | Commit + push + tag `v1.1.0` | ✅ Done |

---

## Phase 2 — Dọn dẹp dead code (Ưu tiên cao)

| # | Task | File | Status |
|---|---|---|---|
| 2.1 | Xoá upload GridFS (`node.creta.work:30042` chết) | `routes/upload.js` | ⬜ |
| 2.2 | Xoá SMS code hoàn toàn | `adapter/sms.js`, `detailInvoice.js`, `detailInvoice2.js` | ⬜ |
| 2.3 | Xoá `hubot.js`, `test.js` adapter | `routes/adapter/` | ⬜ |
| 2.4 | Xoá `barcodeApp.js` (v1 cũ) | `public/js/barcodeApp.js` | ⬜ |
| 2.5 | Dọn code commented-out trong `detail.ejs` | `views/invoices/detail.ejs` | ⬜ |
| 2.6 | Xoá `detailInvoice.js` nếu không còn dùng | `public/js/detailInvoice.js` | ⬜ |

---

## Phase 3 — Ổn định hoá (Ưu tiên trung bình)

| # | Task | Status |
|---|---|---|
| 3.1 | Setup GitHub Secrets cho CI/CD pipeline | ⬜ |
| 3.2 | Test CI/CD: push → auto build → auto deploy SVR5 | ⬜ |
| 3.3 | Kiểm tra WebSocket barcode end-to-end trên production | ⬜ |
| 3.4 | Kiểm tra camera phone barcode trên production | ⬜ |

---

## Phase 4 — Authentication (Ưu tiên trung bình)

App hiện tại **public hoàn toàn** — ai có URL đều vào được.

| # | Task | Status |
|---|---|---|
| 4.1 | Thêm `express-session` + login page | ⬜ |
| 4.2 | Middleware check session toàn bộ routes | ⬜ |
| 4.3 | User/pass lưu trong `.env` (đơn giản, nội bộ) | ⬜ |

---

## Phase 5 — Nâng cấp dài hạn (Ưu tiên thấp)

| # | Task | Status |
|---|---|---|
| 5.1 | Dọn Backbone.js — thống nhất Vue 2 toàn bộ frontend | ⬜ |
| 5.2 | Nâng Express `4.16` → `4.19+` | ⬜ |
| 5.3 | Nâng Mongoose `^6` → `^8` | ⬜ |
| 5.4 | Xem xét KiotViet webhook thay polling | ⬜ |
| 5.5 | Tách frontend ra SPA riêng nếu cần | ⬜ |

---

## Ghi chú kỹ thuật

### 2 nhánh phát triển song song (đã merge ở v1.1.0)

```
Container REPORT (image :38)         Local repo (report2 GitHub)
─────────────────────────────        ──────────────────────────────
ws://svr3.creta.vn ✅                ws://node.creta.work ❌
KHÔNG có camera phone                CÓ camera phone (barcode.ejs)
KHÔNG có route /barcode/...          CÓ route /barcode/:inv/:prod
```

### WebSocket barcode flow
Xem chi tiết: `docs/architecture.md`
