// Process maps for chapter 1 (alterations of chromosomes): one static overview picture per process, opened from a
// question ("where does this happen, in which order?"). Elements with data-part="x" are highlighted for "key#x".
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
  // box with a bold title and text lines; height follows the number of lines
  function B(part, x, y, w, col, title, ls, a) {
    var h = 34 + ls.length * 18;
    return G(part, R(x, y, w, h, col, a) + T(x + 12, y + 22, title, B_) + lines(x + 12, y + 44, 18, ls, 'font-size="13"'));
  }
  var GRN = '#2fa37a', BLUE = '#4a7fb5', ORA = '#e07a3f', PUR = '#8e6cc0', RED = '#d1342f', YEL = '#e3a33b', TEAL = '#2b9aa8', GREY = '#7f8a9c';
  var DASH = 'stroke-dasharray="6 4"';
  // a chromosome drawn as a bar of lettered segments
  function bar(x, y, letters, w, cols) {
    var s = '';
    letters.forEach(function (ch, i) {
      var c = cols && cols[i] ? cols[i] : BLUE;
      s += '<rect x="' + (x + i * w) + '" y="' + y + '" width="' + (w - 2) + '" height="22" rx="3" fill="' + c + '" fill-opacity=".55" stroke="' + c + '"/>' +
        T(x + i * w + (w - 2) / 2, y + 16, ch, M + ' font-size="12" font-weight="700"');
    });
    return s;
  }

  /* ---------- map 1: nondisjunction -> aneuploidy ---------- */
  var c = defs('pcA');
  c += T(480, 20, 'Nondisjunction → aneuploidy: one mistake in meiosis ends up in every cell of the body', M + ' ' + B_);
  c += B('mi', 20, 36, 450, RED, 'A · Nondisjunction in meiosis I',
    ['the two homologs of one pair do not move apart;', 'both go to the same pole', '→ all 4 gametes wrong: 2 × (n + 1), 2 × (n − 1)', '(the error is copied into both second divisions)']);
  c += B('mii', 490, 36, 450, ORA, 'B · Nondisjunction in meiosis II',
    ['the two sister chromatids do not separate', '→ 1 gamete n + 1, 1 gamete n − 1, 2 normal (n)', '(only one of the two cells made the mistake)', 'Also possible in mitosis: see below']);
  c += L(245, 142, 245, 170, 'pcA'); c += L(715, 142, 715, 170, 'pcA');
  c += B('gametes', 20, 176, 920, PUR, 'Gametes with the wrong number',
    ['n + 1 (human: 24 chromosomes) or n − 1 (22) instead of n (23); the other chromosomes are shared out normally']);
  c += L(480, 228, 480, 256, 'pcA');
  c += B('fert', 20, 262, 300, BLUE, 'Fertilization', ['abnormal gamete + normal gamete (n)', '→ aneuploid zygote', '(sets incomplete: 2n ± 1)']);
  c += L(320, 300, 346, 300, 'pcA');
  c += B('mono', 340, 262, 290, TEAL, '2n − 1 = monosomic', ['only one copy of that chromosome', 'human: 45 chromosomes', 'e.g. Turner syndrome 45,X']);
  c += B('tri', 650, 262, 290, GRN, '2n + 1 = trisomic', ['three copies of that chromosome', 'human: 47 chromosomes', 'e.g. Down = trisomy 21, XXY']);
  c += L(480, 368, 480, 396, 'pcA');
  c += B('mitosis', 20, 402, 450, YEL, 'Mitosis copies the error',
    ['every cell of the embryo gets the same 45 or 47', 'nondisjunction in MITOSIS of a young embryo instead', '→ mosaic: a mix of normal and aneuploid cells']);
  c += B('syndrome', 490, 402, 450, RED, 'Result',
    ['10–25 % of conceptions; most lost = miscarriage', 'survivors: a syndrome, caused by the wrong gene dose', '(hundreds of genes at 1.5 × or 0.5 × at once)']);
  c += B('polyploid', 20, 500, 920, GREY, 'Contrast: polyploidy = whole extra sets, not one chromosome',
    ['3n triploid (diploid egg + normal sperm), 4n tetraploid (2n zygote copies its DNA but does not divide); banana 3n, wheat 6n, strawberry 8n',
     'a whole set keeps the genetic balance → polyploids look more normal than aneuploids; common in plants, rare in animals'], DASH);

  /* ---------- map 2: structural changes ---------- */
  var s = defs('pcB');
  s += T(480, 20, 'A chromosome breaks (radiation, chemicals, errors in meiosis): four kinds of structural change', M + ' ' + B_);
  s += G('break', R(20, 34, 920, 74, GREY) + T(32, 56, 'Normal chromosome, drawn as segments (each letter = a block of genes)', B_) +
    bar(32, 70, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], 54) + T(480, 86, 'break points →', 'font-size="13"') +
    T(600, 86, 'the fragment is lost, re-attached, flipped or moved', 'font-size="13"'));
  s += L(480, 108, 480, 128, 'pcB');
  var P = [['deletion', RED, 'Deletion', ['A', 'B', 'C', 'E', 'F', 'G', 'H'], ['fragment lost', '→ genes missing', 'homozygous, or on the', 'single X: usually lethal']],
    ['duplication', ORA, 'Duplication', ['A', 'B', 'C', 'B', 'C', 'D', 'E', 'F'], ['fragment attached as an', 'extra piece to a sister or', 'nonsister chromatid', '→ genes doubled; harmful']],
    ['inversion', PUR, 'Inversion', ['A', 'D', 'C', 'B', 'E', 'F', 'G', 'H'], ['fragment re-attached to the', 'same chromosome, reversed', '→ all genes present,', 'normal dose']],
    ['translocation', BLUE, 'Translocation', ['A', 'B', 'C', 'D', 'E', 'M', 'N', 'O'], ['fragment joins a NON-', 'homologous chromosome;', 'reciprocal = pieces swapped', '→ all genes present']]];
  P.forEach(function (p, i) {
    var x = 20 + i * 232;
    s += G(p[0], R(x, 134, 222, 150, p[1]) + T(x + 10, 156, p[2], B_) + bar(x + 10, 166, p[3], 25, p[3].map(function (ch) { return 'MNO'.indexOf(ch) >= 0 ? ORA : p[1]; })) +
      lines(x + 10, 212, 18, p[4], 'font-size="13"'));
  });
  s += B('unequal', 20, 304, 450, ORA, 'Unequal crossing-over: one deletion + one duplication',
    ['nonsister chromatids exchange pieces of UNEQUAL size:', 'one gives more genes than it receives', '→ one chromatid with a deletion, one with a duplication']);
  s += B('position', 490, 304, 450, PUR, 'Position effect: balance kept, phenotype still changes',
    ['inversion and reciprocal translocation keep every gene', 'in its normal dose, but a gene in a new neighbourhood', 'can be switched on or off → devastating effects possible']);
  s += B('philadelphia', 20, 418, 920, RED, 'Philadelphia chromosome: a translocation that causes cancer (CML, chronic myelogenous leukemia)',
    ['reciprocal translocation 9 ↔ 22 during MITOSIS of a white-blood-cell precursor: a large part of 22 swapped for a small tip of 9',
     '→ a much shorter chromosome 22 (the Philadelphia chromosome) + a longer 9; the break joins two genes into a new FUSED gene',
     '→ uncontrolled progress through the cell cycle; the same breakpoint in all leukemic cells of one patient (clonal origin, chapter 2)']);

  window.QPROC = Object.assign(window.QPROC || {}, {
    nondis: {
      title: 'Nondisjunction → aneuploidy: from one mistake in meiosis to a syndrome',
      svg: S(602, c),
      cap: 'Meiosis I error: 4 wrong gametes; meiosis II error: 2. Fertilization makes a monosomic (2n − 1) or trisomic (2n + 1) zygote; mitosis copies it into every cell.',
      parts: {
        mi: 'Meiosis I: the homologs stay together → all four gametes have the wrong number (2 × n + 1, 2 × n − 1).',
        mii: 'Meiosis II: the sister chromatids stay together → one n + 1, one n − 1, two normal gametes.',
        gametes: 'A gamete with 24 or 22 chromosomes instead of 23; only one chromosome is affected.',
        fert: 'At fertilization the abnormal gamete meets a normal one: the zygote is aneuploid.',
        mono: 'Monosomic = one copy of a chromosome, 2n − 1 (45 in humans); Turner (45,X) is the only viable monosomy.',
        tri: 'Trisomic = three copies, 2n + 1 (47 in humans): Down syndrome (21), Klinefelter (XXY).',
        mitosis: 'Mitosis passes the number on to every cell; nondisjunction in mitosis of an early embryo gives a mosaic.',
        syndrome: 'Monosomy and trisomy occur in 10–25 % of conceptions and are the main cause of miscarriage; survivors have a syndrome caused by the wrong gene dose.',
        polyploid: 'Polyploidy (3n, 4n) = whole extra sets; the balance between genes is kept, so polyploids look more normal; plants tolerate it well.'
      }
    },
    struct: {
      title: 'Structural changes of a chromosome: deletion, duplication, inversion, translocation',
      svg: S(516, s),
      cap: 'A break makes a fragment that is lost (deletion), added (duplication), flipped (inversion) or moved to a non-homologous chromosome (translocation).',
      parts: {
        'break': 'A break from radiation, chemicals or a meiosis error frees a fragment; what happens to it decides the type of change.',
        deletion: 'Deletion: the fragment is lost; the chromosome misses genes. Large deletions are usually lethal when homozygous (or on a male\'s single X).',
        duplication: 'Duplication: the fragment is attached as an extra segment to a sister or nonsister chromatid; genes are doubled.',
        inversion: 'Inversion: the fragment re-attaches to its own chromosome in reverse orientation; all genes still present.',
        translocation: 'Translocation: the fragment joins a non-homologous chromosome; reciprocal = segments exchanged. Gene dose stays normal.',
        unequal: 'Unequal crossing-over in meiosis: nonsister chromatids swap pieces of unequal size → one deletion and one duplication.',
        position: 'Position effect: inversions and translocations keep every gene\'s dose, yet can change the phenotype because a gene\'s neighbours influence its expression.',
        philadelphia: 'The Philadelphia chromosome: reciprocal 9;22 translocation in a white-blood-cell precursor makes a fused gene that drives chronic myelogenous leukemia.'
      }
    }
  });
})();
