/**
 * Image Viewer Module
 * Handles full-screen image viewing
 */

/**
 * Open image viewer with full-size image
 * @param {string} imageURL - Image URL to display
 * @param {string} memberName - Member name for caption
 */
export function openImageViewer(imageURL, memberName) {
  const modal = document.getElementById('image-viewer-modal');
  const img = document.getElementById('image-viewer-img');
  const nameLabel = document.getElementById('image-viewer-name');
  
  if (!modal || !img || !nameLabel) {
    console.error('Image viewer elements not found');
    return;
  }
  
  // Set image and name
  img.src = imageURL;
  nameLabel.textContent = memberName;
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

/**
 * Close image viewer
 */
export function closeImageViewer() {
  const modal = document.getElementById('image-viewer-modal');
  
  if (!modal) return;
  
  // Hide modal
  modal.classList.add('hidden');
  
  // Restore body scroll
  document.body.style.overflow = '';
}

/**
 * Initialize image viewer event listeners
 */
export function initImageViewer() {
  const modal = document.getElementById('image-viewer-modal');
  const closeBtn = document.getElementById('image-viewer-close');
  
  if (!modal || !closeBtn) {
    console.error('Image viewer elements not found');
    return;
  }
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeImageViewer();
    }
  });
  
  // Close on close button click
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeImageViewer();
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeImageViewer();
    }
  });
}
