/* Relational algebra playground: editable R and S, every operator computed live. */
(function () {
  'use strict';
  var DBP = window.DBP;

  // A relation is { cols: [...], rows: [[...], ...] } with set semantics.
  function dedupe(rows) {
    var seen = {}, out = [];
    rows.forEach(function (r) { var k = JSON.stringify(r); if (!seen[k]) { seen[k] = 1; out.push(r); } });
    return out;
  }
  function has(rel, row) {
    var k = JSON.stringify(row);
    return rel.rows.some(function (r) { return JSON.stringify(r) === k; });
  }
  var RA = {
    select: function (R, pred) { return { cols: R.cols, rows: R.rows.filter(function (r) { return pred(rowObj(R, r)); }) }; },
    project: function (R, exprs) {
      return {
        cols: exprs.map(function (e) { return e.name; }),
        rows: dedupe(R.rows.map(function (r) { var o = rowObj(R, r); return exprs.map(function (e) { return e.fn(o); }); }))
      };
    },
    union: function (R, S) { return { cols: R.cols, rows: dedupe(R.rows.concat(S.rows)) }; },
    intersect: function (R, S) { return { cols: R.cols, rows: R.rows.filter(function (r) { return has(S, r); }) }; },
    minus: function (R, S) { return { cols: R.cols, rows: R.rows.filter(function (r) { return !has(S, r); }) }; },
    product: function (R, S, rn, sn) {
      var cols = R.cols.map(function (c) { return rn + '.' + c; }).concat(S.cols.map(function (c) { return sn + '.' + c; }));
      var rows = [];
      R.rows.forEach(function (r) { S.rows.forEach(function (s) { rows.push(r.concat(s)); }); });
      return { cols: cols, rows: rows };
    },
    naturalJoin: function (R, S) {
      var common = R.cols.filter(function (c) { return S.cols.indexOf(c) >= 0; });
      var extra = S.cols.filter(function (c) { return common.indexOf(c) < 0; });
      var rows = [];
      R.rows.forEach(function (r) {
        var ro = rowObj(R, r);
        S.rows.forEach(function (s) {
          var so = rowObj(S, s);
          if (common.every(function (c) { return ro[c] === so[c]; })) rows.push(r.concat(extra.map(function (c) { return so[c]; })));
        });
      });
      return { cols: R.cols.concat(extra), rows: dedupe(rows) };
    }
  };
  DBP.logic.RA = RA;

  function rowObj(R, r) { var o = {}; R.cols.forEach(function (c, i) { o[c] = r[i]; }); return o; }

  function parseRel(text) {
    var rows = [];
    text.split('\n').forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var parts = line.split(',').map(function (s) { return s.trim(); });
      var a = parts[0] || '', b = parts[1] === undefined ? '' : parts[1];
      var bn = Number(b);
      rows.push([a, b !== '' && !isNaN(bn) ? bn : b]);
    });
    return { cols: ['a_id', 'b_id'], rows: dedupe(rows) };
  }

  function tableHTML(name, R, hlFn) {
    var h = '<div><div class="small muted" style="margin-bottom:4px">' + name + ' <span class="pill">' + R.rows.length + ' tuple' + (R.rows.length === 1 ? '' : 's') + '</span></div>' +
      '<table class="rel"><thead><tr>' + R.cols.map(function (c) { return '<th>' + DBP.esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    if (!R.rows.length) h += '<tr><td colspan="' + R.cols.length + '" class="muted">∅ (empty)</td></tr>';
    R.rows.forEach(function (r) {
      h += '<tr' + (hlFn && hlFn(r) ? ' class="hl"' : '') + '>' + r.map(function (v) { return '<td>' + DBP.esc(v) + '</td>'; }).join('') + '</tr>';
    });
    return h + '</tbody></table></div>';
  }

  var OPS = [
    { id: 'sel', ra: 'σ<sub>a_id=\'a2\'</sub>(R)', sql: "SELECT * FROM R\n WHERE a_id = 'a2';",
      note: 'Selection keeps the tuples that satisfy the predicate. It never changes the columns.',
      run: function (R) { return RA.select(R, function (t) { return t.a_id === 'a2'; }); } },
    { id: 'sel2', ra: 'σ<sub>a_id=\'a2\' ∧ b_id&gt;102</sub>(R)', sql: "SELECT * FROM R\n WHERE a_id = 'a2' AND b_id > 102;",
      note: 'Predicates can be combined with ∧ (AND) and ∨ (OR).',
      run: function (R) { return RA.select(R, function (t) { return t.a_id === 'a2' && t.b_id > 102; }); } },
    { id: 'proj', ra: 'π<sub>b_id−100, a_id</sub>(σ<sub>a_id=\'a2\'</sub>(R))', sql: "SELECT DISTINCT b_id - 100, a_id\n  FROM R WHERE a_id = 'a2';",
      note: 'Projection keeps only the listed attributes — and may reorder them or compute derived values. In set semantics duplicates disappear (hence DISTINCT in SQL).',
      run: function (R) { return RA.project(RA.select(R, function (t) { return t.a_id === 'a2'; }), [{ name: 'b_id-100', fn: function (t) { return typeof t.b_id === 'number' ? t.b_id - 100 : t.b_id; } }, { name: 'a_id', fn: function (t) { return t.a_id; } }]); } },
    { id: 'union', ra: 'R ∪ S', sql: 'SELECT * FROM R\nUNION\nSELECT * FROM S;',
      note: 'Union: tuples in either input (or both). Duplicates are removed. Inputs must have the same attributes.',
      run: function (R, S) { return RA.union(R, S); } },
    { id: 'inter', ra: 'R ∩ S', sql: 'SELECT * FROM R\nINTERSECT\nSELECT * FROM S;',
      note: 'Intersection: only tuples that appear in both inputs.',
      run: function (R, S) { return RA.intersect(R, S); } },
    { id: 'minus', ra: 'R − S', sql: 'SELECT * FROM R\nEXCEPT\nSELECT * FROM S;',
      note: 'Difference: tuples in the first input but not in the second. Order matters: R − S ≠ S − R.',
      run: function (R, S) { return RA.minus(R, S); } },
    { id: 'prod', ra: 'R × S', sql: 'SELECT * FROM R CROSS JOIN S;',
      note: 'Cartesian product: every tuple of R paired with every tuple of S. |R × S| = |R| · |S| and the output has all attributes of both inputs.',
      run: function (R, S) { return RA.product(R, S, 'R', 'S'); } },
    { id: 'join', ra: 'R ⋈ S', sql: 'SELECT * FROM R NATURAL JOIN S;\n-- = ... JOIN S USING (a_id, b_id)',
      note: 'Natural join: combine tuples that agree on all common attributes (here a_id and b_id), keeping each common attribute once.',
      run: function (R, S) { return RA.naturalJoin(R, S); } }
  ];

  DBP.sims.raPlayground = function (el) {
    var body = DBP.widget(el, 'Relational algebra playground', 'interactive');
    body.innerHTML =
      '<p class="small muted">Edit the two relations (one tuple per line, <code>a_id, b_id</code>), then pick an operator. The result is recomputed from your data, so you can test edge cases such as duplicates or empty inputs.</p>' +
      '<div class="grid2">' +
      '<label class="small">Relation <b>R(a_id, b_id)</b><textarea class="mono" rows="5" data-r style="width:100%;display:block;margin-top:4px">a1, 101\na2, 102\na3, 103</textarea></label>' +
      '<label class="small">Relation <b>S(a_id, b_id)</b><textarea class="mono" rows="5" data-s style="width:100%;display:block;margin-top:4px">a3, 103\na4, 104\na5, 105</textarea></label>' +
      '</div>' +
      '<div class="controls" data-ops>' + OPS.map(function (o, i) {
        return '<button type="button" class="btn sm' + (i === 0 ? ' on' : '') + '" data-op="' + o.id + '"><span class="ra">' + o.ra + '</span></button>';
      }).join('') + '</div>' +
      '<div data-out></div>';

    var cur = OPS[0];
    var taR = body.querySelector('[data-r]'), taS = body.querySelector('[data-s]');
    var out = body.querySelector('[data-out]');

    function draw() {
      var R = parseRel(taR.value), S = parseRel(taS.value);
      var res = cur.run(R, S);
      var binary = /union|inter|minus|prod|join/.test(cur.id);
      var inR = function (r) { return res.rows.some(function (x) { return JSON.stringify(x.slice(0, 2)) === JSON.stringify(r); }); };
      out.innerHTML =
        '<div class="flex" style="gap:22px">' +
        tableHTML('R', R, cur.id === 'prod' ? null : inR) +
        (binary ? tableHTML('S', S, cur.id === 'prod' ? null : function (r) {
          if (cur.id === 'minus') return false;
          return res.rows.some(function (x) { return JSON.stringify(x.slice(0, 2)) === JSON.stringify(r); });
        }) : '') +
        '<div style="align-self:center;font-size:22px;color:var(--muted)">→</div>' +
        tableHTML('<span class="ra">' + cur.ra + '</span>', res) +
        '</div>' +
        '<div class="grid2" style="margin-top:12px"><div class="status info" style="margin:0">' + cur.note + '</div>' +
        '<pre class="sql" style="margin:0">' + DBP.esc(cur.sql) + '</pre></div>';
      DBP.enhance(out);
    }

    body.querySelector('[data-ops]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-op]');
      if (!b) return;
      cur = OPS.filter(function (o) { return o.id === b.getAttribute('data-op'); })[0];
      DBP.qsa('[data-op]', body).forEach(function (x) { x.classList.toggle('on', x === b); });
      draw();
    });
    taR.addEventListener('input', draw);
    taS.addEventListener('input', draw);
    draw();
  };
})();
