# 👫 Spouse Selection Feature

## Overview
When adding a child to a family member who has multiple spouses, you can now select which spouse is the other parent of the child.

## How It Works

### 1. **Adding a Child to a Member with Multiple Spouses**

When you click "Add Child" on a member who has multiple spouses:

```
┌─────────────────────────────────────┐
│         Add Child                    │
├─────────────────────────────────────┤
│                                      │
│ 👫 Select Other Parent (Spouse)     │
│ ┌──────────────────────────────┐   │
│ │ 许善妍 (Nickname)             │◄── Dropdown shows all spouses
│ └──────────────────────────────┘   │
│ Choose which spouse is the other    │
│ parent of this child                │
│                                      │
│ Chinese Name 中文名 *                │
│ ┌──────────────────────────────┐   │
│ │ e.g. 李亚狗                   │   │
│ └──────────────────────────────┘   │
│                                      │
│ ... (rest of form)                  │
└─────────────────────────────────────┘
```

### 2. **Data Storage**

The child's record will store:
- `parentId`: The primary parent (the member you clicked "Add Child" on)
- `secondaryParentId`: The selected spouse (other parent)

Example in Firestore:
```json
{
  "id": "35",
  "name": "李小明",
  "chinese": "Xiao Ming",
  "parentId": "12",           // Primary parent
  "secondaryParentId": "28",  // Selected spouse
  "gender": "male",
  "birth": "2020"
}
```

### 3. **Visual Display**

In the member detail panel, children will show both parents:

```
┌─────────────────────────────────┐
│ 李小明                           │
│ Xiao Ming                        │
├─────────────────────────────────┤
│ Gender:       ♂ Male            │
│ Born:         2020              │
│ Parent:       李宇轩             │  ← Primary parent
│ Other Parent: 许善妍             │  ← Selected spouse
│ Notes:        —                 │
└─────────────────────────────────┘
```

## Use Cases

### Example 1: Member with 2 Spouses

**李宇轩** has two spouses:
- **许善妍** (Spouse 1)
- **王美丽** (Spouse 2)

When adding a child:
1. Click "Add Child" on 李宇轩
2. Dropdown appears with both spouses
3. Select **许善妍** as the other parent
4. Child is created with both parents linked

### Example 2: Member with 1 Spouse

**李咏芯** has one spouse:
- **张三** (Spouse 1)

When adding a child:
1. Click "Add Child" on 李咏芯
2. Dropdown appears with one spouse (auto-selected)
3. Child is created with both parents linked

### Example 3: Member with No Spouse

**李老大** has no spouse

When adding a child:
1. Click "Add Child" on 李老大
2. No dropdown appears (hidden)
3. Child is created with only one parent

## Benefits

✅ **Accurate Family Records**: Track which children belong to which spouse pair
✅ **LGBTQ+ Friendly**: Works with any gender combination
✅ **Polygamy Support**: Handles multiple spouses correctly
✅ **User-Friendly**: Auto-selects when only one spouse exists
✅ **Visual Clarity**: Shows both parents in member details

## Technical Implementation

### Files Modified:
1. `index.html` - Added spouse selection dropdown to form
2. `editForm.js` - Populates dropdown and handles selection
3. `tree.js` - Displays parent information in detail panel
4. `app.js` - Passes member data to form

### Key Functions:
- `openAddForm(parentId, allMembers)` - Shows/hides spouse selection
- Form submission stores `secondaryParentId`
- Detail panel displays both parents

## Future Enhancements

🔮 **Possible Future Features:**
- Visual lines connecting children to both parents in tree view
- Filter children by spouse pair
- Show all children of a specific spouse pair
- Color-code children by spouse pair
