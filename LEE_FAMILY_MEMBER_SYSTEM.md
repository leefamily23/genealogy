# 李家家族成员系统 (Lee Family Member System)

## Overview
The application now uses an explicit checkbox system to determine which members appear in the Genealogy tab, instead of automatic surname filtering.

## How It Works

### ✅ Checkbox: "李家家族成员 (Lee Family Member)"

When adding or editing a member, you'll see a checkbox:
```
☑ 李家家族成员 (Lee Family Member)
```

- **Checked (✓)**: Member appears in BOTH Genealogy and Family Tree tabs
- **Unchecked (✗)**: Member appears ONLY in Family Tree tab

## Use Cases

### Example 1: Direct Lee Family Member
**李宇轩 (Lee Yu Xuan)** - Born into Lee family
- ✅ Check the box
- Appears in: Genealogy + Family Tree

### Example 2: Spouse with Different Surname
**王美丽 (Wang Mei Li)** - Married into Lee family
- ✗ Uncheck the box
- Appears in: Family Tree only

### Example 3: Spouse with Lee Surname
**李善妍 (Lee Shan Yan)** - Has Lee surname, married into family
- ✅ Check the box (if you want them in Genealogy)
- ✗ Uncheck the box (if they're from a different Lee family branch)
- Your choice!

### Example 4: Child of Mixed Marriage
**李小明 (Lee Xiao Ming)** - Father is Lee, mother is Wang
- ✅ Check the box (carries Lee surname and family line)
- Appears in: Genealogy + Family Tree

**王小红 (Wang Xiao Hong)** - Father is Lee, mother is Wang, but uses mother's surname
- ✗ Uncheck the box (doesn't carry Lee surname)
- Appears in: Family Tree only

## Default Behavior

### When Adding a Child:
- **Auto-checked** if parent is a Lee family member
- **Auto-unchecked** if parent is not a Lee family member
- You can manually change it

### When Adding a Spouse:
- **Auto-unchecked** (spouses typically have different surnames)
- You can manually check it if spouse also has Lee surname

### When Editing Existing Members:
- Shows current status
- You can change it anytime

## Member Detail Panel

The detail panel now shows Lee family status:

```
┌─────────────────────────────────┐
│ 李宇轩                           │
│ Yu Xuan                          │
├─────────────────────────────────┤
│ Gender:       ♂ Male            │
│ Born:         1990              │
│ Died:         Living            │
│ Lee Family:   ✓ Yes             │  ← New field
│ Notes:        —                 │
└─────────────────────────────────┘
```

- **✓ Yes** (green) - Lee family member
- **✗ No** (gray) - Not Lee family member

## Tab Filtering Logic

### Genealogy Tab (📜)
```javascript
Shows members where: isLeeFamilyMember === true
```

### Family Tree Tab (🌳)
```javascript
Shows ALL members (no filtering)
```

## Data Storage

### Firestore Document Structure:
```json
{
  "id": "30",
  "name": "李宇轩",
  "chinese": "Yu Xuan",
  "gender": "male",
  "birth": "1990",
  "isLeeFamilyMember": true,  ← New field
  "parentId": "12",
  "spouses": ["31", "32"]
}
```

## Backward Compatibility

### Existing Data Without the Field:
- If `isLeeFamilyMember` is not set → defaults to `true`
- This ensures existing members still appear in Genealogy tab
- You can edit them to explicitly set the value

## Benefits

✅ **Flexible**: Works for any surname combination
✅ **Explicit**: Clear user control over who appears where
✅ **Accurate**: Handles complex family situations:
   - Adopted children
   - Step-children
   - Children using mother's surname
   - Spouses with same surname from different families
   - Multiple marriages

✅ **Cultural**: Respects Chinese family traditions while being flexible

## Common Scenarios

### Scenario 1: Traditional Patrilineal Family
```
李父 (Lee Father) ✓ Lee Family
├── 王母 (Wang Mother) ✗ Not Lee Family [spouse]
    ├── 李儿子 (Lee Son) ✓ Lee Family [carries surname]
    └── 李女儿 (Lee Daughter) ✓ Lee Family [carries surname]
```

### Scenario 2: Modern Mixed Family
```
李父 (Lee Father) ✓ Lee Family
├── 王母 (Wang Mother) ✗ Not Lee Family [spouse]
    ├── 李大宝 (Lee Da Bao) ✓ Lee Family [uses father's surname]
    └── 王小宝 (Wang Xiao Bao) ✗ Not Lee Family [uses mother's surname]
```

### Scenario 3: Multiple Marriages
```
李父 (Lee Father) ✓ Lee Family
├── 王妻一 (Wang Wife 1) ✗ Not Lee Family [first spouse]
│   └── 李儿子一 (Lee Son 1) ✓ Lee Family
└── 李妻二 (Lee Wife 2) ✓ Lee Family [second spouse, also Lee surname]
    └── 李儿子二 (Lee Son 2) ✓ Lee Family
```

### Scenario 4: Adoption
```
李父 (Lee Father) ✓ Lee Family
├── 王母 (Wang Mother) ✗ Not Lee Family
    ├── 李亲生子 (Lee Biological Son) ✓ Lee Family
    └── 张养子 (Zhang Adopted Son) ✓ Lee Family [adopted, check the box]
```

## Best Practices

### When to Check the Box:
1. Born into Lee family with Lee surname
2. Adopted into Lee family (even with different birth surname)
3. Spouse with Lee surname who you want in genealogy records
4. Anyone you want to appear in the official Lee family genealogy

### When to Uncheck the Box:
1. Spouses with different surnames (in-laws)
2. Children using mother's surname (not carrying Lee name)
3. Extended family from other surname branches
4. Anyone who shouldn't appear in official Lee genealogy

## Migration Guide

### For Existing Data:
1. All existing members default to Lee family members (✓)
2. Review each member and update as needed:
   - Edit member
   - Check/uncheck the box
   - Save

### Bulk Update (if needed):
If you need to update many members at once, you can:
1. Export data
2. Update `isLeeFamilyMember` field
3. Re-import

## Technical Notes

### Database Field:
- Field name: `isLeeFamilyMember`
- Type: Boolean
- Default: `true` (for backward compatibility)
- Required: No

### Form Field:
- Element ID: `f-lee-family-member`
- Type: Checkbox
- Default state: Depends on context (parent status, spouse, etc.)

### Filtering:
- Happens client-side (fast)
- No additional database queries
- Instant tab switching
