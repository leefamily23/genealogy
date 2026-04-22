import { storage } from './firebase-config.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// ── Image Upload Configuration ────────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const IMAGE_QUALITY = 0.8; // JPEG compression quality

/**
 * Validate image file before upload
 * @param {File} file - The image file to validate
 * @returns {{ valid: boolean, error: string }}
 */
function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: '请选择一个图片文件' };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '只支持 JPG, PNG, WebP 格式的图片' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '图片文件不能超过 5MB' };
  }
  
  return { valid: true, error: '' };
}

/**
 * Resize and compress image before upload
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width (default: 400px)
 * @param {number} maxHeight - Maximum height (default: 400px)
 * @returns {Promise<Blob>} Compressed image blob
 */
function compressImage(file, maxWidth = 400, maxHeight = 400) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas size and draw resized image
      canvas.width = width;
      canvas.height = height;
      
      // Use better image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with compression
      canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload image to Firebase Storage
 * @param {string} memberId - Member ID for the image
 * @param {File} file - Image file to upload
 * @param {function} onProgress - Progress callback (optional)
 * @returns {Promise<string>} Download URL of uploaded image
 */
export async function uploadMemberImage(memberId, file, onProgress = null) {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  try {
    // Compress image before upload
    const compressedBlob = await compressImage(file);
    
    // Create storage reference
    const imageRef = ref(storage, `member-photos/${memberId}.jpg`);
    
    // Upload with progress tracking
    if (onProgress) {
      onProgress(0);
    }
    
    const uploadResult = await uploadBytes(imageRef, compressedBlob);
    
    if (onProgress) {
      onProgress(100);
    }
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error(`图片上传失败: ${error.message}`);
  }
}

/**
 * Delete member image from Firebase Storage
 * @param {string} memberId - Member ID
 * @returns {Promise<void>}
 */
export async function deleteMemberImage(memberId) {
  try {
    const imageRef = ref(storage, `member-photos/${memberId}.jpg`);
    await deleteObject(imageRef);
  } catch (error) {
    console.warn(`Could not delete image for member ${memberId}:`, error.message);
  }
}

/**
 * Get member image URL (construct from member ID)
 * @param {string} memberId - Member ID
 * @returns {string} Image URL or null
 */
export function getMemberImageURL(memberId) {
  if (!memberId) return null;
  
  // Return a more reliable URL construction
  try {
    const imageRef = ref(storage, `member-photos/${memberId}.jpg`);
    // We'll use getDownloadURL when we actually need the URL
    return `https://firebasestorage.googleapis.com/v0/b/leefamilygenealogy.firebasestorage.app/o/member-photos%2F${encodeURIComponent(memberId)}.jpg?alt=media`;
  } catch (error) {
    console.warn('Error constructing image URL:', error);
    return null;
  }
}

/**
 * Check if member has an image
 * @param {string} memberId - Member ID
 * @returns {Promise<boolean>}
 */
export async function memberHasImage(memberId) {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const checkPromise = (async () => {
      const imageRef = ref(storage, `member-photos/${memberId}.jpg`);
      await getDownloadURL(imageRef);
      return true;
    })();
    
    await Promise.race([checkPromise, timeoutPromise]);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize image upload UI for a form (safe version)
 * @param {string} formId - Form element ID
 * @param {string} memberId - Member ID (for editing existing member)
 */
export function initImageUploadUI(formId, memberId = null) {
  // Use setTimeout to prevent blocking the main thread
  setTimeout(() => {
    try {
      const form = document.getElementById(formId);
      if (!form) {
        console.error(`Form with ID ${formId} not found`);
        return;
      }
      
      const imageContainer = form.querySelector('.image-upload-container');
      if (!imageContainer) {
        console.error('Image upload container not found in form');
        return;
      }
      
      const fileInput = imageContainer.querySelector('.image-file-input');
      const preview = imageContainer.querySelector('.image-preview');
      const uploadBtn = imageContainer.querySelector('.image-upload-btn');
      const removeBtn = imageContainer.querySelector('.image-remove-btn');
      
      // Load existing image if editing (non-blocking)
      if (memberId) {
        loadExistingImage(memberId, preview, removeBtn).catch(err => {
          console.warn('Failed to load existing image:', err);
        });
      }
      
      // File input change handler
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            previewImage(file, preview);
            if (removeBtn) removeBtn.style.display = 'inline-block';
          }
        });
      }
      
      // Upload button handler
      if (uploadBtn) {
        uploadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (fileInput) {
            fileInput.click();
          }
        });
      }
      
      // Remove button handler
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          clearImagePreview(preview, fileInput, removeBtn);
        });
      }
    } catch (error) {
      console.error('Error initializing image upload UI:', error);
    }
  }, 100);
}

/**
 * Preview selected image
 * @param {File} file - Image file
 * @param {HTMLElement} preview - Preview element
 */
function previewImage(file, preview) {
  if (!preview) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.innerHTML = `<img src="${e.target.result}" alt="预览" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

/**
 * Load existing image for member
 * @param {string} memberId - Member ID
 * @param {HTMLElement} preview - Preview element
 * @param {HTMLElement} removeBtn - Remove button
 */
async function loadExistingImage(memberId, preview, removeBtn) {
  if (!preview || !memberId) return;
  
  try {
    // Add timeout to prevent hanging
    const hasImage = await Promise.race([
      memberHasImage(memberId),
      new Promise(resolve => setTimeout(() => resolve(false), 3000))
    ]);
    
    if (hasImage) {
      const imageURL = getMemberImageURL(memberId);
      if (imageURL) {
        preview.innerHTML = `<img src="${imageURL}" alt="当前照片" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.parentElement.style.display='none'">`;
        preview.style.display = 'block';
        if (removeBtn) removeBtn.style.display = 'inline-block';
      }
    }
  } catch (error) {
    console.warn('Could not load existing image:', error);
  }
}

/**
 * Clear image preview
 * @param {HTMLElement} preview - Preview element
 * @param {HTMLElement} fileInput - File input element
 * @param {HTMLElement} removeBtn - Remove button
 */
function clearImagePreview(preview, fileInput, removeBtn) {
  if (preview) {
    preview.innerHTML = '';
    preview.style.display = 'none';
  }
  if (fileInput) {
    fileInput.value = '';
  }
  if (removeBtn) {
    removeBtn.style.display = 'none';
  }
}

/**
 * Get selected image file from form
 * @param {string} formId - Form element ID
 * @returns {File|null}
 */
export function getSelectedImageFile(formId) {
  const form = document.getElementById(formId);
  if (!form) return null;
  
  const fileInput = form.querySelector('.image-file-input');
  return fileInput?.files[0] || null;
}

/**
 * Show upload progress
 * @param {string} formId - Form element ID
 * @param {number} progress - Progress percentage (0-100)
 */
export function showUploadProgress(formId, progress) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  const progressBar = form.querySelector('.upload-progress');
  if (progressBar) {
    progressBar.style.display = 'block';
    progressBar.style.width = `${progress}%`;
    
    if (progress >= 100) {
      setTimeout(() => {
        progressBar.style.display = 'none';
      }, 1000);
    }
  }
}