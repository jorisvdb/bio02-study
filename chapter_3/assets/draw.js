/* Tiny SVG drawing helpers for the molecular biology study pages.
 *
 * Usage in HTML:
 *   <div class="mol"    data-spec='{...}'></div>   molecule from atoms + bonds
 *   <div class="atom"   data-spec='{...}'></div>   atom with electron shells
 *   <div class="lipids" data-spec='{...}'></div>   lipid schematic
 *
 * Molecule spec:
 *   { w, h,
 *     atoms: [{id, x, y, label, cls, charge, partial:{text,dx,dy}}],   label "" = bare vertex
 *     bonds: [{a, b, order, style}],   style: "wedge" | "dash" | "hbond"
 *     boxes: [{x, y, w, h, cls, label}],
 *     dots:  [{x, y}],                 electron dots
 *     paths: [{d, cls, arrow}],
 *     texts: [{x, y, text, cls}] }
 *
 * Atom spec:
 *   { sym, p, n, shells:[2,4], cap:[2,8], w, h, title }
 *
 * Lipid spec:
 *   { mode: "single" | "bilayer" | "micelle", w, h }
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(parent, x, y, str, cls) {
    var t = el('text', { x: x, y: y, 'class': cls || 'txt' }, parent);
    t.textContent = str;
    return t;
  }
  function svgRoot(w, h) {
    var svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, 'class': 'molsvg' });
    var id = 'arr' + (++uid);
    var defs = el('defs', {}, svg);
    var m = el('marker', { id: id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', 'class': 'arrowhead' }, m);
    svg._arrow = 'url(#' + id + ')';
    return svg;
  }
  function labelRadius(a) {
    if (a.r) return a.r;
    if (!a.label) return 0;
    var n = a.label.replace(/[₀-₉⁺⁻]/g, '').length;
    return n <= 1 ? 11 : 4.2 * a.label.length + 5;
  }

  /* ---------- molecule ---------- */
  function renderMol(container, s) {
    var svg = svgRoot(s.w || 300, s.h || 160);
    var byId = {};
    (s.atoms || []).forEach(function (a) { byId[a.id] = a; });

    (s.boxes || []).forEach(function (b) {
      el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 7, 'class': 'box ' + (b.cls || '') }, svg);
      if (b.label) text(svg, b.x + b.w / 2, b.y + b.h + 14, b.label, 'boxlabel');
    });

    (s.bonds || []).forEach(function (b) {
      var a1 = byId[b.a], a2 = byId[b.b];
      if (!a1 || !a2) return;
      var r1 = labelRadius(a1), r2 = labelRadius(a2);
      var dx = a2.x - a1.x, dy = a2.y - a1.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      var x1 = a1.x + ux * r1, y1 = a1.y + uy * r1, x2 = a2.x - ux * r2, y2 = a2.y - uy * r2;
      if (b.style === 'wedge') {
        var px = -uy * 4, py = ux * 4;
        el('path', { d: 'M' + x1 + ',' + y1 + ' L' + (x2 + px) + ',' + (y2 + py) + ' L' + (x2 - px) + ',' + (y2 - py) + ' z', 'class': 'wedge' }, svg);
        return;
      }
      if (b.style === 'dash' || b.style === 'hbond') {
        el('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'class': 'bond ' + b.style }, svg);
        return;
      }
      var order = b.order || 1, gap = 3.6;
      for (var i = 0; i < order; i++) {
        var o = (i - (order - 1) / 2) * gap;
        el('line', { x1: x1 - uy * o, y1: y1 + ux * o, x2: x2 - uy * o, y2: y2 + ux * o, 'class': 'bond' }, svg);
      }
    });

    (s.atoms || []).forEach(function (a) {
      if (!a.label) return;
      var cls = a.cls || a.label.replace(/[^A-Za-z]/g, '').slice(0, 1).toLowerCase();
      if (a.label.length > 1 && !a.cls) cls += ' grp';
      var g = el('g', { 'class': 'atom ' + cls }, svg);
      var r = labelRadius(a);
      if (a.label.length <= 1) el('circle', { cx: a.x, cy: a.y, r: r, 'class': 'atombg' }, g);
      else el('rect', { x: a.x - r, y: a.y - 10, width: 2 * r, height: 20, rx: 5, 'class': 'atombg' }, g);
      text(g, a.x, a.y + 5, a.label, 'atomlabel');
      if (a.charge) text(g, a.x + r + 1, a.y - 8, a.charge, 'charge');
      if (a.partial) text(g, a.x + (a.partial.dx || 0), a.y + (a.partial.dy === undefined ? -18 : a.partial.dy), a.partial.text, 'partial');
    });

    (s.dots || []).forEach(function (d) { el('circle', { cx: d.x, cy: d.y, r: 2.3, 'class': 'edot' }, svg); });
    (s.paths || []).forEach(function (p) {
      el('path', { d: p.d, 'class': 'path ' + (p.cls || ''), 'marker-end': p.arrow ? svg._arrow : null }, svg);
    });
    (s.texts || []).forEach(function (t) { text(svg, t.x, t.y, t.text, 'txt ' + (t.cls || '')); });
    container.appendChild(svg);
  }

  /* ---------- atom with shells ---------- */
  function renderAtom(container, s) {
    var w = s.w || 150, h = s.h || 150, cx = w / 2, cy = h / 2 - 6;
    var svg = svgRoot(w, h);
    var radii = [22, 40, 58];
    el('circle', { cx: cx, cy: cy, r: 13, 'class': 'nucleus' }, svg);
    text(svg, cx, cy + 4, s.sym, 'nuctext');
    var shells = s.shells || [], cap = s.cap || [];
    shells.forEach(function (n, i) {
      var r = radii[i];
      el('circle', { cx: cx, cy: cy, r: r, 'class': 'shell' }, svg);
      var slots = cap[i] || n;
      for (var k = 0; k < slots; k++) {
        var ang = -Math.PI / 2 + (2 * Math.PI * k) / slots;
        var x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
        if (k < n) el('circle', { cx: x, cy: y, r: 3, 'class': 'edot' }, svg);
        else el('circle', { cx: x, cy: y, r: 3, 'class': 'eslot' }, svg);
      }
    });
    if (s.title) text(svg, cx, h - 4, s.title, 'txt muted');
    container.appendChild(svg);
  }

  /* ---------- lipids ---------- */
  function tailPath(x, y, dx, dy, len, phase) {
    // wavy line from (x,y) in direction (dx,dy) of given length
    var d = 'M' + x + ',' + y, nx = -dy, ny = dx, seg = 6;
    for (var i = 1; i <= len / seg; i++) {
      var t = i * seg, wob = Math.sin(t / 5 + (phase || 0)) * 2.2;
      d += ' L' + (x + dx * t + nx * wob) + ',' + (y + dy * t + ny * wob);
    }
    return d;
  }
  function lipid(svg, x, y, dx, dy, len) {
    // head at (x,y), tails pointing along (dx,dy)
    var nx = -dy, ny = dx;
    el('path', { d: tailPath(x + nx * 4 + dx * 9, y + ny * 4 + dy * 9, dx, dy, len, 0), 'class': 'lipid-tail' }, svg);
    el('path', { d: tailPath(x - nx * 4 + dx * 9, y - ny * 4 + dy * 9, dx, dy, len, 1.5), 'class': 'lipid-tail' }, svg);
    el('circle', { cx: x, cy: y, r: 9, 'class': 'lipid-head' }, svg);
  }
  function renderLipids(container, s) {
    var mode = s.mode || 'single';
    var w, h, svg;
    if (mode === 'single') {
      w = s.w || 120; h = s.h || 110; svg = svgRoot(w, h);
      lipid(svg, w / 2, 20, 0, 1, 60);
      text(svg, w / 2, 14 - 8, 'head', 'txt muted');
      text(svg, w / 2, h - 4, 'tails', 'txt muted');
    } else if (mode === 'bilayer') {
      w = s.w || 320; h = s.h || 170; svg = svgRoot(w, h);
      el('rect', { x: 0, y: 0, width: w, height: 26, 'class': 'water' }, svg);
      el('rect', { x: 0, y: h - 26, width: w, height: 26, 'class': 'water' }, svg);
      text(svg, w / 2, 17, 'water (outside)', 'waterlabel');
      text(svg, w / 2, h - 9, 'water (inside)', 'waterlabel');
      for (var x = 22; x < w; x += 24) {
        lipid(svg, x, 40, 0, 1, 42);
        lipid(svg, x, h - 40, 0, -1, 42);
      }
    } else if (mode === 'micelle') {
      w = s.w || 190; h = s.h || 190; svg = svgRoot(w, h);
      el('rect', { x: 0, y: 0, width: w, height: h, rx: 10, 'class': 'water' }, svg);
      text(svg, w / 2, 14, 'water all around', 'waterlabel');
      var cx = w / 2, cy = h / 2 + 4, R = 68, N = 16;
      for (var k = 0; k < N; k++) {
        var ang = (2 * Math.PI * k) / N, dx = -Math.cos(ang), dy = -Math.sin(ang);
        lipid(svg, cx + R * Math.cos(ang), cy + R * Math.sin(ang), dx, dy, 44);
      }
    }
    container.appendChild(svg);
  }

  function init() {
    document.querySelectorAll('.mol[data-spec]').forEach(function (d) { renderMol(d, JSON.parse(d.getAttribute('data-spec'))); });
    document.querySelectorAll('.atom[data-spec]').forEach(function (d) { renderAtom(d, JSON.parse(d.getAttribute('data-spec'))); });
    document.querySelectorAll('.lipids[data-spec]').forEach(function (d) { renderLipids(d, JSON.parse(d.getAttribute('data-spec'))); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.MolDraw = { renderMol: renderMol, renderAtom: renderAtom, renderLipids: renderLipids };
})();
