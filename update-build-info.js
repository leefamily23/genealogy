#!/usr/bin/env node

/**
 * Build Script to Update Commit Information
 * Run this before deploying to update build info
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function updateBuildInfo() {
  try {
    // Get Git information
    const commitId = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const buildDate = new Date().toISOString();

    // Read current build-info.js
    const buildInfoPath = path.join(__dirname, 'build-info.js');
    let content = fs.readFileSync(buildInfoPath, 'utf8');

    // Update the BUILD_INFO object
    const newBuildInfo = `export const BUILD_INFO = {
  commitId: '${commitId}',
  buildDate: '${buildDate}',
  version: '1.0.0',
  branch: '${branch}'
};`;

    // Replace the BUILD_INFO export
    content = content.replace(
      /export const BUILD_INFO = \{[\s\S]*?\};/,
      newBuildInfo
    );

    // Write updated content
    fs.writeFileSync(buildInfoPath, content);

    console.log('✅ Build info updated successfully!');
    console.log(`📦 Commit: ${shortCommit} (${branch})`);
    console.log(`🕒 Build Date: ${new Date(buildDate).toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error updating build info:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateBuildInfo();
}

module.exports = { updateBuildInfo };