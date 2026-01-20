# Super Admin Visibility Restrictions

## Overview
We have restricted the visibility of system-level administrative components to **Super Admins only**. This ensures that other users (Managers, Branch Admins, etc.) have a focused, operational view without being exposed to system structure, authentication settings, or logs.

## Changes Implemented

### 1. Sidebar Navigation (`AppSidebar.tsx`)
The following menu sections are now **hidden** for everyone except Super Admins:
- **Structure** (Organizations, Sectors, Departments, Teams, Graph)
- **Auth** (Permissions, Roles, Users, Hierarchy)
- **Audit** (Audit Logs, Email Logs)

**How it works:**
- Added `superAdminOnly: true` flag to these navigation items.
- Updated `filterItems` function to check if the user has the `super_admin` role before rendering these items.

### 2. Dashboard Cards (`dashboardService.js`)
The following dashboard statistics cards are now **hidden** for everyone except Super Admins:
- **Organizations Card**
- **Sectors Card**
- **Roles Card**

**How it works:**
- Updated `getUserDashboardPermissions` in the backend service.
- Removed the permission checks for organizations, sectors, and roles for non-super admins.
- These flags (`canViewOrganizations`, etc.) now default to `false` for everyone except Super Admins.

## User Experience

### Super Admin View
- **Sidebar**: Sees Structure, Auth, Audit menus.
- **Dashboard**: Sees all 5 cards (Organizations, Sectors, Departments, Users, Roles).

### Manager / Branch Admin View
- **Sidebar**: Does **NOT** see Structure, Auth, or Audit menus.
- **Dashboard**: Sees only **Departments** and **Users** cards (if they have permission).
- **Note**: Even if they have "View Roles" permission (e.g., to assign roles to users), they will not see the "Roles" count card on the dashboard, keeping it clean.

## Files Modified
- `FRONTEND/src/layout/AppSidebar.tsx`
- `BACKEND/services/dashboardService.js`

## Verification
1. Log in as a **Super Admin**: Verify you see all menus and dashboard cards.
2. Log in as a **Manager**: Verify you **DO NOT** see the Structure/Auth menus and **DO NOT** see the Organizations/Sectors/Roles cards on the dashboard.
