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
        pool = smartOrder(byChapters(BANK)).slice(0, n); label = 'By chapter (' + selectedChapters().join(', ') + ')'; break;
      case 'official':
        pool = byChapters(BANK).filter(function (q) { return q.source === 'official'; }).sort(idOrder);
        label = 'Official quiz questions (ch ' + selectedChapters().join(', ') + ')'; break;
      case 'sample':
        pool = BANK.filter(function (q) { return q.source === 'sample'; }).sort(idOrder); label = 'Sample exam'; break;
      case 'weak':
        var weakC = {};
        conceptStats().forEach(function (c) { var t = c.correct + c.wrong; if (t && c.correct / t < 0.7) weakC[c.concept] = 1; });
        pool = BANK.filter(function (q) { var s = stat(q.id); return weakC[q.concept] || (s && s.box <= 1 && s.wrong > 0); });
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
    persistSes(false);
    renderQuestion();
  }

  /* ---------------- saved (resumable) session ---------------- */
  function persistSes(answered) {
    if (!SES || !SES.save || SES.cont) return;
    var all = sessions();
    all[SES.sid] = { sid: SES.sid, mode: SES.mode, label: SES.label, queue: SES.queue, i: SES.i, reask: SES.reask, results: SES.results, exam: SES.exam, answered: !!answered, started: (all[SES.sid] && all[SES.sid].started) || Date.now(), saved: Date.now() };
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
    SES = { mode: z.mode, label: z.label, queue: z.queue, i: z.i, reask: z.reask || {}, results: z.results || [], exam: !!z.exam, save: true, sid: sid };
    if (z.answered) SES.i++;
    if (SES.i >= SES.queue.length) renderSummary(); else { persistSes(false); renderQuestion(); }
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
    html += '<p class="muted">The example exam plus practice questions per chapter written by Claude (the official chapter quizzes will be added as soon as they are released). ' +
      'Wrong answers come back later in the same session and in the next sessions until you know them.' +
      (days >= 0 ? ' <b>Exam in ' + days + ' day' + (days === 1 ? '' : 's') + '.</b>' : '') + '</p>';
    html += '<div class="stats">' +
      '<div class="stat"><b>' + BANK.length + '</b><span>questions loaded</span></div>' +
      '<div class="stat"><b>' + tot.seen + '</b><span>answered at least once</span></div>' +
      '<div class="stat"><b>' + tot.master + '</b><span>mastered (3+ right in a row)</span></div>' +
      '<div class="stat"><b>' + ((tot.c + tot.w) ? pct(tot.c, tot.c + tot.w) + '%' : '–') + '</b><span>overall accuracy</span></div>' +
      '<div class="stat"><b>' + tot.hints + '</b><span>answered with a hint</span></div>' +
      '</div>';

    // continuous study: the main entry point
    var C = S.cont, run = hasRun();
    var open = sessions(), oids = Object.keys(open).sort(function (x, y) { return open[y].saved - open[x].saved; });
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
    html += '<div class="cont-box"><button class="mode primary cont" id="cont"><b>' + (run ? '▶ Resume continuous study' : '▶ Continuous study') + '</b><span>' +
      (run ? C.n + ' answered this run, ' + (C.n ? pct(C.c, C.n) + '% correct' : 'none yet') + ' — picks up exactly where you stopped.'
        : 'No limit, all chapters, resumes where you stopped. Mistakes come back about 10–15 questions later; questions you got right return now and then.') +
      '</span></button>' + (run ? '<button class="small" id="contFresh" title="Resets only the run counters; your per-question progress is kept">Start a fresh run</button>' : '') + '</div>';
    html += '<div class="cont-box"><a class="btn mode cont" href="words.html"><b>📖 Difficult words</b><span>Flashcards of the course glossary, by concept: say what the word means, reveal the definition, where it sits (DNA? mRNA? protein?) and a picture with the spot highlighted.</span></a><a class="btn mode" href="pictures.html"><b>🖼 All pictures</b><span>Every drawing of the quiz, by chapter.</span></a></div>';

    // settings
    html += '<div class="card"><div class="row"><b>Session length</b> <select id="len">' +
      ['10', '20', '40', 'all'].map(function (v) { return '<option value="' + v + '"' + (String(S.prefs.len) === v ? ' selected' : '') + '>' + (v === 'all' ? 'all' : v + ' questions') + '</option>'; }).join('') +
      '</select></div><div class="row chapters" style="margin-top:8px"><b>Chapters</b> ' +
      [1, 2, 3, 4].map(function (c) { return '<label><input type="checkbox" class="chk" value="' + c + '"' + (selectedChapters().indexOf(c) >= 0 ? ' checked' : '') + '> ' + c + '</label>'; }).join('') +
      '<button class="small" id="chAll">all</button><button class="small" id="chNone">none</button></div>' +
      '<p class="small muted" style="margin:6px 0 0">Session length applies to the session modes below. The chapter choice applies to "Continuous study", "By chapter", "My mistakes", "★ Important", "Official questions" and "Exam simulation".</p></div>';

    // modes
    html += '<h2>Sessions with a fixed length</h2><div class="modes">' +
      '<button class="mode" data-mode="smart"><b>Smart practice</b><span>Mistakes first, then questions that are due, then new ones.</span></button>' +
      '<button class="mode" data-mode="chapter"><b>By chapter</b><span>Smart order, only the chapters ticked above.</span></button>' +
      '<button class="mode" data-mode="official"><b>Official quiz questions</b><span>The course quizzes, in their original order (not released yet).</span></button>' +
      '<button class="mode" data-mode="sample"><b>Example exam</b><span>The 15 questions of the example exam.</span></button>' +
      '<button class="mode" data-mode="mistakes"><b>My mistakes (' + mistakePool().length + ')</b><span>Only questions you answered wrong and do not master yet, most often wrong first. A question leaves this list after ' + MASTER_BOX + ' right answers in a row without a hint.</span></button>' +
      '<button class="mode" data-mode="starred"><b>★ Important (' + starPool().length + ')</b><span>Only the questions you marked as important, right or wrong. Click ★ on a question again to take it off the list.</span></button>' +
      '<button class="mode" data-mode="weak"><b>Weak concepts</b><span>Concepts under 70% and questions you recently missed.</span></button>' +
      '<button class="mode" data-mode="exam"><b>Exam simulation</b><span>Random mix, no feedback until the end.</span></button>' +
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
    app.querySelector('#len').onchange = function () { S.prefs.len = this.value === 'all' ? 'all' : Number(this.value); save(); };
    function readChecks() { S.prefs.chapters = [].slice.call(app.querySelectorAll('.chk')).filter(function (c) { return c.checked; }).map(function (c) { return Number(c.value); }); save(); }
    [].forEach.call(app.querySelectorAll('.chk'), function (c) { c.onchange = readChecks; });
    app.querySelector('#chAll').onclick = function () { [].forEach.call(app.querySelectorAll('.chk'), function (c) { c.checked = true; }); readChecks(); };
    app.querySelector('#chNone').onclick = function () { [].forEach.call(app.querySelectorAll('.chk'), function (c) { c.checked = false; }); readChecks(); };
    [].forEach.call(app.querySelectorAll('[data-mode]'), function (b) { b.onclick = function () { startMode(b.getAttribute('data-mode')); }; });
    app.querySelector('#cont').onclick = function () { startCont(false); };
    [].forEach.call(app.querySelectorAll('[data-resume]'), function (b) { b.onclick = function () { resumeSes(b.getAttribute('data-resume')); }; });
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
