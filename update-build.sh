#!/bin/bash

echo "Updating build information..."
echo "================================"

# Check if Node.js is available
if command -v node &> /dev/null; then
    echo "Using Node.js to update build info..."
    node update-build-info.js
else
    echo "Node.js not found, updating manually..."
    
    # Get Git commit info manually
    SHORT_COMMIT=$(git rev-parse --short HEAD)
    FULL_COMMIT=$(git rev-parse HEAD)
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    
    echo "Short Commit: $SHORT_COMMIT"
    echo "Full Commit: $FULL_COMMIT"
    echo "Branch: $BRANCH"
    echo "Build Date: $BUILD_DATE"
    
    # Update build-info.js directly
    sed -i.bak "s/commitId: '[^']*'/commitId: '$FULL_COMMIT'/" build-info.js
    sed -i.bak "s/buildDate: '[^']*'/buildDate: '$BUILD_DATE'/" build-info.js
    sed -i.bak "s/branch: '[^']*'/branch: '$BRANCH'/" build-info.js
    
    echo "✅ Build info updated in build-info.js"
fi

echo ""
echo "Build info update complete!"