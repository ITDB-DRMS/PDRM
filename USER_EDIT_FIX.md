# User Edit Fix - "Access check failed" Error

## Problem
User edit was failing with the error: **"Access check failed"**

## Root Cause
The `canAccessUser` middleware in `dataScope.js` was trying to access `req.user.id`, but the `protect` middleware in `authMiddleware.js` attaches the full user object to `req.user`, not just the ID.

### Code Issue
```javascript
// In dataScope.js (WRONG)
const currentUser = await User.findById(req.user.id)  // ❌ req.user.id is undefined

// In authMiddleware.js
req.user = user;  // Full user object, not just ID
```

## Solution
Changed `req.user.id` to `req.user._id` in the `dataScope.js` middleware.

### Files Modified
- ✅ `BACKEND/middleware/dataScope.js`
  - Line 11: `applyScopeFilter` - Changed `req.user.id` to `req.user._id`
  - Line 95: `canAccessUser` - Changed `req.user.id` to `req.user._id`

### Code Fix
```javascript
// BEFORE (caused error)
const currentUser = await User.findById(req.user.id)

// AFTER (works correctly)
const currentUser = await User.findById(req.user._id)
```

## Testing
1. Try editing a user through the UI
2. The edit should now work without "Access check failed" error
3. Verify that access control still works correctly (users can only edit users they have access to)

## Why This Happened
When we implemented the permission middleware, we didn't notice that the existing `dataScope.js` middleware was using `req.user.id` instead of `req.user._id`. MongoDB uses `_id` as the primary key field name, not `id`.

## Status
✅ **FIXED** - User edit should now work correctly!

---

**Note**: The server should automatically restart and apply the changes. If not, restart the backend server:
```bash
cd BACKEND
npm start
```
