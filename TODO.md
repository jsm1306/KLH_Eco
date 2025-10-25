# TODO: Implement Lost and Found Feature

## Backend Tasks
- [x] Install multer for image uploads in backend/package.json
- [x] Create backend/models/LostFound.js with schema (user, tag, location, image, description, createdAt)
- [x] Update backend/server.js to add routes: POST /api/lostfound (create item with image upload), GET /api/lostfound (list items)
- [x] Add multer middleware for image handling

## Frontend Tasks
- [x] Install axios in frontend/package.json for API calls
- [x] Update frontend/src/components/Dashboard.js to add Lost and Found tab
- [x] Create frontend/src/components/LostFound.js with form (tag, location, image, description) and list of items

## Followup Steps
- [ ] Test the lost and found feature: Upload item, verify storage in DB, display in dashboard
