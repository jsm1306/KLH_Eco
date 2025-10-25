# TODO: Implement Google Authentication and User Schema

## Backend Tasks
- [x] Install passport and passport-google-oauth20 dependencies in backend/package.json
- [x] Create backend/models/User.js with User schema (mail, name, role enum)
- [x] Update backend/server.js to set up Passport Google strategy, serialize/deserialize, and add auth routes (/auth/google, /auth/google/callback, /auth/logout, /auth/current_user)

## Frontend Tasks
- [x] Install react-router-dom dependency in frontend/package.json
- [x] Update frontend/src/App.js to include routing and Login component
- [x] Create frontend/src/components/Login.js with Google login button
- [x] Create frontend/src/components/Dashboard.js for post-login page

## Followup Steps
- [x] Install all dependencies (npm install in backend and frontend)
- [x] Fix session middleware and port issues
- [ ] Test the login flow: Run backend and frontend, verify user creation in DB
