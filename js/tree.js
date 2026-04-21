// ── Config ────────────────────────────────────────────────────────────────────
const NODE_RADIUS  = 22;
const NODE_SPACING = { x: 120, y: 160 };
let   showChinese  = true;
let   _currentRole = null;

// ── Module-level D3 references ────────────────────────────────────────────────
let svg, group, zoom, nodes;

/**
 * Render (or re-render) the family tree from a flat members array.
 * @param {object[]} members  Flat array of FamilyMember with parentId
 * @param {string|null} role  'viewer' | 'editor' | 'admin' | null
 */
export function renderTree(members, role) {
  _currentRole = role;

  const container = document.getElementById('tree-container');
  const treeGroup = document.getElementById('tree-group');

  // Clear previous render
  treeGroup.innerHTML = '';

  if (!members || members.length === 0) {
    container.innerHTML =
      '<p style="padding:40px;color:#c0392b;font-size:1rem">' +
      'Unable to load family data. Please check your connection and try again.</p>';
    return;
  }

  svg   = d3.select('#tree-svg');
  group = d3.select('#tree-group');

  // ── Build hierarchy from flat array using d3.stratify ─────────────────────
  let root;
  try {
    // Filter out spouses from the main tree hierarchy
    // Spouses will be rendered separately next to their partners
    const treeMembers = members.filter(member => {
      // Include members who have a parentId (children) or who are the root
      // Exclude members who are only connected as spouses (no parentId and not the original root)
      if (member.parentId) return true;
      
      // Check if this member has children - if so, they're part of the main tree
      const hasChildren = members.some(m => m.parentId === member.id);
      if (hasChildren) return true;
      
      // Check if this member is referenced as a spouse - if so, exclude from main tree
      const isSpouseOnly = members.some(m => m.spouse === member.id);
      return !isSpouseOnly;
    });

    const stratify = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parentId || null);
    root = stratify(treeMembers);
  } catch (err) {
    container.innerHTML =
      `<p style="padding:40px;color:#c0392b">Tree error: ${err.message}</p>`;
    return;
  }

  // ── Tree layout ────────────────────────────────────────────────────────────
  const treeLayout = d3.tree()
    .nodeSize([NODE_SPACING.x, NODE_SPACING.y])
    .separation((a, b) => a.parent === b.parent ? 1.2 : 1.6);
  treeLayout(root);

  // ── Zoom & pan ─────────────────────────────────────────────────────────────
  zoom = d3.zoom()
    .scaleExtent([0.1, 3])
    .on('zoom', e => group.attr('transform', e.transform));
  svg.call(zoom);

  const w = container.clientWidth;
  const h = container.clientHeight;
  svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, 80).scale(0.8));

  // ── Links ──────────────────────────────────────────────────────────────────
  group.selectAll('.link')
    .data(root.links())
    .join('path')
    .attr('class', 'link')
    .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y));

  // ── Nodes ──────────────────────────────────────────────────────────────────
  nodes = group.selectAll('.node')
    .data(root.descendants())
    .join('g')
    .attr('class', d => `node ${d.data.gender || 'unknown'}`)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .on('click', (event, d) => {
      // Dispatch custom event — decouples detail panel from tree
      document.dispatchEvent(
        new CustomEvent('member-selected', { detail: d.data })
      );
    });

  nodes.append('circle').attr('r', NODE_RADIUS);

  nodes.append('text')
    .attr('class', 'name-label')
    .attr('dy', NODE_RADIUS + 14)
    .text(d => {
      // Show Chinese name (now in 'name' field) or nickname (now in 'chinese' field)
      if (showChinese) {
        return d.data.name; // Chinese name
      } else {
        return d.data.chinese || d.data.name; // Nickname or Chinese name
      }
    });

  nodes.append('text')
    .attr('class', 'year-label')
    .attr('dy', NODE_RADIUS + 26)
    .text(d => {
      const b  = d.data.birth || '?';
      const dd = d.data.death || '';
      return dd ? `${b}–${dd}` : b;
    });

  // ── Spouse nodes and marriage links ────────────────────────────────────────
  // Find all spouses and render them next to their partners
  const spouseData = [];
  const marriageLinks = [];
  
  root.descendants().forEach(node => {
    const member = node.data;
    if (member.spouse) {
      // Find the spouse member data
      const spouseMember = members.find(m => m.id === member.spouse);
      if (spouseMember) {
        // Position spouse to the right of the main member
        const spouseNode = {
          data: spouseMember,
          x: node.x + 60, // Offset to the right
          y: node.y,
          isSpouse: true
        };
        spouseData.push(spouseNode);
        
        // Create marriage link
        marriageLinks.push({
          source: { x: node.x, y: node.y },
          target: { x: spouseNode.x, y: spouseNode.y }
        });
      }
    }
  });

  // Render marriage links
  group.selectAll('.marriage-link')
    .data(marriageLinks)
    .join('line')
    .attr('class', 'marriage-link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
    .attr('stroke', '#e74c3c')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5');

  // Render spouse nodes
  const spouseNodes = group.selectAll('.spouse-node')
    .data(spouseData)
    .join('g')
    .attr('class', d => `spouse-node node ${d.data.gender || 'unknown'}`)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .on('click', (event, d) => {
      document.dispatchEvent(
        new CustomEvent('member-selected', { detail: d.data })
      );
    });

  spouseNodes.append('circle').attr('r', NODE_RADIUS);

  spouseNodes.append('text')
    .attr('class', 'name-label')
    .attr('dy', NODE_RADIUS + 14)
    .text(d => {
      if (showChinese) {
        return d.data.name;
      } else {
        return d.data.chinese || d.data.name;
      }
    });

  spouseNodes.append('text')
    .attr('class', 'year-label')
    .attr('dy', NODE_RADIUS + 26)
    .text(d => {
      const b  = d.data.birth || '?';
      const dd = d.data.death || '';
      return dd ? `${b}–${dd}` : b;
    });

  // Update the global nodes variable to include spouse nodes for language toggle
  nodes = group.selectAll('.node');

  // ── Controls ───────────────────────────────────────────────────────────────
  const btnZoomIn  = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnReset   = document.getElementById('btn-reset');
  const btnLang    = document.getElementById('btn-toggle-lang');

  if (btnZoomIn)  btnZoomIn.onclick  = () => svg.transition().call(zoom.scaleBy, 1.3);
  if (btnZoomOut) btnZoomOut.onclick = () => svg.transition().call(zoom.scaleBy, 0.77);
  if (btnReset)   btnReset.onclick   = () =>
    svg.transition().call(zoom.transform, d3.zoomIdentity.translate(w / 2, 80).scale(0.8));

  if (btnLang) btnLang.onclick = () => {
    showChinese = !showChinese;
    if (nodes) {
      nodes.selectAll('text.name-label')
        .text(d => {
          if (showChinese) {
            return d.data.name; // Chinese name
          } else {
            return d.data.chinese || d.data.name; // Nickname or Chinese name
          }
        });
    }
  };

  // ── Search ─────────────────────────────────────────────────────────────────
  const searchBtn   = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');

  function doSearch() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (nodes) nodes.classed('highlighted', false);
    if (!q || !nodes) return;

    const matched = nodes.filter(d =>
      d.data.name.toLowerCase().includes(q) ||
      (d.data.chinese && d.data.chinese.includes(q))
    );
    matched.classed('highlighted', true);

    if (!matched.empty()) {
      const d     = matched.datum();
      const scale = d3.zoomTransform(svg.node()).k;
      svg.transition().duration(600).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(w / 2 - d.x * scale, h / 2 - d.y * scale)
          .scale(scale)
      );
    }
  }

  if (searchBtn)   searchBtn.onclick = doSearch;
  if (searchInput) searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
}

/**
 * Render the detail panel for a selected member in the left sidebar.
 * Called by app.js on 'member-selected' event.
 * @param {object} member
 * @param {string|null} role
 * @param {object[]} allMembers - All family members to check for children
 */
export function renderDetailPanel(member, role, allMembers = []) {
  const content = document.getElementById('sidebar-detail-content');
  if (!content) return;

  const gender = member.gender === 'male' ? '♂ Male'
               : member.gender === 'female' ? '♀ Female' : '—';
  const birth  = member.birth  || '—';
  const death  = member.death  || 'Living';
  const nickname = member.chinese || '—';
  const notes  = member.notes  || '—';

  // Find spouse by checking who has this member's ID as their spouse field
  const spouseObj = allMembers.find(m => m.spouse === member.id);
  const spouseName = spouseObj ? spouseObj.name : (member.spouse ? allMembers.find(m => m.id === member.spouse)?.name || '—' : '—');

  const canEdit = role === 'editor' || role === 'admin';
  const hasChildren = allMembers.some(m => m.parentId === member.id);

  content.innerHTML = `
    <h2 style="margin-bottom: 8px; font-size: 22px; color: #2c1810;">${member.name}</h2>
    ${nickname !== '—' ? `<div class="chinese-name">${nickname}</div>` : ''}
    <table>
      <tr><td>Gender</td><td>${gender}</td></tr>
      <tr><td>Born</td><td>${birth}</td></tr>
      <tr><td>Died</td><td>${death}</td></tr>
      <tr><td>Spouse</td><td>${spouseName}</td></tr>
      <tr><td>Notes</td><td>${notes}</td></tr>
    </table>
    ${canEdit ? `
    <div class="detail-actions">
      <button class="btn-action btn-add-child" data-id="${member.id}">➕ Add Child</button>
      <button class="btn-action btn-add-spouse" data-id="${member.id}">💑 Add Spouse</button>
      <button class="btn-action btn-edit" data-id="${member.id}">✏️ Edit</button>
      ${!hasChildren ? `<button class="btn-action btn-delete" data-id="${member.id}" data-name="${member.name}">🗑️ Delete</button>` : ''}
    </div>` : ''}
  `;
}
