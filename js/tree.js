// ── Config ────────────────────────────────────────────────────────────────────
const NODE_RADIUS   = 22;
const NODE_SPACING  = { x: 120, y: 160 };
let   showChinese   = true;

// ── Load data & render ────────────────────────────────────────────────────────
fetch('data/family.json')
  .then(r => r.json())
  .then(data => init(data))
  .catch(err => {
    document.getElementById('tree-container').innerHTML =
      `<p style="padding:40px;color:red">Failed to load family.json: ${err}</p>`;
  });

// ── Main init ─────────────────────────────────────────────────────────────────
function init(data) {
  const svg       = d3.select('#tree-svg');
  const group     = d3.select('#tree-group');
  const container = document.getElementById('tree-container');

  // D3 hierarchy
  const root = d3.hierarchy(data);

  // Tree layout
  const treeLayout = d3.tree()
    .nodeSize([NODE_SPACING.x, NODE_SPACING.y])
    .separation((a, b) => a.parent === b.parent ? 1.2 : 1.6);

  treeLayout(root);

  // ── Zoom & pan ──────────────────────────────────────────────────────────────
  const zoom = d3.zoom()
    .scaleExtent([0.1, 3])
    .on('zoom', e => group.attr('transform', e.transform));

  svg.call(zoom);

  // Center tree initially
  const w = container.clientWidth;
  const h = container.clientHeight;
  svg.call(zoom.transform, d3.zoomIdentity.translate(w / 2, 80).scale(0.8));

  // ── Draw links ──────────────────────────────────────────────────────────────
  group.selectAll('.link')
    .data(root.links())
    .join('path')
    .attr('class', 'link')
    .attr('d', d3.linkVertical()
      .x(d => d.x)
      .y(d => d.y)
    );

  // ── Draw nodes ──────────────────────────────────────────────────────────────
  const nodes = group.selectAll('.node')
    .data(root.descendants())
    .join('g')
    .attr('class', d => `node ${d.data.gender || 'unknown'}`)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .on('click', (event, d) => showDetail(d.data));

  nodes.append('circle').attr('r', NODE_RADIUS);

  // Name label
  nodes.append('text')
    .attr('class', 'name-label')
    .attr('dy', NODE_RADIUS + 14)
    .text(d => showChinese && d.data.chinese ? d.data.chinese : d.data.name);

  // Birth–death years
  nodes.append('text')
    .attr('class', 'year-label')
    .attr('dy', NODE_RADIUS + 26)
    .text(d => {
      const b = d.data.birth  || '?';
      const dd = d.data.death || '';
      return dd ? `${b}–${dd}` : b;
    });

  // ── Controls ────────────────────────────────────────────────────────────────
  document.getElementById('btn-zoom-in').onclick  = () => svg.transition().call(zoom.scaleBy, 1.3);
  document.getElementById('btn-zoom-out').onclick = () => svg.transition().call(zoom.scaleBy, 0.77);
  document.getElementById('btn-reset').onclick    = () =>
    svg.transition().call(zoom.transform, d3.zoomIdentity.translate(w / 2, 80).scale(0.8));

  document.getElementById('btn-toggle-lang').onclick = () => {
    showChinese = !showChinese;
    nodes.selectAll('text.name-label')
      .text(d => showChinese && d.data.chinese ? d.data.chinese : d.data.name);
  };

  // ── Search ──────────────────────────────────────────────────────────────────
  function doSearch() {
    const q = document.getElementById('search-input').value.trim().toLowerCase();
    nodes.classed('highlighted', false);
    if (!q) return;

    const matched = nodes.filter(d =>
      d.data.name.toLowerCase().includes(q) ||
      (d.data.chinese && d.data.chinese.includes(q))
    );

    matched.classed('highlighted', true);

    // Pan to first match
    if (!matched.empty()) {
      const d = matched.datum();
      const currentTransform = d3.zoomTransform(svg.node());
      const scale = currentTransform.k;
      svg.transition().duration(600).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(w / 2 - d.x * scale, h / 2 - d.y * scale)
          .scale(scale)
      );
    }
  }

  document.getElementById('search-btn').onclick = doSearch;
  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function showDetail(d) {
  const panel   = document.getElementById('detail-panel');
  const content = document.getElementById('detail-content');

  const gender  = d.gender === 'male' ? '♂ Male' : d.gender === 'female' ? '♀ Female' : '—';
  const birth   = d.birth  || '—';
  const death   = d.death  || 'Living';
  const spouse  = d.spouse || '—';
  const notes   = d.notes  || '—';

  content.innerHTML = `
    <h2>${d.name}</h2>
    ${d.chinese ? `<div class="chinese-name">${d.chinese}</div>` : ''}
    <table>
      <tr><td>Gender</td><td>${gender}</td></tr>
      <tr><td>Born</td><td>${birth}</td></tr>
      <tr><td>Died</td><td>${death}</td></tr>
      <tr><td>Spouse</td><td>${spouse}</td></tr>
      <tr><td>Notes</td><td>${notes}</td></tr>
    </table>
  `;

  panel.classList.remove('hidden');
}

document.getElementById('detail-close').onclick = () => {
  document.getElementById('detail-panel').classList.add('hidden');
};
