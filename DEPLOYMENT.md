# CareBridge Production Deployment Guide

## Overview
This document outlines the steps to deploy CareBridge to a production environment.

## Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (or on-prem MongoDB)
- Firebase project
- Cloudinary account
- SMTP email service (Gmail, SendGrid, etc.)
- Frontend hosting (Vercel, Netlify, AWS S3 + CloudFront, etc.)
- Backend hosting (Heroku, Railway, AWS EC2, DigitalOcean, etc.)

---

## Backend Deployment

### 1. Environment Variables
Create a `.env` file on your production server with the following:

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/carebridge
MONGO_DNS_SERVERS=1.1.1.1,8.8.8.8

# Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=7d

# Owner Auth (bcrypt-hashed values for security)
OWNER_USERNAME=<your-owner-username>
OWNER_ACCESS_KEY_HASH=<bcrypt-hash>
OWNER_PASSWORD_HASH=<bcrypt-hash>

# Cloud Storage
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Email
SMTP_HOST=<smtp.gmail.com-or-sendgrid>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-email@gmail.com>
SMTP_PASS=<app-password-or-api-key>
SMTP_FROM=noreply@carebridge.com

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json

# CORS (add your frontend domain)
CORS_ORIGINS=https://carebridge.com,https://www.carebridge.com

# Optional: Monitoring/Analytics
SENTRY_DSN=<if-using-sentry>
```

### 2. Deploying the Backend

#### Option A: Heroku
```bash
heroku create carebridge-backend
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=<your-mongo-uri>
heroku config:set JWT_SECRET=<your-jwt-secret>
# Set other env vars via Heroku dashboard or CLI
git push heroku main
```

#### Option B: Railway / Render / AWS
1. Connect your GitHub repo
2. Set environment variables in the dashboard
3. Deploy (usually automatic on push)

#### Option C: Self-hosted (DigitalOcean, AWS EC2, VPS)
```bash
# SSH into server
ssh user@your-server-ip

# Clone repo
git clone <your-repo>
cd CareBridge/backend

# Install dependencies
npm install --production

# Set up environment variables
nano .env  # or use your editor

# Start with PM2 (process manager)
npm install -g pm2
pm2 start server.js --name "carebridge-backend"
pm2 startup
pm2 save

# Set up reverse proxy (nginx)
# Point domain to your server IP
```

### 3. Database Setup
- Ensure MongoDB Atlas firewall allows your server IP
- Or use a private IP if self-hosting

### 4. Firebase Admin SDK
- Download `firebase-service-account.json` from Firebase Console
- Upload to server securely (or reference via secrets manager)
- Update `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`

---

## Frontend Deployment

### 1. Environment Variables
Set these on your deployment platform (Vercel, Netlify, etc.):

```env
NEXT_PUBLIC_API_URL=https://api.carebridge.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDDgqWAIIHI55T9drNak1WvHwGfACgi-sA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=carebridge-3d480.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=carebridge-3d480
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=carebridge-3d480.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=164849250655
NEXT_PUBLIC_FIREBASE_APP_ID=1:164849250655:web:024b172739902898d2c6ea
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-W2F57KK49Y
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BEVqU_nlbwiJLKn191jUuKl8O4xw7FGPBiQ_bbzrUGLrQqtUHoQ8pu23bDR4KORnjpVxAs_x2kjd0McfpgYMyUU
```

### 2. Deploying the Frontend

#### Option A: Vercel (Recommended for Next.js)
```bash
npm install -g vercel
vercel login
vercel --prod
```
Then set environment variables in Vercel Dashboard.

#### Option B: Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

#### Option C: Self-hosted (AWS S3 + CloudFront)
```bash
npm run build
# Upload ./out to S3 bucket
# Set up CloudFront distribution
# Alias domain to CloudFront
```

---

## CORS Configuration

The backend is configured to accept requests from:
- Development: `http://localhost:3000`, `http://127.0.0.1:3000`, `http://192.168.1.8:3000`
- Production: Add your frontend domain via `CORS_ORIGINS` env var

**Example:**
```env
CORS_ORIGINS=https://carebridge.com,https://www.carebridge.com,https://app.carebridge.com
```

---

## Health Check & Verification

### Backend Health
```bash
curl https://api.carebridge.com/api/health
# Expected: {"success": true, "message": "CareBridge API is working"}
```

### Frontend Check
- Navigate to `https://carebridge.com` in a browser
- Should load homepage and redirect to login if not authenticated

---

## SSL/TLS Certificate
- Use Let's Encrypt (automatic on most platforms)
- Ensure HTTPS everywhere
- Force HTTPS redirect

---

## Monitoring & Logging

### Application Logs
- Check deployment platform logs (Heroku, Vercel, etc.)
- Use service like Sentry, LogRocket, or DataDog

### Database Monitoring
- Monitor MongoDB Atlas metrics in dashboard
- Set up alerts for connection failures

### Uptime Monitoring
- Use UptimeRobot or similar to monitor `/api/health` endpoint

---

## Post-Deployment Checklist

- [ ] Backend API responds at production domain
- [ ] Frontend loads and connects to API
- [ ] Login/Register flows work
- [ ] Firebase authentication works
- [ ] Email notifications send
- [ ] File uploads (health records) work
- [ ] Location tracking works
- [ ] Emergency contacts are accessible
- [ ] Chat/messaging is functional
- [ ] PWA is installable
- [ ] All role-based routes redirect correctly
- [ ] HTTPS is enforced
- [ ] Error pages display correctly

---

## Rollback Plan

If deployment fails:
1. Backend: `git revert <commit>` and redeploy
2. Frontend: Use previous deployment from Vercel/Netlify dashboard
3. Database: Keep backups, restore from backup if needed

---

## Troubleshooting

### "CORS blocked origin"
- Check backend `CORS_ORIGINS` env var
- Ensure frontend domain matches exactly
- Clear browser cache

### "Cannot connect to database"
- Verify MongoDB Atlas firewall allows server IP
- Check `MONGO_URI` format
- Test connection: `mongo <connection-string>`

### "Firebase authentication fails"
- Verify Firebase config in frontend `.env`
- Ensure `firebase-service-account.json` path is correct on backend
- Check Firebase project ID matches

### "Email not sending"
- Verify SMTP credentials
- Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- Gmail: Enable "Less secure app access" or use App Password
- SendGrid: Verify API key

---

## Security Hardening

1. **Environment Variables**: Never commit `.env` to Git (use `.env.example`)
2. **Firebase Rules**: Configure Firestore security rules in Firebase Console
3. **MongoDB Access**: Use IP whitelist in MongoDB Atlas
4. **API Rate Limiting**: Already configured in backend via `express-rate-limit`
5. **JWT Secret**: Generate strong value with `openssl rand -base64 32`
6. **HTTPS Only**: Enforce HTTPS redirects
7. **CORS Whitelist**: Only allow your frontend domain(s)

---

## Support
For issues, check logs and refer to respective platform documentation:
- Next.js: https://nextjs.org/docs
- Express.js: https://expressjs.com/
- MongoDB: https://docs.mongodb.com/
- Firebase: https://firebase.google.com/docs
