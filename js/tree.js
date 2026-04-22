// ── Config ────────────────────────────────────────────────────────────────────
const NODE_RADIUS  = 22;
const NODE_SPACING = { x: 120, y: 160 };
let   showChinese  = true;
let   _currentRole = null;
let   _currentLanguage = 'zh'; // 'zh' or 'en'

// ── Module-level D3 references ────────────────────────────────────────────────
let svg, group, zoom, nodes;
let currentTransform = null; // Store current zoom/pan transform

/**
 * Render (or re-render) the family tree from a flat members array.
 * @param {object[]} members  Flat array of FamilyMember with parentId
 * @param {string|null} role  'viewer' | 'editor' | 'admin' | null
 */
export function renderTree(members, role) {
  console.log('🌳 Starting tree render...');
  const startTime = performance.now();
  
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

  // Safety check: prevent rendering if members array is too large (potential infinite loop)
  if (members.length > 1000) {
    console.error('Too many members to render safely:', members.length);
    container.innerHTML =
      '<p style="padding:40px;color:#c0392b;font-size:1rem">' +
      'Too many family members to display. Please contact support.</p>';
    return;
  }

  svg   = d3.select('#tree-svg');
  group = d3.select('#tree-group');

  // ── Build proper hierarchical tree ─────────────────────────────────────────
  let root;
  try {
    console.log('📊 Processing family lineage...');
    
    // Find the main family lineage (members with parentId relationships)
    const mainLineage = members.filter(member => {
      // Include if they have a parentId (they're children)
      if (member.parentId) return true;
      
      // Include if they have children (they're parents in the lineage)
      const hasChildren = members.some(m => m.parentId === member.id);
      if (hasChildren) return true;
      
      // Exclude if they're only connected as spouses
      const isReferencedAsSpouse = members.some(m => {
        if (m.spouses && Array.isArray(m.spouses)) {
          return m.spouses.includes(member.id);
        }
        return m.spouse === member.id;
      });
      
      return !isReferencedAsSpouse;
    });

    console.log(`📈 Main lineage: ${mainLineage.length} members`);

    // If no main lineage found, include the first root member
    if (mainLineage.length === 0) {
      const rootMember = members.find(m => !m.parentId);
      if (rootMember) {
        mainLineage.push(rootMember);
        console.log('🌱 Added root member to empty lineage');
      }
    }

    // Safety check: ensure we have valid data for stratify
    if (mainLineage.length === 0) {
      throw new Error('No valid family lineage found');
    }

    const stratify = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parentId || null);
    root = stratify(mainLineage);
    
    console.log('✅ Tree structure created successfully');
  } catch (err) {
    console.error('Tree stratify error:', err);
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
    .on('zoom', e => {
      group.attr('transform', e.transform);
      currentTransform = e.transform; // Store current transform
    });
  svg.call(zoom);

  const w = container.clientWidth;
  const h = container.clientHeight;
  
  // Only reset to center if no previous transform exists (first load)
  if (!currentTransform) {
    currentTransform = d3.zoomIdentity.translate(w / 2, 80).scale(0.8);
  }
  
  // Apply the stored transform (preserves position after reload)
  svg.call(zoom.transform, currentTransform);

  // ── Links (parent-child relationships) ────────────────────────────────────
  // Draw parent-child links with straight orthogonal lines (right angles)
  group.selectAll('.link')
    .data(root.links())
    .join('path')
    .attr('class', 'link')
    .attr('d', d => {
      // Create orthogonal (right-angle) path instead of curved
      const sourceX = d.source.x;
      const sourceY = d.source.y;
      const targetX = d.target.x;
      const targetY = d.target.y;
      const midY = (sourceY + targetY) / 2;
      
      // Path: down from parent, horizontal to child's x, then down to child
      return `M ${sourceX} ${sourceY} 
              L ${sourceX} ${midY} 
              L ${targetX} ${midY} 
              L ${targetX} ${targetY}`;
    });

  // ── Main family nodes ──────────────────────────────────────────────────────
  nodes = group.selectAll('.node')
    .data(root.descendants())
    .join('g')
    .attr('class', d => `node ${d.data.gender || 'unknown'}`)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .on('click', (event, d) => {
      document.dispatchEvent(
        new CustomEvent('member-selected', { detail: d.data })
      );
    });

  nodes.append('circle').attr('r', NODE_RADIUS);

  nodes.append('text')
    .attr('class', 'name-label')
    .attr('dy', NODE_RADIUS + 14)
    .text(d => d.data.name); // Always show Chinese name

  nodes.append('text')
    .attr('class', 'year-label')
    .attr('dy', NODE_RADIUS + 26)
    .text(d => {
      const b  = d.data.birth || '?';
      const dd = d.data.death || '';
      return dd ? `${b}–${dd}` : b;
    });

  // ── Add spouses with STRAIGHT LINES ───────────────────────────────────────
  const spouseData = [];
  const marriageLinks = [];
  const renderedSpouses = new Set();
  const processedPairs = new Set(); // Prevent duplicate spouse pairs
  
  root.descendants().forEach(node => {
    const member = node.data;
    
    // Handle multiple spouses (new array format)
    if (member.spouses && Array.isArray(member.spouses) && member.spouses.length > 0) {
      const numSpouses = member.spouses.length;
      
      member.spouses.forEach((spouseId, index) => {
        // Create unique pair key to prevent duplicates
        const pairKey = [member.id, spouseId].sort().join('-');
        
        if (!processedPairs.has(pairKey) && !renderedSpouses.has(spouseId)) {
          const spouseMember = members.find(m => m.id === spouseId);
          if (spouseMember) {
            // Position spouses to keep main node centered
            // For 1 spouse: spouse on right (+80)
            // For 2 spouses: left (-80), right (+80) - main in center
            // For 3 spouses: left (-160), left (-80), right (+80), right (+160)
            let spouseX;
            
            if (numSpouses === 1) {
              // Single spouse: place on right
              spouseX = node.x + 80;
            } else if (numSpouses === 2) {
              // Two spouses: one left, one right (main in center)
              spouseX = index === 0 ? node.x - 80 : node.x + 80;
            } else {
              // Multiple spouses: distribute evenly on both sides
              const halfCount = Math.ceil(numSpouses / 2);
              if (index < halfCount) {
                // Left side spouses
                spouseX = node.x - (80 * (halfCount - index));
              } else {
                // Right side spouses
                spouseX = node.x + (80 * (index - halfCount + 1));
              }
            }
            
            const spouseNode = {
              data: spouseMember,
              x: spouseX,
              y: node.y, // Same Y = straight horizontal line
              isSpouse: true,
              spouseOf: member.id
            };
            spouseData.push(spouseNode);
            
            // STRAIGHT horizontal marriage link (red dashed line)
            marriageLinks.push({
              source: { x: node.x + (spouseX > node.x ? NODE_RADIUS : -NODE_RADIUS), y: node.y },
              target: { x: spouseX + (spouseX > node.x ? -NODE_RADIUS : NODE_RADIUS), y: node.y },
              spouseId: spouseId,
              memberId: member.id
            });
            
            renderedSpouses.add(spouseId);
            processedPairs.add(pairKey);
          }
        }
      });
    }
    
    // Handle legacy single spouse format
    else if (member.spouse) {
      const pairKey = [member.id, member.spouse].sort().join('-');
      
      if (!processedPairs.has(pairKey) && !renderedSpouses.has(member.spouse)) {
        const spouseMember = members.find(m => m.id === member.spouse);
        if (spouseMember) {
          const spouseNode = {
            data: spouseMember,
            x: node.x + 80,
            y: node.y, // Same Y = straight horizontal line
            isSpouse: true,
            spouseOf: member.id
          };
          spouseData.push(spouseNode);
          
          // STRAIGHT horizontal marriage link (red dashed line)
          marriageLinks.push({
            source: { x: node.x + NODE_RADIUS, y: node.y },
            target: { x: spouseNode.x - NODE_RADIUS, y: node.y },
            spouseId: member.spouse,
            memberId: member.id
          });
          
          renderedSpouses.add(member.spouse);
          processedPairs.add(pairKey);
        }
      }
    }
  });

  // Render STRAIGHT marriage links with solid red line
  group.selectAll('.marriage-link')
    .data(marriageLinks)
    .join('line')
    .attr('class', 'marriage-link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
    .attr('stroke', '#e74c3c')
    .attr('stroke-width', 3); // Solid line (removed dasharray)

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
    .text(d => d.data.name); // Always show Chinese name

  spouseNodes.append('text')
    .attr('class', 'year-label')
    .attr('dy', NODE_RADIUS + 26)
    .text(d => {
      const b  = d.data.birth || '?';
      const dd = d.data.death || '';
      return dd ? `${b}–${dd}` : b;
    });

  // Update nodes selection to include spouses
  nodes = group.selectAll('.node, .spouse-node');

  // ── Setup controls ─────────────────────────────────────────────────────────
  setupControls(container);
  
  const endTime = performance.now();
  console.log(`✅ Tree render completed in ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`📊 Rendered ${root.descendants().length} main nodes + ${spouseData.length} spouse nodes`);
}

/**
 * Render the detail panel for a selected member in the left sidebar.
 */
export function renderDetailPanel(member, role, allMembers = []) {
  const content = document.getElementById('sidebar-detail-content');
  if (!content) return;

  // Get current language
  const lang = _currentLanguage;
  const isZh = lang === 'zh';
  
  // Translations
  const labels = {
    gender: isZh ? '性别' : 'Gender',
    male: isZh ? '♂ 男' : '♂ Male',
    female: isZh ? '♀ 女' : '♀ Female',
    unknown: isZh ? '—' : '—',
    born: isZh ? '出生' : 'Born',
    died: isZh ? '去世' : 'Died',
    living: isZh ? '在世' : 'Living',
    leeFamily: isZh ? '李家成员' : 'Lee Family',
    yes: isZh ? '✓ 是' : '✓ Yes',
    no: isZh ? '✗ 否' : '✗ No',
    parent: isZh ? '父母' : 'Parent',
    otherParent: isZh ? '另一方父母' : 'Other Parent',
    notes: isZh ? '备注' : 'Notes',
    addChild: isZh ? '➕ 添加子女' : '➕ Add Child',
    addSpouse: isZh ? '💑 添加配偶' : '💑 Add Spouse',
    edit: isZh ? '✏️ 编辑' : '✏️ Edit',
    delete: isZh ? '🗑️ 删除' : '🗑️ Delete'
  };

  const gender = member.gender === 'male' ? labels.male
               : member.gender === 'female' ? labels.female : labels.unknown;
  const birth  = member.birth  || '—';
  const death  = member.death  || labels.living;
  const nickname = member.chinese || '—';
  const notes  = member.notes  || '—';
  const leeFamilyStatus = member.isLeeFamilyMember !== false ? labels.yes : labels.no;

  const canEdit = role === 'editor' || role === 'admin';
  const hasChildren = allMembers.some(m => m.parentId === member.id);
  
  // Find parent information if this member has a parent
  let parentInfo = '';
  if (member.parentId) {
    const parent = allMembers.find(m => m.id === member.parentId);
    if (parent) {
      parentInfo = `<tr><td>${labels.parent}</td><td>${parent.name}</td></tr>`;
      
      // If there's a secondary parent (spouse), show it
      if (member.secondaryParentId) {
        const secondaryParent = allMembers.find(m => m.id === member.secondaryParentId);
        if (secondaryParent) {
          parentInfo += `<tr><td>${labels.otherParent}</td><td>${secondaryParent.name}</td></tr>`;
        }
      }
    }
  }

  content.innerHTML = `
    <h2 style="margin-bottom: 8px; font-size: 22px; color: #2c1810;">${member.name}</h2>
    ${nickname !== '—' ? `<div class="chinese-name">${nickname}</div>` : ''}
    <table>
      <tr><td>${labels.gender}</td><td>${gender}</td></tr>
      <tr><td>${labels.born}</td><td>${birth}</td></tr>
      <tr><td>${labels.died}</td><td>${death}</td></tr>
      <tr><td>${labels.leeFamily}</td><td style="font-weight: 600; color: ${member.isLeeFamilyMember !== false ? '#27ae60' : '#999'};">${leeFamilyStatus}</td></tr>
      ${parentInfo}
      <tr><td>${labels.notes}</td><td>${notes}</td></tr>
    </table>
    ${canEdit ? `
    <div class="detail-actions">
      <button class="btn-action btn-add-child" data-id="${member.id}">${labels.addChild}</button>
      <button class="btn-action btn-add-spouse" data-id="${member.id}">${labels.addSpouse}</button>
      <button class="btn-action btn-edit" data-id="${member.id}">${labels.edit}</button>
      ${!hasChildren ? `<button class="btn-action btn-delete" data-id="${member.id}" data-name="${member.name}">${labels.delete}</button>` : ''}
    </div>` : ''}
  `;
}

/**
 * Setup controls for zoom, language toggle, and search
 */
function setupControls(container) {
  const btnZoomIn  = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnReset   = document.getElementById('btn-reset');
  const btnLang    = document.getElementById('btn-toggle-lang');

  const w = container.clientWidth;
  const h = container.clientHeight;

  if (btnZoomIn)  btnZoomIn.onclick  = () => svg.transition().call(zoom.scaleBy, 1.3);
  if (btnZoomOut) btnZoomOut.onclick = () => svg.transition().call(zoom.scaleBy, 0.77);
  if (btnReset)   btnReset.onclick   = () =>
    svg.transition().call(zoom.transform, d3.zoomIdentity.translate(w / 2, 80).scale(0.8));

  if (btnLang) btnLang.onclick = () => {
    showChinese = !showChinese;
    _currentLanguage = showChinese ? 'zh' : 'en';
    
    // Tree nodes always show Chinese names - no need to update them
    // Only update UI translations
    import('./translations.js').then(module => {
      module.applyTranslations(_currentLanguage);
      
      // Trigger custom event for other modules to update
      document.dispatchEvent(new CustomEvent('language-changed', { 
        detail: { language: _currentLanguage } 
      }));
    });
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