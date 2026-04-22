// Translation dictionary for the entire application
export const translations = {
  zh: {
    // Header
    title: '李家有谱',
    subtitle: 'Lee Family Genealogy Tree',
    
    // Tabs
    tabGenealogy: '族谱 (李姓)',
    tabFamilyTree: '家族树 (全部)',
    
    // Controls
    btnZoomIn: '放大',
    btnZoomOut: '缩小',
    btnReset: '重置',
    btnToggleLang: 'EN',
    
    // Auth
    btnSignIn: '登录 Google',
    btnSignOut: '登出',
    btnManageUsers: '管理用户',
    
    // Sidebar
    memberDetails: '成员详情',
    recentEdits: '最近编辑',
    clickToView: '点击家族成员查看详情',
    
    // Member Details
    gender: '性别',
    male: '男',
    female: '女',
    unknown: '未知',
    born: '出生',
    died: '去世',
    living: '在世',
    leeFamily: '李家成员',
    yes: '是',
    no: '否',
    parent: '父母',
    otherParent: '另一方父母',
    notes: '备注',
    
    // Actions
    addChild: '添加子女',
    addSpouse: '添加配偶',
    edit: '编辑',
    delete: '删除',
    
    // Form
    addChildTitle: '添加子女',
    addSpouseTitle: '添加配偶',
    editMemberTitle: '编辑成员',
    chineseName: '中文名',
    nickname: '昵称',
    birthYear: '出生年份/日期',
    deathYear: '去世年份/日期',
    leaveBlank: '如在世则留空',
    anyNotes: '任何备注...',
    save: '保存',
    cancel: '取消',
    
    // Lee Family Member
    leeFamilyMember: '李家家族成员',
    leeFamilyMemberHelp: '✓ 勾选此框表示此人是李家家族成员（将出现在族谱标签中）\n✗ 不勾选表示配偶/姻亲等不同姓氏（仅出现在家族树标签中）',
    
    // Spouse Selection
    selectOtherParent: '选择另一方父母（配偶）',
    selectSpouse: '-- 选择配偶 --',
    selectSpouseHelp: '选择哪位配偶是此子女的另一方父母',
    
    // Search
    searchPlaceholder: '搜索姓名...',
    searchBtn: '搜索',
    
    // User Management
    manageUsersTitle: '管理用户',
    inviteByEmail: '通过电子邮件邀请',
    inviteAsEditor: '邀请为编辑者',
    
    // History
    updated: '更新了',
    added: '添加了',
    deleted: '删除了',
    addedSpouse: '添加了配偶',
    addedChild: '添加了子女',
    
    // Time
    minuteAgo: '分钟前',
    minutesAgo: '分钟前',
    hourAgo: '小时前',
    hoursAgo: '小时前',
    dayAgo: '天前',
    daysAgo: '天前',
    
    // Errors
    errorLoadingData: '无法加载家族数据。请检查您的连接并重试。',
    errorTreeError: '树错误',
    errorTooManyMembers: '家族成员过多，无法显示。请联系支持。',
    
    // Validation
    nameRequired: '姓名为必填项。',
    
    // Delete confirmation
    cannotDelete: '无法删除',
    hasChildren: '因为他们有子女。\n请先删除子女。',
    confirmDelete: '您确定要删除',
    cannotUndo: '吗？\n此操作无法撤消。',
    
    // Gender options
    genderMale: '男',
    genderFemale: '女',
    genderUnknown: '未知',
    
    // Placeholders
    placeholderChineseName: '例如：李亚狗',
    placeholderNickname: '例如：Ah Kow',
    placeholderBirth: '例如：1950 或 1950/01/01',
    placeholderDeath: '如在世则留空',
    placeholderNotes: '任何备注...',
    placeholderEmail: '通过电子邮件地址邀请'
  },
  
  en: {
    // Header
    title: 'Lee Family Genealogy',
    subtitle: 'Lee Family Tree',
    
    // Tabs
    tabGenealogy: 'Genealogy (Lee Surname)',
    tabFamilyTree: 'Family Tree (All)',
    
    // Controls
    btnZoomIn: 'Zoom In',
    btnZoomOut: 'Zoom Out',
    btnReset: 'Reset',
    btnToggleLang: '中',
    
    // Auth
    btnSignIn: 'Sign In with Google',
    btnSignOut: 'Sign Out',
    btnManageUsers: 'Manage Users',
    
    // Sidebar
    memberDetails: 'Member Details',
    recentEdits: 'Recent Edits',
    clickToView: 'Click on a family member to view details',
    
    // Member Details
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    unknown: 'Unknown',
    born: 'Born',
    died: 'Died',
    living: 'Living',
    leeFamily: 'Lee Family',
    yes: 'Yes',
    no: 'No',
    parent: 'Parent',
    otherParent: 'Other Parent',
    notes: 'Notes',
    
    // Actions
    addChild: 'Add Child',
    addSpouse: 'Add Spouse',
    edit: 'Edit',
    delete: 'Delete',
    
    // Form
    addChildTitle: 'Add Child',
    addSpouseTitle: 'Add Spouse',
    editMemberTitle: 'Edit Member',
    chineseName: 'Chinese Name',
    nickname: 'Nickname',
    birthYear: 'Birth Year / Date',
    deathYear: 'Death Year / Date',
    leaveBlank: 'Leave blank if living',
    anyNotes: 'Any notes...',
    save: 'Save',
    cancel: 'Cancel',
    
    // Lee Family Member
    leeFamilyMember: 'Lee Family Member',
    leeFamilyMemberHelp: '✓ Check this box if this person is a Lee family member (will appear in Genealogy tab)\n✗ Uncheck for spouses/in-laws with different surnames (will only appear in Family Tree tab)',
    
    // Spouse Selection
    selectOtherParent: 'Select Other Parent (Spouse)',
    selectSpouse: '-- Select Spouse --',
    selectSpouseHelp: 'Choose which spouse is the other parent of this child',
    
    // Search
    searchPlaceholder: 'Search name...',
    searchBtn: 'Search',
    
    // User Management
    manageUsersTitle: 'Manage Users',
    inviteByEmail: 'Invite by email address',
    inviteAsEditor: 'Invite as Editor',
    
    // History
    updated: 'updated',
    added: 'added',
    deleted: 'deleted',
    addedSpouse: 'added spouse',
    addedChild: 'added child',
    
    // Time
    minuteAgo: 'minute ago',
    minutesAgo: 'minutes ago',
    hourAgo: 'hour ago',
    hoursAgo: 'hours ago',
    dayAgo: 'day ago',
    daysAgo: 'days ago',
    
    // Errors
    errorLoadingData: 'Unable to load family data. Please check your connection and try again.',
    errorTreeError: 'Tree error',
    errorTooManyMembers: 'Too many family members to display. Please contact support.',
    
    // Validation
    nameRequired: 'Name is required.',
    
    // Delete confirmation
    cannotDelete: 'Cannot delete',
    hasChildren: 'because they have children.\nDelete the children first.',
    confirmDelete: 'Are you sure you want to delete',
    cannotUndo: '?\nThis cannot be undone.',
    
    // Gender options
    genderMale: 'Male',
    genderFemale: 'Female',
    genderUnknown: 'Unknown',
    
    // Placeholders
    placeholderChineseName: 'e.g. 李亚狗',
    placeholderNickname: 'e.g. Ah Kow',
    placeholderBirth: 'e.g. 1950 or 1950/01/01',
    placeholderDeath: 'Leave blank if living',
    placeholderNotes: 'Any notes...',
    placeholderEmail: 'Invite by email address'
  }
};

// Get translation for current language
export function t(key, lang = 'zh') {
  return translations[lang][key] || key;
}

// Apply translations to the entire page
export function applyTranslations(lang = 'zh') {
  const t = translations[lang];
  
  // Header
  document.querySelector('header h1').textContent = `🌳 ${t.title}`;
  document.querySelector('header .subtitle').textContent = t.subtitle;
  
  // Tabs
  const tabGenealogy = document.getElementById('tab-genealogy');
  const tabFamilyTree = document.getElementById('tab-family-tree');
  if (tabGenealogy) tabGenealogy.innerHTML = `📜 ${t.tabGenealogy}`;
  if (tabFamilyTree) tabFamilyTree.innerHTML = `🌳 ${t.tabFamilyTree}`;
  
  // Control buttons
  const btnToggleLang = document.getElementById('btn-toggle-lang');
  if (btnToggleLang) btnToggleLang.textContent = t.btnToggleLang;
  
  // Auth buttons
  const btnSignIn = document.getElementById('btn-sign-in');
  const btnSignOut = document.getElementById('btn-sign-out');
  const btnManageUsers = document.getElementById('btn-manage-users');
  if (btnSignIn) btnSignIn.textContent = t.btnSignIn;
  if (btnSignOut) btnSignOut.textContent = t.btnSignOut;
  if (btnManageUsers) btnManageUsers.innerHTML = `👥 ${t.btnManageUsers}`;
  
  // Sidebar headers
  const sidebarDetailH3 = document.querySelector('#sidebar-detail h3');
  const sidebarHistoryH3 = document.querySelector('#sidebar-history h3');
  if (sidebarDetailH3) sidebarDetailH3.textContent = t.memberDetails;
  if (sidebarHistoryH3) sidebarHistoryH3.innerHTML = `📋 ${t.recentEdits}`;
  
  // Search
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
  if (searchBtn) searchBtn.textContent = `🔍`;
  
  // Form labels (will be updated when form opens)
  updateFormTranslations(lang);
  
  console.log(`🌐 Language switched to: ${lang === 'zh' ? '中文' : 'English'}`);
}

// Update form translations
export function updateFormTranslations(lang = 'zh') {
  const t = translations[lang];
  
  // Form labels
  const labels = document.querySelectorAll('#member-form label');
  if (labels.length > 0) {
    // This will be called when form is opened
    // Labels are updated dynamically
  }
}
