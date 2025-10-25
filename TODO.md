# TODO: Fix Hardcoded Localhost URLs for Deployment

## Frontend Components (Replace localhost:4000 with https://klh-eco-backend.onrender.com)
- [ ] frontend/src/components/Events.js
- [ ] frontend/src/components/Navbar.js
- [ ] frontend/src/components/Feedback.js
- [ ] frontend/src/components/LostFound.js

## Backend Files
- [ ] backend/server.js (CORS origin: localhost:3000 -> https://klh-eco-frontend.onrender.com, redirects)
- [ ] backend/utils/passportConfig.js (callback URL)
- [ ] backend/testBackend.js (baseURL)

## Frontend Public
- [ ] frontend/public/index.html (CSP policy: connect-src and img-src)

## Verification
- [ ] Test frontend and backend integration after changes
