/**
 * Build Information Module
 * Automatically updated during build process
 */

// This will be automatically updated by the build script
export const BUILD_INFO = {
  commitId: '3712136e8c0d1ea3b6728c08efbc6c513e0824ff',
  buildDate: '2024-04-22T12:00:00.000Z',
  version: '1.0.0',
  branch: 'main'
};

// Function to get formatted build info
export function getBuildInfo() {
  return {
    ...BUILD_INFO,
    shortCommit: BUILD_INFO.commitId.substring(0, 7),
    formattedDate: new Date(BUILD_INFO.buildDate).toLocaleString()
  };
}

// Function to display build info in console
export function logBuildInfo() {
  const info = getBuildInfo();
  console.log(`🚀 Family Tree v${info.version}`);
  console.log(`📦 Commit: ${info.shortCommit} (${info.branch})`);
  console.log(`🕒 Built: ${info.formattedDate}`);
}