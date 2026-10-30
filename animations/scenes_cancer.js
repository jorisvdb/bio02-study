/* Scenes for cancer.html: #ev = how a cancer evolves (chapter 2, part 1), #gen = oncogene versus tumor suppressor (chapter 2, part 2).
   Needs player.js. Every drawing is a group with an id; layout() switches groups on and off (vis) and moves a few of them. */
(function () {
  'use strict';
  var A = window.Anim, el = A.el, txt = A.txt;

  /* ---------- tiny drawing helpers ---------- */
  function grp(svg, o, id, cls) { return o[id] = el('g', cls ? { 'class': cls } : {}, svg); }
  function rect(g, x, y, w, h, cls, rx) { return el('rect', { x: x, y: y, width: w, height: h, rx: rx == null ? 6 : rx, 'class': cls || '' }, g); }
  function circ(g, cx, cy, r, cls) { return el('circle', { cx: cx, cy: cy, r: r, 'class': cls || '' }, g); }
  function line(g, x1, y1, x2, y2, cls) { return el('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'class': cls || '' }, g); }
  function path(g, d, cls) { return el('path', { d: d, 'class': cls || '' }, g); }
  function T(g, x, y, s, cls, anchor) { return txt(g, x, y, cls || 'lbl', s, anchor || 'middle'); }
  function arrow(g, x1, y1, x2, y2, cls, mk) { return el('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2, 'class': cls || 'arr', 'marker-end': 'url(#' + mk + ')' }, g); }
  function marker(svg, id, cls) {
    var d = el('defs', {}, svg);
    var m = el('marker', { id: id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, d);
    el('path', { d: 'M0 0L10 5L0 10z', 'class': cls || 'arrh' }, m);
  }
  function box(g, x, y, w, h, lines, cls, tcls) {
    rect(g, x, y, w, h, cls || 'tbox', 8);
    var n = lines.length, y0 = y + h / 2 - (n - 1) * 8 + 4;
    lines.forEach(function (s, i) { T(g, x + w / 2, y0 + i * 16, s, tcls || 'sm'); });
  }
  function cellsAt(g, pts, r, cls) { pts.forEach(function (p) { circ(g, p[0], p[1], r, cls); circ(g, p[0] - 2, p[1] - 1, r * 0.38, 'nuc'); }); }
  function base(O) { var st = {}; for (var id in O) st[id] = { x: 0, y: 0, o: 0 }; return st; }
  function on(st, O, list, p) {
    p = p || {};
    list.split(',').forEach(function (id) { id = id.trim(); if (!id || !O[id]) return; st[id] = { x: p.x || 0, y: p.y || 0, s: p.s == null ? 1 : p.s, o: 1, c: p.c || '' }; });
  }

  /* =================================================================
     Scene 1: how a cancer evolves
     ================================================================= */
  var Oev = {};
  var EPX = []; for (var i = 0; i < 12; i++) EPX.push(60 + i * 56);
  var CL1 = [[352, 116], [376, 116], [364, 96]];
  var CL2 = [[328, 116], [400, 116], [340, 96], [388, 96], [352, 76], [376, 76], [364, 56]];
  var SUB2 = [[376, 116], [388, 96], [400, 116]];
  var SUB3 = [[352, 76], [364, 56], [340, 96]];
  var INV = [[364, 206], [350, 228], [380, 232], [366, 254]];
  var CNT = {
    s0: ['hits: 0', 'years: 0', 'cells in the clone: 0'],
    s1: ['hits: 1', 'years: 0', 'cells in the clone: 1'],
    s2: ['hits: 1', 'years: 2', 'cells in the clone: about 100'],
    s3: ['hits: 1', 'years: 5', 'cells: about 1 000 000 (10⁶)'],
    s4: ['hits: 2', 'years: 8', 'cells: about 10 000 000 (10⁷)'],
    s5: ['hits: 3', 'years: 15', 'cells: 10⁹ = a billion, just palpable'],
    s6: ['hits: 3 and more', 'years: 18', 'cells: 10¹⁰, several subclones'],
    s7: ['hits: many', 'years: 20', 'cells: 10¹¹, plus a metastasis']
  };
  var sceneEv = {
    VW: 1000, VH: 440, NW: 760, aria: 'Animation of how a cancer evolves from one cell',
    legend: [['--ep', 'normal epithelial cell'], ['--tum1', 'first clone (hit 1)'], ['--tum2', 'subclone with hit 2'], ['--tum3', 'subclone with hit 3: invasive'],
      ['--lam', 'basal lamina'], ['--vesc', 'blood vessel'], ['--fib', 'fibroblast (stroma)'], ['--imm', 'immune cell']],
    build: function (svg) {
      var o = Oev = {}, g;
      marker(svg, 'arr_ev', 'arrh');
      txt(svg, 988, 432, 'wm', 'simplified, not to scale', 'end');
      // tissue background
      g = grp(svg, o, 'bg');
      rect(g, 40, 192, 720, 108, 'ct', 0);
      line(g, 40, 192, 760, 192, 'lam');
      T(g, 760, 132, 'epithelium: a sheet of cells (the lining of a gut, a skin, a gland)', 'sm', 'end');
      T(g, 44, 212, 'basal lamina: the thin mat the sheet sits on', 'sm', 'start');
      T(g, 44, 286, 'connective tissue: support tissue with fibres and vessels', 'sm', 'start');
      // blood vessel
      g = grp(svg, o, 'vessel');
      rect(g, 40, 300, 945, 44, 'ves', 10); rect(g, 46, 306, 933, 32, 'blood', 8);
      T(g, 44, 362, 'blood vessel (the blood flows to the right →)', 'sm', 'start');
      // distant organ
      g = grp(svg, o, 'organ');
      rect(g, 800, 120, 185, 160, 'organ', 14); rect(g, 870, 278, 22, 24, 'ves', 4);
      T(g, 892, 110, 'a distant organ (for example the liver)', 'sm');
      // the gap in the basal lamina (drawn later, so it covers the lamina line)
      // epithelium cells
      g = grp(svg, o, 'epi');
      EPX.forEach(function (x) { rect(g, x, 140, 46, 50, 'ep', 10); circ(g, x + 23, 165, 7, 'nuc'); });
      g = grp(svg, o, 'gap'); rect(g, 344, 188, 40, 8, 'ct', 0);
      // mutant cell in slot 5
      g = grp(svg, o, 'm0'); rect(g, 340, 140, 46, 50, 'ep mut', 10); circ(g, 363, 165, 7, 'nuc');
      g = grp(svg, o, 'flash'); circ(g, 0, 0, 34, 'flash');
      // social controls
      g = grp(svg, o, 'sig');
      [[150, 108], [200, 102], [250, 110]].forEach(function (p) { circ(g, p[0], p[1], 5, 'gf'); });
      T(g, 44, 92, 'growth factors: small signal proteins that say "divide"', 'lbl', 'start');
      [[560, 108], [610, 102], [660, 110]].forEach(function (p) { rect(g, p[0] - 5, p[1] - 5, 10, 10, 'stopsig', 2); });
      T(g, 480, 92, 'growth-inhibiting signals: "stop", "stay in place", "die if damaged"', 'lbl', 'start');
      T(g, 44, 60, 'balance: a cell divides only when its neighbours allow it, and dies when it is damaged', 'lbl', 'start');
      // counters (top right)
      for (var k in CNT) {
        g = grp(svg, o, 'cnt_' + k);
        CNT[k].forEach(function (s, i) { T(g, 990, 26 + i * 18, s, i === 0 ? 'lbl' : 'sm', 'end'); });
      }
      // clone groups
      g = grp(svg, o, 'cl1'); cellsAt(g, CL1, 11, 'tum1');
      g = grp(svg, o, 'cl2'); cellsAt(g, CL2, 11, 'tum1');
      g = grp(svg, o, 'lbenign'); T(g, 364, 36, 'benign tumour: a lump that stays above the basal lamina', 'lbl');
      g = grp(svg, o, 'sub2'); cellsAt(g, SUB2, 11, 'tum2');
      g = grp(svg, o, 'sub3'); cellsAt(g, SUB3, 11, 'tum3');
      g = grp(svg, o, 'inv'); cellsAt(g, INV, 11, 'tum3');
      g = grp(svg, o, 'linv'); T(g, 470, 232, '← cells break through the basal lamina: malignant', 'lbl', 'start');
      g = grp(svg, o, 'lhet'); T(g, 470, 70, 'several subclones compete: the tumour is a mixture', 'lbl', 'start'); T(g, 470, 88, '(heterogeneity); the fittest subclone takes over for a while', 'sm', 'start');
      // genetic instability inset
      g = grp(svg, o, 'inset');
      rect(g, 14, 8, 236, 118, 'inset', 10);
      T(g, 132, 26, 'genetic instability', 'lbl');
      var cols = ['#e07a3f', '#4a7fb5', '#2fa37a', '#8e6cc0', '#e3a33b', '#d1342f'];
      cols.forEach(function (c, i) { el('rect', { x: 30 + i * 30, y: 38, width: 28, height: 14, fill: c }, g); T(g, 44 + i * 30, 49, String(i + 1), 'sm w'); });
      T(g, 220, 49, 'order', 'sm', 'start');
      T(g, 132, 70, 'shatters in a micronucleus (chromothripsis) ↓', 'sm');
      [2, 0, 4, 1, 5].forEach(function (k, i) { el('rect', { x: 30 + i * 30, y: 82, width: 28, height: 14, fill: cols[k] }, g); T(g, 44 + i * 30, 93, String(k + 1), 'sm w'); });
      T(g, 132, 116, 'reglued in random order, piece 4 lost', 'sm');
      // stroma and vessels
      g = grp(svg, o, 'strom');
      [[292, 252], [448, 246], [236, 272]].forEach(function (p) { el('ellipse', { cx: p[0], cy: p[1], rx: 22, ry: 7, 'class': 'fib', transform: 'rotate(-20 ' + p[0] + ' ' + p[1] + ')' }, g); });
      T(g, 300, 290, 'fibroblasts: the tumour recruits support cells (stroma)', 'sm');
      circ(g, 600, 244, 14, 'imm'); T(g, 600, 248, 'T', 'sm w'); T(g, 625, 248, 'immune cell: switched off by the tumour', 'sm', 'start');
      g = grp(svg, o, 'angio');
      path(g, 'M330 300 C 326 270 338 250 340 214', 'angio'); path(g, 'M410 300 C 416 272 402 248 396 214', 'angio');
      T(g, 480, 262, 'new blood vessels grow into the tumour (angiogenesis):', 'sm', 'start'); T(g, 480, 278, 'oxygen and food for the hypoxic (oxygen-poor) interior', 'sm', 'start');
      // circulating tumour cells
      g = grp(svg, o, 'ctcA'); circ(g, 0, 0, 11, 'tum3'); circ(g, -2, -1, 4, 'nuc');
      g = grp(svg, o, 'ctcB'); circ(g, 0, 0, 11, 'dead'); line(g, -6, -6, 6, 6, 'x'); line(g, -6, 6, 6, -6, 'x');
      g = grp(svg, o, 'ctcC'); circ(g, 0, 0, 11, 'dead'); line(g, -6, -6, 6, 6, 'x'); line(g, -6, 6, 6, -6, 'x');
      g = grp(svg, o, 'lctc'); T(g, 520, 384, 'circulating tumour cells: fewer than 1 in 1000 is still alive after 24 hours', 'lbl');
      g = grp(svg, o, 'lenter'); T(g, 400, 384, 'a cell squeezes through the vessel wall into the blood (or into a lymph vessel)', 'lbl');
      g = grp(svg, o, 'micro'); cellsAt(g, [[880, 256], [866, 240], [894, 240]], 8, 'tum3'); T(g, 892, 146, 'micrometastasis', 'lbl');
      g = grp(svg, o, 'meta'); cellsAt(g, [[880, 256], [866, 240], [894, 240], [852, 222], [880, 222], [908, 222], [866, 204], [894, 204], [880, 186]], 8, 'tum3'); T(g, 892, 146, 'metastasis:', 'lbl'); T(g, 892, 162, 'fewer than 1 in 1000 of the survivors', 'sm');
      g = grp(svg, o, 'lexit'); T(g, 880, 90, 'one cell sticks to the wall, crawls out, and starts dividing', 'sm');
      // hallmarks
      g = grp(svg, o, 'hall');
      box(g, 60, 14, 236, 40, ['1 · makes its own growth signals'], 'hbox', 'lbl');
      box(g, 316, 14, 236, 40, ['2 · ignores stop signals'], 'hbox', 'lbl');
      box(g, 572, 14, 236, 40, ['3 · escapes apoptosis (cell suicide)'], 'hbox', 'lbl');
      box(g, 60, 388, 236, 40, ['4 · divides without limit (telomeres)'], 'hbox', 'lbl');
      box(g, 316, 388, 236, 40, ['5 · attracts blood vessels'], 'hbox', 'lbl');
      box(g, 572, 388, 236, 40, ['6 · invades and spreads (metastasis)'], 'hbox', 'lbl');
      T(g, 896, 364, '+ 2022: altered metabolism,', 'sm'); T(g, 896, 380, 'escapes the immune system', 'sm');
      return o;
    },
    init: { vis: 'bg,vessel,organ,epi,cnt_s0', fl: 0, fx: 363, fy: 165, ax: 400, ay: 322, bx: 520, by: 322, cx: 600, cy: 330, cam: 500 },
    layout: function (P) {
      var st = base(Oev);
      on(st, Oev, P.vis);
      st.flash = { x: P.fx, y: P.fy, s: P.fl ? 1 : 0.2, o: P.fl ? 1 : 0 };
      if (P.vis.indexOf('ctcA') >= 0) st.ctcA = { x: P.ax, y: P.ay, o: 1 };
      if (P.vis.indexOf('ctcB') >= 0) st.ctcB = { x: P.bx, y: P.by, o: 1 };
      if (P.vis.indexOf('ctcC') >= 0) st.ctcC = { x: P.cx, y: P.cy, o: 1 };
      st._cam = { x: P.cam };
      return st;
    },
    steps: [
      { title: 'Begin state: a healthy tissue',
        en: 'This is a slice through a tissue. On top lies the <b>epithelium</b> (a sheet of cells, like the lining of the gut), sitting on the <b>basal lamina</b> (a thin mat of protein). Below is <b>connective tissue</b> with a <b>blood vessel</b>. Most cancers (85 %) start in an epithelium, because its cells divide the most.',
        nl: 'Een doorsnede van een weefsel: bovenaan het epitheel (een laag cellen), daaronder de basale lamina (dun matje) en bindweefsel met een bloedvat. De meeste kankers (85 %) beginnen in een epitheel.',
        f: [{ vis: 'bg,vessel,organ,epi,cnt_s0' }] },
      { title: 'The social controls',
        en: 'The body works like a society: a cell may only divide when its neighbours send <b>growth factors</b> ("divide"), and it must stop or even kill itself (<b>apoptosis</b>) when it gets "stop" signals or is damaged. Goal of the body: keep the number of cells in balance. A cancer cell breaks these rules: it wants to divide without permission.',
        nl: 'Cellen zijn een samenleving: delen alleen als de buren groeifactoren sturen, stoppen of sterven (apoptose) bij stop-signalen of schade. Doel: evenwicht. Een kankercel breekt die regels.',
        f: [{ vis: 'bg,vessel,organ,epi,sig,cnt_s0' }] },
      { title: 'Hit 1: one cell gets a mutation',
        en: 'In a body of 10¹³ cells, billions of cells get a <b>mutation</b> (a change in the DNA) every day. Most are harmless. But this one gives the cell a small advantage: it divides a little more easily than its neighbours. The mutation is passed on to all its daughters: it is <b>heritable</b>.',
        nl: 'Miljarden cellen krijgen elke dag een mutatie. Deze ene geeft de cel een klein voordeel: ze deelt iets makkelijker. De dochters erven de mutatie.',
        f: [{ vis: 'bg,vessel,organ,epi,m0,cnt_s1', fl: 1 }, { fl: 0 }] },
      { title: 'A clone grows',
        en: 'Its descendants all carry the same mutation: together they are a <b>clone</b> (a family of identical cells from one founder). They pile up a little because they divide more than they die. Nothing can be seen yet.',
        nl: 'De nakomelingen dragen dezelfde mutatie: een kloon. Ze stapelen zich wat op, want ze delen meer dan ze sterven. Nog niets te zien.',
        f: [{ vis: 'bg,vessel,organ,epi,m0,cl1,cnt_s2' }] },
      { title: 'A benign tumour',
        en: 'After years the clone is a lump of about a million cells: a <b>tumour</b> or neoplasm ("new growth"). It still sits above the basal lamina and does not invade: it is <b>benign</b> (goedaardig). Cutting it out usually cures it completely. A breast tumour doubles about every 100 days.',
        nl: 'Na jaren is de kloon een gezwel (tumor) van een miljoen cellen, nog boven de basale lamina: goedaardig. Wegsnijden geneest meestal.',
        f: [{ vis: 'bg,vessel,organ,epi,m0,cl1,cl2,lbenign,cnt_s3' }] },
      { title: 'Hit 2: selection inside the tumour',
        en: 'One mutation is never enough (Knudson: several <b>hits</b> are needed). Life inside the lump is harsh: little oxygen, few nutrients, neighbours in the way. A cell that gets a second useful mutation thrives better than the others and its family (a <b>subclone</b>) takes over. The bigger the tumour, the more cells that can get the next hit, so progression speeds up.',
        nl: 'Eén mutatie is nooit genoeg (Knudson: meerdere hits). Binnenin is het hard: weinig zuurstof en voedsel. Een cel met een tweede nuttige mutatie wint; haar subkloon neemt het over.',
        f: [{ vis: 'bg,vessel,organ,epi,m0,cl1,cl2,cnt_s3', fl: 1, fx: 388, fy: 96 }, { vis: 'bg,vessel,organ,epi,m0,cl1,cl2,sub2,cnt_s4', fl: 0 }] },
      { title: 'Genetic instability speeds things up',
        en: 'Most cancer cells also lose the machinery that keeps DNA tidy: they become <b>genetically unstable</b>. Chromosomes are mis-sorted at division, a lost chromosome can end up in a <b>micronucleus</b> where it shatters and is reglued in random order (<b>chromothripsis</b>). More random changes per division means faster evolution, so instability is itself selected for.',
        nl: 'Kankercellen worden genetisch instabiel: chromosomen raken verkeerd verdeeld, een los chromosoom in een micronucleus versplintert en wordt willekeurig gelijmd (chromothripsis). Meer toeval per deling = snellere evolutie.',
        f: [{ vis: 'bg,vessel,organ,epi,m0,cl1,cl2,sub2,inset,cnt_s4' }] },
      { title: 'Hit 3: invasion, the tumour becomes malignant',
        en: 'A third hit lets cells let go of their neighbours and break through the basal lamina into the connective tissue. Now the tumour is <b>malignant</b> (kwaadaardig): a true cancer. After 10 to 20 years it holds about a billion cells (10⁹) and can just be felt; a mass of 10⁸ cells is visible on an x-ray.',
        nl: 'Een derde hit laat cellen door de basale lamina breken: de tumor is nu kwaadaardig, echte kanker. Na 10 tot 20 jaar ongeveer een miljard cellen: net voelbaar.',
        f: [{ vis: 'bg,vessel,organ,epi,m0,cl1,cl2,sub2,inset,cnt_s4', fl: 1, fx: 364, fy: 206 }, { vis: 'bg,vessel,organ,epi,gap,m0,cl1,cl2,sub2,inv,linv,inset,cnt_s5', fl: 0 }] },
      { title: 'Many subclones: the tumour is a mixture',
        en: 'Evolution keeps going: new mutations create new <b>subclones</b> (orange, purple, red) that coexist or replace each other, like species. This <b>heterogeneity</b> (mixedness) is why cancers are hard to cure: a treatment that kills one subclone can leave another one alive.',
        nl: 'Nieuwe mutaties geven nieuwe subklonen die naast elkaar leven of elkaar verdringen. Die mengeling (heterogeniteit) maakt genezen moeilijk: één behandeling mist vaak een subkloon.',
        f: [{ vis: 'bg,vessel,organ,epi,gap,m0,cl1,cl2,sub2,sub3,inv,lhet,cnt_s6' }] },
      { title: 'The tumour rebuilds its neighbourhood',
        en: 'The cancer cells talk to the normal cells around them, the <b>stroma</b>: they attract <b>fibroblasts</b> (support cells that make fibres), make blood vessels leaky, and call in new vessels (<b>angiogenesis</b>) because the inside of the lump is <b>hypoxic</b> (short of oxygen). They also switch off the <b>immune cells</b> that could kill them. The tumour behaves like a wound that never heals.',
        nl: 'De kankercellen sturen de omgeving (stroma): ze lokken fibroblasten, laten nieuwe bloedvaten groeien (angiogenese) want binnenin is zuurstoftekort, en schakelen immuuncellen uit. Een wonde die nooit geneest.',
        f: [{ vis: 'bg,vessel,organ,epi,gap,m0,cl1,cl2,sub2,sub3,inv,strom,angio,cnt_s6' }] },
      { title: 'Metastasis step 1: into a vessel',
        en: 'To kill, a cancer must spread: <b>metastasis</b> causes 90 % of cancer deaths. First a cell squeezes through the wall of a blood vessel, or more often of a <b>lymph vessel</b> (the thin-walled drainage tubes that empty into the blood). In lymph vessels small clumps can pass; clumps get stuck in <b>lymph nodes</b> and grow there.',
        nl: 'Uitzaaiing (metastase) veroorzaakt 90 % van de kankersterfte. Eerst kruipt een cel door de wand van een bloedvat of, vaker, een lymfevat; klompjes blijven in lymfeklieren hangen.',
        f: [{ vis: 'bg,vessel,organ,epi,gap,m0,cl1,cl2,sub2,sub3,inv,angio,lenter,cnt_s6,ctcA', ax: 392, ay: 290 }, { ax: 410, ay: 322 }] },
      { title: 'Metastasis step 2: the journey',
        en: 'In the blood the cell is a <b>circulating tumour cell</b>. The trip is deadly: fewer than 1 in 1000 cells is still alive after 24 hours. The survivors get stuck in small vessels of another organ.',
        nl: 'In het bloed is het een circulerende tumorcel. Minder dan 1 op 1000 overleeft 24 uur. De overlevers blijven steken in de kleine vaatjes van een ander orgaan.',
        f: [{ vis: 'bg,vessel,organ,epi,gap,m0,cl1,cl2,sub2,sub3,inv,angio,lctc,cnt_s6,ctcA,ctcB,ctcC', ax: 700, ay: 322, bx: 500, by: 318, cx: 580, cy: 328 }] },
      { title: 'Metastasis step 3: colonizing a distant organ',
        en: 'One cell sticks to the vessel wall, crawls out and starts a tiny colony of ten to a few thousand cells: a <b>micrometastasis</b>. Most of these die or stay dormant (sleeping) for years. Colonizing a foreign organ is the hardest step: fewer than 1 in 1000 of the survivors (less than 0.1 %) grows into a full <b>metastasis</b>.',
        nl: 'Eén cel plakt aan de vaatwand, kruipt eruit en vormt een micrometastase van tien tot duizend cellen. De meeste sterven of slapen jaren. Minder dan 0,1 % wordt een echte uitzaaiing.',
        f: [{ vis: 'bg,vessel,organ,epi,gap,m0,cl1,cl2,sub2,sub3,inv,angio,cnt_s6,ctcA', ax: 880, ay: 296 }, { vis: 'bg,vessel,organ,epi,gap,m0,cl1,cl2,sub2,sub3,inv,angio,lexit,micro,cnt_s6' }, { vis: 'bg,vessel,organ,epi,gap,m0,cl1,cl2,sub2,sub3,inv,angio,meta,cnt_s7' }] },
      { title: 'The hallmarks of cancer',
        en: 'Every cancer had to learn the same skills along the way, the six <b>hallmarks</b> of Hanahan and Weinberg (2000): make its own growth signals, ignore stop signals, escape apoptosis, divide without limit, attract blood vessels, and invade and spread. Later lists add altered metabolism and escape from the immune system, with genetic instability and inflammation as the helpers that make it all possible.',
        nl: 'Elke kanker leert dezelfde zes kenmerken (hallmarks): eigen groeisignalen, stop-signalen negeren, apoptose ontlopen, onbeperkt delen, bloedvaten aantrekken, invasie en uitzaaiing. Later erbij: ander metabolisme en ontsnappen aan het immuunsysteem.',
        f: [{ vis: 'bg,vessel,organ,epi,gap,m0,cl1,cl2,sub2,sub3,inv,angio,meta,hall,cnt_s7' }] }
    ]
  };

  /* =================================================================
     Scene 2: oncogene versus tumor suppressor
     ================================================================= */
  var Ogn = {};
  function gauge(svg, o) {
    var g = grp(svg, o, 'gauge');
    path(g, 'M810 275 A70 70 0 0 1 950 275', 'garc');
    T(g, 806, 293, 'slow', 'sm'); T(g, 880, 193, 'normal', 'sm'); T(g, 956, 293, 'fast', 'sm');
    T(g, 880, 313, 'speed of cell division', 'lbl');
    g = grp(svg, o, 'nLow'); line(g, 880, 275, 826, 249, 'needle'); circ(g, 880, 275, 5, 'nhub');
    g = grp(svg, o, 'nNorm'); line(g, 880, 275, 880, 213, 'needle'); circ(g, 880, 275, 5, 'nhub');
    g = grp(svg, o, 'nHigh'); line(g, 880, 275, 934, 249, 'needle red'); circ(g, 880, 275, 5, 'nhub');
  }
  function pedal(g, x, y, down, cls) {
    // a pedal seen from the side: a foot plate on a stalk
    line(g, x, y + 40, x, y + 14, 'stalk');
    el('rect', { x: x - 26, y: y, width: 52, height: 14, rx: 4, 'class': cls, transform: down ? 'rotate(22 ' + x + ' ' + (y + 14) + ')' : '' }, g);
  }
  var sceneGn = {
    VW: 1000, VH: 440, NW: 760, aria: 'Animation of oncogenes and tumor suppressor genes: one hit or two',
    legend: [['--chrom', 'chromosome (one copy of the gene on each)'], ['--gene', 'the gene'], ['--mut', 'mutation (hit)'], ['--gas', 'gas pedal = proto-oncogene protein'], ['--brake', 'brake = tumor suppressor protein'], ['--p53', 'p53, the alarm']],
    build: function (svg) {
      var o = Ogn = {}, g;
      marker(svg, 'arr_gn', 'arrh');
      txt(svg, 988, 432, 'wm', 'simplified', 'end');
      // left: the cell with two copies of one gene
      g = grp(svg, o, 'cell');
      rect(g, 30, 70, 450, 240, 'cellb', 40);
      T(g, 255, 60, 'one body cell, with its two copies of the same gene (one from each parent)', 'lbl');
      g = grp(svg, o, 'chrA'); rect(g, 70, 130, 300, 22, 'chrom', 11); rect(g, 180, 126, 80, 30, 'geneb', 6); T(g, 220, 146, 'gene', 'sm w'); T(g, 390, 146, 'copy 1', 'sm', 'start');
      g = grp(svg, o, 'chrB'); rect(g, 70, 200, 300, 22, 'chrom', 11); rect(g, 180, 196, 80, 30, 'geneb', 6); T(g, 220, 216, 'gene', 'sm w'); T(g, 390, 216, 'copy 2', 'sm', 'start');
      g = grp(svg, o, 'mA'); circ(g, 252, 141, 9, 'mutdot'); T(g, 220, 112, 'point mutation: one wrong letter', 'sm');
      g = grp(svg, o, 'amp'); [0, 1, 2, 3].forEach(function (k) { rect(g, 290 + k * 14, 100 - k * 4, 80, 30, 'geneb', 6); }); T(g, 330, 88, 'amplification: many extra copies', 'sm'); T(g, 330, 180, '→ far too much normal protein', 'sm');
      g = grp(svg, o, 'tran'); rect(g, 110, 126, 66, 30, 'prom', 6); T(g, 143, 146, 'strong', 'sm w'); T(g, 143, 112, 'translocation: a strong promoter (on-switch)', 'sm'); T(g, 143, 97, 'from another chromosome lands next to the gene', 'sm');
      g = grp(svg, o, 'xB'); line(g, 176, 192, 264, 230, 'xmark'); line(g, 176, 230, 264, 192, 'xmark'); T(g, 220, 250, 'copy 2 lost (deleted or broken)', 'sm');
      g = grp(svg, o, 'xA'); line(g, 176, 122, 264, 160, 'xmark'); line(g, 176, 160, 264, 122, 'xmark'); T(g, 220, 112, 'copy 1 also lost', 'sm');
      g = grp(svg, o, 'lgood'); T(g, 255, 286, 'one good copy still makes enough brake protein: the cell behaves normally (a carrier)', 'sm');
      g = grp(svg, o, 'lnone'); T(g, 255, 286, 'no copy left: no brake at all', 'sm');
      g = grp(svg, o, 'ldom'); T(g, 255, 286, 'one changed copy is enough to push: the mutation is dominant', 'sm');
      // EGF receptor (replaces the chromosomes in the cell panel)
      g = grp(svg, o, 'egf');
      line(g, 50, 190, 460, 190, 'mem'); T(g, 236, 206, 'cell membrane', 'sm');
      // normal receptor: outer part + inner part
      rect(g, 120, 130, 22, 60, 'recO', 6); rect(g, 120, 190, 22, 50, 'recI', 6); circ(g, 131, 112, 11, 'egfb'); T(g, 131, 116, 'EGF', 'sm w');
      T(g, 131, 262, 'normal: EGF (a growth factor)', 'sm'); T(g, 131, 278, 'presses the outer part → signal inside', 'sm');
      // truncated receptor: no outer part, signal anyway
      rect(g, 330, 190, 22, 50, 'recI', 6); line(g, 330, 190, 352, 190, 'xmark');
      T(g, 341, 262, 'mutant: outer part deleted →', 'sm'); T(g, 341, 278, 'rings all the time, without EGF', 'sm');
      [[0, 0], [1, 0], [2, 0]].forEach(function (p, k) { T(g, 372 + k * 14, 226, '!', 'big2'); });
      T(g, 255, 96, 'a faulty doorbell: rings even when nobody presses the button', 'lbl');
      // right: the control panel
      g = grp(svg, o, 'panel'); rect(g, 500, 70, 480, 250, 'panelb', 16);
      g = grp(svg, o, 'gasUp'); pedal(g, 575, 212, false, 'gas'); T(g, 575, 274, 'gas pedal', 'lbl'); T(g, 575, 290, 'proto-oncogene protein', 'sm'); T(g, 575, 306, 'pushes division', 'sm');
      g = grp(svg, o, 'gasDown'); pedal(g, 575, 212, true, 'gas'); T(g, 575, 274, 'gas stuck down', 'lbl red'); T(g, 575, 290, 'oncogene protein', 'sm'); T(g, 575, 306, 'hyperactive or too much', 'sm');
      g = grp(svg, o, 'brakeOn'); pedal(g, 705, 212, false, 'brake'); T(g, 705, 274, 'brake', 'lbl'); T(g, 705, 290, 'tumor suppressor protein', 'sm'); T(g, 705, 306, 'Rb stops the cycle', 'sm');
      g = grp(svg, o, 'brakeOff'); line(g, 705, 252, 705, 226, 'stalk'); rect(g, 679, 212, 52, 14, 'brakeg', 4); line(g, 685, 208, 725, 238, 'xmark'); T(g, 705, 274, 'brake gone', 'lbl red'); T(g, 705, 290, 'both copies of Rb lost', 'sm'); T(g, 705, 306, 'no protein at all', 'sm');
      gauge(svg, o);
      g = grp(svg, o, 'ways3'); T(g, 512, 92, 'three accidents make an oncogene:', 'lbl', 'start'); T(g, 512, 112, '1 point mutation → hyperactive protein', 'sm', 'start'); T(g, 512, 128, '2 amplification → too much protein', 'sm', 'start'); T(g, 512, 144, '3 rearrangement → fusion protein or strong promoter', 'sm', 'start');
      g = grp(svg, o, 'six'); T(g, 512, 92, 'six ways to lose the second copy:', 'lbl', 'start');
      ['1 deletion', '2 point mutation', '3 whole chromosome lost (mis-sorting)', '4 mitotic recombination (swap with the bad copy)', '5 gene conversion (copied over by the bad copy)', '6 promoter methylation: the gene is silenced'].forEach(function (s, k) { T(g, 512, 110 + k * 15, s, 'sm', 'start'); });
      // full-width diagrams
      g = grp(svg, o, 'retino');
      T(g, 250, 50, 'hereditary retinoblastoma', 'lbl'); T(g, 750, 50, 'nonhereditary retinoblastoma', 'lbl');
      [0, 1, 2, 3].forEach(function (k) {
        var x = 110 + k * 90; circ(g, x, 120, 30, 'cellb'); rect(g, x - 20, 110, 16, 20, 'genebad', 3); rect(g, x + 4, 110, 16, 20, 'geneb', 3);
        var x2 = 610 + k * 90; circ(g, x2, 120, 30, 'cellb'); rect(g, x2 - 20, 110, 16, 20, 'geneb', 3); rect(g, x2 + 4, 110, 16, 20, 'geneb', 3);
      });
      T(g, 250, 170, 'every cell of the body already has one bad copy (inherited)', 'sm');
      T(g, 250, 186, 'one more somatic hit in any retina cell → tumour: easy', 'sm');
      T(g, 250, 230, 'result: several tumours, usually in both eyes', 'lbl');
      T(g, 750, 170, 'all cells have two good copies', 'sm');
      T(g, 750, 186, 'both copies must be hit in the same cell line: rare', 'sm');
      T(g, 750, 230, 'result: one tumour in one eye (about 1 in 30 000)', 'lbl');
      T(g, 500, 290, 'retinoblastoma: a childhood cancer of the retina (the light-sensing layer of the eye), 1 child in 20 000; the Rb gene was found on chromosome 13', 'sm');
      T(g, 500, 308, 'the same two-hit logic holds for every tumor suppressor gene; Rb is also lost in common lung, breast and bladder carcinomas', 'sm');
      g = grp(svg, o, 'p53d');
      [['DNA damage', 60], ['telomere shortening', 120], ['hypoxia (too little oxygen)', 180], ['oncogene overdrive (e.g. Myc)', 240]].forEach(function (s) { box(g, 40, s[1] - 16, 250, 32, [s[0]], 'tbox'); arrow(g, 292, s[1], 408, 150, 'arr', 'arr_gn'); });
      circ(g, 470, 150, 54, 'p53'); T(g, 470, 146, 'p53', 'big2 w'); T(g, 470, 166, 'the alarm', 'sm w');
      T(g, 470, 226, 'a transcription regulator: switches genes on', 'sm');
      T(g, 470, 242, 'normally made and broken down at once; stress makes it stable', 'sm');
      [['cell-cycle arrest: pause to repair', 70], ['senescence: permanent stop', 150], ['apoptosis: tidy cell suicide', 230]].forEach(function (s) { arrow(g, 528, 150, 640, s[1], 'arr', 'arr_gn'); box(g, 650, s[1] - 16, 300, 32, [s[0]], 'tbox'); });
      T(g, 800, 290, 'arrest works via p21: a protein that blocks the Cdk motors of the cell cycle', 'sm');
      T(g, 800, 306, 'so the cell cannot enter S phase and copy its DNA', 'sm');
      g = grp(svg, o, 'p53x'); line(g, 420, 100, 520, 200, 'xmark'); line(g, 420, 200, 520, 100, 'xmark');
      T(g, 470, 340, 'p53 lost (mutated in about 50 % of all cancers, mostly in its DNA-binding part): stressed, damaged cells keep dividing instead of stopping or dying', 'lbl');
      T(g, 470, 360, 'mice without p53 look normal but all get cancer before 10 months', 'sm');
      g = grp(svg, o, 'sw');
      [['Rb pathway', 'cell-cycle entry', 'brake', 170], ['Ras / PI 3-kinase pathway', 'growth signals from outside', 'gas', 500], ['p53 pathway', 'stress and DNA damage', 'alarm', 830]].forEach(function (s) {
        rect(g, s[3] - 130, 90, 260, 150, 'swbox', 14); T(g, s[3], 120, s[0], 'lbl'); T(g, s[3], 140, s[1], 'sm'); T(g, s[3], 158, '(the ' + s[2] + ')', 'sm');
        rect(g, s[3] - 30, 172, 60, 26, 'swoff', 13); circ(g, s[3] + 17, 185, 10, 'swknob'); T(g, s[3], 222, 'broken', 'lbl red');
      });
      T(g, 500, 290, 'nearly every cancer has broken all three controls: in 74 % of 91 glioblastomas (brain tumours) all three were mutated', 'lbl');
      T(g, 500, 310, 'one mutation per pathway is enough; which gene in the pathway does not matter (ovarian cancer: Rb pathway 67 %, Ras 45 %, p53 96 %)', 'sm');
      g = grp(svg, o, 'tl');
      line(g, 60, 200, 940, 200, 'tline');
      [['normal epithelium', 100], ['hyperplastic (too many cells)', 240], ['early adenoma (small polyp)', 380], ['late adenoma (large polyp)', 560], ['carcinoma', 740], ['invasion and metastasis', 900]].forEach(function (s, k) { circ(g, s[1], 200, 7, 'tdot'); T(g, s[1], k % 2 ? 254 : 236, s[0], 'sm'); });
      [['loss of Apc', 170, 'first hit, found in 80 % of cases, already in small polyps'], ['activation of K-Ras', 470, 'later: rare in small polyps, common in large ones'], ['loss of p53', 650, 'late: rare in polyps, common in carcinomas'], ['more changes', 820, 'unknown steps to invasion']].forEach(function (s, k) {
        arrow(g, s[1], 120, s[1], 190, 'arr', 'arr_gn'); T(g, s[1], 108, s[0], 'lbl'); T(g, s[1], k % 2 ? 76 : 92, s[2], 'sm');
      });
      T(g, 500, 300, 'genetic instability is also acquired early, because it drives all later steps; every patient has a different combination', 'sm');
      T(g, 500, 320, 'why p53 goes last: a little extra Ras activity is not stressful, but the high activity of a fast-growing cancer is, and only a cell without p53 survives that', 'sm');
      T(g, 500, 50, 'colorectal cancer: the usual order of changes (about 10 years from polyp to cancer)', 'lbl');
      return o;
    },
    init: { vis: 'cell,chrA,chrB,panel,gasUp,brakeOn,gauge,nNorm', cam: 500 },
    layout: function (P) { var st = base(Ogn); on(st, Ogn, P.vis); st._cam = { x: P.cam }; return st; },
    steps: [
      { title: 'Begin state: one gene, two copies, and two pedals',
        en: 'A body cell has two copies of every gene, one on each chromosome of a pair. Some genes make proteins that push the cell to divide: think of a <b>gas pedal</b>. Others make proteins that stop division: a <b>brake</b>. Goal of this animation: see why a cancer needs only <b>one</b> hit on a gas gene but <b>two</b> hits on a brake gene.',
        nl: 'Elke cel heeft twee kopieën van elk gen. Sommige genen maken een gaspedaal (eiwit dat deling aanjaagt), andere een rem. Doel: zien waarom één hit volstaat voor het gas, maar twee voor de rem.',
        f: [{ vis: 'cell,chrA,chrB,panel,gasUp,brakeOn,gauge,nNorm' }] },
      { title: 'Proto-oncogene: one hit is enough',
        en: 'A normal gas gene is a <b>proto-oncogene</b>. One <b>point mutation</b> (one wrong DNA letter) in one copy can make a protein that is hyperactive: the gas pedal is stuck down. The second, normal copy cannot undo that. The mutant form is now an <b>oncogene</b>, and its effect is <b>dominant</b>: one hit, and the cell divides too fast. Ras is such a gene: mutated in 30 % of cancers.',
        nl: 'Een normaal gasgen is een proto-oncogen. Eén puntmutatie in één kopie geeft een hyperactief eiwit: gas klemt. De normale kopie kan dat niet ongedaan maken. Het is nu een oncogen, dominant: één hit volstaat.',
        f: [{ vis: 'cell,chrA,chrB,mA,ldom,panel,gasDown,brakeOn,gauge,nHigh' }] },
      { title: 'Two other ways to make an oncogene',
        en: 'A gas gene can also become an oncogene without changing its protein. <b>Amplification</b>: copying errors give the cell many extra copies, so it makes far too much of the normal protein. <b>Rearrangement</b>: a broken chromosome is reglued so that a strong promoter (an on-switch) lands next to the gene, or two genes are fused into one hyperactive <b>fusion protein</b> (background: the Philadelphia chromosome fuses Bcr and Abl in a leukemia).',
        nl: 'Ook zonder ander eiwit: amplificatie (veel extra kopieën, te veel eiwit) of herschikking (een sterke promotor naast het gen, of een fusie-eiwit; achtergrond: Bcr-Abl bij leukemie).',
        f: [{ vis: 'cell,chrA,chrB,amp,tran,panel,gasDown,brakeOn,gauge,nHigh,ways3' }] },
      { title: 'Example: the EGF receptor, a faulty doorbell',
        en: 'The <b>EGF receptor</b> is a protein in the cell membrane: when the growth factor EGF binds its outer part, its inner part sends the "divide" signal. In many brain tumours (glioblastoma) a deletion removes the outer part. The inner part then signals all the time, like a doorbell that rings when nobody presses the button.',
        nl: 'De EGF-receptor: een eiwit in het membraan dat "deel!" doorgeeft als de groeifactor EGF erop bindt. Bij hersentumoren is het buitenstuk weg: de bel rinkelt altijd, ook zonder EGF.',
        f: [{ vis: 'cell,egf,panel,gasDown,brakeOn,gauge,nHigh' }] },
      { title: 'Tumor suppressor gene: the first hit does nothing',
        en: 'Now the brake. The gene for a brake protein is a <b>tumor suppressor gene</b>; <b>Rb</b> is the classic one (its protein stops the cell cycle at the G1 gate). If one copy is lost, the other copy still makes enough brake protein: the cell behaves normally. The loss is <b>recessive</b>: it only shows when both copies are gone.',
        nl: 'Nu de rem: een tumorsuppressorgen, bv. Rb (eiwit dat de celcyclus stopt). Verlies je één kopie, dan maakt de andere nog genoeg rem: de cel gedraagt zich normaal. Recessief.',
        f: [{ vis: 'cell,chrA,chrB,xB,lgood,panel,gasUp,brakeOn,gauge,nNorm' }] },
      { title: 'The second hit: the brake is gone',
        en: 'Only when the second copy is also lost is there no brake protein at all, and the cell enters the cycle whenever it likes. The second copy is usually lost by a sloppy, large accident: six ways are listed on the right, including <b>methylation</b> of the gene\'s promoter, which silences the gene without changing its letters (an <b>epigenetic</b> change).',
        nl: 'Pas als ook de tweede kopie weg is, is er geen rem meer. Dat gebeurt meestal door een grove fout: zes manieren rechts, waaronder methylering van de promotor (epigenetisch: het gen zwijgt zonder letterverandering).',
        f: [{ vis: 'cell,chrA,chrB,xB,xA,lnone,panel,gasUp,brakeOff,gauge,nHigh,six' }] },
      { title: 'Retinoblastoma, hereditary form',
        en: 'This is how the first tumor suppressor gene was found. In the <b>hereditary</b> form of retinoblastoma (a childhood eye cancer) the child inherits one bad copy of Rb in <b>every</b> cell. One more somatic hit in any retina cell is enough, and that happens easily: these children usually get several tumours, in both eyes.',
        nl: 'Zo werd het eerste tumorsuppressorgen gevonden. Erfelijke retinoblastoom (oogkanker bij kinderen): één slechte Rb-kopie in elke cel, geërfd. Eén extra hit volstaat: meerdere tumoren, in beide ogen.',
        f: [{ vis: 'retino' }] },
      { title: 'Retinoblastoma, nonhereditary form',
        en: 'In the <b>nonhereditary</b> form all cells start with two good copies. Both must be hit in the same cell line, two independent accidents, which is rare: these children get one tumour in one eye. Hereditary form: one hit left to do. Nonhereditary form: two hits left to do. That difference proved the two-hit idea.',
        nl: 'Niet-erfelijke vorm: alle cellen starten met twee goede kopieën; beide moeten in dezelfde cellijn getroffen worden, zeldzaam: één tumor in één oog. Dat verschil bewees het twee-hit-idee.',
        f: [{ vis: 'retino' }] },
      { title: 'p53: the alarm of the cell',
        en: 'A third kind of gene: <b>p53</b> is a protein that is normally made and broken down at once, so there is almost none. Under <b>stress</b> (DNA damage, shortened telomeres, lack of oxygen, an oncogene running too hot) it becomes stable and switches on genes that either pause the cycle to repair, stop it for good (<b>senescence</b>), or make the cell kill itself tidily (<b>apoptosis</b>). The pause works through <b>p21</b>, a protein that blocks the Cdk motors of the cell cycle.',
        nl: 'p53 is het alarm: normaal meteen afgebroken, bij stress (DNA-schade, korte telomeren, zuurstoftekort, oncogen op volle toeren) wordt het stabiel en zet het genen aan: pauze om te herstellen, blijvende stop (senescentie) of nette zelfdoding (apoptose). De pauze loopt via p21, dat de Cdk-motoren blokkeert.',
        f: [{ vis: 'p53d' }] },
      { title: 'Losing p53: damaged cells survive',
        en: 'A cancer cell is a stressed, damaged cell. With a working p53 it would be stopped or killed. That is why <b>p53 is mutated in about half of all cancers</b>, more than any other gene, usually in the part that binds DNA. Without p53 the deranged cell simply carries on.',
        nl: 'Een kankercel is een gestreste, beschadigde cel. Met werkend p53 zou ze gestopt of gedood worden. Daarom is p53 in ongeveer de helft van alle kankers gemuteerd, meestal in het DNA-bindende deel.',
        f: [{ vis: 'p53d,p53x' }] },
      { title: 'Three switches that must all be broken',
        en: 'Sequencing thousands of tumours showed a pattern: nearly every cancer has disabled three controls, the <b>Rb pathway</b> (entry into the cycle), the <b>Ras / PI 3-kinase pathway</b> (growth signals from outside; PI 3-kinase is an enzyme in that chain) and the <b>p53 pathway</b> (stress). One broken gene per pathway is enough; which gene does not matter. In 74 % of 91 glioblastomas all three were hit.',
        nl: 'Bijna elke kanker heeft drie controles uitgeschakeld: de Rb-route (instap in de cyclus), de Ras/PI 3-kinase-route (groeisignalen) en de p53-route (stress). Eén kapot gen per route volstaat. Bij 74 % van 91 glioblastomen alle drie.',
        f: [{ vis: 'sw' }] },
      { title: 'The order of hits in colorectal cancer',
        en: 'In cancer of the colon the hits usually come in a typical order: first the loss of <b>Apc</b> (a brake gene; found in 80 % of cases and already in small polyps), early on also genetic instability, then an activating hit on <b>K-Ras</b> (a gas gene, in the larger polyps), and late the loss of <b>p53</b> (in the carcinomas). A little extra Ras is not stressful; a fast-growing cancer is, and only a cell without p53 survives that stress.',
        nl: 'Bij darmkanker komen de hits in een typische volgorde: eerst verlies van Apc (rem, 80 %, al in kleine poliepen), vroeg ook instabiliteit, dan K-Ras aan (gas, in grotere poliepen), en laat verlies van p53 (in de carcinomen).',
        f: [{ vis: 'tl' }] }
    ]
  };

  A.scenes.ev = sceneEv;
  A.scenes.gen = sceneGn;
})();
