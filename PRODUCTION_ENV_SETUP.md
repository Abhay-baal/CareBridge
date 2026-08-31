# CareBridge Production Environment Setup Guide

## Quick Start for Production Deployment

### Backend Production Environment (.env)

Copy the below template and fill in your actual production values:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=production
PORT=5000

# ============================================
# DATABASE
# ============================================
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/carebridge?retryWrites=true&w=majority
MONGO_DNS_SERVERS=1.1.1.1,8.8.8.8

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
# Generate with: openssl rand -base64 32
JWT_SECRET=<GENERATE_STRONG_SECRET_32_CHARS>
JWT_EXPIRES_IN=7d

# Owner credentials (hash with bcrypt for security)
OWNER_USERNAME=admin
OWNER_ACCESS_KEY_HASH=<BCRYPT_HASH_HERE>
OWNER_PASSWORD_HASH=<BCRYPT_HASH_HERE>

# ============================================
# FILE STORAGE (Cloudinary)
# ============================================
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# ============================================
# EMAIL CONFIGURATION
# ============================================
# For Gmail: Use App Password (not regular password)
# For SendGrid: Use API key as password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@carebridge.com

# ============================================
# FIREBASE (Admin SDK)
# ============================================
# Path to firebase-service-account.json on your server
FIREBASE_SERVICE_ACCOUNT_PATH=/var/www/carebridge/firebase-service-account.json

# ============================================
# CORS - PRODUCTION ORIGINS
# ============================================
# Add all frontend domains here (comma-separated, no spaces)
CORS_ORIGINS=https://carebridge.com,https://www.carebridge.com,https://app.carebridge.com

# ============================================
# OPTIONAL: MONITORING & LOGGING
# ============================================
# SENTRY_DSN=https://key@sentry.io/project-id
# LOG_LEVEL=info
```

### Frontend Production Environment (Vercel/Netlify Dashboard)

Set these as environment variables in your deployment platform:

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

---

## How to Generate Secure Values

### Generate JWT_SECRET
```bash
# On your terminal (macOS/Linux)
openssl rand -base64 32
```
Output example: `K7mJkL9nO2pQ5rS8tU3vW4xY6zA1bC2dE3fG4hI5jK6lM7`

### Hash Owner Credentials with bcrypt

**Option 1: Using Node.js**
```javascript
const bcrypt = require('bcrypt');

// Hash the access key
const accessKey = 'your-secret-access-key';
bcrypt.hash(accessKey, 10, (err, hash) => {
  console.log('OWNER_ACCESS_KEY_HASH:', hash);
});

// Hash the password
const password = 'your-owner-password';
bcrypt.hash(password, 10, (err, hash) => {
  console.log('OWNER_PASSWORD_HASH:', hash);
});
```

**Option 2: Using an online bcrypt tool** (for testing only)
- Visit: https://bcrypt-generator.com/
- Enter your value and click "Hash"
- Copy the hash to your `.env`

---

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables are defined and correct
- [ ] Firebase service account JSON is uploaded to server
- [ ] MongoDB Atlas firewall allows server IP
- [ ] Cloudinary credentials are valid
- [ ] SMTP server credentials work (test email sending)
- [ ] Domain DNS is pointing to your server/CDN
- [ ] SSL certificate is ready (Let's Encrypt)

### Deployment
- [ ] Backend code pushed to production server
- [ ] Frontend code pushed to Vercel/Netlify
- [ ] Environment variables set on both platforms
- [ ] `npm run build` succeeds
- [ ] Backend server starts without errors
- [ ] Frontend loads at production domain

### Post-Deployment
- [ ] Test `/api/health` endpoint returns success
- [ ] Test login page loads
- [ ] Test user registration flow
- [ ] Test role-based redirects (child/parent/provider)
- [ ] Test email notifications send
- [ ] Test file uploads (health records)
- [ ] Test real-time features (chat, notifications)
- [ ] Monitor logs for errors
- [ ] Confirm HTTPS enforced everywhere

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Set up error tracking (Sentry)
- [ ] Set up log aggregation (if needed)
- [ ] Enable email alerts for critical errors

---

## Common Mistakes to Avoid

❌ **Don't:**
- Commit `.env` file to Git
- Use `http://` URLs in production (use `https://`)
- Expose JWT_SECRET in client-side code
- Allow CORS from wildcard origin `*`
- Use hardcoded localhost/tunnel URLs
- Skip HTTPS certificate setup
- Forget to set `NODE_ENV=production`
- Leave debug mode enabled

✅ **Do:**
- Use environment variables for all secrets
- Use HTTPS everywhere
- Keep JWT_SECRET secure on backend only
- Whitelist specific CORS origins
- Use deployment platform env var management
- Set up automatic HTTPS renewal
- Set `NODE_ENV=production` in backend
- Disable debug output in production

---

## Platform-Specific Setup

### Vercel (for Frontend)
1. Connect GitHub repo to Vercel
2. Go to Settings → Environment Variables
3. Add all `NEXT_PUBLIC_*` variables
4. Each push to main triggers auto-deploy
5. Vercel auto-manages SSL/HTTPS

### Heroku (for Backend)
```bash
heroku apps:create carebridge-api
heroku buildpacks:set heroku/nodejs
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<your-value>
# Set all other env vars
git push heroku main
```

### Railway.app (for Backend)
1. Connect GitHub repo
2. Create environment variables in dashboard
3. Railway auto-deploys on push
4. Provides free SSL certificate

### DigitalOcean App Platform (for Both)
1. Create new app
2. Connect GitHub
3. Set environment variables per component
4. Auto-manages SSL
5. Scales easily

---

## Troubleshooting Production Issues

### Backend won't start
```bash
# Check logs
heroku logs --tail  # if using Heroku
# or SSH and check: journalctl -u carebridge
# Check all required env vars are set
```

### Frontend can't connect to API
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend CORS allows frontend domain
- Check browser console for error details
- Verify DNS resolution: `nslookup api.carebridge.com`

### Database connection fails
- Verify MongoDB URI format
- Check firewall: does it allow server IP?
- Test: `mongo <uri>` from server
- Check connection limit isn't exceeded

### Emails not sending
- Verify SMTP credentials work
- Check spam folder (Gmail)
- For Gmail: use App Password, not regular password
- For SendGrid: verify API key format
- Check logs for SMTP error messages

---

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
