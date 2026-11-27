/* BIO02 Quiz Trainer – engine (copied from BIO01; only names, key, date and chapter list changed). Data comes from data/*.js (window.QBANK, window.QCONCEPTS). */
(function () {
  'use strict';

  var CH_NAMES = {
    1: 'Alterations of chromosomes', 2: 'The genetic basis of cancer', 3: 'Human pathogens: viruses',
    4: 'Tools and techniques in molecular biology'
  };
  var TYPES = { mc: 1, multi: 1, fill: 1, match: 1, order: 1, tf: 1 };
  var KEY = 'bio02quiz.v1';
  var EXAM_DATE = new Date(2026, 11, 9); // 9 Dec 2026
  // Leitner intervals per box (ms): 0, 5 min, 30 min, 3 h, 1 day, 3 days
  var INTERVAL = [0, 5 * 60e3, 30 * 60e3, 3 * 3600e3, 24 * 3600e3, 3 * 24 * 3600e3];
  var MASTER_BOX = 3;
  // a wrong answer comes back REASK_MIN..REASK_MIN+REASK_SPREAD-1 questions later (or at the end of a short session)
  var REASK_MIN = 10, REASK_SPREAD = 6;

  var BANK = [], BYID = {}, WARN = [];
  var CONCEPTS = window.QCONCEPTS || {};
  var storageOK = true;
  var S;            // persistent state
  var SES = null;   // current session
  var R = null;     // current question render state
  var VIEW = 'dash';
  var app = document.getElementById('app');

  /* ---------------- helpers ---------------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function strip(html) { var d = document.createElement('div'); d.innerHTML = String(html); return d.textContent || ''; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  function pct(c, n) { return n ? Math.round(100 * c / n) : 0; }
  function conceptLabel(c) { return CONCEPTS[c] || c; }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function norm(s) {
    return String(s).toLowerCase().replace(/[′’‘`´]/g, "'").replace(/[–—−]/g, '-')
      .replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 2;
    // edit distance where swapping two neighbouring letters also counts as one edit
    var d = [];
    for (var i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (var j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }
  // 2 = exact (after normalising), 1 = accepted spelling slip, 0 = wrong
  function fillEq(accepted, given) {
    var a = norm(accepted), g = norm(given);
    if (!g) return 0;
    if (a === g) return 2;
    if (a.replace(/[\s\-]/g, '') === g.replace(/[\s\-]/g, '')) return 2;
    if (!/\s/.test(a) && !/\s/.test(g) && a.length >= 6 && /[a-z]/.test(a) && lev(a, g) === 1) return 1;
    return 0;
  }

  /* ---------------- load + validate ---------------- */
  function validate(q) {
    if (!q || typeof q !== 'object') return 'not an object';
    if (!q.id || typeof q.id !== 'string') return 'missing id';
    if (typeof q.ch !== 'number') return 'missing ch (number)';
    if (!TYPES[q.type]) return 'unknown type "' + q.type + '"';
    if (!q.q || typeof q.q !== 'string') return 'missing q (question text)';
    if (!q.concept) return 'missing concept';
    switch (q.type) {
      case 'mc':
        if (!Array.isArray(q.options) || q.options.length < 2) return 'mc needs options';
        if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length) return 'mc answer index out of range';
        break;
      case 'multi':
        if (!Array.isArray(q.options) || q.options.length < 2) return 'multi needs options';
        if (!Array.isArray(q.answer) || !q.answer.length) return 'multi answer must be a non-empty array';
        for (var i = 0; i < q.answer.length; i++) if (typeof q.answer[i] !== 'number' || q.answer[i] < 0 || q.answer[i] >= q.options.length) return 'multi answer index out of range';
        break;
      case 'fill':
        if (!Array.isArray(q.blanks) || !q.blanks.length) return 'fill needs blanks';
        for (var b = 0; b < q.blanks.length; b++) if (!Array.isArray(q.blanks[b]) || !q.blanks[b].length) return 'fill blank ' + b + ' needs an accepted list';
        break;
      case 'match':
        if (!Array.isArray(q.pairs) || q.pairs.length < 2) return 'match needs at least 2 pairs';
        for (var p = 0; p < q.pairs.length; p++) if (!Array.isArray(q.pairs[p]) || q.pairs[p].length !== 2) return 'match pair ' + p + ' malformed';
        break;
      case 'order':
        if (!Array.isArray(q.items) || q.items.length < 2) return 'order needs at least 2 items';
        break;
      case 'tf':
        if (typeof q.answer !== 'boolean') return 'tf answer must be true/false';
        break;
    }
    return null;
  }

  (window.QBANK || []).forEach(function (q, i) {
    var err = validate(q);
    if (err) { WARN.push(((q && q.id) || ('item #' + i)) + ': ' + err + ' (skipped)'); return; }
    if (BYID[q.id]) { WARN.push(q.id + ': duplicate id (second copy skipped)'); return; }
    BYID[q.id] = q; BANK.push(q);
  });
  (window.QMISSING || []).forEach(function (f) { WARN.push('data file not loaded: ' + f); });
  (window.QERRORS || []).forEach(function (m) { WARN.push('data file error: ' + m); });

  /* ---------------- storage ---------------- */
  function fresh() { return { q: {}, history: [], prefs: { len: 20, chapters: [1, 2, 3, 4] } }; }
  function loadState() {
    try {
      localStorage.setItem(KEY + '.test', '1'); localStorage.removeItem(KEY + '.test');
      var raw = localStorage.getItem(KEY);
      var st = raw ? JSON.parse(raw) : fresh();
      if (!st.q) st.q = {};
      if (!st.history) st.history = [];
      if (!st.prefs) st.prefs = fresh().prefs;
      if (!st.star) st.star = {};
      return st;
    } catch (e) {
      storageOK = false;
      return fresh();
    }
  }
  function save() {
    if (!storageOK) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { storageOK = false; banner(); }
  }
  function banner() {
    var b = document.getElementById('banner');
    if (!storageOK) { b.hidden = false; b.textContent = 'This browser blocks local storage here: progress is kept only until you close the page. Use "Export progress" to keep it.'; }
  }
  S = loadState();
  banner();

  function stat(id) { return S.q[id] || null; }
  // questions marked as important (★), independent of right or wrong
  function isStar(id) { return !!(S.star && S.star[id]); }
  function toggleStar(id) {
    if (!S.star) S.star = {};
    if (S.star[id]) delete S.star[id]; else S.star[id] = Date.now();
    save();
  }
  function starBtn(id) {
    return '<button type="button" class="star' + (isStar(id) ? ' on' : '') + '" id="star" title="Mark this question as important, to practise it later in ★ Important (key I)">' +
      (isStar(id) ? '★ Important' : '☆ Mark important') + '</button>';
  }
  function starPool() { return byChapters(BANK).filter(function (q) { return isStar(q.id); }).sort(idOrder); }
  function record(id, ok, hinted) {
    var s = S.q[id] || { seen: 0, correct: 0, wrong: 0, box: 0, last: 0, streak: 0 };
    s.seen++;
    if (hinted) s.hints = (s.hints || 0) + 1;
    // with a hint a right answer counts as correct, but the question does not move up a box
    if (ok) { s.correct++; if (!hinted) s.box = Math.min(5, s.box + 1); s.streak++; }
    else { s.wrong++; s.box = 0; s.streak = 0; }
    s.last = Date.now(); s.lastOk = ok;
    S.q[id] = s; save();
  }

  /* ---------------- stats ---------------- */
  function conceptStats() {
    var m = {};
    BANK.forEach(function (q) {
      var c = m[q.concept] || (m[q.concept] = { concept: q.concept, ch: q.ch, n: 0, correct: 0, wrong: 0, weakQ: 0 });
      c.n++;
      var s = stat(q.id);
      if (s) { c.correct += s.correct; c.wrong += s.wrong; if (s.box <= 1 && s.wrong > 0) c.weakQ++; }
    });
    return Object.keys(m).map(function (k) { return m[k]; });
  }
  function chapterStats() {
    var m = {};
    BANK.forEach(function (q) {
      var c = m[q.ch] || (m[q.ch] = { ch: q.ch, n: 0, master: 0, learn: 0, fresh: 0, correct: 0, wrong: 0, official: 0 });
      c.n++; if (q.source === 'official') c.official++;
      var s = stat(q.id);
      if (!s) c.fresh++;
      else { if (s.box >= MASTER_BOX) c.master++; else c.learn++; c.correct += s.correct; c.wrong += s.wrong; }
    });
    return Object.keys(m).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return m[k]; });
  }

  /* ---------------- queue building ---------------- */
  function smartOrder(pool) {
    var now = Date.now();
    return pool.map(function (q) {
      var s = stat(q.id), p, sub = Math.random();
      if (!s) p = 2;
      else if (s.lastOk === false) p = 0;
      else {
        var iv = INTERVAL[Math.min(s.box, 5)], age = now - s.last;
        if (age >= iv) { p = 1; sub = -(age / Math.max(iv, 1)) + Math.random() * 0.01; }
        else { p = 3; sub = iv - age; }
      }
      return { q: q, p: p, sub: sub };
    }).sort(function (a, b) { return a.p - b.p || a.sub - b.sub; }).map(function (x) { return x.q; });
  }
  function selectedChapters() { return S.prefs.chapters && S.prefs.chapters.length ? S.prefs.chapters : [1, 2, 3, 4]; }
  function sessionLen() { return S.prefs.len === 'all' ? Infinity : (Number(S.prefs.len) || 20); }
  function byChapters(pool) { var cs = selectedChapters(); return pool.filter(function (q) { return cs.indexOf(q.ch) >= 0; }); }
  function idOrder(a, b) { return a.ch - b.ch || (a.qn || 0) - (b.qn || 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); }

  // questions answered wrong at least once and not yet mastered; most often wrong first
  function mistakePool() {
    return byChapters(BANK).filter(function (q) { var s = stat(q.id); return s && s.wrong > 0 && s.box < MASTER_BOX; })
      .sort(function (x, y) { var a = stat(x.id), b = stat(y.id); return (b.wrong - b.correct) - (a.wrong - a.correct) || b.wrong - a.wrong || b.last - a.last; });
  }

  function startMode(mode, arg) {
    var pool, label, opts = {};
    var n = sessionLen();
    switch (mode) {
      case 'smart':
        pool = smartOrder(BANK).slice(0, n); label = 'Smart practice'; break;
      case 'chapter':
        pool = smartOrder(byChapters(BANK)).slice(0, n); label = 'Practice (ch ' + selectedChapters().join(', ') + ')'; break;
      case 'official':
        pool = byChapters(BANK).filter(function (q) { return q.source === 'official'; }).sort(idOrder);
        if (n !== Infinity) pool = shuffle(pool).slice(0, n);
        label = 'Official quiz questions (ch ' + selectedChapters().join(', ') + ')'; break;
      case 'sample':
        pool = BANK.filter(function (q) { return q.source === 'sample'; }).sort(idOrder); label = 'Sample exam'; break;
      case 'weak':
        var weakC = {};
        conceptStats().forEach(function (c) { var t = c.correct + c.wrong; if (t && c.correct / t < 0.7) weakC[c.concept] = 1; });
        pool = byChapters(BANK).filter(function (q) { var s = stat(q.id); return weakC[q.concept] || (s && s.box <= 1 && s.wrong > 0); });
        pool = smartOrder(pool).slice(0, n); label = 'Weak concepts'; break;
      case 'starred':
        pool = starPool(); if (n !== Infinity) pool = pool.slice(0, n);
        label = '★ Important (ch ' + selectedChapters().join(', ') + ')'; break;
      case 'mistakes':
        pool = mistakePool(); if (n !== Infinity) pool = pool.slice(0, n);
        label = 'My mistakes (ch ' + selectedChapters().join(', ') + ')'; break;
      case 'exam':
        pool = shuffle(byChapters(BANK)).slice(0, n === Infinity ? 40 : n); label = 'Exam simulation'; opts.exam = true; break;
      case 'concept':
        pool = smartOrder(BANK.filter(function (q) { return q.concept === arg; })); label = 'Concept: ' + conceptLabel(arg); break;
      case 'ids':
        pool = arg.map(function (id) { return BYID[id]; }).filter(Boolean); label = opts.label || 'Repeat missed'; break;
      case 'autotest':
        pool = BANK.slice(); label = 'Autotest (all questions, bank order)'; break;
    }
    if (!pool || !pool.length) {
      alert(mode === 'mistakes' ? 'No open mistakes in the ticked chapters.' : mode === 'starred' ? 'No questions marked ★ important in the ticked chapters yet. Click “☆ Mark important” on a question to add it.' : mode === 'weak' ? 'No weak concepts yet: answer some questions first (or you are doing great).' : 'No questions match this choice.');
      return;
    }
    SES = { mode: mode, label: label, queue: pool.map(function (q) { return q.id; }), i: 0, reask: {}, results: [], exam: !!opts.exam, save: mode !== 'autotest', sid: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e4) };
    if (CAR_NEXT) { CAR_NEXT = false; SES.car = true; SES.label = '🚗 ' + SES.label; persistSes(false); carBegin(); return; }
    persistSes(false);
    renderQuestion();
  }

  /* ---------------- saved (resumable) session ---------------- */
  function persistSes(answered) {
    if (!SES || !SES.save || SES.cont) return;
    var all = sessions();
    all[SES.sid] = { sid: SES.sid, mode: SES.mode, label: SES.label, queue: SES.queue, i: SES.i, reask: SES.reask, results: SES.results, exam: SES.exam, car: !!SES.car, answered: !!answered, started: (all[SES.sid] && all[SES.sid].started) || Date.now(), saved: Date.now() };
    // keep at most 12 open sessions: drop the one untouched longest
    var ids = Object.keys(all).sort(function (a, b) { return all[b].saved - all[a].saved; });
    ids.slice(12).forEach(function (k) { delete all[k]; });
    save();
  }
  // all open (unfinished) sessions, by id; older single-slot saves are moved in
  function sessions() {
    if (!S.sessions) S.sessions = {};
    if (S.sess) { var o = S.sess; o.sid = o.sid || 'old'; S.sessions[o.sid] = o; delete S.sess; }
    return S.sessions;
  }
  function dropSes(sid) { var all = sessions(); if (all[sid]) { delete all[sid]; save(); } }
  function resumeSes(sid) {
    var z = sessions()[sid];
    if (!z) return;
    z.queue = z.queue.filter(function (id) { return BYID[id]; });
    SES = { mode: z.mode, label: z.label, queue: z.queue, i: z.i, reask: z.reask || {}, results: z.results || [], exam: !!z.exam, car: !!z.car, save: true, sid: sid };
    if (z.answered) SES.i++;
    if (SES.i >= SES.queue.length) renderSummary();
    else if (SES.car && carSupported()) { persistSes(false); carBegin(); }
    else { persistSes(false); renderQuestion(); }
  }

  /* ---------------- continuous study ---------------- */
  function freshRun() { return { cur: null, answered: false, c: 0, n: 0, h: 0, pending: [], recent: [], log: [], started: Date.now() }; }
  function contRun() {
    var C = S.cont;
    if (!C || typeof C !== 'object') C = S.cont = freshRun();
    ['pending', 'recent', 'log'].forEach(function (k) { if (!Array.isArray(C[k])) C[k] = []; });
    ['c', 'n', 'h'].forEach(function (k) { if (typeof C[k] !== 'number') C[k] = 0; });
    return C;
  }
  function hasRun() { return !!(S.cont && (S.cont.n > 0 || S.cont.cur)); }

  function pickSpread(list, lastCh, random) {
    var cand = list.filter(function (q) { return q.ch !== lastCh; });
    if (!cand.length) cand = list;
    return random ? cand[Math.floor(Math.random() * cand.length)].id : cand[0].id;
  }
  function pickNext() {
    var C = contRun();
    var pool = byChapters(BANK); if (!pool.length) pool = BANK;
    var inPool = {}; pool.forEach(function (q) { inPool[q.id] = 1; });
    var recent = C.recent.slice(-8);
    var lastCh = C.cur && BYID[C.cur] ? BYID[C.cur].ch : 0;
    function notRecent(id, k) { return id !== C.cur && recent.slice(-k).indexOf(id) < 0; }
    var pend = {}; C.pending.forEach(function (p) { pend[p.id] = p; });
    // (a) a question answered wrong whose re-ask is due
    var due = C.pending.filter(function (p) { return p.due <= C.n && inPool[p.id] && BYID[p.id] && notRecent(p.id, 2); })
      .sort(function (a, b) { return a.due - b.due; });
    if (due.length) return due[0].id;
    // (b) new questions, (c) reviews of seen questions (every 4th question, or when nothing new is left)
    var unseen = pool.filter(function (q) { return !stat(q.id) && notRecent(q.id, 8); });
    var seen = pool.filter(function (q) { return stat(q.id) && !pend[q.id] && notRecent(q.id, 8); });
    var now = Date.now();
    var dueReview = seen.filter(function (q) { var s = stat(q.id); return s.lastOk === false || now - s.last >= INTERVAL[Math.min(s.box, 5)]; });
    var takeReview = dueReview.length && (C.n % 4 === 3 || !unseen.length);
    if (!takeReview && unseen.length) return pickSpread(unseen, lastCh, true);
    var rev = smartOrder(dueReview.length ? dueReview : seen);
    if (rev.length) return pickSpread(rev.slice(0, 6), lastCh, false);
    var any = pool.filter(function (q) { return q.id !== C.cur; });
    if (!any.length) any = pool;
    return any[Math.floor(Math.random() * any.length)].id;
  }
  function startCont(fresh) {
    if (!BANK.length) { alert('No questions loaded.'); return; }
    if (fresh || !S.cont) S.cont = freshRun();
    var C = contRun();
    SES = { mode: 'cont', label: 'Continuous study', cont: true, queue: [], i: 0, reask: {}, results: [], exam: false };
    if (C.cur && BYID[C.cur] && !C.answered) { SES.queue = [C.cur]; save(); renderQuestion(); }
    else contNext();
  }
  function contNext() {
    var C = contRun();
    if (C.cur) { C.recent.push(C.cur); if (C.recent.length > 12) C.recent = C.recent.slice(-12); }
    var id = pickNext();
    C.cur = id; C.answered = false; save();
    SES.queue = [id]; SES.i = 0;
    renderQuestion();
  }
  function contAfter(q, res, hinted) {
    var C = contRun();
    C.n++; if (res.ok) C.c++; if (hinted) C.h++;
    C.log.push({ id: q.id, ok: res.ok, h: hinted ? 1 : 0 });
    if (C.log.length > 500) C.log = C.log.slice(-500);
    C.pending = C.pending.filter(function (p) { return p.id !== q.id; });
    if (!res.ok) C.pending.push({ id: q.id, due: C.n + REASK_MIN + Math.floor(Math.random() * REASK_SPREAD) });
    C.answered = true; save();
  }
  function renderContPause() {
    VIEW = 'sum'; SES = null; R = null;
    var C = contRun();
    var per = {}, missed = [];
    C.log.forEach(function (r) {
      var q = BYID[r.id]; if (!q) return;
      var p = per[q.ch] || (per[q.ch] = { n: 0, c: 0 }); p.n++; if (r.ok) p.c++;
    });
    for (var i = C.log.length - 1; i >= 0 && missed.length < 10; i--) {
      var r = C.log[i]; if (!r.ok && BYID[r.id] && missed.indexOf(r.id) < 0) missed.push(r.id);
    }
    var html = '<h1>Continuous study – paused</h1><p class="muted">Everything is saved. "Resume" continues exactly here, also after closing the browser.</p>';
    html += '<div class="stats"><div class="stat"><b>' + C.n + '</b><span>answered this run</span></div>' +
      '<div class="stat"><b>' + C.c + ' / ' + C.n + '</b><span>correct (' + pct(C.c, C.n) + '%)</span></div>' +
      '<div class="stat"><b>' + C.h + '</b><span>answered with a hint</span></div>' +
      '<div class="stat"><b>' + C.pending.length + '</b><span>mistakes waiting to come back</span></div></div>';
    html += '<div class="actions"><button class="primary" id="resume">▶ Resume</button><button id="back">Dashboard</button></div>';
    var ks = Object.keys(per).map(Number).sort(function (a, b) { return a - b; });
    if (ks.length) {
      html += '<h2>This run per chapter</h2><div class="card"><table><tr><th>Ch</th><th>Topic</th><th>Answered</th><th>Correct</th></tr>' +
        ks.map(function (k) { var a = pct(per[k].c, per[k].n); return '<tr><td>' + k + '</td><td>' + esc(CH_NAMES[k] || '') + '</td><td>' + per[k].n + '</td><td><span class="' + (a < 70 ? 'pct-bad' : 'pct-ok') + '">' + per[k].c + ' (' + a + '%)</span></td></tr>'; }).join('') +
        '</table></div>';
    }
    if (missed.length) {
      html += '<h2>Recently missed</h2>';
      missed.forEach(function (id) {
        var q = BYID[id];
        html += '<div class="review bad"><div class="badges"><span class="badge">Ch ' + q.ch + '</span>' + sourceBadge(q) + '<span class="badge">' + esc(conceptLabel(q.concept)) + '</span></div>' +
          '<div>' + (q.type === 'fill' ? q.q.replace(/_{3,}/g, '_____') : q.q) + '</div>' +
          '<div class="small" style="margin-top:6px">Correct: ' + correctText(q) + '</div>' +
          (q.page ? '<div class="small"><a href="' + esc(q.page) + '" target="_blank" rel="noopener">Study page ↗</a></div>' : '') + '</div>';
      });
    }
    app.innerHTML = html;
    app.querySelector('#resume').onclick = function () { startCont(false); };
    app.querySelector('#back').onclick = renderDash;
    window.scrollTo(0, 0);
  }

  /* ---------------- dashboard ---------------- */
  function renderDash() {
    VIEW = 'dash'; SES = null; R = null;
    var cst = chapterStats();
    var tot = { c: 0, w: 0, seen: 0, master: 0, hints: 0 };
    BANK.forEach(function (q) { var s = stat(q.id); if (s) { tot.c += s.correct; tot.w += s.wrong; tot.seen++; tot.hints += s.hints || 0; if (s.box >= MASTER_BOX) tot.master++; } });
    var days = Math.round((EXAM_DATE - new Date(new Date().toDateString())) / 864e5);
    var html = '';
    html += '<h1>BIO02 Quiz Trainer</h1>';
    html += '<p class="muted">' + BANK.length + ' questions' + (days >= 0 ? ' · <b>exam in ' + days + ' day' + (days === 1 ? '' : 's') + '</b>' : '') + '</p>';
    // continuous study: the main entry point
    var C = S.cont, run = hasRun();
    var open = sessions(), oids = Object.keys(open).sort(function (x, y) { return open[y].saved - open[x].saved; });
    html += '<div class="home-go">' +
      '<button class="go go-new" id="newquiz"><span class="go-ic">＋</span><b>New quiz</b><span>choose what, which chapters, how many</span></button>' +
      '<button class="go go-cont" id="cont"><span class="go-ic">▶</span><b>' + (run ? 'Resume studying' : 'Keep studying') + '</b><span>' +
      (run ? C.n + ' answered this run' + (C.n ? ', ' + pct(C.c, C.n) + '% right' : '') : 'endless, mistakes come back') + '</span></button></div>';
    html += '<div class="chips-line"><span class="small muted">Keep studying uses chapters</span> ' +
      [1, 2, 3, 4].map(function (c) { return '<button class="chip' + (selectedChapters().indexOf(c) >= 0 ? ' on' : '') + '" data-cch="' + c + '">' + c + '</button>'; }).join('') +
      (run ? '<button class="small linkish" id="contFresh" title="Resets only the run counters; your per-question progress is kept">fresh run</button>' : '') + '</div>';
    if (oids.length) {
      html += '<h2>Open sessions (' + oids.length + ')</h2><div class="card"><p class="small muted" style="margin:0 0 6px">Sessions you started and did not finish. Each one continues exactly where you left it.</p><table class="open-ses">';
      oids.forEach(function (k) {
        var z = open[k], zf = (z.results || []).filter(function (r) { return r.first; }), zc = zf.filter(function (r) { return r.ok; }).length;
        var at = Math.min(z.queue.length, z.i + (z.answered ? 2 : 1));
        html += '<tr><td><b>' + esc(z.label) + '</b><div class="small muted">question ' + at + ' of ' + z.queue.length + (z.exam ? '' : ' · ' + zc + '/' + zf.length + ' right') + ' · ' + new Date(z.saved).toLocaleString() + '</div>' +
          '<div class="progress"><i style="width:' + pct(at - 1, z.queue.length) + '%"></i></div></td>' +
          '<td style="white-space:nowrap;text-align:right"><button class="primary small" data-resume="' + esc(k) + '">▶ Continue</button> <button class="small" data-drop="' + esc(k) + '">Discard</button></td></tr>';
      });
      html += '</table></div>';
    }
    html += '<div class="home-more"><a class="btn" href="words.html">📖 Difficult words</a><a class="btn" href="pictures.html">🖼 All pictures</a></div>';
    html += installBox();
    html += '<h2>Your numbers</h2>';
    html += '<div class="stats">' +
      '<div class="stat"><b>' + BANK.length + '</b><span>questions loaded</span></div>' +
      '<div class="stat"><b>' + tot.seen + '</b><span>answered at least once</span></div>' +
      '<div class="stat"><b>' + tot.master + '</b><span>mastered (3+ right in a row)</span></div>' +
      '<div class="stat"><b>' + ((tot.c + tot.w) ? pct(tot.c, tot.c + tot.w) + '%' : '–') + '</b><span>overall accuracy</span></div>' +
      '<div class="stat"><b>' + tot.hints + '</b><span>answered with a hint</span></div>' +
      '</div>';

    // chapters
    html += '<h2>Progress per chapter</h2><div class="card"><table><tr><th>Ch</th><th>Topic</th><th>Questions</th><th style="width:34%">Progress</th><th>Accuracy</th></tr>';
    cst.forEach(function (c) {
      var t = c.correct + c.wrong, a = pct(c.correct, t);
      html += '<tr><td>' + c.ch + '</td><td>' + esc(CH_NAMES[c.ch] || '') + '</td><td>' + c.n + ' <span class="muted small">(' + c.official + ' official)</span></td>' +
        '<td><div class="bar" title="' + c.master + ' mastered, ' + c.learn + ' learning, ' + c.fresh + ' new"><i class="m" style="width:' + pct(c.master, c.n) + '%"></i><i class="l" style="width:' + pct(c.learn, c.n) + '%"></i></div></td>' +
        '<td>' + (t ? '<span class="' + (a < 70 ? 'pct-bad' : 'pct-ok') + '">' + a + '%</span>' : '<span class="muted">–</span>') + '</td></tr>';
    });
    html += '</table><p class="small muted legend" style="margin:8px 0 0"><i style="background:var(--master)"></i>mastered<i style="background:var(--learn)"></i>learning<i style="background:var(--new)"></i>new</p></div>';

    // concepts
    var cs = conceptStats().filter(function (c) { return c.correct + c.wrong > 0; })
      .sort(function (a, b) { var ra = a.wrong / (a.correct + a.wrong), rb = b.wrong / (b.correct + b.wrong); return rb - ra || (b.wrong - a.wrong); });
    html += '<h2>Concepts, weakest first</h2><div class="card">';
    if (!cs.length) html += '<p class="muted">No answers yet. After a first session, the concepts you find hard appear here.</p>';
    else {
      html += '<table><tr><th>Concept</th><th>Ch</th><th>Attempts</th><th>Correct</th><th></th></tr>';
      cs.slice(0, 25).forEach(function (c) {
        var t = c.correct + c.wrong, a = pct(c.correct, t);
        html += '<tr><td>' + esc(conceptLabel(c.concept)) + '</td><td>' + c.ch + '</td><td>' + t + '</td><td><span class="' + (a < 70 ? 'pct-bad' : 'pct-ok') + '">' + a + '%</span></td>' +
          '<td><button class="small" data-concept="' + esc(c.concept) + '">Practice</button></td></tr>';
      });
      html += '</table>';
      if (cs.length > 25) html += '<p class="small muted">' + (cs.length - 25) + ' more concepts not shown.</p>';
    }
    html += '</div>';

    // history
    if (S.history.length) {
      html += '<h2>Recent sessions</h2><div class="card"><table><tr><th>When</th><th>Mode</th><th>First-try score</th></tr>';
      S.history.slice(-8).reverse().forEach(function (x) {
        html += '<tr><td>' + esc(new Date(x.date).toLocaleString()) + '</td><td>' + esc(x.mode) + '</td><td>' + x.score + ' / ' + x.total + ' (' + pct(x.score, x.total) + '%)</td></tr>';
      });
      html += '</table></div>';
    }

    // data tools
    html += '<h2>Your progress data</h2><div class="card"><p class="small muted" style="margin-top:0">Progress is saved in this browser (localStorage), on this computer only. Export it to keep a copy or move it to another browser.</p>' +
      '<div class="row"><button id="exp">Export progress</button><label class="btn">Import progress<input type="file" id="imp" accept=".json,application/json" hidden></label>' +
      '<span class="spacer"></span><button id="reset">Reset progress</button></div><div id="dl" class="small" style="margin-top:8px"></div></div>';

    if (WARN.length) {
      html += '<details class="warn card"><summary>Data warnings (' + WARN.length + ')</summary><ul>' + WARN.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></details>';
    }
    html += '<p class="small muted">Keyboard: 1–9 choose an option, Enter to check and to go on.</p>';
    app.innerHTML = html;

    // wiring
    app.querySelector('#newquiz').onclick = function () { openWizard(); };
    var ib = app.querySelector('#installBtn');
    if (ib) ib.onclick = function () {
      if (!INSTALL) return;
      INSTALL.prompt();
      INSTALL.userChoice.then(function () { INSTALL = null; renderDash(); }, function () {});
    };
    var ix = app.querySelector('#installHide');
    if (ix) ix.onclick = function () { S.prefs.noInstall = 1; save(); renderDash(); };
    [].forEach.call(app.querySelectorAll('[data-cch]'), function (b) {
      b.onclick = function () {
        var c = Number(b.getAttribute('data-cch')), cs = selectedChapters().slice(), k = cs.indexOf(c);
        if (k >= 0) { if (cs.length === 1) return; cs.splice(k, 1); } else cs.push(c);
        S.prefs.chapters = cs.sort(); save(); b.classList.toggle('on', k < 0);
      };
    });
    function pushQ() { try { history.pushState({ v: 'q' }, ''); } catch (e) { /* ignore */ } }
    app.querySelector('#cont').onclick = function () { pushQ(); startCont(false); };
    [].forEach.call(app.querySelectorAll('[data-resume]'), function (b) { b.onclick = function () { pushQ(); resumeSes(b.getAttribute('data-resume')); }; });
    [].forEach.call(app.querySelectorAll('[data-drop]'), function (b) { b.onclick = function () { if (confirm('Discard this open session? Your per-question progress is kept.')) { dropSes(b.getAttribute('data-drop')); renderDash(); } }; });
    var cf = app.querySelector('#contFresh');
    if (cf) cf.onclick = function () { if (confirm('Start a fresh run? The run counters go back to 0; what you know per question is kept.')) startCont(true); };
    [].forEach.call(app.querySelectorAll('[data-concept]'), function (b) { b.onclick = function () { startMode('concept', b.getAttribute('data-concept')); }; });
    app.querySelector('#reset').onclick = function () {
      if (confirm('Delete all your quiz progress in this browser? This cannot be undone.')) { var p = S.prefs; S = fresh(); S.prefs = p; save(); renderDash(); }
    };
    app.querySelector('#exp').onclick = function () {
      var blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var name = 'bio02quiz-progress-' + new Date().toISOString().slice(0, 10) + '.json';
      var a = document.createElement('a'); a.href = url; a.download = name; a.textContent = 'Download ' + name;
      var dl = app.querySelector('#dl'); dl.innerHTML = ''; dl.appendChild(a);
      try { a.click(); } catch (e) { /* link stays visible */ }
    };
    app.querySelector('#imp').onchange = function () {
      var f = this.files && this.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var st = JSON.parse(rd.result);
          if (!st || typeof st.q !== 'object') throw new Error('no "q" object');
          if (!confirm('Replace your current progress with the imported file?')) return;
          st.history = st.history || []; st.prefs = st.prefs || fresh().prefs; st.star = st.star || {};
          S = st; save(); renderDash();
        } catch (e) { alert('This file is not a valid progress file (' + e.message + ').'); }
      };
      rd.readAsText(f);
    };
  }

  /* ---------------- question view ---------------- */
  function sourceBadge(q) {
    if (q.source === 'official') {
      var n = q.qn || ((/(\d+)\D*$/.exec(q.id) || [])[1] | 0) || '';
      return '<span class="badge src-official">Official quiz Ch' + q.ch + (n ? ' Q' + n : '') + '</span>';
    }
    if (q.source === 'sample') {
      var m = q.qn || ((/(\d+)\D*$/.exec(q.id) || [])[1] | 0) || '';
      return '<span class="badge src-sample">Sample exam' + (m ? ' Q' + m : '') + '</span>';
    }
    return '<span class="badge">Extra</span>';
  }

  function sessionScore() {
    var c = 0; SES.results.forEach(function (r) { if (r.ok) c++; });
    return { c: c, n: SES.results.length };
  }

  function renderQuestion() {
    VIEW = 'q';
    var q = BYID[SES.queue[SES.i]];
    R = { q: q, answered: false, perm: null, sel: [], tf: null, order: null, hints: 0, hintMsgs: [], struck: [], locked: 0, autoLevel: 0 };
    var sc = sessionScore(), html;
    if (SES.cont) {
      var C = contRun(), mastered = 0;
      BANK.forEach(function (x) { var s = stat(x.id); if (s && s.box >= MASTER_BOX) mastered++; });
      var again = C.log.some(function (r) { return r.id === q.id && !r.ok; }) && stat(q.id) && stat(q.id).lastOk === false;
      html = '<div class="row"><b>Continuous study</b><span class="spacer"></span>' +
        '<span class="small">This run: <b id="score">' + C.c + '/' + C.n + '</b> correct' + (C.n ? ' (' + pct(C.c, C.n) + '%)' : '') + '</span>' +
        '<button class="small" id="quit">Pause</button></div>' +
        '<div class="progress" title="' + mastered + ' of ' + BANK.length + ' questions mastered"><i style="width:' + pct(mastered, BANK.length) + '%"></i></div>' +
        '<p class="small muted" style="margin:-6px 0 8px">' + mastered + ' of ' + BANK.length + ' questions mastered</p>';
      html += '<div class="card" id="qcard"><div class="badges"><span class="badge">Ch ' + q.ch + '</span>' + sourceBadge(q) +
        '<span class="badge">' + esc(conceptLabel(q.concept)) + '</span>' + (again ? '<span class="badge">again</span>' : (stat(q.id) ? '<span class="badge">review</span>' : '<span class="badge">new</span>')) + starBtn(q.id) + '</div>';
    } else {
      html = '<div class="row"><b>' + esc(SES.label) + '</b><span class="spacer"></span>' +
        '<span class="muted small">Question ' + (SES.i + 1) + ' of ' + SES.queue.length + '</span>' +
        (SES.exam ? '' : '<span class="small"> · <b id="score">' + sc.c + '/' + sc.n + '</b> correct</span>') +
        (SES.save ? '<button class="small" id="pause" title="Your place is saved after every answer anyway">⏸ Save &amp; stop</button>' : '') +
        '<button class="small" id="quit">End session</button></div>' +
        '<div class="progress"><i style="width:' + pct(SES.i, SES.queue.length) + '%"></i></div>';
      html += '<div class="card" id="qcard"><div class="badges"><span class="badge">Ch ' + q.ch + '</span>' + sourceBadge(q) +
        '<span class="badge">' + esc(conceptLabel(q.concept)) + '</span>' + (SES.reask[q.id] ? '<span class="badge">again</span>' : '') + starBtn(q.id) + '</div>';
    }
    if (q.type !== 'fill') html += '<div class="qtext">' + q.q + '</div>';
    if (q.img) html += '<div class="qimg"><img src="' + esc(q.img) + '" alt="question image"></div>';
    html += '<div id="procbox"></div><div id="inputs"></div><div id="hintbox"></div><div id="fb"></div>' +
      '<div class="actions"><button class="primary" id="submit">' + (SES.exam ? 'Save answer' : 'Check') + '</button>' +
      (SES.exam ? '' : '<button id="hint" type="button">💡 Hint</button>') +
      (!SES.exam && procFor(q) ? '<button id="proc" type="button" title="Where does this happen, and in which order? (M) Opening it before you answer counts like a hint.">🗺 Process map</button>' : '') +
      '<button id="next" hidden class="primary">Next →</button><span class="kbd">Enter' + (SES.exam ? '' : ' · H = hint') + ' · I = important' + (!SES.exam && procFor(q) ? ' · M = map' : '') + '</span></div></div>';
    app.innerHTML = html;
    app.querySelector('#quit').onclick = function () {
      if (SES.cont) renderContPause();
      else if (SES.results.length) renderSummary(); else renderDash();
    };
    var pz = app.querySelector('#pause');
    if (pz) pz.onclick = function () { persistSes(R && R.answered); renderDash(); };
    app.querySelector('#submit').onclick = submit;
    app.querySelector('#next').onclick = next;
    var hb = app.querySelector('#hint'); if (hb) hb.onclick = hint;
    app.querySelector('#star').onclick = function () { flipStar(); };
    var pb = app.querySelector('#proc'); if (pb) pb.onclick = toggleProc;
    buildInputs(q, app.querySelector('#inputs'));
    window.scrollTo(0, 0);
  }

  function buildInputs(q, box) {
    if (q.type === 'mc' || q.type === 'multi' || q.type === 'tf') {
      var opts = q.type === 'tf' ? ['True', 'False'] : q.options;
      R.perm = (q.type === 'tf' || q.shuffle === false) ? range(opts.length) : shuffle(range(opts.length));
      var ul = h('ul', 'opts');
      if (q.type === 'multi') box.appendChild(h('p', 'small muted', 'Select <b>all</b> that apply.'));
      R.perm.forEach(function (orig, d) {
        var li = h('li');
        var b = h('button', 'opt', '<span class="k">' + (d < 9 ? d + 1 : '') + '</span><span>' + opts[orig] + '</span>');
        b.type = 'button'; b.setAttribute('data-d', d);
        b.onclick = function () { pick(d); };
        li.appendChild(b); ul.appendChild(li);
      });
      box.appendChild(ul);
    } else if (q.type === 'fill') {
      var parts = q.q.split(/_{3,}/);
      var div = h('div', 'qtext fill-q');
      var html = '';
      for (var i = 0; i < parts.length; i++) {
        html += parts[i];
        if (i < parts.length - 1 && i < q.blanks.length) html += '<input type="text" class="blank" data-b="' + i + '" autocomplete="off" spellcheck="false">';
      }
      for (var j = parts.length - 1; j < q.blanks.length; j++) html += '<br>Blank ' + (j + 1) + ': <input type="text" class="blank" data-b="' + j + '" autocomplete="off" spellcheck="false">';
      div.innerHTML = html;
      box.appendChild(div);
      var first = div.querySelector('input'); if (first) setTimeout(function () { first.focus(); }, 0);
    } else if (q.type === 'match') {
      var rights = [];
      q.pairs.forEach(function (p) { if (rights.indexOf(p[1]) < 0) rights.push(p[1]); });
      (q.distractors || []).forEach(function (d) { if (rights.indexOf(d) < 0) rights.push(d); });
      rights = shuffle(rights);
      R.rights = rights;
      q.pairs.forEach(function (p, i) {
        var row = h('div', 'match-row');
        row.appendChild(h('div', 'left', p[0]));
        var sel = h('select'); sel.setAttribute('data-i', i);
        sel.innerHTML = '<option value="">— choose —</option>' + rights.map(function (r, k) { return '<option value="' + k + '">' + esc(strip(r)) + '</option>'; }).join('');
        row.appendChild(sel); box.appendChild(row);
      });
    } else if (q.type === 'order') {
      var ord = shuffle(range(q.items.length)), tries = 0;
      while (tries++ < 10 && ord.every(function (v, i) { return v === i; })) ord = shuffle(range(q.items.length));
      R.order = ord;
      box.appendChild(h('p', 'small muted', 'Drag the steps into the right order (first step at the top), or use ▲ ▼.'));
      var list = h('div', 'order-list'); box.appendChild(list);
      dragOrder(list);
      drawOrder();
    }
  }

  function drawOrder() {
    var q = R.q, list = app.querySelector('.order-list'); list.innerHTML = '';
    R.order.forEach(function (orig, pos) {
      var locked = pos < R.locked;
      var row = h('div', 'order-row' + (locked ? ' locked' : '') + (locked || R.answered ? '' : ' drag'));
      row.setAttribute('data-orig', orig);
      row.innerHTML = (locked || R.answered ? '' : '<span class="grip" aria-hidden="true">⠿</span>') + '<span class="num">' + (pos + 1) + '.</span><span class="txt">' + q.items[orig] + (locked && !R.answered ? ' <span class="small muted">(fixed by hint)</span>' : '') + '</span>';
      var up = h('button', 'small', '▲'), dn = h('button', 'small', '▼');
      up.type = dn.type = 'button';
      up.disabled = pos <= R.locked || R.answered; dn.disabled = locked || pos === R.order.length - 1 || R.answered;
      up.onclick = function () { swap(pos, pos - 1); }; dn.onclick = function () { swap(pos, pos + 1); };
      row.appendChild(up); row.appendChild(dn);
      list.appendChild(row);
    });
  }
  // drag and drop (mouse and touch): the list keeps the pointer capture while the dragged row moves in the DOM
  function dragOrder(list) {
    var drag = null;
    list.addEventListener('pointerdown', function (e) {
      if (R.answered || e.button > 0 || (e.target.closest && e.target.closest('button'))) return;
      var row = e.target.closest && e.target.closest('.order-row.drag');
      if (!row) return;
      e.preventDefault();
      drag = { row: row, id: e.pointerId };
      row.classList.add('dragging');
      try { list.setPointerCapture(e.pointerId); } catch (x) {}
    });
    list.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var rows = [].slice.call(list.querySelectorAll('.order-row')), before = null, i;
      for (i = R.locked; i < rows.length; i++) {
        if (rows[i] === drag.row) continue;
        var b = rows[i].getBoundingClientRect();
        if (e.clientY < b.top + b.height / 2) { before = rows[i]; break; }
      }
      if (before !== drag.row.nextSibling || (!before && drag.row !== list.lastChild)) list.insertBefore(drag.row, before);
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      R.order = [].map.call(list.querySelectorAll('.order-row'), function (r) { return Number(r.getAttribute('data-orig')); });
      drawOrder();
    }
    list.addEventListener('pointerup', end);
    list.addEventListener('pointercancel', end);
  }
  function swap(a, b) { var t = R.order[a]; R.order[a] = R.order[b]; R.order[b] = t; drawOrder(); }

  /* ---------------- hints ---------------- */
  function maskAnswer(a, show) {
    var out = [], k = 0;
    for (var i = 0; i < a.length; i++) {
      var ch = a[i];
      if (/\s/.test(ch)) { out.push('&nbsp;&nbsp;'); continue; }
      if (/[A-Za-z0-9]/.test(ch)) { out.push(k < show ? esc(ch) : '_'); k++; }
      else out.push(esc(ch));
    }
    return out.join(' ');
  }
  function autoHint(lvl) {
    // returns { msg, more } and changes the UI where needed
    var q = R.q;
    switch (q.type) {
      case 'mc': {
        var wrong = [];
        R.perm.forEach(function (orig, d) { if (orig !== q.answer && R.struck.indexOf(d) < 0) wrong.push(d); });
        var k = Math.max(1, Math.floor(wrong.length / 2));
        k = Math.min(k, R.perm.length - R.struck.length - 2);
        shuffle(wrong).slice(0, Math.max(0, k)).forEach(function (d) { R.struck.push(d); });
        var btns = app.querySelectorAll('.opt');
        R.struck.forEach(function (d) { var b = btns[d]; if (b) { b.classList.add('struck'); b.classList.remove('sel'); b.disabled = true; } });
        R.sel = R.sel.filter(function (d) { return R.struck.indexOf(d) < 0; });
        return { msg: R.struck.length + ' wrong option' + (R.struck.length === 1 ? ' is' : 's are') + ' crossed out.', more: false };
      }
      case 'multi':
        return { msg: '<b>' + q.answer.length + '</b> of the ' + q.options.length + ' options are correct.', more: false };
      case 'tf':
        return { msg: 'Topic: <b>' + esc(conceptLabel(q.concept)) + '</b>.' + (q.page ? ' Look it up on the <a href="' + esc(q.page) + '" target="_blank" rel="noopener">study page ↗</a>.' : ''), more: false };
      case 'fill': {
        var show = lvl;
        var lines = q.blanks.map(function (b, i) {
          var a = String(b[0]), n = a.replace(/[^A-Za-z0-9]/g, '').length;
          return (q.blanks.length > 1 ? 'Blank ' + (i + 1) + ': ' : '') + '<code class="mask">' + maskAnswer(a, show) + '</code> (' + n + ' letter' + (n === 1 ? '' : 's') + ')';
        });
        return { msg: lines.join('<br>'), more: lvl < 2 };
      }
      case 'match': {
        var rows = app.querySelectorAll('.match-row'), free = [];
        [].forEach.call(rows, function (row, i) {
          var s = row.querySelector('select');
          if (!s.disabled) free.push(i);
        });
        var notRight = free.filter(function (i) { var s = rows[i].querySelector('select'); return s.value === '' || R.rights[Number(s.value)] !== q.pairs[i][1]; });
        var pickI = (notRight.length ? notRight : free)[Math.floor(Math.random() * (notRight.length || free.length))];
        if (pickI == null) return { msg: 'No more hints for this question.', more: false };
        var sel = rows[pickI].querySelector('select');
        sel.value = String(R.rights.indexOf(q.pairs[pickI][1])); sel.disabled = true;
        rows[pickI].classList.add('locked');
        return { msg: 'One pair is filled in for you: <b>' + strip(q.pairs[pickI][0]) + '</b>.', more: free.length - 1 > 1 };
      }
      case 'order': {
        var L = R.locked, p = R.order.indexOf(L);
        R.order.splice(p, 1); R.order.splice(L, 0, L);
        R.locked = L + 1; drawOrder();
        return { msg: 'Step' + (R.locked > 1 ? 's 1–' + R.locked + ' are' : ' 1 is') + ' fixed in place.', more: R.locked < q.items.length - 2 };
      }
    }
    return { msg: '', more: false };
  }
  function hint() {
    if (!R || R.answered || SES.exam) return;
    var q = R.q, btn = app.querySelector('#hint');
    if (btn && btn.disabled) return;
    R.hints++;
    var res;
    if (q.hint && R.hints === 1) res = { msg: q.hint, more: true };
    else { R.autoLevel++; res = autoHint(R.autoLevel); }
    if (res.msg) R.hintMsgs.push(res.msg);
    app.querySelector('#hintbox').innerHTML = '<div class="hint">' + R.hintMsgs.map(function (m) { return '<div>💡 ' + m + '</div>'; }).join('') + '</div>';
    if (btn) { if (res.more) btn.textContent = '💡 Stronger hint'; else { btn.textContent = '💡 No more hints'; btn.disabled = true; } }
  }

  function pick(d) {
    if (R.answered) return;
    var q = R.q, btns = app.querySelectorAll('.opt');
    if (d >= btns.length) return;
    if (R.struck && R.struck.indexOf(d) >= 0) return;
    if (q.type === 'multi') {
      var k = R.sel.indexOf(d); if (k >= 0) R.sel.splice(k, 1); else R.sel.push(d);
    } else { R.sel = [d]; }
    [].forEach.call(btns, function (b, i) { b.classList.toggle('sel', R.sel.indexOf(i) >= 0); });
  }

  /* ---------------- grading ---------------- */
  function grade() {
    var q = R.q, res = { ok: false, given: '' };
    if (q.type === 'mc') {
      var chosen = R.sel.length ? R.perm[R.sel[0]] : -1;
      res.ok = chosen === q.answer; res.chosen = chosen;
      res.given = chosen >= 0 ? strip(q.options[chosen]) : '(no answer)';
    } else if (q.type === 'tf') {
      var c = R.sel.length ? (R.sel[0] === 0) : null;
      res.ok = c === q.answer; res.given = c === null ? '(no answer)' : (c ? 'True' : 'False');
    } else if (q.type === 'multi') {
      var set = R.sel.map(function (d) { return R.perm[d]; }).sort();
      var ans = q.answer.slice().sort();
      res.ok = set.length === ans.length && set.every(function (v, i) { return v === ans[i]; });
      res.set = set;
      res.given = set.length ? set.map(function (i) { return strip(q.options[i]); }).join('; ') : '(no answer)';
    } else if (q.type === 'fill') {
      var ins = app.querySelectorAll('.blank'), okAll = true, given = [];
      res.blankOk = []; res.slips = [];
      [].forEach.call(ins, function (inp) {
        var b = Number(inp.getAttribute('data-b')), v = inp.value, best = 0, bestA = null;
        q.blanks[b].forEach(function (a) { var r = fillEq(a, v); if (r > best) { best = r; bestA = a; } });
        var ok = best > 0;
        if (best === 1) res.slips.push(bestA);
        res.blankOk[b] = ok; if (!ok) okAll = false; given.push(v || '(empty)');
      });
      res.ok = okAll && ins.length >= q.blanks.length; res.given = given.join(' | ');
    } else if (q.type === 'match') {
      var sels = app.querySelectorAll('.match-row select'), all = true, g = [];
      res.rowOk = [];
      [].forEach.call(sels, function (s) {
        var i = Number(s.getAttribute('data-i')), v = s.value === '' ? null : R.rights[Number(s.value)];
        var ok = v === q.pairs[i][1]; res.rowOk[i] = ok; if (!ok) all = false;
        g.push(strip(q.pairs[i][0]) + ' → ' + (v === null ? '?' : strip(v)));
      });
      res.ok = all; res.given = g.join('; ');
    } else if (q.type === 'order') {
      res.ok = R.order.every(function (v, i) { return v === i; });
      res.given = R.order.map(function (o) { return strip(q.items[o]); }).join(' → ');
    }
    return res;
  }

  function correctText(q) {
    switch (q.type) {
      case 'mc': return q.options[q.answer];
      case 'tf': return q.answer ? 'True' : 'False';
      case 'multi': return q.answer.map(function (i) { return q.options[i]; }).join('; ');
      case 'fill': return q.blanks.map(function (b, i) { return (q.blanks.length > 1 ? (i + 1) + ': ' : '') + '<b>' + esc(b[0]) + '</b>'; }).join(' &nbsp; ');
      case 'match': return '<ul style="margin:4px 0">' + q.pairs.map(function (p) { return '<li>' + p[0] + ' → <b>' + p[1] + '</b></li>'; }).join('') + '</ul>';
      case 'order': return '<ol style="margin:4px 0">' + q.items.map(function (it) { return '<li>' + it + '</li>'; }).join('') + '</ol>';
    }
    return '';
  }

  function markUI(res) {
    var q = R.q;
    if (q.type === 'mc' || q.type === 'tf' || q.type === 'multi') {
      var correctSet = q.type === 'mc' ? [q.answer] : q.type === 'tf' ? [q.answer ? 0 : 1] : q.answer;
      [].forEach.call(app.querySelectorAll('.opt'), function (b, d) {
        var orig = R.perm[d], isRight = correctSet.indexOf(orig) >= 0, chosen = R.sel.indexOf(d) >= 0;
        b.disabled = true;
        if (isRight && chosen) b.classList.add('right');
        else if (isRight) b.classList.add(q.type === 'multi' ? 'missed' : 'right');
        else if (chosen) b.classList.add('wrong');
      });
    } else if (q.type === 'fill') {
      [].forEach.call(app.querySelectorAll('.blank'), function (inp) {
        var b = Number(inp.getAttribute('data-b')); inp.disabled = true;
        inp.classList.add(res.blankOk[b] ? 'right' : 'wrong');
      });
    } else if (q.type === 'match') {
      [].forEach.call(app.querySelectorAll('.match-row'), function (row, i) {
        row.querySelector('select').disabled = true;
        row.classList.add(res.rowOk[i] ? 'right' : 'wrong');
        if (!res.rowOk[i]) row.appendChild(h('div', 'fix', '✓ ' + q.pairs[i][1]));
      });
    } else if (q.type === 'order') {
      drawOrder();
      [].forEach.call(app.querySelectorAll('.order-row'), function (row, pos) { row.classList.add(R.order[pos] === pos ? 'right' : 'wrong'); });
    }
  }

  function submit() {
    if (R.answered) return;
    var q = R.q, res = grade(), hinted = R.hints > 0 || !!R.map;
    R.answered = true;
    var first = !SES.results.some(function (r) { return r.id === q.id; });
    SES.results.push({ id: q.id, ok: res.ok, first: first, given: res.given, hint: hinted });
    record(q.id, res.ok, hinted);
    var hbtn = app.querySelector('#hint'); if (hbtn) hbtn.hidden = true;

    if (SES.exam) { persistSes(true); next(); return; }

    if (SES.cont) contAfter(q, res, hinted);
    else if (!res.ok) {
      var n = SES.reask[q.id] || 0;
      if (n < 2) {
        SES.reask[q.id] = n + 1;
        var pos = Math.min(SES.queue.length, SES.i + REASK_MIN + Math.floor(Math.random() * REASK_SPREAD));
        SES.queue.splice(pos, 0, q.id);
      }
    }
    persistSes(true);
    markUI(res);
    var scEl = app.querySelector('#score');
    if (scEl) {
      if (SES.cont) scEl.textContent = S.cont.c + '/' + S.cont.n;
      else { var sc2 = sessionScore(); scEl.textContent = sc2.c + '/' + sc2.n; }
    }
    var fb = app.querySelector('#fb');
    var html = '<div class="feedback ' + (res.ok ? 'ok' : 'bad') + '"><div class="verdict">' + (res.ok ? '✓ Correct' + (hinted ? ' (with hint)' : '') : '✗ Not correct') + '</div>';
    if (res.ok && hinted) html += '<div class="small muted">With a hint the answer counts as correct, but the question does not move up a level.</div>';
    if (res.slips && res.slips.length) html += '<div class="small">Accepted — correct spelling: ' + res.slips.map(function (s) { return '<b>' + esc(s) + '</b>'; }).join(', ') + '</div>';
    if (!res.ok) html += '<div class="ans">Correct answer: ' + correctText(q) + '</div>';
    if (q.explain) html += '<div class="exp">' + q.explain + '</div>';
    if (q.page) html += '<div class="exp"><a href="' + esc(q.page) + '" target="_blank" rel="noopener">Open study page ↗</a></div>';
    html += '<div id="qpic"></div>';
    if (!res.ok && (SES.reask[q.id] || SES.cont)) html += '<div class="small muted" style="margin-top:6px">This question comes back about 10–15 questions later (in a short session: at the end).</div>';
    html += '</div>';
    fb.innerHTML = html;
    renderPics(q, !res.ok, fb.querySelector('#qpic'));
    app.querySelector('#submit').hidden = true;
    var nx = app.querySelector('#next'); nx.hidden = false; nx.focus();
  }

  /* ---------------- pictures after an answer ----------------
     QPICS[key] = {title, svg, cap?, href?, parts?: {part: caption}}; elements inside the svg with data-part="x" can be highlighted.
     QPICMAP[question id] = 'key' | 'key#part' | [up to 2 of these]; QPICMAP['concept:' + concept] is the fallback. */
  function picsFor(q) {
    var M = window.QPICMAP || {}, P = window.QPICS || {};
    var v = M[q.id] || q.pic || M['concept:' + q.concept];
    if (!v) return [];
    return (Array.isArray(v) ? v : [v]).map(function (ref) {
      var k = String(ref).split('#'), p = P[k[0]];
      return p ? { p: p, part: k[1] || '' } : null;
    }).filter(Boolean).slice(0, 2);
  }
  // process map: one static overview picture per process, with the step of this question highlighted
  function procFor(q) {
    var M = window.QPROCMAP || {}, P = window.QPROC || {};
    var v = M[q.id] || M['concept:' + q.concept];
    if (!v) return null;
    var k = String(v).split('#'), p = P[k[0]];
    return p ? { p: p, part: k[1] || '' } : null;
  }
  function toggleProc() {
    if (!R) return;
    var box = app.querySelector('#procbox'), x = procFor(R.q), b = app.querySelector('#proc');
    if (!box || !x) return;
    if (box.innerHTML) { box.innerHTML = ''; if (b) b.classList.remove('on'); return; }
    if (!R.answered) R.map = true;   // looking at the map before answering counts like a hint
    var cap = (x.part && x.p.parts && x.p.parts[x.part]) || x.p.cap || '';
    box.innerHTML = '<figure class="qpic qproc"><figcaption class="qpic-t">🗺 ' + esc(x.p.title) +
      ' <button type="button" class="small" id="procclose">close ✕</button></figcaption>' + x.p.svg +
      (cap ? '<p class="qpic-c">' + (x.part ? '<b>This question:</b> ' : '') + cap + '</p>' : '') + '</figure>';
    if (x.part) [].forEach.call(box.querySelectorAll('[data-part]'), function (e) {
      e.classList.add(e.getAttribute('data-part').split(' ').indexOf(x.part) >= 0 ? 'pic-hl' : 'pic-dim');
    });
    box.querySelector('#procclose').onclick = toggleProc;
    if (b) b.classList.add('on');
  }
  function renderPics(q, open, box) {
    var list = picsFor(q);
    if (!box || !list.length) return;
    function draw() {
      box.innerHTML = list.map(function (x, i) {
        var cap = (x.part && x.p.parts && x.p.parts[x.part]) || x.p.cap || '';
        return '<figure class="qpic" data-i="' + i + '"><figcaption class="qpic-t">🖼 ' + esc(x.p.title) + '</figcaption>' + x.p.svg +
          (cap ? '<p class="qpic-c">' + cap + '</p>' : '') +
          (x.p.href ? '<p class="qpic-l"><a href="' + esc(x.p.href) + '" target="_blank" rel="noopener">Open on the cheatsheet ↗</a></p>' : '') + '</figure>';
      }).join('');
      list.forEach(function (x, i) {
        if (!x.part) return;
        var fig = box.querySelector('.qpic[data-i="' + i + '"]');
        [].forEach.call(fig.querySelectorAll('[data-part]'), function (e) {
          var on = e.getAttribute('data-part').split(' ').indexOf(x.part) >= 0;
          e.classList.add(on ? 'pic-hl' : 'pic-dim');
        });
      });
    }
    if (open) draw();
    else {
      box.innerHTML = '<button type="button" class="small" id="showpic">🖼 Show the picture</button>';
      box.querySelector('#showpic').onclick = draw;
    }
  }

  function next() {
    if (SES.cont) { contNext(); return; }
    SES.i++;
    if (SES.i >= SES.queue.length) renderSummary(); else { persistSes(false); renderQuestion(); }
  }

  /* ---------------- summary ---------------- */
  function renderSummary() {
    VIEW = 'sum';
    if (SES.save) dropSes(SES.sid);
    var firsts = SES.results.filter(function (r) { return r.first; });
    var score = firsts.filter(function (r) { return r.ok; }).length;
    var missed = [];
    SES.results.forEach(function (r) { if (!r.ok && missed.indexOf(r.id) < 0) missed.push(r.id); });
    if (firsts.length) {
      S.history.push({ date: Date.now(), mode: SES.label, score: score, total: firsts.length });
      if (S.history.length > 200) S.history = S.history.slice(-200);
      save();
    }
    var per = {};
    firsts.forEach(function (r) {
      var c = BYID[r.id].concept, p = per[c] || (per[c] = { ok: 0, n: 0 });
      p.n++; if (r.ok) p.ok++;
    });
    var html = '<h1>Session finished</h1><p class="muted">' + esc(SES.label) + '</p>';
    html += '<div class="stats"><div class="stat"><b>' + score + ' / ' + firsts.length + '</b><span>right the first time (' + pct(score, firsts.length) + '%)</span></div>' +
      '<div class="stat"><b>' + missed.length + '</b><span>questions missed at least once</span></div>' +
      '<div class="stat"><b>' + SES.results.length + '</b><span>answers given (incl. repeats)</span></div></div>';
    html += '<div class="actions">' + (missed.length ? '<button class="primary" id="rep">Repeat missed now (' + missed.length + ')</button>' : '') +
      '<button id="back">Back to dashboard</button></div>';

    var pk = Object.keys(per).sort(function (a, b) { return per[a].ok / per[a].n - per[b].ok / per[b].n; });
    if (pk.length) {
      html += '<h2>Per concept</h2><div class="card"><table><tr><th>Concept</th><th>Right first time</th></tr>' +
        pk.map(function (c) { var a = pct(per[c].ok, per[c].n); return '<tr><td>' + esc(conceptLabel(c)) + '</td><td><span class="' + (a < 70 ? 'pct-bad' : 'pct-ok') + '">' + per[c].ok + ' / ' + per[c].n + '</span></td></tr>'; }).join('') +
        '</table></div>';
    }
    var list = SES.exam ? firsts : missed.map(function (id) { return { id: id, ok: false, given: (SES.results.filter(function (r) { return r.id === id && !r.ok; })[0] || {}).given }; });
    if (list.length) {
      html += '<h2>' + (SES.exam ? 'Review of all answers' : 'Questions you missed') + '</h2>';
      list.forEach(function (r) {
        var q = BYID[r.id];
        html += '<div class="review ' + (r.ok ? 'ok' : 'bad') + '"><div class="badges"><span class="badge">Ch ' + q.ch + '</span>' + sourceBadge(q) + '<span class="badge">' + esc(conceptLabel(q.concept)) + '</span></div>' +
          '<div>' + (q.type === 'fill' ? q.q.replace(/_{3,}/g, '_____') : q.q) + '</div>' +
          '<div class="small" style="margin-top:6px">' + (r.ok ? '✓' : '✗') + ' Your answer: ' + esc(r.given || '') + '</div>' +
          (r.ok ? '' : '<div class="small">Correct: ' + correctText(q) + '</div>') +
          (q.explain ? '<div class="small muted" style="margin-top:4px">' + q.explain + '</div>' : '') +
          (q.page ? '<div class="small"><a href="' + esc(q.page) + '" target="_blank" rel="noopener">Study page ↗</a></div>' : '') + '</div>';
      });
    }
    app.innerHTML = html;
    var rep = app.querySelector('#rep');
    if (rep) rep.onclick = function () { startMode('ids', missed); };
    app.querySelector('#back').onclick = renderDash;
    window.scrollTo(0, 0);
  }

  /* ---------------- keyboard ---------------- */
  function flipStar() {
    if (!R) return;
    toggleStar(R.q.id);
    var b = app.querySelector('#star'); if (b) b.outerHTML = starBtn(R.q.id);
    b = app.querySelector('#star'); if (b) b.onclick = function () { flipStar(); };
  }
  document.addEventListener('keydown', function (e) {
    if (VIEW !== 'q' || !R) return;
    var tag = (e.target && e.target.tagName) || '';
    if (e.key === 'Enter') {
      if (tag === 'SELECT') return;
      e.preventDefault();
      if (R.answered) next(); else submit();
      return;
    }
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if ((e.key === 'h' || e.key === 'H') && !R.answered) { hint(); return; }
    if (e.key === 'i' || e.key === 'I') { flipStar(); return; }
    if ((e.key === 'm' || e.key === 'M') && !(SES && SES.exam)) { toggleProc(); return; }
    if (/^[1-9]$/.test(e.key) && !R.answered && (R.q.type === 'mc' || R.q.type === 'multi' || R.q.type === 'tf')) {
      pick(Number(e.key) - 1);
    }
  });

  /* ---------------- install as an app (PWA) ---------------- */
  var INSTALL = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); INSTALL = e; if (VIEW === 'dash') renderDash(); });
  window.addEventListener('appinstalled', function () { INSTALL = null; if (VIEW === 'dash') renderDash(); });
  function isApp() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function installBox() {
    if (isApp() || S.prefs.noInstall || location.protocol === 'file:') return '';
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var body;
    if (INSTALL) body = '<button class="primary" id="installBtn">📲 Install as app</button><span class="small muted">own icon on your home screen, full screen, works offline</span>';
    else if (ios) body = '<span class="small">📲 <b>Use it as an app:</b> in Safari tap <b>Share</b> (□↑) → <b>Add to Home Screen</b>. It then opens full screen and works offline.</span>';
    else if (/Android/.test(navigator.userAgent)) body = '<span class="small">📲 <b>Use it as an app:</b> in Chrome tap the menu <b>⋮</b> → <b>Add to Home screen</b> (or <b>Install app</b>).</span>';
    else return '';
    return '<div class="install-box">' + body + '<button class="small linkish" id="installHide">hide</button></div>';
  }

  /* ---------------- car mode: questions read aloud, answered by voice ----------------
     Uses the browser's speech synthesis (speaking) and speech recognition (listening; in Chrome on Android
     this needs internet). Answers are recorded exactly like answers given on the screen. */
  var CAR_NEXT = false, CAR = null;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function carSupported() { return !!(SR && window.speechSynthesis); }
  function voiceable(q) { return (q.type === 'mc' || q.type === 'tf' || q.type === 'multi' || q.type === 'fill') && !q.img; }
  function carPrefs() {
    var p = S.prefs.car || (S.prefs.car = {});
    if (!p.lang) p.lang = 'en-US';
    if (!p.rate) p.rate = 1;
    if (p.explain == null) p.explain = true;
    return p;
  }
  var LETTERS = 'ABCDEFGH';

  // text that sounds right when read aloud
  function sayable(s) {
    return strip(String(s))
      .replace(/_{3,}/g, ' blank ')
      .replace(/(\d)\s*[−-]\s*(\d)/g, '$1 to $2')
      .replace(/\s[−]\s?|\s?−\s/g, ' minus ').replace(/−/g, ' minus ')
      .replace(/→|⟶|=>/g, ', then ').replace(/←/g, ' from ').replace(/↔/g, ' versus ')
      .replace(/≈/g, ' about ').replace(/≥/g, ' at least ').replace(/≤/g, ' at most ').replace(/±/g, ' plus or minus ')
      .replace(/×/g, ' times ').replace(/%/g, ' percent').replace(/°C/g, ' degrees').replace(/[µμ]/g, 'micro')
      .replace(/(\d)′/g, '$1 prime').replace(/[′’]/g, "'")
      .replace(/\be\.g\./gi, 'for example').replace(/\bi\.e\./gi, 'that is').replace(/\bvs\.?/gi, 'versus')
      .replace(/–/g, ', ').replace(/\//g, ' or ').replace(/\s+/g, ' ').trim();
  }

  /* --- speaking --- */
  function pickVoice(lang) {
    var vs = speechSynthesis.getVoices() || [];
    return vs.filter(function (v) { return v.lang === lang; })[0] ||
      vs.filter(function (v) { return v.lang && v.lang.replace('_', '-').indexOf(lang.slice(0, 2)) === 0; })[0] || null;
  }
  function chunks(text) {
    var parts = String(text).match(/[^.!?;:]+[.!?;:]*\s*/g) || [text], out = [], cur = '';
    parts.forEach(function (p) { if ((cur + p).length > 180 && cur) { out.push(cur); cur = p; } else cur += p; });
    if (cur.trim()) out.push(cur);
    return out;
  }
  function say(text, tok) {
    return new Promise(function (resolve) {
      if (!text || !CAR || CAR.tok !== tok) { resolve(); return; }
      var list = chunks(sayable(text)), i = 0, p = carPrefs();
      (function one() {
        if (!CAR || CAR.tok !== tok || i >= list.length) { resolve(); return; }
        var u = new SpeechSynthesisUtterance(list[i++]);
        u.lang = p.lang; u.rate = p.rate;
        var v = pickVoice(p.lang); if (v) u.voice = v;
        var done = false, guard = setTimeout(fin, 4000 + list[i - 1].length * 120 / p.rate);
        function fin() { if (done) return; done = true; clearTimeout(guard); one(); }
        u.onend = fin; u.onerror = fin;
        speechSynthesis.speak(u);
      })();
    });
  }
  function tone(ok) {
    try {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      var ac = CAR && CAR.ac || (CAR.ac = new A()), t = ac.currentTime;
      (ok ? [660, 880] : [330, 220]).forEach(function (f, k) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, t + k * 0.14); g.gain.exponentialRampToValueAtTime(0.25, t + k * 0.14 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.14 + 0.13);
        o.start(t + k * 0.14); o.stop(t + k * 0.14 + 0.14);
      });
    } catch (e) { /* no sound */ }
  }

  /* --- listening --- */
  function listen(tok) {
    return new Promise(function (resolve) {
      if (!CAR || CAR.tok !== tok) { resolve({ err: 'stopped' }); return; }
      var r, alts = [], err = null;
      try { r = new SR(); } catch (e) { resolve({ err: 'unsupported' }); return; }
      r.lang = carPrefs().lang; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
      r.onresult = function (e) {
        var res = e.results[e.results.length - 1];
        for (var k = 0; k < res.length; k++) alts.push(String(res[k].transcript || '').trim());
      };
      r.onerror = function (e) { err = e.error || 'error'; };
      r.onend = function () { CAR && (CAR.rec = null); resolve(alts.length ? { alts: alts } : { err: err || 'no-speech' }); };
      CAR.rec = r;
      carStatus('listen');
      try { r.start(); } catch (e) { resolve({ err: 'start' }); }
    });
  }

  /* --- understanding what was said --- */
  function clean(t) { return ' ' + String(t).toLowerCase().replace(/[.,!?;:"']/g, ' ').replace(/\s+/g, ' ').trim() + ' '; }
  function command(alts) {
    // only a command when the whole utterance is the command (so "stop codon" stays an answer)
    for (var i = 0; i < alts.length; i++) {
      var t = clean(alts[i]).replace(/ (please|now|the question|that|it) /g, ' ').replace(/\s+/g, ' ');
      if (/^ (repeat|again|say again|say it again|read again|read it again|what|sorry|pardon) $/.test(t)) return 'repeat';
      if (/^ (hint|give me a hint|a hint|help|clue) $/.test(t)) return 'hint';
      if (/^ (skip|pass|next|i don t know|i dont know|don t know|no idea|next question) $/.test(t)) return 'skip';
      if (/^ (stop|pause|quit|end|finish|stop quiz|end quiz|stop the quiz) $/.test(t)) return 'stop';
    }
    return null;
  }
  var LETTER_WORDS = { a: 0, ay: 0, eh: 0, b: 1, be: 1, bee: 1, c: 2, see: 2, sea: 2, cee: 2, si: 2, d: 3, dee: 3, e: 4, ee: 4, f: 5, ef: 5, eff: 5, g: 6, h: 7 };
  var NUM_WORDS = { one: 0, won: 0, first: 0, '1': 0, two: 1, to: 1, too: 1, second: 1, '2': 1, three: 2, tree: 2, third: 2, '3': 2, four: 3, for: 3, fourth: 3, '4': 3, five: 4, fifth: 4, '5': 4, six: 5, sixth: 5, '6': 5 };
  var FILLER = { option: 1, options: 1, answer: 1, letter: 1, number: 1, its: 1, it: 1, is: 1, s: 1, the: 1, i: 1, think: 1, say: 1, my: 1, choose: 1, pick: 1, um: 1, uh: 1, and: 1, also: 1, plus: 1, then: 1, ok: 1, okay: 1 };
  function letters(t, n) {
    var words = clean(t).trim().split(' '), out = [];
    // "a" only counts as a letter when it is not used as an article in a longer sentence
    var content = words.filter(function (w) { return !FILLER[w]; });
    if (content.some(function (w) { return /^(first|second|third|fourth|fifth|sixth)$/.test(w); })) content = content.filter(function (w) { return w !== 'one'; });
    if (content.length > 4) return [];
    content.forEach(function (w) {
      var k = LETTER_WORDS.hasOwnProperty(w) ? LETTER_WORDS[w] : NUM_WORDS.hasOwnProperty(w) ? NUM_WORDS[w] : -1;
      if (w.length === 2 && /^[a-h]\d?$/.test(w)) k = w.charCodeAt(0) - 97;
      if (k >= 0 && k < n && out.indexOf(k) < 0) out.push(k);
    });
    return out;
  }
  function byText(t, opts) {
    var tw = clean(t).trim().split(' ').filter(function (w) { return w.length > 3; });
    if (!tw.length) return -1;
    var sc = opts.map(function (o) {
      var ow = clean(strip(o)); return tw.filter(function (w) { return ow.indexOf(' ' + w + ' ') >= 0; }).length;
    });
    var best = -1, bi = -1, second = -1;
    sc.forEach(function (s, i) { if (s > best) { second = best; best = s; bi = i; } else if (s > second) second = s; });
    return best >= 2 && best >= second + 2 ? bi : -1;
  }
  var SMALL = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  var BIG = { hundred: 100, thousand: 1e3, million: 1e6, billion: 1e9 };
  function wordsToNum(t) {
    // "three hundred" -> 300, "ninety" -> 90; other words are left alone
    return t.replace(/\b((?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|and|\s|-(?=[a-z]))+)\b/g, function (m) {
      var ws = m.trim().split(/[\s-]+/).filter(function (w) { return w && w !== 'and'; });
      if (!ws.length || !ws.some(function (w) { return SMALL.hasOwnProperty(w); })) return m;
      var total = 0, cur = 0;
      ws.forEach(function (w) {
        if (SMALL.hasOwnProperty(w)) cur += SMALL[w];
        else if (w === 'hundred') cur = (cur || 1) * 100;
        else { total += (cur || 1) * BIG[w]; cur = 0; }
      });
      return ' ' + (total + cur) + ' ';
    });
  }
  function spoken(s) {
    var t = ' ' + String(s).toLowerCase() + ' ';
    t = wordsToNum(t.replace(/[−–]/g, ' ~ '));   // number words first, so a minus sign cannot be swallowed
    t = t.replace(/ ~ /g, ' - ').replace(/ minus /g, ' - ').replace(/ plus /g, ' + ').replace(/ times /g, ' x ').replace(/ percent/g, '%');
    return t.replace(/^\s*(the|a|an|it s|it is|its) /, ' ').replace(/[.,!?;:"']/g, ' ').replace(/\s+/g, '').trim();
  }
  function fillMatch(accepted, alts) {
    for (var i = 0; i < alts.length; i++) {
      for (var j = 0; j < accepted.length; j++) {
        var a = spoken(accepted[j]), g = spoken(alts[i]);
        if (!g) continue;
        if (a === g || fillEq(accepted[j], alts[i])) return true;
        if (a.length >= 4 && g.indexOf(a) >= 0 && g.length <= a.length + 12) return true;   // "it is angiogenesis"
        if (a.length >= 8 && /^[a-z]+$/.test(a) && Math.abs(a.length - g.length) <= 1 && lev(a, g) <= 2) return true;
      }
    }
    return false;
  }

  /* --- screen --- */
  function carStatus(st, heard) {
    if (!CAR) return;
    CAR.st = st;
    var el = app.querySelector('#carst');
    if (el) {
      el.className = 'car-st ' + st;
      el.textContent = st === 'listen' ? '🎙 Listening… say your answer' : st === 'speak' ? '🔊 Reading…' : st === 'pause' ? '⏸ Paused' : st === 'ok' ? '✓ Right' : st === 'bad' ? '✗ Not right' : '…';
    }
    if (heard != null) { var h = app.querySelector('#carheard'); if (h) h.textContent = heard ? '“' + heard + '”' : ''; }
    var pb = app.querySelector('#carpause'); if (pb) pb.textContent = st === 'pause' ? '▶ Resume' : '⏸ Pause';
  }
  function carScreen() {
    VIEW = 'car';
    var q = BYID[SES.queue[SES.i]], sc = sessionScore(), p = carPrefs();
    var html = '<div class="row"><b>' + esc(SES.label) + '</b><span class="spacer"></span><span class="muted small">' + (SES.i + 1) + ' / ' + SES.queue.length +
      (SES.exam ? '' : ' · ' + sc.c + '/' + sc.n + ' right') + '</span></div>' +
      '<div class="progress"><i style="width:' + pct(SES.i, SES.queue.length) + '%"></i></div>' +
      '<div id="carst" class="car-st">…</div><div id="carheard" class="car-heard"></div>' +
      '<div class="card car-q"><div class="badges"><span class="badge">Ch ' + q.ch + '</span>' + sourceBadge(q) + '</div>' +
      '<div class="qtext">' + esc(strip(q.q)).replace(/_{3,}/g, '_____') + '</div>';
    if (q.type === 'mc' || q.type === 'multi') {
      html += '<ol class="car-opts">' + CAR.perm.map(function (o, d) { return '<li data-d="' + d + '"><b>' + LETTERS[d] + '</b> ' + esc(strip(q.options[o])) + '</li>'; }).join('') + '</ol>';
    } else if (q.type === 'tf') html += '<p class="muted">True or false?</p>';
    else html += '<p class="muted">Say the missing word' + (q.blanks.length > 1 ? 's, one at a time (' + q.blanks.length + ' blanks)' : '') + '.</p>';
    html += '<div id="carfb"></div></div>' +
      '<div class="car-btns"><button id="carpause" class="big">⏸ Pause</button><button id="carrep">🔁 Repeat</button><button id="carskip">⏭ Skip</button><button id="carstop">⏹ Stop</button></div>' +
      '<details class="card car-set"><summary>Voice settings</summary><div class="row">' +
      '<label>Accent <select id="carlang"><option value="en-US"' + (p.lang === 'en-US' ? ' selected' : '') + '>English (US)</option><option value="en-GB"' + (p.lang === 'en-GB' ? ' selected' : '') + '>English (UK)</option></select></label>' +
      '<label>Speed <select id="carrate">' + [0.85, 1, 1.15, 1.3].map(function (r) { return '<option value="' + r + '"' + (p.rate === r ? ' selected' : '') + '>' + (r === 1 ? 'normal' : r < 1 ? 'slower' : r < 1.2 ? 'faster' : 'fast') + '</option>'; }).join('') + '</select></label>' +
      '<label><input type="checkbox" id="carexp"' + (p.explain ? ' checked' : '') + '> read the explanation after a wrong answer</label></div>' +
      '<p class="small muted">Say a letter (“B”), several letters (“A and C”), “true”/“false”, or the word for a blank. Also: “repeat”, “hint”, “skip”, “stop”. After a wrong fill-in answer you can say “correct” if you did say it right. Listening needs internet.</p></details>';
    app.innerHTML = html;
    app.querySelector('#carpause').onclick = function () { if (CAR.st === 'pause') carRun(); else carPause(); };
    app.querySelector('#carrep').onclick = function () { carRun(); };
    app.querySelector('#carskip').onclick = function () { carAbort(); carAnswer(q, { ok: false, given: '(skipped)' }, true); };
    app.querySelector('#carstop').onclick = carStop;
    app.querySelector('#carlang').onchange = function () { p.lang = this.value; save(); };
    app.querySelector('#carrate').onchange = function () { p.rate = Number(this.value); save(); };
    app.querySelector('#carexp').onchange = function () { p.explain = this.checked; save(); };
    window.scrollTo(0, 0);
  }

  /* --- the loop --- */
  function carAbort() {
    if (!CAR) return;
    CAR.tok++;
    try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    if (CAR.rec) { try { CAR.rec.abort(); } catch (e) { /* ignore */ } CAR.rec = null; }
  }
  function carPause() { carAbort(); carStatus('pause'); }
  function wake(on) {
    try {
      if (on && navigator.wakeLock && !CAR.lock) navigator.wakeLock.request('screen').then(function (l) { if (CAR) CAR.lock = l; else l.release(); }, function () {});
      if (!on && CAR && CAR.lock) { CAR.lock.release(); CAR.lock = null; }
    } catch (e) { /* ignore */ }
  }
  document.addEventListener('visibilitychange', function () { if (CAR && document.visibilityState === 'visible') { CAR.lock = null; wake(true); } });
  function carBegin() {
    CAR = { tok: 0, rec: null, st: '', lock: null, ac: null, perm: null, qid: null, hints: 0, struck: [] };
    wake(true);
    carNewQuestion();
  }
  function carNewQuestion() {
    if (SES.i >= SES.queue.length) { carFinish(); return; }
    var q = BYID[SES.queue[SES.i]];
    CAR.qid = q.id; CAR.hints = 0; CAR.struck = [];
    CAR.perm = (q.type === 'mc' || q.type === 'multi') ? (q.shuffle === false ? range(q.options.length) : shuffle(range(q.options.length))) : null;
    carScreen();
    carRun();
  }
  function questionText(q) {
    var t = 'Question ' + (SES.i + 1) + '. ' + strip(q.q).replace(/_{3,}/g, ' blank ') + ' ';
    if (q.type === 'mc' || q.type === 'multi') {
      if (q.type === 'multi') t += ' Several answers can be right. ';
      CAR.perm.forEach(function (o, d) { t += ' ' + LETTERS[d] + '. ' + strip(q.options[o]) + '. '; });
    } else if (q.type === 'tf') t += ' True or false?';
    return t;
  }
  // read the question, then listen until an answer or a command comes
  function carRun() {
    carAbort();
    var tok = CAR.tok, q = BYID[CAR.qid], misses = 0, given = [];
    carStatus('speak', '');
    say(questionText(q), tok).then(function step() {
      if (!CAR || CAR.tok !== tok) return;
      var b = given.length;
      var ask = q.type === 'fill' && q.blanks.length > 1 ? say('Blank ' + (b + 1) + '?', tok) : Promise.resolve();
      return ask.then(function () { return listen(tok); }).then(function (r) {
        if (!CAR || CAR.tok !== tok) return;
        if (r.err) {
          if (r.err === 'not-allowed' || r.err === 'service-not-allowed') { carPause(); alert('The microphone is blocked. Allow it for this site in the browser settings, then tap Resume.'); return; }
          if (r.err === 'network') { carStatus('speak'); return say('Voice recognition needs internet. Paused.', tok).then(carPause); }
          misses++;
          if (misses >= 4) { carStatus('speak'); return say('Paused. Tap resume when you are ready.', tok).then(carPause); }
          if (misses === 2) { carStatus('speak'); return say('Say your answer, or say repeat.', tok).then(step); }
          return step();
        }
        carStatus('listen', r.alts[0]);
        var cmd = command(r.alts);
        if (cmd === 'stop') { carStop(); return; }
        if (cmd === 'repeat') { carRun(); return; }
        if (cmd === 'skip') { carAnswer(q, { ok: false, given: '(skipped)' }, true); return; }
        if (cmd === 'hint') { carStatus('speak'); return say(carHint(q), tok).then(step); }
        var res = carGrade(q, r.alts, given);
        if (res === 'more') return step();
        if (!res) {
          misses++; carStatus('speak');
          var help = q.type === 'tf' ? 'Say true or false.' : q.type === 'fill' ? 'I did not catch a word. Say it again, or say skip.' : 'Say a letter, ' + LETTERS.slice(0, CAR.perm.length).split('').join(', ') + '.';
          return say('Sorry, I heard ' + r.alts[0] + '. ' + help, tok).then(step);
        }
        carAnswer(q, res, false);
      });
    });
  }
  function carGrade(q, alts, given) {
    var i, k;
    if (q.type === 'tf') {
      for (i = 0; i < alts.length; i++) {
        var t = clean(alts[i]);
        if (/ (false|not true|wrong|incorrect|no|nope) /.test(t)) return { ok: q.answer === false, given: 'False' };
        if (/ (true|yes|right|correct) /.test(t)) return { ok: q.answer === true, given: 'True' };
      }
      return null;
    }
    if (q.type === 'mc' || q.type === 'multi') {
      var opts = CAR.perm.map(function (o) { return q.options[o]; }), sel = null;
      for (i = 0; i < alts.length && !sel; i++) { var l = letters(alts[i], opts.length); if (l.length) sel = l; }
      if (!sel && q.type === 'mc') for (i = 0; i < alts.length && !sel; i++) { k = byText(alts[i], opts); if (k >= 0) sel = [k]; }
      if (!sel) return null;
      if (q.type === 'mc') {
        var ch = CAR.perm[sel[0]];
        return { ok: ch === q.answer, given: LETTERS[sel[0]] + ': ' + strip(q.options[ch]), pick: [sel[0]] };
      }
      var set = sel.map(function (d) { return CAR.perm[d]; }).sort(), ans = q.answer.slice().sort();
      return { ok: set.length === ans.length && set.every(function (v, j) { return v === ans[j]; }), given: sel.map(function (d) { return LETTERS[d]; }).join(' + '), pick: sel };
    }
    // fill: one blank per answer
    given.push({ alts: alts, ok: fillMatch(q.blanks[given.length], alts) });
    if (given.length < q.blanks.length) return 'more';
    return { ok: given.every(function (g) { return g.ok; }), given: given.map(function (g) { return g.alts[0]; }).join(' | '), fill: true };
  }
  function carHint(q) {
    CAR.hints++;
    if (q.hint && CAR.hints === 1) return 'Hint. ' + q.hint;
    if (q.type === 'mc' || q.type === 'multi') {
      var right = q.type === 'mc' ? [q.answer] : q.answer;
      var wrong = CAR.perm.map(function (o, d) { return right.indexOf(o) < 0 && CAR.struck.indexOf(d) < 0 ? d : -1; }).filter(function (d) { return d >= 0; });
      if (wrong.length > (q.type === 'mc' ? 1 : 0)) { var d = shuffle(wrong)[0]; CAR.struck.push(d); return 'It is not ' + LETTERS[d] + '.'; }
      return 'No more hints.';
    }
    if (q.type === 'fill') { var a = String(q.blanks[0][0]); return 'It starts with ' + a.charAt(0).toUpperCase() + ', and has ' + a.replace(/\s/g, '').length + ' characters.'; }
    return 'No hint for this one.';
  }
  function correctSpoken(q) {
    if (q.type === 'mc') return LETTERS[CAR.perm.indexOf(q.answer)] + '. ' + strip(q.options[q.answer]);
    if (q.type === 'multi') return q.answer.map(function (o) { return LETTERS[CAR.perm.indexOf(o)]; }).join(' and ') + '.';
    if (q.type === 'tf') return q.answer ? 'true' : 'false';
    return q.blanks.map(function (b) { return b[0]; }).join(', and ');
  }
  function carMark(q, res) {
    var fb = app.querySelector('#carfb'); if (!fb) return;
    [].forEach.call(app.querySelectorAll('.car-opts li'), function (li) {
      var d = Number(li.getAttribute('data-d')), o = CAR.perm[d];
      var right = q.type === 'mc' ? o === q.answer : q.answer.indexOf(o) >= 0;
      if (right) li.classList.add('right'); else if (res.pick && res.pick.indexOf(d) >= 0) li.classList.add('wrong');
    });
    fb.innerHTML = '<div class="feedback ' + (res.ok ? 'ok' : 'bad') + '"><div class="verdict">' + (res.ok ? '✓ Right' : '✗ Not right') + '</div>' +
      '<div class="small">You said: ' + esc(res.given) + '</div>' + (res.ok ? '' : '<div class="ans">Correct answer: ' + correctText(q) + '</div>') +
      (q.explain ? '<div class="exp">' + q.explain + '</div>' : '') + '</div>';
  }
  function carAnswer(q, res, skipped) {
    carAbort();
    var tok = CAR.tok, hinted = CAR.hints > 0, p = carPrefs(), ok = res.ok, given = res.given, stored = false;
    function store() {
      if (stored) return; stored = true; CAR.pending = null;
      var first = !SES.results.some(function (r) { return r.id === q.id; });
      SES.results.push({ id: q.id, ok: ok, first: first, given: given, hint: hinted });
      record(q.id, ok, hinted);
      if (!ok && !SES.exam) {
        var n = SES.reask[q.id] || 0;
        if (n < 2) { SES.reask[q.id] = n + 1; SES.queue.splice(Math.min(SES.queue.length, SES.i + REASK_MIN + Math.floor(Math.random() * REASK_SPREAD)), 0, q.id); }
      }
      SES.i++; persistSes(false);
    }
    function go() { if (CAR && CAR.tok === tok) carNewQuestion(); }
    if (SES.exam) { store(); setTimeout(go, 400); return; }
    var mayOverrule = !ok && !skipped && q.type === 'fill';
    if (mayOverrule) CAR.pending = store; else store();
    carMark(q, res); carStatus(ok ? 'ok' : 'bad'); tone(ok);
    var talk = ok ? (hinted ? 'Right, with a hint.' : 'Right!') : (skipped ? 'The answer is ' : 'Not right. The answer is ') + correctSpoken(q) + '.';
    var after = say(talk, tok);
    if (mayOverrule) {
      // speech recognition can mishear a term: the user may overrule
      after = after.then(function () { return say('If you did say that, say correct. Otherwise say next.', tok); })
        .then(function () { return listen(tok); })
        .then(function (r) {
          if (r.alts && r.alts.some(function (a) { return / (correct|i knew it|that s what i said|i said that|yes|right) /.test(clean(a)); })) {
            ok = true; given += ' (accepted by you)'; carMark(q, { ok: true, given: given }); carStatus('ok'); tone(true);
            store();
            return say('Okay, counted as right.', tok);
          }
          store();
        });
    }
    after.then(function () {
      if (!CAR || CAR.tok !== tok) return;
      return !ok && p.explain && q.explain ? say(q.explain, tok) : null;
    }).then(function () { if (CAR && CAR.tok === tok) setTimeout(go, 600); });
  }
  function carFinish() {
    var firsts = SES.results.filter(function (r) { return r.first; }), c = firsts.filter(function (r) { return r.ok; }).length;
    var tok = CAR.tok;
    renderSummary();
    say('Finished. You got ' + c + ' out of ' + firsts.length + ' right the first time.', tok).then(carEnd);
  }
  function carEnd() {
    if (!CAR) return;
    if (CAR.pending) CAR.pending();
    carAbort(); wake(false); CAR = null;
  }
  function carStop() {
    if (CAR && CAR.pending) CAR.pending();
    carEnd();
    if (SES) persistSes(false);
    if (SES && SES.results.length) renderSummary(); else renderDash();
  }

  window.__carTest = { letters: letters, byText: byText, fillMatch: fillMatch, spoken: spoken, command: command, sayable: sayable, carGrade: function (q, alts) { return carGrade(q, alts, []); }, start: function (ids) { CAR_NEXT = true; startMode('ids', ids); } };

  /* ---------------- new-quiz wizard ---------------- */
  var W = null;
  var WMODES = [
    { m: 'chapter', ic: '🎯', t: 'Practice', d: 'Smart order: mistakes first, then due, then new.' },
    { m: 'official', ic: '📋', t: 'Official quiz', d: 'The lecturer\'s practice questions.' },
    { m: 'mistakes', ic: '❌', t: 'My mistakes', d: 'Only what you got wrong and do not master yet.' },
    { m: 'starred', ic: '★', t: 'Important', d: 'Questions you marked with ★.' },
    { m: 'weak', ic: '📉', t: 'Weak concepts', d: 'Concepts under 70 % right.' },
    { m: 'exam', ic: '⏱', t: 'Exam simulation', d: 'Random mix, no feedback until the end.' },
    { m: 'sample', ic: '📝', t: 'Example exam', d: 'The 15 questions of the example exam.' }
  ];
  function wmode(m) { return WMODES.filter(function (x) { return x.m === m; })[0]; }
  function wNeedsCh(m) { return m !== 'sample'; }
  function wNeedsLen(m) { return m !== 'sample'; }
  // how many questions this mode has in these chapters (before the length cut)
  function wCount(m, chs) {
    var keep = S.prefs.chapters, keepB = BANK, n = 0;
    S.prefs.chapters = chs;
    if (W && W.car) BANK = BANK.filter(voiceable);
    try {
      if (m === 'chapter' || m === 'exam') n = byChapters(BANK).length;
      else if (m === 'official') n = byChapters(BANK).filter(function (q) { return q.source === 'official'; }).length;
      else if (m === 'mistakes') n = mistakePool().length;
      else if (m === 'starred') n = starPool().length;
      else if (m === 'sample') n = BANK.filter(function (q) { return q.source === 'sample'; }).length;
      else if (m === 'weak') {
        var weakC = {};
        conceptStats().forEach(function (c) { var t = c.correct + c.wrong; if (t && c.correct / t < 0.7) weakC[c.concept] = 1; });
        n = byChapters(BANK).filter(function (q) { var s = stat(q.id); return weakC[q.concept] || (s && s.box <= 1 && s.wrong > 0); }).length;
      }
    } finally { S.prefs.chapters = keep; BANK = keepB; }
    return n;
  }
  function wSteps() { var st = [1]; if (!W.mode || wNeedsCh(W.mode)) st.push(2); st.push(3); return st; }
  function openWizard() {
    W = { step: 1, mode: null, car: !!S.prefs.wizCar && carSupported(), chs: (S.prefs.wizChs && S.prefs.wizChs.length ? S.prefs.wizChs : [1, 2, 3, 4]).slice(), len: S.prefs.len || 20 };
    try { history.pushState({ v: 'wiz' }, ''); } catch (e) { /* ignore */ }
    renderWizard();
  }
  function wGo(step) { W.step = step; renderWizard(); }
  function wNext() { var st = wSteps(), k = st.indexOf(W.step); if (k < st.length - 1) wGo(st[k + 1]); }
  function wStart() {
    // the wizard keeps its own chapter choice; "Keep studying" keeps its own
    var keep = S.prefs.chapters, keepB = BANK, m = W.mode, car = W.car;
    S.prefs.wizChs = W.chs.slice().sort(); S.prefs.len = W.len; S.prefs.chapters = S.prefs.wizChs; S.prefs.wizCar = car;
    W = null;
    if (car) { BANK = BANK.filter(voiceable); CAR_NEXT = true; }
    try { startMode(m); } finally { S.prefs.chapters = keep; BANK = keepB; CAR_NEXT = false; save(); }
  }
  function renderWizard() {
    VIEW = 'wiz'; SES = null; R = null;
    var st = wSteps(), pos = st.indexOf(W.step) + 1, html = '', canNext = true;
    html += '<div class="wiz-top"><button class="small" id="wback">← ' + (pos === 1 ? 'Home' : 'Back') + '</button>' +
      '<span class="wiz-dots">' + st.map(function (x, i) { return '<i class="' + (i + 1 < pos ? 'done' : i + 1 === pos ? 'cur' : '') + '"></i>'; }).join('') + '</span>' +
      '<span class="small muted">step ' + pos + ' of ' + st.length + '</span></div>';
    if (W.step === 1) {
      html += '<h1 class="wiz-h">What do you want to practise?</h1><div class="wiz-tiles">';
      WMODES.forEach(function (x) {
        var n = wCount(x.m, [1, 2, 3, 4]);
        html += '<button class="tile' + (W.mode === x.m ? ' on' : '') + (n ? '' : ' empty') + '" data-wm="' + x.m + '"' + (n ? '' : ' disabled') + '>' +
          '<span class="tile-ic">' + x.ic + '</span><span class="tile-txt"><b>' + esc(x.t) + '</b><span class="tile-d">' + esc(x.d) + '</span></span>' +
          '<span class="tile-n">' + n + '</span></button>';
      });
      html += '</div>';
      canNext = !!W.mode;
    } else if (W.step === 2) {
      html += '<h1 class="wiz-h">Which chapters?</h1><p class="muted wiz-sub">' + wmode(W.mode).ic + ' ' + esc(wmode(W.mode).t) + ' · tap to switch on or off</p><div class="wiz-ch">';
      [1, 2, 3, 4].forEach(function (c) {
        var n = wCount(W.mode, [c]);
        html += '<button class="chtile' + (W.chs.indexOf(c) >= 0 ? ' on' : '') + '" data-wc="' + c + '"><span class="chnum">' + c + '</span>' +
          '<span class="chname">' + esc(CH_NAMES[c]) + '</span><span class="tile-n">' + n + '</span><span class="tick">✓</span></button>';
      });
      html += '</div><div class="row"><button class="small" id="wall">All chapters</button></div>';
      var tot = wCount(W.mode, W.chs);
      html += '<p class="wiz-sum">' + (W.chs.length ? '<b>' + tot + '</b> question' + (tot === 1 ? '' : 's') + ' in chapter' + (W.chs.length > 1 ? 's ' : ' ') + W.chs.slice().sort().join(', ') : 'Pick at least one chapter') + '</p>';
      canNext = W.chs.length > 0 && tot > 0;
    } else {
      var chs = wNeedsCh(W.mode) ? W.chs : [1, 2, 3, 4], avail = wCount(W.mode, chs);
      html += '<h1 class="wiz-h">' + (wNeedsLen(W.mode) ? 'How many questions?' : 'Ready?') + '</h1>';
      if (carSupported()) html += '<button class="cartoggle' + (W.car ? ' on' : '') + '" id="wcar"><span class="go-ic">🚗</span><span><b>Car mode ' + (W.car ? 'ON' : 'off') + '</b>' +
        '<span class="small">questions read aloud, you answer by voice' + (W.car ? ' · matching and ordering questions are left out' : '') + '</span></span><span class="sw"><i></i></span></button>';
      if (wNeedsLen(W.mode)) {
        html += '<div class="wiz-len">' + ['10', '20', '40', 'all'].map(function (v) {
          var dis = v !== 'all' && W.mode !== 'exam' && Number(v) > avail;
          var lbl = v === 'all' ? 'All<small>' + (W.mode === 'exam' ? 'max 40' : avail) + '</small>' : v;
          return '<button class="lentile' + (String(W.len) === v ? ' on' : '') + '" data-wl="' + v + '"' + (dis ? ' disabled' : '') + '>' + lbl + '</button>';
        }).join('') + '</div>';
        if (W.mode === 'official') html += '<p class="small muted">10, 20 or 40 = a random pick. All = the whole set in the lecturer\'s order.</p>';
      }
      var n = avail;
      if (wNeedsLen(W.mode)) n = W.len === 'all' ? (W.mode === 'exam' ? Math.min(40, avail) : avail) : Math.min(Number(W.len), avail);
      html += '<div class="wiz-recap"><div><span class="muted">What</span><b>' + wmode(W.mode).ic + ' ' + esc(wmode(W.mode).t) + '</b></div>' +
        (wNeedsCh(W.mode) ? '<div><span class="muted">Chapters</span><b>' + W.chs.slice().sort().join(', ') + '</b></div>' : '') +
        '<div><span class="muted">Questions</span><b>' + n + '</b></div>' + (W.car ? '<div><span class="muted">Answer</span><b>🚗 by voice</b></div>' : '') + '</div>';
      canNext = n > 0;
    }
    html += '<div class="wiz-bar">' + (W.step === 3
      ? '<button class="primary big" id="wstart"' + (canNext ? '' : ' disabled') + '>▶ Start quiz</button>'
      : '<button class="primary big" id="wnext"' + (canNext ? '' : ' disabled') + '>Next →</button>') + '</div>';
    app.innerHTML = html;
    app.querySelector('#wback').onclick = function () { history.back(); };
    [].forEach.call(app.querySelectorAll('[data-wm]'), function (b) {
      b.onclick = function () { W.mode = b.getAttribute('data-wm'); wNext(); };
    });
    [].forEach.call(app.querySelectorAll('[data-wc]'), function (b) {
      b.onclick = function () { var c = Number(b.getAttribute('data-wc')), k = W.chs.indexOf(c); if (k >= 0) W.chs.splice(k, 1); else W.chs.push(c); renderWizard(); };
    });
    var wa = app.querySelector('#wall'); if (wa) wa.onclick = function () { W.chs = [1, 2, 3, 4]; renderWizard(); };
    [].forEach.call(app.querySelectorAll('[data-wl]'), function (b) {
      b.onclick = function () { var v = b.getAttribute('data-wl'); W.len = v === 'all' ? 'all' : Number(v); renderWizard(); };
    });
    var wc = app.querySelector('#wcar'); if (wc) wc.onclick = function () { W.car = !W.car; renderWizard(); };
    var wn = app.querySelector('#wnext'); if (wn) wn.onclick = wNext;
    var ws = app.querySelector('#wstart'); if (ws) ws.onclick = wStart;
    window.scrollTo(0, 0);
  }
  // phone/browser back button: in the wizard one step back; in a quiz back home (the place is saved)
  window.addEventListener('popstate', function () {
    if (VIEW === 'wiz' && W) {
      var st = wSteps(), k = st.indexOf(W.step);
      if (k > 0) { try { history.pushState({ v: 'wiz' }, ''); } catch (e) { /* ignore */ } wGo(st[k - 1]); }
      else { W = null; renderDash(); }
    } else if (VIEW === 'car' && CAR) {
      carStop();
    } else if (VIEW === 'q' && SES) {
      if (SES.cont) renderContPause(); else { persistSes(R && R.answered); renderDash(); }
    } else if (VIEW !== 'dash') { if (CAR) carEnd(); renderDash(); }
  });

  /* ---------------- start ---------------- */
  function fromHash() {
    var hsh = decodeURIComponent(location.hash.slice(1));
    if (!hsh) return false;
    var parts = hsh.split('&'), f = {};
    parts.slice(1).forEach(function (x) { var kv = x.split('='); f[kv[0]] = kv.length > 1 ? kv[1] : true; });
    if (hsh === 'autotest') { startMode('autotest'); return true; }
    if (parts[0] === 'cont') {
      // #cont – start/resume; #cont&auto=N – answer N questions automatically (test); #cont&dump – show run state
      startCont(!!f.fresh);
      var n = Number(f.auto) || 0;
      for (var a = 0; a < n; a++) {
        var q = R.q;
        if (a % 2 === 0 && q.type === 'mc') pick(R.perm.indexOf(q.answer));
        if (f.hint && a % 3 === 0) hint();
        submit(); next();
      }
      if (f.pause) renderContPause();
      if (f.dump) {
        var pre = document.createElement('pre'); pre.id = 'dump';
        pre.textContent = JSON.stringify({ shown: R && R.q.id, cur: S.cont.cur, answered: S.cont.answered, n: S.cont.n, c: S.cont.c, h: S.cont.h, pending: S.cont.pending, recent: S.cont.recent, chapters: S.cont.log.map(function (r) { return BYID[r.id] && BYID[r.id].ch; }) });
        document.body.appendChild(pre);
      }
      return true;
    }
    var m = /^show=([^&]+)/.exec(hsh);
    if (m && BYID[m[1]]) {
      SES = { mode: 'ids', label: 'Preview', queue: [m[1]], i: 0, reask: {}, results: [], exam: false };
      renderQuestion();
      for (var k = 0; k < (Number(f.hint) || (f.hint ? 1 : 0)); k++) hint();
      if (f.sel != null) pick(Number(f.sel));
      if (f.type != null) [].forEach.call(app.querySelectorAll('.blank'), function (inp) { inp.value = decodeURIComponent(f.type); });
      if (f.reveal) submit();
      return true;
    }
    if (hsh === 'summarytest' && BANK.length) {
      SES = { mode: 'ids', label: 'Summary test', queue: BANK.map(function (q) { return q.id; }), i: BANK.length, reask: {}, results: BANK.map(function (q, i) { return { id: q.id, ok: i % 2 === 0, first: true, given: 'x' }; }), exam: false };
      renderSummary(); return true;
    }
    return false;
  }
  if (!fromHash()) renderDash();
})();
