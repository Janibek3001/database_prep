/* Hash table simulators: linear probing, cuckoo, chained, extendible and
   linear hashing. Algorithms are plain classes in DBP.logic for testing. */
(function () {
  'use strict';
  var DBP = window.DBP;
  var esc = function (s) { return DBP.esc(s); };
  var TINTS = ['var(--accent-soft)', 'var(--good-soft)', 'var(--warn-soft)', 'var(--violet-soft)', 'var(--bad-soft)', 'var(--surface-2)'];
  var INKS = ['var(--accent)', 'var(--good)', 'var(--warn)', 'var(--violet)', 'var(--bad)', 'var(--muted)'];

  function bin(n, w) { var s = (n >>> 0).toString(2); while (s.length < w) s = '0' + s; return s.slice(-w); }

  /* ------------------------------------------------------------------ */
  /* Linear probing                                                      */
  /* ------------------------------------------------------------------ */
  function LinearProbe(n) { this.n = n; this.slots = []; for (var i = 0; i < n; i++) this.slots.push(null); }
  LinearProbe.prototype.h = function (k) { return ((k % this.n) + this.n) % this.n; };
  LinearProbe.prototype.count = function () { return this.slots.filter(function (s) { return s && !s.tomb; }).length; };
  LinearProbe.prototype.find = function (k) {
    var path = [], i = this.h(k);
    for (var step = 0; step < this.n; step++) {
      var s = this.slots[i];
      path.push(i);
      if (!s) return { found: false, path: path, why: 'reached an empty slot' };
      if (!s.tomb && s.k === k) return { found: true, idx: i, path: path };
      i = (i + 1) % this.n;
    }
    return { found: false, path: path, why: 'scanned the whole table' };
  };
  LinearProbe.prototype.insert = function (k) {
    var f = this.find(k);
    if (f.found) return { ok: false, path: f.path, msg: k + ' is already in slot ' + f.idx + ' (unique keys)' };
    var path = [], i = this.h(k);
    for (var step = 0; step < this.n; step++) {
      path.push(i);
      var s = this.slots[i];
      if (!s || s.tomb) {
        var reused = s && s.tomb;
        this.slots[i] = { k: k };
        return { ok: true, idx: i, path: path, msg: 'insert ' + k + ': h(' + k + ') = ' + k + ' mod ' + this.n + ' = ' + this.h(k) + (path.length > 1 ? ', probed ' + (path.length - 1) + ' occupied slot' + (path.length > 2 ? 's' : '') : '') + ' → slot ' + i + (reused ? ' (reused a tombstone)' : '') };
      }
      i = (i + 1) % this.n;
    }
    return { ok: false, path: path, msg: 'table is full — must resize (allocate 2× and rehash)' };
  };
  LinearProbe.prototype.remove = function (k, mode) {
    var f = this.find(k);
    if (!f.found) return { ok: false, path: f.path, msg: k + ' not found (' + f.why + ')' };
    if (mode === 'tombstone') {
      this.slots[f.idx] = { k: k, tomb: true };
      return { ok: true, path: f.path, msg: 'delete ' + k + ': slot ' + f.idx + ' marked as a tombstone — lookups keep probing past it, inserts may reuse it' };
    }
    // movement: clear the slot and re-insert the rest of the cluster
    this.slots[f.idx] = null;
    var moved = [], i = (f.idx + 1) % this.n;
    while (this.slots[i]) {
      var s = this.slots[i]; this.slots[i] = null;
      if (!s.tomb) { var r = this.insert(s.k); if (r.idx !== i) moved.push(s.k + ': ' + i + '→' + r.idx); }
      i = (i + 1) % this.n;
    }
    return { ok: true, path: f.path, msg: 'delete ' + k + ' by movement: slot ' + f.idx + ' emptied, rest of the cluster re-hashed' + (moved.length ? ' (moved ' + moved.join(', ') + ')' : ' (nothing had to move)') };
  };
  LinearProbe.prototype.resize = function () {
    var old = this.slots.filter(function (s) { return s && !s.tomb; }).map(function (s) { return s.k; });
    this.n *= 2; this.slots = []; for (var i = 0; i < this.n; i++) this.slots.push(null);
    var self = this; old.forEach(function (k) { self.insert(k); });
  };

  /* ------------------------------------------------------------------ */
  /* Cuckoo hashing (two tables)                                         */
  /* ------------------------------------------------------------------ */
  function Cuckoo(n) { this.n = n; this.t = [[], []]; for (var i = 0; i < n; i++) { this.t[0].push(null); this.t[1].push(null); } }
  Cuckoo.prototype.h = function (which, k) { return which === 0 ? k % this.n : Math.floor(k / this.n) % this.n; };
  Cuckoo.prototype.find = function (k) {
    if (this.t[0][this.h(0, k)] === k) return { found: true, table: 0, idx: this.h(0, k) };
    if (this.t[1][this.h(1, k)] === k) return { found: true, table: 1, idx: this.h(1, k) };
    return { found: false };
  };
  Cuckoo.prototype.insert = function (k) {
    var steps = [];
    if (this.find(k).found) return { ok: false, steps: [k + ' already present'] };
    var a = this.h(0, k), b = this.h(1, k);
    steps.push('insert ' + k + ': h1=' + a + ', h2=' + b);
    if (this.t[0][a] === null) { this.t[0][a] = k; steps.push('T1[' + a + '] is empty → place ' + k); return { ok: true, steps: steps, last: [0, a] }; }
    if (this.t[1][b] === null) { this.t[1][b] = k; steps.push('T1[' + a + '] taken by ' + this.t[0][a] + ', T2[' + b + '] is empty → place ' + k); return { ok: true, steps: steps, last: [1, b] }; }
    steps.push('both T1[' + a + '] (' + this.t[0][a] + ') and T2[' + b + '] (' + this.t[1][b] + ') are taken → start evicting');
    var backup = [this.t[0].slice(), this.t[1].slice()];
    var cur = k, table = 0, limit = 2 * this.n + 2;
    for (var i = 0; i < limit; i++) {
      var pos = this.h(table, cur);
      var victim = this.t[table][pos];
      this.t[table][pos] = cur;
      if (victim === null) { steps.push('place ' + cur + ' in T' + (table + 1) + '[' + pos + '] — done'); return { ok: true, steps: steps, last: [table, pos] }; }
      steps.push('place ' + cur + ' in T' + (table + 1) + '[' + pos + '], kicking out ' + victim + ' → rehash it into T' + (2 - table));
      cur = victim; table = 1 - table;
    }
    this.t = backup;
    steps.push('cycle detected after ' + limit + ' moves → cannot insert. Real systems rebuild the table with new hash functions (usually larger).');
    return { ok: false, steps: steps };
  };
  Cuckoo.prototype.remove = function (k) {
    var f = this.find(k);
    if (!f.found) return false;
    this.t[f.table][f.idx] = null; return true;
  };

  /* ------------------------------------------------------------------ */
  /* Chained hashing                                                     */
  /* ------------------------------------------------------------------ */
  function Chained(n, cap) { this.n = n; this.cap = cap; this.b = []; for (var i = 0; i < n; i++) this.b.push([[]]); }
  Chained.prototype.h = function (k) { return k % this.n; };
  Chained.prototype.insert = function (k) {
    var chain = this.b[this.h(k)];
    var last = chain[chain.length - 1];
    if (last.length >= this.cap) { last = []; chain.push(last); }
    last.push(k);
    return chain.length;
  };
  Chained.prototype.find = function (k) {
    var chain = this.b[this.h(k)], scanned = 0;
    for (var p = 0; p < chain.length; p++) for (var j = 0; j < chain[p].length; j++) { scanned++; if (chain[p][j] === k) return { found: true, page: p, scanned: scanned }; }
    return { found: false, scanned: scanned };
  };
  Chained.prototype.remove = function (k) {
    var chain = this.b[this.h(k)];
    for (var p = 0; p < chain.length; p++) {
      var j = chain[p].indexOf(k);
      if (j >= 0) {
        chain[p].splice(j, 1);
        if (!chain[p].length && chain.length > 1) chain.splice(p, 1);
        return true;
      }
    }
    return false;
  };

  /* ------------------------------------------------------------------ */
  /* Extendible hashing                                                  */
  /* ------------------------------------------------------------------ */
  var HBITS = 8;
  function Extendible(cap, mode) {
    this.cap = cap; this.mode = mode || 'lsb'; this.gd = 0; this.nextId = 0;
    var b = this.newBucket(0); this.dir = [b];
  }
  Extendible.prototype.newBucket = function (ld) { return { id: this.nextId++, ld: ld, keys: [] }; };
  Extendible.prototype.hash = function (k) { return ((k % 256) + 256) % 256; };
  Extendible.prototype.index = function (k, depth) {
    var d = depth === undefined ? this.gd : depth, h = this.hash(k);
    if (d === 0) return 0;
    return this.mode === 'lsb' ? h & ((1 << d) - 1) : h >>> (HBITS - d);
  };
  Extendible.prototype.find = function (k) { var b = this.dir[this.index(k)]; return { bucket: b, found: b.keys.indexOf(k) >= 0, idx: this.index(k) }; };
  var MAX_GD = 5;
  Extendible.prototype.snapshot = function () {
    var bks = this.buckets();
    return { gd: this.gd, nextId: this.nextId, dir: this.dir.map(function (b) { return b.id; }),
      bks: bks.map(function (b) { return { id: b.id, ld: b.ld, keys: b.keys.slice() }; }) };
  };
  Extendible.prototype.restore = function (s) {
    var byId = {};
    s.bks.forEach(function (b) { byId[b.id] = { id: b.id, ld: b.ld, keys: b.keys.slice() }; });
    this.gd = s.gd; this.nextId = s.nextId;
    this.dir = s.dir.map(function (id) { return byId[id]; });
  };
  Extendible.prototype.insert = function (k) {
    var log = [];
    if (this.find(k).found) return { ok: false, log: [k + ' already present'] };
    var snap = this.snapshot();
    for (var guard = 0; guard < 20; guard++) {
      var idx = this.index(k), b = this.dir[idx];
      if (b.keys.length < this.cap) {
        b.keys.push(k);
        log.push('insert ' + k + ' (hash ' + bin(this.hash(k), HBITS) + '): directory[' + (this.gd ? bin(idx, this.gd) : '–') + '] → bucket B' + b.id + ' has room');
        return { ok: true, log: log };
      }
      if (b.ld === this.gd) {
        if (this.gd >= MAX_GD) {
          this.restore(snap);
          log.push('insert ' + k + ' would need a directory with more than ' + Math.pow(2, MAX_GD) + ' entries (too many keys share the same ' + MAX_GD + ' hash bits). Rolled back — real systems would use an overflow chain here. Try keys whose binary forms differ in those bits.');
          return { ok: false, log: log };
        }
        var old = this.dir, nd = [];
        if (this.mode === 'lsb') { nd = old.concat(old); }
        else { for (var i = 0; i < old.length * 2; i++) nd.push(old[i >> 1]); }
        this.dir = nd; this.gd++;
        log.push('bucket B' + b.id + ' is full and its local depth = global depth → double the directory: global depth ' + (this.gd - 1) + ' → ' + this.gd);
      }
      // split b
      var nb = this.newBucket(b.ld + 1);
      b.ld++;
      var self = this, bitPos = this.mode === 'lsb' ? b.ld - 1 : HBITS - b.ld;
      var keys = b.keys; b.keys = [];
      keys.forEach(function (x) { ((self.hash(x) >> bitPos) & 1 ? nb : b).keys.push(x); });
      for (var j = 0; j < this.dir.length; j++) {
        if (this.dir[j] === b) {
          var bit = this.mode === 'lsb' ? (j >> (b.ld - 1)) & 1 : (j >> (this.gd - b.ld)) & 1;
          if (bit) this.dir[j] = nb;
        }
      }
      log.push('split B' + b.id + ' (local depth now ' + b.ld + ') into B' + b.id + ' {' + b.keys.join(', ') + '} and B' + nb.id + ' {' + nb.keys.join(', ') + '}; only the pointers to the split bucket change');
    }
    return { ok: false, log: log };
  };
  Extendible.prototype.remove = function (k) {
    var f = this.find(k);
    if (!f.found) return false;
    f.bucket.keys.splice(f.bucket.keys.indexOf(k), 1); return true;
  };
  Extendible.prototype.buckets = function () {
    var seen = [], out = [];
    this.dir.forEach(function (b) { if (seen.indexOf(b) < 0) { seen.push(b); out.push(b); } });
    return out.sort(function (a, b) { return a.id - b.id; });
  };

  /* ------------------------------------------------------------------ */
  /* Linear hashing                                                      */
  /* ------------------------------------------------------------------ */
  function LinearHash(n0, cap) { this.n0 = n0; this.cap = cap; this.level = 0; this.next = 0; this.b = []; for (var i = 0; i < n0; i++) this.b.push([]); }
  LinearHash.prototype.mod = function (lvl) { return this.n0 * Math.pow(2, lvl); };
  LinearHash.prototype.addr = function (k) {
    var a = k % this.mod(this.level);
    if (a < this.next) return { a: k % this.mod(this.level + 1), used: this.level + 1, first: a };
    return { a: a, used: this.level, first: a };
  };
  LinearHash.prototype.pages = function (i) { return Math.max(1, Math.ceil(this.b[i].length / this.cap)); };
  LinearHash.prototype.insert = function (k) {
    var log = [], ad = this.addr(k);
    if (this.b[ad.a].indexOf(k) >= 0) return { ok: false, log: [k + ' already present'] };
    var M = this.mod(this.level);
    log.push('insert ' + k + ': h' + this.level + '(' + k + ') = ' + k + ' mod ' + M + ' = ' + ad.first +
      (ad.used > this.level ? ' < split pointer ' + this.next + ' → use h' + ad.used + '(' + k + ') = ' + k + ' mod ' + (M * 2) + ' = ' + ad.a : '') + ' → bucket ' + ad.a);
    var before = this.pages(ad.a);
    this.b[ad.a].push(k);
    var overflow = this.b[ad.a].length > this.cap && this.pages(ad.a) > before;
    if (overflow) {
      log.push('bucket ' + ad.a + ' overflowed (new overflow page) → split the bucket at the split pointer (' + this.next + '), not necessarily the one that overflowed');
      log = log.concat(this.split());
    }
    return { ok: true, log: log, bucket: ad.a };
  };
  LinearHash.prototype.split = function () {
    var p = this.next, M2 = this.mod(this.level + 1), newIdx = p + this.mod(this.level);
    this.b.push([]);
    var keys = this.b[p]; this.b[p] = [];
    var self = this, moved = [];
    keys.forEach(function (x) { var t = x % M2; self.b[t].push(x); if (t !== p) moved.push(x); });
    var log = ['split bucket ' + p + ' with h' + (this.level + 1) + ' = k mod ' + M2 + ': ' + (moved.length ? 'moved {' + moved.join(', ') + '}' : 'nothing moved') + ' to new bucket ' + newIdx];
    this.next++;
    if (this.next === this.mod(this.level)) {
      log.push('split pointer reached the end of the round → drop h' + this.level + ', level becomes ' + (this.level + 1) + ', pointer back to 0');
      this.level++; this.next = 0;
    }
    return log;
  };
  LinearHash.prototype.find = function (k) { var ad = this.addr(k); return { bucket: ad.a, found: this.b[ad.a].indexOf(k) >= 0, used: ad.used }; };
  LinearHash.prototype.remove = function (k) {
    var f = this.find(k);
    if (!f.found) return false;
    var arr = this.b[f.bucket]; arr.splice(arr.indexOf(k), 1); return true;
  };

  DBP.logic.hashing = { LinearProbe: LinearProbe, Cuckoo: Cuckoo, Chained: Chained, Extendible: Extendible, LinearHash: LinearHash, bin: bin };

  /* ------------------------------------------------------------------ */
  /* Shared UI helpers                                                   */
  /* ------------------------------------------------------------------ */
  function keyControls(extra) {
    return '<div class="controls"><label>Key <input type="number" value="" data-key style="width:84px" placeholder="e.g. 17"></label>' +
      '<button class="btn primary" data-op="ins">Insert</button><button class="btn" data-op="find">Find</button><button class="btn" data-op="del">Delete</button>' +
      '<button class="btn" data-op="rand">Insert random</button><button class="btn" data-op="reset">Reset</button>' + (extra || '') + '</div>';
  }
  function logHTML(lines) { if (!lines.length) return ''; return '<div class="log">' + lines.map(function (l) { return '<div class="lg-' + (l.k || '') + '">' + esc(l.m) + '</div>'; }).join('') + '</div>'; }
  function readKey(body) {
    var v = body.querySelector('[data-key]').value;
    if (v === '' || isNaN(+v)) return null;
    return Math.abs(Math.floor(+v));
  }
  function bindKeyEnter(body) {
    var inp = body.querySelector('[data-key]');
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') body.querySelector('[data-op="ins"]').click(); });
  }

  /* ---------------- Linear probing widget ---------------- */
  DBP.sims.linearProbe = function (el) {
    var body = DBP.widget(el, 'Linear probe hashing', 'interactive');
    var T, lines, hl, mode = 'tombstone', autoResize = false, N = 8;
    function reset() { T = new LinearProbe(N); lines = []; hl = null; [10, 18, 5, 26].forEach(function (k) { T.insert(k); }); say('Started with keys 10, 18, 5, 26 in an 8-slot table. h(k) = k mod 8.', 'muted'); }
    function say(m, k) { lines.unshift({ m: m, k: k }); lines = lines.slice(0, 10); }
    function draw() {
      var lf = T.count() / T.n;
      var cells = T.slots.map(function (s, i) {
        var cls = 'cell' + (!s ? ' empty' : s.tomb ? ' tomb' : '');
        var pi = hl ? hl.path.indexOf(i) : -1;
        if (pi >= 0) cls += hl.ok && pi === hl.path.length - 1 ? ' good' : ' hl';
        return '<div class="' + cls + '"><div class="ci">' + i + '</div><div class="cv">' + (s ? (s.tomb ? '✝' + s.k : s.k) : '·') + '</div><div class="cx">' + (pi >= 0 ? 'probe ' + (pi + 1) : (s && !s.tomb ? 'h=' + T.h(s.k) : '&nbsp;')) + '</div></div>';
      }).join('');
      body.innerHTML = keyControls('<span class="sep"></span><label>Deletes <select data-mode><option value="tombstone"' + (mode === 'tombstone' ? ' selected' : '') + '>Tombstone</option><option value="movement"' + (mode === 'movement' ? ' selected' : '') + '>Movement</option></select></label><label><input type="checkbox" data-resize' + (autoResize ? ' checked' : '') + '> resize when load factor &gt; 0.75</label>') +
        '<div class="small muted" style="margin-bottom:8px">h(k) = k mod ' + T.n + '. The bottom line of a cell shows each key’s home slot, or the probe order of the last operation.</div>' +
        '<div class="cells">' + cells + '</div>' +
        '<div class="stats"><span>Keys <b>' + T.count() + '</b></span><span>Slots <b>' + T.n + '</b></span><span>Load factor <b>' + lf.toFixed(2) + '</b></span></div>' + logHTML(lines);
      bindKeyEnter(body);
    }
    body.addEventListener('change', function (e) {
      if (e.target.hasAttribute('data-mode')) mode = e.target.value;
      if (e.target.hasAttribute('data-resize')) autoResize = e.target.checked;
    });
    body.addEventListener('click', function (e) {
      var op = e.target.getAttribute && e.target.getAttribute('data-op');
      if (!op) return;
      var k = readKey(body);
      if (op === 'reset') { N = 8; reset(); draw(); return; }
      if (op === 'rand') k = Math.floor(Math.random() * 60);
      if (k === null) { say('Enter a non-negative integer key first.', 'bad'); draw(); return; }
      var r;
      if (op === 'ins' || op === 'rand') {
        r = T.insert(k); hl = { path: r.path, ok: r.ok }; say(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok && autoResize && T.count() / T.n > 0.75) { T.resize(); hl = null; say('load factor exceeded 0.75 → allocated a table twice as large (' + T.n + ' slots) and rehashed every key', 'info'); }
      } else if (op === 'find') {
        r = T.find(k); hl = { path: r.path, ok: r.found };
        say('find ' + k + ': ' + (r.found ? 'found in slot ' + r.idx + ' after ' + r.path.length + ' probe' + (r.path.length > 1 ? 's' : '') : 'NOT found — ' + r.why + ' after ' + r.path.length + ' probe' + (r.path.length > 1 ? 's' : '')), r.found ? 'good' : 'bad');
      } else if (op === 'del') {
        r = T.remove(k, mode); hl = { path: r.path, ok: false }; say(r.msg, r.ok ? 'info' : 'bad');
      }
      draw();
    });
    reset(); draw();
  };

  /* ---------------- Cuckoo widget ---------------- */
  DBP.sims.cuckoo = function (el) {
    var body = DBP.widget(el, 'Cuckoo hashing (two tables)', 'interactive');
    var C, lines, last;
    function reset() { C = new Cuckoo(5); lines = []; last = null; }
    function say(m, k) { lines.unshift({ m: m, k: k }); lines = lines.slice(0, 14); }
    function draw() {
      function row(t) {
        return '<div><div class="small muted" style="margin-bottom:4px">Table T' + (t + 1) + ' — h' + (t + 1) + '(k) = ' + (t === 0 ? 'k mod 5' : '⌊k / 5⌋ mod 5') + '</div><div class="cells">' + C.t[t].map(function (v, i) {
          var cls = 'cell' + (v === null ? ' empty' : '') + (last && last[0] === t && last[1] === i ? ' good' : '');
          return '<div class="' + cls + '"><div class="ci">' + i + '</div><div class="cv">' + (v === null ? '·' : v) + '</div></div>';
        }).join('') + '</div></div>';
      }
      body.innerHTML = keyControls() + '<div class="stack">' + row(0) + row(1) + '</div>' +
        '<div class="small muted" style="margin-top:8px">Try inserting 1, 6, 7, 32 — the last one kicks out three keys before everything settles. On a fresh table, try 3, 28, 53: all have h1 = 3 and h2 = 0, so three keys compete for two slots and the third insert loops forever.</div>' + logHTML(lines);
      bindKeyEnter(body);
    }
    body.addEventListener('click', function (e) {
      var op = e.target.getAttribute && e.target.getAttribute('data-op');
      if (!op) return;
      var k = readKey(body);
      if (op === 'reset') { reset(); draw(); return; }
      if (op === 'rand') k = Math.floor(Math.random() * 100);
      if (k === null) { say('Enter a non-negative integer key first.', 'bad'); draw(); return; }
      last = null;
      if (op === 'ins' || op === 'rand') {
        var r = C.insert(k);
        r.steps.slice().reverse().forEach(function (s, i) { say(s, i === 0 ? (r.ok ? 'good' : 'bad') : 'muted'); });
        if (r.ok) last = r.last;
      } else if (op === 'find') {
        var f = C.find(k);
        say('find ' + k + ': check T1[' + C.h(0, k) + '] and T2[' + C.h(1, k) + '] → ' + (f.found ? 'found in T' + (f.table + 1) : 'not found') + ' (always at most 2 slots: O(1))', f.found ? 'good' : 'bad');
        if (f.found) last = [f.table, f.idx];
      } else if (op === 'del') {
        say(C.remove(k) ? 'delete ' + k + ': removed (no tombstones needed — a key can only be in its two slots)' : k + ' not found', 'info');
      }
      draw();
    });
    reset(); draw();
  };

  /* ---------------- Chained widget ---------------- */
  DBP.sims.chained = function (el) {
    var body = DBP.widget(el, 'Chained hashing', 'interactive');
    var H, lines, hk;
    function reset() { H = new Chained(4, 2); lines = []; hk = null; [5, 9, 2, 13, 17].forEach(function (k) { H.insert(k); }); say('Started with 5, 9, 2, 13, 17. 4 slots, h(k) = k mod 4, each bucket page holds 2 keys.', 'muted'); }
    function say(m, k) { lines.unshift({ m: m, k: k }); lines = lines.slice(0, 8); }
    function draw() {
      var rows = H.b.map(function (chain, i) {
        return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><div class="cell" style="min-width:48px"><div class="ci">slot</div><div class="cv">' + i + '</div></div>' +
          chain.map(function (page, p) {
            return '<span class="muted">→</span><div class="cell' + (hk !== null && page.indexOf(hk) >= 0 ? ' good' : '') + '" style="min-width:90px"><div class="ci">bucket page ' + (p + 1) + '</div><div class="cv">' + (page.length ? page.join(', ') : '·') + '</div></div>';
          }).join('') + '</div>';
      }).join('');
      body.innerHTML = keyControls() + '<div class="scroll-x">' + rows + '</div>' + logHTML(lines);
      bindKeyEnter(body);
    }
    body.addEventListener('click', function (e) {
      var op = e.target.getAttribute && e.target.getAttribute('data-op');
      if (!op) return;
      var k = readKey(body);
      if (op === 'reset') { reset(); draw(); return; }
      if (op === 'rand') k = Math.floor(Math.random() * 40);
      if (k === null) { say('Enter a non-negative integer key first.', 'bad'); draw(); return; }
      hk = null;
      if (op === 'ins' || op === 'rand') { var len = H.insert(k); hk = k; say('insert ' + k + ' → slot ' + H.h(k) + ' (chain now ' + len + ' page' + (len > 1 ? 's' : '') + ')', 'good'); }
      else if (op === 'find') { var f = H.find(k); if (f.found) hk = k; say('find ' + k + ': scanned ' + f.scanned + ' key' + (f.scanned === 1 ? '' : 's') + ' in slot ' + H.h(k) + "'s chain → " + (f.found ? 'found' : 'not found'), f.found ? 'good' : 'bad'); }
      else if (op === 'del') say(H.remove(k) ? 'delete ' + k + ' from slot ' + H.h(k) : k + ' not found', 'info');
      draw();
    });
    reset(); draw();
  };

  /* ---------------- Extendible widget ---------------- */
  DBP.sims.extendible = function (el) {
    var body = DBP.widget(el, 'Extendible hashing', 'interactive');
    var E, lines, cap = 2, mode = 'lsb', hlBucket = null;
    function reset() { E = new Extendible(cap, mode); lines = []; hlBucket = null; }
    function say(m, k) { lines.unshift({ m: m, k: k }); lines = lines.slice(0, 14); }
    function draw() {
      var bks = E.buckets();
      var rowH = 34, dirN = E.dir.length, bN = bks.length;
      var H = Math.max(dirN, bN) * rowH + 30;
      var dirY = function (i) { return 30 + i * rowH + (Math.max(dirN, bN) - dirN) * rowH / 2; };
      var bY = function (j) { return 30 + j * rowH + (Math.max(dirN, bN) - bN) * rowH / 2; };
      var svg = '<svg viewBox="0 0 560 ' + (H + 10) + '" width="560" role="img" aria-label="Extendible hashing directory and buckets">' +
        '<text x="20" y="18" class="b">Directory (global depth ' + E.gd + ')</text><text x="300" y="18" class="b">Buckets (capacity ' + cap + ')</text>';
      E.dir.forEach(function (b, i) {
        var y = dirY(i), j = bks.indexOf(b), c = b.id % TINTS.length;
        svg += '<rect x="20" y="' + y + '" width="110" height="26" rx="4" style="fill:' + TINTS[c] + ';stroke:' + INKS[c] + '"/><text x="32" y="' + (y + 18) + '" class="m">' + (E.gd ? bin(i, E.gd) : '(any)') + '</text>' +
          '<path d="M130 ' + (y + 13) + ' C215 ' + (y + 13) + ' 215 ' + (bY(j) + 13) + ' 298 ' + (bY(j) + 13) + '" style="stroke:' + INKS[c] + ';fill:none;stroke-width:1.3"/>';
      });
      bks.forEach(function (b, j) {
        var y = bY(j), c = b.id % TINTS.length, isH = hlBucket === b;
        svg += '<rect x="300" y="' + y + '" width="240" height="26" rx="4" style="fill:' + TINTS[c] + ';stroke:' + INKS[c] + ';stroke-width:' + (isH ? 2.5 : 1.2) + '"/>' +
          '<text x="310" y="' + (y + 18) + '" class="m b">B' + b.id + '</text><text x="342" y="' + (y + 18) + '" class="s">ld=' + b.ld + '</text>' +
          '<text x="388" y="' + (y + 18) + '" class="m">' + (b.keys.length ? b.keys.join(', ') : '·') + '</text>';
      });
      svg += '</svg>';
      var keysTable = bks.reduce(function (a, b) { return a.concat(b.keys); }, []).sort(function (a, b) { return a - b; });
      body.innerHTML = keyControls('<span class="sep"></span><label>Bucket size <select data-cap>' + [1, 2, 3, 4].map(function (c) { return '<option' + (c === cap ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
        '<label>Use <select data-hmode><option value="lsb"' + (mode === 'lsb' ? ' selected' : '') + '>last (low) bits</option><option value="msb"' + (mode === 'msb' ? ' selected' : '') + '>first (high) bits</option></select></label>') +
        '<div class="small muted" style="margin-bottom:6px">For simplicity, hash(k) = k as an 8-bit binary number (keys 0–255). The directory looks at the ' + (mode === 'lsb' ? 'last' : 'first') + ' <i>global depth</i> bits (max ' + MAX_GD + '). ' + (mode === 'msb' ? 'With first bits, small keys all start with 000…, so spread your keys over 0–255 (e.g. 200, 37, 140, 90). ' : '') + 'Changing these options resets the table.</div>' +
        '<figure class="diagram" style="margin:8px 0">' + svg + '</figure>' +
        (keysTable.length ? '<div class="small muted mono">' + keysTable.map(function (k) { return k + '=' + bin(E.hash(k), 8); }).join('  ') + '</div>' : '') + logHTML(lines);
      bindKeyEnter(body);
    }
    body.addEventListener('change', function (e) {
      if (e.target.hasAttribute('data-cap')) { cap = +e.target.value; reset(); draw(); }
      if (e.target.hasAttribute('data-hmode')) { mode = e.target.value; reset(); draw(); }
    });
    body.addEventListener('click', function (e) {
      var op = e.target.getAttribute && e.target.getAttribute('data-op');
      if (!op) return;
      var k = readKey(body);
      if (op === 'reset') { reset(); draw(); return; }
      if (op === 'rand') k = Math.floor(Math.random() * 256);
      if (k === null || k > 255) { say('Enter an integer key between 0 and 255.', 'bad'); draw(); return; }
      hlBucket = null;
      if (op === 'ins' || op === 'rand') { var r = E.insert(k); r.log.slice().reverse().forEach(function (l, i) { say(l, i === 0 ? (r.ok ? 'good' : 'bad') : 'info'); }); hlBucket = E.find(k).bucket; }
      else if (op === 'find') { var f = E.find(k); hlBucket = f.bucket; say('find ' + k + ' (' + bin(E.hash(k), 8) + '): directory[' + (E.gd ? bin(f.idx, E.gd) : '–') + '] → B' + f.bucket.id + ' → ' + (f.found ? 'found' : 'not found'), f.found ? 'good' : 'bad'); }
      else if (op === 'del') say(E.remove(k) ? 'delete ' + k + ' (buckets are not merged in this simulator)' : k + ' not found', 'info');
      draw();
    });
    reset(); draw();
  };

  /* ---------------- Linear hashing widget ---------------- */
  DBP.sims.linearHash = function (el) {
    var body = DBP.widget(el, 'Linear hashing', 'interactive');
    var L, lines, hb = null;
    function reset() { L = new LinearHash(4, 2); lines = []; hb = null; [8, 20, 9, 13, 6, 7, 11].forEach(function (k) { L.insert(k); }); lines = []; say('Started with 8, 20, 9, 13, 6, 7, 11. 4 buckets, each page holds 2 keys. h0(k) = k mod 4.', 'muted'); }
    function say(m, k) { lines.unshift({ m: m, k: k }); lines = lines.slice(0, 14); }
    function draw() {
      var M = L.mod(L.level);
      var rows = L.b.map(function (keys, i) {
        var pages = [];
        for (var p = 0; p < Math.max(1, Math.ceil(keys.length / L.cap)); p++) pages.push(keys.slice(p * L.cap, (p + 1) * L.cap));
        var isPtr = i === L.next;
        return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">' +
          '<div style="width:86px;font-size:12.5px;text-align:right;color:' + (isPtr ? 'var(--warn)' : 'var(--muted)') + ';font-weight:' + (isPtr ? 650 : 400) + '">' + (isPtr ? 'split ptr ▶' : (i < L.next ? 'split · h' + (L.level + 1) : (i >= M ? 'new · h' + (L.level + 1) : 'h' + L.level))) + '</div>' +
          '<div class="cell" style="min-width:48px' + (hb === i ? ';border-color:var(--accent)' : '') + '"><div class="ci">bucket</div><div class="cv">' + i + '</div></div>' +
          pages.map(function (pg, p) {
            return (p ? '<span class="muted">→</span>' : '') + '<div class="cell' + (p ? ' bad' : '') + '" style="min-width:80px"><div class="ci">' + (p ? 'overflow' : 'page') + '</div><div class="cv">' + (pg.length ? pg.join(', ') : '·') + '</div></div>';
          }).join('') + '</div>';
      }).join('');
      body.innerHTML = keyControls() +
        '<div class="stats" style="margin:0 0 10px"><span>Level <b>' + L.level + '</b></span><span>h' + L.level + '(k) = <b>k mod ' + M + '</b></span><span>h' + (L.level + 1) + '(k) = <b>k mod ' + (2 * M) + '</b></span><span>Split pointer <b>' + L.next + '</b></span></div>' +
        '<div class="scroll-x">' + rows + '</div>' +
        '<div class="small muted">Lookup rule: compute h' + L.level + '(k); if the result is less than the split pointer, that bucket has already been split in this round, so use h' + (L.level + 1) + '(k) instead.</div>' + logHTML(lines);
      bindKeyEnter(body);
    }
    body.addEventListener('click', function (e) {
      var op = e.target.getAttribute && e.target.getAttribute('data-op');
      if (!op) return;
      var k = readKey(body);
      if (op === 'reset') { reset(); draw(); return; }
      if (op === 'rand') k = Math.floor(Math.random() * 60);
      if (k === null) { say('Enter a non-negative integer key first.', 'bad'); draw(); return; }
      hb = null;
      if (op === 'ins' || op === 'rand') { var r = L.insert(k); r.log.slice().reverse().forEach(function (l, i, arr) { say(l, i === arr.length - 1 ? 'good' : 'info'); }); hb = r.bucket; }
      else if (op === 'find') { var f = L.find(k); hb = f.bucket; say('find ' + k + ': bucket ' + f.bucket + ' (via h' + f.used + ') → ' + (f.found ? 'found' : 'not found'), f.found ? 'good' : 'bad'); }
      else if (op === 'del') say(L.remove(k) ? 'delete ' + k : k + ' not found', 'info');
      draw();
    });
    reset(); draw();
  };
})();
