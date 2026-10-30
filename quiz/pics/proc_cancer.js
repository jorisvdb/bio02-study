// Process maps for chapter 2 (the genetic basis of cancer). Elements with data-part="x" are highlighted for "key#x".
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

  /* ---------- map 1: how a cancer evolves ---------- */
  var e = defs('pcC');
  e += T(480, 20, 'How a cancer evolves: one cell, many hits, many years (a Darwinian process inside the body)', M + ' ' + B_);
  e += B('mutation', 20, 36, 290, YEL, '1 · One cell mutates',
    ['10¹³ cells, billions of mutations a day;', 'one gives a selective advantage:', 'the cell divides a bit more / dies less']);
  e += L(310, 80, 326, 80, 'pcC');
  e += B('clone', 330, 36, 290, ORA, '2 · A clone grows',
    ['all descendants of that one cell;', 'cancers are clonal: the Philadelphia', 'breakpoint is identical in one patient']);
  e += L(620, 80, 636, 80, 'pcC');
  e += B('hits', 640, 36, 300, RED, '3 · More hits, over years (Knudson)',
    ['each new mutation or epigenetic change', 'gives one cell an edge; selection in a harsh', 'tumour (little oxygen, few nutrients)']);
  e += L(790, 124, 790, 146, 'pcC');
  e += B('benign', 20, 152, 290, GRN, '4 · Benign tumour (neoplasm)',
    ['grows, but stays inside the basal lamina', '(the sheet under an epithelium);', 'removing it locally usually cures']);
  e += L(310, 196, 326, 196, 'pcC');
  e += B('invade', 330, 152, 290, PUR, '5 · Malignant = invasion',
    ['cells break through the basal lamina', 'into the tissue below = true cancer', '(carcinoma = from epithelium, 85 %)']);
  e += L(620, 196, 636, 196, 'pcC');
  e += B('vessel', 640, 152, 300, BLUE, '6 · Into a vessel',
    ['single cells into blood, clumps into lymph', '(→ lymph-node metastases); circulating', 'tumour cells: < 1 in 1000 survive 24 h']);
  e += L(790, 240, 790, 262, 'pcC');
  e += B('metastasis', 20, 268, 600, RED, '7 · Metastasis: a colony in a foreign organ (90 % of cancer deaths)',
    ['exit the vessel → micrometastasis (10 to 1000s of cells) → very rarely a full tumour (< 0.1 %)', 'colonization is the hardest, rate-limiting step; a micrometastasis can stay dormant for years']);
  e += B('stroma', 640, 268, 300, TEAL, 'Helpers: the microenvironment',
    ['stroma = fibroblasts, immune cells, vessels;', 'angiogenesis feeds the hypoxic core;', 'immune cells are switched off']);
  e += B('instability', 20, 360, 450, ORA, 'Accelerator: genetic instability (selected for)',
    ['repair failure → many point mutations, or a chaotic karyotype:', 'breaks, aneuploidy, micronucleus → chromothripsis (shattered,', 'reassembled at random) → heterogeneity: competing subclones']);
  e += B('hallmarks', 490, 360, 450, PUR, 'Hallmarks of cancer (Hanahan and Weinberg 2000)',
    ['own growth signals · ignore stop signals · evade apoptosis', 'limitless division (telomeres) · angiogenesis · invasion/metastasis', '2011: + metabolism, immune escape; enabling: instability, inflammation']);
  e += G('hits', T(20, 470, 'Timeline: lung cancer decades after smoking starts; leukemia ≈ 5 years after Hiroshima; industrial cancers 10–20 years; a tumour has ≈ 10⁹ cells when first felt.', 'font-size="13"'));

  /* ---------- map 2: cancer-critical genes and the three controls ---------- */
  var g = defs('pcD');
  g += T(480, 20, 'Cancer-critical genes: gas pedal or brake, and the three controls that almost every cancer breaks', M + ' ' + B_);
  g += G('onco', R(20, 34, 450, 184, RED) + T(32, 56, 'Proto-oncogene = gas pedal → oncogene', B_) +
    lines(32, 78, 18, ['gain-of-function: too much or overactive protein', 'ONE hit is enough (dominant): one mutant copy drives the cell'], 'font-size="13"'));
  g += G('ways3', R(30, 120, 430, 90, RED, DASH) + T(40, 140, '3 ways to make an oncogene', B_) +
    lines(40, 157, 15, ['① point mutation / small deletion: in the coding part → hyperactive protein', '   (EGF receptor without its outer part = a doorbell stuck); in control DNA → more', '② gene amplification → extra copies → too much normal protein', '③ rearrangement → fusion protein, or a strong promoter → overproduced'], 'font-size="11"'));
  g += G('tsg', R(490, 34, 450, 184, BLUE) + T(502, 56, 'Tumor suppressor gene = brake', B_) +
    lines(502, 78, 18, ['loss-of-function: the brake protein is gone', 'TWO hits needed (recessive): both copies must be lost'], 'font-size="13"'));
  g += G('hits2', T(502, 114, 'hit 1: point mutation or small deletion (inherited in hereditary retinoblastoma)', 'font-size="11"'));
  g += G('ways6', R(500, 122, 430, 88, BLUE, DASH) + T(510, 140, 'hit 2, six ways to lose the good copy', B_) +
    lines(510, 157, 15, ['deletion · point mutation', 'loss of the whole chromosome (mis-segregation in mitosis)', 'mitotic recombination · gene conversion', 'epigenetic: methylation of the C in CG of the promoter → silenced'], 'font-size="11"'));
  g += T(480, 244, 'Three controls, each broken by ONE mutated gene per pathway (glioblastoma: 74 % have all three; ovarian: 67 % / 45 % / 96 %)', M + ' ' + B_ + ' font-size="13"');
  g += B('rb', 20, 256, 290, GRN, 'Rb pathway = cell-cycle entry',
    ['Rb protein = main brake on starting the cycle', 'Rb lost in retinoblastoma, and in lung,', 'breast and bladder carcinomas']);
  g += B('ras', 330, 256, 290, ORA, 'RTK / Ras / PI 3-kinase = growth',
    ['passes growth signals from the outside in;', 'Ras = switch protein, stuck "on" by a point', 'mutation; mutated in ~30 % of cancers']);
  g += B('p53', 640, 256, 300, PUR, 'p53 pathway = stress response',
    ['p53 mutated in ~50 % of cancers (most often', 'its DNA-binding domain); normally little p53:', 'made and quickly degraded; rises on stress']);
  g += T(480, 384, 'p53 rises on: DNA damage · telomere loss · hypoxia · osmotic or oxidative stress · oncogene overdrive (Myc) → "desperate action":', M + ' font-size="13"');
  g += B('p21', 20, 396, 300, GRN, 'Arrest: p53 → p21 → Cdk blocked',
    ['p53 is a transcription regulator; it switches', 'on p21, which inhibits the cyclin-Cdk', 'complexes → no S phase, time to repair']);
  g += B('senescence', 340, 396, 290, YEL, 'Senescence',
    ['= permanent, irreversible arrest;', 'the damaged cell never divides again', '(tumour-suppressive)']);
  g += B('apoptosis', 650, 396, 290, RED, 'Apoptosis = the good death',
    ['cell eaten by neighbours, contents recycled;', 'necrosis = bad death: the cell bursts,', 'inflammation. Lose p53 → stressed cells live']);
  g += G('colorectal', R(20, 504, 920, 70, TEAL) + T(32, 526, 'Colorectal cancer: the usual order of changes (every patient differs)', B_));
  var steps = [['Apc lost', 'early, already in', 'small polyps'], ['instability', 'genetic and', 'epigenetic'], ['K-Ras activated', 'in larger', 'polyps'], ['p53 lost', 'late: carcinoma', 'stage'], ['invasion,', 'metastasis', '']];
  steps.forEach(function (s, i) {
    var x = 40 + i * 182;
    g += G('colorectal', '<rect x="' + x + '" y="' + 534 + '" width="150" height="34" rx="6" fill="' + TEAL + '" fill-opacity=".25" stroke="' + TEAL + '"/>' +
      T(x + 75, 548, s[0], M + ' font-size="12" font-weight="700"') + T(x + 75, 562, s[1] + ' ' + s[2], M + ' font-size="10"'));
    if (i < 4) g += L(x + 152, 551, x + 178, 551, 'pcD');
  });

  window.QPROC = Object.assign(window.QPROC || {}, {
    evolve: {
      title: 'How a cancer evolves: from one mutated cell to a metastasis',
      svg: S(484, e),
      cap: 'Mutation → clone → more hits (selection) → benign → invasion through the basal lamina → vessel → metastasis; instability speeds it up, the stroma helps.',
      parts: {
        mutation: 'Step 1: one of the body\'s 10¹³ cells gets a mutation that lets it divide a little more or die less: a selective advantage.',
        clone: 'Step 2: its descendants form a clone; all cancers start from one cell (same Philadelphia breakpoint in all cells of one patient).',
        hits: 'Step 3: over years, more mutations and epigenetic changes accumulate (Knudson\'s multiple hits); each winner outgrows its neighbours.',
        benign: 'Step 4: a benign tumour grows but stays within the basal lamina; local removal cures it.',
        invade: 'Step 5: malignant = the cells invade through the basal lamina into the surrounding tissue; only now is it a true cancer.',
        vessel: 'Step 6: cells enter blood vessels (singly) or lymph vessels (in clumps → lymph-node metastases); fewer than 1 in 1000 survive 24 h.',
        metastasis: 'Step 7: a cell exits the vessel and founds a micrometastasis; fewer than 0.1 % become a full tumour; metastasis causes 90 % of cancer deaths.',
        stroma: 'The stroma (fibroblasts, immune cells, vessels) is recruited; angiogenesis feeds the tumour; immune cells are suppressed.',
        instability: 'Genetic instability (repair failure or a chaotic karyotype, chromothripsis) is selected for because it speeds up evolution and creates subclones.',
        hallmarks: 'The six hallmarks of 2000 plus the 2011 additions: the set of abilities a cell must acquire to become a cancer.'
      }
    },
    genes: {
      title: 'Cancer-critical genes: oncogenes, tumor suppressors and the three pathways',
      svg: S(588, g),
      cap: 'Gas pedal (proto-oncogene → oncogene, one hit) versus brake (tumor suppressor, two hits); the Rb, Ras and p53 controls; p53\'s three answers; the colorectal order.',
      parts: {
        onco: 'A proto-oncogene is a normal gene whose gain-of-function mutation drives the cell towards cancer; its mutant form is an oncogene. One hit is enough (dominant).',
        ways3: 'Three accidents make an oncogene: a point mutation or small deletion, gene amplification, or a chromosome rearrangement (fusion protein or strong promoter).',
        tsg: 'A tumor suppressor gene is a brake; cancer needs its loss of function, usually of both copies (recessive).',
        hits2: 'The first hit is a point mutation or small deletion; in hereditary retinoblastoma it is inherited in every cell.',
        ways6: 'The second copy is lost by deletion, point mutation, loss of the chromosome, mitotic recombination, gene conversion or promoter methylation.',
        rb: 'The Rb pathway controls entry into the cell cycle; Rb was found through retinoblastoma and is lost in many carcinomas.',
        ras: 'The RTK/Ras/PI 3-kinase pathway passes growth signals into the cell; Ras is a switch protein stuck on in ~30 % of cancers.',
        p53: 'p53 is mutated in about half of all cancers; normally scarce, it rises when the cell is in danger.',
        p21: 'p53 switches on p21, which blocks the cyclin-Cdk complexes, so the cell cannot enter S phase: arrest, time to repair.',
        senescence: 'Senescence is the permanent version of the arrest: the cell never divides again.',
        apoptosis: 'Apoptosis is the good, tidy death (recycled by neighbours); necrosis is the bad death (bursting, inflammation). Without p53, stressed cells survive.',
        colorectal: 'Typical order in colorectal cancer: Apc lost (early) → instability → K-Ras activated → p53 lost (needed to tolerate hyperactive oncogenes) → invasion.'
      }
    }
  });
})();
