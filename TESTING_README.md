# 🧪 Local Testing Setup

## Quick Start

### Option 1: Automated Test Server
**Windows:**
```bash
start-local-test.bat
```

**Mac/Linux:**
```bash
./start-local-test.sh
```

### Option 2: Manual Server Setup
**Python:**
```bash
python -m http.server 8000
# or
python3 -m http.server 8000
```

**Node.js:**
```bash
npx http-server -p 8000
```

Then open: http://localhost:8000/test-local.html

## Testing Files

### 📄 test-local.html
- **Purpose**: Interactive testing dashboard
- **Features**: 
  - Embedded application iframe
  - Manual test buttons
  - Automated test runners
  - Real-time test results

### 📋 TEST_CHECKLIST.md
- **Purpose**: Comprehensive testing checklist
- **Use**: Go through each item before committing
- **Covers**: Authentication, CRUD, UI/UX, Database, Performance

### 🔧 test-script.js
- **Purpose**: Automated testing functions
- **Usage**: Run in browser console
- **Commands**:
  ```javascript
  runTests()  // Run all automated tests
  ```

## Testing Workflow

### 1. Start Local Server
Run one of the server startup scripts to serve the application locally.

### 2. Open Testing Dashboard
Navigate to `http://localhost:8000/test-local.html` in your browser.

### 3. Run Automated Tests
- Click test buttons in the dashboard
- Or open browser console and run `runTests()`

### 4. Manual Testing
- Use the embedded iframe to test the actual application
- Follow the TEST_CHECKLIST.md for comprehensive testing
- Test all CRUD operations, authentication, and UI features

### 5. Verify Results
- Check console for any errors
- Ensure all test items pass
- Verify no regressions in existing functionality

## Key Test Areas

### 🔐 Authentication
- Google Sign-In flow
- User role assignment
- Permission-based UI changes

### 🌳 Tree Rendering
- Hierarchical structure
- Spouse relationships
- No duplicate spouses
- Marriage links display

### ✏️ CRUD Operations
- Add family members
- Add spouses (with proper linking)
- Edit existing members
- Delete leaf nodes only

### 🎨 UI/UX
- Field name changes (Chinese Name/Nickname)
- Fixed sidebar positioning
- Scrollable Recent Edits
- Language toggle functionality

### 🗄️ Database
- Sequential numeric IDs
- Bidirectional spouse relationships
- Real-time updates
- Security rules

## Browser Console Testing

Open browser console and run:

```javascript
// Run all automated tests
runTests()

// Or create custom tester
const tester = new FamilyTreeTester();
tester.runAllTests();
```

## Common Issues & Solutions

### CORS Errors
- **Problem**: Opening HTML files directly in browser
- **Solution**: Use local server (Python/Node.js)

### Firebase Connection
- **Problem**: Firebase not connecting locally
- **Solution**: Ensure Firebase config is correct and network is available

### Module Loading
- **Problem**: ES6 modules not loading
- **Solution**: Must use HTTP server, not file:// protocol

## Pre-Commit Checklist

Before committing to GitHub, ensure:

- [ ] All automated tests pass
- [ ] Manual testing completed
- [ ] No console errors
- [ ] All new features work
- [ ] No regressions
- [ ] Performance is acceptable

## Debugging Tips

### Check Network Tab
- Verify Firebase requests are successful
- Check for 404s on missing resources

### Check Console
- Look for JavaScript errors
- Verify module loading

### Check Application Tab
- Verify Firebase authentication state
- Check local storage/session storage

### Check Elements Tab
- Verify DOM structure is correct
- Check CSS styles are applied

## Ready to Commit?

Once all tests pass and manual verification is complete:

1. Review all changes
2. Update documentation if needed
3. Commit with descriptive message
4. Push to GitHub

Example commit message:
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