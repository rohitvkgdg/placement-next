# CampusConnect — Bare Metal Deployment Guide
## Ubuntu Server 24.04 LTS

This guide covers a full production deployment on a single Ubuntu 24.04 server using:
- **Node.js 22 LTS** (via nvm) — runtime
- **PM2** — process manager (keeps the app alive, restarts on crash)
- **Caddy** — reverse proxy + automatic HTTPS (no Certbot needed)
- **System cron** — deadline reminder job

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Ubuntu 24.04 server | ≥ 2 vCPU, 4 GB RAM recommended |
| Domain name | `tpo.sdmcet.ac.in` — A record pointed at this server's IP |
| PostgreSQL database | Neon (serverless), Supabase, or self-hosted |
| Cloudflare R2 bucket | For file storage |
| Google OAuth app | Client ID + Secret |
| SMTP credentials | Gmail App Password or similar |

> **DNS:** Only one A record is required — point `tpo.sdmcet.ac.in` to your server's public IP. Caddy handles HTTPS automatically.

---

## 1. Initial Server Setup

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git unzip ufw caddy

# Create a non-root user for the app (skip if you already have one)
sudo useradd -m -s /bin/bash campusconnect
sudo usermod -aG sudo campusconnect
su - campusconnect
```

---

## 2. Install Node.js 22 LTS (via nvm)

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Load nvm into the current shell
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 22 LTS
nvm install --lts

# Verify
node --version   # v22.x.x
npm --version

# Install pnpm
npm install -g pnpm

# Install PM2 globally
npm install -g pm2
```

> **Note:** nvm installs Node.js per-user, so no `sudo` is needed. The `campusconnect` user owns the installation.

---

## 3. Clone and Build the Application

```bash
# Clone to /var/www (or any directory you prefer)
sudo mkdir -p /var/www
sudo chown campusconnect:campusconnect /var/www
cd /var/www

git clone <your-repo-url> campusconnect
cd campusconnect

# Install dependencies
pnpm install --frozen-lockfile
```

---

## 4. Configure Environment Variables

```bash
# Copy the example and fill in all values
cp .env.example .env
nano .env   # or: vim .env
```

**Required values to set:**

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth — must match your public domain
AUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://tpo.sdmcet.ac.in"

# Google OAuth (set redirect URI: https://tpo.sdmcet.ac.in/api/auth/callback/google)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="CampusConnect <noreply@sdmcet.ac.in>"

# Cloudflare R2
CLOUDFLARE_R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
CLOUDFLARE_R2_BUCKET_NAME="placement-portal"
CLOUDFLARE_R2_PUBLIC_DOMAIN="https://files.sdmcet.ac.in"

# Push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_EMAIL="mailto:admin@sdmcet.ac.in"

# Cron security
CRON_SECRET="$(openssl rand -base64 32)"
```

> **Note:** `openssl rand -base64 32` generates a cryptographically secure random string.
> Run it on the server and paste the output directly.

---

## 5. Run Database Migrations

```bash
# Apply all pending migrations to production database
pnpm db:migrate:prod
```

If this is a fresh database, this creates all tables. If upgrading, it applies only new migrations.

---

## 6. Build the Application

```bash
pnpm build
```

This runs `prisma generate && next build` and produces a `.next/standalone` directory.

---

## 7. Configure PM2

Create the PM2 ecosystem file:

```bash
cat > /var/www/campusconnect/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "campusconnect",
      cwd: "/var/www/campusconnect",
      script: ".next/standalone/server.js",
      instances: 1,           // increase to "max" if you have many CPUs
      exec_mode: "fork",      // use "cluster" if instances > 1
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
      },
      // Load .env file
      env_file: "/var/www/campusconnect/.env",
      // Restart policy
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: "10s",
      // Logging
      out_file: "/var/log/campusconnect/out.log",
      error_file: "/var/log/campusconnect/error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
EOF
```

```bash
# Create log directory
sudo mkdir -p /var/log/campusconnect
sudo chown campusconnect:campusconnect /var/log/campusconnect

# Copy static assets into standalone (required for Next.js standalone mode)
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Start the app
pm2 start ecosystem.config.js

# Save PM2 process list and enable on boot
pm2 save
pm2 startup systemd -u campusconnect --hp /home/campusconnect
# ↑ Copy and run the command it prints (starts with: sudo env PATH=...)
```

Verify the app is running:

```bash
pm2 status
pm2 logs campusconnect --lines 50
curl http://127.0.0.1:3000   # should return HTML
```

---

## 8. Install and Configure Caddy

Caddy automatically obtains and renews TLS certificates from Let's Encrypt — no Certbot needed.

### Install Caddy

```bash
# Install Caddy via official apt repo
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

### Configure Caddy

```bash
sudo nano /etc/caddy/Caddyfile
```

Replace its content with:

```caddyfile
tpo.sdmcet.ac.in {
	# Reverse proxy to Next.js
	reverse_proxy 127.0.0.1:3000

	# Security headers
	header {
		X-Frame-Options "DENY"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
	}

	# Cache Next.js static assets aggressively
	@static path /_next/static/*
	header @static Cache-Control "public, max-age=31536000, immutable"

	# File upload size limit (increase if you expect large PDFs/portfolios)
	request_body {
		max_size 20MB
	}

	# Access log
	log {
		output file /var/log/caddy/campusconnect.access.log
		format json
	}
}
```

### Start Caddy

```bash
# Create log directory
sudo mkdir -p /var/log/caddy

# Validate the configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy (it runs as a systemd service by default)
sudo systemctl reload caddy

# Check status
sudo systemctl status caddy
```

> **How Caddy HTTPS works:** When Caddy starts, it automatically requests a TLS certificate from Let's Encrypt for `tpo.sdmcet.ac.in` using the ACME HTTP-01 challenge. It also handles certificate renewal automatically — no cron job or manual intervention required. Just make sure port 80 and 443 are open.

---

## 9. Set Up the Cron Job (Deadline Reminders)

The `/api/cron/deadline-reminders` endpoint runs hourly and sends reminder emails. Set up with system cron:

```bash
crontab -e
```

Add this line (replace the secret):

```
0 * * * * curl -s -X POST https://tpo.sdmcet.ac.in/api/cron/deadline-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  >> /var/log/campusconnect/cron.log 2>&1
```

> **Important:** `YOUR_CRON_SECRET` must match the `CRON_SECRET` value in your `.env`.

---

## 10. Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80     # Required for Caddy ACME challenge + HTTP→HTTPS redirect
sudo ufw allow 443    # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 11. Verify the Deployment

```bash
# App process
pm2 status

# Application logs (last 100 lines)
pm2 logs campusconnect --lines 100

# Caddy
sudo systemctl status caddy
sudo caddy validate --config /etc/caddy/Caddyfile

# Check the live site
curl -I https://tpo.sdmcet.ac.in   # expect: HTTP/2 200
```

Open `https://tpo.sdmcet.ac.in` in a browser. Log in, create a test account, verify email flow, upload a file.

---

## Updating the Application

```bash
cd /var/www/campusconnect

# Pull latest code
git pull origin main

# Install any new dependencies
pnpm install --frozen-lockfile

# Apply new database migrations
pnpm db:migrate:prod

# Rebuild
pnpm build

# Copy new static assets
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Zero-downtime reload
pm2 reload campusconnect
```

---

## Rollback

```bash
# Find the previous good commit
git log --oneline -10

# Roll back to it
git checkout <commit-hash>
pnpm build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
pm2 reload campusconnect
```

---

## Log Management

```bash
# Live tail
pm2 logs campusconnect

# Flush logs
pm2 flush

# Rotate logs automatically (run once)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7

# Caddy logs
sudo tail -f /var/log/caddy/campusconnect.access.log
```

---

## Monitoring

```bash
# PM2 built-in dashboard
pm2 monit

# System resource usage
htop

# Disk usage
df -h
```

---

## Troubleshooting

### App won't start

```bash
pm2 logs campusconnect --err --lines 50
# Common causes: missing .env values, DATABASE_URL unreachable, PORT conflict
```

### nvm: command not found (after reconnecting via SSH)

```bash
# nvm is loaded from ~/.bashrc — make sure it was sourced
source ~/.bashrc
# Or manually load it:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### PM2 can't find node after reboot

When using nvm, PM2's startup script needs the full path to node. Fix with:

```bash
# Re-run startup with the nvm-managed node path
pm2 unstartup systemd
pm2 startup systemd -u campusconnect --hp /home/campusconnect
# Run the printed sudo command, then:
pm2 save
```

### 502 Bad Gateway

```bash
# Check if Next.js is actually running
curl http://127.0.0.1:3000
pm2 status   # should show "online"

# Check Caddy logs
sudo journalctl -u caddy --no-pager -n 50
```

### Caddy won't obtain a certificate

- Ensure ports **80** and **443** are open (`sudo ufw status`)
- Ensure the A record for `tpo.sdmcet.ac.in` points to this server's IP
- Check Caddy logs: `sudo journalctl -u caddy --no-pager -n 100`
- Caddy uses HTTP-01 challenge — port 80 must be reachable from the internet

### Database connection errors

- Confirm `DATABASE_URL` in `.env` is the **pooled** URL (for queries)
- Confirm `DIRECT_URL` is the **non-pooled** URL (for migrations)
- Neon: add `?sslmode=require` to both URLs
- Check your database provider's IP allowlist — add your server's IP

### Google OAuth redirect mismatch

In Google Cloud Console → OAuth 2.0 credentials, the **Authorized redirect URI** must be exactly:
```
https://tpo.sdmcet.ac.in/api/auth/callback/google
```

### Push notifications not working

- HTTPS is required — must be on a real domain, not an IP
- VAPID keys must match between `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
- Check `public/sw.js` is accessible: `curl https://tpo.sdmcet.ac.in/sw.js`

### File uploads failing

- Verify all five `CLOUDFLARE_R2_*` variables are set correctly in `.env`
- Confirm the R2 bucket has public access enabled for the public domain
- Check Caddy `max_size` in the `request_body` block (set to 20MB above — increase if needed)

---

## Environment Variables Reference

All variables the application reads at runtime:

| Variable | Required | Used by |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Prisma runtime (PrismaPg adapter) |
| `DIRECT_URL` | Yes | Prisma Migrate (`pnpm db:migrate:prod`) |
| `AUTH_SECRET` | Yes | NextAuth v5 JWT signing |
| `NEXTAUTH_URL` | Yes | Email verification links |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth |
| `SMTP_HOST` | Yes | Email delivery |
| `SMTP_PORT` | Yes | Email delivery |
| `SMTP_USER` | Yes | Email delivery |
| `SMTP_PASSWORD` | Yes | Email delivery |
| `EMAIL_FROM` | Yes | Email `From:` header |
| `CLOUDFLARE_R2_ENDPOINT` | Yes | File upload/delete |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Yes | File upload/delete |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Yes | File upload/delete |
| `CLOUDFLARE_R2_BUCKET_NAME` | Yes | File upload/delete |
| `CLOUDFLARE_R2_PUBLIC_DOMAIN` | Yes | Public file URLs |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | Push notification subscribe |
| `VAPID_PRIVATE_KEY` | Yes | Push notification send |
| `VAPID_EMAIL` | Yes | VAPID contact |
| `CRON_SECRET` | Yes | Deadline reminder cron auth |
