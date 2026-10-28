(function () {
  'use strict';
  function marker(id, cls) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="' + (cls || 'arrowhead') + '"/></marker></defs>';
  }

  var cmsDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 210" width="640" role="img" aria-label="Count-min sketch: item x is hashed by d hash functions, one per row, and each row increments one counter">
${marker('l8a', 'arrowhead-a')}
<rect x="20" y="88" width="80" height="36" rx="6" class="bxv"/><text x="60" y="111" text-anchor="middle" class="m b">x</text>
<text x="120" y="56" class="m">h0(x)</text><text x="120" y="116" class="m">h1(x)</text><text x="120" y="176" class="m">h2(x)</text>
<g>
${[0, 1, 2].map(function (r) {
    var y = 34 + r * 60, cols = [2, 0, 3];
    var s = '<text x="200" y="' + (y + 22) + '" class="s">row ' + r + '</text>';
    for (var c = 0; c < 6; c++) {
      var on = c === cols[r];
      s += '<rect x="' + (250 + c * 60) + '" y="' + y + '" width="56" height="34" rx="3" class="' + (on ? 'bxa' : 'bx') + '"/><text x="' + (278 + c * 60) + '" y="' + (y + 22) + '" text-anchor="middle" class="m' + (on ? ' b' : '') + '">' + (on ? '+1' : '') + '</text>';
    }
    return s;
  }).join('')}
</g>
<path d="M100 100 C150 60 220 51 368 51" class="lna" marker-end="url(#l8a)"/>
<path d="M100 106 C160 110 200 111 248 111" class="lna" marker-end="url(#l8a)"/>
<path d="M100 112 C150 170 300 171 428 171" class="lna" marker-end="url(#l8a)"/>
<text x="250" y="22" class="s">w columns</text>
</svg>
<figcaption>Insert(x) adds 1 to one counter per row. Count(x) reads the same d counters and returns the minimum.</figcaption>
</figure>`;

  DBP.addTopic({
    id: 'hw1',
    group: 'Homework',
    num: 'HW1',
    title: 'Count-Min Sketch (& Bloom Filters)',
    navTitle: 'Count-Min Sketch',
    summary: 'Approximate frequency counting in fixed memory: insert, count, merge, TopK — plus the Bloom filter from Lecture 6.',
    lead: 'Homework 1 asked you to build a thread-safe count-min sketch. Here is the concept, a simulator matching the handout’s worked example, and the C++ pitfalls the grader looked for.',
    source: 'Homework 1 handout; Lecture 6 (indexes vs. filters)',
    sections: [
      {
        id: 'problem', title: 'The problem',
        body: `
<p>A database constantly needs to answer “<b>how often does this value occur?</b>”: the query optimizer uses it to estimate how many rows a predicate keeps (selectivity), and caches use it to decide what is worth keeping in memory. An exact counter per distinct value costs memory proportional to the number of distinct values — unaffordable on a real workload.</p>
<p>A <b>count-min sketch</b> trades exactness for space. It answers the same question with a <b>fixed amount of memory chosen up front</b>, and its error goes in only one direction: the answer is <b>never too small, only sometimes too large</b>.</p>`
      },
      {
        id: 'how', title: 'How it works',
        body: `
<p>The sketch is a matrix of counters with <b>width w</b> (columns) and <b>depth d</b> (rows), plus <b>d independent hash functions</b>, one per row. Row <i>i</i> uses h<sub>i</sub>, which maps any item to a column in [0, w).</p>
${cmsDiag}
<table><thead><tr><th>Operation</th><th>What it does</th><th>Cost</th></tr></thead><tbody>
<tr><td><code>Insert(x)</code></td><td>For every row i, add 1 to the counter at column h<sub>i</sub>(x)</td><td>d increments</td></tr>
<tr><td><code>Count(x)</code></td><td>Read the same d counters, return the <b>smallest</b></td><td>d reads</td></tr>
<tr><td><code>Merge(other)</code></td><td>Same dimensions and same hash seeds ⇒ every cell means the same thing ⇒ add cell by cell</td><td>w · d additions</td></tr>
<tr><td><code>TopK(k, candidates)</code></td><td>The sketch never stores items, so it can’t list them: estimate each <i>candidate</i>, return the k largest, descending</td><td>|candidates| · d</td></tr>
<tr><td><code>Clear()</code></td><td>Reset every counter to 0; the sketch remains usable</td><td>w · d</td></tr>
</tbody></table>
<div class="callout key"><span class="ct">Why the minimum?</span><p>Two different items may collide in one row, which makes that row’s counter too big. They are unlikely to collide in <i>every</i> row, so the minimum is the tightest upper bound available. Every counter for x is at least the true count of x (collisions only add), so <b>Count(x) ≥ true count</b> — always.</p><p>More columns (w) ⇒ fewer collisions per row. More rows (d) ⇒ less chance that <i>all</i> rows collide at once.</p></div>
<details class="more"><summary>Background: the formal guarantee (beyond the homework)</summary>
<p>With w = ⌈e/ε⌉ and d = ⌈ln(1/δ)⌉, after N insertions: Count(x) ≤ true(x) + ε·N with probability at least 1 − δ. So the width controls <i>how big</i> the error can be, and the depth controls <i>how likely</i> it is to exceed that bound.</p></details>`
      },
      {
        id: 'example', title: 'The worked example from the handout',
        body: `
<p>w = 4, d = 3, stream <code>["orders", "users", "orders", "items", "orders", "users"]</code>, with these hash values:</p>
<table style="width:auto"><thead><tr><th>item</th><th>h0</th><th>h1</th><th>h2</th></tr></thead><tbody>
<tr><td>"orders"</td><td>2</td><td>0</td><td>3</td></tr><tr><td>"users"</td><td>2</td><td>1</td><td>1</td></tr><tr><td>"items"</td><td>1</td><td>0</td><td>2</td></tr><tr><td>"carts"</td><td>2</td><td>1</td><td>3</td></tr>
</tbody></table>
<div class="grid2">
<div><div class="small muted">After the whole stream</div>
<table class="rel"><thead><tr><th></th><th>0</th><th>1</th><th>2</th><th>3</th></tr></thead><tbody>
<tr><th>row 0</th><td>0</td><td>1</td><td class="hl">5</td><td>0</td></tr>
<tr><th>row 1</th><td class="hl">4</td><td>2</td><td>0</td><td>0</td></tr>
<tr><th>row 2</th><td>0</td><td>2</td><td>1</td><td class="good">3</td></tr></tbody></table></div>
<table><thead><tr><th>query</th><th>cells</th><th>est.</th><th>truth</th></tr></thead><tbody>
<tr><td>Count("orders")</td><td>5, 4, 3</td><td>3</td><td>3 ✓</td></tr>
<tr><td>Count("users")</td><td>5, 2, 2</td><td>2</td><td>2 ✓</td></tr>
<tr><td>Count("items")</td><td>1, 4, 1</td><td>1</td><td>1 ✓</td></tr>
<tr class="bad"><td>Count("carts")</td><td>5, 2, 3</td><td>2</td><td>0 ✗</td></tr></tbody></table>
</div>
<p>Row 0 says 5 for “orders” only because “users” also hashes to column 2 there; row 1 says 4 because “items” shares column 0. Row 2 happened to be collision-free and decides the answer. “carts” was <b>never inserted</b>, yet every cell it hashes to was pushed up by someone else, so the sketch reports 2 — the price of the fixed memory budget. With realistic w and d this almost never happens; with w = 4 it happens all the time.</p>
<div data-sim="countMin" data-opts='{"mode":"hw"}'></div>`
      },
      {
        id: 'impl', title: 'Implementation notes (what the grader checked)',
        body: `
<p>The interface: <code>CountMinSketch(width, depth)</code> (throws <code>std::invalid_argument</code> if either is 0), move-only (no copy), <code>Insert</code>, <code>Count</code> (const), <code>Clear</code>, <code>Merge</code> (throws on dimension mismatch and leaves <code>other</code> unchanged), <code>TopK</code> (descending, capped at <code>candidates.size()</code>).</p>
<h3>1. Concurrency: only Insert must be thread-safe — and fast</h3>
<p>Wrapping Insert in one global <code>std::mutex</code> is <i>correct</i> but serializes all threads (the grader measured exactly that as the baseline). The intended solution makes each counter a <code>std::atomic&lt;uint32_t&gt;</code> and increments it with <code>fetch_add</code>: different threads touching different counters never block each other, and concurrent increments of the same counter are never lost.</p>
<pre>// Idea, not the full solution:
for (uint32_t row = 0; row &lt; depth_; ++row) {
  size_t col = hash_functions_[row](item);
  counters_[row * width_ + col].fetch_add(1, std::memory_order_relaxed);
}</pre>
<p class="small muted">The test “8 threads × 1000 Insert("hot") ⇒ Count("hot") == 8000 exactly” fails with plain <code>uint32_t</code> counters: <code>++x</code> is a read-modify-write, so two threads can read the same old value and one increment is lost.</p>
<h3>2. Moves: watch what the hash lambdas capture</h3>
<p>The provided <code>HashFunction(seed)</code> returns a lambda capturing <b><code>this</code></b> (it needs <code>width_</code>). If the move constructor simply moves <code>hash_functions_</code> from <code>other</code>, the new object’s lambdas still point at the <b>old</b> object — whose width was reset or which may already be destroyed: wrong answers or use-after-free. Fix: take over the counters, but <b>rebuild</b> <code>hash_functions_</code> for the new object (same seeds). In move assignment also handle self-assignment.</p>
<h3>3. Memory safety</h3>
<p>The suite was re-run under AddressSanitizer/LeakSanitizer. Use <code>std::vector</code> / <code>std::unique_ptr</code> (note that <code>std::atomic</code> is not copyable or movable, so a <code>std::vector&lt;std::atomic&lt;uint32_t&gt;&gt;</code> must be sized once at construction, or use <code>std::unique_ptr&lt;std::atomic&lt;uint32_t&gt;[]&gt;</code>).</p>
<div class="callout exam"><span class="ct">Concepts this homework connects to</span><ul>
<li>Hash functions (Lecture 5): deterministic, seeded, fast, uniformly distributed.</li>
<li>Latches vs. atomics (Lecture 4): protect shared in-memory state from other <i>threads</i>.</li>
<li>Filters vs. indexes (Lecture 6): a sketch, like a Bloom filter, summarizes data without being able to locate it.</li></ul></div>`
      },
      {
        id: 'bloom', title: 'Bloom filters',
        body: `
<p>Lecture 6 contrasts <b>indexes</b> with <b>filters</b>. A <b>Bloom filter</b> is the classic filter: a probabilistic structure that answers set-membership queries (“is key k in the set?”).</p>
<ul>
<li>A bit array of <b>m</b> bits and <b>k</b> hash functions.</li>
<li><b>Insert(x)</b>: set the k bits h<sub>1</sub>(x), …, h<sub>k</sub>(x) to 1.</li>
<li><b>Lookup(x)</b>: if any of the k bits is 0 → x is <b>definitely not</b> in the set. If all are 1 → x is <b>probably</b> in the set (could be a <b>false positive</b>).</li>
<li><b>Never false negatives.</b> Plain Bloom filters do not support deletes (clearing a bit could remove other keys).</li>
</ul>
<p>Same flavour of one-sided error as the count-min sketch — a count-min sketch with counters instead of bits is a “counting” cousin. DBMSs use Bloom filters to skip work: e.g. an LSM tree keeps one per SSTable so a GET can skip files that definitely don’t contain the key, and hash joins use them to drop probe tuples early.</p>
<div data-sim="bloom"></div>`
      }
    ],
    exercises: [
      {
        level: 'Core', title: 'Compute a sketch by hand',
        q: '<p>A sketch has w = 4, d = 2. h0: a→1, b→3, c→1. h1: a→0, b→0, c→2. Insert a, b, a, c, a. (a) Draw the matrix. (b) Count(a), Count(b), Count(c) — which are exact? (c) An item z has h0(z) = 3, h1(z) = 2 and was never inserted. What is Count(z)?</p>',
        a: '<p>(a) Row 0: col 1 = a×3 + c×1 = 4, col 3 = b = 1 → <code>[0, 4, 0, 1]</code>. Row 1: col 0 = a×3 + b = 4, col 2 = c = 1 → <code>[4, 0, 1, 0]</code>.</p><p>(b) Count(a) = min(4, 4) = <b>4</b> (truth 3 — overestimate: a collides with c in row 0 and with b in row 1). Count(b) = min(1, 4) = <b>1</b> ✓. Count(c) = min(4, 1) = <b>1</b> ✓.</p><p>(c) min(row0[3] = 1, row1[2] = 1) = <b>1</b>, although z was never inserted.</p>'
      },
      {
        level: 'Concept', title: 'One-sided error',
        q: '<p>Prove that Count(x) can never be smaller than the true number of times x was inserted. Why does the same argument fail if the sketch supported deletes with negative increments and we took the minimum?</p>',
        a: '<p>Each insertion of x adds 1 to every one of x’s d counters, and other items can only add more. So each of x’s counters ≥ true(x), and so is their minimum.</p><p>With deletes, each of x’s counters equals true(x) + (net count of the items colliding with x in that row). If every item is deleted at most as often as it was inserted, those net counts are ≥ 0 and the bound still holds. But if the stream may delete items that were never inserted, colliding items contribute <i>negative</i> amounts, a counter can drop below true(x), and the minimum can underestimate. (That “general turnstile” setting typically uses the median of the counters instead.)</p>'
      },
      {
        level: 'Core', title: 'Merge',
        q: '<p>Two threads each built a sketch: A has “index” ×2, B has “index” ×1 and “join” ×1. After <code>A.Merge(B)</code>, what are A.Count("index"), A.Count("join") and B.Count("index")? When must Merge throw?</p>',
        a: '<p>A.Count("index") = <b>3</b>, A.Count("join") = <b>1</b> (assuming no collisions), and B is unchanged: B.Count("index") = <b>1</b>. Merging is cell-by-cell addition, which is only meaningful if both sketches have the same width, depth and hash seeds; on a dimension mismatch (e.g. 256×8 vs 257×8) it throws <code>std::invalid_argument</code>.</p>'
      },
      {
        level: 'Core', title: 'TopK',
        q: '<p>After inserting “select” ×9, “insert” ×5, “delete” ×1 into a large sketch, what is <code>TopK(2, {"delete", "insert", "select"})</code>? <code>TopK(5, {"select"})</code>? <code>TopK(0, {"select"})</code>?</p>',
        a: '<p><code>[("select", 9), ("insert", 5)]</code> — estimates sorted descending, first k. <code>TopK(5, {"select"})</code> = <code>[("select", 9)]</code> — the result is capped at <code>candidates.size()</code>. <code>TopK(0, …)</code> = empty vector.</p>'
      },
      {
        level: 'Concept', title: 'Choosing w and d',
        q: '<p>Your sketch overestimates too often. Should you increase w or d? What does each one buy you?</p>',
        a: '<p><b>Increase w</b> to reduce the <i>size</i> of the error: more columns ⇒ fewer items share a counter in each row. <b>Increase d</b> to reduce the <i>probability</i> that every row has a collision for the item. (Formally ε ≈ e/w, δ ≈ e<sup>−d</sup>.) Both cost memory (w·d counters) and d also costs time per Insert/Count.</p>'
      },
      {
        level: 'Concept', title: 'The move bug',
        q: '<p>Explain the most common bug in the move constructor of HW1 and how to fix it.</p>',
        a: '<p>The hash functions are lambdas that capture <code>this</code> to read <code>width_</code>. Moving <code>hash_functions_</code> from <code>other</code> copies lambdas that still refer to <code>other</code>. After the move, <code>other</code> may be reset or destroyed, so the new sketch computes columns with the wrong width or reads freed memory (ASan: use-after-free). Fix: move the counters and copy width/depth, then <b>regenerate</b> <code>hash_functions_</code> with <code>HashFunction(seed)</code> for the new object.</p>'
      },
      {
        level: 'Core', title: 'Bloom filter',
        q: '<p>A Bloom filter returns “maybe present” for key k. Can k still be absent? If it returns “not present”, can k be present? Why can’t you delete from a plain Bloom filter?</p>',
        a: '<p>“Maybe present” can be a <b>false positive</b>: all of k’s bits were set by other keys. “Not present” is always correct: inserting k would have set all its bits, so a 0 bit proves k was never inserted (no false negatives). Deleting by clearing k’s bits might clear a bit that another key also needs, creating false negatives — so plain Bloom filters don’t support deletes.</p>'
      }
    ],
    quiz: [
      { q: 'Count(x) in a count-min sketch returns…', o: ['the sum of x’s counters', 'the maximum of x’s counters', 'the minimum of x’s counters', 'the average of x’s counters'], a: 2, e: 'Collisions only inflate counters, so the minimum is the tightest upper bound.' },
      { q: 'A count-min sketch’s error is…', o: ['two-sided', 'only overestimates (never too small)', 'only underestimates', 'always zero'], a: 1, e: 'Count(x) ≥ true(x), always.' },
      { q: 'Increasing the width w mainly…', o: ['reduces collisions in each row', 'reduces the number of hash functions', 'makes Insert thread-safe', 'allows enumerating items'], a: 0, e: 'More columns per row ⇒ fewer items share a counter.' },
      { q: 'Merging two sketches requires…', o: ['nothing — any sketches can be merged', 'the same dimensions and the same hash seeds', 'the same items', 'sorting the counters'], a: 1, e: 'Only then does each cell mean the same thing in both sketches.' },
      { q: 'Why does TopK need a list of candidates?', o: ['For speed only', 'The sketch never stores the items themselves', 'To avoid overestimates', 'Because counters are atomic'], a: 1, e: 'It can only estimate counts for items you name.' },
      { q: 'The cheapest correct way to make Insert scale across threads is…', o: ['one global mutex', 'atomic counters with fetch_add', 'no synchronization', 'a reader-writer lock around the matrix'], a: 1, e: 'Fine-grained atomics avoid serializing all inserts.' },
      { q: 'A Bloom filter can produce…', o: ['false negatives only', 'false positives only', 'both', 'neither'], a: 1, e: 'All bits set may be a coincidence; a zero bit is proof of absence.' },
      { q: 'Lecture 6: an index differs from a filter because an index…', o: ['is probabilistic', 'tells you where the record is', 'only works on integers', 'cannot be updated'], a: 1, e: 'Filters only answer membership; indexes locate tuples.' }
    ]
  });
})();
