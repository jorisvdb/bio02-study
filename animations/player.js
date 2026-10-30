/* Shared step player for the BIO02 animations (no libraries, works from file://).
   A scene = { VW, VH, NW (view width on a phone), aria, legend: [[cssVar, label]], build(svg) -> {id: element},
   init: {params}, layout(params) -> {id: {x, y, s, o, c}, _cam: {x}}, steps: [{title, en, nl, say?, f: [params...], d?}] }.
   Each step = one or more "frames" of parameters; the player tweens between layouts.
   Voice: the browser reads each step aloud (title + en, or the optional plain-text "say"; nl in Dutch). */
(function () {
  'use strict';
    var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function num(v, d) { return v == null ? d : v; }
  function last(a) { return a[a.length - 1]; }
  function txt(parent, x, y, cls, s, anchor) {
    var a = { x: x, y: y }; if (cls) a['class'] = cls; if (anchor) a['text-anchor'] = anchor;
    return el('text', a, parent, s);
  }

  /* ================= player ================= */
  function Player(sec, scene) {
    var self = this;
    this.scene = scene; this.sec = sec;
    sec.innerHTML =
      '<div class="stage"><svg xmlns="' + NS + '" viewBox="0 0 ' + scene.VW + ' ' + scene.VH + '" role="img" aria-label="' + scene.aria + '"></svg></div>' +
      '<div class="ctrl">' +
      '<button data-a="restart" title="Back to the start (Home)" aria-label="Restart">⏮</button>' +
      '<button data-a="prev" title="Previous step (←)" aria-label="Previous step">◀</button>' +
      '<button data-a="play" class="play" title="Play or pause (Space)">▶ Play</button>' +
      '<button data-a="next" title="Next step (→)" aria-label="Next step">▶|</button>' +
      '<label>speed <select><option value="0.5">slow</option><option value="1" selected>normal</option><option value="2">fast</option></select></label>' +
      '<button data-a="voice" class="voice" title="Read every step aloud; with Play it moves on by itself when the voice is done (V)">🔇 Turn voice on</button>' +
      '<label class="vlang">read <select class="vsel"><option value="en">English</option><option value="ennl">English + Dutch</option><option value="nl">Dutch</option></select></label>' +
      '<span class="count"></span></div>' +
      '<div class="text" aria-live="polite"><h2></h2><p class="en"></p><p class="nl"></p></div>' +
      '<ul class="legend">' + scene.legend.map(function (l) { return '<li><i style="background:var(' + l[0] + ')"></i>' + l[1] + '</li>'; }).join('') + '</ul>';
    this.stage = sec.querySelector('.stage');
    this.svg = sec.querySelector('svg');
    this.objs = scene.build(this.svg);
    for (var id in this.objs) { var e = this.objs[id]; e._base = e.getAttribute('class') || ''; e._c = ''; }
    var p = scene.init;
    this.F = scene.steps.map(function (s) {
      return (s.f || [{}]).map(function (f) { p = merge(p, f); return p; });
    });
    this.n = scene.steps.length;
    this.i = 0; this.speed = 1; this.playing = false; this.raf = null; this.timer = null;
    this.cur = scene.layout(last(this.F[0]));
    this.apply(this.cur); this.show();
    this.fresh = true; this.voiceDone = true; this.stepDone = true;
    sec.querySelector('.ctrl').addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      b.blur();
      var a = b.getAttribute('data-a');
      if (a === 'play') self.toggle();
      else if (a === 'next') self.jump(self.i + 1, 'step');
      else if (a === 'prev') self.jump(self.i - 1, 'tween');
      else if (a === 'restart') self.jump(0, 'tween');
      else if (a === 'voice') self.setVoice(!Voice.on);
    });
    sec.querySelector('.ctrl label select').addEventListener('change', function (ev) { self.speed = Number(ev.target.value) || 1; Voice.rate = self.speed; });
    var vs = sec.querySelector('.vsel'); vs.value = Voice.lang;
    vs.addEventListener('change', function (ev) { Voice.lang = ev.target.value; Voice.store(); Player.all.forEach(function (p) { p.sec.querySelector('.vsel').value = Voice.lang; }); if (Voice.on && self.playing) self.say(); });
    this.showVoice();
  }
  Player.prototype.narrow = function () { var w = this.stage.clientWidth; return w > 0 && w < 700; };
  Player.prototype.apply = function (st) {
    for (var id in st) {
      if (id === '_cam') continue;
      var e = this.objs[id]; if (!e) continue;
      var s = st[id], sc = num(s.s, 1), o = num(s.o, 1);
      var tr = 'translate(' + num(s.x, 0).toFixed(2) + ' ' + num(s.y, 0).toFixed(2) + ')';
      if (Math.abs(sc - 1) > 0.001) tr += ' scale(' + sc.toFixed(3) + ')';
      e.setAttribute('transform', tr);
      e.setAttribute('opacity', Math.max(0, Math.min(1, o)).toFixed(3));
      e.style.display = o < 0.004 ? 'none' : '';
      var c = s.c || '';
      if (e._c !== c) { e._c = c; e.setAttribute('class', e._base + (c ? ' ' + c : '')); }
    }
    var VW = this.scene.VW, VH = this.scene.VH, w = this.narrow() ? this.scene.NW : VW;
    var cx = st._cam ? st._cam.x : VW / 2;
    var x0 = Math.max(0, Math.min(VW - w, cx - w / 2));
    this.svg.setAttribute('viewBox', x0.toFixed(1) + ' 0 ' + w + ' ' + VH);
  };
  function lerpState(a, b, t) {
    var r = {};
    for (var id in b) {
      var q = b[id], p = a[id] || q;
      r[id] = { x: lerp(num(p.x, 0), num(q.x, 0), t), y: lerp(num(p.y, 0), num(q.y, 0), t),
        s: lerp(num(p.s, 1), num(q.s, 1), t), o: lerp(num(p.o, 1), num(q.o, 1), t), c: t > 0 ? q.c : p.c };
    }
    return r;
  }
  Player.prototype.stopAnim = function () {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.timer) clearTimeout(this.timer);
    this.raf = null; this.timer = null; this.thaw = null;
  };
  Player.prototype.tween = function (target, dur, done) {
    var self = this, from = this.cur;
    this.stopAnim();
    if (!dur) { this.cur = target; this.apply(target); if (done) done(); return; }
    var t0 = null;
    function tick(now) {
      // paused: stop here, and thaw() goes on from the same point of the movement
      if (self.frozen) {
        var at = now; self.raf = null;
        self.thaw = function () { if (t0 !== null) t0 += performance.now() - at; self.raf = requestAnimationFrame(tick); };
        return;
      }
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / dur);
      self.cur = lerpState(from, target, ease(t));
      self.apply(self.cur);
      if (t < 1) self.raf = requestAnimationFrame(tick);
      else { self.raf = null; self.cur = target; self.apply(target); if (done) done(); }
    }
    this.raf = requestAnimationFrame(tick);
  };
  Player.prototype.runFrames = function (i, done) {
    var self = this, fr = this.F[i], s = this.scene.steps[i], j = 0;
    var d = s.d || (fr.length > 1 ? 450 : 1100);
    function next() {
      if (j >= fr.length) { if (done) done(); return; }
      self.tween(self.scene.layout(fr[j++]), d / self.speed, next);
    }
    next();
  };
  // quiet = show the step without reading it aloud (after ◀ ▶| ⏮); Play then plays this step from its start
  Player.prototype.go = function (i, mode, quiet) {
    if (i < 0 || i >= this.n) return;
    var self = this;
    this.stopAnim();
    this.frozen = false; this.pausedAt = null;
    this.i = i; this.show();
    this.stepDone = false;
    this.fresh = !!quiet;
    if (quiet) this.voiceDone = true; else this.say();
    var after = function () { self.stepDone = true; self.afterStep(); };
    if (mode === 'step') this.runFrames(i, after);
    else this.tween(this.scene.layout(last(this.F[i])), mode === 'instant' ? 0 : 550 / this.speed, after);
  };
  // ◀ ▶| ⏮ and the arrow keys: stop playing and the voice, show the step, stay paused
  Player.prototype.jump = function (i, mode) {
    if (i < 0 || i >= this.n) return;
    this.setPlaying(false); Voice.stop();
    this.go(i, mode, true);
  };
  Player.prototype.afterStep = function () {
    var self = this;
    if (!this.playing) return;
    if (Voice.on) {
      // with the voice on: move on when both the movement and the speech are finished
      if (!this.stepDone || !this.voiceDone || this.timer) return;
      if (this.i >= this.n - 1) { this.setPlaying(false); Voice.stop(); return; }
      this.timer = setTimeout(function () { self.timer = null; self.go(self.i + 1, 'step'); }, 900 / this.speed);
      return;
    }
    if (this.i >= this.n - 1) { this.setPlaying(false); Voice.stop(); return; }
    var s = this.scene.steps[this.i];
    var dwell = Math.max(2600, (s.en.replace(/<[^>]+>/g, '').length) * 42) / this.speed;
    this.timer = setTimeout(function () { self.timer = null; self.go(self.i + 1, 'step'); }, dwell);
  };
  Player.prototype.setPlaying = function (v) {
    this.playing = v;
    if (!v && this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.sec.querySelector('.play').textContent = v ? '⏸ Pause' : '▶ Play';
  };
  Player.prototype.toggle = function () {
    // pause: the movement and the voice stop where they are (mid-sentence); Play goes on from that point
    if (this.playing) {
      this.setPlaying(false);
      this.frozen = true; this.pausedAt = this.i;
      Voice.pause(this);
      return;
    }
    this.setPlaying(true);
    var voicePaused = Voice.paused && Voice.owner === this && Voice.step === this.i;
    var mid = this.pausedAt === this.i && (!!this.thaw || voicePaused || !this.stepDone || (Voice.on && !this.voiceDone));
    this.frozen = false; this.pausedAt = null;
    if (this.thaw) { var f = this.thaw; this.thaw = null; f(); }
    if (voicePaused) Voice.resume();
    if (mid) { this.afterStep(); return; }   // finish this step first, then move on as usual
    if (this.fresh) {                        // step shown but not played yet: play it from its start
      if (this.i > 0) { this.stopAnim(); this.cur = this.scene.layout(last(this.F[this.i - 1])); this.apply(this.cur); }
      this.go(this.i, 'step');
      return;
    }
    if (this.i >= this.n - 1) this.go(0, 'tween');
    else this.go(this.i + 1, 'step');
  };
  Player.prototype.show = function () {
    var s = this.scene.steps[this.i], q = this.sec;
    q.querySelector('.text h2').textContent = s.title;
    q.querySelector('.text .en').innerHTML = s.en;
    q.querySelector('.text .nl').textContent = s.nl;
    q.querySelector('.count').textContent = 'step ' + (this.i + 1) + ' / ' + this.n;
    q.querySelector('[data-a="prev"]').disabled = this.i === 0;
    q.querySelector('[data-a="next"]').disabled = this.i === this.n - 1;
  };

  /* ================= voice (speech synthesis of the browser; offline with the Windows voices) ================= */
  var Voice = {
    ok: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
    on: false, lang: 'en', rate: 1, token: 0,
    load: function () {
      try { var v = JSON.parse(localStorage.getItem('bio02anim.voice') || '{}'); this.on = !!v.on && (this.ok || !!window.ANIM_AUDIO); if (v.lang) this.lang = v.lang; } catch (e) { }
    },
    store: function () { try { localStorage.setItem('bio02anim.voice', JSON.stringify({ on: this.on, lang: this.lang })); } catch (e) { } },
    pick: function (code) {
      var vs = this.ok ? speechSynthesis.getVoices() : [], best = null, k;
      for (k = 0; k < vs.length; k++) {
        var v = vs[k], l = (v.lang || '').toLowerCase().replace('_', '-');
        if (l.indexOf(code) !== 0) continue;
        var score = (/natural/i.test(v.name) ? 6 : /online/i.test(v.name) ? 5 : /google/i.test(v.name) ? 4 : 0) + (code === 'en' && /en-(us|gb)/.test(l) ? 2 : 0);
        if (!best || score > best.s) best = { v: v, s: score };
      }
      return best && best.v;
    },
    stop: function () {
      this.token++; this.paused = false; this.speaking = false; this.owner = null; clearTimeout(this.wd);
      if (this.audio) { try { this.audio.pause(); } catch (e) { } this.audio = null; }
      if (this.ok) speechSynthesis.cancel();
    },
    // pause in the middle of a sentence (mp3 or browser voice); resume() goes on from the same word
    pause: function (pl) {
      if (!this.audio && !this.speaking) return;
      this.paused = true; this.owner = pl; this.step = pl.i; clearTimeout(this.wd);
      if (this.audio) { try { this.audio.pause(); } catch (e) { } }
      else if (this.ok) speechSynthesis.pause();
    },
    resume: function () {
      if (!this.paused) return;
      this.paused = false;
      if (this.audio) {           // onplaying sets a new safety timer
        var pr = this.audio.play();
        if (pr && pr.catch) pr.catch(function () { });
      } else if (this.ok) { speechSynthesis.resume(); if (this.arm) this.arm(); }
    },
    // ready-made mp3 files (animations/audio, made by tools/build_anim_audio.py): played one after the other
    play: function (srcs, done) {
      this.stop();
      var my = this.token, self = this, q = srcs.slice();
      function next() {
        if (my !== self.token) return;
        if (!q.length) { self.audio = null; if (done) done(); return; }
        var a = new Audio(q.shift()), fired = false;
        function fin() { if (fired || my !== self.token) return; fired = true; clearTimeout(self.wd); next(); }
        // safety net: if the file does not start within 5 s, or does not end in time, move on (not while paused)
        self.wd = setTimeout(function () { console.warn('[voice] file did not start:', a.src); fin(); }, 5000);
        a.onplaying = function () {
          clearTimeout(self.wd);
          var left = isFinite(a.duration) ? (a.duration - a.currentTime) / a.playbackRate : 30;
          self.wd = setTimeout(fin, (left + 3) * 1000);
        };
        a.playbackRate = self.rate < 1 ? 0.85 : self.rate > 1 ? 1.3 : 1;
        a.onended = fin;
        a.onerror = function () { console.warn('[voice] cannot play', a.src); fin(); };
        self.audio = a;
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function (e) { console.warn('[voice] play blocked:', e.name); fin(); });
      }
      next();
    },
    // parts: [{text, lang}]; done() runs after the last sentence (not when interrupted)
    speak: function (parts, done) {
      if (!this.ok) { if (done) done(); return; }
      this.stop();
      var my = this.token, self = this, queue = [];
      this.speaking = true;
      if (!parts.length) { if (done) done(); return; }
      parts.forEach(function (p) {
        // one utterance per sentence: long utterances can stop half way in Chrome
        (p.text.match(/[^.!?;]+[.!?;]*/g) || []).forEach(function (s) { s = s.trim(); if (s) queue.push({ text: s, lang: p.lang }); });
      });
      function next() {
        if (my !== self.token) return;
        if (!queue.length) { self.speaking = false; if (done) done(); return; }
        var q = queue.shift(), u = new SpeechSynthesisUtterance(q.text), v = self.pick(q.lang);
        if (v) u.voice = v;
        u.lang = v ? v.lang : (q.lang === 'nl' ? 'nl-NL' : 'en-US');
        u.rate = Math.max(0.6, Math.min(1.6, 0.95 * self.rate));
        // watchdog: some systems never fire onend (no voice installed); move on anyway
        var fired = false;
        self.arm = function () { clearTimeout(self.wd); self.wd = setTimeout(fin, Math.max(4000, q.text.length * 120 / u.rate)); };
        self.arm();
        function fin() { if (fired || my !== self.token) return; if (self.paused) return; fired = true; clearTimeout(self.wd); next(); }
        u.onstart = function () { console.info('[voice] start', u.voice ? u.voice.name : '(default voice)'); };
        u.onend = function () { console.info('[voice] end'); fin(); };
        u.onerror = function (e) { console.warn('[voice] error:', e.error); fin(); };
        console.info('[voice] speak:', q.text.slice(0, 60), '| voice:', v ? v.name : 'none found for ' + q.lang, '| voices loaded:', speechSynthesis.getVoices().length);
        self.cur = u;                       // keep a reference: otherwise the browser can drop the utterance
        if (speechSynthesis.paused) speechSynthesis.resume();
        speechSynthesis.speak(u);
      }
      // start a moment after cancel(): Edge's online voices drop an utterance queued right after a cancel,
      // and wait (max 2 s) until the voice list has loaded
      var t0 = Date.now();
      setTimeout(function start() {
        if (my !== self.token) return;
        if (!speechSynthesis.getVoices().length && Date.now() - t0 < 2000) { setTimeout(start, 100); return; }
        next();
      }, 150);
    }
  };
  // make text pleasant to hear: no tags, primes and arrows in words
  function spoken(html, lang) {
    var d = document.createElement('div'); d.innerHTML = html;
    var s = d.textContent || '', nl = lang === 'nl';
    s = s.replace(/5′|5'/g, nl ? 'vijf-accent' : 'five prime').replace(/3′|3'/g, nl ? 'drie-accent' : 'three prime')
      .replace(/\s*(→|->)\s*/g, nl ? ' naar ' : ' to ').replace(/\s*←\s*/g, nl ? ' van ' : ' from ')
      .replace(/①/g, ' 1').replace(/②/g, ' 2').replace(/③/g, ' 3').replace(/④/g, ' 4')
      .replace(/\s+[–-]\s+/g, ', ').replace(/…/g, ', ').replace(/[·•]/g, ', ').replace(/\s+/g, ' ');
    return s.trim();
  }
  // FNV-1a hash of a text (same as fnv() in tools/build_anim_audio.py): an mp3 is used only if it was made from this exact text
  function textHash(t) {
    var x = 0x811c9dc5;
    for (var i = 0; i < t.length; i++) { x ^= t.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
    return ('0000000' + x.toString(16)).slice(-8);
  }
  var PAGE = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
  Player.prototype.audioFor = function (lang, text) {
    var A = window.ANIM_AUDIO, e = A && A[PAGE] && A[PAGE][this.key] && A[PAGE][this.key][this.i];
    e = e && e[lang];
    return e && e.h === textHash(text) ? e.src : null;
  };
  Player.prototype.say = function () {
    var self = this, s = this.scene.steps[this.i];
    if (!Voice.on) { this.voiceDone = true; return; }
    this.voiceDone = false;
    var parts = [];
    if (Voice.lang !== 'nl') parts.push({ text: spoken(s.title + '. ' + (s.say || s.en), 'en'), lang: 'en' });
    if (Voice.lang !== 'en' && s.nl) parts.push({ text: spoken(s.nl, 'nl'), lang: 'nl' });
    var me = this.i, done = function () { if (self.i !== me) return; self.voiceDone = true; self.afterStep(); };
    var files = parts.map(function (p) { return self.audioFor(p.lang, p.text); });
    if (files.length && files.every(Boolean)) Voice.play(files, done);
    else Voice.speak(parts, done);           // no recorded file for this text: fall back to the browser voice
  };
  Player.prototype.setVoice = function (v) {
    if (v && !Voice.ok && !window.ANIM_AUDIO) { alert('This browser cannot read text aloud. Try Chrome or Edge.'); return; }
    Voice.on = v; Voice.store();
    Player.all.forEach(function (p) { p.showVoice(); });
    if (v) { if (this.playing) this.say(); } else { Voice.stop(); this.voiceDone = true; this.afterStep(); }
  };
  Player.prototype.showVoice = function () {
    var b = this.sec.querySelector('.voice');
    b.textContent = Voice.on ? '🔊 Voice is on' : '🔇 Turn voice on';
    b.classList.toggle('on', Voice.on);
    b.setAttribute('aria-pressed', Voice.on ? 'true' : 'false');
    this.sec.querySelector('.vlang').hidden = !Voice.on;
    if (!Voice.ok && !window.ANIM_AUDIO) b.disabled = true;
  };
  Player.all = [];
  window.__animVoice = Voice;            // for the test pages
  Voice.load();
  if (Voice.ok) { speechSynthesis.getVoices(); if ('onvoiceschanged' in speechSynthesis) speechSynthesis.onvoiceschanged = function () { }; }

  /* ================= page wiring (generic) =================
     The page has <div class="tabs"> with buttons data-tab="k" and <section class="player" id="pl-k">.
     Scene files register themselves: Anim.scenes.k = scene (loaded after this file). Debug hash #k=N jumps to step N. */
  var players = {}, active = null;
  function showTab(k) {
    active = k;
    [].forEach.call(document.querySelectorAll('.tabs button'), function (b) {
      var on = b.getAttribute('data-tab') === k;
      b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    for (var id in players) {
      var pl = players[id], show = id === k;
      pl.sec.hidden = !show;
      if (!show) { pl.setPlaying(false); Voice.stop(); pl.stopAnim(); }
      else pl.apply(pl.cur);
    }
  }
  function fromHash() {
    var h = location.hash, m;
    for (var k in players) {
      if ((m = new RegExp('[#&]' + k + '=(\\d+)').exec(h))) { showTab(k); players[k].go(Math.min(players[k].n, Math.max(1, +m[1])) - 1, 'instant', true); return; }
    }
  }
  document.addEventListener('DOMContentLoaded', function () {
    var first = null;
    [].forEach.call(document.querySelectorAll('section.player[id^="pl-"]'), function (sec) {
      var k = sec.id.slice(3), sc = Anim.scenes[k];
      if (!sc) { sec.textContent = 'Scene "' + k + '" is missing.'; return; }
      players[k] = new Player(sec, sc); players[k].key = k; Player.all.push(players[k]);
      if (!first) first = k;
    });
    [].forEach.call(document.querySelectorAll('.tabs button'), function (b) {
      b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); });
    });
    if (first) showTab(first);
    fromHash();
    window.addEventListener('hashchange', fromHash);
    window.addEventListener('resize', function () { for (var id in players) players[id].apply(players[id].cur); });
    document.addEventListener('keydown', function (ev) {
      var tag = (ev.target.tagName || '').toLowerCase();
      if (tag === 'select' || tag === 'input' || tag === 'textarea' || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      var pl = players[active]; if (!pl) return;
      if (ev.key === ' ' || ev.key === 'Spacebar') { ev.preventDefault(); pl.toggle(); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); pl.jump(pl.i + 1, 'step'); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); pl.jump(pl.i - 1, 'tween'); }
      else if (ev.key === 'Home') { ev.preventDefault(); pl.jump(0, 'tween'); }
      else if (ev.key === 'v' || ev.key === 'V') { ev.preventDefault(); pl.setVoice(!Voice.on); }
    });
  });
  window.addEventListener('beforeunload', function () { Voice.stop(); });

  var Anim = window.Anim = { scenes: {}, spoken: spoken, el: el, txt: txt, merge: merge, ease: ease, lerp: lerp, num: num, last: last, NS: NS, Player: Player };

})();
