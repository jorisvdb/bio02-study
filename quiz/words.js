/* Difficult words: flashcards of the course glossary (data/terms_*.js, window.QTERMS).
   Flow: the word is shown → say aloud what it is → Reveal (Space) → definition, what it is, where it sits, picture with
   the spot highlighted → "I had it" (1) or "Not yet" (2). Progress per word in localStorage 'bio02words.v1'. */
(function () {
  'use strict';
  var KEY = 'bio02words.v1';
  var T = (window.QTERMS || []).filter(function (x) { return x && x.t; });
  T.forEach(function (x, i) { x.id = x.t.toLowerCase(); x.n = i; });
  var app = document.getElementById('app');
  var S = load();
  var SES = null;        // { list: [term], i, right, wrong, revealed, title }

  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { }
    s = s || {};
    s.w = s.w || {};                 // per word: { r: right count, x: wrong count, last: 'r' | 'x', t: time }
    s.ch = s.ch || [1, 2, 3, 4];
    s.shuffle = !!s.shuffle;
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function st(x) { return S.w[x.id] || null; }
  function known(x) { var s = st(x); return !!s && s.last === 'r'; }
  function wrong(x) { var s = st(x); return !!s && s.last === 'x'; }
  function dot(x) { return '<span class="w-dot' + (known(x) ? ' ok' : wrong(x) ? ' bad' : '') + '"></span>'; }
  function inCh(x) { return S.ch.indexOf(x.ch) >= 0; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // groups in data order, per chapter
  function groups() {
    var out = [], idx = {};
    T.forEach(function (x) {
      var k = x.ch + '|' + x.g;
      if (!idx[k]) { idx[k] = { ch: x.ch, g: x.g, terms: [] }; out.push(idx[k]); }
      idx[k].terms.push(x);
    });
    out.sort(function (a, b) { return a.ch - b.ch || a.terms[0].n - b.terms[0].n; });
    return out;
  }

  /* ---------------- home ---------------- */
  function home() {
    SES = null;
    var sel = T.filter(inCh), nk = sel.filter(function (x) { return !known(x); }), nw = sel.filter(wrong);
    var h = '<p class="small"><a href="index.html">← Quiz</a> · <a href="pictures.html">🖼 All pictures</a></p><h1>📖 Difficult words</h1>' +
      '<p class="muted">The words of the course glossary (' + T.length + '), sorted by concept. You see a word: say out loud what it is and what it does, then press <b>Reveal</b> (Space). You get a short definition, <b>what it is</b> and <b>where it sits</b> (on DNA? on mRNA? in a protein?), and a picture with that spot highlighted. Then tell honestly if you had it.</p>';
    if (!T.length) h += '<div class="card">No words loaded yet (data/terms_*.js missing).</div>';
    h += '<div class="card"><div class="row chapters"><b>Chapters</b> ' +
      [1, 2, 3, 4].map(function (c) { return '<label><input type="checkbox" class="chk" value="' + c + '"' + (S.ch.indexOf(c) >= 0 ? ' checked' : '') + '> ' + c + '</label>'; }).join('') +
      '<button class="small" id="chAll">all</button><button class="small" id="chNone">none</button></div>' +
      '<div class="row" style="margin-top:8px"><label><input type="checkbox" id="shuf"' + (S.shuffle ? ' checked' : '') + '> Mix the order (otherwise: concept by concept)</label></div></div>';
    h += '<div class="modes">' +
      '<button class="mode primary" data-go="todo"><b>Words I don\'t know yet (' + nk.length + ')</b><span>New words and words you missed, ticked chapters.</span></button>' +
      '<button class="mode" data-go="wrong"><b>Only my misses (' + nw.length + ')</b><span>Words you said "not yet" to the last time.</span></button>' +
      '<button class="mode" data-go="all"><b>All words (' + sel.length + ')</b><span>Every word of the ticked chapters, also the ones you know.</span></button>' +
      '</div>';
    h += '<h2>By concept</h2><p class="small muted">Click a concept to practise only its words, or 📋 to read them as a list. Dot: <span class="w-dot ok"></span>had it · <span class="w-dot bad"></span>not yet · <span class="w-dot"></span>not seen.</p>' +
      '<table class="w-groups"><tbody>';
    var lastCh = 0;
    groups().forEach(function (G, gi) {
      if (!inCh(G.terms[0])) return;
      if (G.ch !== lastCh) { lastCh = G.ch; h += '<tr class="chrow"><td colspan="3">Chapter ' + G.ch + '</td></tr>'; }
      var k = G.terms.filter(known).length;
      h += '<tr><td><button class="small" data-g="' + gi + '">▶ ' + esc(G.g) + '</button></td>' +
        '<td class="n">' + k + ' / ' + G.terms.length + ' known</td>' +
        '<td><button class="small" data-list="' + gi + '" title="Read the words of this concept as a list">📋 list</button></td></tr>';
    });
    h += '</tbody></table><p class="small muted" style="margin-top:14px"><button class="small" id="reset">Forget my word progress</button></p>';
    app.innerHTML = h;
    window.scrollTo(0, 0);
    [].forEach.call(app.querySelectorAll('.chk'), function (c) {
      c.onchange = function () { S.ch = [].filter.call(app.querySelectorAll('.chk'), function (e) { return e.checked; }).map(function (e) { return +e.value; }); save(); home(); };
    });
    app.querySelector('#chAll').onclick = function () { S.ch = [1, 2, 3, 4]; save(); home(); };
    app.querySelector('#chNone').onclick = function () { S.ch = []; save(); home(); };
    app.querySelector('#shuf').onchange = function (e) { S.shuffle = e.target.checked; save(); };
    app.querySelector('#reset').onclick = function () { if (confirm('Forget which words you know?')) { S.w = {}; save(); home(); } };
    var G = groups();
    [].forEach.call(app.querySelectorAll('[data-go]'), function (b) {
      b.onclick = function () {
        var m = b.getAttribute('data-go'), l = T.filter(inCh);
        if (m === 'todo') l = l.filter(function (x) { return !known(x); });
        if (m === 'wrong') l = l.filter(wrong);
        start(l, b.querySelector('b').textContent);
      };
    });
    [].forEach.call(app.querySelectorAll('[data-g]'), function (b) {
      b.onclick = function () { var g = G[+b.getAttribute('data-g')]; start(g.terms.slice(), 'Ch ' + g.ch + ' · ' + g.g); };
    });
    [].forEach.call(app.querySelectorAll('[data-list]'), function (b) {
      b.onclick = function () { list(G[+b.getAttribute('data-list')]); };
    });
  }

  /* ---------------- list of one concept ---------------- */
  function chips(x) {
    return '<div class="w-chips">' +
      '<span class="w-chip"><b>is</b>' + esc(x.is) + '</span>' +
      '<span class="w-chip at"><b>where / found in</b>' + esc(x.at) + '</span>' +
      (x.org ? '<span class="w-chip"><b>in</b>' + esc(x.org) + '</span>' : '') + '</div>';
  }
  function list(G) {
    var h = '<p class="small"><button class="small" id="back">← Words</button></p><h1>Ch ' + G.ch + ' · ' + esc(G.g) + '</h1><dl class="w-list">';
    G.terms.forEach(function (x) {
      h += '<dt>' + dot(x) + esc(x.t) + (x.nl ? ' <span class="muted small">(' + esc(x.nl) + ')</span>' : '') + '</dt><dd><div class="w-defl">' + x.d + '</div>' + chips(x) + (x.trap ? '<div class="w-trap">' + x.trap + '</div>' : '') + '</dd>';
    });
    h += '</dl><div class="actions"><button class="primary" id="go">▶ Practise these ' + G.terms.length + ' words</button></div>';
    app.innerHTML = h; window.scrollTo(0, 0);
    app.querySelector('#back').onclick = home;
    app.querySelector('#go').onclick = function () { start(G.terms.slice(), 'Ch ' + G.ch + ' · ' + G.g); };
  }

  /* ---------------- flashcards ---------------- */
  function start(l, title) {
    if (!l.length) { alert('No words in this selection.'); return; }
    if (S.shuffle) shuffle(l); else l.sort(function (a, b) { return a.n - b.n; });
    SES = { list: l, i: 0, right: 0, wrong: 0, missed: [], title: title.replace(/\s*\(\d+\)$/, '') };
    card();
  }
  function card() {
    var x = SES.list[SES.i], n = SES.list.length;
    SES.revealed = false;
    app.innerHTML = '<p class="small"><button class="small" id="back">← Words</button> <span class="muted">' + esc(SES.title) + '</span></p>' +
      '<div class="progress"><i style="width:' + (100 * SES.i / n) + '%"></i></div>' +
      '<div class="badges"><span class="badge">' + (SES.i + 1) + ' / ' + n + '</span><span class="badge">Ch ' + x.ch + '</span><span class="badge">' + esc(x.g) + '</span>' +
      (st(x) ? '<span class="badge">' + (known(x) ? 'had it last time' : 'missed last time') + '</span>' : '') + '</div>' +
      '<div class="card"><div class="w-term">' + esc(x.t) + '</div>' +
      '<p class="w-ask">Say out loud: <b>what</b> is it, what does it <b>do</b>, and <b>where</b> do you find it (on DNA? on RNA? in a protein? in which part of the cell?)</p>' +
      '<div id="ans"><button class="primary w-reveal" id="rev">Reveal <span class="kbd" style="color:inherit">(Space)</span></button></div></div>';
    app.querySelector('#back').onclick = home;
    app.querySelector('#rev').onclick = reveal;
    window.scrollTo(0, 0);
  }
  function reveal() {
    if (!SES || SES.revealed) return;
    SES.revealed = true;
    var x = SES.list[SES.i], box = app.querySelector('#ans');
    box.innerHTML = (x.nl ? '<p class="w-nl">Dutch: ' + esc(x.nl) + '</p>' : '') +
      '<div class="w-def">' + x.d + '</div>' + chips(x) +
      (x.trap ? '<div class="w-trap">' + x.trap + '</div>' : '') +
      '<div id="wpic"></div>' +
      '<div class="w-judge"><button class="yes" id="yes">✓ I had it <span class="kbd">(1)</span></button><button class="no" id="no">✗ Not yet <span class="kbd">(2)</span></button></div>';
    drawPic(x, box.querySelector('#wpic'));
    box.querySelector('#yes').onclick = function () { judge(true); };
    box.querySelector('#no').onclick = function () { judge(false); };
  }
  function judge(ok) {
    if (!SES || !SES.revealed) return;
    var x = SES.list[SES.i], s = S.w[x.id] || (S.w[x.id] = { r: 0, x: 0 });
    if (ok) { s.r++; SES.right++; } else { s.x++; SES.wrong++; SES.missed.push(x); }
    s.last = ok ? 'r' : 'x'; s.t = Date.now(); save();
    SES.i++;
    if (SES.i < SES.list.length) card(); else summary();
  }
  function summary() {
    var m = SES.missed;
    var h = '<h1>Done: ' + esc(SES.title) + '</h1><div class="stats"><div class="stat"><b>' + SES.right + '</b><span>had it</span></div><div class="stat"><b>' + SES.wrong + '</b><span>not yet</span></div></div>';
    if (m.length) h += '<h2>Not yet</h2><dl class="w-list">' + m.map(function (x) { return '<dt>' + esc(x.t) + '</dt><dd><div class="w-defl">' + x.d + '</div>' + chips(x) + '</dd>'; }).join('') + '</dl>';
    h += '<div class="actions">' + (m.length ? '<button class="primary" id="again">Repeat the ' + m.length + ' missed words</button>' : '') + '<button id="home">← Words</button></div>';
    app.innerHTML = h; window.scrollTo(0, 0);
    if (m.length) app.querySelector('#again').onclick = function () { start(m.slice(), 'Missed words'); };
    app.querySelector('#home').onclick = home;
  }

  /* ---------------- picture with the spot highlighted ----------------
     pic = 'key' | 'key#part' (QPICS, or 'proc:key' for a process map); hl = label text to ring when no part fits. */
  function drawPic(x, box) {
    if (!x.pic) return;
    var refs = [].concat(x.pic).slice(0, 2), h = '';
    refs.forEach(function (ref, i) {
      var k = String(ref).split('#'), key = k[0], part = k[1] || '';
      var P = key.indexOf('proc:') === 0 ? (window.QPROC || {})[key.slice(5)] : (window.QPICS || {})[key];
      if (!P) return;
      var cap = (part && P.parts && P.parts[part]) || '';
      h += '<figure class="qpic' + (key.indexOf('proc:') === 0 ? ' qproc' : '') + '" data-i="' + i + '" data-part="' + esc(part) + '"><figcaption class="qpic-t">🖼 ' + esc(P.title) + '</figcaption>' + P.svg +
        (cap ? '<p class="qpic-c">' + cap + '</p>' : '') + '</figure>';
    });
    box.innerHTML = h;
    [].forEach.call(box.querySelectorAll('figure'), function (fig) {
      var part = fig.getAttribute('data-part');
      if (part) [].forEach.call(fig.querySelectorAll('[data-part]'), function (e) {
        if (e.tagName.toLowerCase() === 'figure') return;
        e.classList.add(e.getAttribute('data-part').split(' ').indexOf(part) >= 0 ? 'pic-hl' : 'pic-dim');
      });
      ring(fig.querySelector('svg'), x.hl || (part ? '' : x.t));
    });
  }
  // draw an orange ring around every label that contains the text
  function ring(svg, text) {
    if (!svg || !text) return;
    var want = text.toLowerCase(), NS = 'http://www.w3.org/2000/svg';
    [].forEach.call(svg.querySelectorAll('text'), function (t) {
      if ((t.textContent || '').toLowerCase().indexOf(want) < 0) return;
      var b; try { b = t.getBBox(); } catch (e) { return; }
      if (!b || !b.width) return;
      var r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', b.x - 4); r.setAttribute('y', b.y - 3); r.setAttribute('width', b.width + 8); r.setAttribute('height', b.height + 6);
      r.setAttribute('rx', 6); r.setAttribute('class', 'term-ring');
      var tf = t.getAttribute('transform'); if (tf) r.setAttribute('transform', tf);
      t.parentNode.insertBefore(r, t.nextSibling);
      t.classList.add('term-lbl');
    });
  }

  document.addEventListener('keydown', function (ev) {
    if (!SES || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    var tag = (ev.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (!SES.revealed && (ev.key === ' ' || ev.key === 'Enter')) { ev.preventDefault(); reveal(); }
    else if (SES.revealed && (ev.key === '1' || ev.key === 'ArrowRight')) { ev.preventDefault(); judge(true); }
    else if (SES.revealed && (ev.key === '2' || ev.key === 'ArrowLeft')) { ev.preventDefault(); judge(false); }
  });

  home();
})();
