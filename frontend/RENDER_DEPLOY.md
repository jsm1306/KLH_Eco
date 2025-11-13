Frontend Render deployment settings

1. Service type
- Static Site (recommended for CRA static build)

2. Basic repo settings
- Repository: jsm1306/KLH_Eco
- Branch: dev (or choose your branch)
- Root Directory: frontend

3. Build & publish
- Build Command: npm ci && npm run build
- Publish Directory: build

4. Environment variables (Render UI > Environment)
- REACT_APP_API_URL = https://klh-eco.onrender.com
- (optional) NODE_ENV = production

5. Files included
- Ensure `frontend/public/_redirects` exists with:
  /*    /index.html   200
  This enables client-side routing on Render

6. Backend settings (Render backend service)
- FRONTEND_URL = https://<your-frontend-render-url>
- BACKEND_URL = https://klh-eco.onrender.com
- GOOGLE_CALLBACK_URL = https://klh-eco.onrender.com/auth/google/callback
- MONG_URI, JWT_SECRET, MAIL_* etc. (set to production values)

7. Local testing
- For local development, CRA will use `.env.development` (created) which sets:
  REACT_APP_API_URL=http://localhost:4000
- Start locally:
  cd frontend
  npm install
  npm start

8. Notes
- Changing `REACT_APP_API_URL` requires rebuilding the frontend (done automatically on Render when env var is set and build is triggered).
