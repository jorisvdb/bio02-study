// Process maps for chapter 3 (viruses). Elements with data-part="x" are highlighted for "key#x".
(function () {
  function S(h, body) {
    return '<svg viewBox="0 0 960 ' + h + '" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif" font-size="14" fill="currentColor">' + body + '</svg>';
  }
  function T(x, y, s, a) { return '<text x="' + x + '" y="' + y + '"' + (a ? ' ' + a : '') + '>' + s + '</text>'; }
  function R(x, y, w, h, col, a) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="' + col + '" fill-opacity=".13" stroke="' + col + '" stroke-width="2"' + (a ? ' ' + a : '') + '/>';
  }
  function G(part, inner) { return '<g data-part="' + part + '">' + inner + '</g>'; }
  function L(x1, y1, x2, y2, id) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="currentColor" stroke-width="2" marker-end="url(#' + id + ')"/>';
  }
  function defs(id) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>';
  }
  function lines(x, y0, dy, arr, a) { return arr.map(function (s, i) { return T(x, y0 + i * dy, s, a); }).join(''); }
  var B_ = 'font-weight="700"', M = 'text-anchor="middle"';
  function B(part, x, y, w, col, title, ls, a) {
    var h = 34 + ls.length * 18;
    return G(part, R(x, y, w, h, col, a) + T(x + 12, y + 22, title, B_) + lines(x + 12, y + 44, 18, ls, 'font-size="13"'));
  }
  var GRN = '#2fa37a', BLUE = '#4a7fb5', ORA = '#e07a3f', PUR = '#8e6cc0', RED = '#d1342f', YEL = '#e3a33b', TEAL = '#2b9aa8', GREY = '#7f8a9c';
  var DASH = 'stroke-dasharray="6 4"';

  /* ---------- map 1: the general replicative cycle ---------- */
  var c = defs('pcE');
  c += T(480, 20, 'A virus takes over a cell: the general replicative cycle (a virus = genes in a protein coat, no metabolism of its own)', M + ' ' + B_);
  c += B('attach', 20, 36, 290, YEL, '1 · Attach: the handshake',
    ['a viral surface protein fits a receptor on', 'the host cell → host range (measles: humans', 'only; West Nile: mosquito, bird, horse, human)']);
  c += L(310, 80, 326, 80, 'pcE');
  c += B('enter', 330, 36, 290, ORA, '2 · Enter',
    ['phage: injects its DNA with its tail;', 'others: taken up by endocytosis;', 'enveloped: envelope fuses with the membrane']);
  c += L(620, 80, 636, 80, 'pcE');
  c += B('uncoat', 640, 36, 300, RED, '3 · Genome released',
    ['the viral genes are now inside and', 'reprogram the cell: "copy me and build', 'my proteins"']);
  c += L(790, 124, 790, 146, 'pcE');
  c += B('copy', 20, 152, 450, BLUE, '4 · Copy the genome (host nucleotides)',
    ['DNA virus: uses the HOST DNA polymerase', 'RNA virus: brings its own RNA polymerase that copies RNA → RNA', '(cells have no such enzyme; it is encoded by the viral genome)']);
  c += B('proteins', 490, 152, 450, PUR, '5 · Make viral proteins (host machinery)',
    ['viral mRNA is read by the HOST ribosomes, with host tRNAs,', 'amino acids and ATP → capsid proteins (capsomeres), enzymes', 'the host pays for everything']);
  c += L(245, 240, 245, 262, 'pcE'); c += L(715, 240, 715, 262, 'pcE');
  c += B('assemble', 20, 268, 450, GRN, '6 · Self-assembly',
    ['genome + capsomeres snap together by themselves', 'into hundreds or thousands of new viruses', '(no energy, no enzyme needed)']);
  c += B('exit', 490, 268, 450, RED, '7 · Exit and spread',
    ['lytic exit: the cell is damaged or destroyed → symptoms', '(cell death + the body\'s reaction to it)', 'the progeny infect neighbouring cells']);
  c += B('envelope', 20, 374, 450, TEAL, 'Enveloped viruses: dressing in host membrane',
    ['protein part of the glycoproteins made by ribosomes on the ER;', 'sugars added in ER and Golgi; glycoproteins sent to the surface', '→ the envelope is host membrane with VIRAL proteins in it']);
  c += B('bud', 490, 374, 450, TEAL, 'Budding (like exocytosis): the cell may survive',
    ['new capsids are wrapped in membrane as they bud out', 'herpesvirus: envelope first from the nuclear envelope, then Golgi;', 'dsDNA replicated in the nucleus; latent in nerve cells → cold sores']);

  /* ---------- map 2: HIV, a retrovirus ---------- */
  var h = defs('pcF');
  h += T(480, 20, 'HIV, a retrovirus (class VI): RNA → DNA → provirus in the host chromosome → new viruses', M + ' ' + B_);
  h += B('fuse', 20, 36, 450, YEL, '1 · Fusion',
    ['envelope glycoproteins bind receptors found only on certain', 'white blood cells (immune cells); envelope fuses with the', 'cell membrane; the capsid enters']);
  h += L(470, 80, 486, 80, 'pcF');
  h += B('rt', 490, 36, 450, ORA, '2 · Contents released into the cytoplasm',
    ['2 identical single-stranded RNA molecules', '+ 2 molecules of reverse transcriptase (RT),', 'an enzyme the virus brings along']);
  h += L(715, 124, 715, 146, 'pcF');
  h += B('dna', 20, 152, 450, RED, '3 · RT copies RNA → DNA',
    ['the reverse of the usual direction DNA → RNA', '(retro = backward); RT uses the viral RNA as', 'a template for DNA synthesis (exam question!)']);
  h += L(470, 196, 486, 196, 'pcF');
  h += B('nucleus', 490, 152, 450, PUR, '4 · Viral DNA enters the nucleus',
    ['the newly made double-stranded DNA', 'travels into the nucleus of the host cell', '']);
  h += L(715, 240, 715, 262, 'pcF');
  h += B('provirus', 20, 268, 450, BLUE, '5 · Integration = provirus',
    ['the viral DNA is built into a host chromosome', 'and never leaves: a permanent resident,', 'copied with the cell\'s own DNA at every division']);
  h += L(470, 312, 486, 312, 'pcF');
  h += B('transcribe', 490, 268, 450, GRN, '6 · Host RNA polymerase transcribes the provirus',
    ['the RNA made is BOTH mRNA (for viral proteins)', 'AND the genome of the new viruses', '']);
  h += L(715, 356, 715, 378, 'pcF');
  h += B('translate', 20, 384, 450, TEAL, '7 · Host ribosomes make viral proteins',
    ['capsid proteins, envelope glycoproteins (via ER and Golgi),', 'and new reverse transcriptase', '']);
  h += L(470, 428, 486, 428, 'pcF');
  h += B('assemble', 490, 384, 450, ORA, '8 · Assembly',
    ['2 RNA genomes + 2 RT + capsid proteins', 'self-assemble into a new particle', '']);
  h += L(715, 472, 715, 494, 'pcF');
  h += B('bud', 20, 500, 450, RED, '9 · Budding → new enveloped HIV',
    ['the particle buds out wrapped in host membrane with', 'viral glycoproteins; infects more immune cells', '→ immune system collapses = AIDS']);
  h += G('classes', R(490, 500, 450, 100, GREY) + T(502, 522, 'The six classes of animal viruses (by genome)', B_) +
    lines(502, 540, 15, ['I dsDNA · II ssDNA · III dsRNA', 'IV ssRNA that IS the mRNA (+)', 'V ssRNA template for mRNA (−): needs an RNA→RNA polymerase', 'VI retrovirus: ssRNA → DNA by reverse transcriptase (HIV)'], 'font-size="12"'));

  window.QPROC = Object.assign(window.QPROC || {}, {
    cycle: {
      title: 'The general replicative cycle of a virus',
      svg: S(482, c),
      cap: 'Attach (receptor handshake) → enter → genome released → host copies it and makes the proteins → self-assembly → exit (lysis, or budding with an envelope).',
      parts: {
        attach: 'Step 1: a viral surface protein fits a specific receptor on the host cell like a handshake; this decides the host range and the tissue.',
        enter: 'Step 2: entry by injection (phage tail), endocytosis, or fusion of the envelope with the plasma membrane.',
        uncoat: 'Step 3: the viral genome is free inside the cell and takes command of it.',
        copy: 'Step 4: the genome is copied; DNA viruses use the host DNA polymerase, RNA viruses their own RNA-copying polymerase, which cells lack.',
        proteins: 'Step 5: host ribosomes, tRNAs, amino acids and ATP make the viral proteins.',
        assemble: 'Step 6: genome and capsomeres self-assemble into new virus particles.',
        exit: 'Step 7: the new viruses leave, often damaging or killing the cell (this and the body\'s reaction cause the symptoms), and infect other cells.',
        envelope: 'Enveloped viruses: the envelope is host membrane carrying viral glycoproteins made on the ER and finished in the Golgi.',
        bud: 'Budding wraps each capsid in membrane as it leaves, like exocytosis; the cell need not die. Herpesviruses take their envelope from the nuclear envelope and the Golgi and can stay latent in nerve cells.'
      }
    },
    hiv: {
      title: 'HIV: the replicative cycle of a retrovirus',
      svg: S(612, h),
      cap: 'Fusion → 2 RNA + 2 reverse transcriptase → RNA copied into DNA → nucleus → provirus in a chromosome forever → host RNA polymerase → proteins and genomes → assembly → budding.',
      parts: {
        fuse: 'Step 1: envelope glycoproteins bind receptors on certain white blood cells; the envelope fuses with the membrane.',
        rt: 'Step 2: the capsid releases two identical single-stranded RNAs and two reverse transcriptase molecules into the cytoplasm.',
        dna: 'Step 3: reverse transcriptase uses the viral RNA as a template to make DNA, the opposite of the normal information flow.',
        nucleus: 'Step 4: the viral DNA enters the nucleus.',
        provirus: 'Step 5: the viral DNA integrates into a host chromosome as a provirus and never leaves.',
        transcribe: 'Step 6: the host\'s RNA polymerase transcribes the provirus into RNA that serves both as mRNA and as new genomes.',
        translate: 'Step 7: host ribosomes make the viral proteins, including new reverse transcriptase.',
        assemble: 'Step 8: two RNA genomes, two RT molecules and capsid proteins assemble.',
        bud: 'Step 9: the new HIV buds out with an envelope of host membrane and infects other immune cells; the collapse of the immune system is AIDS.',
        classes: 'Animal viruses are classified by genome: I dsDNA, II ssDNA, III dsRNA, IV +ssRNA (works as mRNA), V −ssRNA (template for mRNA), VI retrovirus (RNA → DNA).'
      }
    }
  });
})();
