# 🚀 Build Information System

## Overview
The build information system displays the current Git commit ID and build details in the web application header, allowing you to verify you're running the latest version.

## Files
- `build-info.js` - Contains build information (commit ID, date, version, branch)
- `update-build-info.js` - Node.js script to automatically update build info
- `update-build.bat` - Windows batch script to update build info
- `update-build.sh` - Unix/Linux shell script to update build info

## How It Works

### 1. Build Info Display
The application header shows:
- **Version**: `v1.0.0`
- **Commit ID**: Short commit hash (e.g., `3712136`)
- **Tooltip**: Full commit details on hover
- **Click**: Shows full build information popup

### 2. Console Logging
When the app loads, build info is logged to browser console:
```
🚀 Family Tree v1.0.0
📦 Commit: 3712136 (main)
🕒 Built: 4/22/2024, 12:00:00 PM
```

## Usage

### Before Committing/Deploying
Run one of these commands to update build info:

**Windows:**
```bash
update-build.bat
```

**Mac/Linux:**
```bash
./update-build.sh
```

**Node.js (any platform):**
```bash
node update-build-info.js
```

### Manual Update
If scripts don't work, manually edit `build-info.js`:
```javascript
export const BUILD_INFO = {
  commitId: 'your-full-commit-hash',
  buildDate: '2024-04-22T12:00:00.000Z',
  version: '1.0.0',
  branch: 'main'
};
```

## Verification

### In Browser
1. Open the family tree application
2. Look at the top-right corner of the header
3. You should see version and commit ID
4. Click the commit ID for full details

### In Console
1. Open browser developer tools
2. Check console for build info logs
3. Verify commit ID matches your latest commit

### Git Comparison
Compare displayed commit with Git:
```bash
git rev-parse --short HEAD  # Should match displayed commit
git log -1 --oneline        # Shows latest commit
```

## Troubleshooting

### Build Info Not Showing
- Check browser console for errors
- Verify `build-info.js` is properly imported
- Ensure no JavaScript errors in app.js

### Wrong Commit ID
- Run update script before testing
- Check that Git is available in your PATH
- Verify you're in the correct Git repository

### Scripts Not Working
- **Node.js**: Install Node.js and ensure it's in PATH
- **Git**: Ensure Git is installed and in PATH
- **Permissions**: Make shell scripts executable (`chmod +x update-build.sh`)

## Integration with Deployment

### GitHub Actions
Add to your workflow:
```yaml
- name: Update build info
  run: node update-build-info.js
```

### Manual Deployment
Always run update script before:
1. Committing changes
2. Pushing to GitHub
3. Deploying to production

## Benefits
- **Version verification**: Confirm you're running the latest code
- **Debugging**: Identify which commit is deployed
- **Development**: Track changes during testing
- **Production**: Verify successful deployments