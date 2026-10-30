/* Scenes for viruses.html: #cy = a virus takes over a cell (general replicative cycle), #hiv = HIV, a retrovirus. Needs player.js. */
(function () {
  'use strict';
  var A = window.Anim, el = A.el, txt = A.txt;

  /* ---------- helpers ---------- */
  function grp(svg, o, id, cls) { return (o[id] = el('g', cls ? { 'class': cls } : {}, svg)); }
  function showSet(st, o, prefix, list) {
    var set = {}; (list || '').split(',').forEach(function (s) { if (s) set[s] = 1; });
    for (var id in o) if (id.indexOf(prefix) === 0) st[id] = { x: 0, y: 0, o: set[id.slice(prefix.length)] ? 1 : 0 };
  }
  function labels(svg, o, list) { list.forEach(function (l) { var g = grp(svg, o, 'l_' + l[0]); txt(g, l[1], l[2], l[4] || 'lbl', l[3], l[5] || 'middle'); }); }
  function lines(g, x, y0, dy, arr, cls, anchor) { arr.forEach(function (s, i) { txt(g, x, y0 + i * dy, cls || 'lbl', s, anchor || 'middle'); }); }
  function hexagon(r) { var p = []; for (var k = 0; k < 6; k++) { var a = Math.PI / 6 + k * Math.PI / 3; p.push((r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1)); } return 'M' + p.join('L') + 'Z'; }
  function wave(x0, y0, w, n, h) { var d = 'M' + x0 + ' ' + y0, seg = w / n; for (var k = 0; k < n; k++) d += 'q' + (seg / 2) + ' ' + (k % 2 ? h : -h) + ' ' + seg + ' 0'; return d; }
  // a virus particle drawn at the origin: envelope with spikes (optional), capsid, genome
  function envelope(svg, o, id, r) {
    var g = grp(svg, o, id, 'venv'); el('circle', { cx: 0, cy: 0, r: r }, g);
    for (var k = 0; k < 10; k++) { var a = k * Math.PI / 5, cx = (r + 6) * Math.cos(a), cy = (r + 6) * Math.sin(a); el('line', { x1: r * Math.cos(a), y1: r * Math.sin(a), x2: cx, y2: cy, 'class': 'spk' }, g); el('circle', { cx: cx, cy: cy, r: 3.5, 'class': 'spkh' }, g); }
    return g;
  }
  function capsid(svg, o, id, r) { var g = grp(svg, o, id, 'vcap'); el('path', { d: hexagon(r) }, g); return g; }
  function genome(svg, o, id, cls) { var g = grp(svg, o, id, cls || 'vgen'); el('path', { d: wave(-18, 0, 36, 4, 7) }, g); return g; }
  function place(st, id, x, y, on, s) { st[id] = { x: x, y: y, o: on ? 1 : 0, s: s || 1 }; }

  /* ================= scene 1: the general replicative cycle ================= */
  var CX = 640, CY = 250;
  var sceneCY = {
    VW: 1000, VH: 440, NW: 760, aria: 'Animation of the replicative cycle of a virus',
    legend: [['--vgen', 'viral genome (DNA or RNA)'], ['--vcap', 'capsid (protein coat)'], ['--venv', 'envelope (host membrane) with glycoprotein spikes'], ['--rec', 'receptor of the host cell'], ['--ribo', 'ribosomes of the host'], ['--vpol', 'viral RNA polymerase'], ['--hl', 'this step']],
    build: function (svg) {
      var o = {}, g;
      txt(svg, 988, 432, 'wm', 'simplified: one virus, one cell', 'end');
      // host cell
      g = grp(svg, o, 'cell'); el('ellipse', { cx: CX, cy: CY, rx: 290, ry: 165, 'class': 'cellb' }, g);
      g = grp(svg, o, 'cellD'); el('ellipse', { cx: CX, cy: CY, rx: 290, ry: 165, 'class': 'cellb broken' }, g);
      g = grp(svg, o, 'nuc'); el('circle', { cx: 790, cy: 250, r: 60, 'class': 'nucl' }, g); txt(g, 790, 254, 'sm', 'nucleus', 'middle');
      g = grp(svg, o, 'rec'); [-32, 0, 32].forEach(function (dy) { el('path', { d: 'M0 ' + dy + 'l-12 0 m0 0 l-8 -8 m8 8 l-8 8', 'class': 'recp' }, g); });
      g = grp(svg, o, 'recH'); [-32, 0, 32].forEach(function (dy) { el('path', { d: 'M0 ' + dy + 'l-12 0 m0 0 l-8 -8 m8 8 l-8 8', 'class': 'recp hi' }, g); });
      g = grp(svg, o, 'ribo'); [[0, 0], [30, 14], [60, -4]].forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 9, 'class': 'ribo' }, g); el('circle', { cx: p[0], cy: p[1] - 9, r: 6, 'class': 'ribo' }, g); });
      // the virus
      envelope(svg, o, 'vEnv', 40); capsid(svg, o, 'vCap', 24); genome(svg, o, 'vGen');
      // genome copies, mRNA, proteins, new viruses
      ['gc1', 'gc2', 'gc3', 'gc4'].forEach(function (id) { genome(svg, o, id); });
      g = grp(svg, o, 'vpol'); el('ellipse', { cx: 0, cy: 0, rx: 26, ry: 13, 'class': 'vpol' }, g); txt(g, 0, 4, 'sm w', 'RNA pol', 'middle');
      g = grp(svg, o, 'hpol'); el('ellipse', { cx: 0, cy: 0, rx: 28, ry: 13, 'class': 'hpol' }, g); txt(g, 0, 4, 'sm w', 'DNA pol', 'middle');
      g = grp(svg, o, 'mrna'); el('path', { d: wave(-30, 0, 60, 6, 5), 'class': 'mrna' }, g);
      ['pr1', 'pr2', 'pr3', 'pr4', 'pr5'].forEach(function (id) { g = grp(svg, o, id, 'vcap small'); el('path', { d: hexagon(9) }, g); });
      ['nv1', 'nv2', 'nv3', 'nv4'].forEach(function (id) { g = grp(svg, o, id, 'nv'); el('path', { d: hexagon(18), 'class': 'vcapf' }, g); el('path', { d: wave(-13, 0, 26, 4, 5), 'class': 'vgenf' }, g); });
      envelope(svg, o, 'bEnv', 30); g = grp(svg, o, 'bud'); el('path', { d: hexagon(18), 'class': 'vcapf' }, g); el('path', { d: wave(-13, 0, 26, 4, 5), 'class': 'vgenf' }, g);
      g = grp(svg, o, 'glyco'); for (var k = 0; k < 6; k++) { el('circle', { cx: k * 16 - 40, cy: 0, r: 3.5, 'class': 'spkh' }, g); }
      // panels
      g = grp(svg, o, 'sup');
      el('rect', { x: 400, y: 300, width: 420, height: 96, rx: 8, 'class': 'panel' }, g);
      txt(g, 610, 322, 'lbl', 'the host provides everything else:', 'middle');
      lines(g, 610, 344, 18, ['nucleotides (building blocks of DNA and RNA) · enzymes', 'ribosomes · tRNAs · amino acids (building blocks of proteins)', 'ATP (energy)'], 'sm2');
      g = grp(svg, o, 'sum');
      txt(g, 500, 56, 'lbl big2', 'The replicative cycle of a virus', 'middle');
      lines(g, 500, 100, 34, ['1 attach: a viral surface protein fits a receptor on the cell (handshake) → host range',
        '2 enter: injection (phages), endocytosis, or fusion of the envelope with the membrane',
        '3 the viral genome takes over: the host gives nucleotides, enzymes, ribosomes, tRNAs, amino acids, ATP',
        '4 copy the genome: DNA virus → host DNA polymerase · RNA virus → its own RNA polymerase (RNA → RNA)',
        '5 viral mRNA → host ribosomes make the capsid proteins',
        '6 self-assembly of genome + capsid proteins → hundreds of new viruses',
        '7 exit: the cell bursts (lysis, cell dies) or the virus buds off with a piece of membrane (envelope)',
        '8 the new viruses infect other cells: a virus is a packaged set of genes in transit'], 'lbl');
      labels(svg, o, [
        ['b1', 500, 44, 'begin: one virus = a genome inside a capsid; this one also has an envelope with glycoprotein spikes'],
        ['b2', 500, 66, 'a host cell with receptors on its surface; goal of the virus: hundreds of new viruses', 'lbl ck'],
        ['virus', 22, 330, 'virus (not alive: no metabolism, no ribosomes)', 'sm', 'start'],
        ['cellt', 640, 108, 'host cell', 'sm'],
        ['at1', 500, 44, 'attachment: a viral surface protein fits a host receptor like a handshake'],
        ['at2', 500, 66, 'only cells with the right receptor can be infected: the host range of the virus', 'lbl ck'],
        ['rect', 300, 160, 'receptor', 'sm', 'end'],
        ['en1', 500, 44, 'entry: the envelope fuses with the membrane, or the cell takes the virus in (endocytosis)'],
        ['en2', 500, 66, 'a bacteriophage instead injects only its DNA through its tail', 'lbl ck'],
        ['un1', 500, 44, 'the capsid comes apart: the viral genome is free inside the cell'],
        ['un2', 500, 66, 'from now on the genes of the virus command the cell', 'lbl ck'],
        ['su1', 500, 44, 'the virus brings almost nothing: it uses the equipment and small molecules of the host'],
        ['cd1', 500, 44, 'DNA virus: the host’s own DNA polymerase copies the viral genome (in the nucleus)'],
        ['cd2', 500, 66, 'the viral DNA is simply a template, like the cell’s own DNA', 'lbl ck'],
        ['cr1', 500, 44, 'RNA virus: a viral RNA polymerase copies RNA from an RNA template (RNA → RNA)'],
        ['cr2', 500, 66, 'cells have no such enzyme: the virus must bring it or encode it', 'lbl ck'],
        ['pr1', 500, 44, 'viral mRNA goes to the host ribosomes, which make the capsid proteins (capsomeres)'],
        ['pr2', 500, 66, 'the host also supplies the tRNAs and the amino acids', 'lbl ck'],
        ['as1', 500, 44, 'self-assembly: genome copies and capsid proteins spontaneously fit together into new viruses'],
        ['as2', 500, 66, 'no energy or enzyme needed for this step: the parts fit like puzzle pieces', 'lbl ck'],
        ['ly1', 500, 44, 'exit by lysis: hundreds of viruses leave, the cell is damaged or bursts'],
        ['ly2', 500, 66, 'the damage and the body’s response to it cause the symptoms of the infection', 'lbl bad'],
        ['bu1', 500, 44, 'exit by budding (enveloped viruses): the capsid is wrapped in host membrane as it leaves'],
        ['bu2', 500, 66, 'the glycoproteins were made on ER ribosomes, sugars added in ER and Golgi; the cell may survive', 'lbl ck'],
        ['budl', 930, 140, 'budding virus', 'sm'],
        ['glyl', 870, 374, 'viral glycoproteins in the host membrane', 'sm']
      ]);
      this._o = o;
      return o;
    },
    init: { mode: 'begin', lab: 'b1,b2,virus,cellt' },
    layout: function (P) {
      var st = {}, o = this._o, m = P.mode;
      var inCell = m !== 'begin' && m !== 'attach';
      var vx = { begin: 120, attach: 300 }[m] || 420, vy = 250;
      place(st, 'cell', 0, 0, m !== 'lysis' && m !== 'sum'); place(st, 'cellD', 0, 0, m === 'lysis');
      place(st, 'nuc', 0, 0, m !== 'sum'); place(st, 'rec', 352, 250, m !== 'attach' && m !== 'sum'); place(st, 'recH', 352, 250, m === 'attach');
      var capOn = m === 'begin' || m === 'attach' || m === 'enter', envOn = m === 'begin' || m === 'attach';
      place(st, 'vEnv', vx, vy, envOn); place(st, 'vCap', vx, vy, capOn); place(st, 'vGen', vx, vy, m !== 'sum' && m !== 'lysis' && m !== 'bud');
      var copies = m === 'copyd' || m === 'copyr' || m === 'prot' || m === 'assemble';
      [['gc1', 700, 180], ['gc2', 700, 320], ['gc3', 560, 190], ['gc4', 560, 310]].forEach(function (c) { place(st, c[0], c[1], c[2], copies); });
      place(st, 'hpol', 740, 250, m === 'copyd'); place(st, 'vpol', 500, 250, m === 'copyr');
      place(st, 'ribo', 500, 350, inCell && m !== 'lysis' && m !== 'sum' && m !== 'supply'); place(st, 'mrna', 480, 300, m === 'prot');
      [['pr1', 580, 360], ['pr2', 610, 380], ['pr3', 640, 355], ['pr4', 670, 380], ['pr5', 700, 360]].forEach(function (c) { place(st, c[0], c[1], c[2], m === 'prot'); });
      var nvPos = { assemble: [[600, 180], [660, 230], [600, 300], [690, 330]], lysis: [[948, 110], [945, 250], [952, 372], [860, 58]], bud: [[600, 180], [660, 230], [600, 300], [690, 330]] };
      ['nv1', 'nv2', 'nv3', 'nv4'].forEach(function (id, i) { var p = (nvPos[m] || nvPos.assemble)[i]; place(st, id, p[0], p[1], m === 'assemble' || m === 'lysis' || m === 'bud'); });
      place(st, 'bEnv', 930, 190, m === 'bud'); place(st, 'bud', 930, 190, m === 'bud'); place(st, 'glyco', 870, 350, m === 'bud');
      place(st, 'sup', 0, 0, m === 'supply'); place(st, 'sum', 0, 0, m === 'sum');
      showSet(st, o, 'l_', P.lab);
      st._cam = { x: 500 };
      return st;
    },
    steps: [
      { title: 'Begin state: a virus and a host cell',
        en: 'A <b>virus</b> is a packet of genes: a <b>genome</b> (DNA or RNA) inside a protein coat, the <b>capsid</b>. Some viruses also have an <b>envelope</b>, a piece of membrane with protein spikes (glycoproteins). It has no ribosomes and no metabolism, so it cannot do anything on its own. The goal of the virus: use this cell to make hundreds of copies of itself.',
        nl: 'Begin: een virus = genoom in een capside, soms met een envelop met glycoproteïnen. Het heeft geen ribosomen of stofwisseling. Doel: honderden nieuwe virussen maken met deze cel.',
        f: [{}] },
      { title: 'Attachment: the handshake with a receptor',
        en: 'A protein on the surface of the virus fits a <b>receptor</b> on the cell like a key in a lock (a receptor is a protein the cell uses for its own work; the virus misuses it as a door). Only cells with the right receptor can be infected: this decides the <b>host range</b>, the species and tissues a virus can infect.',
        nl: 'Hechting: een virusproteïne past op een receptor van de cel (handdruk). Alleen cellen met de juiste receptor raken geïnfecteerd: dat bepaalt de gastheerreeks.',
        f: [{ mode: 'attach', lab: 'at1,at2,rect' }] },
      { title: 'Entry: the genome gets in',
        en: 'An enveloped virus <b>fuses</b> its envelope with the cell membrane; other viruses are taken in by <b>endocytosis</b> (the membrane folds around them). A bacteriophage stays outside and injects only its DNA through its tail. The envelope stays behind at the membrane.',
        nl: 'Binnenkomst: fusie van de envelop met het membraan, of opname door endocytose. Een faag spuit alleen zijn DNA naar binnen.',
        f: [{ mode: 'enter', lab: 'en1,en2' }] },
      { title: 'The genome is released',
        en: 'Inside the cell the capsid comes apart and the viral genome is free. From now on the genes of the virus command the cell: the proteins they encode reprogram it to copy the viral genome and make viral proteins.',
        nl: 'De capside valt uiteen, het virale genoom komt vrij en neemt het commando over de cel over.',
        f: [{ mode: 'uncoat', lab: 'un1,un2' }] },
      { title: 'The host provides the equipment',
        en: 'The virus brings almost nothing. The host cell supplies the <b>nucleotides</b> to build new genomes, the <b>enzymes</b>, the <b>ribosomes</b>, <b>tRNAs</b> and <b>amino acids</b> to build proteins, and <b>ATP</b> for energy. That is why a virus is an <b>obligate intracellular parasite</b>: it can only replicate inside a cell.',
        nl: 'De gastheer levert nucleotiden, enzymen, ribosomen, tRNA’s, aminozuren en ATP. Daarom is een virus een verplichte intracellulaire parasiet.',
        f: [{ mode: 'supply', lab: 'su1' }] },
      { title: 'Copying a DNA genome',
        en: 'A <b>DNA virus</b> lets the host’s own <b>DNA polymerase</b> (the enzyme that copies DNA, BIO01 chapter 4) copy its genome, just as the cell copies its own DNA. The viral DNA is simply a template (mal). Many copies of the genome are made.',
        nl: 'Een DNA-virus laat het DNA-polymerase van de gastheer zijn genoom kopiëren: het virale DNA dient als mal.',
        f: [{ mode: 'copyd', lab: 'cd1,cd2' }] },
      { title: 'Copying an RNA genome: a special enzyme',
        en: 'An <b>RNA virus</b> has a problem: cells have no enzyme that copies RNA from an RNA template. So the virus brings or encodes its own <b>RNA polymerase</b> that makes RNA → RNA. The copies serve as new genomes and, for many viruses, also as mRNA.',
        nl: 'Een RNA-virus heeft een eigen RNA-polymerase nodig (RNA → RNA); cellen hebben zo’n enzym niet.',
        f: [{ mode: 'copyr', lab: 'cr1,cr2' }] },
      { title: 'Making the capsid proteins',
        en: 'Viral <b>mRNA</b> is read by the host <b>ribosomes</b> (the protein factories, BIO01 chapter 5), which build the viral proteins: mainly the capsid proteins, called <b>capsomeres</b>. The tRNAs and amino acids come from the host.',
        nl: 'Viraal mRNA wordt door de ribosomen van de gastheer vertaald in virale eiwitten, vooral capside-eiwitten.',
        f: [{ mode: 'prot', lab: 'pr1,pr2' }] },
      { title: 'Self-assembly',
        en: 'Genome copies and capsid proteins fit together <b>spontaneously</b>, like puzzle pieces: this is <b>self-assembly</b>. No extra energy or enzyme is needed. Hundreds or thousands of new viruses form inside the cell.',
        nl: 'Zelfassemblage: genoomkopieën en capside-eiwitten passen vanzelf in elkaar tot honderden nieuwe virussen.',
        f: [{ mode: 'assemble', lab: 'as1,as2' }] },
      { title: 'Exit by lysis: the cell bursts',
        en: 'The simplest ending: the new viruses leave and the cell is damaged or bursts open (<b>lysis</b>). The dead cells and the body’s reaction to them cause the symptoms of the infection. Each new virus can infect another cell.',
        nl: 'Uitgang door lysis: de cel barst open, de virussen komen vrij; de schade geeft de ziektesymptomen.',
        f: [{ mode: 'lysis', lab: 'ly1,ly2' }] },
      { title: 'Exit by budding: an envelope from the host',
        en: 'Enveloped viruses leave gently: the viral <b>glycoproteins</b> were made on ribosomes of the ER and got their sugars in the ER and the Golgi, then went to the cell membrane. The new capsid pushes through the membrane and takes a piece of it as its <b>envelope</b> (<b>budding</b>, like exocytosis). The cell may survive.',
        nl: 'Uitgang door afsnoering (budding): de capside neemt een stuk celmembraan met virale glycoproteïnen mee als envelop; de cel kan overleven.',
        f: [{ mode: 'bud', lab: 'bu1,bu2,budl,glyl' }] },
      { title: 'Summary: the cycle in eight steps',
        en: 'Attach, enter, release the genome, borrow the host’s equipment, copy the genome (host DNA polymerase or viral RNA polymerase), make proteins on host ribosomes, self-assemble, and exit by lysis or budding. A virus in transit is just a packaged set of genes.',
        nl: 'Samenvatting: hechten, binnenkomen, genoom kopiëren, eiwitten maken, zelfassemblage, naar buiten door lysis of budding.',
        f: [{ mode: 'sum', lab: '' }] }
    ]
  };

  /* ================= scene 2: HIV, a retrovirus ================= */
  var sceneHIV = {
    VW: 1000, VH: 440, NW: 760, aria: 'Animation of the replicative cycle of HIV',
    legend: [['--vgen', 'viral RNA'], ['--dna', 'viral DNA made by reverse transcriptase'], ['--rt', 'reverse transcriptase (RT)'], ['--vcap', 'capsid'], ['--venv', 'envelope with glycoproteins'], ['--chrom', 'host chromosome'], ['--hl', 'this step']],
    build: function (svg) {
      var o = {}, g;
      txt(svg, 988, 432, 'wm', 'simplified: HIV and one white blood cell', 'end');
      g = grp(svg, o, 'cell'); el('ellipse', { cx: CX, cy: CY, rx: 290, ry: 165, 'class': 'cellb' }, g);
      g = grp(svg, o, 'nuc'); el('circle', { cx: 760, cy: 250, r: 78, 'class': 'nucl' }, g); txt(g, 760, 190, 'sm', 'nucleus', 'middle');
      g = grp(svg, o, 'chrom'); el('rect', { x: 700, y: 262, width: 120, height: 14, rx: 6, 'class': 'chrom' }, g); txt(g, 760, 296, 'sm', 'host chromosome', 'middle');
      g = grp(svg, o, 'rec'); [-20, 20].forEach(function (dy) { el('path', { d: 'M0 ' + dy + 'l-12 0 m0 0 l-8 -8 m8 8 l-8 8', 'class': 'recp' }, g); });
      g = grp(svg, o, 'ribo'); [[0, 0], [30, 14], [60, -4]].forEach(function (p) { el('circle', { cx: p[0], cy: p[1], r: 9, 'class': 'ribo' }, g); el('circle', { cx: p[0], cy: p[1] - 9, r: 6, 'class': 'ribo' }, g); });
      // the HIV particle
      envelope(svg, o, 'vEnv', 44); capsid(svg, o, 'vCap', 27);
      genome(svg, o, 'rna1'); genome(svg, o, 'rna2');
      ['rt1', 'rt2'].forEach(function (id) { g = grp(svg, o, id, 'rt'); el('circle', { cx: 0, cy: 0, r: 7 }, g); });
      g = grp(svg, o, 'rtl'); txt(g, 0, 0, 'sm', 'RT', 'middle');
      // viral DNA (double strand) and provirus
      g = grp(svg, o, 'vdna'); el('path', { d: wave(-24, -4, 48, 4, 5), 'class': 'dna' }, g); el('path', { d: wave(-24, 4, 48, 4, -5), 'class': 'dna' }, g);
      g = grp(svg, o, 'prov'); el('rect', { x: -22, y: -7, width: 44, height: 14, rx: 4, 'class': 'provr' }, g);
      ['tr1', 'tr2', 'tr3'].forEach(function (id) { genome(svg, o, id); });
      g = grp(svg, o, 'hpol'); el('ellipse', { cx: 0, cy: 0, rx: 38, ry: 13, 'class': 'hpol' }, g); txt(g, 0, 4, 'sm w', 'host RNA pol', 'middle');
      ['pr1', 'pr2', 'pr3'].forEach(function (id) { g = grp(svg, o, id, 'vcap small'); el('path', { d: hexagon(9) }, g); });
      ['nrt1', 'nrt2'].forEach(function (id) { g = grp(svg, o, id, 'rt'); el('circle', { cx: 0, cy: 0, r: 7 }, g); });
      g = grp(svg, o, 'glyco'); for (var k = 0; k < 5; k++) el('circle', { cx: k * 16 - 32, cy: 0, r: 3.5, 'class': 'spkh' }, g);
      capsid(svg, o, 'nCap', 24); envelope(svg, o, 'nEnv', 40);
      // classes inset
      g = grp(svg, o, 'cls');
      el('rect', { x: 60, y: 300, width: 420, height: 120, rx: 8, 'class': 'panel' }, g);
      txt(g, 270, 322, 'lbl', 'single-stranded RNA viruses: three classes', 'middle');
      lines(g, 76, 346, 22, ['IV: the RNA is itself the mRNA (translated at once)', 'V: the RNA is a template for mRNA (viral RNA → RNA polymerase)', 'VI: retrovirus: RNA → DNA by reverse transcriptase (HIV)'], 'sm2', 'start');
      g = grp(svg, o, 'sum');
      txt(g, 500, 56, 'lbl big2', 'HIV, a retrovirus (class VI)', 'middle');
      lines(g, 500, 100, 34, ['1 the envelope fuses with the membrane of a white blood cell; the capsid enters',
        '2 the capsid releases 2 identical RNA genomes and 2 molecules of reverse transcriptase (RT)',
        '3 RT uses the viral RNA as a template to make DNA: RNA → DNA, the reverse of the usual direction',
        '4 the viral DNA enters the nucleus and is built into a chromosome: the provirus, there for ever',
        '5 the host RNA polymerase transcribes the provirus → RNA = mRNA for viral proteins AND new genomes',
        '6 host ribosomes make the proteins; capsids assemble around 2 RNA + 2 RT; the virus buds off with an envelope',
        'exam sentence: reverse transcriptase uses viral RNA as a template for DNA synthesis'], 'lbl');
      labels(svg, o, [
        ['b1', 500, 44, 'begin: HIV = envelope with glycoproteins, a capsid, 2 identical single-stranded RNA genomes, 2 reverse transcriptase molecules'],
        ['b2', 500, 66, 'a white blood cell with the right receptor; goal of HIV: become a permanent part of the cell’s DNA and make new viruses', 'lbl ck'],
        ['hivl', 22, 330, 'HIV (human immunodeficiency virus, causes AIDS)', 'sm', 'start'],
        ['f1', 500, 44, 'fusion: the glycoproteins bind the receptor; the envelope fuses with the cell membrane'],
        ['f2', 500, 66, 'the capsid with its contents is now inside the cytoplasm', 'lbl ck'],
        ['r1', 500, 44, 'the capsid opens: 2 RNA genomes and 2 molecules of reverse transcriptase are released'],
        ['r2', 500, 66, 'reverse transcriptase (RT) is an enzyme the virus brings along; cells do not have it', 'lbl ck'],
        ['t1', 500, 44, 'reverse transcription: RT reads the viral RNA and builds a DNA copy of it'],
        ['t2', 500, 66, 'RNA → DNA is the reverse of the usual direction DNA → RNA, hence “retro” (backward)', 'lbl ck'],
        ['c1', 500, 44, 'why HIV is special among RNA viruses: the three classes of single-stranded RNA viruses'],
        ['n1', 500, 44, 'the viral DNA enters the nucleus'],
        ['i1', 500, 44, 'integration: the viral DNA is built into a chromosome of the host = the provirus'],
        ['i2', 500, 66, 'the provirus never leaves: it is copied with the chromosome and stays for the life of the cell', 'lbl bad'],
        ['provl', 760, 348, 'provirus inside the chromosome', 'sm'],
        ['x1', 500, 44, 'transcription: the host’s own RNA polymerase reads the provirus like any gene'],
        ['x2', 500, 66, 'the RNA copies are both mRNA (for viral proteins) and the genomes of the new viruses', 'lbl ck'],
        ['p1', 500, 44, 'translation: host ribosomes make the viral proteins: capsid proteins, RT, and glycoproteins that go into the membrane'],
        ['a1', 500, 44, 'assembly: a new capsid forms around 2 RNA genomes and 2 RT molecules'],
        ['a2', 500, 66, 'every new virus carries its own RT, ready for the next cell', 'lbl ck'],
        ['bu1', 500, 44, 'budding: the virus leaves wrapped in host membrane with the viral glycoproteins = its envelope'],
        ['bu2', 500, 66, 'the cell keeps the provirus and goes on producing viruses; HIV infects immune cells → AIDS', 'lbl bad'],
        ['glyl', 870, 374, 'viral glycoproteins in the membrane', 'sm']
      ]);
      this._o = o;
      return o;
    },
    init: { mode: 'begin', lab: 'b1,b2,hivl' },
    layout: function (P) {
      var st = {}, o = this._o, m = P.mode;
      var outside = m === 'begin', sum = m === 'sum';
      var vx = outside ? 120 : 420, vy = 250;
      place(st, 'cell', 0, 0, !sum && m !== 'cls'); place(st, 'nuc', 0, 0, !sum && m !== 'cls'); place(st, 'chrom', 0, 0, !sum && m !== 'begin' && m !== 'cls');
      place(st, 'rec', 352, 250, !sum && m !== 'cls');
      place(st, 'ribo', 500, 350, !sum && !outside && m !== 'cls');
      var capOn = m === 'begin' || m === 'fuse';
      place(st, 'vEnv', vx, vy, m === 'begin'); place(st, 'vCap', vx, vy, capOn);
      var open = m === 'release' || m === 'rt';
      place(st, 'rna1', capOn ? vx - 6 : 440, capOn ? vy - 6 : 220, capOn || open);
      place(st, 'rna2', capOn ? vx + 6 : 440, capOn ? vy + 6 : 280, capOn || open);
      place(st, 'rt1', capOn ? vx - 12 : 400, capOn ? vy + 14 : 220, capOn || open); place(st, 'rt2', capOn ? vx + 12 : 400, capOn ? vy - 14 : 280, capOn || open);
      place(st, 'rtl', 400, 254, open);
      var dnaPos = { rt: [500, 220], nuc: [700, 232] }[m];
      place(st, 'vdna', dnaPos ? dnaPos[0] : 500, dnaPos ? dnaPos[1] : 220, !!dnaPos);
      var provOn = m === 'integ' || m === 'tx' || m === 'tl' || m === 'assemble' || m === 'bud';
      place(st, 'prov', 760, 269, provOn);
      place(st, 'hpol', 760, 236, m === 'tx');
      var trOn = m === 'tx' || m === 'tl' || m === 'assemble';
      var trPos = m === 'tx' ? [[640, 180], [640, 320], [690, 250]] : [[560, 190], [560, 310], [515, 250]];
      ['tr1', 'tr2', 'tr3'].forEach(function (id, i) { place(st, id, trPos[i][0], trPos[i][1], trOn); });
      [['pr1', 580, 380], ['pr2', 610, 395], ['pr3', 640, 378]].forEach(function (c) { place(st, c[0], c[1], c[2], m === 'tl'); });
      place(st, 'nrt1', 670, 395, m === 'tl'); place(st, 'nrt2', 700, 380, m === 'tl');
      place(st, 'glyco', 870, 350, m === 'tl' || m === 'assemble' || m === 'bud');
      var nx = m === 'bud' ? 930 : 620, ny = m === 'bud' ? 190 : 250, asm = m === 'assemble' || m === 'bud';
      place(st, 'nCap', nx, ny, asm); place(st, 'nEnv', 930, 190, m === 'bud');
      if (asm) { place(st, 'rna1', nx - 6, ny - 6, 1); place(st, 'rna2', nx + 6, ny + 6, 1); place(st, 'rt1', nx - 12, ny + 12, 1); place(st, 'rt2', nx + 12, ny - 12, 1); }
      place(st, 'cls', 0, 0, m === 'cls'); place(st, 'sum', 0, 0, sum);
      showSet(st, o, 'l_', P.lab);
      st._cam = { x: 500 };
      return st;
    },
    steps: [
      { title: 'Begin state: HIV and a white blood cell',
        en: '<b>HIV</b> (human immunodeficiency virus, the virus that causes AIDS) is an enveloped virus: an envelope with glycoprotein spikes, a capsid, and inside it <b>two identical single-stranded RNA</b> genomes and <b>two molecules of reverse transcriptase</b>, an enzyme. It infects a white blood cell of the immune system that carries the right receptor. Its goal: become a permanent part of the cell’s DNA.',
        nl: 'Begin: HIV = envelop, capside, 2 identieke RNA-genomen en 2 moleculen reverse transcriptase. Het infecteert een witte bloedcel met de juiste receptor.',
        f: [{}] },
      { title: 'Fusion: the envelope merges with the membrane',
        en: 'The glycoproteins of HIV bind the receptor on the white blood cell. The envelope then <b>fuses</b> with the cell membrane, and the capsid with everything inside it is released into the cytoplasm.',
        nl: 'De glycoproteïnen binden de receptor; de envelop fuseert met het celmembraan en de capside komt in het cytoplasma.',
        f: [{ mode: 'fuse', lab: 'f1,f2' }] },
      { title: 'The capsid opens: RNA and reverse transcriptase',
        en: 'The capsid comes apart and releases the two RNA genomes and the two <b>reverse transcriptase</b> (RT) molecules. Cells have no RT; the virus must bring it along, because the next step needs it.',
        nl: 'De capside gaat open: 2 RNA-genomen en 2 moleculen reverse transcriptase (RT) komen vrij. Cellen hebben zelf geen RT.',
        f: [{ mode: 'release', lab: 'r1,r2' }] },
      { title: 'Reverse transcription: RNA → DNA',
        en: 'RT reads the viral RNA and builds a <b>DNA copy</b> of it, in the cytoplasm. This is the reverse of the usual flow DNA → RNA, which is why these viruses are called <b>retroviruses</b> (retro = backward). Exam wording: reverse transcriptase uses viral RNA as a template for DNA synthesis.',
        nl: 'Reverse transcriptie: RT maakt met het virale RNA als mal een DNA-kopie, in het cytoplasma. RNA → DNA is de omgekeerde richting: retrovirus.',
        f: [{ mode: 'rt', lab: 't1,t2' }] },
      { title: 'Where HIV fits among the RNA viruses',
        en: 'Animal viruses are classified by their genetic material. Single-stranded RNA viruses come in three classes: class <b>IV</b>, the RNA is itself the mRNA; class <b>V</b>, the RNA is a template for mRNA (needs a viral RNA → RNA polymerase); class <b>VI</b>, the <b>retroviruses</b>, copy their RNA into DNA with reverse transcriptase. HIV is class VI.',
        nl: 'Enkelstrengige RNA-virussen: klasse IV (RNA = mRNA), klasse V (RNA is mal voor mRNA), klasse VI (retrovirus: RNA → DNA). HIV is klasse VI.',
        f: [{ mode: 'cls', lab: 'c1' }] },
      { title: 'The viral DNA enters the nucleus',
        en: 'The newly made double-stranded viral DNA travels into the <b>nucleus</b>, where the host’s chromosomes are.',
        nl: 'Het nieuwe virale DNA gaat de kern in, waar de chromosomen van de gastheer liggen.',
        f: [{ mode: 'nuc', lab: 'n1' }] },
      { title: 'Integration: the provirus',
        en: 'The viral DNA is built into one of the host’s chromosomes. Integrated like this it is called a <b>provirus</b>. It never leaves: every time the cell copies its DNA, the provirus is copied too. It is a permanent resident of the cell.',
        nl: 'Integratie: het virale DNA wordt in een chromosoom ingebouwd = het provirus. Het blijft voor altijd en wordt met het chromosoom meegekopieerd.',
        f: [{ mode: 'integ', lab: 'i1,i2,provl' }] },
      { title: 'Transcription by the host’s RNA polymerase',
        en: 'The provirus is read like any other gene: the host’s own <b>RNA polymerase</b> transcribes it into RNA. These RNA molecules do two jobs: they are the <b>mRNA</b> for the viral proteins, and they are the <b>genomes</b> of the new viruses.',
        nl: 'Het RNA-polymerase van de gastheer transcribeert het provirus. Dat RNA is tegelijk mRNA voor virale eiwitten en het genoom van nieuwe virussen.',
        f: [{ mode: 'tx', lab: 'x1,x2' }] },
      { title: 'Translation: the viral proteins',
        en: 'Host <b>ribosomes</b> translate the viral mRNA into viral proteins: capsid proteins, new reverse transcriptase, and glycoproteins that are placed in the cell membrane, ready for the envelope of the next generation.',
        nl: 'Ribosomen van de gastheer maken de virale eiwitten: capside-eiwitten, nieuwe RT en glycoproteïnen voor het membraan.',
        f: [{ mode: 'tl', lab: 'p1,glyl' }] },
      { title: 'Assembly of a new virus',
        en: 'A new capsid assembles around <b>two RNA genomes and two RT molecules</b>, so every new virus carries the enzyme it will need in the next cell.',
        nl: 'Een nieuwe capside vormt zich rond 2 RNA-genomen en 2 RT-moleculen.',
        f: [{ mode: 'assemble', lab: 'a1,a2' }] },
      { title: 'Budding: out with an envelope',
        en: 'The new virus pushes through the cell membrane and takes a piece of it, with the viral glycoproteins, as its <b>envelope</b>. The cell keeps its provirus and goes on producing viruses. Because HIV destroys immune cells, the body loses its defence: <b>AIDS</b>.',
        nl: 'Budding: het nieuwe virus neemt een stuk membraan met glycoproteïnen mee als envelop. De cel houdt het provirus. HIV vernietigt immuuncellen → AIDS.',
        f: [{ mode: 'bud', lab: 'bu1,bu2' }] },
      { title: 'Summary',
        en: 'HIV fuses, releases 2 RNA + 2 RT, RT makes DNA from RNA, the DNA integrates as a provirus for ever, the host RNA polymerase transcribes it into mRNA and new genomes, ribosomes make the proteins, new viruses assemble and bud off. Exam sentence: reverse transcriptase uses viral RNA as a template for DNA synthesis.',
        nl: 'Samenvatting: fusie, RT maakt DNA van RNA, provirus in het chromosoom, transcriptie door de gastheer, nieuwe virussen door budding.',
        f: [{ mode: 'sum', lab: '' }] }
    ]
  };

  A.scenes.cy = sceneCY;
  A.scenes.hiv = sceneHIV;
})();
