(function () {
  'use strict';
  var esc = DBP.esc;

  function examTopics() {
    return DBP.topics.filter(function (t) { return (t.group === 'Lectures' || t.group === 'Homework') && t.quiz && t.quiz.length; });
  }

  /* ------------------------------------------------------------------ */
  /* Mock midterm                                                        */
  /* ------------------------------------------------------------------ */
  DBP.addTopic({
    id: 'mock',
    group: 'Practice',
    num: '✎',
    title: 'Mock Midterm',
    summary: 'A timed, mixed exam drawn from every chapter’s question bank, with a per-topic score breakdown and random written problems.',
    render: function (page) {
      var topics = examTopics();
      var total = topics.reduce(function (s, t) { return s + t.quiz.length; }, 0);
      page.innerHTML =
        '<div class="page-head"><div class="eyebrow">Practice</div><h1>Mock midterm</h1>' +
        '<p class="lead">Questions are drawn at random from all chapters (' + total + ' in the bank). Answer everything, then submit to see your score, explanations and which topics need another look.</p></div>' +
        '<div class="widget"><div class="widget-head"><div class="widget-title">Exam settings</div></div><div class="widget-body">' +
        '<div class="controls"><label>Questions <select data-n><option>15</option><option selected>25</option><option>40</option><option value="all">All (' + total + ')</option></select></label>' +
        '<label><input type="checkbox" data-timer checked> Timer (1 min / question)</label></div>' +
        '<div class="small muted" style="margin-bottom:6px">Topics:</div><div class="controls">' +
        topics.map(function (t) { return '<label><input type="checkbox" data-topic="' + t.id + '" checked> ' + esc(t.num + ' ' + (t.navTitle || t.title)) + '</label>'; }).join('') +
        '</div><button class="btn primary" data-start>Start exam</button></div></div>' +
        '<div data-timerbox></div><div data-exam></div>' +
        '<h2 id="written">Written problems</h2><p class="muted">Six random exam-style problems (tracing algorithms, computing sizes, explaining trade-offs). Work them out on paper first.</p>' +
        '<div class="controls"><button class="btn" data-reroll>New set of problems</button></div><div data-written></div>';

      var examBox = page.querySelector('[data-exam]');
      var timerBox = page.querySelector('[data-timerbox]');
      var timer = null;

      function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
      function start() {
        stopTimer();
        var chosen = DBP.qsa('[data-topic]', page).filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-topic'); });
        var pool = [];
        topics.forEach(function (t) {
          if (chosen.indexOf(t.id) < 0) return;
          t.quiz.forEach(function (q) { var c = Object.assign({}, q); c._topic = t.num + ' · ' + (t.navTitle || t.title); c._tid = t.id; pool.push(c); });
        });
        if (!pool.length) { examBox.innerHTML = '<div class="status warn">Pick at least one topic.</div>'; return; }
        var nSel = page.querySelector('[data-n]').value;
        var qs = DBP.shuffle(pool).slice(0, nSel === 'all' ? pool.length : +nSel);
        DBP.renderQuiz(examBox, qs, {
          mode: 'exam', showTopic: true,
          breakdown: breakdown,
          onDone: function () { stopTimer(); },
          onRetry: start
        });
        if (page.querySelector('[data-timer]').checked) {
          var left = qs.length * 60;
          var tick = function () {
            var m = Math.floor(left / 60), s = left % 60;
            timerBox.innerHTML = '<div class="status ' + (left < 60 ? 'bad' : 'info') + '" style="position:sticky;top:8px;z-index:5">Time left: <b class="mono">' + m + ':' + (s < 10 ? '0' : '') + s + '</b> — the exam is submitted automatically when time runs out.</div>';
            if (left-- <= 0) {
              stopTimer();
              var sub = examBox.querySelector('[data-submit]');
              if (sub) sub.click();
              timerBox.innerHTML = '<div class="status warn">Time is up — submitted.</div>';
            }
          };
          tick(); timer = setInterval(tick, 1000);
        } else timerBox.innerHTML = '';
        examBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      function breakdown(qs, answers) {
        var per = {};
        qs.forEach(function (q, i) {
          var p = per[q._tid] = per[q._tid] || { name: q._topic, ok: 0, n: 0 };
          p.n++; if (answers[i] === q.a) p.ok++;
        });
        var rows = Object.keys(per).map(function (id) {
          var p = per[id], pct = Math.round(100 * p.ok / p.n);
          return '<tr class="' + (pct >= 75 ? 'good' : pct < 50 ? 'bad' : '') + '"><td>' + esc(p.name) + '</td><td>' + p.ok + ' / ' + p.n + '</td><td>' + pct + '%</td><td>' + (pct < 75 ? '<a href="#/' + id + '">Review chapter →</a>' : '✓') + '</td></tr>';
        }).join('');
        return '<table><thead><tr><th>Topic</th><th>Correct</th><th>%</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
      }

      function written() {
        var all = [];
        topics.forEach(function (t) { (t.exercises || []).forEach(function (ex, i) { if (/Exam-style|Core|Challenge/.test(ex.level || '')) all.push({ topic: t, idx: i }); }); });
        DBP.renderExerciseList(page.querySelector('[data-written]'), DBP.shuffle(all).slice(0, 6));
      }

      page.querySelector('[data-start]').addEventListener('click', start);
      page.querySelector('[data-reroll]').addEventListener('click', written);
      written();
      window.addEventListener('hashchange', stopTimer, { once: true });
    }
  });

  /* ------------------------------------------------------------------ */
  /* Cheat sheet                                                          */
  /* ------------------------------------------------------------------ */
  var CS = `
<div class="page-head"><div class="eyebrow">Practice · final review</div><h1>Cheat sheet</h1>
<p class="lead">Everything on one page for the last review before the exam. Each heading links to the full chapter. Printing this page gives a clean handout.</p></div>

<h2><a href="#/relational">L1 · Relational model &amp; algebra</a></h2>
<div class="grid2">
<div class="card small"><ul>
<li><b>DBMS</b>: software to store/analyze data per a <b>data model</b>; <b>schema</b> = description of one collection of data.</li>
<li>Flat-file problems: <b>integrity</b>, <b>implementation</b>, <b>durability</b>.</li>
<li>Codd 1969: simple structures (relations), physical storage left to DBMS, high-level language.</li>
<li>Relation = <b>unordered set</b> of tuples; arity = #attributes; values atomic; NULL in every domain.</li>
<li><b>PK</b> identifies a tuple; <b>FK</b> references another relation’s tuple. Constraints are enforced on every modification.</li>
<li><b>Physical</b> data independence: change storage, not schema. <b>Logical</b>: change schema, views hide it.</li>
<li>Procedural = relational <b>algebra</b>; declarative = relational <b>calculus</b> (SQL).</li>
</ul></div>
<div class="card small">
<table class="rel" style="width:100%"><tbody>
<tr><td class="ra">σ<sub>p</sub>(R)</td><td>filter rows (WHERE)</td></tr>
<tr><td class="ra">π<sub>A</sub>(R)</td><td>pick/compute columns (SELECT DISTINCT)</td></tr>
<tr><td class="ra">∪ ∩ −</td><td>UNION / INTERSECT / EXCEPT (same attributes)</td></tr>
<tr><td class="ra">R × S</td><td>all pairs, |R|·|S| tuples</td></tr>
<tr><td class="ra">R ⋈ S</td><td>= σ<sub>θ</sub>(R × S)</td></tr>
<tr><td class="ra">ρ ← δ γ τ</td><td>rename, assign, distinct, aggregate, sort</td></tr>
</tbody></table>
<p>R ∩ S = R − (R − S). Push selections below joins.</p></div>
</div>

<h2><a href="#/sql">L2 · Modern SQL</a></h2>
<div class="grid2">
<div class="card small"><ul>
<li>SQL = DML + DDL + DCL; based on <b>bags</b>.</li>
<li>Logical order: <code>FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT</code>.</li>
<li>Non-aggregated SELECT columns must be in GROUP BY. HAVING filters groups.</li>
<li><code>LIKE</code>: <code>%</code> any substring (incl. empty), <code>_</code> exactly one char. <code>||</code> concatenates.</li>
<li>Output: <code>SELECT … INTO</code> / <code>CREATE TABLE … AS</code> (new table); <code>INSERT INTO … SELECT</code> (existing).</li>
<li><code>ORDER BY … FETCH FIRST n ROWS ONLY OFFSET m ROWS</code> (≈ LIMIT/OFFSET).</li>
</ul></div>
<div class="card small"><ul>
<li><b>Window</b>: <code>FUNC() OVER (PARTITION BY … ORDER BY …)</code> — rows are <i>not</i> collapsed. ROW_NUMBER 1,2,3,4 vs RANK 1,2,2,4. Filter on it in an outer query.</li>
<li>Nested: <code>ALL</code>, <code>ANY</code>, <code>IN</code> (= ANY), <code>EXISTS</code>. Correlated subqueries reference the outer query.</li>
<li><b>LATERAL</b>: subquery in FROM may reference preceding tables (a for-loop).</li>
<li><b>CTE</b>: <code>WITH name (cols) AS (…)</code>; <code>WITH RECURSIVE</code> = base UNION ALL step.</li>
</ul></div>
</div>

<h2><a href="#/storage">L3 · Database storage</a></h2>
<div class="grid2">
<div class="card small"><ul>
<li>Volatile (regs, cache, DRAM: byte-addressable, random) vs non-volatile (SSD, HDD, network: block-addressable, sequential). Maximize <b>sequential</b> I/O; <b>extent</b> = allocate several pages at once.</li>
<li>Page = fixed-size block with an id; hardware page (4 KB, atomic write) · OS page (4 KB) · DB page (512 B–32 KB).</li>
<li>Architectures: heap, tree, sorted (ISAM), hashing. <b>Heap file</b> = unordered pages + <b>page directory</b> (location, free space, type).</li>
<li>Page header: size, checksum, version, visibility, compression, schema, sketches.</li>
<li><b>Slotted page</b>: slot array (→) + tuples (←). <b>RID</b> = (file, page, slot); don’t rely on it.</li>
<li>Tuple = header (visibility, <b>null bitmap</b>) + data in declared order. Can denormalize (pre-join).</li>
<li>Tuple-oriented problems: fragmentation, useless I/O, random I/O.</li>
</ul></div>
<div class="card small"><ul>
<li><b>LSM</b>: PUT/DELETE → MemTable → flush SSTable (sequential); <b>compaction</b> keeps latest per key. Cons: write amplification, expensive compaction. Reads: MemTable then newest→oldest SSTable.</li>
<li><b>Index-organized</b>: tuples stored in index leaves, sorted. B+Tree pays upfront, LSM pays later.</li>
<li><b>Word alignment</b>: padding (round up) or reordering (pack, then pad).</li>
<li>FLOAT/REAL = IEEE-754 fast but inexact; NUMERIC/DECIMAL exact, slower. Timestamps = µs since epoch.</li>
<li>NULL: bitmap header (common, row stores) · special value (column stores) · per-attribute flag (wasteful).</li>
<li>Large values: overflow pages (Postgres TOAST &gt; 2 KB). External files (BFILE): no durability/transactions.</li>
<li>Catalog stored in the DB as tables; <code>INFORMATION_SCHEMA</code>.</li>
</ul></div>
</div>

<h2><a href="#/models">L4a · Storage models &amp; compression</a></h2>
<div class="grid2">
<div class="card small"><ul>
<li><b>OLTP</b>: small reads/writes, single entity → <b>NSM (row store)</b>. <b>OLAP</b>: complex reads over many tuples, few columns → <b>DSM (column store)</b>. <b>HTAP</b>: both.</li>
<li>NSM +: fast insert/update/delete, whole-tuple queries. −: scans of few attributes, locality, compression.</li>
<li>DSM +: less wasted I/O, locality, compression. −: slow point queries/inserts/updates/deletes (stitching). Tuple id: fixed-length offsets (or embedded ids).</li>
<li><b>PAX</b>: row groups → column chunks; footer meta-data (Parquet, ORC, Arrow).</li>
</ul></div>
<div class="card small"><ul>
<li>Goals: fixed-length values · <b>late materialization</b> · lossless. Granularity: block, tuple (NSM), attribute, column (DSM).</li>
<li>Naïve (LZ4, Snappy, Zstd): must decompress; no semantics.</li>
<li><b>RLE</b> (value, start, length) — sort first. <b>Bit packing</b> (+ “mostly”). <b>Bitmap</b> — low cardinality only (zip: 40 MB vs 53.75 GB). <b>Delta</b> / frame-of-reference. <b>Dictionary</b> — most used; order-preserving ⇒ range/LIKE on codes.</li>
</ul></div>
</div>

<h2><a href="#/bufferpool">L4b · Buffer pools</a></h2>
<div class="grid2">
<div class="card small"><ul>
<li>Spatial (where on disk) vs temporal (when to read/write) control.</li>
<li>Buffer pool = array of <b>frames</b>; write-back cache. <b>Page table</b> (page → frame, in memory, latched hash table) + dirty flag, <b>pin count</b>, access info. <b>Page directory</b> (page → file location) is persisted.</li>
<li><b>Locks</b>: logical contents, transactions, rollback. <b>Latches</b>: internal structures, threads, operation duration.</li>
<li>mmap problems: transaction safety (OS flushes anytime), I/O stalls, error handling (SIGBUS), performance (TLB shootdowns). madvise/mlock/msync don’t really fix it.</li>
</ul></div>
<div class="card small"><ul>
<li><b>LRU</b> (oldest timestamp) · <b>CLOCK</b> (ref bit; 1→0 move on, 0→evict) — both suffer <b>sequential flooding</b> (track when, not how often). <b>LRU-K</b>: evict largest backward K-distance (+∞ first). MySQL old/young list. <b>Localization</b> (Postgres ring buffer). <b>Priority hints</b>.</li>
<li>Clean page = drop (fast); dirty = write back (slow). Background writer; never before the log records.</li>
<li>OS reorders I/O → DBMS keeps its own queues. <b>O_DIRECT</b> bypasses OS cache. fsync errors!</li>
<li>Optimizations: multiple pools (object id / hashing), prefetching, scan sharing, buffer-pool bypass.</li>
</ul></div>
</div>

<h2><a href="#/hashing">L5 · Hash tables</a></h2>
<div class="card small">
<table><thead><tr><th>Scheme</th><th>Key idea</th><th>Remember</th></tr></thead><tbody>
<tr><td>Linear probing</td><td>one array; collision → next free slot</td><td>stop at empty slot; deletes via <b>tombstones</b> (movement: nobody does it); resize 2× by load factor</td></tr>
<tr><td>Cuckoo</td><td>2+ hash functions/tables; evict &amp; rehash</td><td>lookup/delete O(1); cycles ⇒ rebuild</td></tr>
<tr><td>Chained</td><td>linked list of bucket pages per slot</td><td>never full, chains can get long</td></tr>
<tr><td>Extendible</td><td>directory of 2<sup>gd</sup> pointers, buckets with local depth</td><td>split a full bucket; double directory only if ld = gd; 2<sup>gd−ld</sup> pointers per bucket</td></tr>
<tr><td>Linear hashing</td><td>split pointer; split the bucket <b>at the pointer</b> when any overflows</td><td>h<sub>i</sub>(k) = k mod n·2<sup>i</sup>; if h<sub>L</sub>(k) &lt; pointer use h<sub>L+1</sub></td></tr>
</tbody></table>
<p>Hash function: deterministic, fast, uniform, avalanche, no crypto. Non-unique keys: redundant keys (common) or value lists. Hash tables can’t do range scans.</p></div>

<h2><a href="#/bplustree">L6 · B+Trees</a></h2>
<div class="grid2">
<div class="card small"><ul>
<li>Index locates tuples; <b>filter</b> (Bloom) only answers membership.</li>
<li>B+Tree: balanced m-way, O(log<sub>m</sub> n); every leaf same depth; non-root ≥ half full (⌈m/2⌉−1 ≤ keys ≤ m−1); k keys ⇒ k+1 children.</li>
<li>Values only in leaves (B-Tree: everywhere). Leaves linked for scans. Leaf values: record ids (common) or tuples (index-organized; secondary → PK).</li>
<li><b>Insert</b>: split full leaf, <b>copy up</b> middle key; split inner, <b>push up</b>. Grows at the root.</li>
<li><b>Delete</b>: underflow → borrow from sibling (same parent), else merge and remove separator; can cascade.</li>
</ul></div>
<div class="card small"><ul>
<li>Composite ⟨a,b,c⟩: usable with a prefix (a; a,b; a,b,c), rarely with b or c alone.</li>
<li>Duplicates: append record id, or overflow leaves.</li>
<li>Clustered: table in key order. Unclustered scan → <b>sort RIDs by page id</b>.</li>
<li>Node size: HDD ~1 MB, SSD ~10 KB, memory ~512 B. Merge threshold (avg 69% full). Variable keys: pointers, var-length nodes, padding, key map. Intra-node: linear (SIMD), binary, interpolation.</li>
<li>Optimizations: prefix compression, dedup, suffix truncation, pointer swizzling, bulk insert (sort + bottom-up), buffered updates (B<sup>ε</sup>-tree).</li>
</ul></div>
</div>

<h2><a href="#/hw1">Homework</a></h2>
<div class="grid2">
<div class="card small"><b>Count-min sketch</b>: d × w counters, one hash per row. Insert: +1 per row. Count: <b>min</b> → never underestimates. Merge = cell-wise add (same dims &amp; seeds). TopK over candidates. Atomic <code>fetch_add</code>; rebuild hash lambdas on move.</div>
<div class="card small"><b>LRU-K replacer</b>: backward k-distance = now − k-th most recent access; +∞ if &lt; k accesses (oldest first among them); only evictable frames. <b>BPM</b>: pin count, dirty write-back before reuse, don’t hold the pool latch across I/O, guards are move-only and Drop is idempotent.</div>
</div>`;

  DBP.addTopic({
    id: 'cheatsheet',
    group: 'Practice',
    num: '≡',
    title: 'Cheat Sheet',
    summary: 'All key definitions, rules and trade-offs on one printable page for the final review.',
    render: function (page) { page.innerHTML = CS; DBP.enhance(page); }
  });
})();
