# 家族族谱 — Family Genealogy Tree

A free, publicly accessible family tree website hosted on GitHub Pages.

## Live URL
After deployment: `https://YOUR_USERNAME.github.io/genealogy/`

---

## How to Deploy (Free, 5 minutes)

### 1. Create a GitHub account
Go to [github.com](https://github.com) and sign up if you don't have one.

### 2. Create a new repository
- Click **New repository**
- Name it `genealogy`
- Set to **Public**
- Click **Create repository**

### 3. Upload the files
Upload the entire `族谱/` folder contents (index.html, css/, js/, data/) to the repository root.

Or use Git:
```bash
cd 族谱
git init
git add .
git commit -m "Initial family tree"
git remote add origin https://github.com/YOUR_USERNAME/genealogy.git
git push -u origin main
```

### 4. Enable GitHub Pages
- Go to repository **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: **main** / root
- Click **Save**

Your site will be live at `https://YOUR_USERNAME.github.io/genealogy/` within 1–2 minutes.

---

## How to Edit the Family Tree

Edit `data/family.json`. Each person has this structure:

```json
{
  "id": "unique_id",
  "name": "English Name",
  "chinese": "中文名",
  "birth": "1950",
  "death": "",
  "gender": "male",
  "spouse": "Spouse Name",
  "notes": "Any notes",
  "children": []
}
```

- `gender`: `"male"`, `"female"`, or `"unknown"`
- `death`: leave empty `""` if still living
- `children`: array of child objects (same structure, nested)

After editing, push the updated `family.json` to GitHub — the site updates automatically.
