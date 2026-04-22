import { getAllMembers } from './db.js';
import { db } from './firebase-config.js';
import { collection, writeBatch, doc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Open backup modal
 */
export function openBackupModal() {
  const modal = document.getElementById('backup-modal');
  if (modal) modal.classList.remove('hidden');
}

/**
 * Close backup modal
 */
function closeBackupModal() {
  const modal = document.getElementById('backup-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Export all family data as JSON file
 */
async function exportBackup() {
  try {
    const members = await getAllMembers();
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      memberCount: members.length,
      members: members
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lee-family-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`✅ 备份已导出 (${members.length} 位成员)`);
  } catch (err) {
    console.error('Export failed:', err);
    alert(`❌ 导出失败: ${err.message}`);
  }
}

/**
 * Import backup from JSON file
 */
async function importBackup(file) {
  if (!file) return;

  const confirmed = confirm(
    '⚠️ 警告：导入备份会覆盖所有现有数据！\n\n确定要继续吗？'
  );
  if (!confirmed) return;

  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (!backup.members || !Array.isArray(backup.members)) {
      throw new Error('无效的备份文件格式');
    }

    // Use batch write for efficiency
    const batch = writeBatch(db);
    backup.members.forEach(member => {
      const docRef = doc(db, 'family', member.id);
      batch.set(docRef, member);
    });

    await batch.commit();

    alert(`✅ 备份已恢复 (${backup.members.length} 位成员)\n\n请刷新页面查看。`);
    closeBackupModal();
    window.location.reload();
  } catch (err) {
    console.error('Import failed:', err);
    alert(`❌ 导入失败: ${err.message}`);
  }
}

/**
 * Initialize backup UI
 */
export function initBackup() {
  const closeBtn = document.getElementById('backup-close');
  const exportBtn = document.getElementById('btn-export-backup');
  const importBtn = document.getElementById('btn-import-backup');
  const fileInput = document.getElementById('backup-file-input');

  if (closeBtn) closeBtn.onclick = closeBackupModal;
  if (exportBtn) exportBtn.onclick = exportBackup;
  if (importBtn) importBtn.onclick = () => fileInput?.click();
  if (fileInput) fileInput.onchange = (e) => {
    const file = e.target.files?.[0];
    if (file) importBackup(file);
  };
}
