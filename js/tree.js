// ── Config ────────────────────────────────────────────────────────────────────
const NODE_WIDTH = 100;
const NODE_HEIGHT = 140;
const NODE_SPACING = { x: 160, y: 200 };
const PHOTO_RADIUS = 25;
let   showChinese  = true;
let   _currentRole = null;
let   _currentLanguage = 'zh'; // 'zh' or 'en'

// ── Relationship Mode State ──────────────────────────────────────────────────
let _relationshipMode = false;
let _selectedPeople = [];
let _allMembers = []; // Store all members for relationship calculation

// ── Helper Functions ──────────────────────────────────────────────────────────
/**
 * Convert country name to ISO 2-letter country code for flagcdn.com
 */
function countryCode(nationality) {
  if (!nationality) return null;
  const map = {
    '马来西亚': 'my', 'malaysia': 'my',
    '中国': 'cn', 'china': 'cn',
    '新加坡': 'sg', 'singapore': 'sg',
    '澳大利亚': 'au', 'australia': 'au',
    '美国': 'us', 'usa': 'us', 'united states': 'us',
    '英国': 'gb', 'uk': 'gb', 'united kingdom': 'gb',
    '加拿大': 'ca', 'canada': 'ca',
    '日本': 'jp', 'japan': 'jp',
    '台湾': 'tw', 'taiwan': 'tw',
    '香港': 'hk', 'hong kong': 'hk',
    '印尼': 'id', 'indonesia': 'id',
    '泰国': 'th', 'thailand': 'th',
    '菲律宾': 'ph', 'philippines': 'ph',
    '文莱': 'bn', 'brunei': 'bn',
    '新西兰': 'nz', 'new zealand': 'nz',
  };
  return map[nationality.toLowerCase()] || map[nationality] || null;
}

/**
 * Convert country name to flag emoji (for detail panel HTML)
 */
function countryFlag(nationality) {
  if (!nationality) return '';
  const code = countryCode(nationality);
  if (!code) return '🌏';
  // Convert ISO code to flag emoji using regional indicator symbols
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');
}

/**
 * Get card background color based on gender
 * @param {string} gender - 'male', 'female', or 'unknown'
 * @returns {string} CSS color
 */
function getNodeColor(gender, death) {
  // Grey out deceased members
  if (death && death.trim() !== '') return '#888888';
  switch (gender) {
    case 'male':   return '#4a90e2';
    case 'female': return '#e24a90';
    default:       return '#52c4a0';
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
  _allMembers = members; // Store for relationship calculations

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
      
      if (_relationshipMode) {
        handleRelationshipSelection(d.data);
      } else {
        document.dispatchEvent(
          new CustomEvent('member-selected', { detail: d.data })
        );
      }
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
      .attr('fill', getNodeColor(member.gender, member.death))
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

    // Nickname below name
    const nicknameY = nameY + 14;
    if (member.chinese) {
      node.append('text')
        .attr('x', 0)
        .attr('y', nicknameY)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', 'rgba(255,255,255,0.85)')
        .text(member.chinese);
    }

    // Flag image at bottom
    const code = countryCode(member.nationality);
    if (code) {
      const flagW = 24, flagH = 16;
      node.append('image')
        .attr('x', -flagW/2)
        .attr('y', NODE_HEIGHT/2 - flagH - 6)
        .attr('width', flagW)
        .attr('height', flagH)
        .attr('href', `https://flagcdn.com/w40/${code}.png`)
        .attr('clip-path', `url(#flag-clip-${member.id})`)
        .style('pointer-events', 'none');
      // Rounded clip for flag
      const defs2 = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
      defs2.select(`#flag-clip-${member.id}`).remove();
      defs2.append('clipPath').attr('id', `flag-clip-${member.id}`)
        .append('rect')
        .attr('x', -flagW/2).attr('y', NODE_HEIGHT/2 - flagH - 6)
        .attr('width', flagW).attr('height', flagH).attr('rx', 3);
    }
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
      
      if (_relationshipMode) {
        handleRelationshipSelection(d.data);
      } else {
        document.dispatchEvent(
          new CustomEvent('member-selected', { detail: d.data })
        );
      }
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
      .attr('fill', getNodeColor(member.gender, member.death))
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

    // Nickname below name
    const nicknameY = nameY + 14;
    if (member.chinese) {
      node.append('text')
        .attr('x', 0)
        .attr('y', nicknameY)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', 'rgba(255,255,255,0.85)')
        .text(member.chinese);
    }

    // Flag image at bottom
    const code = countryCode(member.nationality);
    if (code) {
      const flagW = 24, flagH = 16;
      node.append('image')
        .attr('x', -flagW/2)
        .attr('y', NODE_HEIGHT/2 - flagH - 6)
        .attr('width', flagW)
        .attr('height', flagH)
        .attr('href', `https://flagcdn.com/w40/${code}.png`)
        .attr('clip-path', `url(#flag-clip-sp-${member.id})`)
        .style('pointer-events', 'none');
      const defs2 = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
      defs2.select(`#flag-clip-sp-${member.id}`).remove();
      defs2.append('clipPath').attr('id', `flag-clip-sp-${member.id}`)
        .append('rect')
        .attr('x', -flagW/2).attr('y', NODE_HEIGHT/2 - flagH - 6)
        .attr('width', flagW).attr('height', flagH).attr('rx', 3);
    }
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
    hometown: '籍贯',
    nationality: '国籍',
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
               onclick="window.openPhotoViewer('${member.imageURL}', '${member.name.replace(/'/g, "\\'")}')"
               style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 3px solid #8b1a1a; box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: zoom-in;"
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
      ${member.death ? `<tr><td>${labels.died}</td><td>${member.death}</td></tr>` : ''}
      ${parentInfo}
      ${member.hometown ? `<tr><td>${labels.hometown}</td><td>${member.hometown}</td></tr>` : ''}
      ${member.nationality ? `<tr><td>${labels.nationality}</td><td>${countryFlag(member.nationality)} ${member.nationality}</td></tr>` : ''}
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
 * Export the current tree view as PNG image
 * @param {string} currentTab - Current tab name ('genealogy' or 'family-tree')
 */
export async function exportTreeAsImage(currentTab = 'family-tree') {
  try {
    const svgElement = document.getElementById('tree-svg');
    if (!svgElement) {
      alert('❌ 无法找到家族树');
      return;
    }

    // Get SVG dimensions and current transform
    const bbox = group.node().getBBox();
    const transform = d3.zoomTransform(svgElement);
    
    // Calculate dimensions with padding - use higher resolution for clarity
    // Higher resolution for mobile devices
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const scale = isMobile ? 4 : 2; // 4x resolution for mobile, 2x for desktop
    const padding = 50;
    const width = (bbox.width + padding * 2) * scale;
    const height = (bbox.height + padding * 2) * scale;
    
    // Clone SVG for export
    const clonedSvg = svgElement.cloneNode(true);
    clonedSvg.setAttribute('width', width);
    clonedSvg.setAttribute('height', height);
    
    // Apply transform to center the content
    const g = clonedSvg.querySelector('g');
    if (g) {
      const translateX = -bbox.x * scale + padding * scale;
      const translateY = -bbox.y * scale + padding * scale;
      g.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
    }
    
    // Convert SVG to string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    
    // Create canvas with higher resolution
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Create image from SVG
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      // Download as PNG with proper filename
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        
        // Generate filename based on current tab
        const now = new Date();
        const dateStr = now.getFullYear().toString() + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + 
                       now.getDate().toString().padStart(2, '0');
        const timeStr = now.getHours().toString().padStart(2, '0') + 
                       now.getMinutes().toString().padStart(2, '0') + 
                       now.getSeconds().toString().padStart(2, '0');
        
        const tabName = currentTab === 'genealogy' ? '族谱' : '家族树';
        link.download = `${tabName}_${dateStr}_${timeStr}.png`;
        
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        
        alert('✅ 家族树已导出为图片');
      }, 'image/png');
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert('❌ 导出失败，请重试');
    };
    
    img.src = url;
    
  } catch (error) {
    console.error('Export error:', error);
    alert(`❌ 导出失败: ${error.message}`);
  }
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

// ── Relationship Mode Functions ───────────────────────────────────────────────

/**
 * Toggle relationship mode on/off
 */
export function toggleRelationshipMode() {
  _relationshipMode = !_relationshipMode;
  _selectedPeople = [];
  
  const btn = document.getElementById('btn-relationship');
  const instructions = document.getElementById('relationship-instructions');
  
  if (_relationshipMode) {
    btn.style.backgroundColor = '#e74c3c';
    btn.style.color = 'white';
    showRelationshipInstructions('请点击第一个人');
  } else {
    btn.style.backgroundColor = '';
    btn.style.color = '';
    hideRelationshipInstructions();
    clearRelationshipHighlights();
  }
}

/**
 * Handle clicking on a person in relationship mode
 */
function handleRelationshipSelection(member) {
  if (_selectedPeople.length === 0) {
    // First person selected
    _selectedPeople.push(member);
    highlightSelectedPerson(member.id);
    showRelationshipInstructions('请点击第二个人');
  } else if (_selectedPeople.length === 1) {
    // Second person selected
    if (_selectedPeople[0].id === member.id) {
      // Same person clicked twice - deselect
      _selectedPeople = [];
      clearRelationshipHighlights();
      showRelationshipInstructions('请点击第一个人');
      return;
    }
    
    _selectedPeople.push(member);
    highlightSelectedPerson(member.id);
    
    // Calculate and show relationship
    const relationship = calculateRelationship(_selectedPeople[0], _selectedPeople[1]);
    showRelationshipResult(relationship);
    
    // Reset for next calculation
    setTimeout(() => {
      _selectedPeople = [];
      clearRelationshipHighlights();
      showRelationshipInstructions('请点击第一个人');
    }, 100);
  }
}

/**
 * Calculate relationship between two people
 */
function calculateRelationship(person1, person2) {
  // Find path from person1 to person2
  const path = findRelationshipPath(person1, person2);
  
  if (!path) {
    return {
      relationship: '无血缘关系',
      path: `${person1.name} 和 ${person2.name} 没有发现血缘关系`,
      distance: -1
    };
  }
  
  // Simple relationship based on path length
  const distance = path.length - 1;
  let relationshipName = '';
  
  if (distance === 1) {
    if (isSpouse(person1, person2)) {
      relationshipName = '夫妻';
    } else if (isParentChild(person1, person2)) {
      relationshipName = '父子/母女';
    } else {
      relationshipName = '直系亲属';
    }
  } else if (distance === 2) {
    relationshipName = '2代亲属';
  } else if (distance === 3) {
    relationshipName = '3代亲属';
  } else if (distance === 4) {
    relationshipName = '4代亲属';
  } else {
    relationshipName = `${distance}代亲属`;
  }
  
  return {
    relationship: relationshipName,
    path: formatRelationshipPath(path),
    distance: distance,
    details: `相隔${distance}代的关系`
  };
}

/**
 * Find path between two people using BFS
 */
function findRelationshipPath(person1, person2) {
  if (person1.id === person2.id) return [person1];
  
  const visited = new Set();
  const queue = [[person1]];
  
  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];
    
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    
    // Get all connected people (parents, children, spouses)
    const connections = getConnectedPeople(current);
    
    for (const connected of connections) {
      if (connected.id === person2.id) {
        return [...path, connected];
      }
      
      if (!visited.has(connected.id)) {
        queue.push([...path, connected]);
      }
    }
  }
  
  return null; // No path found
}

/**
 * Get all people connected to a person (parents, children, spouses)
 */
function getConnectedPeople(person) {
  const connections = [];
  
  // Parents
  if (person.parentId) {
    const parent = _allMembers.find(m => m.id === person.parentId);
    if (parent) connections.push(parent);
  }
  if (person.secondaryParentId) {
    const parent = _allMembers.find(m => m.id === person.secondaryParentId);
    if (parent) connections.push(parent);
  }
  
  // Children
  const children = _allMembers.filter(m => m.parentId === person.id || m.secondaryParentId === person.id);
  connections.push(...children);
  
  // Spouses
  if (person.spouses && Array.isArray(person.spouses)) {
    person.spouses.forEach(spouseId => {
      const spouse = _allMembers.find(m => m.id === spouseId);
      if (spouse) connections.push(spouse);
    });
  }
  if (person.spouse) {
    const spouse = _allMembers.find(m => m.id === person.spouse);
    if (spouse) connections.push(spouse);
  }
  
  // Also check if this person is someone else's spouse
  _allMembers.forEach(member => {
    if (member.spouses && Array.isArray(member.spouses) && member.spouses.includes(person.id)) {
      connections.push(member);
    }
    if (member.spouse === person.id) {
      connections.push(member);
    }
  });
  
  return connections;
}

/**
 * Determine relationship type based on path - Chinese family titles
 */
function determineRelationshipType(path, person1, person2) {
  const pathLength = path.length - 1;
  
  // Direct spouse relationship
  if (pathLength === 1 && isSpouse(person1, person2)) {
    return { name: '夫妻', details: '配偶关系' };
  }
  
  // Parent-Child relationship (1 step)
  if (pathLength === 1 && isParentChild(person1, person2)) {
    const person1IsParent = isParent(person1, person2);
    if (person1IsParent) {
      // Person1 is parent
      if (person1.gender === 'male') {
        return { 
          name: person2.gender === 'male' ? '父子' : '父女', 
          details: `${person1.name}是${person2.name}的父亲` 
        };
      } else {
        return { 
          name: person2.gender === 'male' ? '母子' : '母女', 
          details: `${person1.name}是${person2.name}的母亲` 
        };
      }
    } else {
      // Person2 is parent
      if (person2.gender === 'male') {
        return { 
          name: person1.gender === 'male' ? '父子' : '父女', 
          details: `${person2.name}是${person1.name}的父亲` 
        };
      } else {
        return { 
          name: person1.gender === 'male' ? '母子' : '母女', 
          details: `${person2.name}是${person1.name}的母亲` 
        };
      }
    }
  }
  
  // Sibling relationship (2 steps - same parents)
  if (pathLength === 2 && haveSameParent(person1, person2)) {
    if (person1.gender === 'male' && person2.gender === 'male') {
      return { name: '兄弟', details: '同胞兄弟关系' };
    } else if (person1.gender === 'female' && person2.gender === 'female') {
      return { name: '姐妹', details: '同胞姐妹关系' };
    } else {
      return { name: '兄妹', details: '同胞兄妹关系' };
    }
  }
  
  // Grandparent/grandchild (2 steps - direct lineage)
  if (pathLength === 2 && isDirectLineage(path)) {
    const person1IsAncestor = isAncestorInPath(path, person1, person2);
    if (person1IsAncestor) {
      // Person1 is grandparent
      if (person1.gender === 'male') {
        return { 
          name: '祖孙', 
          details: `${person1.name}是${person2.name}的爷爷` 
        };
      } else {
        return { 
          name: '祖孙', 
          details: `${person1.name}是${person2.name}的奶奶` 
        };
      }
    } else {
      // Person2 is grandparent
      if (person2.gender === 'male') {
        return { 
          name: '祖孙', 
          details: `${person2.name}是${person1.name}的爷爷` 
        };
      } else {
        return { 
          name: '祖孙', 
          details: `${person2.name}是${person1.name}的奶奶` 
        };
      }
    }
  }
  
  // Uncle/Aunt - Nephew/Niece relationship (3 steps)
  if (pathLength === 3) {
    return analyzeUncleAuntRelationship(path, person1, person2);
  }
  
  // Cousin relationships (4 steps)
  if (pathLength === 4) {
    return analyzeCousinRelationship(path, person1, person2);
  }
  
  // Other relationships
  return analyzeComplexRelationship(path, person1, person2);
}

/**
 * Analyze uncle/aunt - nephew/niece relationships (3 steps)
 */
function analyzeUncleAuntRelationship(path, person1, person2) {
  // Determine who is elder by generation level
  const person1Generation = getGenerationLevel(person1);
  const person2Generation = getGenerationLevel(person2);
  
  if (person1Generation < person2Generation) {
    // Person1 is elder (uncle/aunt)
    if (person1.gender === 'male') {
      // Need to determine if 叔 or 伯 - for now use general term
      return {
        name: '叔侄',
        details: `${person1.name}是${person2.name}的叔叔/伯伯`
      };
    } else {
      return {
        name: '姑侄',
        details: `${person1.name}是${person2.name}的姑姑`
      };
    }
  } else {
    // Person2 is elder (uncle/aunt)
    if (person2.gender === 'male') {
      return {
        name: '叔侄',
        details: `${person2.name}是${person1.name}的叔叔/伯伯`
      };
    } else {
      return {
        name: '姑侄',
        details: `${person2.name}是${person1.name}的姑姑`
      };
    }
  }
}

/**
 * Analyze cousin relationships (4 steps)
 */
function analyzeCousinRelationship(path, person1, person2) {
  // Determine if 堂 (paternal) or 表 (maternal) relationship
  const relationshipType = determineCousinType(path, person1, person2);
  
  if (person1.gender === 'male' && person2.gender === 'male') {
    return { 
      name: `${relationshipType}兄弟`, 
      details: `${relationshipType}系兄弟关系` 
    };
  } else if (person1.gender === 'female' && person2.gender === 'female') {
    return { 
      name: `${relationshipType}姐妹`, 
      details: `${relationshipType}系姐妹关系` 
    };
  } else {
    return { 
      name: `${relationshipType}兄妹`, 
      details: `${relationshipType}系兄妹关系` 
    };
  }
}

/**
 * Determine if cousin relationship is 堂 or 表
 */
function determineCousinType(path, person1, person2) {
  // For now, use simple logic:
  // If both people's fathers are brothers -> 堂
  // Otherwise -> 表
  
  const person1Parent = _allMembers.find(m => m.id === person1.parentId);
  const person2Parent = _allMembers.find(m => m.id === person2.parentId);
  
  if (person1Parent && person2Parent) {
    // Check if both parents are male (fathers) and are siblings
    if (person1Parent.gender === 'male' && person2Parent.gender === 'male' && 
        haveSameParent(person1Parent, person2Parent)) {
      return '堂';
    }
  }
  
  return '表';
}

/**
 * Analyze complex relationships
 */
function analyzeComplexRelationship(path, person1, person2) {
  const pathLength = path.length - 1;
  
  if (pathLength <= 6) {
    return { 
      name: `${pathLength}代亲属`, 
      details: `相隔${pathLength}代的血缘关系` 
    };
  }
  
  return { name: '远房亲戚', details: '较远的血缘关系' };
}

/**
 * Helper functions for relationship determination
 */
function isSpouse(person1, person2) {
  return (person1.spouses && person1.spouses.includes(person2.id)) ||
         (person1.spouse === person2.id) ||
         (person2.spouses && person2.spouses.includes(person1.id)) ||
         (person2.spouse === person1.id);
}

function isParentChild(person1, person2) {
  return person1.parentId === person2.id || 
         person1.secondaryParentId === person2.id ||
         person2.parentId === person1.id || 
         person2.secondaryParentId === person1.id;
}

function isParent(person1, person2) {
  return person2.parentId === person1.id || person2.secondaryParentId === person1.id;
}

function haveSameParent(person1, person2) {
  return (person1.parentId && (person1.parentId === person2.parentId || person1.parentId === person2.secondaryParentId)) ||
         (person1.secondaryParentId && (person1.secondaryParentId === person2.parentId || person1.secondaryParentId === person2.secondaryParentId));
}

function isDirectLineage(path) {
  // Check if path goes directly up or down the family tree
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    if (!isParentChild(current, next)) {
      return false;
    }
  }
  return true;
}

function isAncestor(person1, person2) {
  return person2.parentId === person1.id || person2.secondaryParentId === person1.id;
}

function areCousins(path) {
  // Simplified cousin detection - path goes up then down
  const midPoint = Math.floor(path.length / 2);
  return path.length >= 4 && path.length % 2 === 0;
}

/**
 * Format relationship path for display
 */
function formatRelationshipPath(path) {
  if (path.length <= 1) return '';
  
  let pathStr = path[0].name;
  for (let i = 1; i < path.length; i++) {
    pathStr += ` → ${path[i].name}`;
  }
  return pathStr;
}

/**
 * Show relationship instructions
 */
function showRelationshipInstructions(text) {
  let instructions = document.getElementById('relationship-instructions');
  if (!instructions) {
    instructions = document.createElement('div');
    instructions.id = 'relationship-instructions';
    instructions.style.cssText = `
      position: fixed;
      top: 120px;
      left: 50%;
      transform: translateX(-50%);
      background: #3498db;
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(instructions);
  }
  instructions.textContent = text;
  instructions.style.display = 'block';
}

/**
 * Hide relationship instructions
 */
function hideRelationshipInstructions() {
  const instructions = document.getElementById('relationship-instructions');
  if (instructions) {
    instructions.style.display = 'none';
  }
}

/**
 * Highlight selected person
 */
function highlightSelectedPerson(personId) {
  // Add highlight class to the person's node
  const allNodes = document.querySelectorAll('.node, .spouse-node');
  allNodes.forEach(node => {
    const nodeData = d3.select(node).datum();
    if (nodeData && nodeData.data.id === personId) {
      node.classList.add('relationship-selected');
      // Add visual highlight
      const rect = node.querySelector('rect');
      if (rect) {
        rect.style.stroke = '#e74c3c';
        rect.style.strokeWidth = '4px';
      }
    }
  });
}

/**
 * Clear all relationship highlights
 */
function clearRelationshipHighlights() {
  const allNodes = document.querySelectorAll('.node, .spouse-node');
  allNodes.forEach(node => {
    node.classList.remove('relationship-selected');
    const rect = node.querySelector('rect');
    if (rect) {
      rect.style.stroke = '#fff';
      rect.style.strokeWidth = '2px';
    }
  });
}

/**
 * Show relationship result in modal
 */
function showRelationshipResult(result) {
  const modal = document.getElementById('relationship-modal');
  const content = document.getElementById('relationship-content');
  
  content.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h2 style="color: #2c3e50; margin-bottom: 10px;">${result.relationship}</h2>
      <p style="color: #7f8c8d; font-size: 0.9rem;">${result.details || ''}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <h4 style="margin-bottom: 8px; color: #2c3e50;">关系路径：</h4>
      <p style="font-family: monospace; color: #34495e; line-height: 1.6;">${result.path}</p>
    </div>
    
    ${result.distance >= 0 ? `<p style="color: #7f8c8d; font-size: 0.85rem;">相隔 ${result.distance} 代</p>` : ''}
  `;
  
  modal.classList.remove('hidden');
}

/**
 * Initialize relationship modal
 */
export function initRelationshipModal() {
  const closeBtn = document.getElementById('relationship-close');
  const okBtn = document.getElementById('relationship-ok');
  const modal = document.getElementById('relationship-modal');
  
  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (okBtn) okBtn.onclick = () => modal.classList.add('hidden');
}