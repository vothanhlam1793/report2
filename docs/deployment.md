# Deployment Guide

## Build & Deploy thủ công

```bash
# Build image
export DOCKER_DEFAULT_PLATFORM=linux/amd64
docker build -t vothanhlam1793/report:<tag> .

# Push lên Docker Hub
docker push vothanhlam1793/report:<tag>

# SSH vào SVR5 và deploy
ssh root@160.250.186.124
docker pull vothanhlam1793/report:<tag>
docker stop REPORT && docker rm REPORT
docker run -d \
  --name REPORT \
  --restart unless-stopped \
  -p 30004:3000 \
  --env-file /root/.env.report \
  vothanhlam1793/report:<tag>
```

## CI/CD tự động (GitHub Actions)

Push lên branch `master` → tự động:
1. Build Docker image
2. Push lên Docker Hub với tag = run number
3. SSH vào SVR5 → stop/rm container cũ → run container mới

### Cần setup GitHub Secrets:

| Secret | Giá trị |
|---|---|
| `DOCKER_USERNAME` | `vothanhlam1793` |
| `DOCKER_PASSWORD` | Docker Hub password |
| `SVR5_HOST` | `160.250.186.124` |
| `SVR5_PASSWORD` | root password SVR5 |

## Local Development

```bash
# Copy env
cp .env.example .env
# Điền thông tin vào .env

# Cài dependencies
npm install

# Chạy dev
npm run dev
# hoặc
node ./bin/www
```

App chạy tại: http://localhost:3000

## Nginx config trên SVR5

File: `/www/server/panel/vhost/nginx/report.creta.vn.conf`
Proxy: `localhost:30004` → Docker REPORT container

## Env file trên server

`/root/.env.report` — đọc bởi `docker run --env-file`
