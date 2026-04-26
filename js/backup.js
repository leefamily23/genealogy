import { getAllMembers } from './db.js';
import { getCurrentUser } from './auth.js';
import { db } from './firebase-config.js';
import { 
  collection, 
  writeBatch, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  limit,
  deleteDoc,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Open backup modal and load snapshots
 */
export async function openBackupModal() {
  const modal = document.getElementById('backup-modal');
  if (modal) {
    modal.classList.remove('hidden');
    await loadSnapshotList();
    
    // Show/hide admin-only features
    updateBackupModalForRole();
  }
}

/**
 * Update backup modal visibility based on user role
 */
function updateBackupModalForRole() {
  // This will be called from app.js with the current role
  const terminateBtn = document.getElementById('btn-terminate-session');
  if (terminateBtn) {
    // Role check will be done in the global function
    terminateBtn.style.display = 'block';
  }
}

/**
 * Close backup modal
 */
function closeBackupModal() {
  const modal = document.getElementById('backup-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Create a new snapshot
 */
async function createSnapshot(description = '') {
  try {
    const user = getCurrentUser();
    const members = await getAllMembers();
    
    const snapshot = {
      createdAt: serverTimestamp(),
      createdBy: user?.displayName || user?.email || 'Unknown',
      createdByUid: user?.uid || '',
      type: 'manual',
      description: description || '手动快照',
      memberCount: members.length,
      data: {
        version: '2.0',
        members: members
      }
    };

    await addDoc(collection(db, 'snapshots'), snapshot);
    
    // Clean up old snapshots (keep only 15 most recent)
    await cleanupOldSnapshots();
    
    alert(`✅ 快照已创建 (${members.length} 位成员)`);
    await loadSnapshotList();
  } catch (err) {
    console.error('Create snapshot failed:', err);
    alert(`❌ 创建快照失败: ${err.message}`);
  }
}

/**
 * Load and display snapshot list
 */
async function loadSnapshotList() {
  const container = document.getElementById('snapshot-list');
  if (!container) return;

  container.innerHTML = '<p style="color: #666; text-align: center;">加载中...</p>';

  try {
    const q = query(
      collection(db, 'snapshots'), 
      orderBy('createdAt', 'desc'), 
      limit(15)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      container.innerHTML = '<p style="color: #666; text-align: center;">暂无快照</p>';
      return;
    }

    container.innerHTML = '';
    
    querySnapshot.forEach((docSnapshot) => {
      const snapshot = docSnapshot.data();
      const snapshotId = docSnapshot.id;
      
      // Handle both serverTimestamp and regular dates
      let dateStr = '未知时间';
      if (snapshot.createdAt) {
        const date = snapshot.createdAt.toDate ? snapshot.createdAt.toDate() : new Date(snapshot.createdAt);
        dateStr = date.toLocaleString('zh-CN');
      }
      
      const row = document.createElement('div');
      row.className = 'snapshot-row';
      row.style.cssText = `
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 12px; 
        border: 1px solid #ddd; 
        border-radius: 6px; 
        margin-bottom: 8px;
        background: #f9f9f9;
      `;
      
      row.innerHTML = `
        <div style="flex: 1;">
          <div style="font-weight: 500; color: #2c1810;">
            ${snapshot.type === 'manual' ? '📸' : '🔄'} ${snapshot.description || '快照'}
          </div>
          <div style="font-size: 0.8rem; color: #666;">
            ${dateStr} • ${snapshot.memberCount} 位成员 • ${snapshot.createdBy}
          </div>
        </div>
        <button class="btn-restore" data-snapshot-id="${snapshotId}" 
                style="background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
          恢复
        </button>
      `;
      
      container.appendChild(row);
    });

    // Wire restore buttons
    container.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', () => restoreSnapshot(btn.dataset.snapshotId));
    });

  } catch (err) {
    console.error('Load snapshots failed:', err);
    container.innerHTML = '<p style="color: red; text-align: center;">加载快照失败</p>';
  }
}

/**
 * Restore from a snapshot
 */
async function restoreSnapshot(snapshotId) {
  const confirmed = confirm(
    '⚠️ 警告：恢复快照会覆盖所有现有数据！\n\n确定要继续吗？'
  );
  if (!confirmed) return;

  try {
    // Get snapshot data
    const snapshotDoc = await getDoc(doc(db, 'snapshots', snapshotId));
    if (!snapshotDoc.exists()) {
      throw new Error('快照不存在');
    }

    const snapshot = snapshotDoc.data();
    const members = snapshot.data.members;

    if (!members || !Array.isArray(members)) {
      throw new Error('快照数据格式无效');
    }

    // Restore data using batch write
    const batch = writeBatch(db);
    
    // Clear existing data first (get all current docs)
    const currentDocs = await getDocs(collection(db, 'family'));
    currentDocs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });

    // Add snapshot data
    members.forEach(member => {
      const docRef = doc(db, 'family', member.id);
      batch.set(docRef, member);
    });

    await batch.commit();

    alert(`✅ 快照已恢复 (${members.length} 位成员)\n\n页面将自动刷新。`);
    closeBackupModal();
    window.location.reload();
  } catch (err) {
    console.error('Restore failed:', err);
    alert(`❌ 恢复失败: ${err.message}`);
  }
}

/**
 * Clean up old snapshots (keep only 15 most recent)
 */
async function cleanupOldSnapshots() {
  try {
    const q = query(collection(db, 'snapshots'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const docs = querySnapshot.docs;
    if (docs.length <= 15) return; // No cleanup needed

    // Delete snapshots beyond the 15 most recent
    const batch = writeBatch(db);
    for (let i = 15; i < docs.length; i++) {
      batch.delete(docs[i].ref);
    }
    await batch.commit();
    
    console.log(`🗑️ Cleaned up ${docs.length - 15} old snapshots`);
  } catch (err) {
    console.warn('Cleanup failed:', err);
  }
}

/**
 * Create daily auto-snapshot if data changed
 */
export async function createDailySnapshotIfNeeded() {
  // Removed: Daily auto-snapshots feature
  // Only manual snapshots are supported now
}

/**
 * Initialize backup UI
 */
export function initBackup() {
  const closeBtn = document.getElementById('backup-close');
  const createBtn = document.getElementById('btn-create-snapshot');

  if (closeBtn) closeBtn.onclick = closeBackupModal;
  if (createBtn) {
    createBtn.onclick = () => {
      const description = prompt('备份描述 (可选):');
      if (description !== null) { // User didn't cancel
        createSnapshot(description.trim());
      }
    };
  }
  
  // Close when clicking on overlay (outside modal content)
  const modal = document.getElementById('backup-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeBackupModal();
      }
    });
  }
}
