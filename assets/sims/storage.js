/* Storage simulators: slotted page, word alignment, log-structured (LSM) storage. */
(function () {
  'use strict';
  var DBP = window.DBP;
  var esc = function (s) { return DBP.esc(s); };

  /* ------------------------------------------------------------------ */
  /* Slotted page                                                        */
  /* ------------------------------------------------------------------ */
  DBP.sims.slottedPage = function (el) {
    var PAGE = 96, HEADER = 8, SLOT = 2, PAGE_ID = 7;
    var body = DBP.widget(el, 'Slotted page simulator', 'interactive');
    var st;
    function reset() {
      st = { slots: [], dataStart: PAGE, nextName: 1 };
      insert(10); insert(14); insert(8);
      log = [];
      say('Page ' + PAGE_ID + ' holds 3 tuples. The slot array grows → from the header; tuple data grows ← from the end of the page.', 'info');
    }
    var log = [];
    function say(msg, kind) { log.unshift({ msg: msg, kind: kind || '' }); log = log.slice(0, 8); }

    function freeSpace() { return st.dataStart - (HEADER + st.slots.length * SLOT); }
    function deadSpace() {
      // bytes in the tuple region that no live slot points to
      var live = st.slots.reduce(function (s, x) { return s + (x.alive ? x.len : 0); }, 0);
      return (PAGE - st.dataStart) - live;
    }
    function insert(size) {
      var reuse = -1;
      for (var i = 0; i < st.slots.length; i++) if (!st.slots[i].alive) { reuse = i; break; }
      var need = size + (reuse < 0 ? SLOT : 0);
      if (freeSpace() < need) {
        if (freeSpace() + deadSpace() >= need) {
          say('Not enough contiguous free space for a ' + size + '-byte tuple, but compacting would reclaim ' + deadSpace() + ' bytes of holes. Click “Compact”.', 'warn');
        } else {
          say('Page is full: a ' + size + '-byte tuple does not fit. The DBMS checks the page directory and inserts into another page.', 'bad');
        }
        return false;
      }
      st.dataStart -= size;
      var t = { offset: st.dataStart, len: size, alive: true, name: 't' + (st.nextName++) };
      var slotNo;
      if (reuse >= 0) { st.slots[reuse] = t; slotNo = reuse; } else { st.slots.push(t); slotNo = st.slots.length - 1; }
      say('INSERT ' + t.name + ' (' + size + ' B) at offset ' + t.offset + ' → slot #' + slotNo + ', record id = (page ' + PAGE_ID + ', slot ' + slotNo + ')' + (reuse >= 0 ? ' — reused an empty slot' : ''), 'good');
      return true;
    }
    function del(i) {
      var s = st.slots[i];
      if (!s || !s.alive) return;
      s.alive = false;
      say('DELETE slot #' + i + ' (' + s.name + '): slot marked empty. Its ' + s.len + ' bytes become a hole until compaction. Other record ids are unchanged.', 'bad');
    }
    function update(i, size) {
      var s = st.slots[i];
      if (!s || !s.alive) return;
      if (size <= s.len) { s.len = size; say('UPDATE slot #' + i + ': new value (' + size + ' B) fits, overwrite in place.', 'good'); return; }
      if (freeSpace() >= size) {
        st.dataStart -= size; s.offset = st.dataStart; s.len = size;
        say('UPDATE slot #' + i + ': new value (' + size + ' B) is larger; moved inside the page and the slot now points to offset ' + s.offset + '. Record id unchanged.', 'info');
        return;
      }
      say('UPDATE slot #' + i + ': ' + size + ' B does not fit in this page — mark the tuple deleted and insert the new version into a different page.', 'warn');
    }
    function compact() {
      var off = PAGE;
      // keep slot numbers, pack live tuples against the end of the page
      st.slots.slice().map(function (s, i) { return { s: s, i: i }; })
        .filter(function (x) { return x.s.alive; })
        .sort(function (a, b) { return b.s.offset - a.s.offset; })
        .forEach(function (x) { off -= x.s.len; x.s.offset = off; });
      st.dataStart = off;
      say('COMPACT: live tuples slid together at the end of the page. Slot numbers (record ids) did not change — only the offsets inside the slot array.', 'info');
    }

    function draw() {
      var segs = [];
      segs.push({ cls: 'bb-head', w: HEADER, label: 'header' });
      st.slots.forEach(function (s, i) { segs.push({ cls: 'bb-slot', w: SLOT, label: '#' + i, title: 'slot ' + i }); });
      var fs = freeSpace();
      if (fs > 0) segs.push({ cls: 'bb-free', w: fs, label: fs >= 6 ? 'free ' + fs : '' });
      // tuple region: walk from dataStart to PAGE, mark holes
      var live = st.slots.map(function (s, i) { return { s: s, i: i }; }).filter(function (x) { return x.s.alive; })
        .sort(function (a, b) { return a.s.offset - b.s.offset; });
      var pos = st.dataStart;
      live.forEach(function (x) {
        if (x.s.offset > pos) segs.push({ cls: 'bb-dead', w: x.s.offset - pos, label: 'hole' });
        segs.push({ cls: 'bb-tuple', w: x.s.len, label: x.s.name, title: x.s.name + ' @' + x.s.offset });
        pos = x.s.offset + x.s.len;
      });
      if (pos < PAGE) segs.push({ cls: 'bb-dead', w: PAGE - pos, label: 'hole' });

      var bar = '<div class="bytebar">' + segs.map(function (g) {
        return '<div class="' + g.cls + '" style="flex:' + g.w + ' 0 0" title="' + esc(g.title || g.label) + '">' + esc(g.label) + '</div>';
      }).join('') + '</div>';
      var scale = '<div class="small muted mono" style="display:flex;justify-content:space-between;margin-top:2px"><span>offset 0</span><span>' + PAGE + '</span></div>';

      var rows = st.slots.map(function (s, i) {
        return '<tr class="' + (s.alive ? '' : 'dim') + '"><td>#' + i + '</td><td>' + (s.alive ? s.offset : '—') + '</td><td>' + (s.alive ? s.len : '—') + '</td><td>' + (s.alive ? esc(s.name) : '<i>empty</i>') + '</td><td>' + (s.alive ? '(' + PAGE_ID + ', ' + i + ')' : '') + '</td><td>' +
          (s.alive ? '<button class="btn sm" data-del="' + i + '">Delete</button> <button class="btn sm" data-upd="' + i + '">Grow +8</button>' : '') + '</td></tr>';
      }).join('');

      body.innerHTML =
        '<div class="controls"><label>Tuple size <input type="number" min="2" max="40" value="12" data-size></label>' +
        '<button class="btn primary" data-ins>Insert tuple</button><button class="btn" data-compact>Compact</button>' +
        '<span class="sep"></span><button class="btn" data-reset>Reset</button></div>' +
        bar + scale +
        '<div class="legend"><span style="--sw:var(--surface-2)">header</span><span style="--sw:var(--accent-soft)">slot array</span><span style="--sw:var(--good-soft)">tuple data</span><span style="--sw:var(--bad-soft)">hole (deleted)</span><span>free space</span></div>' +
        '<div class="stats"><span>Free: <b>' + fs + ' B</b></span><span>Holes: <b>' + deadSpace() + ' B</b></span><span>Slots used: <b>' + st.slots.filter(function (s) { return s.alive; }).length + ' / ' + st.slots.length + '</b></span></div>' +
        '<table style="margin-top:12px"><thead><tr><th>Slot</th><th>Offset</th><th>Length</th><th>Tuple</th><th>Record id (page, slot)</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<div class="log">' + log.map(function (l) { return '<div class="lg-' + (l.kind === 'warn' ? 'muted' : l.kind) + '">' + esc(l.msg) + '</div>'; }).join('') + '</div>';
      DBP.enhance(body);
    }

    body.addEventListener('click', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-ins')) { var n = +body.querySelector('[data-size]').value || 8; insert(Math.max(2, Math.min(40, n))); }
      else if (t.hasAttribute('data-compact')) compact();
      else if (t.hasAttribute('data-reset')) reset();
      else if (t.hasAttribute('data-del')) del(+t.getAttribute('data-del'));
      else if (t.hasAttribute('data-upd')) { var i = +t.getAttribute('data-upd'); update(i, st.slots[i].len + 8); }
      else return;
      draw();
    });
    reset(); draw();
  };

  /* ------------------------------------------------------------------ */
  /* Word alignment: padding vs reordering                               */
  /* ------------------------------------------------------------------ */
  var TYPES = {
    'TINYINT': 8, 'SMALLINT': 16, 'INT': 32, 'BIGINT': 64, 'REAL': 32, 'DOUBLE': 64,
    'TIMESTAMP': 64, 'CHAR(2)': 16, 'CHAR(4)': 32, 'BOOLEAN': 8
  };
  var WORD = 64;

  function layoutPacked(attrs) {
    var out = [], pos = 0;
    attrs.forEach(function (a) {
      var crosses = Math.floor(pos / WORD) !== Math.floor((pos + a.bits - 1) / WORD);
      out.push({ name: a.name, bits: a.bits, start: pos, bad: crosses });
      pos += a.bits;
    });
    var total = Math.ceil(pos / WORD) * WORD;
    if (total > pos) out.push({ pad: true, bits: total - pos, start: pos });
    return { items: out, words: total / WORD };
  }
  // Lecture rule: round each attribute's storage up to a whole word.
  function layoutPadded(attrs) {
    var out = [], pos = 0;
    attrs.forEach(function (a) {
      out.push({ name: a.name, bits: a.bits, start: pos });
      pos += a.bits;
      var r = pos % WORD;
      if (r) { out.push({ pad: true, bits: WORD - r, start: pos }); pos += WORD - r; }
    });
    return { items: out, words: pos / WORD };
  }
  // Reorder: first-fit decreasing into 64-bit words, then pad the leftovers.
  function layoutReordered(attrs) {
    var sorted = attrs.slice().sort(function (a, b) { return b.bits - a.bits; });
    var words = [];
    sorted.forEach(function (a) {
      if (a.bits >= WORD) { words.push({ used: a.bits, items: [a] }); return; }
      for (var i = 0; i < words.length; i++) {
        if (words[i].used < WORD && WORD - (words[i].used % WORD) >= a.bits && words[i].used + a.bits <= WORD) { words[i].items.push(a); words[i].used += a.bits; return; }
      }
      words.push({ used: a.bits, items: [a] });
    });
    var out = [], pos = 0;
    words.forEach(function (w) {
      w.items.forEach(function (a) { out.push({ name: a.name, bits: a.bits, start: pos }); pos += a.bits; });
      var r = pos % WORD;
      if (r) { out.push({ pad: true, bits: WORD - r, start: pos }); pos += WORD - r; }
    });
    return { items: out, words: pos / WORD };
  }
  DBP.logic.align = { packed: layoutPacked, padded: layoutPadded, reordered: layoutReordered };

  DBP.sims.wordAlign = function (el) {
    var body = DBP.widget(el, 'Word alignment: padding vs. reordering', 'interactive');
    var attrs = [
      { name: 'id', type: 'INT' }, { name: 'cdate', type: 'TIMESTAMP' },
      { name: 'color', type: 'CHAR(2)' }, { name: 'zipcode', type: 'INT' }
    ];
    function withBits() { return attrs.map(function (a) { return { name: a.name, bits: TYPES[a.type] }; }); }
    function bar(layout) {
      var words = '';
      for (var w = 0; w < layout.words; w++) {
        var segs = layout.items.filter(function (it) { return it.start >= w * WORD && it.start < (w + 1) * WORD || (it.start < w * WORD && it.start + it.bits > w * WORD); });
        words += '<div style="margin-bottom:6px"><div class="small muted mono">word ' + w + ' (bits ' + (w * 64) + '–' + (w * 64 + 63) + ')</div><div class="bytebar" style="height:40px">' +
          segs.map(function (it) {
            var s = Math.max(it.start, w * WORD), e = Math.min(it.start + it.bits, (w + 1) * WORD);
            var cls = it.pad ? 'bb-pad' : (it.bad ? 'bb-bad' : 'bb-tuple');
            var label = it.pad ? 'pad ' + (e - s) : it.name + ' ' + (e - s) + (e - s < it.bits ? '…' : '');
            return '<div class="' + cls + '" style="flex:' + (e - s) + ' 0 0">' + esc(label) + '</div>';
          }).join('') + '</div></div>';
      }
      return words;
    }
    function draw() {
      var a = withBits();
      var P = layoutPacked(a), D = layoutPadded(a), R = layoutReordered(a);
      var straddle = P.items.filter(function (x) { return x.bad; }).map(function (x) { return x.name; });
      body.innerHTML =
        '<p class="small muted">Edit the schema (attribute order matters!). Each row below is one 64-bit word.</p>' +
        '<table style="width:auto"><thead><tr><th>#</th><th>Attribute</th><th>Type</th><th>Bits</th><th></th></tr></thead><tbody>' +
        attrs.map(function (x, i) {
          return '<tr><td>' + i + '</td><td><input type="text" value="' + esc(x.name) + '" data-name="' + i + '" style="width:110px"></td><td><select data-type="' + i + '">' +
            Object.keys(TYPES).map(function (t) { return '<option' + (t === x.type ? ' selected' : '') + '>' + t + '</option>'; }).join('') +
            '</select></td><td class="mono">' + TYPES[x.type] + '</td><td><button class="btn sm" data-up="' + i + '"' + (i === 0 ? ' disabled' : '') + '>↑</button> <button class="btn sm" data-rm="' + i + '">✕</button></td></tr>';
        }).join('') + '</tbody></table>' +
        '<div class="controls" style="margin-top:8px"><button class="btn sm" data-add>+ Add attribute</button><button class="btn sm" data-default>Lecture example</button></div>' +
        '<div class="grid3" style="align-items:start">' +
        '<div><h4 style="margin-top:0">1. Stored as declared</h4>' + bar(P) + '<div class="small ' + (straddle.length ? 'muted' : 'muted') + '">' + (straddle.length ? '<span style="color:var(--bad)">✗ ' + esc(straddle.join(', ')) + ' straddle' + (straddle.length === 1 ? 's' : '') + ' a word boundary</span> — the CPU needs two reads (or faults on some architectures).' : 'No attribute crosses a word boundary.') + '</div></div>' +
        '<div><h4 style="margin-top:0">2. Padding</h4>' + bar(D) + '<div class="small muted"><b>' + D.words + ' words</b> (' + D.words * 8 + ' bytes). Each attribute is rounded up to a whole word.</div></div>' +
        '<div><h4 style="margin-top:0">3. Reordering</h4>' + bar(R) + '<div class="small muted"><b>' + R.words + ' words</b> (' + R.words * 8 + ' bytes). Attributes are rearranged so small ones share a word; leftover space is still padded.</div></div>' +
        '</div>';
    }
    body.addEventListener('input', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-name')) attrs[+t.getAttribute('data-name')].name = t.value || '?';
    });
    body.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-type')) { attrs[+t.getAttribute('data-type')].type = t.value; draw(); }
      else if (t.hasAttribute('data-name')) draw();
    });
    body.addEventListener('click', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-up')) { var i = +t.getAttribute('data-up'); var x = attrs[i]; attrs[i] = attrs[i - 1]; attrs[i - 1] = x; }
      else if (t.hasAttribute('data-rm')) { if (attrs.length > 1) attrs.splice(+t.getAttribute('data-rm'), 1); }
      else if (t.hasAttribute('data-add')) { if (attrs.length < 8) attrs.push({ name: 'attr' + attrs.length, type: 'SMALLINT' }); }
      else if (t.hasAttribute('data-default')) attrs = [{ name: 'id', type: 'INT' }, { name: 'cdate', type: 'TIMESTAMP' }, { name: 'color', type: 'CHAR(2)' }, { name: 'zipcode', type: 'INT' }];
      else return;
      draw();
    });
    draw();
  };

  /* ------------------------------------------------------------------ */
  /* Log-structured storage: MemTable → SSTables → compaction            */
  /* ------------------------------------------------------------------ */
  DBP.sims.lsm = function (el) {
    var CAP = 3;
    var body = DBP.widget(el, 'Log-structured storage (LSM) simulator', 'interactive');
    var mem, ssts, logLines, seq, hl;
    function reset() { mem = {}; ssts = []; logLines = []; seq = 0; hl = null; }
    function say(m, k) { logLines.unshift({ m: m, k: k || '' }); logLines = logLines.slice(0, 10); }
    function memSize() { return Object.keys(mem).length; }
    function flush() {
      if (!memSize()) { say('MemTable is empty — nothing to flush.', 'muted'); return; }
      var keys = Object.keys(mem).sort();
      ssts.unshift({ id: ++seq, level: 0, entries: keys.map(function (k) { return { k: k, v: mem[k] }; }) });
      mem = {};
      say('FLUSH: MemTable written sequentially to disk as immutable SSTable #' + seq + ' (sorted by key).', 'info');
    }
    function write(k, v) {
      mem[k] = v;
      say((v === null ? 'DELETE ' + k + ' → tombstone' : 'PUT ' + k + '=' + v) + ' appended to the MemTable (in memory). No disk read needed.', 'good');
      if (memSize() >= CAP) flush();
    }
    function get(k) {
      hl = { k: k, path: [] };
      if (Object.prototype.hasOwnProperty.call(mem, k)) {
        hl.path.push('mem'); hl.found = 'mem';
        say('GET ' + k + ': found in MemTable → ' + (mem[k] === null ? 'tombstone, so NOT FOUND' : mem[k]), mem[k] === null ? 'bad' : 'good');
        return;
      }
      hl.path.push('mem');
      for (var i = 0; i < ssts.length; i++) {
        hl.path.push(ssts[i].id);
        var e = ssts[i].entries.filter(function (x) { return x.k === k; })[0];
        if (e) {
          hl.found = ssts[i].id;
          say('GET ' + k + ': checked MemTable' + (i ? ' and ' + i + ' newer SSTable' + (i > 1 ? 's' : '') : '') + ', found in SSTable #' + ssts[i].id + ' → ' + (e.v === null ? 'tombstone, so NOT FOUND' : e.v), e.v === null ? 'bad' : 'good');
          return;
        }
      }
      say('GET ' + k + ': checked MemTable and all ' + ssts.length + ' SSTables — NOT FOUND. (Reads can be expensive!)', 'bad');
    }
    function compact() {
      if (ssts.length < 2) { say('Need at least two SSTables to compact.', 'muted'); return; }
      var latest = {};
      // oldest → newest so newer values overwrite older
      ssts.slice().reverse().forEach(function (s) { s.entries.forEach(function (e) { latest[e.k] = e.v; }); });
      var before = ssts.reduce(function (a, s) { return a + s.entries.length; }, 0);
      var keys = Object.keys(latest).sort().filter(function (k) { return latest[k] !== null; });
      ssts = [{ id: ++seq, level: 1, entries: keys.map(function (k) { return { k: k, v: latest[k] }; }) }];
      say('COMPACT: sort-merged ' + before + ' entries into SSTable #' + seq + ' with ' + keys.length + ' entries — only the latest value per key survives; tombstones dropped.', 'info');
    }
    function tableHTML(title, entries, cls, id) {
      var isHL = hl && hl.path.indexOf(id) >= 0;
      return '<div class="card" style="padding:8px 10px;min-width:130px;' + (isHL ? 'border-color:var(--accent)' : '') + '"><div class="small" style="font-weight:650;margin-bottom:4px">' + title + '</div>' +
        (entries.length ? '<table class="rel" style="min-width:0"><tbody>' + entries.map(function (e) {
          var hit = hl && hl.found === id && e.k === hl.k;
          return '<tr' + (hit ? ' class="hl"' : '') + '><td>' + esc(e.k) + '</td><td>' + (e.v === null ? '<span style="color:var(--bad)">✝ tombstone</span>' : esc(e.v)) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<div class="small muted">empty</div>') + '</div>';
    }
    function draw() {
      var memEntries = Object.keys(mem).sort().map(function (k) { return { k: k, v: mem[k] }; });
      body.innerHTML =
        '<div class="controls"><label>key <select data-k>' + 'abcdef'.split('').map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></label>' +
        '<label>value <input type="text" value="' + (seq * 10 + memSize() + 1) + '" data-v style="width:60px"></label>' +
        '<button class="btn primary" data-put>PUT</button><button class="btn" data-del>DELETE</button><button class="btn" data-get>GET</button>' +
        '<span class="sep"></span><button class="btn" data-flush>Flush</button><button class="btn" data-compact>Compact</button><button class="btn" data-rand>Random writes</button><button class="btn" data-reset>Reset</button></div>' +
        '<div class="small muted" style="margin-bottom:4px">Memory</div>' +
        '<div class="flex">' + tableHTML('MemTable (' + memSize() + '/' + CAP + ')', memEntries, '', 'mem') + '</div>' +
        '<div class="small muted" style="margin:12px 0 4px">Disk — newest SSTable first</div>' +
        '<div class="flex">' + (ssts.length ? ssts.map(function (s) { return tableHTML('SSTable #' + s.id + ' <span class="pill">L' + s.level + '</span>', s.entries, '', s.id); }).join('') : '<span class="small muted">no SSTables yet</span>') + '</div>' +
        '<div class="log">' + logLines.map(function (l) { return '<div class="lg-' + l.k + '">' + esc(l.m) + '</div>'; }).join('') + '</div>';
    }
    body.addEventListener('click', function (e) {
      var t = e.target;
      var k = body.querySelector('[data-k]') && body.querySelector('[data-k]').value;
      var v = body.querySelector('[data-v]') && body.querySelector('[data-v]').value;
      hl = null;
      if (t.hasAttribute('data-put')) write(k, v || '0');
      else if (t.hasAttribute('data-del')) write(k, null);
      else if (t.hasAttribute('data-get')) get(k);
      else if (t.hasAttribute('data-flush')) flush();
      else if (t.hasAttribute('data-compact')) compact();
      else if (t.hasAttribute('data-rand')) { for (var i = 0; i < 4; i++) { var kk = 'abcdef'[Math.floor(Math.random() * 6)]; if (Math.random() < 0.2) write(kk, null); else write(kk, String(Math.floor(Math.random() * 90) + 10)); } }
      else if (t.hasAttribute('data-reset')) { reset(); say('Reset.', 'muted'); }
      else return;
      var keep = k;
      draw();
      if (keep) body.querySelector('[data-k]').value = keep;
    });
    reset();
    write('a', '10'); write('b', '20'); write('c', '30'); write('a', '11'); write('b', null);
    draw();
  };
})();
