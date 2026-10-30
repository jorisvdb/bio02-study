/* Scenes for techniques.html: #pcr = PCR and cDNA, #clo = cloning a gene into a plasmid, #seq = Sanger, shotgun, Illumina, Nanopore.
   Needs player.js. Drawings are groups with an id; layout() switches them on and off (vis) and moves a few of them. */
(function () {
  'use strict';
  var A = window.Anim, el = A.el, txt = A.txt;

  /* ---------- helpers ---------- */
  function grp(svg, o, id, cls) { return o[id] = el('g', cls ? { 'class': cls } : {}, svg); }
  function rect(g, x, y, w, h, cls, rx) { return el('rect', { x: x, y: y, width: w, height: h, rx: rx == null ? 4 : rx, 'class': cls || '' }, g); }
  function circ(g, cx, cy, r, cls) { return el('circle', { cx: cx, cy: cy, r: r, 'class': cls || '' }, g); }
  function line(g, x1, y1, x2, y2, cls) { return el('line', { x1: x1, y1: y1, x2: x2, y2: y2, 'class': cls || '' }, g); }
  function path(g, d, cls) { return el('path', { d: d, 'class': cls || '' }, g); }
  function T(g, x, y, s, cls, anchor) { return txt(g, x, y, cls || 'lbl', s, anchor || 'middle'); }
  function arrow(g, x1, y1, x2, y2, mk, cls) { return el('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2, 'class': cls || 'arr', 'marker-end': 'url(#' + mk + ')' }, g); }
  function marker(svg, id) {
    var d = el('defs', {}, svg);
    var m = el('marker', { id: id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, d);
    el('path', { d: 'M0 0L10 5L0 10z', 'class': 'arrh' }, m);
  }
  function box(g, x, y, w, h, lines, cls, tcls, anchor) {
    rect(g, x, y, w, h, cls || 'tbox', 8);
    var n = lines.length, y0 = y + h / 2 - (n - 1) * 8 + 4, tx = anchor === 'start' ? x + 12 : x + w / 2;
    lines.forEach(function (s, i) { T(g, tx, y0 + i * 16, s, tcls || 'sm', anchor || 'middle'); });
  }
  function blob(g, cx, cy, rx, ry, cls, label) { el('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, 'class': cls }, g); if (label) T(g, cx, cy + 4, label, 'sm w'); }
  function base(O) { var st = {}; for (var id in O) st[id] = { x: 0, y: 0, o: 0 }; return st; }
  function on(st, O, list) { list.split(',').forEach(function (id) { id = id.trim(); if (id && O[id]) st[id] = { x: 0, y: 0, o: 1 }; }); }
  // a double strand: two bars with base-pair ticks between them
  function duplex(g, x, y, w, cls, ticks) {
    rect(g, x, y, w, 8, cls || 'dna', 3); rect(g, x, y + 16, w, 8, cls || 'dna', 3);
    if (ticks !== false) for (var k = x + 6; k < x + w - 4; k += 10) line(g, k, y + 8, k, y + 16, 'bp');
  }

  /* =================================================================
     Scene 1: PCR (and reverse transcription to cDNA)
     ================================================================= */
  var Opc = {};
  var DX = 120, DW = 560, TX = 300, TW = 200, Y1 = 150, Y2 = 186;
  function strand(g, y, top) {
    rect(g, DX, y, DW, 12, 'dna', 4); rect(g, TX, y, TW, 12, 'tgt', 4);
    T(g, DX - 10, y + 10, top ? '5′' : '3′', 'end', 'end'); T(g, DX + DW + 10, y + 10, top ? '3′' : '5′', 'end', 'start');
  }
  function copies(g, n, y, mixed) {
    // n small duplexes in a row; mixed = some long (template-length), most exactly target-length
    var w = n > 4 ? 80 : 180, gap = 14, x0 = 500 - (n * (w + gap) - gap) / 2;
    for (var i = 0; i < n; i++) {
      var x = x0 + i * (w + gap), lng = mixed && (i === 0 || i === n - 1);
      rect(g, x, y, w, 7, lng ? 'dna' : 'tgt', 3); rect(g, x, y + 11, w, 7, lng ? 'dna' : 'tgt', 3);
    }
  }
  var scenePcr = {
    VW: 1000, VH: 440, NW: 760, aria: 'Animation of the polymerase chain reaction and of reverse transcription',
    legend: [['--dna', 'template DNA'], ['--tgt', 'the target region (what we want to copy)'], ['--prim', 'primer (short synthetic DNA, about 20 bases)'], ['--newd', 'newly built DNA'], ['--pol', 'Taq DNA polymerase'], ['--rna', 'mRNA'], ['--merc', 'temperature']],
    build: function (svg) {
      var o = Opc = {}, g;
      marker(svg, 'arr_pc');
      txt(svg, 988, 432, 'wm', 'simplified, not to scale', 'end');
      // the two strands (moved apart by layout when sep = 1)
      g = grp(svg, o, 'sT'); strand(g, Y1, true);
      g = grp(svg, o, 'sB'); strand(g, Y2, false);
      g = grp(svg, o, 'bps'); for (var k = DX + 8; k < DX + DW; k += 14) line(g, k, Y1 + 12, k, Y2, 'bp');
      g = grp(svg, o, 'ltmpl'); T(g, 500, 130, 'template: double-stranded DNA; the orange part is the target region, the rest is DNA we do not want', 'sm');
      // primers (positions for the separated strands: top at Y1-40, bottom at Y2+40)
      g = grp(svg, o, 'pR'); rect(g, TX + TW - 40, Y1 - 40 + 14, 40, 10, 'prim', 3); T(g, TX + TW - 20, Y1 - 40 + 38, 'primer 2', 'sm');
      g = grp(svg, o, 'pF'); rect(g, TX, Y2 + 40 - 12, 40, 10, 'prim', 3); T(g, TX + 20, Y2 + 40 - 18, 'primer 1', 'sm');
      g = grp(svg, o, 'lprim'); T(g, 500, 300, 'each primer pairs with the 3′ end of the target on one strand, so the two primers face each other across the target', 'sm');
      // new strands
      g = grp(svg, o, 'nR'); rect(g, TX, Y1 - 40 + 14, TW - 40, 10, 'newd', 3); T(g, TX - 12, Y1 - 40 + 23, '← built 5′→3′', 'sm', 'end');
      g = grp(svg, o, 'nF'); rect(g, TX + 40, Y2 + 40 - 12, TW - 40, 10, 'newd', 3); T(g, TX + TW + 12, Y2 + 40 - 3, 'built 5′→3′ →', 'sm', 'start');
      // Taq blobs (moved by layout)
      g = grp(svg, o, 'taqF'); blob(g, 0, 0, 22, 13, 'pol', 'Taq');
      g = grp(svg, o, 'taqR'); blob(g, 0, 0, 22, 13, 'pol', 'Taq');
      // thermometer
      g = grp(svg, o, 'therm');
      rect(g, 900, 50, 22, 220, 'thermb', 11); circ(g, 911, 282, 18, 'thermb');
      T(g, 884, 70, '94–98 °C', 'sm', 'end'); T(g, 884, 128, '72 °C', 'sm', 'end'); T(g, 884, 180, '50–65 °C', 'sm', 'end');
      line(g, 888, 66, 900, 66, 'tick'); line(g, 888, 124, 900, 124, 'tick'); line(g, 888, 176, 900, 176, 'tick');
      T(g, 911, 316, 'temperature', 'sm');
      g = grp(svg, o, 'm94'); rect(g, 905, 66, 12, 200, 'merc', 6); circ(g, 911, 282, 13, 'merc'); T(g, 911, 36, 'denature', 'lbl');
      g = grp(svg, o, 'm72'); rect(g, 905, 124, 12, 142, 'merc', 6); circ(g, 911, 282, 13, 'merc'); T(g, 911, 36, 'extend', 'lbl');
      g = grp(svg, o, 'm55'); rect(g, 905, 176, 12, 90, 'merc', 6); circ(g, 911, 282, 13, 'merc'); T(g, 911, 36, 'anneal', 'lbl');
      g = grp(svg, o, 'm20'); rect(g, 905, 240, 12, 26, 'merc', 6); circ(g, 911, 282, 13, 'merc'); T(g, 911, 36, 'room temp.', 'lbl');
      // ingredients box
      g = grp(svg, o, 'ingr');
      box(g, 40, 300, 560, 118, ['in the tube: the template DNA (a few copies are enough)', 'two primers: short single-stranded DNA pieces, made by machine, about 20 bases each', 'dNTPs: the four nucleotides A, T, G, C, the building blocks of new DNA', 'Taq polymerase: a DNA polymerase that survives heat'], 'tbox', 'sm', 'start');
      T(g, 320, 290, 'goal: millions of copies of the target region, and of nothing else', 'lbl');
      // step labels
      g = grp(svg, o, 'lDen'); T(g, 500, 80, 'denaturation (94–98 °C): the heat breaks the hydrogen bonds between the bases, the two strands come apart', 'lbl');
      g = grp(svg, o, 'lAnn'); T(g, 500, 80, 'annealing (50–65 °C): cooling lets the primers find and pair with their matching sequence', 'lbl');
      g = grp(svg, o, 'lExt'); T(g, 500, 80, 'extension (72 °C): Taq polymerase starts at the 3′ end of each primer and adds nucleotides, 5′ → 3′', 'lbl');
      // cycle counters and products
      g = grp(svg, o, 'cyc1'); T(g, 40, 36, 'cycle 1: 1 copy → 2 copies', 'lbl', 'start');
      g = grp(svg, o, 'cyc2'); T(g, 40, 36, 'cycle 2: 2 → 4 copies', 'lbl', 'start');
      g = grp(svg, o, 'cyc3'); T(g, 40, 36, 'cycle 3: 4 → 8 copies', 'lbl', 'start');
      g = grp(svg, o, 'cyc20'); T(g, 40, 36, 'cycle 20: 2²⁰ = 1 048 576 copies', 'lbl', 'start');
      g = grp(svg, o, 'prod1'); copies(g, 2, 250, true); T(g, 500, 292, 'two double-stranded copies (each: one old strand + one new strand, still with a long tail)', 'sm');
      g = grp(svg, o, 'prod2'); copies(g, 4, 250, true); T(g, 500, 292, 'four copies; two of them are now exactly the target (primer to primer)', 'sm');
      g = grp(svg, o, 'prod3'); copies(g, 8, 250, true); T(g, 500, 292, 'eight copies; only the two with an old strand still carry a tail, all the others are exactly the target', 'sm');
      g = grp(svg, o, 'machine');
      rect(g, 80, 120, 440, 160, 'machb', 14); rect(g, 110, 150, 380, 70, 'machd', 8);
      [0, 1, 2, 3, 4, 5, 6, 7].forEach(function (k) { circ(g, 140 + k * 46, 185, 12, 'well'); });
      T(g, 300, 250, 'thermocycler: a machine that repeats the three temperatures 20 to 40 times', 'sm');
      T(g, 300, 268, 'one cycle takes a few minutes; the whole run about one to two hours', 'sm');
      g = grp(svg, o, 'ltaq');
      box(g, 560, 120, 400, 160, ['Taq = DNA polymerase of Thermus aquaticus,', 'a bacterium from hot springs.', 'It survives the 94–98 °C step; an ordinary', 'polymerase would be destroyed in every cycle,', 'and you would have to add new enzyme 30 times.', 'Taq does need a primer and a free 3′ OH, like', 'every DNA polymerase (BIO01 chapter 4).'], 'tbox', 'sm');
      g = grp(svg, o, 'traps');
      box(g, 60, 60, 880, 300, ['Things that can go wrong', '1 · a primer pairs with a similar sequence somewhere else → the wrong piece is copied; design primers with care (software)', '2 · Taq makes a copying mistake (misincorporation) → if it happens in an early cycle, the error is copied into millions of products', '3 · long targets (more than 4000 to 5000 base pairs) need special polymerases and conditions', 'Used on purpose: with unusual salt or nucleotide ratios Taq makes more errors → a collection of random mutants for genetic screens', 'Uses: more DNA from a tiny sample (old bones, a crime scene, a dodo skin), the first step of cloning, detecting a virus (qPCR)'], 'tbox', 'sm');
      // reverse transcription
      g = grp(svg, o, 'mrna');
      path(g, 'M160 150 q 20 -14 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0 t 40 0', 'rnaw');
      circ(g, 150, 150, 8, 'capc'); T(g, 150, 128, 'cap', 'sm'); T(g, 640, 154, 'AAAAAAA', 'sm', 'start'); T(g, 680, 132, 'poly-A tail', 'sm');
      T(g, 400, 118, 'mRNA: the message copied from a gene, introns already cut out (BIO01 chapter 5)', 'lbl');
      g = grp(svg, o, 'lrt0'); T(g, 500, 300, 'goal: a DNA version of this mRNA, because PCR, cloning and sequencing all work on DNA', 'lbl');
      T(g, 500, 320, 'a short primer pairs with the poly-A tail, and a DNA polymerase needs a primer', 'sm');
      g = grp(svg, o, 'rt'); blob(g, 0, 0, 30, 16, 'rtb', 'RT');
      g = grp(svg, o, 'cd1'); rect(g, 160, 170, 480, 10, 'newd', 4); T(g, 400, 204, 'first DNA strand = cDNA (complementary DNA), written by reverse transcriptase, base by base, against the RNA', 'sm');
      g = grp(svg, o, 'rnaX'); line(g, 160, 136, 640, 164, 'xmark'); T(g, 400, 100, 'the RNA strand is broken down by an enzyme', 'lbl');
      g = grp(svg, o, 'cd2'); rect(g, 160, 150, 480, 10, 'newd', 4); for (var q = 168; q < 640; q += 14) line(g, q, 160, q, 170, 'bp');
      T(g, 400, 240, 'DNA polymerase builds the second strand → double-stranded cDNA, with no introns', 'lbl');
      T(g, 400, 262, 'now PCR can amplify it, or it goes into a plasmid (cDNA library), or it is sequenced (RNA-seq)', 'sm');
      return o;
    },
    init: { vis: 'sT,sB,bps,ltmpl,therm,m20,ingr', sep: 0, fx: 240, fy: 238, rx: 560, ry: 112, cam: 500 },
    layout: function (P) {
      var st = base(Opc);
      on(st, Opc, P.vis);
      if (st.sT.o) st.sT.y = P.sep ? -40 : 0;
      if (st.sB.o) st.sB.y = P.sep ? 40 : 0;
      if (st.taqF.o) { st.taqF.x = P.fx; st.taqF.y = P.fy; }
      if (st.taqR.o) { st.taqR.x = P.rx; st.taqR.y = P.ry; }
      if (st.rt.o) { st.rt.x = P.rx; st.rt.y = P.ry; }
      st._cam = { x: P.cam };
      return st;
    },
    steps: [
      { title: 'Begin state: what is in the tube',
        en: 'PCR, the <b>polymerase chain reaction</b>, makes millions of copies of one chosen piece of DNA. We start with a few copies of the template DNA, two <b>primers</b> (short single-stranded DNA pieces of about 20 bases, made by a machine), the four <b>nucleotides</b> (dNTPs, the building blocks) and a heat-proof <b>DNA polymerase</b>. Goal: copy only the orange target region, over and over.',
        nl: 'PCR maakt miljoenen kopieën van één gekozen stuk DNA. In het buisje: wat template-DNA, twee primers (korte stukjes enkelstrengs DNA, ongeveer 20 basen), de vier nucleotiden en een hittebestendige DNA-polymerase. Doel: alleen het oranje doelgebied kopiëren.',
        f: [{ vis: 'sT,sB,bps,ltmpl,therm,m20,ingr', sep: 0 }] },
      { title: 'Step 1 of a cycle: denaturation at 94–98 °C',
        en: 'The tube is heated to 94–98 °C. The heat breaks the hydrogen bonds between the paired bases (BIO01 chapter 3), so the double helix falls apart into two single strands. Nothing is copied yet; the strands are just made available.',
        nl: 'Verhitten tot 94–98 °C: de waterstofbruggen tussen de basen breken, de dubbele helix valt uiteen in twee enkele strengen.',
        f: [{ vis: 'sT,sB,therm,m94,lDen', sep: 1 }] },
      { title: 'Step 2: annealing at 50–65 °C',
        en: 'The tube cools to 50–65 °C. Now the primers can <b>anneal</b> (pair up) with their matching sequence: primer 1 pairs with the 3′ end of the target on the bottom strand, primer 2 with the 3′ end of the target on the top strand. The primers set the <b>boundaries</b> of what will be copied.',
        nl: 'Afkoelen tot 50–65 °C: de primers binden (annealen) op hun passende plek, elk aan het 3′-einde van het doelgebied op één streng. De primers bepalen de grenzen van wat gekopieerd wordt.',
        f: [{ vis: 'sT,sB,therm,m55,lAnn,pF,pR,lprim', sep: 1 }] },
      { title: 'Step 3: extension at 72 °C',
        en: 'At 72 °C the <b>Taq polymerase</b> grabs the 3′ end of each primer and adds nucleotides one by one, reading the old strand as a template, always in the 5′ → 3′ direction (BIO01 chapter 4: a DNA polymerase needs a primer with a free 3′ OH). Each old strand now has a new partner strand.',
        nl: 'Bij 72 °C zet Taq-polymerase nucleotiden achter het 3′-einde van elke primer, 5′ → 3′, met de oude streng als mal. Elke oude streng heeft nu een nieuwe partner.',
        f: [{ vis: 'sT,sB,therm,m72,lExt,pF,pR,taqF,taqR', sep: 1, fx: 340, fy: 240, rx: 460, ry: 110 }, { vis: 'sT,sB,therm,m72,lExt,pF,pR,taqF,taqR,nF,nR', fx: 520, fy: 240, rx: 290, ry: 110 }] },
      { title: 'End of cycle 1: two copies',
        en: 'After one cycle (denature, anneal, extend) there are <b>two</b> double-stranded copies instead of one. Each new strand started at a primer, so it begins exactly at the target, but it ran on past the other end: the copies still carry a tail of unwanted DNA.',
        nl: 'Na één cyclus: twee dubbelstrengs kopieën. Elke nieuwe streng begint precies bij een primer, maar loopt nog door voorbij het andere einde: er hangt nog een staart aan.',
        f: [{ vis: 'therm,m20,cyc1,prod1', sep: 0 }] },
      { title: 'Cycle 2: four copies',
        en: 'The same three temperatures are repeated. Every strand, old and new, is used as a template, so the number of copies <b>doubles</b> again: four. Two of these four are now exactly the target region, from primer to primer, because a new strand that started at primer 1 was copied up to primer 2.',
        nl: 'Dezelfde drie temperaturen: elke streng dient als mal, het aantal verdubbelt: vier. Twee ervan zijn nu precies het doelgebied, van primer tot primer.',
        f: [{ vis: 'therm,m94,cyc2', sep: 0 }, { vis: 'therm,m55,cyc2' }, { vis: 'therm,m72,cyc2,prod2' }] },
      { title: 'Cycle 3 and on: the target takes over',
        en: 'Cycle 3 gives eight copies. From now on nearly all products are exactly the piece between the two primers; only the few strands copied directly from the original template still have a tail. The doubling continues: 16, 32, 64 ...',
        nl: 'Cyclus 3: acht kopieën. Vanaf nu zijn bijna alle producten precies het stuk tussen de twee primers. Het verdubbelen gaat door: 16, 32, 64 ...',
        f: [{ vis: 'therm,m94,cyc3', sep: 0 }, { vis: 'therm,m72,cyc3,prod3' }] },
      { title: 'Twenty cycles in a thermocycler',
        en: 'A <b>thermocycler</b> is a machine that switches the tube between the three temperatures automatically, 20 to 40 times. Twenty doublings make 2²⁰, more than a <b>million</b> copies from one starting molecule, in a couple of hours. That is why PCR can work from a tiny sample: a drop of blood, a 400-year-old dodo skin.',
        nl: 'Een thermocycler wisselt automatisch tussen de drie temperaturen, 20 tot 40 keer. Twintig verdubbelingen = 2²⁰, meer dan een miljoen kopieën uit één molecuul, in een paar uur.',
        f: [{ vis: 'therm,m94,cyc20,machine', sep: 0 }, { vis: 'therm,m55,cyc20,machine' }, { vis: 'therm,m72,cyc20,machine' }] },
      { title: 'Why Taq: a polymerase that survives boiling',
        en: 'The polymerase has to live through the 94–98 °C step in every cycle. Our own enzymes would unfold and die. <b>Taq</b> comes from <i>Thermus aquaticus</i>, a bacterium that lives in hot springs, so its polymerase is built for heat. It still obeys the rules of every DNA polymerase: it needs a primer, and it adds only to a free 3′ OH end.',
        nl: 'De polymerase moet elke cyclus 94–98 °C overleven. Taq komt van Thermus aquaticus, een bacterie uit warmwaterbronnen. Ze volgt dezelfde regels als elke DNA-polymerase: een primer en een vrij 3′-OH-einde.',
        f: [{ vis: 'therm,m94,machine,ltaq', sep: 0 }] },
      { title: 'What can go wrong, and what PCR is used for',
        en: 'Three caveats from the syllabus: a primer can pair with a similar sequence elsewhere and copy the wrong piece; a copying mistake made early is amplified into millions of products; and long targets (over 4000 to 5000 base pairs) need special enzymes. The error-making can even be used on purpose, to make random mutants. The exam asks what you add for PCR: nucleotides, primers and polymerase.',
        nl: 'Valkuilen: een primer die ergens anders bindt, een vroege kopieerfout die vermenigvuldigd wordt, en lange stukken (meer dan 4000 tot 5000 basenparen). Examen: voor PCR voeg je nucleotiden, primers en polymerase toe.',
        f: [{ vis: 'traps', sep: 0 }] },
      { title: 'Reverse transcription, begin state: an mRNA',
        en: 'Sometimes the molecule we want to copy or sequence is an <b>mRNA</b>, not DNA. PCR only works on DNA. So we first make a DNA copy of the RNA. The mRNA already has its introns removed, a cap at the front and a <b>poly-A tail</b> (a row of A nucleotides) at the end, which is handy: a short primer of T nucleotides can pair with it.',
        nl: 'Soms willen we een mRNA kopiëren, maar PCR werkt alleen op DNA. Eerst maken we dus een DNA-kopie van het RNA. Het mRNA heeft al geen introns meer en een poly-A-staart, waar een primer van T-nucleotiden op past.',
        f: [{ vis: 'mrna,lrt0', sep: 0 }] },
      { title: 'Reverse transcriptase writes DNA from RNA',
        en: '<b>Reverse transcriptase</b> (RT) is the enzyme that retroviruses such as HIV use (chapter 3): it reads RNA and writes a matching DNA strand, the opposite of the normal direction. Starting at the primer it builds the first DNA strand along the whole mRNA. This DNA copy is called <b>cDNA</b>, complementary DNA.',
        nl: 'Reverse transcriptase, het enzym van retrovirussen zoals HIV, leest RNA en schrijft er een passende DNA-streng tegenover: de omgekeerde richting. Die DNA-kopie heet cDNA (complementair DNA).',
        f: [{ vis: 'mrna,rt', rx: 150, ry: 160 }, { vis: 'mrna,rt,cd1', rx: 590, ry: 160 }] },
      { title: 'Second strand: double-stranded cDNA, ready for PCR',
        en: 'The RNA strand is then broken down by an enzyme, and an ordinary DNA polymerase builds the second strand. The result is double-stranded cDNA: the gene <b>without its introns</b>, exactly as it was expressed. Now PCR can amplify it (this combination is RT-PCR), it can be cloned into a plasmid, or sequenced in bulk (RNA-seq, page 4.11).',
        nl: 'Het RNA wordt afgebroken en een gewone DNA-polymerase maakt de tweede streng: dubbelstrengs cDNA, het gen zonder introns. Daarna kan PCR het vermenigvuldigen (RT-PCR), of het gaat in een plasmide, of het wordt gesequencet.',
        f: [{ vis: 'mrna,cd1,rnaX' }, { vis: 'cd1,cd2' }] }
    ]
  };

  /* =================================================================
     Scene 2: cloning a gene into a plasmid
     ================================================================= */
  var Ocl = {};
  var PCX = 262, PCY = 240, PR = 95;
  function arc(cx, cy, r, a1, a2) {
    var s = Math.PI / 180, x1 = cx + r * Math.cos(a1 * s), y1 = cy + r * Math.sin(a1 * s), x2 = cx + r * Math.cos(a2 * s), y2 = cy + r * Math.sin(a2 * s);
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'A' + r + ' ' + r + ' 0 ' + (a2 - a1 > 180 ? 1 : 0) + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  }
  function sticky(g, x, y, dir) {
    // a sticky end: the strand that sticks out (AATT) at the end of a duplex
    rect(g, dir > 0 ? x : x - 26, dir > 0 ? y : y + 11, 26, 7, 'ovh', 2);
    T(g, dir > 0 ? x + 13 : x - 13, dir > 0 ? y - 6 : y + 32, 'AATT', 'tiny');
  }
  var sceneClo = {
    VW: 1000, VH: 440, NW: 760, aria: 'Animation of cloning a DNA fragment into a plasmid',
    legend: [['--plas', 'plasmid (vector)'], ['--ori', 'origin of replication'], ['--ampr', 'ampR gene (ampicillin resistance = selectable marker)'], ['--ins', 'the insert (our gene)'], ['--ovh', 'sticky end (single-stranded overhang)'], ['--enz', 'enzyme'], ['--cell', 'E. coli cell']],
    build: function (svg) {
      var o = Ocl = {}, g;
      marker(svg, 'arr_cl');
      txt(svg, 988, 432, 'wm', 'simplified, not to scale', 'end');
      // plasmid, whole
      g = grp(svg, o, 'plas'); circ(g, PCX, PCY, PR, 'plas');
      path(g, arc(PCX, PCY, PR, 150, 200), 'ori'); T(g, 156, 220, 'ori', 'lbl', 'end'); T(g, 156, 236, 'origin of replication:', 'sm', 'end'); T(g, 156, 250, 'it copies itself', 'sm', 'end');
      path(g, arc(PCX, PCY, PR, 20, 90), 'ampr'); T(g, 362, 330, 'ampR', 'lbl', 'start'); T(g, 362, 346, 'gene for resistance to the', 'sm', 'start'); T(g, 362, 360, 'antibiotic ampicillin', 'sm', 'start');
      rect(g, PCX - 8, PCY - PR - 6, 16, 12, 'site', 3); T(g, PCX, PCY - PR - 16, 'one EcoRI site: GAATTC', 'sm');
      T(g, PCX, 400, 'plasmid: a small circle of double-stranded DNA from bacteria,', 'sm'); T(g, PCX, 416, 'used as a vector (a carrier) for our gene', 'sm');
      // insert
      g = grp(svg, o, 'ins'); duplex(g, 580, 120, 240, 'ins'); T(g, 700, 100, 'the insert: our gene, copied by PCR', 'lbl');
      T(g, 580, 160, 'GAATTC', 'tiny', 'start'); T(g, 820, 160, 'GAATTC', 'tiny', 'end');
      T(g, 700, 180, 'the PCR primers carried a GAATTC site at each end', 'sm');
      // EcoRI zoom
      g = grp(svg, o, 'zoom');
      rect(g, 540, 200, 420, 166, 'tbox', 10);
      T(g, 750, 224, 'EcoRI, a restriction enzyme from E. coli, recognises GAATTC', 'lbl');
      T(g, 600, 258, '5′', 'sm', 'end'); T(g, 900, 258, '3′', 'sm', 'start');
      'G A A T T C'.split(' ').forEach(function (b, k) { T(g, 620 + k * 44, 258, b, 'seq'); });
      T(g, 600, 292, '3′', 'sm', 'end'); T(g, 900, 292, '5′', 'sm', 'start');
      'C T T A A G'.split(' ').forEach(function (b, k) { T(g, 620 + k * 44, 292, b, 'seq'); });
      line(g, 642, 236, 642, 266, 'cutl'); line(g, 862, 282, 862, 312, 'cutl');
      T(g, 750, 332, 'read 5′ → 3′, both strands say GAATTC: a palindrome', 'sm'); T(g, 750, 350, 'both strands are cut after the G (red lines)', 'sm');
      g = grp(svg, o, 'ecori'); blob(g, 0, 0, 34, 16, 'enz', 'EcoRI');
      // cut insert with sticky ends
      g = grp(svg, o, 'insCut'); duplex(g, 606, 120, 188, 'ins'); sticky(g, 606, 120, -1); sticky(g, 794, 120, 1);
      T(g, 700, 100, 'the insert now has sticky ends', 'lbl');
      T(g, 700, 180, 'the cut is staggered: each end has a single-stranded 5′ overhang, AATT', 'sm');
      // open plasmid
      g = grp(svg, o, 'plasOpen'); path(g, arc(PCX, PCY, PR, -72, 252), 'plas');
      path(g, arc(PCX, PCY, PR, 150, 200), 'ori'); path(g, arc(PCX, PCY, PR, 20, 90), 'ampr');
      rect(g, PCX - 60, PCY - PR - 4, 26, 7, 'ovh', 2); rect(g, PCX + 34, PCY - PR + 8, 26, 7, 'ovh', 2);
      T(g, PCX, PCY - PR - 20, 'cut open with the same enzyme: the same AATT ends', 'sm');
      // recombinant
      g = grp(svg, o, 'rec'); circ(g, PCX, PCY, PR, 'plas'); path(g, arc(PCX, PCY, PR, -130, -50), 'insarc');
      path(g, arc(PCX, PCY, PR, 150, 200), 'ori'); path(g, arc(PCX, PCY, PR, 20, 90), 'ampr');
      T(g, PCX, PCY - PR - 20, 'recombinant plasmid: vector + insert', 'lbl');
      g = grp(svg, o, 'lanneal'); T(g, 560, 120, 'the AATT ends of the insert pair (anneal) with', 'sm', 'start'); T(g, 560, 136, 'the AATT ends of the plasmid: only base pairs,', 'sm', 'start'); T(g, 560, 152, 'the backbone still has two breaks (nicks)', 'sm', 'start');
      g = grp(svg, o, 'lig'); blob(g, PCX, PCY - PR, 34, 16, 'enz', 'ligase'); T(g, 560, 120, 'DNA ligase seals the backbone (BIO01 chapter 4):', 'sm', 'start'); T(g, 560, 136, 'the sugar-phosphate chain is joined, the insert is', 'sm', 'start'); T(g, 560, 152, 'now a permanent part of the circle', 'sm', 'start');
      // bacteria
      g = grp(svg, o, 'ecoli');
      [[620, 300], [720, 320], [820, 296]].forEach(function (p) { el('ellipse', { cx: p[0], cy: p[1], rx: 38, ry: 16, 'class': 'cell' }, g); });
      T(g, 720, 360, 'E. coli bacteria, made competent (able to take up DNA)', 'sm'); T(g, 720, 376, 'by a salt treatment or a short electric shock', 'sm');
      g = grp(svg, o, 'ecoliP'); [[620, 300], [720, 320], [820, 296]].forEach(function (p, k) { if (k === 1) circ(g, p[0] + 10, p[1], 8, 'plasS'); });
      T(g, 720, 260, 'transformation: a few cells take the plasmid in; most do not', 'lbl');
      // plate
      g = grp(svg, o, 'plate'); circ(g, 700, 230, 110, 'plate'); T(g, 700, 362, 'agar plate with ampicillin', 'lbl'); T(g, 700, 378, 'ampicillin kills E. coli, unless the cell has the ampR gene', 'sm');
      g = grp(svg, o, 'dead'); [[640, 180], [760, 270], [690, 300], [750, 160]].forEach(function (p) { line(g, p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5, 'xs'); line(g, p[0] - 5, p[1] + 5, p[0] + 5, p[1] - 5, 'xs'); });
      T(g, 700, 100, 'cells without a plasmid die', 'sm');
      g = grp(svg, o, 'cols'); [[660, 210], [720, 190], [740, 250], [670, 270]].forEach(function (p) { circ(g, p[0], p[1], 9, 'colony'); });
      T(g, 700, 84, 'each colony = millions of identical cells from one survivor', 'sm');
      T(g, 700, 100, '= a clone, each carrying the recombinant plasmid', 'sm');
      // replication inside a cell
      g = grp(svg, o, 'rep'); el('ellipse', { cx: 720, cy: 230, rx: 120, ry: 60, 'class': 'cell' }, g);
      path(g, 'M620 230 q 30 -30 60 0 t 60 0 t 60 0 t 60 0', 'chromw');
      [[660, 262], [700, 205], [760, 262], [800, 205], [730, 268]].forEach(function (p) { circ(g, p[0], p[1], 9, 'plasS'); });
      T(g, 720, 320, 'inside the cell the plasmid copies itself from its own ori, independent of the chromosome', 'sm');
      T(g, 720, 336, '(wavy line); every time the cell divides, both daughters get copies', 'sm');
      g = grp(svg, o, 'uses');
      box(g, 60, 60, 880, 300, ['What you can do with a cloned gene', '• grow litres of bacteria → cut the insert out again with EcoRI, or sequence it', '• make a library: thousands of plasmids, each with a different fragment (genomic or cDNA library)', '• fuse the gene to a reporter such as GFP (green fluorescent protein) or to a short tag, to see or purify the protein', '• put a strong promoter in front → the bacteria make lots of the protein (this is how human insulin is made in E. coli)', '• test whether the gene repairs a mutant (complementation), or change it on purpose (mutagenesis)', '', 'Sizes: a plasmid takes inserts up to about 15 kb; a BAC (bacterial artificial chromosome) hundreds of kb'], 'tbox', 'sm', 'start');
      g = grp(svg, o, 'sum');
      box(g, 60, 60, 880, 300, ['Cloning by ligation, the steps in order', '1 · amplify the insert by PCR, with primers that carry a restriction site', '2 · cut insert and vector with the same restriction enzyme → matching sticky ends', '3 · mix: the sticky ends anneal (base-pair)', '4 · DNA ligase seals the backbone → recombinant plasmid', '5 · transformation: competent E. coli take up the plasmid', '6 · plate on agar with the antibiotic: only cells with the plasmid (selectable marker) grow', '7 · pick a colony: a clone; the plasmid replicates from its ori'], 'tbox', 'sm', 'start');
      T(g, 500, 400, 'exam trap: DNA ligase joins, it never cuts; cutting is the job of restriction enzymes', 'lbl red');
      return o;
    },
    init: { vis: 'plas,ins', ex: 700, ey: 60, cam: 500 },
    layout: function (P) {
      var st = base(Ocl);
      on(st, Ocl, P.vis);
      if (st.ecori.o) { st.ecori.x = P.ex; st.ecori.y = P.ey; }
      st._cam = { x: P.cam };
      return st;
    },
    steps: [
      { title: 'Begin state: a vector and an insert',
        en: 'Cloning a gene means putting it into a <b>vector</b>, a DNA carrier that bacteria will copy, so that we get as much of it as we want. The vector here is a <b>plasmid</b>: a small circle of double-stranded DNA with an <b>origin of replication</b> (so it copies itself), a <b>selectable marker</b> (a gene for resistance to the antibiotic ampicillin) and a single cutting site. The <b>insert</b> is our gene, made by PCR. Goal: a bacterium that carries the gene and multiplies it.',
        nl: 'Klonen = een gen in een vector stoppen, een drager die bacteriën kopiëren. De vector is een plasmide: een cirkeltje DNA met een replicatie-oorsprong (ori), een selectiemerker (resistentie tegen ampicilline) en één knipplaats. Het insert is ons gen, gemaakt met PCR.',
        f: [{ vis: 'plas,ins' }] },
      { title: 'The restriction enzyme EcoRI recognises GAATTC',
        en: 'A <b>restriction enzyme</b> is a bacterial protein that cuts double-stranded DNA at one specific short sequence (4 to 8 base pairs). Bacteria use them against foreign DNA; we use them as scissors. EcoRI cuts at GAATTC. Read 5′ → 3′, both strands say GAATTC: the site is a <b>palindrome</b>. There are hundreds of such enzymes, each with its own site.',
        nl: 'Een restrictie-enzym is een bacterieel eiwit dat DNA knipt op één korte, specifieke volgorde (4 tot 8 basenparen). EcoRI knipt bij GAATTC; beide strengen lezen 5′ → 3′ hetzelfde: een palindroom.',
        f: [{ vis: 'plas,ins,zoom,ecori', ex: 700, ey: 60 }] },
      { title: 'A staggered cut makes sticky ends',
        en: 'EcoRI cuts each strand right after the G, but the two cuts are not opposite each other. So each new end has four unpaired bases sticking out, AATT, a <b>5′ overhang</b>. Such ends are called <b>sticky ends</b>, because any other AATT overhang can pair with them. (Other enzymes make 3′ overhangs or blunt ends.)',
        nl: 'EcoRI knipt elke streng net na de G, maar de twee knippen liggen verschoven. Elk einde heeft vier ongepaarde basen die uitsteken, AATT: een 5′-overhang, een plakkerig (sticky) uiteinde.',
        f: [{ vis: 'plas,insCut,zoom,ecori', ex: 700, ey: 60 }] },
      { title: 'Cut the plasmid with the same enzyme',
        en: 'The plasmid has exactly one EcoRI site, so one cut opens the circle into a line with the same AATT sticky ends. Because insert and vector were cut by the <b>same</b> enzyme, their ends are <b>complementary</b>: they fit.',
        nl: 'De plasmide heeft precies één EcoRI-plaats: één knip opent de cirkel, met dezelfde AATT-einden. Omdat insert en vector met hetzelfde enzym geknipt zijn, passen hun einden op elkaar.',
        f: [{ vis: 'plasOpen,insCut,ecori', ex: 400, ey: 90 }] },
      { title: 'Mix: the sticky ends anneal',
        en: 'Insert and opened plasmid are mixed. The AATT overhang of the insert base-pairs with the AATT overhang of the plasmid: the insert sits in the gap, held only by hydrogen bonds. The sugar-phosphate backbone still has two breaks (nicks) on each side.',
        nl: 'Insert en open plasmide worden gemengd. De AATT-overhangen paren met elkaar: het insert zit in de opening, alleen door waterstofbruggen vastgehouden. De ruggengraat heeft nog breuken (nicks).',
        f: [{ vis: 'plasOpen,insCut' }, { vis: 'rec,lanneal' }] },
      { title: 'DNA ligase seals the backbone',
        en: '<b>DNA ligase</b> is the enzyme that joins the sugar-phosphate backbone (in replication it joins the Okazaki fragments, BIO01 chapter 4). It closes the nicks, and the insert is now a permanent part of the circle: a <b>recombinant plasmid</b>. Remember: ligase joins, it never cuts.',
        nl: 'DNA-ligase is het enzym dat de suiker-fosfaatruggengraat aan elkaar zet. Het dicht de breuken: het insert is nu een vast deel van de cirkel, een recombinant plasmide. Ligase plakt, knipt nooit.',
        f: [{ vis: 'rec,lig' }] },
      { title: 'Transformation: bacteria take the plasmid up',
        en: 'E. coli cells do not take up DNA by themselves. A salt treatment or a short electric shock makes them <b>competent</b> (able to let DNA in). The plasmids are added; this is <b>transformation</b>. Only a small fraction of the cells actually gets a plasmid.',
        nl: 'E. coli neemt niet zomaar DNA op. Een zoutbehandeling of een korte elektrische schok maakt de cellen competent. Plasmiden erbij: transformatie. Slechts een klein deel van de cellen krijgt er een.',
        f: [{ vis: 'rec,ecoli' }, { vis: 'rec,ecoli,ecoliP' }] },
      { title: 'Selection on ampicillin',
        en: 'How do we find the few cells with a plasmid? We spread all cells on an agar plate that contains <b>ampicillin</b>. The antibiotic kills E. coli, except cells that carry the plasmid with its <b>ampR</b> gene: that is why the gene is called a <b>selectable marker</b>. Cells without the plasmid simply die.',
        nl: 'Hoe vind je de cellen met een plasmide? Alle cellen op een agarplaat met ampicilline. Het antibioticum doodt E. coli, behalve cellen met de plasmide en haar ampR-gen: de selectiemerker. Cellen zonder plasmide sterven.',
        f: [{ vis: 'plate,dead' }] },
      { title: 'Colonies: every colony is a clone',
        en: 'Overnight each surviving cell divides into millions: a visible <b>colony</b>. All cells in one colony are identical descendants of one founder: a <b>clone</b>, and each of them carries the recombinant plasmid. Pick a colony, grow it in liquid medium, and you have as much of the gene as you like.',
        nl: 'Elke overlevende cel deelt tot miljoenen cellen: een kolonie. Alle cellen van één kolonie zijn identieke nakomelingen van één stichter: een kloon, elk met het recombinante plasmide.',
        f: [{ vis: 'plate,cols' }] },
      { title: 'The plasmid replicates on its own',
        en: 'Inside the cell the plasmid copies itself from its own <b>origin of replication</b>, independent of the bacterial chromosome, and every daughter cell gets copies. That is what makes it a vector: our gene is multiplied together with it.',
        nl: 'In de cel kopieert het plasmide zichzelf vanaf zijn eigen ori, los van het bacteriële chromosoom, en elke dochtercel krijgt kopieën. Daarom is het een vector: ons gen wordt mee vermenigvuldigd.',
        f: [{ vis: 'rep' }] },
      { title: 'What you can do with a cloned gene',
        en: 'With the gene in a plasmid you can cut it out again, sequence it, build a <b>library</b> (thousands of plasmids each with a different fragment), fuse it to a <b>reporter</b> such as GFP or to a tag, or put a strong <b>promoter</b> in front so the bacteria make lots of the protein: that is how human insulin is produced in E. coli.',
        nl: 'Met het gen in een plasmide kun je het weer uitknippen, sequencen, een bibliotheek maken, het aan een reporter zoals GFP of een tag koppelen, of er een sterke promotor voor zetten zodat de bacterie veel eiwit maakt (zo wordt insuline gemaakt).',
        f: [{ vis: 'uses' }] },
      { title: 'Summary: cloning by ligation in seven steps',
        en: 'PCR the insert with sites at its ends; cut insert and vector with the same restriction enzyme; let the sticky ends anneal; seal with DNA ligase; transform competent E. coli; select on antibiotic; pick a colony. The exam trap: DNA ligase joins DNA, restriction enzymes cut it.',
        nl: 'PCR het insert; knip insert en vector met hetzelfde restrictie-enzym; laat de plakkerige einden paren; dicht met ligase; transformeer competente E. coli; selecteer op antibioticum; pik een kolonie. Valkuil: ligase plakt, restrictie-enzymen knippen.',
        f: [{ vis: 'sum' }] }
    ]
  };

  /* =================================================================
     Scene 3: sequencing: Sanger, shotgun, Illumina, Nanopore
     ================================================================= */
  var Osq = {};
  var BASECOL = { A: 'bA', C: 'bC', G: 'bG', T: 'bT' };
  var SEQ = 'ACGTTAGC'.split('');
  var sceneSeq = {
    VW: 1000, VH: 440, NW: 760, aria: 'Animation of DNA sequencing: Sanger, shotgun assembly, Illumina and Nanopore',
    legend: [['--dna', 'DNA strand'], ['--prim', 'primer'], ['--bA', 'A'], ['--bC', 'C'], ['--bG', 'G'], ['--bT', 'T'], ['--pol', 'DNA polymerase'], ['--adap', 'adapter'], ['--memb', 'membrane with a protein pore']],
    build: function (svg) {
      var o = Osq = {}, g, k;
      marker(svg, 'arr_sq');
      txt(svg, 988, 432, 'wm', 'simplified, not to scale', 'end');
      /* ---- Sanger ---- */
      g = grp(svg, o, 'tmpl'); rect(g, 100, 110, 520, 10, 'dna', 4); T(g, 90, 119, '3′', 'end', 'end'); T(g, 630, 119, '5′', 'end', 'start');
      T(g, 360, 96, 'template strand: the DNA whose sequence (order of bases) we want to read', 'sm');
      rect(g, 100, 124, 60, 10, 'prim', 4); T(g, 130, 150, 'primer', 'sm');
      g = grp(svg, o, 'ingr');
      box(g, 660, 60, 300, 130, ['in the tube, as in PCR:', 'template, primer, DNA polymerase,', 'the four dNTPs (normal nucleotides)', 'PLUS a little ddNTP of each base,', 'each carrying its own fluorescent colour'], 'tbox', 'sm');
      g = grp(svg, o, 'dd');
      box(g, 60, 180, 560, 150, ['dNTP: the sugar has a 3′ OH group, the hook on which the next nucleotide is attached', 'ddNTP (dideoxy): the 3′ OH is missing (just an H) → nothing can be attached after it', 'so a ddNTP is a chain terminator: the strand stops growing at that base', 'dNTPs are in excess, so the polymerase mostly builds on and only sometimes stops'], 'tbox', 'sm', 'start');
      rect(g, 660, 200, 120, 60, 'tbox', 8); T(g, 720, 222, 'dNTP', 'lbl'); T(g, 720, 244, '3′ OH ✓', 'sm');
      rect(g, 820, 200, 120, 60, 'tbox', 8); T(g, 880, 222, 'ddNTP', 'lbl'); T(g, 880, 244, '3′ H ✗ stop', 'sm');
      g = grp(svg, o, 'pol'); blob(g, 0, 0, 24, 13, 'pol', 'pol');
      g = grp(svg, o, 'ladder');
      T(g, 60, 176, 'products: every length, each ending in a coloured terminator', 'sm', 'start');
      SEQ.forEach(function (b, i) { var y = 190 + i * 20, w = 80 + i * 44; rect(g, 100, y, w, 8, 'newd', 3); rect(g, 100, y, 60, 8, 'prim', 3); circ(g, 100 + w + 7, y + 4, 6, BASECOL[b]); T(g, 100 + w + 20, y + 8, b, 'tiny', 'start'); });
      g = grp(svg, o, 'cap');
      rect(g, 700, 60, 28, 300, 'capt', 8); T(g, 714, 44, 'capillary', 'sm'); T(g, 714, 380, 'laser + detector', 'sm');
      SEQ.forEach(function (b, i) { rect(g, 704, 330 - i * 32, 20, 10, BASECOL[b], 3); });
      T(g, 760, 90, 'electrophoresis in a thin tube:', 'sm', 'start'); T(g, 760, 106, 'short pieces run fastest and pass', 'sm', 'start'); T(g, 760, 122, 'the laser first; it reads the colour', 'sm', 'start'); T(g, 760, 138, 'of the last base of each piece', 'sm', 'start');
      g = grp(svg, o, 'chrom');
      rect(g, 60, 360, 580, 70, 'tbox', 8); T(g, 70, 378, 'chromatogram (the read-out):', 'sm', 'start');
      SEQ.forEach(function (b, i) { var x = 130 + i * 60; path(g, 'M' + (x - 18) + ' 424 Q' + x + ' 380 ' + (x + 18) + ' 424', 'peak ' + BASECOL[b]); T(g, x, 416, b, 'lbl'); });
      T(g, 660, 400, '→ sequence A C G T T A G C ...', 'sm', 'start'); T(g, 660, 418, 'up to about 900 bases per reaction', 'sm', 'start');
      /* ---- shotgun ---- */
      g = grp(svg, o, 'gen'); rect(g, 60, 70, 880, 12, 'dna', 5); T(g, 500, 56, 'a whole genome (E. coli: 4.6 million base pairs; human: 3 billion): far too long to read in one go', 'sm');
      g = grp(svg, o, 'frags');
      [[60, 140, 180], [220, 120, 200], [300, 160, 150], [520, 140, 200], [640, 120, 190], [800, 160, 140], [700, 180, 220], [120, 200, 240], [400, 200, 160], [860, 200, 80]].forEach(function (f) { rect(g, f[0], f[1], f[2], 8, 'dna', 3); rect(g, f[0] - 6, f[1] - 1, 6, 10, 'adap', 2); rect(g, f[0] + f[2], f[1] - 1, 6, 10, 'adap', 2); });
      T(g, 500, 236, 'shotgun: the DNA is broken at random into millions of overlapping fragments; linkers (blue) are glued to the ends, PCR amplifies them, every fragment is sequenced', 'sm');
      g = grp(svg, o, 'reads');
      rect(g, 100, 270, 800, 10, 'ref', 4); T(g, 90, 279, 'reference', 'sm', 'end');
      [[100, 180, 0], [240, 200, 0], [420, 160, 0], [560, 220, 0], [760, 140, 0], [160, 200, 1], [340, 180, 1], [500, 200, 1], [680, 180, 1], [220, 160, 2], [460, 160, 2], [620, 200, 2], [300, 140, 3], [540, 160, 3], [380, 120, 4]].forEach(function (r) { rect(g, r[0], 292 + r[2] * 14, r[1], 9, 'read', 3); });
      T(g, 500, 380, 'the computer finds the overlaps and assembles the fragments; at the marked spot this base is in 5 reads: 5X coverage (depth)', 'sm');
      rect(g, 402, 264, 14, 104, 'hlbox', 3);
      T(g, 500, 400, 'over-sequencing: about 8 genome equivalents to cover 99.9 % (E. coli: 37 million base pairs read); repeats are the hard parts', 'sm');
      /* ---- Illumina ---- */
      g = grp(svg, o, 'surf'); line(g, 80, 330, 920, 330, 'glass'); for (k = 100; k <= 900; k += 16) line(g, k, 330, k, 312, 'lawn');
      T(g, 500, 356, 'a glass surface covered with a lawn of short DNA primers (two kinds), bound at their lower ends', 'sm');
      g = grp(svg, o, 'frag1'); rect(g, 296, 180, 8, 132, 'dna', 3); rect(g, 296, 170, 8, 12, 'adap', 2); rect(g, 296, 300, 8, 12, 'adap', 2);
      T(g, 320, 190, 'one single-stranded fragment, with an adapter (blue) at each end,', 'sm', 'start'); T(g, 320, 206, 'has paired with a primer of the lawn by its lower adapter', 'sm', 'start');
      g = grp(svg, o, 'bridge'); path(g, 'M300 312 C 300 200 364 200 364 312', 'bridgew'); rect(g, 358, 300, 8, 12, 'adap', 2);
      T(g, 420, 230, 'the free upper adapter bends over and pairs with', 'sm', 'start'); T(g, 420, 246, 'a neighbouring primer: a bridge; a polymerase copies', 'sm', 'start'); T(g, 420, 262, 'it, the bridge is split, and this repeats many times', 'sm', 'start');
      g = grp(svg, o, 'cluster'); for (k = 0; k < 14; k++) rect(g, 240 + k * 12, 200 + (k % 3) * 10, 6, 112 - (k % 3) * 10, 'dna', 2);
      g = grp(svg, o, 'lclu');
      T(g, 500, 180, 'bridge amplification → a cluster: about a thousand identical copies in one tiny spot, bright enough to see', 'sm');
      T(g, 500, 160, 'millions of such clusters, each from a different fragment, cover the surface', 'sm');
      g = grp(svg, o, 'cyc');
      rect(g, 500, 100, 8, 212, 'dna', 3); rect(g, 500, 300, 8, 12, 'adap', 2);
      rect(g, 512, 230, 8, 82, 'newd', 3); T(g, 540, 300, '← new strand growing on a primer', 'sm', 'start');
      circ(g, 516, 220, 7, 'bA'); rect(g, 509, 206, 14, 8, 'blk', 2); T(g, 540, 224, '← one fluorescent nucleotide added; its 3′ end is blocked (grey cap),', 'sm', 'start'); T(g, 540, 240, 'so only ONE base can go in per cycle (a reversible terminator)', 'sm', 'start');
      box(g, 60, 60, 420, 130, ['one cycle:', '1 add the four coloured, 3′-blocked nucleotides + polymerase', '2 wash away what did not bind', '3 laser + camera: read the colour of every cluster at once', '4 chemically remove the block and the dye → next cycle'], 'tbox', 'sm', 'start');
      T(g, 760, 100, 'camera sees millions', 'sm'); T(g, 760, 116, 'of clusters per image', 'sm');
      rect(g, 720, 130, 80, 50, 'cam', 8); circ(g, 760, 155, 14, 'lens');
      g = grp(svg, o, 'lread'); T(g, 500, 80, 'after 75 to 150 cycles: a read of 75–150 bases per cluster, millions of reads in parallel', 'lbl');
      T(g, 500, 100, 'short reads → more overlap needed → higher coverage for a good assembly; the ddNTP of Sanger stops for ever, the blocked nucleotide here is unblocked again', 'sm');
      /* ---- Nanopore ---- */
      g = grp(svg, o, 'memb'); rect(g, 80, 200, 400, 14, 'memb', 0); rect(g, 520, 200, 400, 14, 'memb', 0);
      el('ellipse', { cx: 500, cy: 207, rx: 34, ry: 22, 'class': 'pore' }, g); T(g, 500, 254, 'protein nanopore: a tiny hole in a membrane', 'sm');
      T(g, 150, 160, 'ions flow through the pore: a steady electric current', 'sm'); T(g, 150, 176, '(a voltage is applied across the membrane)', 'sm');
      g = grp(svg, o, 'dnaN'); path(g, 'M500 60 q 10 20 0 40 t 0 40 t 0 40 t 0 40 t 0 40 t 0 40 t 0 40', 'dnaw'); blob(g, 500, 90, 26, 14, 'motor', 'motor');
      T(g, 560, 94, 'a motor protein feeds the single strand through, base by base', 'sm', 'start');
      g = grp(svg, o, 'trace');
      rect(g, 560, 280, 380, 100, 'tbox', 8); T(g, 750, 300, 'current through the pore, over time', 'sm');
      path(g, 'M580 350 h30 v-20 h30 v12 h30 v-30 h30 v26 h30 v-14 h30 v30 h30 v-22 h30 v10 h30 v-26 h30 v16 h30', 'tracew');
      'G A T C A G T C'.split(' ').forEach(function (b, i) { T(g, 598 + i * 42, 372, b, 'tiny'); });
      T(g, 300, 300, 'each base blocks the current a little differently', 'lbl'); T(g, 300, 318, '(size and chemistry) → the pattern is decoded into bases', 'sm');
      g = grp(svg, o, 'lnano');
      box(g, 60, 330, 460, 100, ['no PCR, no colours: the DNA itself is read, in real time', 'very long reads (even a whole chromosome) → repeats and structural variants solved', 'reads RNA directly, and sees methylated bases', 'the MinION fits in a hand: sequencing in the field (pathogen outbreaks)'], 'tbox', 'sm', 'start');
      return o;
    },
    init: { vis: 'tmpl,ingr', px: 170, py: 129, cam: 500 },
    layout: function (P) {
      var st = base(Osq);
      on(st, Osq, P.vis);
      if (st.pol.o) { st.pol.x = P.px; st.pol.y = P.py; }
      st._cam = { x: P.cam };
      return st;
    },
    steps: [
      { title: 'Sanger sequencing, begin state',
        en: 'Sequencing means reading the <b>order of the bases</b> in a DNA molecule. The classic method is <b>chain-termination</b> or Sanger sequencing. In the tube: the template strand, a primer, DNA polymerase and the four normal nucleotides (dNTPs), exactly like one PCR extension. The trick is one extra ingredient: a small amount of special nucleotides, the <b>ddNTPs</b>.',
        nl: 'Sequencen = de volgorde van de basen lezen. De klassieke methode is Sanger- of ketenterminatie-sequencing. In het buisje: template, primer, DNA-polymerase en de vier normale nucleotiden, plus een beetje speciale nucleotiden, de ddNTP\'s.',
        f: [{ vis: 'tmpl,ingr' }] },
      { title: 'ddNTP: a nucleotide without the 3′ hook',
        en: 'A normal nucleotide (dNTP) has a 3′ OH group on its sugar: the hook on which the polymerase attaches the next nucleotide. A <b>dideoxy</b> nucleotide (ddNTP) lacks that OH. Once it is built in, nothing can follow: the chain <b>terminates</b>. Each of the four ddNTPs (ddA, ddC, ddG, ddT) carries its own fluorescent colour.',
        nl: 'Een normale nucleotide heeft een 3′-OH-groep: de haak voor de volgende nucleotide. Een dideoxy-nucleotide (ddNTP) mist die OH: eens ingebouwd, kan er niets meer volgen. Elk van de vier ddNTP\'s heeft zijn eigen fluorescerende kleur.',
        f: [{ vis: 'tmpl,dd' }] },
      { title: 'The polymerase builds, and stops at random',
        en: 'The polymerase starts at the primer and copies the template. Most of the time it picks a normal dNTP and goes on; now and then it picks a ddNTP and that copy <b>stops</b> right there. Because there are millions of template molecules, we get copies that stopped at every possible position, each ending in a coloured base.',
        nl: 'De polymerase start bij de primer. Meestal pakt ze een normale nucleotide en gaat door; af en toe een ddNTP, en die kopie stopt daar. Met miljoenen templates krijg je kopieën die op elke mogelijke positie stoppen, elk eindigend in een gekleurde base.',
        f: [{ vis: 'tmpl,pol', px: 170, py: 129 }, { vis: 'tmpl,pol', px: 420, py: 129 }, { vis: 'tmpl,ladder' }] },
      { title: 'Sorting by length in a capillary',
        en: 'The mixture is pushed through a thin gel-filled tube by an electric field (<b>capillary electrophoresis</b>): the shortest pieces move fastest and reach the end first. At the end a laser lights up each piece as it passes and a detector records the <b>colour of its last base</b>. Shortest first, so the colours come out in the order of the sequence.',
        nl: 'Het mengsel loopt door een dun buisje met gel (capillaire elektroforese): de kortste stukjes zijn het snelst. Een laser belicht elk stukje bij het passeren en een detector leest de kleur van de laatste base: de kleuren komen in volgorde van de sequentie.',
        f: [{ vis: 'ladder,cap' }] },
      { title: 'The chromatogram spells the sequence',
        en: 'The detector draws a <b>chromatogram</b>: a row of coloured peaks, one per base. Reading the peaks from left to right gives the sequence of the new strand (A C G T T A G C ...). One reaction reads up to about <b>900 bases</b>. Older versions used radioactive labels and four separate gel lanes, read from the bottom up.',
        nl: 'De detector tekent een chromatogram: gekleurde pieken, één per base. Van links naar rechts lees je de sequentie. Eén reactie leest tot ongeveer 900 basen. Vroeger: radioactief, vier gelbanen, van onder naar boven lezen.',
        f: [{ vis: 'ladder,cap,chrom' }] },
      { title: 'A whole genome: shotgun sequencing',
        en: '900 bases is nothing next to a genome (E. coli 4.6 million base pairs, human 3 billion). No method reads a chromosome end to end, so the genome is <b>shattered at random</b> into millions of overlapping fragments (<b>shotgun</b>), short linker sequences are glued on, PCR amplifies them, and every fragment is sequenced. At this point nobody knows where each piece came from.',
        nl: 'Een genoom is veel te lang. Het wordt willekeurig in miljoenen overlappende fragmenten gebroken (shotgun), er worden linkers aan geplakt, PCR vermenigvuldigt ze, en elk fragment wordt gesequencet. Niemand weet nog waar elk stuk vandaan komt.',
        f: [{ vis: 'gen' }, { vis: 'gen,frags' }] },
      { title: 'Assembly: the computer finds the overlaps',
        en: 'Fragments that share a stretch of sequence must come from the same place. A computer lines them up by their <b>overlaps</b> and joins them into the full sequence. When a <b>reference genome</b> already exists, new reads are simply mapped onto it.',
        nl: 'Fragmenten met dezelfde letters komen van dezelfde plek. Een computer legt ze op hun overlap en voegt ze samen. Bestaat er al een referentiegenoom, dan worden de reads daarop gelegd.',
        f: [{ vis: 'gen,reads' }] },
      { title: 'Over-sequencing and depth of coverage',
        en: 'Because fragments are random, many more bases are read than the genome holds: about <b>8 genome equivalents</b> for 99.9 % coverage (37 million base pairs for E. coli). This also catches sequencing errors, since each spot is read several times. The number of reads that cover one base is its <b>depth of coverage</b>: 5X means five reads. More depth means more confidence that a variant is real. Repeated sequences are the hard part: identical pieces cannot be placed.',
        nl: 'Omdat fragmenten willekeurig zijn, lees je veel meer dan het genoom lang is: ongeveer 8 genoomequivalenten voor 99,9 %. Het aantal reads over één base is de dekking (coverage): 5X = vijf reads. Herhalingen zijn het lastigst.',
        f: [{ vis: 'gen,reads' }] },
      { title: 'Illumina sequencing: fragments on a glass surface',
        en: 'Illumina is the common <b>next-generation</b> (second-generation) method: it sequences millions of fragments at the same time. The fragments get <b>adapters</b> (short known DNA pieces) at both ends and are made single-stranded. A glass surface is covered with a dense lawn of primers that match the adapters; each fragment sticks to one primer.',
        nl: 'Illumina is de gangbare next-generation methode: miljoenen fragmenten tegelijk. De fragmenten krijgen adapters (korte bekende stukjes) aan beide einden en worden enkelstrengs. Een glasplaatje zit vol primers die op de adapters passen.',
        f: [{ vis: 'surf' }, { vis: 'surf,frag1' }] },
      { title: 'Bridge amplification makes a cluster',
        en: 'The free end of the fragment bends over and pairs with a neighbouring primer: a <b>bridge</b>. A polymerase copies it, the two strands are separated, and both bend over again. After many rounds a tiny spot holds about a thousand identical copies: a <b>cluster</b>. One molecule would be too dim to see; a cluster is bright enough.',
        nl: 'Het vrije einde buigt om en paart met een buurprimer: een brug. Een polymerase kopieert, de strengen worden gescheiden, en het herhaalt zich. Na vele rondes staan er zo\'n duizend identieke kopieën in één vlekje: een cluster, helder genoeg om te zien.',
        f: [{ vis: 'surf,frag1,bridge' }, { vis: 'surf,cluster,lclu' }] },
      { title: 'One base per cycle: reversible terminators',
        en: 'Now the reading: a primer and the four nucleotides are added, each with its own colour and with its 3′ end <b>blocked</b>, so only one base can be built in. Unbound nucleotides are washed away, a laser and a camera record the colour of every cluster at once, then the block and the dye are chemically removed and the next cycle starts. Unlike the ddNTP of Sanger, this terminator is <b>reversible</b>.',
        nl: 'Het lezen: de vier nucleotiden, elk met eigen kleur en met geblokkeerd 3′-einde, zodat er maar één base per keer ingebouwd wordt. Wassen, foto van alle clusters tegelijk, blokkering en kleurstof verwijderen, volgende cyclus. Anders dan bij Sanger is deze terminator omkeerbaar.',
        f: [{ vis: 'surf,cluster,cyc' }] },
      { title: 'Short reads, enormous numbers',
        en: 'After 75 to 150 cycles each cluster has given a read of <b>75–150 bases</b>: short, but there are millions of them from one run. Short reads make assembly harder, so a higher coverage is needed. The whole workflow: extract DNA, prepare the library (fragment and add adapters), sequence, and analyse the data (align to a reference, call the variants).',
        nl: 'Na 75 tot 150 cycli heeft elke cluster een read van 75–150 basen: kort, maar miljoenen tegelijk. Korte reads maken assembleren lastiger, dus meer dekking nodig. Workflow: DNA isoleren, bibliotheek maken, sequencen, data analyseren.',
        f: [{ vis: 'surf,cluster,lclu,lread' }] },
      { title: 'Nanopore: reading one molecule through a hole',
        en: 'A <b>third-generation</b> method reads single molecules directly, with no PCR and no colours. A membrane holds a protein <b>nanopore</b>, a hole just wide enough for one DNA strand. A voltage drives ions through the pore: a steady electric current. A <b>motor protein</b> feeds the single-stranded DNA through the pore, base by base.',
        nl: 'Een derde-generatie methode leest losse moleculen, zonder PCR of kleuren. Een membraan bevat een eiwit-nanopore, een gaatje waar één DNA-streng door past. Een spanning stuurt ionen door de porie: een stroom. Een motoreiwit voert het DNA erdoor, base na base.',
        f: [{ vis: 'memb' }, { vis: 'memb,dnaN' }] },
      { title: 'Each base disturbs the current differently',
        en: 'A base inside the pore blocks part of the ion flow, and each base (A, T, C, G, even a methylated base) blocks it a little differently because of its size and chemistry. The current trace is decoded into the sequence <b>in real time</b>. Reads can be extremely long, even a whole chromosome, which solves repeats and structural variants; RNA can be read directly; and the MinION device fits in a hand, so it can be used in the field, for example to identify a pathogen during an outbreak.',
        nl: 'Elke base in de porie blokkeert de stroom een beetje anders (grootte, chemie). Het stroomspoor wordt in real time omgezet in de sequentie. Reads kunnen extreem lang zijn (herhalingen opgelost), RNA kan rechtstreeks, en de MinION past in een hand: sequencen in het veld.',
        f: [{ vis: 'memb,dnaN,trace' }, { vis: 'memb,dnaN,trace,lnano' }] }
    ]
  };

  A.scenes.pcr = scenePcr;
  A.scenes.clo = sceneClo;
  A.scenes.seq = sceneSeq;
})();
