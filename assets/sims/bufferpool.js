/* Buffer pool replacement simulator (LRU, CLOCK, LRU-K, MRU) and the
   Homework 2 LRU-K replacer API playground. */
(function () {
  'use strict';
  var DBP = window.DBP;
  var esc = function (s) { return DBP.esc(s); };

  /* ---------------- pure simulation ---------------- */

  function parseRefs(text) {
    return text.split(/[\s,]+/).filter(Boolean).map(function (tok) {
      var w = /^[wW]/.test(tok) && tok.length > 1;
      return { page: w ? tok.slice(1) : tok, write: w };
    });
  }

  function simulate(refs, nFrames, policy, K) {
    K = K || 2;
    var frames = [], hand = 0, t = 0, hits = 0, misses = 0, writes = 0;
    var snaps = [];
    function clone() { return frames.map(function (f) { return f ? { page: f.page, dirty: f.dirty, ref: f.ref, hist: f.hist.slice(), last: f.last } : null; }); }
    for (var i = 0; i < nFrames; i++) frames.push(null);

    refs.forEach(function (r) {
      t++;
      var ev = { page: r.page, write: r.write, t: t };
      var idx = -1;
      for (var j = 0; j < nFrames; j++) if (frames[j] && frames[j].page === r.page) { idx = j; break; }
      if (idx >= 0) {
        var f = frames[idx];
        hits++; ev.hit = true; ev.frame = idx;
        f.last = t; f.ref = 1; f.hist.push(t); if (f.hist.length > K) f.hist.shift();
        if (r.write) f.dirty = true;
      } else {
        misses++; ev.hit = false;
        var target = -1, why = '';
        for (var k = 0; k < nFrames; k++) if (!frames[k]) { target = k; break; }
        if (target < 0) {
          if (policy === 'lru' || policy === 'mru') {
            target = 0;
            for (var a = 1; a < nFrames; a++) {
              if (policy === 'lru' ? frames[a].last < frames[target].last : frames[a].last > frames[target].last) target = a;
            }
            why = (policy === 'lru' ? 'least' : 'most') + ' recently used (last access t=' + frames[target].last + ')';
          } else if (policy === 'clock') {
            var cleared = [];
            while (frames[hand].ref === 1) { frames[hand].ref = 0; cleared.push(frames[hand].page); hand = (hand + 1) % nFrames; }
            target = hand;
            why = 'clock hand found ref bit 0' + (cleared.length ? ' after clearing ref bits of ' + cleared.join(', ') : '');
            hand = (hand + 1) % nFrames;
          } else { // lru-k
            var best = -1, bestDist = -1, bestFirst = Infinity;
            for (var b = 0; b < nFrames; b++) {
              var h = frames[b].hist;
              var dist = h.length < K ? Infinity : t - h[0];
              if (dist > bestDist || (dist === bestDist && h[0] < bestFirst)) { best = b; bestDist = dist; bestFirst = h[0]; }
            }
            target = best;
            why = bestDist === Infinity ? 'fewer than K=' + K + ' accesses → backward K-distance +∞ (oldest first access t=' + bestFirst + ')' : 'largest backward K-distance = ' + bestDist;
          }
          ev.victim = frames[target].page;
          ev.victimDirty = frames[target].dirty;
          if (frames[target].dirty) writes++;
          ev.why = why;
        }
        frames[target] = { page: r.page, dirty: r.write, ref: 1, hist: [t], last: t };
        ev.frame = target;
      }
      snaps.push({ frames: clone(), hand: hand, ev: ev, hits: hits, misses: misses, writes: writes, t: t });
    });
    return snaps;
  }
  DBP.logic.bufferPool = { simulate: simulate, parseRefs: parseRefs };

  /* ---------------- buffer pool widget ---------------- */

  DBP.sims.bufferPool = function (el, opts) {
    var body = DBP.widget(el, 'Buffer pool replacement simulator', 'interactive');
    var PRESETS = {
      classic: { refs: '1 2 3 4 1 2 5 1 2 3 4 5', frames: 3, label: 'Classic trace' },
      flood: { refs: '1 2 1 2 1 2 3 4 5 6 1 2', frames: 3, label: 'Sequential flooding' },
      hw2: { refs: 'A A B B C D E F', frames: 4, label: 'HW2 example (+E, F)' },
      dirty: { refs: '1 W2 3 1 W4 5 2 1', frames: 3, label: 'Dirty pages' }
    };
    var policy = opts.policy || 'lru', nFrames = 3, refsText = PRESETS.classic.refs, step = 0, K = 2;

    function draw() {
      var refs = parseRefs(refsText);
      var snaps = simulate(refs, nFrames, policy, K);
      step = Math.max(0, Math.min(step, snaps.length));
      var s = step ? snaps[step - 1] : null;
      var frames = s ? s.frames : new Array(nFrames).fill(null);
      var hand = s ? s.hand : 0;
      var trace = refs.map(function (r, i) {
        var cls = i === step - 1 ? 'cur' : '';
        if (i < step) cls += snaps[i].ev.hit ? ' h' : ' mi';
        return '<span class="' + cls + '" title="t=' + (i + 1) + '">' + (r.write ? 'W' : '') + esc(r.page) + '</span>';
      }).join('');

      var fr = frames.map(function (f, i) {
        var cls = 'frame';
        if (s && s.ev.frame === i) cls += s.ev.hit ? ' hit' : ' miss';
        if (policy === 'clock' && hand === i) cls += ' hand';
        var meta = '';
        if (f) {
          if (policy === 'lru' || policy === 'mru') meta = 'last t=' + f.last;
          else if (policy === 'clock') meta = 'ref=' + f.ref;
          else {
            var tNow = s ? s.t : 0;
            meta = 'hist ' + f.hist.join(',') + '<br>' + (f.hist.length < K ? 'dist +∞' : 'dist ' + (tNow + 1 - f.hist[0]));
          }
          if (f.dirty) meta += '<br><span style="color:var(--bad)">dirty</span>';
        }
        return '<div class="' + cls + '"><div class="fh">frame ' + i + (policy === 'clock' && hand === i ? ' ◀ hand' : '') + '</div><div class="fp">' + (f ? esc(f.page) : '<span class="muted">·</span>') + '</div><div class="fm">' + meta + '</div></div>';
      }).join('');

      var msg = '';
      if (!s) msg = '<div class="status">Press <b>Step</b> to process the first page request.</div>';
      else {
        var e = s.ev;
        msg = '<div class="status ' + (e.hit ? 'good' : 'info') + '">t=' + e.t + ': request ' + (e.write ? 'WRITE ' : '') + 'page <b>' + esc(e.page) + '</b> → ' +
          (e.hit ? '<b>HIT</b> in frame ' + e.frame + (e.write ? ' (frame becomes dirty)' : '') + '.' :
            '<b>MISS</b>. ' + (e.victim !== undefined ? 'Evict page <b>' + esc(e.victim) + '</b> from frame ' + e.frame + ': ' + esc(e.why) + '.' + (e.victimDirty ? ' It is <b>dirty</b>, so it must be written back to disk first (slow path).' : ' It is clean, so it is simply dropped (fast path).') : 'Load into free frame ' + e.frame + '.')) + '</div>';
      }

      // comparison of all policies on this trace
      var cmp = ['lru', 'clock', 'lruk', 'mru'].map(function (p) {
        var sn = simulate(refs, nFrames, p, K);
        var last = sn[sn.length - 1] || { hits: 0, misses: 0, writes: 0 };
        return '<tr' + (p === policy ? ' class="hl"' : '') + '><td>' + NAMES[p] + '</td><td>' + last.hits + '</td><td>' + last.misses + '</td><td>' + last.writes + '</td></tr>';
      }).join('');

      body.innerHTML =
        '<div class="controls"><b class="small">Policy:</b>' +
        Object.keys(NAMES).map(function (p) { return '<button class="btn sm' + (policy === p ? ' on' : '') + '" data-pol="' + p + '">' + NAMES[p] + '</button>'; }).join('') +
        '<span class="sep"></span><label>Frames <input type="number" min="1" max="8" value="' + nFrames + '" data-frames></label></div>' +
        '<div class="controls"><b class="small">Trace:</b>' +
        Object.keys(PRESETS).map(function (k) { return '<button class="btn sm ghost" data-preset="' + k + '">' + PRESETS[k].label + '</button>'; }).join('') + '</div>' +
        '<input type="text" class="mono" data-refs style="width:100%" value="' + esc(refsText) + '" aria-label="Page reference string">' +
        '<div class="small muted" style="margin-top:4px">Space-separated page ids. Prefix with <code>W</code> for a write (makes the page dirty), e.g. <code>W3</code>.</div>' +
        '<div class="trace">' + trace + '</div>' +
        '<div class="controls"><button class="btn" data-back' + (step === 0 ? ' disabled' : '') + '>◀ Back</button><button class="btn primary" data-step' + (step >= refs.length ? ' disabled' : '') + '>Step ▶</button><button class="btn" data-all>Run all</button><button class="btn" data-reset>Reset</button></div>' +
        '<div class="frames">' + fr + '</div>' + msg +
        '<div class="stats"><span>Hits <b>' + (s ? s.hits : 0) + '</b></span><span>Misses <b>' + (s ? s.misses : 0) + '</b></span><span>Hit rate <b>' + (s ? Math.round(100 * s.hits / step) : 0) + '%</b></span><span>Dirty write-backs <b>' + (s ? s.writes : 0) + '</b></span></div>' +
        '<details class="more" style="margin-top:12px"><summary>Compare all policies on this trace (' + nFrames + ' frames)</summary><table><thead><tr><th>Policy</th><th>Hits</th><th>Misses</th><th>Write-backs</th></tr></thead><tbody>' + cmp + '</tbody></table></details>';
      var inp = body.querySelector('[data-refs]');
      inp.addEventListener('change', function () { refsText = inp.value; step = 0; draw(); });
      var fi = body.querySelector('[data-frames]');
      fi.addEventListener('change', function () { nFrames = Math.max(1, Math.min(8, +fi.value || 3)); step = 0; draw(); });
    }
    var NAMES = { lru: 'LRU', clock: 'CLOCK', lruk: 'LRU-2', mru: 'MRU' };

    body.addEventListener('click', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-pol')) { policy = t.getAttribute('data-pol'); step = 0; }
      else if (t.hasAttribute('data-preset')) { var p = PRESETS[t.getAttribute('data-preset')]; refsText = p.refs; nFrames = p.frames; step = 0; }
      else if (t.hasAttribute('data-step')) step++;
      else if (t.hasAttribute('data-back')) step--;
      else if (t.hasAttribute('data-all')) step = 1e9;
      else if (t.hasAttribute('data-reset')) step = 0;
      else return;
      draw();
    });
    draw();
  };

  /* ---------------- HW2: LRU-K replacer API ---------------- */

  function Replacer(n, k) {
    if (!n || !k) throw new Error('invalid_argument: num_frames and k must be > 0');
    this.n = n; this.k = k; this.now = 0; this.nodes = {}; this.size = 0;
  }
  Replacer.prototype.recordAccess = function (f) {
    if (f < 0 || f >= this.n) throw new Error('invalid_argument: frame ' + f + ' out of range');
    var node = this.nodes[f];
    if (!node) node = this.nodes[f] = { hist: [], evictable: false };
    node.hist.push(this.now++);
    if (node.hist.length > this.k) node.hist.shift();
  };
  Replacer.prototype.setEvictable = function (f, b) {
    if (f < 0 || f >= this.n) throw new Error('invalid_argument: frame ' + f + ' out of range');
    var node = this.nodes[f];
    if (!node) return;
    if (node.evictable !== b) { node.evictable = b; this.size += b ? 1 : -1; }
  };
  Replacer.prototype.distance = function (f) {
    var h = this.nodes[f].hist;
    return h.length < this.k ? Infinity : this.now - h[0];
  };
  Replacer.prototype.victim = function () {
    var best = null, bd = -1, bf = Infinity, self = this;
    Object.keys(this.nodes).forEach(function (key) {
      var f = +key, node = self.nodes[f];
      if (!node.evictable) return;
      var d = self.distance(f);
      if (d > bd || (d === bd && node.hist[0] < bf)) { best = f; bd = d; bf = node.hist[0]; }
    });
    return best;
  };
  Replacer.prototype.evict = function () {
    var v = this.victim();
    if (v === null) return null;
    delete this.nodes[v]; this.size--;
    return v;
  };
  Replacer.prototype.remove = function (f) {
    var node = this.nodes[f];
    if (!node) return;
    if (!node.evictable) throw new Error('invalid_argument: frame ' + f + ' is not evictable');
    delete this.nodes[f]; this.size--;
  };
  DBP.logic.LRUKReplacer = Replacer;

  DBP.sims.lruKReplacer = function (el) {
    var body = DBP.widget(el, 'LRUKReplacer playground (Homework 2, Task 1)', 'interactive');
    var N = 6, k = 2, R, log;
    function reset() { R = new Replacer(N, k); log = []; }
    function say(m, kind) { log.unshift({ m: m, k: kind || '' }); log = log.slice(0, 12); }
    function call(fn, label) {
      try { var r = fn(); say(label + (r !== undefined ? ' → ' + r : ''), 'good'); }
      catch (e) { say(label + ' → throws std::' + e.message, 'bad'); }
    }
    function draw() {
      var victim = R.victim();
      var rows = Object.keys(R.nodes).map(Number).sort(function (a, b) { return a - b; }).map(function (f) {
        var node = R.nodes[f], d = R.distance(f);
        return '<tr' + (f === victim ? ' class="hl"' : '') + '><td>' + f + '</td><td class="mono">' + node.hist.join(', ') + '</td><td>' + (node.evictable ? '<span class="pill good">yes</span>' : '<span class="pill">no</span>') + '</td><td class="mono">' +
          (d === Infinity ? '+∞' : R.now + ' − ' + node.hist[0] + ' = ' + d) + '</td><td>' + (f === victim ? '← next victim' : '') + '</td></tr>';
      }).join('');
      body.innerHTML =
        '<div class="controls"><label>num_frames <input type="number" min="1" max="10" value="' + N + '" data-n></label><label>k <input type="number" min="1" max="4" value="' + k + '" data-k></label><button class="btn sm" data-new>New replacer</button>' +
        '<span class="sep"></span><button class="btn sm ghost" data-demo>Run the HW2 test: 0,1,2,0</button><button class="btn sm ghost" data-demo2>Run A A B B C D</button></div>' +
        '<div class="controls"><label>frame_id <input type="number" min="0" value="0" data-f></label>' +
        '<button class="btn primary sm" data-act="rec">RecordAccess(f)</button><button class="btn sm" data-act="evt">SetEvictable(f, true)</button><button class="btn sm" data-act="nevt">SetEvictable(f, false)</button><button class="btn sm" data-act="rm">Remove(f)</button><button class="btn sm" data-act="ev">Evict()</button><button class="btn sm" data-act="sz">Size()</button></div>' +
        '<div class="stats"><span>current_timestamp <b>' + R.now + '</b></span><span>Size() <b>' + R.size + '</b></span></div>' +
        '<table style="margin-top:8px"><thead><tr><th>frame</th><th>last k timestamps</th><th>evictable</th><th>backward k-distance (now = ' + R.now + ')</th><th></th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="5" class="muted">No frames tracked yet. Call RecordAccess.</td></tr>') + '</tbody></table>' +
        '<div class="log">' + log.map(function (l) { return '<div class="lg-' + l.k + '">' + esc(l.m) + '</div>'; }).join('') + '</div>';
    }
    body.addEventListener('click', function (e) {
      var t = e.target, act = t.getAttribute('data-act');
      var f = +(body.querySelector('[data-f]').value || 0);
      if (t.hasAttribute('data-new')) {
        N = +body.querySelector('[data-n]').value; k = +body.querySelector('[data-k]').value;
        try { reset(); say('LRUKReplacer(' + N + ', ' + k + ') constructed', 'info'); } catch (er) { say('LRUKReplacer(' + N + ', ' + k + ') → throws std::' + er.message, 'bad'); N = 6; k = 2; reset(); }
      } else if (t.hasAttribute('data-demo')) {
        N = 6; k = 2; reset();
        [0, 1, 2, 0].forEach(function (x) { call(function () { R.recordAccess(x); }, 'RecordAccess(' + x + ')'); });
        [0, 1, 2].forEach(function (x) { call(function () { R.setEvictable(x, true); }, 'SetEvictable(' + x + ', true)'); });
        call(function () { return R.size; }, 'Size()');
        say('Now press Evict() three times: expect 1, then 2, then 0.', 'info');
      } else if (t.hasAttribute('data-demo2')) {
        N = 4; k = 2; reset();
        say('Frames A,B,C,D = 0,1,2,3. Trace A A B B C D at timestamps 0..5.', 'info');
        [0, 0, 1, 1, 2, 3].forEach(function (x) { R.recordAccess(x); });
        [0, 1, 2, 3].forEach(function (x) { R.setEvictable(x, true); });
        say('Eviction order will be C(2), D(3), A(0), B(1).', 'info');
      } else if (act === 'rec') call(function () { R.recordAccess(f); }, 'RecordAccess(' + f + ')');
      else if (act === 'evt') call(function () { R.setEvictable(f, true); }, 'SetEvictable(' + f + ', true)');
      else if (act === 'nevt') call(function () { R.setEvictable(f, false); }, 'SetEvictable(' + f + ', false)');
      else if (act === 'rm') call(function () { R.remove(f); }, 'Remove(' + f + ')');
      else if (act === 'ev') call(function () { var v = R.evict(); return v === null ? 'std::nullopt' : v; }, 'Evict()');
      else if (act === 'sz') call(function () { return R.size; }, 'Size()');
      else return;
      var keepF = f;
      draw();
      body.querySelector('[data-f]').value = keepF;
    });
    reset(); draw();
  };
})();
