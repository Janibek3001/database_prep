/* Count-min sketch (Homework 1) and Bloom filter simulators. */
(function () {
  'use strict';
  var DBP = window.DBP;
  var esc = function (s) { return DBP.esc(s); };

  // FNV-1a with a per-row seed: deterministic, fast, good enough for a demo.
  function hash(str, seed) {
    var h = (2166136261 ^ Math.imul(seed + 1, 0x9e3779b1)) >>> 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13;
    return h >>> 0;
  }

  // The fixed mapping from the Homework 1 handout (w = 4, d = 3).
  var HW_MAP = { orders: [2, 0, 3], users: [2, 1, 1], items: [1, 0, 2], carts: [2, 1, 3] };

  function Sketch(w, d, fixed) {
    if (!w || !d) throw new Error('std::invalid_argument: width and depth must be > 0');
    this.w = w; this.d = d; this.fixed = fixed || null;
    this.m = []; for (var i = 0; i < d; i++) { var r = []; for (var j = 0; j < w; j++) r.push(0); this.m.push(r); }
    this.truth = {};
  }
  Sketch.prototype.col = function (x, row) {
    if (this.fixed) { var f = this.fixed[x]; return f ? f[row] : hash(x, row) % this.w; }
    return hash(x, row) % this.w;
  };
  Sketch.prototype.cols = function (x) { var out = []; for (var i = 0; i < this.d; i++) out.push(this.col(x, i)); return out; };
  Sketch.prototype.insert = function (x) {
    var c = this.cols(x);
    for (var i = 0; i < this.d; i++) this.m[i][c[i]]++;
    this.truth[x] = (this.truth[x] || 0) + 1;
    return c;
  };
  Sketch.prototype.count = function (x) {
    var c = this.cols(x), self = this, vals = c.map(function (cc, i) { return self.m[i][cc]; });
    return { cols: c, vals: vals, est: Math.min.apply(null, vals) };
  };
  Sketch.prototype.clear = function () { this.m = this.m.map(function (r) { return r.map(function () { return 0; }); }); this.truth = {}; };
  Sketch.prototype.merge = function (o) {
    if (o.w !== this.w || o.d !== this.d) throw new Error('std::invalid_argument: dimension mismatch');
    for (var i = 0; i < this.d; i++) for (var j = 0; j < this.w; j++) this.m[i][j] += o.m[i][j];
    for (var k in o.truth) this.truth[k] = (this.truth[k] || 0) + o.truth[k];
  };
  Sketch.prototype.topK = function (k, cands) {
    var self = this;
    return cands.map(function (c) { return [c, self.count(c).est]; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, Math.min(k, cands.length));
  };
  DBP.logic.CountMin = Sketch;
  DBP.logic.cmsHash = hash;

  DBP.sims.countMin = function (el, opts) {
    var body = DBP.widget(el, 'Count-min sketch', 'interactive');
    var mode = opts.mode || 'hw', S, w = 8, d = 3, hlCols = null, hlKind = '', lines = [], result = '';
    function say(m, k) { lines.unshift({ m: m, k: k }); lines = lines.slice(0, 10); }
    function reset() {
      lines = []; result = ''; hlCols = null;
      if (mode === 'hw') {
        S = new Sketch(4, 3, HW_MAP);
        say('Homework example: w = 4, d = 3, using the handout’s hash table. Stream it with the button below.', 'muted');
      } else {
        S = new Sketch(w, d);
        say('Custom sketch: w = ' + w + ', d = ' + d + ' (FNV-1a hash, one seed per row).', 'muted');
      }
    }
    function draw() {
      var tbl = '<table class="rel" style="min-width:0"><thead><tr><th></th>' + S.m[0].map(function (_, j) { return '<th>' + j + '</th>'; }).join('') + '</tr></thead><tbody>' +
        S.m.map(function (r, i) {
          return '<tr><th>row ' + i + '</th>' + r.map(function (v, j) {
            var cls = '';
            if (hlCols && hlCols[i] === j) {
              cls = hlKind === 'count' ? (v === Math.min.apply(null, hlCols.map(function (c, ii) { return S.m[ii][c]; })) ? 'good' : 'hl') : 'hl';
            }
            return '<td class="' + cls + '" style="text-align:center;min-width:34px">' + v + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
      var truthRows = Object.keys(S.truth).map(function (k) {
        var e = S.count(k).est;
        return '<tr><td>' + esc(k) + '</td><td>' + S.truth[k] + '</td><td>' + e + '</td><td>' + (e === S.truth[k] ? '<span class="pill good">exact</span>' : '<span class="pill bad">+' + (e - S.truth[k]) + '</span>') + '</td></tr>';
      }).join('');
      body.innerHTML =
        '<div class="controls"><b class="small">Mode:</b><button class="btn sm' + (mode === 'hw' ? ' on' : '') + '" data-mode="hw">Homework example</button><button class="btn sm' + (mode === 'custom' ? ' on' : '') + '" data-mode="custom">Custom</button>' +
        (mode === 'custom' ? '<span class="sep"></span><label>width w <input type="number" min="1" max="16" value="' + w + '" data-w></label><label>depth d <input type="number" min="1" max="6" value="' + d + '" data-d></label><button class="btn sm" data-new>Apply</button>' : '') + '</div>' +
        '<div class="controls"><label>Item <input type="text" class="mono" data-item style="width:120px" value="' + (mode === 'hw' ? 'orders' : 'select') + '"></label>' +
        '<button class="btn primary" data-act="ins">Insert</button><button class="btn" data-act="count">Count</button><button class="btn" data-act="clear">Clear</button>' +
        (mode === 'hw' ? '<span class="sep"></span><button class="btn" data-act="stream">Insert the handout stream</button>' : '<span class="sep"></span><button class="btn" data-act="stream2">Insert 9×select, 5×insert, 1×delete</button><button class="btn" data-act="topk">TopK(2, {delete, insert, select})</button>') + '</div>' +
        '<div class="flex" style="gap:24px;align-items:flex-start"><div>' + tbl + '<div class="small muted" style="margin-top:6px">' + (mode === 'hw' ? 'Columns for each item (h0, h1, h2): orders (2,0,3) · users (2,1,1) · items (1,0,2) · carts (2,1,3)' : 'Each row has its own hash function h<sub>i</sub>(x) ∈ [0, w).') + '</div></div>' +
        '<div style="flex:1;min-width:220px">' + (result ? '<div class="status info" style="margin-top:0">' + result + '</div>' : '') +
        (truthRows ? '<table style="margin-top:8px"><thead><tr><th>item</th><th>true</th><th>Count()</th><th></th></tr></thead><tbody>' + truthRows + '</tbody></table>' : '') + '</div></div>' +
        '<div class="log">' + lines.map(function (l) { return '<div class="lg-' + (l.k || '') + '">' + esc(l.m) + '</div>'; }).join('') + '</div>';
    }
    body.addEventListener('click', function (e) {
      var t = e.target;
      var item = (body.querySelector('[data-item]') || {}).value;
      item = (item || '').trim();
      if (t.hasAttribute('data-mode')) { mode = t.getAttribute('data-mode'); reset(); draw(); return; }
      if (t.hasAttribute('data-new')) {
        w = Math.max(1, Math.min(16, +body.querySelector('[data-w]').value || 8));
        d = Math.max(1, Math.min(6, +body.querySelector('[data-d]').value || 3));
        reset(); draw(); return;
      }
      var act = t.getAttribute('data-act');
      if (!act) return;
      result = '';
      if ((act === 'ins' || act === 'count') && !item) { say('Type an item first.', 'bad'); draw(); return; }
      if (act === 'ins') {
        var c = S.insert(item); hlCols = c; hlKind = 'ins';
        say('Insert("' + item + '"): +1 at ' + c.map(function (cc, i) { return '(row ' + i + ', col ' + cc + ')'; }).join(', '), 'good');
      } else if (act === 'count') {
        var r = S.count(item); hlCols = r.cols; hlKind = 'count';
        var tr = S.truth[item] || 0;
        result = 'Count("' + esc(item) + '") reads ' + r.vals.join(', ') + ' → min = <b>' + r.est + '</b>. True count: ' + tr + (r.est > tr ? ' — an <b>over</b>estimate caused by collisions (never an underestimate).' : ' — exact.');
        say('Count("' + item + '") = min(' + r.vals.join(', ') + ') = ' + r.est, 'info');
      } else if (act === 'clear') { S.clear(); hlCols = null; say('Clear(): every counter reset to 0; the sketch is still usable.', 'muted'); }
      else if (act === 'stream') {
        ['orders', 'users', 'orders', 'items', 'orders', 'users'].forEach(function (x) { S.insert(x); });
        hlCols = null; say('Inserted ["orders", "users", "orders", "items", "orders", "users"]. Now try Count("carts").', 'good');
      } else if (act === 'stream2') {
        for (var i = 0; i < 9; i++) S.insert('select');
        for (i = 0; i < 5; i++) S.insert('insert');
        S.insert('delete');
        hlCols = null; say('Inserted "select" ×9, "insert" ×5, "delete" ×1.', 'good');
      } else if (act === 'topk') {
        var top = S.topK(2, ['delete', 'insert', 'select']);
        result = 'TopK(2, {delete, insert, select}) = [' + top.map(function (p) { return '("' + esc(p[0]) + '", ' + p[1] + ')'; }).join(', ') + ']. The sketch cannot list its items — TopK estimates each <i>candidate</i> and keeps the k largest.';
      }
      draw();
    });
    reset(); draw();
  };

  /* ---------------- Bloom filter ---------------- */
  DBP.sims.bloom = function (el) {
    var body = DBP.widget(el, 'Bloom filter', 'interactive');
    var M = 16, K = 3, bits, inserted, lines, hl, hlOk;
    function reset() { bits = new Array(M).fill(0); inserted = []; lines = []; hl = null; }
    function pos(x) { var out = []; for (var i = 0; i < K; i++) out.push(hash(x, 100 + i) % M); return out; }
    function say(m, k) { lines.unshift({ m: m, k: k }); lines = lines.slice(0, 10); }
    function draw() {
      var n = inserted.length;
      var fp = Math.pow(1 - Math.exp(-K * n / M), K);
      body.innerHTML =
        '<div class="controls"><label>m bits <input type="number" min="4" max="32" value="' + M + '" data-m></label><label>k hashes <input type="number" min="1" max="6" value="' + K + '" data-k></label><button class="btn sm" data-new>Apply</button></div>' +
        '<div class="controls"><label>Key <input type="text" class="mono" data-x style="width:120px" value="RZA"></label><button class="btn primary" data-act="ins">Insert</button><button class="btn" data-act="q">Lookup</button><button class="btn" data-act="reset">Reset</button></div>' +
        '<div class="cells">' + bits.map(function (b, i) {
          var cls = 'cell' + (hl && hl.indexOf(i) >= 0 ? (hlOk ? ' good' : (b ? ' hl' : ' bad')) : '');
          return '<div class="' + cls + '" style="min-width:34px"><div class="ci">' + i + '</div><div class="cv">' + b + '</div></div>';
        }).join('') + '</div>' +
        '<div class="stats"><span>Inserted <b>' + n + '</b>: ' + esc(inserted.join(', ') || '–') + '</span><span>False-positive rate ≈ (1 − e<sup>−kn/m</sup>)<sup>k</sup> = <b>' + (100 * fp).toFixed(1) + '%</b></span></div>' +
        '<div class="log">' + lines.map(function (l) { return '<div class="lg-' + (l.k || '') + '">' + esc(l.m) + '</div>'; }).join('') + '</div>';
    }
    body.addEventListener('click', function (e) {
      var t = e.target, act = t.getAttribute('data-act');
      if (t.hasAttribute('data-new')) { M = Math.max(4, Math.min(32, +body.querySelector('[data-m]').value || 16)); K = Math.max(1, Math.min(6, +body.querySelector('[data-k]').value || 3)); reset(); draw(); return; }
      if (!act) return;
      var x = body.querySelector('[data-x]').value.trim();
      if (act === 'reset') { reset(); draw(); return; }
      if (!x) return;
      var p = pos(x);
      if (act === 'ins') {
        p.forEach(function (i) { bits[i] = 1; });
        if (inserted.indexOf(x) < 0) inserted.push(x);
        hl = p; hlOk = true;
        say('Insert("' + x + '"): set bits ' + p.join(', '), 'good');
      } else {
        var all = p.every(function (i) { return bits[i]; });
        hl = p; hlOk = all;
        var really = inserted.indexOf(x) >= 0;
        say('Lookup("' + x + '"): bits ' + p.join(', ') + ' → ' + (all ? (really ? 'MAYBE present (it was inserted)' : 'MAYBE present — a FALSE POSITIVE, it was never inserted!') : 'DEFINITELY NOT present (a bit is 0)'), all ? (really ? 'good' : 'bad') : 'info');
      }
      draw();
    });
    reset(); draw();
  };
})();
