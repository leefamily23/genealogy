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

  // ── Build family tree with proper marriage and child relationships ─────────
  try {
    const familyLayout = buildFamilyLayout(members);
    renderFamilyTree(familyLayout);
  } catch (err) {
    container.innerHTML =
      `<p style="padding:40px;color:#c0392b">Tree error: ${err.message}</p>`;
    return;
  }

  // ── Zoom & pan ─────────────────────────────────────────────────────────────
  zoom = d3.zoom()
    .scaleExtent([0.1, 3])
    .on('zoom', e => group.attr('transform', e.transform));
  svg.call(zoom);

  const w = container.clientWidth;
  const h = container.clientHeight;
  svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, 80).scale(0.8));

  // ── Controls and search setup ──────────────────────────────────────────────
  setupControls(container);
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

/**
 * Build a proper family tree layout with marriages and children from couples
 * @param {object[]} members - Array of family members
 * @returns {object} Layout data for rendering
 */
function buildFamilyLayout(members) {
  const layout = {
    couples: [],
    individuals: [],
    children: [],
    links: []
  };

  // Find all married couples
  const processedSpouses = new Set();
  
  members.forEach(member => {
    if (member.spouse && !processedSpouses.has(member.id)) {
      const spouse = members.find(m => m.id === member.spouse);
      if (spouse) {
        // Create couple unit
        const couple = {
          id: `couple-${member.id}-${spouse.id}`,
          member1: member,
          member2: spouse,
          children: members.filter(m => m.parentId === member.id || m.parentId === spouse.id)
        };
        layout.couples.push(couple);
        processedSpouses.add(member.id);
        processedSpouses.add(spouse.id);
      }
    }
  });

  // Find individuals without spouses
  members.forEach(member => {
    if (!member.spouse && !processedSpouses.has(member.id)) {
      layout.individuals.push({
        ...member,
        children: members.filter(m => m.parentId === member.id)
      });
    }
  });

  return layout;
}

/**
 * Render the family tree with proper couple and child relationships
 * @param {object} layout - Family layout data
 */
function renderFamilyTree(layout) {
  const allNodes = [];
  const allLinks = [];
  
  let currentY = 0;
  const levelHeight = NODE_SPACING.y;
  
  // Position couples and individuals at root level
  let currentX = 0;
  
  // Render couples
  layout.couples.forEach(couple => {
    // Position the couple side by side
    const member1X = currentX;
    const member2X = currentX + NODE_SPACING.x * 0.6;
    const coupleY = currentY;
    
    // Add couple members
    allNodes.push({
      data: couple.member1,
      x: member1X,
      y: coupleY,
      type: 'person'
    });
    
    allNodes.push({
      data: couple.member2,
      x: member2X,
      y: coupleY,
      type: 'person'
    });
    
    // Add marriage link
    allLinks.push({
      source: { x: member1X, y: coupleY },
      target: { x: member2X, y: coupleY },
      type: 'marriage'
    });
    
    // Position children below the couple
    if (couple.children.length > 0) {
      const coupleCenter = (member1X + member2X) / 2;
      const childrenY = coupleY + levelHeight;
      const childrenStartX = coupleCenter - (couple.children.length - 1) * NODE_SPACING.x / 2;
      
      couple.children.forEach((child, index) => {
        const childX = childrenStartX + index * NODE_SPACING.x;
        
        allNodes.push({
          data: child,
          x: childX,
          y: childrenY,
          type: 'person'
        });
        
        // Link from couple center to child
        allLinks.push({
          source: { x: coupleCenter, y: coupleY + NODE_RADIUS },
          target: { x: childX, y: childrenY - NODE_RADIUS },
          type: 'parent-child'
        });
      });
    }
    
    currentX += NODE_SPACING.x * 2;
  });
  
  // Render individuals
  layout.individuals.forEach(individual => {
    allNodes.push({
      data: individual,
      x: currentX,
      y: currentY,
      type: 'person'
    });
    
    // Position children below individual
    if (individual.children.length > 0) {
      const childrenY = currentY + levelHeight;
      const childrenStartX = currentX - (individual.children.length - 1) * NODE_SPACING.x / 2;
      
      individual.children.forEach((child, index) => {
        const childX = childrenStartX + index * NODE_SPACING.x;
        
        allNodes.push({
          data: child,
          x: childX,
          y: childrenY,
          type: 'person'
        });
        
        // Link from parent to child
        allLinks.push({
          source: { x: currentX, y: currentY + NODE_RADIUS },
          target: { x: childX, y: childrenY - NODE_RADIUS },
          type: 'parent-child'
        });
      });
    }
    
    currentX += NODE_SPACING.x;
  });
  
  // Render links
  group.selectAll('.family-link')
    .data(allLinks)
    .join('line')
    .attr('class', d => `family-link ${d.type}`)
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
    .attr('stroke', d => d.type === 'marriage' ? '#e74c3c' : '#8b4513')
    .attr('stroke-width', d => d.type === 'marriage' ? 3 : 2)
    .attr('stroke-dasharray', d => d.type === 'marriage' ? '5,5' : 'none');
  
  // Render nodes
  nodes = group.selectAll('.family-node')
    .data(allNodes)
    .join('g')
    .attr('class', d => `family-node node ${d.data.gender || 'unknown'}`)
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
}

/**
 * Setup controls for zoom, language toggle, and search
 * @param {HTMLElement} container - Tree container element
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