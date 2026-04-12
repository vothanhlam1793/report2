# Session Report — Tiến trình & Việc cần làm tiếp

> File này ghi lại đầy đủ những gì đã làm và chưa làm.
> Đọc file này đầu tiên khi bắt đầu session mới về dự án report2.

---

## Trạng thái hiện tại (sau session này)

- **Repo:** `https://github.com/vothanhlam1793/report2`
- **Branch:** `master`
- **Tag mới nhất:** `v1.1.0`
- **Container production:** `vothanhlam1793/report:38` (chưa rebuild — vẫn đang chạy image cũ)
- **App local:** chạy được tại `http://localhost:3000` (`node ./bin/www`)

---

## Những gì đã làm trong session này

### ✅ Hoàn thành

1. **Clone repo về local** — `/Users/macos/Documents/Github/report2`
2. **Node 18 + .env** — không còn hardcode credentials trong source
3. **Helmet + rate-limit** — bảo mật cơ bản
4. **Global error handler** — unhandledRejection, uncaughtException
5. **Fix crash** — `cart.js`, `sms.js` fetch không có try/catch → crash toàn app
6. **Xoá Monitor/Shortlink** — `creta.link` ngừng hoạt động
7. **Pull source container REPORT (image :38)** về `/tmp/report-container`
8. **Merge 2 nhánh song song:**
   - Container có WS đúng (`svr3.creta.vn`) → lấy `detail.ejs` từ container làm base
   - Local có camera phone → giữ `barcode.ejs`, `barcodeApp2.js`, route `/barcode/:inv/:prod`
9. **Dọn dead code:**
   - Xoá: `routes/upload.js`, `routes/adapter/hubot.js`, `routes/adapter/test.js`
   - Xoá: `public/js/barcodeApp.js` (v1 cũ), `public/js/detailInvoice.js`, `public/js/upload.js`
   - Dọn `upload-file` component khỏi `/crm`
10. **Tạo `docs/`** — architecture.md, deployment.md, changelog.md, plan.md
11. **Tag v1.0.0** — snapshot trước khi nâng cấp
12. **Tag v1.1.0** — sau khi merge + dọn dẹp

---

## ⚠️ QUAN TRỌNG — WebSocket Barcode

### Flow đúng (KHÔNG được đổi)

```
[Thiết bị scan] → HTTP POST /barcode → [Orion 10.7.0.2:1888 Node-RED]
                                                |
                                    WS client → ws://svr3.creta.vn:1888/barcode_in
                                                |
                                    [SVR5 Node-RED] /barcode_in → /scan_barcode
                                                |
                        [Browser] ← ws://svr3.creta.vn:1888/scan_barcode
```

### URL trong code PHẢI là:
```js
var ws = new WebSocket("ws://svr3.creta.vn:1888/scan_barcode")
```

### KHÔNG phải:
- ~~`ws://node.creta.work:1888/scan_barcode`~~ (server chết)
- ~~`wss://node.creta.vn/scan_barcode`~~ (node.creta.vn → Orion, không có endpoint này)

### Lý do:
- `svr3.creta.vn` → SVR5 (160.250.186.124) — Node-RED port 1888, có `/scan_barcode`
- `node.creta.vn` → SVR12 → Orion 10.7.0.2:1888 — Node-RED Orion, CHỈ có `/barcode` (HTTP POST)

---

## Việc cần làm trong session tiếp theo

### Phase 2 — Dọn dead code còn lại

| # | Task | File | Ghi chú |
|---|---|---|---|
| 2.1 | Kiểm tra `detailInvoice2.js` — xoá SMS code bên trong | `public/js/detailInvoice2.js` | Chỉ xoá phần SMS, giữ ModelProDuctBarcodes vì barcode.ejs dùng |
| 2.2 | Dọn `adapter/sms.js` — xoá hoàn toàn | `routes/adapter/sms.js` | SMS `node.creta.work` chết |
| 2.3 | Kiểm tra `routes/adapter/sms.js` còn được import ở đâu | — | Trước khi xoá |
| 2.4 | Dọn code commented-out trong `detail.ejs` | `views/invoices/detail.ejs` | 1211 dòng, nhiều comment dài |
| 2.5 | Xoá `views/index2.ejs` | `views/index2.ejs` | Không có route nào render nó |
| 2.6 | Kiểm tra `routes/adapter/dss.js` dùng gì | `routes/adapter/dss.js` | Chưa xem |

### Phase 3 — CI/CD Setup

| # | Task | Ghi chú |
|---|---|---|
| 3.1 | Setup GitHub Secrets | DOCKER_USERNAME, DOCKER_PASSWORD, SVR5_HOST, SVR5_PASSWORD |
| 3.2 | Test pipeline: push master → auto build → auto deploy SVR5 | File `.github/workflows/deploy.yml` đã có sẵn |
| 3.3 | Build + deploy image mới lên production | Container hiện vẫn chạy image :38 cũ |

### Phase 4 — Authentication

| # | Task | Ghi chú |
|---|---|---|
| 4.1 | Thêm `express-session` + login page | App đang public hoàn toàn |
| 4.2 | Middleware check session toàn bộ routes | |
| 4.3 | User/pass lưu trong `.env` | Đơn giản, nội bộ |

### Phase 5 — Dài hạn

- Dọn Backbone.js → Vue 2 thuần
- Nâng Express + Mongoose
- Xem xét KiotViet webhook

---

## Server Map nhanh

| Tên | IP | SSH | Ghi chú |
|---|---|---|---|
| SVR5 (`svr3.creta.vn`) | 160.250.186.124 | `ssh root@160.250.186.124` | Chạy Docker REPORT + Node-RED |
| SVR12 (`node.creta.vn`) | 160.250.186.95 | `ssh root@160.250.186.95` | Nginx proxy |
| Orion | 10.7.0.2 | `sshpass -p '1111' ssh black@10.7.0.2` | Node-RED barcode receiver |

## Container quan trọng trên SVR5

```bash
docker ps  # xem tất cả
docker logs REPORT  # xem log app
docker exec -it REPORT sh  # vào container
```

## Deploy thủ công (khi CI/CD chưa setup)

```bash
ssh root@160.250.186.124
docker stop REPORT && docker rm REPORT
docker run -d \
  --name REPORT \
  --restart unless-stopped \
  -p 30004:3000 \
  --env-file /root/.env.report \
  vothanhlam1793/report:<tag>
```

---

## Credentials (xem agent.md đầy đủ)

- SVR5 root pass: xem `agent.md`
- MongoDB: `camerangochoang.com:27040`, user `black`, pass trong `.env`
- KiotViet: credentials trong `.env`
- File env trên server: `/root/.env.report`
