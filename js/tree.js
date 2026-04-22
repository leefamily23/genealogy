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
    .on('zoom', e => group.attr('transform', e.transform));
  svg.call(zoom);

  const w = container.clientWidth;
  const h = container.clientHeight;
  svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, 80).scale(0.8));

  // ── Links (parent-child relationships) ────────────────────────────────────
  group.selectAll('.link')
    .data(root.links())
    .join('path')
    .attr('class', 'link')
    .attr('d', d3.linkVertical().x(d => d.x).y(d => d.y));

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
    .text(d => {
      if (showChinese) {
        return d.data.name;
      } else {
        return d.data.chinese || d.data.name;
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

  // ── Add spouses with STRAIGHT LINES ───────────────────────────────────────
  const spouseData = [];
  const marriageLinks = [];
  const renderedSpouses = new Set();
  const processedPairs = new Set(); // Prevent duplicate spouse pairs
  
  root.descendants().forEach(node => {
    const member = node.data;
    
    // Handle multiple spouses (new array format)
    if (member.spouses && Array.isArray(member.spouses)) {
      member.spouses.forEach((spouseId, index) => {
        // Create unique pair key to prevent duplicates
        const pairKey = [member.id, spouseId].sort().join('-');
        
        if (!processedPairs.has(pairKey) && !renderedSpouses.has(spouseId)) {
          const spouseMember = members.find(m => m.id === spouseId);
          if (spouseMember) {
            const spouseNode = {
              data: spouseMember,
              x: node.x + 80 + (index * 80),
              y: node.y, // Same Y = straight horizontal line
              isSpouse: true,
              spouseOf: member.id
            };
            spouseData.push(spouseNode);
            
            // STRAIGHT horizontal marriage link
            marriageLinks.push({
              source: { x: node.x + NODE_RADIUS, y: node.y },
              target: { x: spouseNode.x - NODE_RADIUS, y: node.y },
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
          
          // STRAIGHT horizontal marriage link
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

  // Render STRAIGHT marriage links
  group.selectAll('.marriage-link')
    .data(marriageLinks)
    .join('line')
    .attr('class', 'marriage-link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
    .attr('stroke', '#e74c3c')
    .attr('stroke-width', 3);

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

  const gender = member.gender === 'male' ? '♂ Male'
               : member.gender === 'female' ? '♀ Female' : '—';
  const birth  = member.birth  || '—';
  const death  = member.death  || 'Living';
  const nickname = member.chinese || '—';
  const notes  = member.notes  || '—';

  const canEdit = role === 'editor' || role === 'admin';
  const hasChildren = allMembers.some(m => m.parentId === member.id);

  content.innerHTML = `
    <h2 style="margin-bottom: 8px; font-size: 22px; color: #2c1810;">${member.name}</h2>
    ${nickname !== '—' ? `<div class="chinese-name">${nickname}</div>` : ''}
    <table>
      <tr><td>Gender</td><td>${gender}</td></tr>
      <tr><td>Born</td><td>${birth}</td></tr>
      <tr><td>Died</td><td>${death}</td></tr>
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
    if (nodes) {
      nodes.selectAll('text.name-label')
        .text(d => {
          if (showChinese) {
            return d.data.name;
          } else {
            return d.data.chinese || d.data.name;
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