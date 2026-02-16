# Syntiant Atlas - Complete Deployment Guide

This guide provides step-by-step instructions to deploy the Syntiant Atlas platform using:
- **Vercel** - Next.js frontend
- **Railway** - NestJS API backend
- **Neon** - PostgreSQL database (already configured)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Setup (Neon)](#database-setup-neon)
4. [API Deployment (Railway)](#api-deployment-railway)
5. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
6. [Post-Deployment](#post-deployment)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [Railway Account](https://railway.app) (free tier available)
- [Vercel Account](https://vercel.com) (free tier available)
- [Neon Account](https://neon.tech) (already configured)
- [GitHub Account](https://github.com) (for automatic deployments)

### Required Tools
```bash
node --version  # v18.0.0 or higher
npm --version   # v9.0.0 or higher
git --version
```

### Optional Services (Production Recommended)
- **Upstash Redis** - For caching and sessions
- **Stripe Account** - For payments
- **SendGrid/Resend** - For email services
- **Sentry** - For error tracking

---

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Vercel    │─────▶│   Railway    │─────▶│    Neon     │
│  (Next.js)  │      │  (NestJS API)│      │ (PostgreSQL)│
│  Frontend   │      │  + WebSockets│      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Redis     │
                     │  (Upstash or │
                     │   Railway)   │
                     └──────────────┘
```

**Why this architecture?**
- Vercel: Optimized for Next.js with global CDN and edge functions
- Railway: Supports WebSockets, Redis, background jobs, and persistent connections
- Neon: Serverless PostgreSQL with branching and autoscaling

---

## Database Setup (Neon)

### Step 1: Verify Neon Database
Since you already have Neon configured, verify your setup:

1. Login to [Neon Console](https://console.neon.tech)
2. Navigate to your project
3. Go to **Dashboard** → **Connection Details**
4. Copy your connection string (it should look like):
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Run Database Migrations

From your project root:

```bash
# Set your Neon database URL
export DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed database with initial data
npm run db:seed
```

### Step 3: Create Production Branch (Recommended)

1. In Neon Console, go to **Branches**
2. Click **Create Branch**
3. Name it `production`
4. This creates an isolated database for production

---

## API Deployment (Railway)

### Step 1: Create Redis Service

1. Login to [Railway](https://railway.app)
2. Create a **New Project**
3. Click **+ New** → **Database** → **Add Redis**
4. Railway will provision Redis and provide `REDIS_URL`

### Step 2: Prepare API for Deployment

Ensure your `apps/api/railway.toml` is configured (already done):

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npx prisma generate && npm run build"

[deploy]
startCommand = "npm run start:prod"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[env]
NODE_ENV = "production"
```

### Step 3: Deploy API to Railway

#### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. In Railway dashboard:
   - Click **+ New** → **GitHub Repo**
   - Select your repository
   - Select `apps/api` as the root directory
   - Railway will auto-detect the NestJS app

#### Option B: Deploy using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Deploy
cd apps/api
railway up
```

### Step 4: Configure API Environment Variables

In Railway dashboard, go to your API service → **Variables** and add:

#### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Redis (auto-provided by Railway Redis service)
REDIS_URL=${{Redis.REDIS_URL}}

# Application
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://your-app.vercel.app

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<generate-another-strong-secret>
JWT_REFRESH_EXPIRES_IN=30d

# Encryption
ENCRYPTION_KEY=<generate-32-byte-hex-key>
```

#### Optional Variables (Recommended for Production)

```bash
# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# Logging
LOG_LEVEL=info
```

#### Generate Secrets

```bash
# JWT_SECRET & JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Link Redis to API

In Railway:
1. Click on your API service
2. Go to **Settings** → **Service Variables**
3. Add reference: `REDIS_URL` = `${{Redis.REDIS_URL}}`
4. This links your Redis service to the API

### Step 6: Configure Custom Domain (Optional)

1. Go to API service → **Settings** → **Networking**
2. Click **Generate Domain** (Railway provides free subdomain)
3. Or add your custom domain (e.g., `api.yourdomain.com`)

### Step 7: Verify API Deployment

Once deployed, test your API:

```bash
# Get your Railway API URL (e.g., https://your-app.railway.app)
curl https://your-app.railway.app/api/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":123,"database":"connected","redis":"connected"}
```

---

## Frontend Deployment (Vercel)

### Step 1: Update Next.js Configuration

Update `apps/web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@syntiant/shared'],
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  },
};

module.exports = nextConfig;
```

### Step 2: Update Vercel Configuration

Your `vercel.json` should route API calls to Railway:

```json
{
  "version": 2,
  "buildCommand": "cd apps/web && npm install && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-app.railway.app/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Important:** Replace `https://your-app.railway.app` with your actual Railway API URL.

### Step 3: Deploy to Vercel

#### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. Login to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click **Add New** → **Project**

4. Import your GitHub repository

5. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

6. Click **Deploy**

#### Option B: Deploy using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from apps/web directory
cd apps/web
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory to current directory
# - Override settings if needed

# Production deployment
vercel --prod
```

### Step 4: Configure Frontend Environment Variables

In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```bash
# API URLs (use your Railway API URL)
NEXT_PUBLIC_API_URL=https://your-app.railway.app
NEXT_PUBLIC_WS_URL=wss://your-app.railway.app

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_MARKETPLACE=true
NEXT_PUBLIC_ENABLE_GOVERNANCE=true
```

### Step 5: Update CORS in Railway

Go back to Railway → API service → **Variables** and update:

```bash
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

Redeploy the API after changing CORS settings.

### Step 6: Configure Custom Domain (Optional)

1. Go to Vercel project → **Settings** → **Domains**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificate

---

## Post-Deployment

### 1. Verify All Services

```bash
# Check API health
curl https://your-app.railway.app/api/health

# Check Redis
curl https://your-app.railway.app/api/health | grep redis

# Check database
curl https://your-app.railway.app/api/health | grep database

# Check frontend
curl -I https://your-app.vercel.app
```

### 2. Test WebSocket Connection

```javascript
// In browser console on your frontend
const ws = new WebSocket('wss://your-app.railway.app');
ws.onopen = () => console.log('WebSocket connected!');
ws.onerror = (err) => console.error('WebSocket error:', err);
```

### 3. Run E2E Tests

```bash
# Update playwright.config.ts with your production URLs
# Then run:
npm run test:e2e
```

### 4. Monitor Logs

**Railway Logs:**
```bash
railway logs --service api
```

**Vercel Logs:**
- Go to Vercel dashboard → Your project → **Deployments** → Click on deployment → **Logs**

### 5. Set Up Monitoring

#### Sentry (Error Tracking)
Already integrated. Verify in Sentry dashboard after deployment.

#### Railway Metrics
- Go to Railway project → **Metrics**
- Monitor CPU, memory, and request rates

#### Vercel Analytics
- Enable in Vercel dashboard → **Analytics**

---

## Environment Variables Reference

### API (Railway)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx.neon.tech/db` |
| `REDIS_URL` | ✅ | Redis connection string | `redis://default:pass@redis:6379` |
| `JWT_SECRET` | ✅ | JWT signing secret | `64-char-hex-string` |
| `JWT_EXPIRES_IN` | ✅ | JWT expiration | `7d` |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret | `64-char-hex-string` |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | Refresh token expiration | `30d` |
| `ENCRYPTION_KEY` | ✅ | Data encryption key | `32-byte-hex-string` |
| `NODE_ENV` | ✅ | Environment | `production` |
| `PORT` | ✅ | Server port | `3001` |
| `ALLOWED_ORIGINS` | ✅ | CORS origins | `https://app.vercel.app` |
| `SENDGRID_API_KEY` | ⚠️ | SendGrid API key | `SG.xxx` |
| `EMAIL_FROM` | ⚠️ | Sender email | `noreply@domain.com` |
| `STRIPE_SECRET_KEY` | ⚠️ | Stripe secret key | `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ | Stripe webhook secret | `whsec_xxx` |
| `SENTRY_DSN` | ⚠️ | Sentry DSN | `https://xxx@sentry.io/xxx` |
| `LOG_LEVEL` | ⚠️ | Logging level | `info` |

### Frontend (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | ✅ | API base URL | `https://api.railway.app` |
| `NEXT_PUBLIC_WS_URL` | ✅ | WebSocket URL | `wss://api.railway.app` |
| `NEXT_PUBLIC_GA_ID` | ❌ | Google Analytics ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_ENABLE_MARKETPLACE` | ❌ | Enable marketplace | `true` |

✅ = Required | ⚠️ = Recommended | ❌ = Optional

---

## Troubleshooting

### API Issues

#### "Cannot connect to database"
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection from Railway shell
railway run -- npx prisma db push

# Check Neon dashboard for connection limits
```

#### "Redis connection failed"
```bash
# Verify Redis service is running in Railway
railway status

# Check REDIS_URL variable
railway variables

# Restart Redis service if needed
```

#### "WebSocket connection refused"
- Ensure Railway is using web server mode (not serverless)
- Verify port is exposed (Railway handles this automatically)
- Check CORS settings include WebSocket origin

### Frontend Issues

#### "API calls failing"
1. Verify `vercel.json` rewrites point to correct Railway URL
2. Check CORS settings in Railway API
3. Test API directly: `curl https://your-app.railway.app/api/health`

#### "Environment variables not available"
1. Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding new variables
3. Check Vercel dashboard → **Settings** → **Environment Variables**

#### "Build failing"
```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing dependencies
# - TypeScript errors
# - Incorrect build command

# Test build locally
cd apps/web
npm run build
```

### Database Migration Issues

```bash
# Reset and re-run migrations
railway run -- npx prisma migrate reset
railway run -- npx prisma migrate deploy

# Or create new migration
railway run -- npx prisma migrate dev --name init
```

### Performance Issues

#### API slow response
- Check Railway metrics for CPU/memory usage
- Consider upgrading Railway plan
- Enable Redis caching
- Optimize database queries

#### Frontend slow loading
- Enable Vercel Speed Insights
- Check bundle size: `npm run build` in apps/web
- Consider code splitting and lazy loading

---

## Deployment Checklist

Before going live:

- [ ] Database migrations completed
- [ ] All environment variables configured
- [ ] CORS settings allow frontend domain
- [ ] SSL certificates active (auto-managed by Vercel/Railway)
- [ ] Custom domains configured (if applicable)
- [ ] Health checks passing
- [ ] WebSocket connection working
- [ ] Email service configured and tested
- [ ] Stripe webhooks configured (if using payments)
- [ ] Error tracking (Sentry) configured
- [ ] Monitoring dashboards set up
- [ ] Backup strategy for database (Neon handles this)
- [ ] E2E tests passing
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] API documentation accessible

---

## Useful Commands

### Railway
```bash
# View logs
railway logs

# Open dashboard
railway open

# Check status
railway status

# Run command in Railway environment
railway run -- npm run db:migrate

# SSH into service
railway shell
```

### Vercel
```bash
# View logs
vercel logs

# List deployments
vercel ls

# Rollback deployment
vercel rollback

# Open dashboard
vercel open
```

### Database (Prisma)
```bash
# Generate client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset
```

---

## Support & Resources

### Documentation
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)

### Community
- [Railway Discord](https://discord.gg/railway)
- [Vercel Discord](https://discord.gg/vercel)
- [Neon Discord](https://discord.gg/neon)

---

## Cost Estimation

### Free Tier (Development/Testing)
- **Railway:** $5 credit/month, then $0.000463/GB-hour
- **Vercel:** 100GB bandwidth, unlimited deployments
- **Neon:** 0.5GB storage, 20 compute hours/month
- **Total:** ~$0-10/month for low traffic

### Production (Estimated)
- **Railway:** ~$20-50/month (API + Redis)
- **Vercel:** ~$20/month (Pro plan recommended)
- **Neon:** ~$15-30/month (based on usage)
- **Upstash Redis:** ~$10/month (alternative to Railway Redis)
- **Total:** ~$50-100/month for moderate traffic

### Enterprise
Consider upgrading to paid tiers for:
- Higher rate limits
- Better performance
- Dedicated support
- SLA guarantees

---

## Next Steps

1. **Security Audit:** Review and harden security settings
2. **Load Testing:** Test with expected traffic volumes
3. **Backup Strategy:** Configure automated backups
4. **CI/CD Pipeline:** Set up automated testing and deployment
5. **Documentation:** Document your specific configuration
6. **Monitoring:** Set up alerts for critical metrics

---

**Deployment Date:** _________________  
**Deployed By:** _________________  
**Production URLs:**
- Frontend: _________________
- API: _________________
- Database: _________________

---

*For urgent issues, contact your team lead or post in the #deployments channel.*
