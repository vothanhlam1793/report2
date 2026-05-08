# Dev Runtime Guide

File này mô tả runtime dev đang dùng thật trên môi trường hiện tại.

## Current Truth

- Máy app đang chạy: `10.7.0.2`
- Workspace active: `/home/black/report2`
- Process app: `node ./bin/www`
- Port app: `38655`
- Domain public: `https://report2.camerangochoang.com`
- Reverse proxy: `svr12.creta.vn`

## Public Routing

Luồng request public hiện tại:

```text
Browser
  -> report2.camerangochoang.com
  -> nginx on svr12.creta.vn
  -> proxy_pass http://10.7.0.2:38655
  -> node ./bin/www in /home/black/report2
```

## Nginx Mapping

Config nginx đang dùng trên `svr12`:

```nginx
server {
    listen 443 ssl http2;
    server_name report2.camerangochoang.com;

    location / {
        proxy_pass http://10.7.0.2:38655;
    }
}
```

Điểm quan trọng:

- `svr12` chỉ là reverse proxy.
- App `report2` không chạy trực tiếp trên `svr12`.
- Khi sửa code ở phase dev này, cần kiểm tra process trên `10.7.0.2`.

## Start App

Chạy app từ workspace hiện tại:

```bash
cd /home/black/report2
node ./bin/www
```

Hoặc nếu cần chạy nền thủ công:

```bash
cd /home/black/report2
nohup node ./bin/www >/tmp/report2.log 2>&1 &
```

## Check Runtime

Kiểm tra app có đang nghe đúng port:

```bash
ss -ltnp | grep 38655
```

Kiểm tra process đang chạy từ đúng workspace:

```bash
readlink -f /proc/<pid>/cwd
tr '\0' ' ' </proc/<pid>/cmdline
```

Kiểm tra health local:

```bash
curl -I http://127.0.0.1:38655/login
```

Kiểm tra health public:

```bash
curl -I https://report2.camerangochoang.com/login
```

## Restart App

Quy trình restart thủ công đang dùng ở phase dev:

1. Tìm PID đang nghe `38655`
2. Kill process đó
3. Chạy lại `node ./bin/www` trong `/home/black/report2`

Ví dụ:

```bash
ss -ltnp | grep 38655
kill <pid>
nohup node ./bin/www >/tmp/report2.log 2>&1 &
```

Sau restart cần kiểm tra lại:

```bash
curl -I http://127.0.0.1:38655/login
curl -I https://report2.camerangochoang.com/login
```

## Notes For New Sessions

Khi mở lại dự án này ở các phiên tiếp theo, nên đọc theo thứ tự:

1. `README.md`
2. `docs/dev-runtime.md`
3. `docs/plan.md`
4. `docs/session-notes.md`

Nguyên tắc vận hành:

- Tin runtime thật trước, không tin tài liệu cũ nếu bị lệch.
- Không mặc định giả định Docker, PM2 hoặc CI/CD đang là đường chạy chính.
- Trong phase dev hiện tại, app đang chạy trực tiếp từ workspace này.
