/**
 * Email Notifications Module
 * Sends email notifications to editors and admins when:
 * 1. A new member is added
 * 2. A member's death date is updated
 */

import { db } from './firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Check if email notifications are enabled
 */
export async function isEmailNotificationsEnabled() {
  try {
    const settingsRef = doc(db, 'settings', 'emailNotifications');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      return settingsDoc.data().enabled === true;
    }
    
    // Default to false if not set
    return false;
  } catch (error) {
    console.error('Error checking email notifications status:', error);
    return false;
  }
}

/**
 * Get all editors and admins
 */
export async function getAllEditorsAndAdmins() {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    
    const users = [];
    snapshot.forEach(doc => {
      const user = doc.data();
      if (user.role === 'editor' || user.role === 'admin') {
        users.push({
          email: user.email,
          name: user.displayName || user.email,
          role: user.role
        });
      }
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching editors and admins:', error);
    return [];
  }
}

/**
 * Send new member notification email
 */
export async function sendNewMemberEmail(member, editorName) {
  try {
    // Check if notifications are enabled
    const enabled = await isEmailNotificationsEnabled();
    if (!enabled) {
      console.log('📧 Email notifications disabled - skipping new member email');
      return;
    }
    
    // Get all recipients
    const recipients = await getAllEditorsAndAdmins();
    if (recipients.length === 0) {
      console.warn('No editors or admins found for email notification');
      return;
    }
    
    // Prepare email data
    const emailData = {
      to_emails: recipients.map(r => r.email).join(','),
      member_name: member.name,
      member_chinese: member.chinese || '—',
      member_gender: member.gender === 'male' ? '♂ 男' : member.gender === 'female' ? '♀ 女' : '—',
      member_birth: member.birth || '—',
      member_generation: member.generation || '—',
      member_hometown: member.hometown || '—',
      member_nationality: member.nationality || '—',
      member_photo: member.imageURL || '',
      editor_name: editorName,
      timestamp: new Date().toLocaleString('zh-CN'),
      action_type: 'new_member'
    };
    
    // Send email using EmailJS
    await emailjs.send('service_lee_genealogy', 'template_new_member', emailData);
    console.log('✅ New member email sent to', recipients.length, 'recipients');
    
  } catch (error) {
    console.error('Error sending new member email:', error);
  }
}

/**
 * Send death date update notification email
 */
export async function sendDeathDateUpdateEmail(member, editorName, oldDeathDate) {
  try {
    // Check if notifications are enabled
    const enabled = await isEmailNotificationsEnabled();
    if (!enabled) {
      console.log('📧 Email notifications disabled - skipping death date email');
      return;
    }
    
    // Only send if death date was actually added (not just updated)
    if (oldDeathDate) {
      console.log('📧 Death date was updated, not newly added - skipping email');
      return;
    }
    
    // Get all recipients
    const recipients = await getAllEditorsAndAdmins();
    if (recipients.length === 0) {
      console.warn('No editors or admins found for email notification');
      return;
    }
    
    // Prepare email data
    const emailData = {
      to_emails: recipients.map(r => r.email).join(','),
      member_name: member.name,
      member_chinese: member.chinese || '—',
      member_birth: member.birth || '—',
      member_death: member.death || '—',
      member_hometown: member.hometown || '—',
      member_nationality: member.nationality || '—',
      member_photo: member.imageURL || '',
      editor_name: editorName,
      timestamp: new Date().toLocaleString('zh-CN'),
      action_type: 'death_date_update'
    };
    
    // Send email using EmailJS
    await emailjs.send('service_lee_genealogy', 'template_death_update', emailData);
    console.log('✅ Death date update email sent to', recipients.length, 'recipients');
    
  } catch (error) {
    console.error('Error sending death date email:', error);
  }
}

/**
 * Toggle email notifications on/off
 */
export async function toggleEmailNotifications(enabled, adminUid, adminName) {
  try {
    const { setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    
    const settingsRef = doc(db, 'settings', 'emailNotifications');
    await setDoc(settingsRef, {
      enabled: enabled,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminUid,
      updatedByName: adminName
    });
    
    console.log(`✅ Email notifications ${enabled ? 'enabled' : 'disabled'} by ${adminName}`);
    return true;
  } catch (error) {
    console.error('Error toggling email notifications:', error);
    alert(`❌ 邮件通知设置失败: ${error.message}`);
    return false;
  }
}
