/* Storage models (NSM / DSM / PAX) and columnar compression playground. */
(function () {
  'use strict';
  var DBP = window.DBP;
  var esc = function (s) { return DBP.esc(s); };

  /* ------------------------------------------------------------------ */
  /* NSM vs DSM vs PAX                                                   */
  /* ------------------------------------------------------------------ */
  DBP.sims.storageModels = function (el) {
    var COLS = ['userID', 'userName', 'userPass', 'hostname', 'lastLogin'];
    var SHORT = ['id', 'name', 'pass', 'host', 'login'];
    var N = 8;
    var body = DBP.widget(el, 'Row store vs. column store vs. PAX', 'interactive');
    var model = 'nsm', query = 'oltp';
    var QUERIES = {
      oltp: { label: 'OLTP: point lookup', sql: "SELECT * FROM useracct\n WHERE userName = ? AND userPass = ?;", rows: [5], cols: [0, 1, 2, 3, 4],
        note: 'Needs every attribute of one tuple (found via an index).' },
      olap: { label: 'OLAP: scan two columns', sql: "SELECT COUNT(U.lastLogin),\n       EXTRACT(month FROM U.lastLogin) AS month\n  FROM useracct AS U\n WHERE U.hostname LIKE '%.gov'\n GROUP BY month;", rows: [0, 1, 2, 3, 4, 5, 6, 7], cols: [3, 4],
        note: 'Needs only hostname and lastLogin — but of every tuple.' }
    };
    // Each "page" is a list of cells {r, c}
    function pages() {
      var p = [], r, c;
      if (model === 'nsm') {
        for (r = 0; r < N; r += 2) { var pg = []; for (var k = r; k < r + 2; k++) for (c = 0; c < COLS.length; c++) pg.push({ r: k, c: c }); p.push({ title: 'page ' + (p.length + 1), cells: pg, cols: COLS.length }); }
      } else if (model === 'dsm') {
        for (c = 0; c < COLS.length; c++) { var pc = []; for (r = 0; r < N; r++) pc.push({ r: r, c: c }); p.push({ title: COLS[c] + ' page', cells: pc, cols: 1, colChunks: true }); }
      } else {
        for (r = 0; r < N; r += 4) {
          var pp = [];
          for (c = 0; c < COLS.length; c++) for (var j = r; j < r + 4; j++) pp.push({ r: j, c: c });
          p.push({ title: 'row group ' + (p.length + 1), cells: pp, cols: 4, pax: true });
        }
      }
      return p;
    }
    function draw() {
      var Q = QUERIES[query];
      var need = function (cell) { return Q.rows.indexOf(cell.r) >= 0 && Q.cols.indexOf(cell.c) >= 0; };
      var P = pages();
      var read = 0, cellsRead = 0, useful = 0;
      var html = '<div class="flex" style="gap:12px">';
      P.forEach(function (pg) {
        var touched = pg.cells.some(need);
        var chunkRead = function (cell) {
          if (!touched) return false;
          if (pg.pax) return Q.cols.indexOf(cell.c) >= 0; // PAX reads only needed column chunks
          return true;
        };
        if (touched) read++;
        pg.cells.forEach(function (cell) { if (chunkRead(cell)) { cellsRead++; if (need(cell)) useful++; } });
        var grid;
        if (pg.pax) {
          grid = COLS.map(function (_, c) {
            return '<div style="display:flex;gap:2px;margin-bottom:2px">' + pg.cells.filter(function (x) { return x.c === c; }).map(function (cell) {
              return cellBox(cell, need(cell), chunkRead(cell));
            }).join('') + '</div>';
          }).join('');
        } else if (pg.colChunks) {
          grid = '<div style="display:flex;gap:2px;flex-wrap:wrap;width:132px">' + pg.cells.map(function (cell) { return cellBox(cell, need(cell), chunkRead(cell)); }).join('') + '</div>';
        } else {
          grid = [0, 1].map(function (i) {
            return '<div style="display:flex;gap:2px;margin-bottom:2px">' + pg.cells.slice(i * COLS.length, (i + 1) * COLS.length).map(function (cell) { return cellBox(cell, need(cell), chunkRead(cell)); }).join('') + '</div>';
          }).join('');
        }
        html += '<div class="card" style="padding:8px;' + (touched ? 'border-color:var(--accent)' : 'opacity:.75') + '"><div class="small" style="font-weight:650;margin-bottom:4px">' + esc(pg.title) + (touched ? ' <span class="pill accent">read</span>' : '') + '</div>' + grid + '</div>';
      });
      html += '</div>';
      var pct = cellsRead ? Math.round(100 * useful / cellsRead) : 0;
      body.innerHTML =
        '<div class="controls"><b class="small">Layout:</b>' +
        [['nsm', 'NSM (row store)'], ['dsm', 'DSM (column store)'], ['pax', 'PAX (hybrid)']].map(function (m) { return '<button class="btn sm' + (model === m[0] ? ' on' : '') + '" data-m="' + m[0] + '">' + m[1] + '</button>'; }).join('') +
        '<span class="sep"></span><b class="small">Query:</b>' +
        Object.keys(QUERIES).map(function (q) { return '<button class="btn sm' + (query === q ? ' on' : '') + '" data-q="' + q + '">' + QUERIES[q].label + '</button>'; }).join('') + '</div>' +
        '<div class="grid2" style="align-items:start;margin-top:0"><pre class="sql" style="margin:0">' + esc(Q.sql) + '</pre><div class="status info" style="margin:0">' + Q.note + '</div></div>' +
        '<div style="margin-top:12px">' + html + '</div>' +
        '<div class="legend"><span style="--sw:var(--good-soft)">read &amp; needed</span><span style="--sw:var(--warn-soft)">read but not needed (wasted I/O)</span><span>not read</span></div>' +
        '<div class="stats"><span>Pages touched: <b>' + read + ' / ' + P.length + '</b></span><span>Values read: <b>' + cellsRead + '</b></span><span>Useful: <b>' + pct + '%</b></span></div>' +
        '<div class="small muted" style="margin-top:6px">' + verdict() + '</div>';
      DBP.enhance(body);
    }
    function verdict() {
      var v = {
        'nsm-oltp': 'Row store + OLTP: the whole tuple sits in one page, so a single page read answers the query. ✔ Ideal.',
        'nsm-olap': 'Row store + OLAP: every page must be read, but only 2 of 5 attributes are useful — most of the I/O is wasted.',
        'dsm-oltp': 'Column store + OLTP: the tuple is split over 5 pages, which must all be read and stitched back together. ✘ Slow point queries.',
        'dsm-olap': 'Column store + OLAP: only the two needed column pages are read and every value read is useful. ✔ Ideal.',
        'pax-oltp': 'PAX + OLTP: the tuple’s attributes are all inside one row group page — close to a row store.',
        'pax-olap': 'PAX + OLAP: only the needed column chunks of each row group are scanned — columnar benefits while keeping a tuple’s data in the same page.'
      };
      return v[model + '-' + query];
    }
    function cellBox(cell, needed, read) {
      var bg = read ? (needed ? 'var(--good-soft)' : 'var(--warn-soft)') : 'var(--surface-2)';
      var col = read ? (needed ? 'var(--good)' : 'var(--warn)') : 'var(--muted)';
      return '<span title="tuple ' + cell.r + ', ' + COLS[cell.c] + '" style="display:inline-block;width:30px;height:22px;line-height:22px;text-align:center;font:11px var(--mono);border-radius:3px;background:' + bg + ';color:' + col + '">' + SHORT[cell.c].charAt(0) + cell.r + '</span>';
    }
    body.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (!t) return;
      if (t.hasAttribute('data-m')) model = t.getAttribute('data-m');
      else if (t.hasAttribute('data-q')) query = t.getAttribute('data-q');
      else return;
      draw();
    });
    draw();
  };

  /* ------------------------------------------------------------------ */
  /* Compression                                                          */
  /* ------------------------------------------------------------------ */
  function bitsFor(n) { return n <= 1 ? 1 : Math.ceil(Math.log2(n)); }
  function bitsForValue(maxV) { return maxV <= 0 ? 1 : Math.floor(Math.log2(maxV)) + 1; }

  var C = {
    rle: function (vals) {
      var out = [], i = 0;
      while (i < vals.length) {
        var j = i;
        while (j < vals.length && vals[j] === vals[i]) j++;
        out.push([vals[i], i, j - i]);
        i = j;
      }
      return out;
    },
    dict: function (vals) {
      var distinct = vals.filter(function (v, i) { return vals.indexOf(v) === i; });
      var sorted = distinct.slice().sort(function (a, b) { return typeof a === 'number' && typeof b === 'number' ? a - b : String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0; });
      var code = {};
      sorted.forEach(function (v, i) { code[v] = i; });
      return { dict: sorted, codes: vals.map(function (v) { return code[v]; }) };
    },
    delta: function (vals) { return vals.map(function (v, i) { return i === 0 ? v : v - vals[i - 1]; }); },
    forEnc: function (vals) { var mn = Math.min.apply(null, vals); return { base: mn, offs: vals.map(function (v) { return v - mn; }) }; },
    bitmap: function (vals) {
      var distinct = vals.filter(function (v, i) { return vals.indexOf(v) === i; });
      return distinct.map(function (d) { return { v: d, bits: vals.map(function (v) { return v === d ? 1 : 0; }) }; });
    }
  };
  DBP.logic.compress = C;

  DBP.sims.compression = function (el) {
    var body = DBP.widget(el, 'Columnar compression playground', 'interactive');
    var PRESETS = {
      ints: '99, 99, 99, 100, 100, 101, 101, 101, 101, 102, 102, 99',
      sorted: '12:00, 12:01, 12:02, 12:03, 12:04, 12:05',
      temps: '99.5, 99.4, 99.5, 100.0, 101.2, 99.5',
      names: 'Andrea, Mr.Pickles, Andy, Jignesh, Mr.Pickles, Andrea, Andrea',
      sex: 'M, M, F, M, F, F, M, M, M, F'
    };
    var scheme = 'rle', text = PRESETS.ints, sortFirst = false;

    function parse() {
      var raw = text.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
      var numeric = raw.length && raw.every(function (s) { return /^-?\d+(\.\d+)?$/.test(s); });
      var times = raw.length && raw.every(function (s) { return /^\d{1,2}:\d{2}$/.test(s); });
      var vals = raw.map(function (s) {
        if (times) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
        return numeric ? Number(s) : s;
      });
      if (sortFirst) vals.sort(function (a, b) { return typeof a === 'number' ? a - b : String(a) < String(b) ? -1 : 1; });
      return { vals: vals, numeric: numeric || times, times: times };
    }
    function show(v, info) {
      if (info.times && typeof v === 'number') { var h = Math.floor(v / 60), m = v % 60; return h + ':' + (m < 10 ? '0' : '') + m; }
      return String(v);
    }
    function origBits(vals, info) {
      return info.numeric ? vals.length * 32 : vals.reduce(function (s, v) { return s + String(v).length * 8; }, 0);
    }
    function draw() {
      var info = parse(), vals = info.vals;
      var ob = origBits(vals, info), cb = null, out = '', note = '';
      var isInt = info.numeric && vals.every(function (v) { return Number.isInteger(v); });
      if (!vals.length) { out = '<div class="status warn">Enter some comma-separated values.</div>'; }
      else if (scheme === 'rle') {
        var trip = C.rle(vals);
        cb = trip.length * 3 * 32;
        out = '<div class="small muted">Triplets (value, start position, run length):</div><div class="cells" style="margin-top:6px">' +
          trip.map(function (t) { return '<div class="cell"><div class="cv">(' + esc(show(t[0], info)) + ', ' + t[1] + ', ' + t[2] + ')</div></div>'; }).join('') + '</div>';
        note = trip.length + ' run' + (trip.length === 1 ? '' : 's') + ' for ' + vals.length + ' values. RLE only pays off when there are long runs of the same value — try “Sort first”.';
      } else if (scheme === 'dict') {
        var d = C.dict(vals);
        var b = bitsFor(d.dict.length);
        cb = vals.length * b + (info.numeric ? d.dict.length * 32 : d.dict.reduce(function (s, v) { return s + String(v).length * 8; }, 0));
        out = '<div class="flex"><div><div class="small muted">Dictionary (sorted → order-preserving)</div><table class="rel"><thead><tr><th>code</th><th>value</th></tr></thead><tbody>' +
          d.dict.map(function (v, i) { return '<tr><td>' + i + '</td><td>' + esc(show(v, info)) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<div><div class="small muted">Encoded column (' + b + ' bit' + (b === 1 ? '' : 's') + ' per code)</div><div class="cells" style="margin-top:6px">' +
          d.codes.map(function (c) { return '<div class="cell"><div class="cv">' + c + '</div></div>'; }).join('') + '</div></div></div>';
        note = 'Because codes are assigned in sorted order, range predicates and LIKE prefixes can run directly on codes (e.g. value ≥ X ⇔ code ≥ code(X)) without decompressing.';
      } else if (scheme === 'bitpack') {
        if (!isInt || vals.some(function (v) { return v < 0; })) { out = '<div class="status warn">Bit packing needs non-negative integers. Try the first preset.</div>'; }
        else {
          var mx = Math.max.apply(null, vals), bits = bitsForValue(mx);
          cb = vals.length * bits;
          out = '<div class="small muted">Largest value ' + mx + ' needs only ' + bits + ' bits instead of 32:</div><div class="cells" style="margin-top:6px">' +
            vals.map(function (v) { return '<div class="cell"><div class="ci">' + v + '</div><div class="cv" style="font-size:12px">' + v.toString(2).padStart(bits, '0') + '</div></div>'; }).join('') + '</div>';
          note = 'Several packed values fit in one machine word, and bit-shifting operates on them together. “Mostly” encoding: if a few values are too big, store them separately as exceptions and pack the rest.';
        }
      } else if (scheme === 'delta') {
        if (!info.numeric) { out = '<div class="status warn">Delta encoding needs numbers. Try the time or temperature presets.</div>'; }
        else {
          var del = C.delta(vals);
          var rest = del.slice(1).map(function (x) { return +x.toFixed(4); });
          var dr = C.rle(rest);
          var maxAbs = Math.max.apply(null, rest.map(function (x) { return Math.abs(Math.round(x * 10)); }).concat([1]));
          var db = isInt ? bitsForValue(Math.max.apply(null, rest.map(Math.abs).concat([1]))) + 1 : bitsForValue(maxAbs) + 1;
          cb = 32 + (vals.length - 1) * db;
          out = '<div class="small muted">Base value, then differences from the previous value:</div><div class="cells" style="margin-top:6px">' +
            '<div class="cell hl"><div class="ci">base</div><div class="cv">' + esc(show(del[0], info)) + '</div></div>' +
            rest.map(function (x) { return '<div class="cell"><div class="cv">' + (x > 0 ? '+' : '') + x + '</div></div>'; }).join('') + '</div>' +
            '<div class="small muted" style="margin-top:8px">Deltas + RLE: ' + dr.map(function (t) { return '(' + (t[0] > 0 ? '+' : '') + t[0] + ' ×' + t[2] + ')'; }).join(' ') + '</div>';
          note = 'Small deltas need few bits (here ≈' + db + ' bits incl. sign). Sorted or slowly-changing columns (timestamps, sensor readings) compress very well, especially combined with RLE.';
        }
      } else if (scheme === 'for') {
        if (!info.numeric) { out = '<div class="status warn">Frame-of-reference needs numbers.</div>'; }
        else {
          var f = C.forEnc(vals);
          var offs = f.offs.map(function (x) { return +x.toFixed(4); });
          var fb = bitsForValue(Math.max.apply(null, offs.map(function (x) { return Math.round(isInt ? x : x * 10); })));
          cb = 32 + vals.length * fb;
          out = '<div class="small muted">Global minimum as the frame of reference, then offsets from it:</div><div class="cells" style="margin-top:6px">' +
            '<div class="cell hl"><div class="ci">min</div><div class="cv">' + esc(show(f.base, info)) + '</div></div>' +
            offs.map(function (x) { return '<div class="cell"><div class="cv">+' + x + '</div></div>'; }).join('') + '</div>';
          note = 'Unlike delta encoding, every value can be decoded independently (value = min + offset) — no need to sum all previous deltas.';
        }
      } else if (scheme === 'bitmap') {
        var bm = C.bitmap(vals);
        cb = bm.length * vals.length;
        out = '<table class="rel"><thead><tr><th>value</th><th>bitmap (position i = tuple i)</th></tr></thead><tbody>' +
          bm.map(function (x) { return '<tr><td>' + esc(show(x.v, info)) + '</td><td>' + x.bits.join('') + '</td></tr>'; }).join('') + '</tbody></table>';
        note = bm.length + ' distinct values × ' + vals.length + ' tuples = ' + cb + ' bits. Only practical when cardinality is LOW (like M/F); every new distinct value adds a whole bitmap.';
      }
      var ratio = cb ? (ob / cb) : 0;
      body.innerHTML =
        '<div class="controls"><b class="small">Scheme:</b>' +
        [['rle', 'Run-length'], ['dict', 'Dictionary'], ['bitpack', 'Bit packing'], ['delta', 'Delta'], ['for', 'Frame of reference'], ['bitmap', 'Bitmap']].map(function (s) {
          return '<button class="btn sm' + (scheme === s[0] ? ' on' : '') + '" data-s="' + s[0] + '">' + s[1] + '</button>';
        }).join('') + '</div>' +
        '<div class="controls"><b class="small">Data:</b>' +
        Object.keys(PRESETS).map(function (k) { return '<button class="btn sm ghost" data-p="' + k + '">' + k + '</button>'; }).join('') +
        '<label><input type="checkbox" data-sort' + (sortFirst ? ' checked' : '') + '> Sort first</label></div>' +
        '<input type="text" class="mono" data-text style="width:100%" value="' + esc(text) + '" aria-label="Column values">' +
        '<div style="margin-top:12px">' + out + '</div>' +
        (cb ? '<div class="stats"><span>Uncompressed ≈ <b>' + ob + ' bits</b></span><span>Compressed ≈ <b>' + cb + ' bits</b></span><span>Ratio <b>' + ratio.toFixed(2) + '×</b></span></div>' : '') +
        (note ? '<div class="status info">' + note + '</div>' : '');
      var inp = body.querySelector('[data-text]');
      inp.addEventListener('change', function () { text = inp.value; draw(); });
    }
    body.addEventListener('click', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-s')) scheme = t.getAttribute('data-s');
      else if (t.hasAttribute('data-p')) {
        text = PRESETS[t.getAttribute('data-p')];
        var pick = { ints: 'rle', sorted: 'delta', temps: 'delta', names: 'dict', sex: 'bitmap' }[t.getAttribute('data-p')];
        if (pick) scheme = pick;
      } else if (t.hasAttribute('data-sort')) sortFirst = t.checked;
      else return;
      draw();
    });
    draw();
  };
})();
