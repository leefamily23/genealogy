# 🧪 Family Tree - Pre-Commit Testing Checklist

## Overview
Complete this checklist before committing changes to GitHub to ensure all functionality works correctly.

## 🔐 Authentication Tests

### ✅ Google Sign-In
- [ ] Sign-in button appears when not authenticated
- [ ] Google sign-in popup opens correctly
- [ ] User can successfully authenticate
- [ ] UI updates to show user name after sign-in
- [ ] Sign-out button appears after authentication

### ✅ User Roles & Permissions
- [ ] Admin user can be created on first sign-in
- [ ] Admin can access "Manage Users" button
- [ ] Editor users cannot see "Manage Users" button
- [ ] Viewer users cannot edit or add members

### ✅ User Management (Admin Only)
- [ ] Admin can invite new users by email
- [ ] Invited users appear in user list
- [ ] Admin can change user roles
- [ ] Admin can remove user access
- [ ] Cannot delete the last admin user

## 🌳 Tree Rendering Tests

### ✅ Basic Tree Structure
- [ ] Family tree renders without "multiple roots" error
- [ ] Tree shows proper hierarchical structure (generations)
- [ ] Parent-child relationships display correctly
- [ ] Tree is zoomable and pannable
- [ ] Reset button centers the tree

### ✅ Spouse Relationships
- [ ] Spouses appear next to their partners
- [ ] Marriage links (red dashed lines) connect couples
- [ ] Each spouse appears only once (no duplicates)
- [ ] Spouse nodes are clickable and show details

### ✅ Visual Elements
- [ ] Male members show as blue circles
- [ ] Female members show as pink circles
- [ ] Names display correctly below nodes
- [ ] Birth/death years show below names
- [ ] Language toggle switches between Chinese names and nicknames

## ✏️ CRUD Operations Tests

### ✅ Add Family Member
- [ ] "Add Child" button works from detail panel
- [ ] Form opens with correct title
- [ ] All fields are present: Chinese Name, Nickname, Gender, Birth, Death, Notes
- [ ] Form validation requires Chinese Name
- [ ] New member appears in tree after saving
- [ ] New member gets sequential numeric ID in Firestore

### ✅ Add Spouse
- [ ] "Add Spouse" button works from detail panel
- [ ] Form opens with "Add Spouse" title
- [ ] No spouse input field in form (removed as requested)
- [ ] New spouse appears next to partner in tree
- [ ] Marriage link connects the couple
- [ ] Both members reference each other in database
- [ ] Spouse gets sequential numeric ID in Firestore

### ✅ Edit Member
- [ ] "Edit" button opens form with existing data
- [ ] All fields are pre-populated correctly
- [ ] Changes save and update in tree immediately
- [ ] History entry is created for the edit

### ✅ Delete Member
- [ ] Delete button only appears for leaf nodes (no children)
- [ ] Delete button hidden for members with children
- [ ] Confirmation dialog appears before deletion
- [ ] Member is removed from tree after confirmation
- [ ] History entry is created for the deletion

## 🎨 UI/UX Tests

### ✅ Field Name Changes
- [ ] Form shows "Chinese Name 中文名" (not "English Name")
- [ ] Form shows "Nickname 昵称" (not "Chinese Name")
- [ ] Tree displays Chinese names as primary
- [ ] Language toggle switches to nicknames correctly

### ✅ Sidebar Functionality
- [ ] Left sidebar is always visible (not a popup)
- [ ] Sidebar shows "Member Details" section
- [ ] Sidebar shows "Recent Edits" section
- [ ] Only "Recent Edits" section is scrollable
- [ ] Clicking a tree node updates sidebar details
- [ ] Action buttons appear in sidebar for editors/admins

### ✅ Responsive Design
- [ ] Tree works on different screen sizes
- [ ] Sidebar doesn't overlap tree content
- [ ] Zoom controls are accessible
- [ ] Search functionality works

## 🗄️ Database Tests

### ✅ Firestore Structure
- [ ] New documents use sequential numeric IDs (30, 31, 32...)
- [ ] No random alphanumeric IDs are created
- [ ] Spouse relationships are bidirectional
- [ ] Parent-child relationships are correct

### ✅ Security Rules
- [ ] Unauthenticated users cannot read/write data
- [ ] Authenticated users can read family data
- [ ] Only editors/admins can write family data
- [ ] Users can only modify their own user record

### ✅ Real-time Updates
- [ ] Changes appear immediately in tree
- [ ] Recent edits update in real-time
- [ ] Multiple users see changes simultaneously

## 🔍 Search & Navigation

### ✅ Search Functionality
- [ ] Search input accepts Chinese characters
- [ ] Search finds members by Chinese name
- [ ] Search finds members by nickname
- [ ] Search highlights found members
- [ ] Search centers tree on found member

### ✅ Tree Navigation
- [ ] Zoom in/out buttons work
- [ ] Reset button centers tree
- [ ] Mouse wheel zooming works
- [ ] Click and drag panning works

## 📱 Cross-Browser Testing

### ✅ Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

## 🚨 Error Handling

### ✅ Error States
- [ ] Network errors show user-friendly messages
- [ ] Form validation errors are clear
- [ ] Firestore errors don't crash the app
- [ ] Loading states are shown appropriately

## 📊 Performance Tests

### ✅ Performance
- [ ] Tree renders quickly with current data size
- [ ] No memory leaks during navigation
- [ ] Smooth zooming and panning
- [ ] Form submissions are responsive

---

## 🎯 Final Checklist Before Commit

- [ ] All automated tests pass
- [ ] All manual tests completed
- [ ] No console errors in browser
- [ ] No TypeScript/JavaScript errors
- [ ] All new features work as expected
- [ ] No regressions in existing functionality
- [ ] Code is clean and commented
- [ ] Test files are included

## 🚀 Ready to Commit!

Once all items are checked, the code is ready for GitHub commit.

**Commit Message Template:**
```
feat: Enhanced family tree with spouse functionality

- Fixed Add Spouse button error
- Implemented proper spouse relationships
- Added sequential numeric document IDs
- Updated field names (Chinese Name/Nickname)
- Fixed duplicate spouse rendering issue
- Maintained hierarchical tree structure

Tested: All CRUD operations, authentication, UI/UX
```