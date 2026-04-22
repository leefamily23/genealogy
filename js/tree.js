// ── Config ────────────────────────────────────────────────────────────────────
const NODE_WIDTH = 100;
const NODE_HEIGHT = 140;
const NODE_SPACING = { x: 160, y: 200 };
const PHOTO_RADIUS = 25;
let   showChinese  = true;
let   _currentRole = null;
let   _currentLanguage = 'zh'; // 'zh' or 'en'

// ── Helper Functions ──────────────────────────────────────────────────────────
/**
 * Get card background color based on gender
 * @param {string} gender - 'male', 'female', or 'unknown'
 * @returns {string} CSS color
 */
function getNodeColor(gender) {
  switch (gender) {
    case 'male':
      return '#4a90e2'; // Blue for males
    case 'female':
      return '#e24a90'; // Pink for females
    default:
      return '#52c4a0'; // Teal for unknown (like your example image)
  }
}

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
    
    // Validate data integrity first
    const orphanedMembers = members.filter(m => {
      if (m.parentId) {
        const parentExists = members.some(p => p.id === m.parentId);
        if (!parentExists) {
          console.error(`❌ Member "${m.name}" (ID: ${m.id}) has parentId "${m.parentId}" but parent doesn't exist!`);
          return true;
        }
      }
      return false;
    });
    
    if (orphanedMembers.length > 0) {
      const orphanNames = orphanedMembers.map(m => `${m.name} (ID: ${m.id}, parentId: ${m.parentId})`).join(', ');
      throw new Error(`Found ${orphanedMembers.length} members with missing parents: ${orphanNames}. Please fix the data or remove the invalid parentId.`);
    }
    
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

    // If no main lineage found, include all root members
    if (mainLineage.length === 0) {
      const rootMembers = members.filter(m => !m.parentId);
      mainLineage.push(...rootMembers);
      console.log('🌱 Added root members to empty lineage');
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
      `<p style="padding:40px;color:#c0392b;font-size:14px;line-height:1.6">
        <strong>Tree error:</strong><br>${err.message}<br><br>
        <strong>Solution:</strong> Please check the database for members with invalid parent references.
      </p>`;
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
  // Draw parent-child links connecting card edges
  group.selectAll('.link')
    .data(root.links())
    .join('path')
    .attr('class', 'link')
    .attr('d', d => {
      // Create orthogonal path connecting card edges
      const sourceX = d.source.x;
      const sourceY = d.source.y + NODE_HEIGHT/2; // Bottom edge of parent card
      const targetX = d.target.x;
      const targetY = d.target.y - NODE_HEIGHT/2; // Top edge of child card
      const midY = (sourceY + targetY) / 2;
      
      // Path: down from parent card bottom, horizontal to child's x, then down to child card top
      return `M ${sourceX} ${sourceY} 
              L ${sourceX} ${midY} 
              L ${targetX} ${midY} 
              L ${targetX} ${targetY}`;
    });

  // ── Main family nodes (Card Design) ───────────────────────────────────────────
  nodes = group.selectAll('.node')
    .data(root.descendants())
    .join('g')
    .attr('class', d => `node ${d.data.gender || 'unknown'}`)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      console.log('Node clicked:', d.data.name);
      document.dispatchEvent(
        new CustomEvent('member-selected', { detail: d.data })
      );
    });

  // Create card-style nodes
  nodes.each(function(d) {
    const node = d3.select(this);
    const member = d.data;
    
    // Card background with rounded corners
    node.append('rect')
      .attr('x', -NODE_WIDTH/2)
      .attr('y', -NODE_HEIGHT/2)
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', getNodeColor(member.gender))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');
    
    // Photo rectangle background (white rectangle for photo)
    const photoY = -NODE_HEIGHT/2 + 35;
    const photoWidth = 50;
    const photoHeight = 50;
    
    node.append('rect')
      .attr('x', -photoWidth/2)
      .attr('y', photoY - photoHeight/2)
      .attr('width', photoWidth)
      .attr('height', photoHeight)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', '#fff')
      .attr('stroke', 'none');
    
    // Add profile image if available - CHECK EXPLICITLY FOR THIS MEMBER'S IMAGE
    const hasImage = member.imageURL && member.imageURL.trim() !== '' && member.imageURL.startsWith('data:image');
    
    if (hasImage) {
      try {
        const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
        const clipId = `clip-main-${member.id}`;
        
        // Remove old clip path if exists
        defs.select(`#${clipId}`).remove();
        
        // Create new clip path (rectangle with rounded corners)
        defs.append('clipPath')
          .attr('id', clipId)
          .append('rect')
          .attr('x', -photoWidth/2)
          .attr('y', photoY - photoHeight/2)
          .attr('width', photoWidth)
          .attr('height', photoHeight)
          .attr('rx', 6)
          .attr('ry', 6);
        
        node.append('image')
          .attr('x', -photoWidth/2)
          .attr('y', photoY - photoHeight/2)
          .attr('width', photoWidth)
          .attr('height', photoHeight)
          .attr('clip-path', `url(#${clipId})`)
          .attr('href', member.imageURL)
          .style('opacity', 0)
          .style('cursor', 'pointer')
          .style('pointer-events', 'none')
          .on('load', function() {
            d3.select(this).transition().duration(300).style('opacity', 1);
          })
          .on('error', function() {
            console.warn(`Image failed to load for ${member.name}`);
            d3.select(this).remove();
          });
      } catch (error) {
        console.warn('Error adding image to card:', error);
      }
    } else {
      // Default avatar when no image
      node.append('text')
        .attr('x', 0)
        .attr('y', photoY + 6)
        .attr('text-anchor', 'middle')
        .attr('font-size', '20px')
        .attr('fill', '#999')
        .text('👤');
    }
    
    // Member name (centered, below photo)
    const nameY = photoY + PHOTO_RADIUS + 20;
    node.append('text')
      .attr('x', 0)
      .attr('y', nameY)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text(member.name);
    
    // Birth/Death years (at bottom of card)
    const birth = member.birth || '?';
    const death = member.death || '';
    const yearText = death ? `${birth}–${death}` : birth;
    
    const yearY = NODE_HEIGHT/2 - 12;
    node.append('text')
      .attr('x', 0)
      .attr('y', yearY)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#fff')
      .attr('opacity', 0.9)
      .text(yearText);
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
            
            // STRAIGHT horizontal marriage link connecting card edges
            marriageLinks.push({
              source: { x: node.x + (spouseX > node.x ? NODE_WIDTH/2 : -NODE_WIDTH/2), y: node.y },
              target: { x: spouseX + (spouseX > node.x ? -NODE_WIDTH/2 : NODE_WIDTH/2), y: node.y },
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
          
          // STRAIGHT horizontal marriage link connecting card edges
          marriageLinks.push({
            source: { x: node.x + NODE_WIDTH/2, y: node.y },
            target: { x: spouseNode.x - NODE_WIDTH/2, y: node.y },
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
    .attr('stroke-width', 3);

  // Render spouse nodes (same design as main nodes)
  const spouseNodes = group.selectAll('.spouse-node')
    .data(spouseData)
    .join('g')
    .attr('class', d => `spouse-node node ${d.data.gender || 'unknown'}`)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      console.log('Spouse node clicked:', d.data.name);
      document.dispatchEvent(
        new CustomEvent('member-selected', { detail: d.data })
      );
    });

  // Create spouse nodes (same card design as main nodes)
  spouseNodes.each(function(d) {
    const node = d3.select(this);
    const member = d.data;
    
    // Card background with rounded corners
    node.append('rect')
      .attr('x', -NODE_WIDTH/2)
      .attr('y', -NODE_HEIGHT/2)
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', getNodeColor(member.gender))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
    
    // Photo rectangle background (white rectangle for photo)
    const photoY = -NODE_HEIGHT/2 + 35;
    const photoWidth = 50;
    const photoHeight = 50;
    
    node.append('rect')
      .attr('x', -photoWidth/2)
      .attr('y', photoY - photoHeight/2)
      .attr('width', photoWidth)
      .attr('height', photoHeight)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', '#fff')
      .attr('stroke', 'none');
    
    // Add profile image if available - CHECK EXPLICITLY FOR THIS MEMBER'S IMAGE
    const hasImage = member.imageURL && member.imageURL.trim() !== '' && member.imageURL.startsWith('data:image');
    
    if (hasImage) {
      try {
        const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
        const clipId = `clip-spouse-${member.id}`;
        
        // Remove old clip path if exists
        defs.select(`#${clipId}`).remove();
        
        // Create new clip path (rectangle with rounded corners)
        defs.append('clipPath')
          .attr('id', clipId)
          .append('rect')
          .attr('x', -photoWidth/2)
          .attr('y', photoY - photoHeight/2)
          .attr('width', photoWidth)
          .attr('height', photoHeight)
          .attr('rx', 6)
          .attr('ry', 6);
        
        node.append('image')
          .attr('x', -photoWidth/2)
          .attr('y', photoY - photoHeight/2)
          .attr('width', photoWidth)
          .attr('height', photoHeight)
          .attr('clip-path', `url(#${clipId})`)
          .attr('href', member.imageURL)
          .style('opacity', 0)
          .style('cursor', 'pointer')
          .style('pointer-events', 'none')
          .on('load', function() {
            d3.select(this).transition().duration(300).style('opacity', 1);
          })
          .on('error', function() {
            console.warn(`Spouse image failed to load for ${member.name}`);
            d3.select(this).remove();
          });
      } catch (error) {
        console.warn('Error adding image to spouse card:', error);
      }
    } else {
      // Default avatar when no image
      node.append('text')
        .attr('x', 0)
        .attr('y', photoY + 6)
        .attr('text-anchor', 'middle')
        .attr('font-size', '20px')
        .attr('fill', '#999')
        .text('👤');
    }
    
    // Member name (centered, below photo)
    const nameY = photoY + PHOTO_RADIUS + 20;
    node.append('text')
      .attr('x', 0)
      .attr('y', nameY)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text(member.name);
    
    // Birth/Death years (at bottom of card)
    const birth = member.birth || '?';
    const death = member.death || '';
    const yearText = death ? `${birth}–${death}` : birth;
    
    const yearY = NODE_HEIGHT/2 - 12;
    node.append('text')
      .attr('x', 0)
      .attr('y', yearY)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#fff')
      .attr('opacity', 0.9)
      .text(yearText);
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

  // Always use Chinese labels
  const labels = {
    gender: '性别',
    male: '♂ 男',
    female: '♀ 女',
    unknown: '—',
    born: '出生',
    died: '去世',
    living: '在世',
    leeFamily: '李家成员',
    yes: '✓ 是',
    no: '✗ 否',
    parent: '父',
    otherParent: '母',
    notes: '备注',
    addChild: '➕ 添加子女',
    addParent: '⬆️ 添加父母',
    addSpouse: '💑 添加配偶',
    edit: '✏️ 编辑',
    delete: '🗑️ 删除'
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
  const hasParent = !!member.parentId; // Check if member already has a parent
  
  // Find parent information if this member has a parent
  let parentInfo = '';
  if (member.parentId) {
    const parent = allMembers.find(m => m.id === member.parentId);
    const secondaryParent = member.secondaryParentId ? allMembers.find(m => m.id === member.secondaryParentId) : null;
    
    // Determine who is father and who is mother based on gender
    let father = null;
    let mother = null;
    
    if (parent && secondaryParent) {
      // Both parents exist - assign based on gender
      if (parent.gender === 'male' && secondaryParent.gender === 'female') {
        father = parent;
        mother = secondaryParent;
      } else if (parent.gender === 'female' && secondaryParent.gender === 'male') {
        mother = parent;
        father = secondaryParent;
      } else if (parent.gender === 'male') {
        // Primary is male, secondary gender unknown
        father = parent;
        mother = secondaryParent;
      } else if (parent.gender === 'female') {
        // Primary is female, secondary gender unknown
        mother = parent;
        father = secondaryParent;
      } else if (secondaryParent.gender === 'male') {
        // Primary gender unknown, secondary is male
        father = secondaryParent;
        mother = parent;
      } else if (secondaryParent.gender === 'female') {
        // Primary gender unknown, secondary is female
        mother = secondaryParent;
        father = parent;
      } else {
        // Both genders unknown - use primary as father
        father = parent;
        mother = secondaryParent;
      }
    } else if (parent) {
      // Only one parent - assign based on gender
      if (parent.gender === 'male') {
        father = parent;
      } else if (parent.gender === 'female') {
        mother = parent;
      } else {
        father = parent; // Default to father if unknown
      }
    }
    
    // Display father and mother
    if (father) {
      parentInfo += `<tr><td>${labels.parent}</td><td>${father.name}</td></tr>`;
    }
    if (mother) {
      parentInfo += `<tr><td>${labels.otherParent}</td><td>${mother.name}</td></tr>`;
    }
  }

  content.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 15px;">
      ${member.imageURL ? `
        <div style="flex-shrink: 0;">
          <img src="${member.imageURL}" alt="${member.name}" 
               style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 3px solid #8b1a1a; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"
               onerror="this.style.display='none'">
        </div>
      ` : ''}
      <div style="flex: 1;">
        <h2 style="margin-bottom: 8px; font-size: 22px; color: #2c1810;">${member.name}</h2>
        ${nickname !== '—' ? `<div class="chinese-name">${nickname}</div>` : ''}
      </div>
    </div>
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
      ${!hasParent ? `<button class="btn-action btn-add-parent" data-id="${member.id}">${labels.addParent}</button>` : ''}
      <button class="btn-action btn-add-child" data-id="${member.id}">${labels.addChild}</button>
      <button class="btn-action btn-add-spouse" data-id="${member.id}">${labels.addSpouse}</button>
      <button class="btn-action btn-edit" data-id="${member.id}">${labels.edit}</button>
      ${!hasChildren ? `<button class="btn-action btn-delete" data-id="${member.id}" data-name="${member.name}">${labels.delete}</button>` : ''}
    </div>` : ''}
  `;
}

/**
 * Setup controls for zoom and search
 */
function setupControls(container) {
  const btnZoomIn  = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnReset   = document.getElementById('btn-reset');

  const w = container.clientWidth;
  const h = container.clientHeight;

  if (btnZoomIn)  btnZoomIn.onclick  = () => svg.transition().call(zoom.scaleBy, 1.3);
  if (btnZoomOut) btnZoomOut.onclick = () => svg.transition().call(zoom.scaleBy, 0.77);
  if (btnReset)   btnReset.onclick   = () =>
    svg.transition().call(zoom.transform, d3.zoomIdentity.translate(w / 2, 80).scale(0.8));

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