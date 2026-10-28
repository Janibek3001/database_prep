/* B+Tree simulator: insert (split, copy-up / push-up), delete (borrow / merge),
   point search and range scan, drawn as SVG. Order m = max children per node. */
(function () {
  'use strict';
  var DBP = window.DBP;
  var esc = function (s) { return DBP.esc(s); };

  var nid = 0;
  function Leaf(keys) { return { id: ++nid, leaf: true, keys: keys || [], next: null }; }
  function Inner(keys, children) { return { id: ++nid, leaf: false, keys: keys || [], children: children || [] }; }

  function BPTree(m) {
    this.m = m;
    this.maxKeys = m - 1;
    this.minLeaf = Math.ceil((m - 1) / 2);
    this.minInnerKeys = Math.ceil(m / 2) - 1;
    this.root = Leaf();
  }

  BPTree.prototype.findPath = function (k) {
    var path = [], n = this.root;
    while (!n.leaf) {
      var i = 0;
      while (i < n.keys.length && k >= n.keys[i]) i++;
      path.push({ node: n, idx: i });
      n = n.children[i];
    }
    path.push({ node: n, idx: -1 });
    return path;
  };

  BPTree.prototype.search = function (k) {
    var path = this.findPath(k);
    var leaf = path[path.length - 1].node;
    return { found: leaf.keys.indexOf(k) >= 0, path: path.map(function (p) { return p.node.id; }), leaf: leaf };
  };

  BPTree.prototype.range = function (lo, hi) {
    var path = this.findPath(lo), leaf = path[path.length - 1].node, visited = [], out = [];
    while (leaf) {
      visited.push(leaf.id);
      var stop = false;
      for (var i = 0; i < leaf.keys.length; i++) {
        if (leaf.keys[i] > hi) { stop = true; break; }
        if (leaf.keys[i] >= lo) out.push(leaf.keys[i]);
      }
      if (stop) break;
      leaf = leaf.next;
    }
    return { keys: out, path: path.map(function (p) { return p.node.id; }), leaves: visited };
  };

  BPTree.prototype.insert = function (k) {
    var log = [];
    var path = this.findPath(k);
    var leaf = path[path.length - 1].node;
    if (leaf.keys.indexOf(k) >= 0) return { ok: false, log: [k + ' is already in the tree (this simulator uses unique keys)'], touched: [leaf.id] };
    var pos = 0;
    while (pos < leaf.keys.length && leaf.keys[pos] < k) pos++;
    leaf.keys.splice(pos, 0, k);
    var touched = [leaf.id];
    log.push('find leaf → insert ' + k + ' in sorted order: [' + leaf.keys.join(', ') + ']');
    if (leaf.keys.length <= this.maxKeys) { log.push('leaf has room (≤ ' + this.maxKeys + ' keys) → done'); return { ok: true, log: log, touched: touched }; }

    // split leaf: left keeps ceil(n/2), copy up the first key of the right node
    var cut = Math.ceil(leaf.keys.length / 2);
    var right = Leaf(leaf.keys.slice(cut));
    leaf.keys = leaf.keys.slice(0, cut);
    right.next = leaf.next; leaf.next = right;
    var up = right.keys[0];
    touched.push(right.id);
    log.push('leaf overflow → split into [' + leaf.keys.join(', ') + '] and [' + right.keys.join(', ') + '], COPY UP ' + up + ' (it stays in the leaf)');
    var newChild = right, level = path.length - 2;

    while (true) {
      if (level < 0) {
        var oldRoot = this.root;
        this.root = Inner([up], [oldRoot, newChild]);
        touched.push(this.root.id);
        log.push('no parent → create a new root [' + up + ']; the tree grows one level taller');
        break;
      }
      var parent = path[level].node, ci = path[level].idx;
      parent.keys.splice(ci, 0, up);
      parent.children.splice(ci + 1, 0, newChild);
      touched.push(parent.id);
      if (parent.keys.length <= this.maxKeys) { log.push('insert ' + up + ' into parent → [' + parent.keys.join(', ') + ']'); break; }
      // split inner: push up the middle key
      var leftKeys = Math.ceil((this.m + 1) / 2) - 1;
      var pushed = parent.keys[leftKeys];
      var sib = Inner(parent.keys.slice(leftKeys + 1), parent.children.slice(leftKeys + 1));
      parent.keys = parent.keys.slice(0, leftKeys);
      parent.children = parent.children.slice(0, leftKeys + 1);
      touched.push(sib.id);
      log.push('inner node overflow → split into [' + parent.keys.join(', ') + '] and [' + sib.keys.join(', ') + '], PUSH UP ' + pushed + ' (it moves up, not copied)');
      up = pushed; newChild = sib; level--;
    }
    return { ok: true, log: log, touched: touched };
  };

  BPTree.prototype.remove = function (k) {
    var log = [];
    var path = this.findPath(k);
    var leaf = path[path.length - 1].node;
    var at = leaf.keys.indexOf(k);
    if (at < 0) return { ok: false, log: [k + ' is not in the tree'], touched: [] };
    leaf.keys.splice(at, 1);
    var touched = [leaf.id];
    log.push('find leaf → remove ' + k + ': [' + leaf.keys.join(', ') + ']');
    this.fix(path, path.length - 1, log, touched);
    this.refreshSeparators(this.root);
    return { ok: true, log: log, touched: touched };
  };

  BPTree.prototype.fix = function (path, level, log, touched) {
    var node = path[level].node;
    if (level === 0) {
      if (!node.leaf && node.keys.length === 0) {
        this.root = node.children[0];
        log.push('root has no keys left → its only child becomes the new root; the tree shrinks one level');
      }
      return;
    }
    var min = node.leaf ? this.minLeaf : this.minInnerKeys;
    if (node.keys.length >= min) { log.push((node.leaf ? 'leaf' : 'inner node') + ' still has ≥ ' + min + ' key' + (min === 1 ? '' : 's') + ' → done'); return; }
    var parent = path[level - 1].node, idx = path[level - 1].idx;
    var left = idx > 0 ? parent.children[idx - 1] : null;
    var right = idx < parent.children.length - 1 ? parent.children[idx + 1] : null;
    touched.push(parent.id);
    log.push((node.leaf ? 'leaf' : 'inner node') + ' underflow (' + node.keys.length + ' < ' + min + ' keys)');

    if (node.leaf) {
      if (left && left.keys.length > this.minLeaf) {
        var b = left.keys.pop(); node.keys.unshift(b);
        touched.push(left.id);
        log.push('borrow ' + b + ' from the left sibling; update the separator in the parent');
        return;
      }
      if (right && right.keys.length > this.minLeaf) {
        var b2 = right.keys.shift(); node.keys.push(b2);
        touched.push(right.id);
        log.push('borrow ' + b2 + ' from the right sibling; update the separator in the parent');
        return;
      }
      if (left) {
        left.keys = left.keys.concat(node.keys); left.next = node.next;
        parent.keys.splice(idx - 1, 1); parent.children.splice(idx, 1);
        touched.push(left.id);
        log.push('siblings are at minimum → MERGE with the left sibling: [' + left.keys.join(', ') + ']; delete the separator from the parent');
      } else {
        node.keys = node.keys.concat(right.keys); node.next = right.next;
        parent.keys.splice(idx, 1); parent.children.splice(idx + 1, 1);
        log.push('siblings are at minimum → MERGE with the right sibling: [' + node.keys.join(', ') + ']; delete the separator from the parent');
      }
    } else {
      if (left && left.keys.length > this.minInnerKeys) {
        node.keys.unshift(parent.keys[idx - 1]); node.children.unshift(left.children.pop());
        parent.keys[idx - 1] = left.keys.pop();
        touched.push(left.id);
        log.push('inner node borrows through the parent from its left sibling (rotate right)');
        return;
      }
      if (right && right.keys.length > this.minInnerKeys) {
        node.keys.push(parent.keys[idx]); node.children.push(right.children.shift());
        parent.keys[idx] = right.keys.shift();
        touched.push(right.id);
        log.push('inner node borrows through the parent from its right sibling (rotate left)');
        return;
      }
      if (left) {
        var sepL = parent.keys[idx - 1];
        left.keys = left.keys.concat([sepL], node.keys); left.children = left.children.concat(node.children);
        parent.keys.splice(idx - 1, 1); parent.children.splice(idx, 1);
        touched.push(left.id);
        log.push('MERGE inner node with its left sibling, pulling separator ' + sepL + ' down from the parent');
      } else {
        var sepR = parent.keys[idx];
        node.keys = node.keys.concat([sepR], right.keys); node.children = node.children.concat(right.children);
        parent.keys.splice(idx, 1); parent.children.splice(idx + 1, 1);
        log.push('MERGE inner node with its right sibling, pulling separator ' + sepR + ' down from the parent');
      }
    }
    this.fix(path, level - 1, log, touched);
  };

  function minKey(n) { while (!n.leaf) n = n.children[0]; return n.keys[0]; }
  BPTree.prototype.refreshSeparators = function (n) {
    if (n.leaf) return;
    for (var i = 0; i < n.keys.length; i++) {
      var mk = minKey(n.children[i + 1]);
      if (mk !== undefined) n.keys[i] = mk;
    }
    var self = this;
    n.children.forEach(function (c) { self.refreshSeparators(c); });
  };

  BPTree.prototype.height = function () { var h = 1, n = this.root; while (!n.leaf) { h++; n = n.children[0]; } return h; };
  BPTree.prototype.allKeys = function () { var n = this.root; while (!n.leaf) n = n.children[0]; var out = []; while (n) { out = out.concat(n.keys); n = n.next; } return out; };

  // Deep copy, used for undo.
  BPTree.prototype.clone = function () {
    var t = new BPTree(this.m), leaves = [];
    function cp(n) {
      if (n.leaf) { var l = { id: n.id, leaf: true, keys: n.keys.slice(), next: null }; leaves.push(l); return l; }
      return { id: n.id, leaf: false, keys: n.keys.slice(), children: n.children.map(cp) };
    }
    t.root = cp(this.root);
    for (var i = 0; i < leaves.length - 1; i++) leaves[i].next = leaves[i + 1];
    return t;
  };

  // Structural check (used by tests).
  BPTree.prototype.check = function () {
    var self = this, errs = [], leafDepth = -1;
    function walk(n, d, lo, hi, isRoot) {
      n.keys.forEach(function (k, i) {
        if (i && n.keys[i - 1] >= k) errs.push('unsorted node ' + n.id);
        if (lo !== null && k < lo) errs.push('key ' + k + ' < bound ' + lo);
        if (hi !== null && k >= hi) errs.push('key ' + k + ' >= bound ' + hi);
      });
      if (n.keys.length > self.maxKeys) errs.push('overfull ' + n.id);
      if (!isRoot) {
        var mn = n.leaf ? self.minLeaf : self.minInnerKeys;
        if (n.keys.length < mn) errs.push('underfull ' + n.id + ' (' + n.keys.length + ')');
      }
      if (n.leaf) { if (leafDepth < 0) leafDepth = d; else if (leafDepth !== d) errs.push('unbalanced'); return; }
      if (n.children.length !== n.keys.length + 1) errs.push('child count ' + n.id);
      n.children.forEach(function (c, i) { walk(c, d + 1, i ? n.keys[i - 1] : lo, i < n.keys.length ? n.keys[i] : hi, false); });
    }
    walk(this.root, 0, null, null, true);
    var ks = this.allKeys();
    for (var i = 1; i < ks.length; i++) if (ks[i - 1] >= ks[i]) errs.push('leaf chain unsorted');
    return errs;
  };

  DBP.logic.BPTree = BPTree;

  /* ---------------- rendering ---------------- */

  function layout(tree) {
    var CW = 30, NH = 28, VG = 64, HG = 16;
    var nodeW = tree.maxKeys * CW;
    var levels = [], pos = {};
    (function collect(n, d) { (levels[d] = levels[d] || []).push(n); if (!n.leaf) n.children.forEach(function (c) { collect(c, d + 1); }); })(tree.root, 0);
    var depth = levels.length - 1, x = 10;
    levels[depth].forEach(function (n) { pos[n.id] = { x: x, y: 10 + depth * (NH + VG) }; x += nodeW + HG; });
    for (var d = depth - 1; d >= 0; d--) {
      levels[d].forEach(function (n) {
        var first = pos[n.children[0].id], last = pos[n.children[n.children.length - 1].id];
        pos[n.id] = { x: (first.x + last.x) / 2, y: 10 + d * (NH + VG) };
      });
    }
    return { pos: pos, levels: levels, W: Math.max(x - HG + 10, nodeW + 20), H: 10 + (depth + 1) * (NH + VG) - VG + 12, CW: CW, NH: NH, nodeW: nodeW };
  }

  function render(tree, hl) {
    hl = hl || {};
    var L = layout(tree), pos = L.pos, svg = '';
    var mk = 'bpa' + Math.floor(Math.random() * 1e6);
    svg += '<defs><marker id="' + mk + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker></defs>';
    // edges
    L.levels.forEach(function (lvl) {
      lvl.forEach(function (n) {
        if (n.leaf) return;
        var p = pos[n.id];
        n.children.forEach(function (c, i) {
          var cp = pos[c.id];
          var onPath = hl.path && hl.path.indexOf(n.id) >= 0 && hl.path.indexOf(c.id) >= 0;
          svg += '<path d="M' + (p.x + i * L.CW) + ' ' + (p.y + L.NH) + ' L' + (cp.x + L.nodeW / 2) + ' ' + (cp.y - 2) + '" class="' + (onPath ? 'lna' : 'ln') + '"/>';
        });
      });
    });
    // leaf sibling pointers
    var leaves = L.levels[L.levels.length - 1];
    for (var i = 0; i < leaves.length - 1; i++) {
      var a = pos[leaves[i].id], b = pos[leaves[i + 1].id];
      svg += '<path d="M' + (a.x + L.nodeW) + ' ' + (a.y + L.NH / 2) + ' L' + (b.x - 1) + ' ' + (b.y + L.NH / 2) + '" class="lnd" marker-end="url(#' + mk + ')"/>';
    }
    // nodes
    L.levels.forEach(function (lvl) {
      lvl.forEach(function (n) {
        var p = pos[n.id];
        var cls = n.leaf ? 'bxg' : 'bxa';
        var onPath = hl.path && hl.path.indexOf(n.id) >= 0;
        var touched = hl.touched && hl.touched.indexOf(n.id) >= 0;
        var scanned = hl.leaves && hl.leaves.indexOf(n.id) >= 0;
        if (touched) cls = 'bxw';
        svg += '<rect x="' + p.x + '" y="' + p.y + '" width="' + L.nodeW + '" height="' + L.NH + '" rx="3" class="' + cls + '"' + (onPath || scanned ? ' style="stroke-width:2.6"' : '') + '/>';
        for (var j = 0; j < tree.maxKeys; j++) {
          if (j) svg += '<line x1="' + (p.x + j * L.CW) + '" y1="' + p.y + '" x2="' + (p.x + j * L.CW) + '" y2="' + (p.y + L.NH) + '" class="ln" style="stroke-width:.8;opacity:.6"/>';
          var key = n.keys[j];
          if (key !== undefined) {
            var hit = (hl.found !== undefined && n.leaf && key === hl.found) || (hl.inRange && n.leaf && hl.inRange.indexOf(key) >= 0);
            if (hit) svg += '<rect x="' + (p.x + j * L.CW + 2) + '" y="' + (p.y + 2) + '" width="' + (L.CW - 4) + '" height="' + (L.NH - 4) + '" rx="2" style="fill:var(--accent);opacity:.25"/>';
            svg += '<text x="' + (p.x + j * L.CW + L.CW / 2) + '" y="' + (p.y + 19) + '" text-anchor="middle" class="m' + (hit ? ' b' : '') + '">' + key + '</text>';
          }
        }
      });
    });
    return '<svg viewBox="0 0 ' + L.W + ' ' + L.H + '" width="' + L.W + '" height="' + L.H + '" style="max-width:none" role="img" aria-label="B+Tree">' + svg + '</svg>';
  }

  DBP.sims.bplustree = function (el, opts) {
    var body = DBP.widget(el, 'B+Tree simulator', 'interactive');
    var m = opts.m || 4, tree, hl = {}, lines = [], history = [];
    var PRESET = opts.preset || [5, 9, 13, 20, 1, 3, 7, 15, 17, 25, 30];
    function say(msg, k) { lines.unshift({ m: msg, k: k }); lines = lines.slice(0, 24); }
    function reset(withPreset) {
      tree = new BPTree(m); hl = {}; lines = []; history = [];
      if (withPreset) { PRESET.forEach(function (k) { tree.insert(k); }); say('Built a tree of order ' + m + ' by inserting ' + PRESET.join(', ') + '.', 'muted'); }
    }
    function snapshot() { history.push(tree.clone()); if (history.length > 40) history.shift(); }
    function draw() {
      body.innerHTML =
        '<div class="controls"><label>Order m <select data-m>' + [3, 4, 5, 6].map(function (x) { return '<option' + (x === m ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
        '<span class="small muted">max ' + tree.maxKeys + ' keys/node · non-root leaf ≥ ' + tree.minLeaf + ' keys · non-root inner ≥ ' + (tree.minInnerKeys + 1) + ' children</span></div>' +
        '<div class="controls"><label>Key <input type="number" data-key style="width:80px" placeholder="e.g. 8"></label>' +
        '<button class="btn primary" data-op="ins">Insert</button><button class="btn" data-op="del">Delete</button><button class="btn" data-op="find">Search</button>' +
        '<span class="sep"></span><label>Range <input type="number" data-lo style="width:64px" placeholder="lo"> – <input type="number" data-hi style="width:64px" placeholder="hi"></label><button class="btn" data-op="range">Scan</button></div>' +
        '<div class="controls"><label>Bulk <input type="text" class="mono" data-bulk style="width:200px" placeholder="e.g. 2, 4, 6, 8"></label><button class="btn sm" data-op="bulk">Insert all</button>' +
        '<button class="btn sm" data-op="rand">Random key</button><button class="btn sm" data-op="undo"' + (history.length ? '' : ' disabled') + '>Undo</button><button class="btn sm" data-op="preset">Example tree</button><button class="btn sm" data-op="clear">Empty tree</button></div>' +
        '<figure class="diagram" style="margin:10px 0">' + render(tree, hl) + '</figure>' +
        '<div class="legend"><span style="--sw:var(--accent-soft)">inner node (keys route the search)</span><span style="--sw:var(--good-soft)">leaf node (keys + record ids)</span><span style="--sw:var(--warn-soft)">changed by the last operation</span><span>dashed arrows: sibling pointers</span></div>' +
        '<div class="stats"><span>Height <b>' + tree.height() + '</b></span><span>Keys <b>' + tree.allKeys().length + '</b></span><span>Leaf scan: <b>' + (tree.allKeys().join(' → ') || '∅') + '</b></span></div>' +
        '<div class="log">' + lines.map(function (l) { return '<div class="lg-' + (l.k || '') + '">' + esc(l.m) + '</div>'; }).join('') + '</div>';
      var inp = body.querySelector('[data-key]');
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') body.querySelector('[data-op="ins"]').click(); });
    }
    function doInsert(k) {
      var r = tree.insert(k);
      hl = { touched: r.touched, found: k };
      r.log.map(function (l, i) { return { m: (i === 0 ? 'INSERT ' + k + ': ' : '   ') + l, k: r.ok ? (i === 0 ? 'good' : 'info') : 'bad' }; }).reverse().forEach(function (x) { say(x.m, x.k); });
      return r.ok;
    }
    body.addEventListener('change', function (e) {
      if (e.target.hasAttribute('data-m')) { m = +e.target.value; reset(true); draw(); }
    });
    body.addEventListener('click', function (e) {
      var op = e.target.getAttribute && e.target.getAttribute('data-op');
      if (!op) return;
      var raw = body.querySelector('[data-key]').value;
      var k = raw === '' ? null : Math.floor(+raw);
      if (op === 'ins' || op === 'del' || op === 'find') {
        if (k === null || isNaN(k)) { say('Enter an integer key first.', 'bad'); draw(); return; }
      }
      if (op === 'ins') { snapshot(); if (!doInsert(k)) history.pop(); }
      else if (op === 'rand') {
        var tries = 0, have = tree.allKeys();
        do { k = Math.floor(Math.random() * 99) + 1; } while (have.indexOf(k) >= 0 && tries++ < 200);
        snapshot(); doInsert(k);
      } else if (op === 'del') {
        snapshot();
        var r = tree.remove(k);
        if (!r.ok) history.pop();
        hl = { touched: r.touched };
        r.log.map(function (l, i) { return { m: (i === 0 ? 'DELETE ' + k + ': ' : '   ') + l, k: r.ok ? (i === 0 ? 'good' : 'info') : 'bad' }; }).reverse().forEach(function (x) { say(x.m, x.k); });
      } else if (op === 'find') {
        var s = tree.search(k);
        hl = { path: s.path, found: s.found ? k : undefined };
        say('SEARCH ' + k + ': root → leaf, visiting ' + s.path.length + ' node' + (s.path.length > 1 ? 's' : '') + ' (= tree height) → ' + (s.found ? 'found' : 'not found'), s.found ? 'good' : 'bad');
      } else if (op === 'range') {
        var lo = +body.querySelector('[data-lo]').value, hi = +body.querySelector('[data-hi]').value;
        if (isNaN(lo) || isNaN(hi) || body.querySelector('[data-lo]').value === '' || body.querySelector('[data-hi]').value === '') { say('Enter both ends of the range.', 'bad'); draw(); return; }
        var rg = tree.range(lo, hi);
        hl = { path: rg.path, leaves: rg.leaves, inRange: rg.keys };
        say('SCAN [' + lo + ', ' + hi + ']: descend to the leaf for ' + lo + ', then follow sibling pointers across ' + rg.leaves.length + ' leaf node' + (rg.leaves.length > 1 ? 's' : '') + ' → {' + rg.keys.join(', ') + '}', 'good');
      } else if (op === 'bulk') {
        var list = body.querySelector('[data-bulk]').value.split(/[\s,]+/).filter(Boolean).map(Number).filter(function (x) { return !isNaN(x); });
        if (!list.length) { say('Enter a comma-separated list of keys.', 'bad'); draw(); return; }
        snapshot();
        list.forEach(function (x) { doInsert(Math.floor(x)); });
        hl = {};
      } else if (op === 'undo') { if (history.length) { tree = history.pop(); hl = {}; say('Undo.', 'muted'); } }
      else if (op === 'preset') { reset(true); }
      else if (op === 'clear') { reset(false); say('Empty tree of order ' + m + '.', 'muted'); }
      draw();
      body.querySelector('[data-key]').focus({ preventScroll: true });
    });
    reset(true); draw();
  };

  DBP.renderBPTree = render;
})();
