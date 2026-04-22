# 📑 Tab System Guide

## Overview
The family tree application now has two separate views accessible via tabs:

### 1. **📜 Genealogy Tab (Lee Surname Only)**
- Shows only family members with the Lee (李) surname
- Traditional patrilineal lineage view
- Focuses on the direct Lee family line
- Filters members whose Chinese name starts with "李" or English name starts with "Lee"

### 2. **🌳 Family Tree Tab (All Members)**
- Shows ALL family members regardless of surname
- Includes spouses, in-laws, and extended family
- Complete family network view
- No filtering applied

## How It Works

### Tab Switching
Click on either tab button in the header to switch views:
- **Genealogy (Lee Surname)** - Shows only Lee family members
- **Family Tree (All)** - Shows everyone

### Visual Indicators
- **Active tab**: White background with red text
- **Inactive tab**: Transparent background with white text
- Smooth transition when switching tabs

### Data Filtering

#### Genealogy Tab Filter Logic:
```javascript
// Member is included if:
- Chinese name starts with "李" OR
- English name starts with "Lee" OR
- Nickname starts with "李" OR
- Nickname starts with "Lee"
```

#### Family Tree Tab:
```javascript
// All members included, no filtering
```

## Use Cases

### Genealogy Tab (Lee Surname)
**Best for:**
- Traditional family lineage documentation
- Lee family reunions
- Ancestral records
- Patrilineal inheritance tracking
- Official family registry

**Example:**
```
李老大 (Lee Lao Da)
├── 李宇轩 (Lee Yu Xuan)
│   ├── 李小明 (Lee Xiao Ming)
│   └── 李小红 (Lee Xiao Hong)
└── 李咏芯 (Lee Yong Xin)
```

### Family Tree Tab (All)
**Best for:**
- Complete family network visualization
- Understanding family connections
- Including spouses and in-laws
- Modern family structure
- Comprehensive family history

**Example:**
```
李老大 (Lee Lao Da) ---- 许善妍 (Xu Shan Yan)
├── 李宇轩 (Lee Yu Xuan) ---- 王美丽 (Wang Mei Li)
│   ├── 李小明 (Lee Xiao Ming)
│   └── 王小红 (Wang Xiao Hong) [different surname]
└── 李咏芯 (Lee Yong Xin) ---- 张三 (Zhang San)
    └── 张小宝 (Zhang Xiao Bao) [different surname]
```

## Technical Details

### State Management
- Current tab stored in `_currentTab` variable
- Values: `'genealogy'` or `'family-tree'`
- Persists during session (resets on page reload)

### Filtering Function
```javascript
filterMembersByTab(members, tabName)
```
- Takes all members and tab name
- Returns filtered array based on tab
- Genealogy: Filters by Lee surname
- Family Tree: Returns all members

### Performance
- Filtering happens client-side (fast)
- No additional database queries needed
- Instant tab switching
- Console logs show filtered count

## Adding/Editing Members

### Important Notes:
1. **All operations work on the full dataset**
   - Adding a child works in both tabs
   - Editing a member works in both tabs
   - Deleting a member works in both tabs

2. **Visibility after operations:**
   - If you add a Lee surname member → visible in both tabs
   - If you add a non-Lee surname member → only visible in Family Tree tab
   - After adding/editing, tree automatically refreshes with current tab filter

3. **Spouse handling:**
   - Spouses may have different surnames
   - In Genealogy tab: Only Lee surname spouses shown
   - In Family Tree tab: All spouses shown

## Future Enhancements

### Possible additions:
- 🔍 Search within specific tab
- 📊 Statistics per tab (member count, generation depth)
- 💾 Remember last selected tab (localStorage)
- 🎨 Different color schemes per tab
- 📤 Export specific tab data
- 🔒 Tab-specific permissions
- 📱 Mobile-optimized tab navigation

## Customization

### Changing Surname Filter
To filter by a different surname, edit `app.js`:

```javascript
function filterMembersByTab(members, tabName) {
  if (tabName === 'genealogy') {
    return members.filter(member => {
      const name = member.name || '';
      // Change '李' to your surname
      return name.startsWith('李') || name.startsWith('Lee');
    });
  }
  return members;
}
```

### Adding More Tabs
To add a third tab (e.g., "Maternal Line"):

1. Add button in HTML:
```html
<button id="tab-maternal" class="tab-btn">👩 Maternal Line</button>
```

2. Add event listener in app.js:
```javascript
document.getElementById('tab-maternal')
  ?.addEventListener('click', () => switchTab('maternal'));
```

3. Update filter function:
```javascript
function filterMembersByTab(members, tabName) {
  if (tabName === 'genealogy') {
    // Lee surname only
  } else if (tabName === 'maternal') {
    // Your maternal line filter logic
  } else {
    // All members
  }
}
```

## Troubleshooting

### Tab not switching?
- Check browser console for errors
- Ensure JavaScript is enabled
- Verify tab button IDs match event listeners

### Wrong members showing?
- Check surname spelling in database
- Verify filter logic in `filterMembersByTab`
- Check console logs for filtered count

### Performance issues?
- Large datasets (>1000 members) may be slow
- Consider server-side filtering for very large trees
- Check browser console for performance metrics
