# CareBridge
A healthcare platform for remote parent care built with the MERN stack.

## Production readiness

This project is now configured for deployment with environment-based settings instead of hardcoded localhost and tunnel URLs.

### Required environment files

Frontend:
- Copy `frontend/.env.example` to `frontend/.env.local` for local development
- For production, set the actual values in your hosting platform environment

Backend:
- Copy `backend/.env.example` to `backend/.env` for local development
- For production, set the actual values in your server environment

### Production deployment notes

- Frontend should use a real production API URL in `NEXT_PUBLIC_API_URL`
- Backend must allow the frontend origin through `CORS_ORIGINS`
- Keep `.env` files out of source control
- Use a secure JWT secret, MongoDB Atlas connection, and Firebase service account credentials

### Recommended deployment setup

- Frontend: Vercel or any Node-compatible static/server host
- Backend: Render, Railway, DigitalOcean App Platform, or a Node server
- Database: MongoDB Atlas
- Files/CDN: Cloudinary
- Email: SMTP provider
- Notifications: Firebase Cloud Messaging

### Local verification

```bash
cd frontend && npm run build
cd backend && node server.js
```

The frontend should compile successfully and the backend should start and connect to MongoDB without using local development-only hardcoded URLs.
