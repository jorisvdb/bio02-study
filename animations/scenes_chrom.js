/* Scenes for chromosomes.html: #nd = nondisjunction and aneuploidy, #st = structural changes of a chromosome. Needs player.js.
   One cell with 2 pairs of homologs (A long, B short; red = from the mother, blue = from the father, green = the other parent's gamete). */
(function () {
  'use strict';
  var A = window.Anim, el = A.el, txt = A.txt;

  /* ---------- small helpers ---------- */
  function grp(svg, o, id, cls) { return (o[id] = el('g', cls ? { 'class': cls } : {}, svg)); }
  function on(st, id, v) { st[id] = { x: 0, y: 0, o: v ? 1 : 0 }; }
  function showSet(st, o, prefix, list) {
    var set = {}; (list || '').split(',').forEach(function (s) { if (s) set[s] = 1; });
    for (var id in o) if (id.indexOf(prefix) === 0) st[id] = { x: 0, y: 0, o: set[id.slice(prefix.length)] ? 1 : 0 };
  }
  function labels(svg, o, list) {   // [id, x, y, text, cls?, anchor?]
    list.forEach(function (l) { var g = grp(svg, o, 'l_' + l[0]); txt(g, l[1], l[2], l[4] || 'lbl', l[3], l[5] || 'middle'); });
  }
  function circle(g, cx, cy, r, cls) { return el('circle', { cx: cx, cy: cy, r: r, 'class': cls }, g); }
  function arrow(g, x1, y1, x2, y2, cls) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, c = cls || 'arr';
    el('line', { x1: x1, y1: y1, x2: x2 - ux * 8, y2: y2 - uy * 8, 'class': c }, g);
    el('path', { d: 'M' + x2 + ' ' + y2 + 'L' + (x2 - ux * 11 - uy * 5.5) + ' ' + (y2 - uy * 11 + ux * 5.5) + 'L' + (x2 - ux * 11 + uy * 5.5) + ' ' + (y2 - uy * 11 - ux * 5.5) + 'Z', 'class': c + ' head' }, g);
  }
  function lines(g, x, y0, dy, arr, cls, anchor) { arr.forEach(function (s, i) { txt(g, x, y0 + i * dy, cls || 'lbl', s, anchor || 'middle'); }); }

  /* ================= scene 1: nondisjunction ================= */
  var CH = [['Am', 72, 'mat'], ['Ap', 72, 'pat'], ['Bm', 46, 'mat'], ['Bp', 46, 'pat']];
  var IDS = [], DEF = {};
  var GX = [100, 255, 410, 565], GY1 = 212, GY2 = 268;
  function chromatid(svg, o, id, len, col, dx, dy) {
    var g = o[id] = el('g', { 'class': 'chr ' + col }, svg);
    el('rect', { x: -4.5, y: -len / 2, width: 9, height: len, rx: 4.5 }, g);
    el('circle', { cx: 0, cy: -len * 0.12, r: 3.2, 'class': 'kin' }, g);
    IDS.push(id); DEF[id] = [dx, dy];
  }
  function aster(g, x, y, dir) {
    el('rect', { x: x - 6, y: y - 2.5, width: 12, height: 5, rx: 1.5, 'class': 'csb' }, g);
    el('rect', { x: x - 2.5, y: y - 6, width: 5, height: 12, rx: 1.5, 'class': 'csb' }, g);
    [-46, -23, 0, 23, 46].forEach(function (dy) { el('line', { x1: x, y1: y, x2: x + dir * 60, y2: y + dy, 'class': 'mt' }, g); });
  }
  function arcs(g, x1, x2, y, h) {
    el('path', { d: 'M' + x1 + ' ' + y + 'Q' + ((x1 + x2) / 2) + ' ' + (y - h) + ' ' + x2 + ' ' + y, 'class': 'mt' }, g);
    el('path', { d: 'M' + x1 + ' ' + y + 'Q' + ((x1 + x2) / 2) + ' ' + (y + h) + ' ' + x2 + ' ' + y, 'class': 'mt' }, g);
  }
  // where every chromatid is, per arrangement; ids not listed are hidden
  function ndPositions(P) {
    var M = {}, a = P.arr, nd = P.nd;
    function s(id, x, y) { M[id + '0'] = [x - 5.5, y]; M[id + '1'] = [x + 5.5, y]; }
    function one(id, x, y) { M[id] = [x, y]; }
    switch (a) {
      case 'one': s('Am', 285, 195); s('Ap', 365, 212); s('Bm', 292, 282); s('Bp', 372, 276); break;
      case 'mi': s('Am', 315, 185); s('Ap', 345, 185); s('Bm', 315, 285); s('Bp', 345, 285); break;
      case 'ai': s('Am', 235, 185); s('Ap', 425, 185); s('Bm', 235, 285); s('Bp', 425, 285); break;
      case 'aind': s('Am', 220, 172); s('Ap', 250, 210); s('Bm', 240, 292); s('Bp', 425, 285); break;
      case 'two':
        if (nd === 'mi') { s('Am', 176, 195); s('Ap', 212, 195); s('Bm', 195, 275); s('Bp', 465, 275); }
        else { s('Am', 195, 200); s('Bm', 195, 275); s('Ap', 465, 200); s('Bp', 465, 275); }
        break;
      case 'aii':
        if (nd === 'mi') { one('Am0', 126, 188); one('Ap0', 150, 188); one('Am1', 240, 188); one('Ap1', 264, 188); one('Bm0', 140, 275); one('Bm1', 250, 275); one('Bp0', 410, 275); one('Bp1', 520, 275); }
        else if (nd === 'mii') { one('Am0', 130, 195); one('Am1', 142, 195); one('Bm0', 140, 275); one('Bm1', 250, 275); one('Ap0', 410, 200); one('Ap1', 520, 200); one('Bp0', 410, 275); one('Bp1', 520, 275); }
        else { one('Am0', 140, 200); one('Am1', 250, 200); one('Bm0', 140, 275); one('Bm1', 250, 275); one('Ap0', 410, 200); one('Ap1', 520, 200); one('Bp0', 410, 275); one('Bp1', 520, 275); }
        break;
      case 'gam':
        if (nd === 'mi') { one('Am0', GX[0] - 18, GY1); one('Ap0', GX[0], GY1); one('Bm0', GX[0] + 18, GY2); one('Am1', GX[1] - 18, GY1); one('Ap1', GX[1], GY1); one('Bm1', GX[1] + 18, GY2); one('Bp0', GX[2], GY2); one('Bp1', GX[3], GY2); }
        else if (nd === 'mii') { one('Am0', GX[0] - 18, GY1); one('Am1', GX[0], GY1); one('Bm0', GX[0] + 18, GY2); one('Bm1', GX[1], GY2); one('Ap0', GX[2] - 12, GY1); one('Bp0', GX[2] + 12, GY2); one('Ap1', GX[3] - 12, GY1); one('Bp1', GX[3] + 12, GY2); }
        else { one('Am0', GX[0] - 12, GY1); one('Bm0', GX[0] + 12, GY2); one('Am1', GX[1] - 12, GY1); one('Bm1', GX[1] + 12, GY2); one('Ap0', GX[2] - 12, GY1); one('Bp0', GX[2] + 12, GY2); one('Ap1', GX[3] - 12, GY1); one('Bp1', GX[3] + 12, GY2); }
        break;
      case 'fert':
        if (!P.fz) { one('Am0', 128, 218); one('Am1', 150, 218); one('Bm0', 172, 262); one('Sa0', 318, 226); one('Sb0', 344, 260); }
        else { one('Am0', 520, 205); one('Am1', 545, 205); one('Sa0', 570, 205); one('Bm0', 535, 282); one('Sb0', 585, 282); }
        break;
      case 'mit': one('Am0', 395, 205); one('Am1', 420, 205); one('Sa0', 445, 205); one('Bm0', 410, 282); one('Sb0', 455, 282); break;
      case 'mono':
        if (!P.fz) { one('Bm1', 150, 240); one('Sa0', 318, 226); one('Sb0', 344, 260); }
        else { one('Sa0', 548, 205); one('Bm1', 528, 282); one('Sb0', 570, 282); }
        break;
    }
    return M;
  }

  var sceneND = {
    VW: 1000, VH: 440, NW: 760, aria: 'Animation of nondisjunction, aneuploidy and polyploidy',
    legend: [['--mat', 'chromosome from the mother'], ['--pat', 'chromosome from the father'], ['--oth', 'chromosome of the other parent (sperm)'],
      ['--fg', 'kinetochore (on the centromere)'], ['--cs', 'spindle pole'], ['--mt', 'spindle fibres'], ['--brk', 'the mistake']],
    build: function (svg) {
      var o = {}, g;
      txt(svg, 988, 432, 'wm', 'simplified: 2 pairs instead of 23', 'end');
      // cells
      g = grp(svg, o, 'cOne'); circle(g, 330, 235, 130, 'cellb');
      g = grp(svg, o, 'cOneE'); el('ellipse', { cx: 330, cy: 235, rx: 190, ry: 118, 'class': 'cellb' }, g);
      g = grp(svg, o, 'cTwo'); circle(g, 195, 235, 100, 'cellb'); circle(g, 465, 235, 100, 'cellb');
      g = grp(svg, o, 'cFour'); GX.forEach(function (x) { circle(g, x, 238, 62, 'cellb'); });
      g = grp(svg, o, 'cEgg'); circle(g, 150, 240, 72, 'cellb');
      g = grp(svg, o, 'cSperm'); circle(g, 330, 240, 52, 'cellb'); el('path', { d: 'M382 240 C410 228 418 256 452 246', 'class': 'tail' }, g);
      g = grp(svg, o, 'cZyg'); circle(g, 560, 240, 100, 'cellb');
      g = grp(svg, o, 'cMit'); circle(g, 430, 240, 92, 'cellb'); circle(g, 690, 240, 92, 'cellb'); arrow(g, 530, 240, 590, 240);
      txt(o.cMit, 560, 228, 'sm', 'mitosis', 'middle');
      [[655, 205, 72, 'mat'], [680, 205, 72, 'mat'], [705, 205, 72, 'oth'], [668, 282, 46, 'mat'], [712, 282, 46, 'oth']].forEach(function (r) {
        var c = el('g', { 'class': 'chr ' + r[3] }, o.cMit);
        el('rect', { x: r[0] - 4.5, y: r[1] - r[2] / 2, width: 9, height: r[2], rx: 4.5 }, c);
        el('circle', { cx: r[0], cy: r[1] - r[2] * 0.12, r: 3.2, 'class': 'kin' }, c);
      });
      // spindles (behind the chromosomes)
      g = grp(svg, o, 'spI'); aster(g, 175, 235, 1); aster(g, 485, 235, -1); arcs(g, 175, 485, 235, 125);
      g = grp(svg, o, 'spII'); aster(g, 105, 235, 1); aster(g, 285, 235, -1); aster(g, 375, 235, 1); aster(g, 555, 235, -1);
      // chromatids (two per chromosome; Sa, Sb = the sperm of the other parent, one chromatid each)
      CH.forEach(function (c, i) {
        var d = [[285, 195], [365, 212], [292, 282], [372, 276]][i];
        chromatid(svg, o, c[0] + '0', c[1], c[2], d[0] - 5.5, d[1]); chromatid(svg, o, c[0] + '1', c[1], c[2], d[0] + 5.5, d[1]);
      });
      chromatid(svg, o, 'Sa0', 72, 'oth', 318, 226); chromatid(svg, o, 'Sb0', 46, 'oth', 344, 260);
      // labels under the four gametes
      g = grp(svg, o, 'gl_n'); GX.forEach(function (x) { txt(g, x, 324, 'lbl', 'n', 'middle'); });
      g = grp(svg, o, 'gl_mi'); ['n + 1', 'n + 1', 'n − 1', 'n − 1'].forEach(function (s, i) { txt(g, GX[i], 324, 'lbl bad', s, 'middle'); });
      g = grp(svg, o, 'gl_mii'); ['n + 1', 'n − 1', 'n', 'n'].forEach(function (s, i) { txt(g, GX[i], 324, i < 2 ? 'lbl bad' : 'lbl', s, 'middle'); });
      // counters, top right
      [['c2n', 'chromosomes per cell: 4 (2 pairs)', 'a human body cell: 46'],
       ['cn', 'each gamete: 2 chromosomes (n)', 'a human gamete: 23'],
       ['cmi', 'gametes: 3, 3, 1, 1 chromosomes', 'human: 24, 24, 22, 22'],
       ['cmii', 'gametes: 3, 1, 2, 2 chromosomes', 'human: 24, 22, 23, 23'],
       ['c47', 'zygote: 5 chromosomes = 2n + 1', 'human: 47 instead of 46'],
       ['c45', 'zygote: 3 chromosomes = 2n − 1', 'human: 45 instead of 46']].forEach(function (c) {
        g = grp(svg, o, 'n_' + c[0]); txt(g, 985, 28, 'lbl', c[1], 'end'); txt(g, 985, 46, 'sm', c[2], 'end');
      });
      labels(svg, o, [
        ['begin1', 330, 50, 'begin: a diploid cell (2n) with 2 pairs of homologs'],
        ['begin2', 330, 72, 'the DNA is already copied: each chromosome = 2 sister chromatids'],
        ['goal', 330, 94, 'goal of meiosis: 4 gametes with ONE chromosome of each pair (n)', 'lbl ck'],
        ['mi', 330, 68, 'meiosis I: the homologs of each pair line up, then are pulled apart'],
        ['two', 330, 68, 'after meiosis I: two cells, each with one chromosome of every pair'],
        ['aii', 330, 68, 'meiosis II: the two sister chromatids are pulled apart'],
        ['gamn', 330, 68, 'four normal gametes: one chromosome of each pair (n)'],
        ['aind', 330, 68, 'nondisjunction in meiosis I: the two homologs of pair A do NOT separate', 'lbl bad'],
        ['twond', 330, 68, 'left cell: both A homologs · right cell: no A at all', 'lbl bad'],
        ['gammi', 330, 68, 'all four gametes are wrong: two with an extra A, two without A', 'lbl bad'],
        ['aiind', 330, 68, 'nondisjunction in meiosis II: the sister chromatids of A stay together', 'lbl bad'],
        ['gammii', 330, 68, 'two normal gametes, two wrong ones', 'lbl bad'],
        ['fert', 330, 68, 'fertilization: an egg and a sperm fuse into one zygote'],
        ['egg', 150, 340, 'egg: n + 1 (two A)', 'lbl bad'], ['eggm', 150, 340, 'egg: n − 1 (no A)', 'lbl bad'],
        ['sperm', 330, 340, 'sperm: n (normal)'],
        ['zyg47', 560, 366, 'zygote: trisomic for A, 2n + 1', 'lbl bad'], ['zyg45', 560, 366, 'zygote: monosomic for A, 2n − 1', 'lbl bad'],
        ['mit', 330, 68, 'mitosis copies the chromosomes exactly: every cell of the embryo gets 2n + 1']
      ]);
      // static panels
      g = grp(svg, o, 'dose');
      txt(g, 500, 60, 'lbl big2', 'gene dose: how much of a gene’s product is made', 'middle');
      [[150, '2 copies (normal)', 200, '100 %'], [215, '3 copies (trisomy)', 300, '150 %'], [280, '1 copy (monosomy)', 100, '50 %']].forEach(function (r) {
        txt(g, 170, r[0] + 5, 'lbl', r[1], 'end');
        el('rect', { x: 185, y: r[0] - 14, width: r[2], height: 28, rx: 5, 'class': 'bar' }, g);
        txt(g, 195 + r[2], r[0] + 5, 'lbl', r[3], 'start');
      });
      lines(g, 500, 340, 24, ['a chromosome carries hundreds of genes: all of them out of balance at once → development is disturbed',
        'monosomy + trisomy occur in 10 to 25 % of conceptions: the main cause of pregnancy loss',
        'survivors have a syndrome (Down = trisomy 21); Turner (45,X) is the only viable monosomy'], 'sm2');
      g = grp(svg, o, 'poly');
      el('rect', { x: 110, y: 100, width: 350, height: 230, rx: 10, 'class': 'panel' }, g);
      el('rect', { x: 540, y: 100, width: 350, height: 230, rx: 10, 'class': 'panel' }, g);
      txt(g, 285, 124, 'lbl', 'aneuploid: 2n + 1 (one chromosome extra)', 'middle');
      txt(g, 715, 124, 'lbl', 'polyploid: 3n (a whole extra set)', 'middle');
      [[160, 72, 'mat'], [182, 72, 'pat'], [240, 58, 'mat'], [262, 58, 'pat'], [284, 58, 'mat'], [345, 46, 'mat'], [367, 46, 'pat'],
       [585, 72, 'mat'], [607, 72, 'pat'], [629, 72, 'oth'], [685, 58, 'mat'], [707, 58, 'pat'], [729, 58, 'oth'], [785, 46, 'mat'], [807, 46, 'pat'], [829, 46, 'oth']].forEach(function (r) {
        var c = el('g', { 'class': 'chr ' + r[2] }, g);
        el('rect', { x: r[0] - 4.5, y: 240 - r[1], width: 9, height: r[1], rx: 4.5 }, c);
      });
      txt(g, 285, 270, 'sm2', 'balance broken: the genes of one chromosome', 'middle');
      txt(g, 285, 290, 'sm2', 'are out of proportion to all the others', 'middle');
      txt(g, 715, 270, 'sm2', 'balance kept: every gene × 3, same proportions', 'middle');
      txt(g, 715, 290, 'sm2', '→ looks more nearly normal than an aneuploid', 'middle');
      txt(g, 500, 365, 'lbl', 'plants tolerate it: banana 3n, wheat 6n, strawberry 8n · polyploid animals are rare (some fishes, amphibians)', 'middle');
      txt(g, 500, 392, 'sm2', '3n: a diploid egg (all chromosomes failed to separate) + a normal sperm · 4n: a 2n zygote copies its DNA but does not divide', 'middle');
      g = grp(svg, o, 'sum');
      txt(g, 500, 60, 'lbl big2', 'Summary', 'middle');
      lines(g, 500, 110, 40, ['Nondisjunction = chromosomes that should move apart stay together',
        'meiosis I: the homologs stay together → all 4 gametes wrong (2 × n + 1, 2 × n − 1)',
        'meiosis II: the sister chromatids stay together → 2 normal, 1 × n + 1, 1 × n − 1',
        'wrong gamete + normal gamete → aneuploid zygote: trisomic 2n + 1 (47) or monosomic 2n − 1 (45)',
        'mitosis copies the error into every cell → wrong gene dose → miscarriage or a syndrome',
        'polyploidy (3n, 4n) = whole extra sets: balance kept, common in plants, rare in animals'], 'lbl');
      this._o = o;
      return o;
    },
    init: { arr: 'one', nd: '', fz: 0, gl: '', lab: 'begin1,begin2,goal', cnt: 'c2n', dose: 0, poly: 0, sum: 0 },
    layout: function (P) {
      var st = {}, o = this._o, M = ndPositions(P), a = P.arr;
      IDS.forEach(function (id) { var p = M[id] || DEF[id]; st[id] = { x: p[0], y: p[1], o: M[id] ? 1 : 0 }; });
      on(st, 'cOne', a === 'one' || a === 'mi');
      on(st, 'cOneE', a === 'ai' || a === 'aind');
      on(st, 'cTwo', a === 'two' || a === 'aii');
      on(st, 'cFour', a === 'gam');
      on(st, 'cEgg', (a === 'fert' || a === 'mono') && !P.fz);
      on(st, 'cSperm', (a === 'fert' || a === 'mono') && !P.fz);
      on(st, 'cZyg', (a === 'fert' || a === 'mono') && P.fz);
      on(st, 'cMit', a === 'mit');
      on(st, 'spI', a === 'mi' || a === 'ai' || a === 'aind');
      on(st, 'spII', a === 'aii');
      on(st, 'gl_n', a === 'gam' && P.gl === 'n'); on(st, 'gl_mi', a === 'gam' && P.gl === 'mi'); on(st, 'gl_mii', a === 'gam' && P.gl === 'mii');
      on(st, 'dose', P.dose); on(st, 'poly', P.poly); on(st, 'sum', P.sum);
      showSet(st, o, 'n_', P.cnt); showSet(st, o, 'l_', P.lab);
      st._cam = { x: 500 };
      return st;
    },
    steps: [
      { title: 'Begin state: one diploid cell, before meiosis',
        en: 'This cell is <b>diploid</b> (2n): it has two sets of chromosomes, here 2 pairs of <b>homologs</b> (red from the mother, blue from the father; a human cell has 23 pairs = 46). The DNA has already been copied, so each chromosome is two <b>sister chromatids</b> joined at the centromere. The goal of meiosis: four gametes with one chromosome of each pair.',
        nl: 'Begin: een diploïde cel met 2 paren homologen; elk chromosoom bestaat al uit 2 zusterchromatiden. Doel: 4 gameten met één chromosoom van elk paar.',
        f: [{}] },
      { title: 'Meiosis I: the homologs line up and separate',
        en: 'In <b>meiosis I</b> the two homologs of each pair find each other and line up in the middle. The <b>spindle</b> (spoelfiguur: the fibres between the two poles) then pulls the homologs to opposite poles. Each side receives one chromosome of every pair, still made of two chromatids.',
        nl: 'Meiose I: de homologen van elk paar gaan naast elkaar liggen en worden door de spoel uit elkaar getrokken.',
        f: [{ arr: 'mi', lab: 'mi' }, { arr: 'ai' }], d: 900 },
      { title: 'Meiosis II: the sister chromatids separate',
        en: 'The cell divides into two. In <b>meiosis II</b> each of these two cells splits the sister chromatids of every chromosome. Result: four <b>gametes</b> (sex cells), each with one chromosome of each pair. This is the normal <b>haploid</b> number n (23 in humans).',
        nl: 'Meiose II: in beide cellen worden de zusterchromatiden gescheiden. Resultaat: vier normale haploïde gameten (n).',
        f: [{ arr: 'two', lab: 'two' }, { arr: 'aii', lab: 'aii' }, { arr: 'gam', lab: 'gamn', gl: 'n', cnt: 'cn' }], d: 900 },
      { title: 'Nondisjunction in meiosis I',
        en: 'Back to the start. <b>Nondisjunction</b> (non-disjunctie) means "not going apart". Here the two homologs of pair A stay together and both go to the left pole. Pair B separates normally.',
        nl: 'Non-disjunctie in meiose I: de twee homologen van paar A gaan niet uit elkaar; beide gaan naar dezelfde pool.',
        f: [{ arr: 'one', nd: '', gl: '', lab: '', cnt: 'c2n' }, { arr: 'mi', lab: 'mi' }, { arr: 'aind', nd: 'mi', lab: 'aind' }], d: 900 },
      { title: 'Meiosis II after that mistake: all four gametes wrong',
        en: 'The left cell now has both A homologs, the right cell has no A at all. Meiosis II separates the sister chromatids normally, but it only copies the error: two gametes have an extra A (<b>n + 1</b>) and two have no A (<b>n − 1</b>). All four are wrong.',
        nl: 'Na meiose II: twee gameten met een A te veel (n + 1) en twee zonder A (n − 1). Alle vier zijn fout.',
        f: [{ arr: 'two', lab: 'twond' }, { arr: 'aii', lab: 'aii' }, { arr: 'gam', lab: 'gammi', gl: 'mi', cnt: 'cmi' }], d: 900 },
      { title: 'Nondisjunction in meiosis II',
        en: 'Again from the start. This time meiosis I is normal: the homologs separate. The mistake happens in <b>meiosis II</b>, in the left cell: the two sister chromatids of A stay together and both go to the same pole.',
        nl: 'Meiose I verloopt normaal. In meiose II blijven in de linkercel de twee zusterchromatiden van A samen.',
        f: [{ arr: 'one', nd: '', gl: '', lab: '', cnt: 'c2n' }, { arr: 'mi', lab: 'mi' }, { arr: 'ai' }, { arr: 'two', lab: 'two' }, { arr: 'aii', nd: 'mii', lab: 'aiind' }], d: 800 },
      { title: 'Result: two normal gametes, two abnormal',
        en: 'From the left cell: one gamete with two A (n + 1) and one with no A (n − 1). The right cell was normal, so it gives two normal gametes. Compare with meiosis I: a mistake there spoils all four gametes, a mistake in meiosis II spoils only two.',
        nl: 'Resultaat: één gameet n + 1, één n − 1, en twee normale. Fout in meiose I: alle vier fout; fout in meiose II: twee fout.',
        f: [{ arr: 'gam', lab: 'gammii', gl: 'mii', cnt: 'cmii' }] },
      { title: 'Fertilization: an n + 1 egg meets a normal sperm',
        en: 'Take the egg with two A chromosomes. A normal sperm (green: one A, one B) fuses with it. The <b>zygote</b> (the fertilized egg, the first cell of the embryo) now has three copies of A: it is <b>trisomic</b> for A, written 2n + 1. In humans that is 47 chromosomes instead of 46.',
        nl: 'Bevruchting: eicel n + 1 + normale zaadcel → zygote met drie kopieën van A: trisomie, 2n + 1 (bij de mens 47).',
        f: [{ arr: 'fert', fz: 0, gl: '', lab: 'fert,egg,sperm', cnt: '' }, { fz: 1, lab: 'zyg47', cnt: 'c47' }], d: 1000 },
      { title: 'Mitosis copies the error into every cell',
        en: 'The zygote grows by <b>mitosis</b>, which copies the chromosomes exactly. So every cell of the embryo inherits the extra chromosome: a trisomy is in all cells of the body, not just in one organ.',
        nl: 'Mitose kopieert de chromosomen exact: elke cel van het embryo krijgt 2n + 1.',
        f: [{ arr: 'mit', lab: 'mit', cnt: 'c47' }] },
      { title: 'Monosomy: an n − 1 gamete',
        en: 'The other kind of wrong gamete has no A at all (n − 1). With a normal sperm the zygote gets only one A: it is <b>monosomic</b> for A, 2n − 1, in humans 45 chromosomes. In humans only one monosomy survives: Turner syndrome (45,X).',
        nl: 'Een gameet zonder A (n − 1) + normale zaadcel → zygote met één A: monosomie, 2n − 1 (bij de mens 45).',
        f: [{ arr: 'mono', fz: 0, lab: 'fert,eggm,sperm', cnt: '' }, { fz: 1, lab: 'zyg45', cnt: 'c45' }], d: 1000 },
      { title: 'Why it matters: the gene dose',
        en: 'A chromosome carries hundreds of genes. Three copies instead of two means every one of those genes makes about 1.5 times the normal amount of product: the <b>gene dose</b> is wrong. Hundreds of genes out of balance disturb development. Monosomy and trisomy occur in 10 to 25 % of conceptions and are the main cause of pregnancy loss.',
        nl: 'Gendosis: drie kopieën → 1,5 × zoveel product van honderden genen tegelijk. Mono- en trisomie: 10 tot 25 % van de bevruchtingen, hoofdoorzaak van miskramen.',
        f: [{ arr: 'none', lab: '', cnt: '', dose: 1 }] },
      { title: 'Aneuploidy versus polyploidy',
        en: '<b>Aneuploidy</b> is one chromosome too many or too few. <b>Polyploidy</b> is a whole extra set: <b>triploid</b> 3n, <b>tetraploid</b> 4n. A whole set keeps every gene in the same proportion, so polyploids look more nearly normal than aneuploids. Plants tolerate it well: bananas are 3n, wheat 6n, strawberries 8n.',
        nl: 'Aneuploïdie = één chromosoom te veel of te weinig. Polyploïdie = een hele set extra (3n, 4n): evenwicht bewaard, vaak bij planten (banaan 3n, tarwe 6n, aardbei 8n).',
        f: [{ dose: 0, poly: 1 }] },
      { title: 'Summary',
        en: 'Nondisjunction in meiosis I spoils all four gametes, in meiosis II only two. A wrong gamete plus a normal one gives an aneuploid zygote: trisomic (2n + 1, 47) or monosomic (2n − 1, 45), copied by mitosis into every cell. Polyploidy means whole extra sets.',
        nl: 'Samenvatting: non-disjunctie → gameten n + 1 en n − 1 → trisomie of monosomie in alle cellen. Polyploïdie = hele sets extra.',
        f: [{ poly: 0, sum: 1 }] }
    ]
  };

  /* ================= scene 2: structural changes ================= */
  var SX = 150, SW = 56, TY = 112, MY = 192, RY = 262, R2 = 352;
  function sx(i) { return SX + i * SW; }
  var SEGS = [];
  function seg(svg, o, id, letter, cls, w) {
    var g = o[id] = el('g', { 'class': 'seg ' + cls }, svg), W = w || 52;
    el('rect', { x: 0, y: 0, width: W, height: 26, rx: 5 }, g);
    txt(g, W / 2, 18, 'segt', letter, 'middle');
    SEGS.push(id);
  }
  var sceneST = {
    VW: 1000, VH: 440, NW: 760, aria: 'Animation of deletion, duplication, inversion and translocation',
    legend: [['--seg1', 'the chromosome (pieces A to H)'], ['--seg2', 'its homolog (same genes, other parent)'], ['--seg3', 'a non-homologous chromosome (pieces M to R)'], ['--brk', 'break point'], ['--gene', 'genes ABL and BCR (Philadelphia chromosome)']],
    build: function (svg) {
      var o = {}, g;
      txt(svg, 988, 432, 'wm', 'each letter = a piece of chromosome with genes', 'end');
      // faded copy of the original chromosome, shown above the results
      g = grp(svg, o, 'ghost');
      'ABCDEFGH'.split('').forEach(function (L, i) {
        el('rect', { x: sx(i), y: TY, width: 52, height: 26, rx: 5, 'class': 'ghostr' }, g);
        txt(g, sx(i) + 26, TY + 18, 'segt ghostt', L, 'middle');
      });
      txt(g, sx(0) - 12, TY + 18, 'sm', 'before', 'end');
      g = grp(svg, o, 'aft'); txt(g, sx(0) - 12, RY + 18, 'sm', 'after', 'end');
      'ABCDEFGH'.split('').forEach(function (L) { seg(svg, o, 's_' + L, L, 'a'); });
      'ABCDEFGH'.split('').forEach(function (L) { seg(svg, o, 'h_' + L, L, 'b'); });
      'MNOPQR'.split('').forEach(function (L) { seg(svg, o, 'n_' + L, L, 'c'); });
      g = grp(svg, o, 'cen'); el('circle', { cx: 0, cy: 13, r: 7, 'class': 'cenc' }, g); txt(g, 0, 40, 'sm', 'centromere', 'middle');
      g = grp(svg, o, 'brk1'); arrow(g, 0, -34, 0, -4, 'arr red'); g = grp(svg, o, 'brk2'); arrow(g, 0, -34, 0, -4, 'arr red');
      g = grp(svg, o, 'xo'); el('path', { d: 'M-14 -14L14 14M14 -14L-14 14', 'class': 'xo' }, g); txt(g, 24, 6, 'lbl ck', 'crossover', 'start');
      g = grp(svg, o, 'dlost'); txt(g, 0, 0, 'sm', 'lost', 'middle');
      // Philadelphia chromosome pieces (drawn at the origin, positioned by the layout)
      seg(svg, o, 'p9a', 'chromosome 9', 'g', 300); seg(svg, o, 'abl', 'ABL', 'gene', 50); seg(svg, o, 'p9t', '', 'g', 40);
      seg(svg, o, 'p22a', 'chromosome 22', 'g', 110); seg(svg, o, 'bcr', 'BCR', 'gene', 50); seg(svg, o, 'p22t', '', 'g', 150);
      labels(svg, o, [
        ['b1', 500, 54, 'one chromosome, drawn as 8 pieces: every piece carries genes, in a fixed order'],
        ['b2', 500, 78, 'goal: see the four ways a broken chromosome can be put back together wrongly', 'lbl ck'],
        ['brk', 500, 54, 'breaks (red arrows) happen in meiosis or through damage such as radiation'],
        ['brk2', 500, 78, 'the loose pieces can be lost or reattached in the wrong place', 'lbl ck'],
        ['del', 500, 240, 'deletion: piece D is lost → the chromosome misses the genes on D'],
        ['uneq1', 500, 54, 'unequal crossing-over in meiosis: two homologs pair up slightly misaligned'],
        ['uneq2', 500, 78, 'at the crossover they swap pieces of different length', 'lbl ck'],
        ['dup', 500, 240, 'duplication: this homolog now carries B C twice (it received more than it gave)'],
        ['dup2', 500, 334, 'deletion: the other homolog lost B C (it gave more than it received)'],
        ['inv', 500, 240, 'inversion: the piece B C D is reattached the other way round → A D C B E F G H'],
        ['tr1', 500, 54, 'translocation: a piece moves to a NON-homologous chromosome (different genes, M to R)'],
        ['tr2', 500, 250, 'reciprocal translocation: the two chromosomes exchange pieces; no gene is lost'],
        ['bal1', 500, 300, 'inversion and reciprocal translocation keep every gene in its normal dose'],
        ['bal2', 500, 324, 'yet the phenotype can change: a gene’s expression depends on its neighbours (position effect)', 'lbl ck'],
        ['bal3', 500, 348, 'deletions change the dose and are often lethal; duplications and translocations also tend to be harmful'],
        ['p9', 120, 138, 'chromosome 9 (long)', 'sm', 'start'], ['p22', 120, 250, 'chromosome 22 (small)', 'sm', 'start'],
        ['ph1', 500, 54, 'the Philadelphia chromosome: a reciprocal translocation during MITOSIS in a white blood cell precursor'],
        ['ph2', 500, 330, 'the shortened chromosome 22 = Philadelphia chromosome; the genes BCR and ABL are now one fused gene'],
        ['ph3', 500, 354, 'the fused gene drives uncontrolled cell division → chronic myelogenous leukemia (CML)', 'lbl bad']
      ]);
      g = grp(svg, o, 'sumst');
      txt(g, 500, 56, 'lbl big2', 'Four changes in chromosome structure', 'middle');
      [['deletion', 'a piece is lost → genes missing; a large deletion is usually lethal, even a heterozygous one can be severe (cri du chat)'],
       ['duplication', 'a piece is present twice (unequal crossing-over in meiosis) → extra gene dose, tends to be harmful'],
       ['inversion', 'a piece is turned around → all genes present, but their position changes (position effect)'],
       ['translocation', 'a piece joins a non-homologous chromosome; reciprocal = pieces swapped → fused gene (Philadelphia 9;22 → CML)']].forEach(function (r, i) {
        txt(g, 150, 110 + i * 56, 'lbl', r[0], 'start'); txt(g, 150, 132 + i * 56, 'sm2', r[1], 'start');
      });
      txt(g, 500, 360, 'lbl ck', 'deletions and duplications arise mostly in meiosis; translocations also occur in mitosis (cancer)', 'middle');
      this._o = o;
      return o;
    },
    init: { mode: 'begin', lab: 'b1,b2' },
    layout: function (P) {
      var st = {}, o = this._o, m = P.mode;
      // defaults: every piece at its home position, hidden
      'ABCDEFGH'.split('').forEach(function (L, i) { st['s_' + L] = { x: sx(i), y: TY, o: 0 }; st['h_' + L] = { x: sx(i) + 112, y: MY, o: 0 }; });
      'MNOPQR'.split('').forEach(function (L, i) { st['n_' + L] = { x: sx(i), y: MY, o: 0 }; });
      ['cen', 'brk1', 'brk2', 'xo', 'ghost', 'aft', 'dlost', 'sumst'].forEach(function (id) { st[id] = { x: 0, y: 0, o: 0 }; });
      [['p9a', 120, 150], ['abl', 420, 150], ['p9t', 470, 150], ['p22a', 120, 262], ['bcr', 230, 262], ['p22t', 280, 262]].forEach(function (p) { st[p[0]] = { x: p[1], y: p[2], o: 0 }; });
      function showS(ids, y, x0) { ids.forEach(function (id, i) { st[id] = { x: sx(x0 + i), y: y, o: 1 }; }); }
      var S = 'ABCDEFGH'.split('').map(function (L) { return 's_' + L; });
      st.cen = { x: sx(3), y: TY, o: 1 };
      switch (m) {
        case 'begin': showS(S, TY, 0); break;
        case 'brk': showS(S, TY, 0); st.brk1 = { x: sx(3), y: TY, o: 1 }; st.brk2 = { x: sx(4), y: TY, o: 1 }; break;
        case 'del':
          st.ghost = { x: 0, y: 0, o: 1 }; st.aft = { x: 0, y: 0, o: 1 };
          showS(['s_A', 's_B', 's_C'], RY, 0); showS(['s_E', 's_F', 's_G', 's_H'], RY, 3);
          st.s_D = { x: sx(3) + 90, y: 392, o: 0.45 }; st.dlost = { x: sx(3) + 172, y: 410, o: 1 }; st.cen = { x: sx(3), y: RY, o: 1 }; break;
        case 'uneq':
          showS(S, TY, 0); 'ABCDEFGH'.split('').forEach(function (L, i) { st['h_' + L] = { x: sx(i) + 112, y: MY, o: 1 }; });
          st.xo = { x: sx(3), y: (TY + MY) / 2 + 13, o: 1 }; break;
        case 'dup':
          st.ghost = { x: 0, y: 0, o: 1 }; st.aft = { x: 0, y: 0, o: 1 };
          showS(['s_A', 's_B', 's_C'], RY, 0); showS(['h_B', 'h_C', 'h_D', 'h_E', 'h_F', 'h_G', 'h_H'], RY, 3);
          showS(['h_A'], R2, 0); showS(['s_D', 's_E', 's_F', 's_G', 's_H'], R2, 1); st.cen = { x: sx(3), y: RY, o: 1 }; break;
        case 'inv0': showS(S, TY, 0); st.brk1 = { x: sx(1), y: TY, o: 1 }; st.brk2 = { x: sx(4), y: TY, o: 1 }; break;
        case 'inv':
          st.ghost = { x: 0, y: 0, o: 1 }; st.aft = { x: 0, y: 0, o: 1 };
          showS(['s_A', 's_D', 's_C', 's_B', 's_E', 's_F', 's_G', 's_H'], RY, 0); st.cen = { x: sx(3), y: RY, o: 1 }; break;
        case 'trans0':
          showS(S, TY, 0); showS(['n_M', 'n_N', 'n_O', 'n_P', 'n_Q', 'n_R'], MY, 0);
          st.brk1 = { x: sx(3), y: TY, o: 1 }; st.brk2 = { x: sx(3), y: MY, o: 1 }; break;
        case 'trans':
          showS(['s_A', 's_B', 's_C'], TY, 0); showS(['n_P', 'n_Q', 'n_R'], TY, 3);
          showS(['n_M', 'n_N', 'n_O'], MY, 0); showS(['s_D', 's_E', 's_F', 's_G', 's_H'], MY, 3); break;
        case 'phil0': st.cen = { x: 0, y: 0, o: 0 }; ['p9a', 'abl', 'p9t', 'p22a', 'bcr', 'p22t'].forEach(function (id) { st[id].o = 1; }); break;
        case 'phil':
          st.cen = { x: 0, y: 0, o: 0 }; ['p9a', 'abl', 'p9t', 'p22a', 'bcr', 'p22t'].forEach(function (id) { st[id].o = 1; });
          st.p22t = { x: 420, y: 150, o: 1 }; st.abl = { x: 280, y: 262, o: 1 }; st.p9t = { x: 330, y: 262, o: 1 }; break;
        case 'sum': st.cen = { x: 0, y: 0, o: 0 }; st.sumst = { x: 0, y: 0, o: 1 }; break;
      }
      showSet(st, o, 'l_', P.lab);
      st._cam = { x: 500 };
      return st;
    },
    steps: [
      { title: 'Begin state: one intact chromosome',
        en: 'A chromosome is one long DNA molecule with thousands of genes in a fixed order. We draw it as eight pieces, A to H; the small circle is the <b>centromere</b> (the waist where the two copies are held together). Goal: see the four ways a broken chromosome can be put back together wrongly.',
        nl: 'Begin: één intact chromosoom, getekend als 8 stukken A tot H met een centromeer. Doel: de vier soorten structurele verandering.',
        f: [{}] },
      { title: 'A chromosome can break',
        en: 'Errors in meiosis or damaging agents such as radiation can <b>break</b> a chromosome (red arrows). A loose piece can be lost, or it can be reattached: to the same chromosome, to its homolog, or to a completely different chromosome.',
        nl: 'Een chromosoom kan breken (fouten in de meiose, straling). Een los stuk kan verloren gaan of op de verkeerde plaats worden vastgemaakt.',
        f: [{ mode: 'brk', lab: 'brk,brk2' }] },
      { title: 'Deletion: a piece is lost',
        en: 'In a <b>deletion</b> the broken-off piece (here D) is lost. The chromosome now misses all the genes that were on D. An embryo that misses many essential genes on both homologs usually dies; even one missing copy can cause a severe syndrome (cri du chat, page 1.3).',
        nl: 'Deletie: het afgebroken stuk D gaat verloren; de genen erop ontbreken. Grote deleties zijn meestal dodelijk.',
        f: [{ mode: 'del', lab: 'del' }] },
      { title: 'Duplication: a piece is present twice (unequal crossing-over)',
        en: 'In meiosis the two homologs pair up and exchange pieces (crossing-over, BIO01 chapter 7). If they pair up slightly misaligned, the exchange is <b>unequal</b>: one homolog receives a piece that it already has, the other gives it away. Result: one chromosome with a <b>duplication</b> (B C twice) and one with a deletion.',
        nl: 'Ongelijke crossing-over: de homologen liggen verschoven en wisselen ongelijke stukken uit. Het ene chromosoom krijgt B C dubbel (duplicatie), het andere verliest B C (deletie).',
        f: [{ mode: 'uneq', lab: 'uneq1,uneq2' }, { mode: 'dup', lab: 'dup,dup2' }], d: 1300 },
      { title: 'Inversion: a piece is turned around',
        en: 'Two breaks free the piece B C D. It is reattached to the same chromosome, but the other way round: the order becomes A D C B E F G H. This is an <b>inversion</b>. No gene is lost; only the order changed.',
        nl: 'Inversie: het stuk B C D wordt omgekeerd teruggeplaatst: A D C B E F G H. Geen gen verloren, alleen de volgorde veranderd.',
        f: [{ mode: 'inv0', lab: 'brk' }, { mode: 'inv', lab: 'inv' }], d: 1300 },
      { title: 'Translocation: a piece moves to another chromosome',
        en: 'A broken piece can join a <b>non-homologous</b> chromosome, one with completely different genes (M to R). When the two chromosomes swap pieces, it is a <b>reciprocal translocation</b>: all genes are still present, in normal dose, but on the wrong chromosome.',
        nl: 'Translocatie: een stuk gaat naar een niet-homoloog chromosoom. Reciprook = de twee chromosomen wisselen stukken uit; geen gen verloren.',
        f: [{ mode: 'trans0', lab: 'tr1' }, { mode: 'trans', lab: 'tr2' }], d: 1300 },
      { title: 'Balanced, but not harmless: the position effect',
        en: 'In an inversion or a reciprocal translocation every gene is present in its normal dose, so the gene balance is not disturbed. Still the <b>phenotype</b> (the traits of the organism) can change, because how much a gene is used depends on its neighbours. This is the <b>position effect</b>, and it can be devastating.',
        nl: 'Inversie en reciproke translocatie houden de gendosis normaal, maar de expressie van een gen hangt af van zijn buren: positie-effect.',
        f: [{ lab: 'tr2,bal1,bal2,bal3' }] },
      { title: 'The Philadelphia chromosome: before',
        en: 'A famous translocation happens during <b>mitosis</b>, in a cell that makes white blood cells. Chromosome 9 carries the gene <b>ABL</b> near its tip; chromosome 22 carries the gene <b>BCR</b>. (A gene is a piece of DNA that codes for one protein.)',
        nl: 'Het Philadelphia-chromosoom: chromosoom 9 draagt het gen ABL bij de tip, chromosoom 22 het gen BCR.',
        f: [{ mode: 'phil0', lab: 'ph1,p9,p22' }] },
      { title: 'The Philadelphia chromosome: after the exchange',
        en: 'The tip of chromosome 9 (with ABL) and a large part of chromosome 22 are exchanged. Chromosome 22 becomes much shorter: this is the <b>Philadelphia chromosome</b>. BCR and ABL are now joined into one <b>fused gene</b>, whose protein drives uncontrolled cell division: <b>chronic myelogenous leukemia</b> (CML).',
        nl: 'Na de uitwisseling is chromosoom 22 veel korter: het Philadelphia-chromosoom. BCR en ABL vormen één gefuseerd gen → ongecontroleerde celdeling → CML.',
        f: [{ mode: 'phil', lab: 'ph2,ph3,p9,p22' }], d: 1400 },
      { title: 'Summary: the four changes',
        en: 'Deletion: a piece lost. Duplication: a piece twice, from unequal crossing-over. Inversion: a piece turned around. Translocation: a piece on another chromosome, reciprocal when swapped. Deletions and duplications arise mostly in meiosis; a translocation in mitosis can cause cancer.',
        nl: 'Samenvatting: deletie, duplicatie, inversie, translocatie. Deleties en duplicaties vooral in de meiose; een translocatie in de mitose kan kanker geven.',
        f: [{ mode: 'sum', lab: '' }] }
    ]
  };

  A.scenes.nd = sceneND;
  A.scenes.st = sceneST;
})();
