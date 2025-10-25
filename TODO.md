# TODO: Implement Claim Feature for Lost and Found

## Backend Changes
- [x] Update LostFound model to include claims array (claimant, message, status, createdAt)
- [x] Add POST /api/lostfound/:id/claim endpoint for submitting claims
- [x] Add GET /api/lostfound/:id/claims endpoint for viewing claims (for poster)
- [x] Add PUT /api/lostfound/:id/claim/:claimId/verify endpoint for approving/rejecting claims and deleting item if approved

## Frontend Changes
- [x] Add "Claim Item" button on each item card (if not own item)
- [x] Add modal for entering claim message
- [x] For item poster, display claims with approve/reject buttons
- [x] Remove item from list when claim is approved and item is deleted

## Testing
- [ ] Test claiming an item
- [ ] Test viewing claims as poster
- [ ] Test approving claim and item deletion
- [ ] Test rejecting claim
