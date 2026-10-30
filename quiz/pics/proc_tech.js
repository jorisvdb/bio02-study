// Process maps for chapter 4 (tools and techniques). Elements with data-part="x" are highlighted for "key#x".
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

  /* ---------- map 1: PCR and cDNA ---------- */
  var p = defs('pcG');
  p += T(480, 20, 'PCR: one stretch of DNA → more than a million copies; and cDNA: a DNA copy of an mRNA', M + ' ' + B_);
  p += B('primers', 20, 36, 300, YEL, 'Need: template + 2 primers',
    ['primer = synthetic single-stranded DNA of', '≈ 20 bases, complementary to the 3′ end of one', 'strand; the two primers set the boundaries']);
  p += B('taq', 340, 36, 290, ORA, 'Need: dNTPs + heat-stable polymerase',
    ['Taq = DNA polymerase from Thermus', 'aquaticus, survives 95 °C; a thermocycler', 'machine switches the temperatures']);
  p += B('double', 650, 36, 290, GRN, 'Doubling every cycle',
    ['2 → 4 → 8 → … ; 20 cycles → > 10⁶ copies', '20–40 cycles in total; from cycle 3 on', 'nearly all products are exactly the target']);
  p += L(480, 124, 480, 146, 'pcG');
  p += B('denature', 20, 152, 290, RED, '1 · Denaturation, 94–98 °C',
    ['heat breaks the hydrogen bonds:', 'the two strands come apart', '']);
  p += L(310, 196, 326, 196, 'pcG');
  p += B('anneal', 330, 152, 290, BLUE, '2 · Annealing, 50–65 °C',
    ['cooling lets each primer base-pair', '(hybridize) with its complementary', 'site on a single strand']);
  p += L(620, 196, 636, 196, 'pcG');
  p += B('extend', 640, 152, 300, PUR, '3 · Extension, 72 °C',
    ['polymerase adds dNTPs to the 3′ end of', 'each primer, building 5′→3′ → the target', 'is now doubled; back to step 1']);
  p += '<path d="M790 240 L790 254 L165 254 L165 240" fill="none" stroke="currentColor" stroke-width="2" marker-end="url(#pcG)"/>';
  p += T(480, 250, 'repeat 20–40 ×', M + ' font-size="12"');
  p += B('rt', 20, 268, 450, TEAL, 'Reverse transcription: mRNA → cDNA',
    ['reverse transcriptase (from a retrovirus, chapter 3) copies the', 'mRNA into a single DNA strand; the RNA is degraded by an enzyme;', 'DNA polymerase makes the second strand']);
  p += B('cdna', 490, 268, 450, TEAL, 'cDNA = complementary DNA',
    ['double-stranded DNA copy of an mRNA, WITHOUT introns', '→ then amplified by PCR; used for cDNA libraries, cloning,', 'qRT-PCR and microarrays']);
  p += T(20, 380, '⚠ Traps: a primer can bind elsewhere (wrong product); a copying error in an early cycle is amplified; fragments over 4–5 kb need special conditions.', 'font-size="13"');

  /* ---------- map 2: cloning ---------- */
  var k = defs('pcH');
  k += T(480, 20, 'Cloning a DNA fragment into a plasmid: many copies of one piece of DNA, grown in bacteria', M + ' ' + B_);
  k += B('insert', 20, 36, 290, YEL, '1 · The insert',
    ['the fragment of interest, usually made by', 'PCR with restriction sites built into the', 'primers (or cut out of larger DNA)']);
  k += B('vector', 330, 36, 290, BLUE, 'The vector: a plasmid',
    ['circular double-stranded DNA that replicates', 'on its own: origin of replication, selectable', 'marker, unique restriction sites; ≤ 15 kb insert']);
  k += B('marker', 640, 36, 300, GRN, 'Selectable marker',
    ['e.g. ampicillin-resistance gene: only cells', 'that carry the plasmid survive on medium', 'with the antibiotic (BAC: inserts of 100s of kb)']);
  k += L(165, 124, 165, 146, 'pcH');
  k += B('cut', 20, 152, 290, RED, '2 · Cut both with the same enzyme',
    ['restriction enzyme = bacterial defence protein', 'that cuts at a palindrome of 4–8 bp;', 'EcoRI: GAATTC, cuts after G → 5′ overhang']);
  k += L(310, 196, 326, 196, 'pcH');
  k += B('sticky', 330, 152, 290, ORA, '3 · Sticky ends base-pair',
    ['the overhangs of insert and vector are', 'complementary (same enzyme, palindrome)', '→ they anneal; blunt ends also possible']);
  k += L(620, 196, 636, 196, 'pcH');
  k += B('ligase', 640, 152, 300, PUR, '4 · DNA ligase seals',
    ['ligase joins the 5′ and 3′ ends of the', 'backbone covalently', '→ recombinant plasmid']);
  k += L(790, 240, 790, 262, 'pcH');
  k += B('transform', 20, 268, 290, TEAL, '5 · Transformation',
    ['competent E. coli (treated with salts or an', 'electric field) take up the plasmid', '']);
  k += L(310, 312, 326, 312, 'pcH');
  k += B('select', 330, 268, 290, GRN, '6 · Selection',
    ['plate on agar with the antibiotic: only', 'transformed cells grow → colonies, each', 'a clone with the plasmid copied many times']);
  k += L(620, 312, 636, 312, 'pcH');
  k += B('library', 640, 268, 300, GREY, 'Then …',
    ['library (genomic or cDNA: every fragment in', 'its own plasmid), complement a mutant, fuse', 'to GFP or a tag, strong promoter → expression']);

  /* ---------- map 3: sequencing ---------- */
  var q = defs('pcI');
  q += T(480, 20, 'Reading DNA: Sanger (one fragment) → shotgun assembly (a genome) → Illumina and Nanopore (next generation)', M + ' ' + B_);
  q += B('sanger', 20, 36, 450, YEL, 'Sanger = chain-termination sequencing',
    ['primer + DNA polymerase + the four dNTPs + a little ddNTP', 'copies of the template are made … and stopped at random', 'up to ≈ 900 bases per reaction']);
  q += B('ddntp', 490, 36, 450, RED, 'ddNTP = the chain terminator',
    ['dideoxynucleotide: no 3′ OH on its sugar → after it is built in,', 'the polymerase cannot add the next nucleotide (3′ OH rule)', 'four kinds (ddA, ddC, ddG, ddT), each with its own fluorescent colour']);
  q += L(245, 124, 245, 146, 'pcI'); q += L(715, 124, 715, 146, 'pcI');
  q += B('ladder', 20, 152, 450, ORA, 'The ladder → the sequence',
    ['fragments of every length, each ending in a coloured ddNTP;', 'capillary electrophoresis sorts them, shortest first; a laser reads', 'the colour of each → chromatogram = sequence (gel: read bottom to top)']);
  q += B('shotgun', 490, 152, 450, BLUE, 'Shotgun: a whole genome in random pieces',
    ['fragment the genome randomly (shearing or restriction enzyme),', 'add linkers, PCR, sequence every fragment, let the computer', 'assemble them by their overlaps (repeats are the hard part)']);
  q += L(715, 240, 715, 262, 'pcI');
  q += B('coverage', 20, 268, 450, PUR, 'Over-sequencing and depth of coverage',
    ['sequence far more than the genome length: 8 genome equivalents', 'for 99.9 % (E. coli 4.6 Mbp → 37 Mbp); depth 5X = a base is in', '5 reads; more depth = errors corrected, variants called with confidence']);
  q += B('assemble', 490, 268, 450, GREY, 'NGS workflow (next-generation = massively parallel)',
    ['① DNA extraction → ② library preparation (fragment + adapters)', '→ ③ sequencing → ④ data analysis: align the reads to a', 'reference genome, quality check, call the variants']);
  q += L(245, 356, 245, 378, 'pcI');
  q += B('illumina', 20, 384, 300, GRN, 'Illumina (2nd generation)',
    ['fragments with adapters stick to a glass', 'surface covered with a lawn of primers;', 'short reads of 75–150 bp, huge numbers']);
  q += L(320, 428, 336, 428, 'pcI');
  q += B('bridge', 340, 384, 290, TEAL, 'Bridge amplification → clusters',
    ['a fragment bends over to a neighbouring', 'primer and is copied, again and again', '→ a cluster of identical copies = strong signal']);
  q += L(630, 428, 646, 428, 'pcI');
  q += B('terminator', 650, 384, 290, ORA, 'Reversible terminators',
    ['fluorescent nucleotide with a blocked 3′ end:', 'one base per cycle, photograph all clusters,', 'remove block and dye, next cycle']);
  q += B('nanopore', 20, 490, 920, BLUE, 'Nanopore (3rd generation: single molecules, no PCR, no labels)',
    ['a motor protein feeds one DNA strand through a protein pore in a membrane; a voltage drives an ionic current; each base blocks the', 'current differently → the signal is decoded in real time; very long reads (whole chromosomes), direct RNA, detects methylation; portable MinION']);

  /* ---------- map 4: which question -> which tool ---------- */
  var d = defs('pcJ');
  d += T(480, 20, 'Which question → which tool? (detecting DNA, RNA, proteins and cells)', M + ' ' + B_);
  var Q = [['karyo', GREY, 'Whole chromosome set? → karyotype', ['metaphase chromosomes stained with Giemsa (bands on A/T-rich', 'DNA), sorted by size and bands; shows aneuploidy, big deletions,', 'translocations; prenatal screening (amniocentesis)']],
    ['fish', PUR, 'Where is ONE sequence on a chromosome? → FISH', ['fluorescent DNA probe hybridizes to fixed cells; DAPI stains all DNA', 'blue; two probes merge (yellow) when a translocation brings them', 'together; needs prior knowledge, misses small changes']],
    ['acgh', ORA, 'Copy number across the WHOLE genome? → array CGH', ['patient DNA labelled green, reference DNA red, hybridized together', 'to an array of genome fragments: yellow = equal, red = deletion,', 'green = duplication; plotted per chromosome']],
    ['qpcr', GRN, 'How much of ONE RNA? → qRT-PCR', ['reverse transcriptase → cDNA → PCR, product measured every', 'cycle by a dye; more starting RNA = fewer cycles to the threshold', '(100 ng ≈ 18, 1 ng ≈ 25, 1 pg ≈ 35); only between the primers']],
    ['array', BLUE, 'Which of ALL genes are on? → DNA microarray', ['a spot of DNA for every gene; cDNA of two samples labelled Cy3', '(green) and Cy5 (red) hybridized on it: yellow = equal, red/green =', 'more in one sample; clusters of genes with the same pattern']],
    ['rnaseq', TEAL, 'All RNAs, counted by sequencing? → RNA-seq', ['isolate RNA, fragment, cDNA, adapters, deep sequencing, map the', 'reads: expression level, splicing, noncoding RNA; caveat: reverse', 'transcriptase can fall off at structures or modifications']],
    ['western', RED, 'Is ONE protein there, how much? → Western blot', ['SDS-PAGE → transfer to a membrane → block with BSA → primary', 'antibody → secondary antibody with a label (enzyme, fluorophore,', 'radioactivity) → one band; needs a control for specificity']],
    ['flow', YEL, 'Count or sort cells by their markers? → flow cytometry', ['cells in single file through a laser beam: size, shape and', 'fluorescent tags (antibodies, dyes) recorded for thousands of cells', 'a minute; leukemia diagnosis, immune monitoring in HIV']]];
  Q.forEach(function (x, i) {
    var col = i % 2, row = Math.floor(i / 2);
    d += B(x[0], 20 + col * 470, 36 + row * 102, 450, x[1], x[2], x[3]);
  });

  window.QPROC = Object.assign(window.QPROC || {}, {
    pcr: {
      title: 'PCR and reverse transcription (cDNA)',
      svg: S(392, p),
      cap: 'Template + 2 primers + dNTPs + Taq; denature 94–98 °C → anneal 50–65 °C → extend 72 °C, repeated 20–40 ×: doubling each cycle. cDNA: reverse transcriptase copies mRNA into DNA.',
      parts: {
        primers: 'Two synthetic primers of about 20 bases, each complementary to the 3′ end of one strand, set the boundaries of what is copied.',
        taq: 'The polymerase must survive the heating: Taq from Thermus aquaticus; a thermocycler switches the temperatures.',
        double: 'Every cycle doubles the target; 20 cycles give more than a million copies.',
        denature: 'Step 1: at 94–98 °C the hydrogen bonds break and the two strands separate.',
        anneal: 'Step 2: at 50–65 °C the primers hybridize to their complementary sites.',
        extend: 'Step 3: at 72 °C the polymerase extends each primer from its 3′ end, building 5′→3′.',
        rt: 'Reverse transcriptase (a retroviral enzyme) copies mRNA into DNA; the RNA is removed and a second strand is made.',
        cdna: 'cDNA is a double-stranded DNA copy of an mRNA without introns; it can then be amplified, cloned or used in a library.'
      }
    },
    clone: {
      title: 'Cloning by ligation: insert → plasmid → bacteria',
      svg: S(366, k),
      cap: 'Cut insert and vector with the same restriction enzyme → sticky ends anneal → ligase seals → transform competent E. coli → select on antibiotic → colonies = clones.',
      parts: {
        insert: 'The insert is the fragment to be cloned, usually a PCR product with restriction sites built into the primers.',
        vector: 'A plasmid vector is a small circular DNA with an origin of replication, a selectable marker and unique restriction sites.',
        marker: 'The selectable marker (e.g. ampicillin resistance) lets only plasmid-carrying cells grow on the antibiotic.',
        cut: 'Restriction enzymes recognise palindromic sites of 4–8 bp and cut, leaving blunt ends or overhangs; EcoRI cuts GAATTC after the G.',
        sticky: 'Cut with the same enzyme, insert and vector have complementary overhangs (sticky ends) that base-pair.',
        ligase: 'DNA ligase joins the backbones covalently, making a recombinant plasmid.',
        transform: 'Transformation: competent cells (salts or an electric field) take up the plasmid.',
        select: 'On antibiotic agar only transformed cells grow; each colony is a clone carrying many copies of the plasmid.',
        library: 'With a cloned gene you can build a library, complement a mutant, add a reporter or tag, or overexpress the protein.'
      }
    },
    seq: {
      title: 'DNA sequencing: Sanger, shotgun assembly, Illumina, Nanopore',
      svg: S(574, q),
      cap: 'Sanger: ddNTPs stop the chain, the ladder of lengths reveals the sequence. Genomes: random fragments, over-sequenced and assembled by overlaps. Illumina: clusters + reversible terminators. Nanopore: current through a pore.',
      parts: {
        sanger: 'Sanger sequencing copies the template with a primer, polymerase, dNTPs and a little ddNTP; it reads up to about 900 bases.',
        ddntp: 'A ddNTP has no 3′ OH, so the chain stops right after it is built in; each of the four is labelled with its own colour.',
        ladder: 'Fragments of every length sorted by capillary electrophoresis; the colour of each last base gives the sequence (on a gel: read bottom to top).',
        shotgun: 'Shotgun sequencing: the genome is fragmented at random, every fragment sequenced, and the overlaps let a computer assemble the whole.',
        coverage: 'Over-sequencing (8 genome equivalents for 99.9 %) and depth of coverage (5X = five reads per base) correct errors and make variant calls reliable.',
        illumina: 'Illumina: fragments with adapters bind a lawn of primers on a glass surface; millions of short reads (75–150 bp) in parallel.',
        bridge: 'Bridge amplification copies each fragment into a cluster of identical molecules so the light signal is strong enough.',
        terminator: 'Reversible terminators: fluorescent, 3′-blocked nucleotides added one per cycle, imaged, unblocked, repeated.',
        nanopore: 'Nanopore: a single strand passes through a protein pore and each base changes the ionic current; long reads, real time, portable.',
        assemble: 'The NGS workflow: extraction, library preparation, sequencing, then alignment to a reference and variant calling.'
      }
    },
    detect: {
      title: 'Which question → which detection tool',
      svg: S(452, d),
      cap: 'Chromosome set: karyotype · one sequence\'s place: FISH · copy number genome-wide: aCGH · one RNA: qRT-PCR · all RNAs: microarray or RNA-seq · one protein: Western blot · cells: flow cytometry.',
      parts: {
        karyo: 'Karyotype analysis: Giemsa-banded metaphase chromosomes sorted by size; detects aneuploidy and gross rearrangements.',
        fish: 'FISH localises one DNA sequence on a chromosome with a fluorescent probe; merged signals reveal a translocation.',
        acgh: 'Array CGH compares patient and reference DNA on a genome-wide array to find deletions (red) and duplications (green).',
        qpcr: 'qRT-PCR measures the amount of one RNA: cDNA, then PCR followed cycle by cycle; more RNA means fewer cycles to the threshold.',
        array: 'A DNA microarray compares the expression of all genes between two samples with two colours.',
        rnaseq: 'RNA-seq sequences cDNAs in depth to count every transcript and see splicing.',
        western: 'A Western blot detects one protein with a specific primary antibody and a labelled secondary antibody after SDS-PAGE and transfer.',
        flow: 'Flow cytometry measures size, shape and fluorescent markers of thousands of cells one by one in a stream.'
      }
    }
  });
})();
