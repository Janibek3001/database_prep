(function () {
  'use strict';
  var BPTree = DBP.logic.BPTree;
  function tree(m, keys, dels) {
    var t = new BPTree(m);
    keys.forEach(function (k) { t.insert(k); });
    (dels || []).forEach(function (k) { t.remove(k); });
    return t;
  }
  function fig(t, caption, hl) {
    return '<figure class="diagram">' + DBP.renderBPTree(t, hl) + (caption ? '<figcaption>' + caption + '</figcaption>' : '') + '</figure>';
  }
  function marker(id, cls) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="' + (cls || 'arrowhead') + '"/></marker></defs>';
  }
  var PRE = [5, 9, 13, 20, 1, 3, 7, 15, 17, 25, 30];

  var leafDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 170" width="640" role="img" aria-label="B+Tree leaf node layout: header with level, slots, prev and next, then sorted keys and values">
${marker('l7l')}
<rect x="20" y="20" width="600" height="34" class="bx2"/>
<text x="40" y="42" class="m">level=0</text><text x="150" y="42" class="m">slots=4</text><text x="260" y="42" class="m">prev ◀</text><text x="370" y="42" class="m">next ▶</text><text x="470" y="42" class="s">page header</text>
<rect x="20" y="62" width="600" height="34" class="bxa"/>
<text x="34" y="84" class="s">sorted keys</text>
<text x="160" y="84" class="m">K1</text><text x="240" y="84" class="m">K2</text><text x="320" y="84" class="m">K3</text><text x="400" y="84" class="m">K4</text><text x="480" y="84" class="s">(free)</text>
<rect x="20" y="104" width="600" height="34" class="bxg"/>
<text x="34" y="126" class="s">values</text>
<text x="160" y="126" class="m">¤1</text><text x="240" y="126" class="m">¤2</text><text x="320" y="126" class="m">¤3</text><text x="400" y="126" class="m">¤4</text><text x="480" y="126" class="s">(free)</text>
<text x="20" y="160" class="s">Keys and values are kept in separate arrays so a binary search over the keys stays cache-friendly; ¤i belongs to Ki.</text>
</svg>
</figure>`;

  var pageSort = `
<figure class="diagram">
<svg viewBox="0 0 640 170" width="640" role="img" aria-label="Unclustered index scan: record ids point to pages in random order; sorting by page id reads each page once">
${marker('l7p')}
<text x="20" y="20" class="b">Leaf entries in key order → record ids</text>
<g class="m">
<rect x="20" y="30" width="60" height="28" class="bxa"/><text x="50" y="49" text-anchor="middle" class="m">p3</text>
<rect x="84" y="30" width="60" height="28" class="bxa"/><text x="114" y="49" text-anchor="middle" class="m">p1</text>
<rect x="148" y="30" width="60" height="28" class="bxa"/><text x="178" y="49" text-anchor="middle" class="m">p3</text>
<rect x="212" y="30" width="60" height="28" class="bxa"/><text x="242" y="49" text-anchor="middle" class="m">p2</text>
<rect x="276" y="30" width="60" height="28" class="bxa"/><text x="306" y="49" text-anchor="middle" class="m">p1</text>
<rect x="340" y="30" width="60" height="28" class="bxa"/><text x="370" y="49" text-anchor="middle" class="m">p2</text>
</g>
<text x="420" y="49" class="s r">naïve: 6 page reads (re-reads p1, p2, p3)</text>
<path d="M210 64 V96" class="ln" marker-end="url(#l7p)"/><text x="220" y="86" class="s">collect record ids, sort by page id</text>
<rect x="20" y="104" width="120" height="28" class="bxg"/><text x="80" y="123" text-anchor="middle" class="m">p1 (2 tuples)</text>
<rect x="148" y="104" width="120" height="28" class="bxg"/><text x="208" y="123" text-anchor="middle" class="m">p2 (2 tuples)</text>
<rect x="276" y="104" width="120" height="28" class="bxg"/><text x="336" y="123" text-anchor="middle" class="m">p3 (2 tuples)</text>
<text x="420" y="123" class="s g">sorted: 3 page reads, each page once</text>
</svg>
</figure>`;

  DBP.addTopic({
    id: 'bplustree',
    group: 'Lectures',
    num: 'L6',
    title: 'B+Tree Indexes',
    summary: 'Indexes vs filters, B+Tree properties, insert (split) and delete (borrow/merge), composite and clustered indexes, design choices and optimizations.',
    lead: 'The B+Tree is (almost) always a good choice for a DBMS index: ordered, balanced, and built for reading and writing big blocks of data.',
    source: 'Lecture 6 slides; textbook 14.1–14.4',
    sections: [
      {
        id: 'index-filter', title: 'Indexes vs. filters',
        body: `
<div class="grid2">
<div class="callout def" style="margin:0"><span class="ct">Index</span><p>Organizes and/or sorts a subset of a table’s attributes to <b>locate specific tuples</b> using those attributes. Example: <b>B+Tree</b>.</p></div>
<div class="callout def" style="margin:0"><span class="ct">Filter</span><p>Answers <b>set-membership</b> queries: whether a record (likely) exists for a key — but <b>not where</b> it is. Example: <b>Bloom filter</b> (see the Count-Min Sketch chapter for a demo).</p></div>
</div>
<p>The term “B-Tree” names a specific structure but also the whole family of balanced trees: B-Tree (1970), <b>B+Tree (1973)</b>, B*Tree (1977?), B<sup>link</sup>-Tree (1981), B<sup>ε</sup>-Tree (2003), Bw-Tree (2013).</p>`
      },
      {
        id: 'properties', title: 'B+Tree properties and nodes',
        body: `
<p>A <b>B+Tree</b> is a self-balancing, ordered <b>m-way</b> tree that allows searches, sequential access, insertions and deletions in <b>O(log<sub>m</sub> n)</b>, where <i>m</i> is the tree’s <b>fanout</b>.</p>
<div class="callout key"><span class="ct">The four properties</span><ol>
<li><b>Perfectly balanced</b>: every leaf node is at the same depth.</li>
<li>Every node other than the root is <b>at least half-full</b>: ⌈m/2⌉ − 1 ≤ #keys ≤ m − 1.</li>
<li>Every inner node with <i>k</i> keys has <b>k + 1 non-null children</b>.</li>
<li>Optimized for reading/writing <b>large data blocks</b> (pages).</li></ol>
<p class="small">Some implementations relax these; we ignore that for now.</p></div>
${fig(tree(4, PRE), 'A B+Tree of order m = 4 (at most 3 keys and 4 children per node). Inner nodes (blue) only route; leaves (green) hold all keys and are linked by sibling pointers.')}
<h3>Nodes</h3>
<p>Every node is an array of key/value pairs, usually kept in <b>sorted key order</b>:</p>
<ul>
<li>The <b>keys</b> come from the attribute(s) the index is built on.</li>
<li>The <b>values</b> differ: in <b>inner nodes</b> they are pointers to child nodes; in <b>leaf nodes</b> they are the data entries.</li>
<li>NULL keys are stored all together in either the first or the last leaf node.</li>
</ul>
${leafDiag}
<h3>Leaf node values</h3>
<div class="grid2">
<div class="card"><h4>Approach #1: Record IDs</h4><p class="small">A pointer to the location of the tuple the entry corresponds to. <b>Most common.</b></p></div>
<div class="card"><h4>Approach #2: Tuple data</h4><p class="small">Index-organized storage (Lecture 3). The <b>primary key index</b> stores the tuple contents in its leaves; <b>secondary indexes</b> store the tuple’s <b>primary key</b> as their value.</p></div>
</div>
<h3>B-Tree vs. B+Tree</h3>
<table><thead><tr><th>Original B-Tree (1971)</th><th>B+Tree</th></tr></thead><tbody>
<tr><td>Stores keys <b>and values in all nodes</b> of the tree</td><td>Stores values <b>only in leaf nodes</b>; inner nodes only guide the search</td></tr>
<tr><td>More space-efficient: each key appears only once</td><td>Keys may appear twice (as a separator in an inner node and in a leaf)</td></tr>
<tr><td>Sequential scan must jump around the tree</td><td>Sequential scan just walks the linked leaves</td></tr>
</tbody></table>`
      },
      {
        id: 'insert', title: 'Insert: splitting nodes',
        body: `
<ol>
<li>Find the correct leaf node <i>L</i>.</li>
<li>Insert the data entry into <i>L</i> in sorted order.</li>
<li>If <i>L</i> has enough space, done!</li>
<li>Otherwise <b>split</b> <i>L</i> into <i>L</i> and a new node <i>L<sub>2</sub></i>:
<ul><li>Redistribute entries evenly and <b>copy up</b> the middle key (the first key of <i>L<sub>2</sub></i>).</li><li>Insert an index entry pointing to <i>L<sub>2</sub></i> into the parent of <i>L</i>.</li></ul></li>
<li>To split an <b>inner</b> node, redistribute entries evenly, but <b>push up</b> the middle key.</li>
</ol>
<div class="grid2">
<div class="callout key" style="margin:0"><span class="ct">Copy up (leaf split)</span><p>The middle key goes to the parent <b>and stays</b> in the leaf — every key must remain in a leaf, because leaves hold the data.</p></div>
<div class="callout key" style="margin:0"><span class="ct">Push up (inner split)</span><p>The middle key <b>moves</b> to the parent and is removed from both halves — inner keys are only routing information.</p></div>
</div>
<p>Splits can cascade up to the root. When the root splits, a new root is created and the tree grows one level — the only way a B+Tree gets taller, which is why all leaves stay at the same depth.</p>
<h4>Example (m = 4): insert 10, 20, 30, 40</h4>
${fig(tree(4, [10, 20, 30]), 'Before: one leaf, full with 3 keys.')}
${fig(tree(4, [10, 20, 30, 40]), 'After inserting 40: the leaf [10,20,30,40] overflows, splits into [10,20] and [30,40], and 30 is copied up into a new root.')}
<div data-sim="bplustree" data-opts='{"m":4}'></div>
<p class="small muted">Split convention used here (as in the textbook): an overflowing leaf with n keys keeps the first ⌈n/2⌉ and moves the rest to the new node. Other conventions put the extra key on the right — both are fine on an exam as long as you are consistent.</p>`
      },
      {
        id: 'delete', title: 'Delete: borrowing and merging',
        body: `
<ol>
<li>Start at the root and find the leaf <i>L</i> where the entry belongs.</li>
<li>Remove the entry.</li>
<li>If <i>L</i> is at least half-full, done!</li>
<li>If <i>L</i> has too few entries (underflow):
<ul><li><b>Try to redistribute</b>: borrow from an adjacent sibling <b>with the same parent</b>.</li>
<li>If redistribution fails, <b>merge</b> <i>L</i> with that sibling.</li></ul></li>
<li>If a merge occurred, delete the entry pointing to <i>L</i> (or its sibling) from the parent — which may make the parent underflow, recursively. If the root ends up with no keys, its only child becomes the new root.</li>
</ol>
<h4>Example (m = 4): delete 20</h4>
${fig(tree(4, PRE), 'Before. Non-root leaves need at least 2 keys.', { found: 20, path: [] })}
${fig(tree(4, PRE, [20]), 'After: leaf [17] underflows. It has no left sibling under the same parent, and its right sibling [25,30] is at the minimum, so they merge into [17,25,30]. The parent loses its only key and underflows, so it borrows through the root from its left sibling: 13 moves up, 17 comes down.')}
<div class="callout exam"><span class="ct">Exam tip</span><p>Borrowing (redistribution) is preferred over merging because it touches fewer nodes and never changes the height. Merging is what eventually shrinks the tree — the only way a B+Tree gets shorter.</p></div>
<p>Use the simulator above: <b>Example tree</b>, then delete 20, or 3 then 1, and read the log.</p>`
      },
      {
        id: 'search', title: 'Searching, composite keys and duplicates',
        body: `
<p><b>Point lookup</b>: start at the root; in each inner node find the child whose range contains the key; repeat until a leaf. Cost = tree height (number of nodes visited) — <b>O(log<sub>m</sub> n)</b>. <b>Range scan</b>: find the leaf of the low end, then follow the <b>sibling pointers</b> until passing the high end.</p>
<div class="callout key"><span class="ct">How big can it get?</span><p>A tree of height <i>h</i> (levels including the leaves) and order <i>m</i> has at most m<sup>h−1</sup> leaves, so at most m<sup>h−1</sup>·(m − 1) keys. With realistic fanouts (hundreds), 3–4 levels index billions of keys — and the top levels usually stay in the buffer pool.</p></div>
<h3>Composite index</h3>
<p>A composite index has a key made of two or more attributes, e.g. an index on <b>⟨a, b, c⟩</b>, sorted by a, then b, then c. The DBMS can use it when the query provides a <b>prefix</b> of the composite key:</p>
<table><thead><tr><th>Predicate</th><th>Use the index on ⟨a, b, c⟩?</th></tr></thead><tbody>
<tr class="good"><td><code>a = 1 AND b = 2 AND c = 3</code></td><td>Yes — full key</td></tr>
<tr class="good"><td><code>a = 1 AND b = 2</code></td><td>Yes — prefix ⟨a, b⟩</td></tr>
<tr class="good"><td><code>a = 1</code></td><td>Yes — prefix ⟨a⟩</td></tr>
<tr class="bad"><td><code>b = 2</code> or <code>c = 3</code></td><td>Rarely — no prefix; matching keys are scattered across the whole tree (some systems can “skip scan”)</td></tr>
</tbody></table>
<h3>Duplicate keys</h3>
<div class="grid2">
<div class="card"><h4>Approach #1: Append record ID</h4><p class="small">Add the tuple’s unique record id as part of the key so that every key is unique. The DBMS can still use partial keys (just the original attributes) to find tuples.</p></div>
<div class="card"><h4>Approach #2: Overflow leaf nodes</h4><p class="small">Allow leaf nodes to spill into overflow nodes that contain the duplicate keys. More complex to maintain and modify.</p></div>
</div>`
      },
      {
        id: 'clustered', title: 'Clustered indexes and index scans',
        body: `
<p>A <b>clustered index</b> means the table itself is stored in the sort order specified by the primary key — either heap-organized storage kept sorted, or index-organized storage. Some DBMSs always use a clustered index (if a table has no primary key, they create a hidden one, e.g. MySQL InnoDB); others cannot use them at all.</p>
<p><b>Clustered B+Tree scan</b>: traverse to the left-most leaf page and then retrieve tuples from all leaf pages in order. This is always better than sorting the data for each query.</p>
<h3>Index scan page sorting</h3>
<p>Retrieving tuples in the order they appear in a <b>non-clustered</b> index is inefficient because of redundant reads (the same heap page may be fetched many times). Better: first find all the tuples the query needs, then <b>sort them by page id</b>, so each page is retrieved once.</p>
${pageSort}`
      },
      {
        id: 'design', title: 'Design choices',
        body: `
<h3>Node size</h3>
<p>The <b>slower the storage device, the larger the optimal node size</b> (amortize the expensive access over more data): HDD ~1 MB, SSD ~10 KB, in-memory ~512 B. The optimum also depends on the workload: leaf-node scans (OLAP) like bigger nodes; root-to-leaf traversals (OLTP point lookups) like smaller ones.</p>
<h3>Merge threshold</h3>
<p>Some DBMSs do not always merge nodes when they are half full — the average B+Tree node occupancy is about <b>69%</b>. Delaying a merge may reduce reorganization (an insert might arrive soon). It may be better to let smaller nodes exist and periodically rebuild the whole tree. PostgreSQL’s B+Tree is described as a “non-balanced” B+Tree (nbtree).</p>
<h3>Variable-length keys</h3>
<table><thead><tr><th>Approach</th><th>Idea</th></tr></thead><tbody>
<tr><td><b>Pointers</b></td><td>Store keys as pointers to the tuple’s attribute (called <b>T-Trees</b> in in-memory DBMSs).</td></tr>
<tr><td><b>Variable-length nodes</b></td><td>Node size can vary; requires careful memory management.</td></tr>
<tr><td><b>Padding</b></td><td>Pad every key to the maximum length of its type.</td></tr>
<tr><td><b>Key map / indirection</b></td><td>Embed an array of pointers to the key/value list inside the node (like a slotted page).</td></tr>
</tbody></table>
<h3>Intra-node search</h3>
<table><thead><tr><th>Approach</th><th>Idea</th></tr></thead><tbody>
<tr><td><b>Linear</b></td><td>Scan keys from beginning to end; use <b>SIMD</b> to vectorize comparisons.</td></tr>
<tr><td><b>Binary</b></td><td>Jump to the middle key, pivot left/right depending on the comparison.</td></tr>
<tr><td><b>Interpolation</b></td><td>Approximate the key’s position from the known distribution of keys (e.g. evenly spaced integers).</td></tr>
</tbody></table>`
      },
      {
        id: 'optimizations', title: 'Optimizations',
        body: `
<div class="grid2">
<div class="card"><h4>Prefix compression</h4><p class="small">Sorted keys in the same leaf often share a prefix. Extract the common prefix and store only each key’s unique suffix. E.g. <code>robbed, robbing, robot</code> → prefix <code>rob</code> + <code>bed, bing, ot</code>.</p></div>
<div class="card"><h4>Deduplication</h4><p class="small">Non-unique indexes may store many copies of the same key in a leaf. Store the key once with a <b>posting list</b> of the tuples that have it (like the hash table approach).</p></div>
<div class="card"><h4>Suffix truncation</h4><p class="small">Inner-node keys only “direct traffic”, so we don’t need the entire key. Store the <b>minimum prefix</b> needed to route probes correctly: separator between <code>abcdefghijk</code> and <code>lmnopqrstuv</code> can be just <code>l</code>.</p></div>
<div class="card"><h4>Pointer swizzling</h4><p class="small">Nodes reference each other by page id, so each step of a traversal does a page-table lookup. If a page is <b>pinned</b> in the buffer pool, store a raw memory pointer instead of its page id to skip the lookup.</p></div>
<div class="card"><h4>Bulk insert</h4><p class="small">The fastest way to build a new B+Tree for an existing table: <b>sort the keys first</b>, then build the index <b>bottom-up</b> (fill leaves, then build the inner levels over them).</p></div>
<div class="card"><h4>Buffered updates (write-optimized B+Tree)</h4><p class="small">Splits and merges are expensive, and the worker that triggers them pays. Instead, buffer changes in <b>log buffers in inner nodes</b> and let them cascade down incrementally when the buffers fill. Also called <b>Fractal Trees / B<sup>ε</sup>-trees</b>.</p></div>
</div>
<div class="callout key"><span class="ct">Conclusion</span><p>The venerable B+Tree is (almost) always a good choice for your DBMS.</p></div>`
      }
    ],
    exercises: [
      {
        level: 'Exam-style', title: 'Build a tree',
        q: '<p>Insert 10, 20, 30, 40, 50, 60, 70 (in that order) into an empty B+Tree of order m = 4 (max 3 keys per node). Leaf splits keep ⌈n/2⌉ keys on the left. Draw the tree after each split.</p>',
        a: '<ul><li>10, 20, 30 → one leaf [10, 20, 30].</li><li>40 → [10,20,30,40] overflows → split [10, 20] | [30, 40]; copy up <b>30</b> → new root [30].</li><li>50 → [30, 40, 50].</li><li>60 → [30,40,50,60] overflows → [30, 40] | [50, 60]; copy up <b>50</b> → root [30, 50].</li><li>70 → [50, 60, 70].</li></ul>' + fig(tree(4, [10, 20, 30, 40, 50, 60, 70]), 'Final tree.') + '<p>Notice how inserting in sorted order leaves every leaf except the last only half full — one reason bulk loading (sort, then build bottom-up) is better.</p>'
      },
      {
        level: 'Exam-style', title: 'Delete with redistribution and merge',
        q: '<p>Start from the example tree of order 4 below (non-root leaves need ≥ 2 keys). (a) Delete 3. (b) Then delete 1. Describe each step.</p>' + fig(tree(4, PRE)),
        a: '<p>(a) Leaf [1, 3] → [1] underflows. It has no left sibling under the same parent; the right sibling [5, 7, 9] has 3 &gt; 2 keys → <b>borrow 5</b>: [1, 5] and [7, 9]; the parent separator becomes 7 → parent [7, 13].</p>' + fig(tree(4, PRE, [3])) + '<p>(b) Leaf [1, 5] → [5] underflows. Right sibling [7, 9] has only 2 keys (minimum) → <b>merge</b> into [5, 7, 9] and remove separator 7 from the parent → [13]. The parent still has 1 key (≥ the minimum of 1 for m = 4 inner nodes) → done.</p>' + fig(tree(4, PRE, [3, 1]))
      },
      {
        level: 'Concept', title: 'Copy up vs. push up',
        q: '<p>Why is the middle key <b>copied</b> up when a leaf splits but <b>pushed</b> up (moved) when an inner node splits?</p>',
        a: '<p>In a B+Tree, <b>every key must exist in a leaf</b>, because only leaves hold the values (record ids / tuples). When a leaf splits, the separator sent to the parent is just a copy; the key itself must stay in the leaf. Inner-node keys are pure routing information, so when an inner node splits, its middle key can move up to the parent — keeping it in a child too would duplicate a separator and break the “k keys, k + 1 children” rule.</p>'
      },
      {
        level: 'Exam-style', title: 'Capacity',
        q: '<p>A B+Tree has order m = 4 and height 3 (root, one inner level, leaves). (a) What is the maximum number of keys it can store? (b) The minimum, if non-root inner nodes need ≥ 2 children, the root needs ≥ 2 children and non-root leaves need ≥ 2 keys? (c) With fanout 100 instead, how many keys fit in a full tree of height 4?</p>',
        a: '<p>(a) Root: 4 children → 16 leaves → 16 × 3 = <b>48 keys</b>.</p><p>(b) Root: 2 children → each inner has 2 children → 4 leaves × 2 keys = <b>8 keys</b>.</p><p>(c) 100³ leaves × 99 keys = <b>99,000,000 keys</b> — reached with only 4 node reads per lookup.</p>'
      },
      {
        level: 'Core', title: 'Composite index',
        q: '<p>There is a B+Tree index on <code>⟨a, b, c⟩</code>. Which queries can use it efficiently? (1) <code>WHERE a = 5 AND b = 3</code> (2) <code>WHERE b = 3</code> (3) <code>WHERE a = 5 AND c = 7</code> (4) <code>WHERE a = 5 AND b &gt; 3</code> (5) <code>WHERE c = 7 AND b = 3 AND a = 5</code></p>',
        a: '<p>(1) <b>Yes</b> — prefix ⟨a, b⟩. (2) <b>No</b> (rarely) — no prefix; matching entries are spread over the entire tree. (3) <b>Partially</b> — use the prefix <code>a = 5</code> to find the range, then filter on c inside it. (4) <b>Yes</b> — equality on a, then a range on b inside it (entries are sorted by a, then b). (5) <b>Yes</b> — the order of predicates in WHERE doesn’t matter; it is the full key.</p>'
      },
      {
        level: 'Core', title: 'Index scan page sorting',
        q: '<p>An unclustered index returns record ids for a query in key order: (p7, s1), (p2, s4), (p7, s3), (p5, s0), (p2, s2). The buffer pool has one frame. How many page reads with a naïve scan, and with page sorting?</p>',
        a: '<p>Naïve, in index order: p7, p2, p7, p5, p2 — with one frame every change of page is a read → <b>5 reads</b>. Sorting the record ids by page first: p2 (s4, s2), p5 (s0), p7 (s1, s3) → <b>3 reads</b>, each page fetched once.</p>'
      },
      {
        level: 'Concept', title: 'Design choices',
        q: '<p>(a) Why should B+Tree nodes on an HDD be much larger than in an in-memory DBMS? (b) Why might a DBMS not merge a node as soon as it drops below half full? (c) Which optimization would you use for keys like <code>http://www.inha.uz/…</code>?</p>',
        a: '<p>(a) Each HDD access has a huge fixed cost (seek), so you want to read a lot of useful data per access → bigger nodes (~1 MB) and a flatter tree. In memory, access is cheap and you want nodes that fit cache lines (~512 B).</p><p>(b) Merging is expensive and a following insert might immediately split the node again; average occupancy is ~69% anyway. Some systems tolerate underfull nodes and rebuild periodically.</p><p>(c) <b>Prefix compression</b> in leaves (they all share <code>http://www.inha.uz/</code>), and <b>suffix truncation</b> for separators in inner nodes.</p>'
      }
    ],
    quiz: [
      { q: 'What is the difference between an index and a filter?', o: ['A filter returns tuple locations; an index does not', 'An index locates tuples; a filter only answers whether a key (likely) exists', 'They are the same', 'Filters only work on strings'], a: 1, e: 'B+Tree = index; Bloom filter = filter.' },
      { q: 'A B+Tree search costs…', o: ['O(1)', 'O(log<sub>m</sub> n)', 'O(n)', 'O(m · n)'], a: 1, e: 'Proportional to the height, which is logarithmic with base = fanout.' },
      { q: 'Which is NOT a property of a B+Tree?', o: ['All leaves at the same depth', 'Every non-root node at least half full', 'An inner node with k keys has k + 1 children', 'Values are stored in every node'], a: 3, e: 'That describes the original B-Tree. B+Trees store values only in leaves.' },
      { q: 'When a LEAF node splits, the middle key is…', o: ['pushed up (removed from the leaves)', 'copied up (stays in the leaf)', 'deleted', 'moved to a sibling'], a: 1, e: 'Leaves must keep every key; inner splits push up.' },
      { q: 'How does a B+Tree grow taller?', o: ['A new leaf level is added below', 'The root splits and a new root is created', 'An overflow chain is added', 'Every insert adds a level'], a: 1, e: 'Growth happens at the top, so all leaves stay at the same depth.' },
      { q: 'During delete, when a leaf underflows, the DBMS first tries to…', o: ['merge with any leaf', 'borrow from an adjacent sibling with the same parent', 'rebuild the tree', 'delete the parent'], a: 1, e: 'Redistribution first; merge only if the sibling is at the minimum.' },
      { q: 'Index on ⟨a, b, c⟩. Which predicate can it NOT use efficiently?', o: ['a = 1 AND b = 2 AND c = 3', 'a = 1 AND b = 2', 'a = 1', 'b = 2'], a: 3, e: 'b = 2 is not a prefix of the composite key.' },
      { q: 'What are the two approaches to duplicate keys?', o: ['Tombstones and movement', 'Append the record id to the key, or overflow leaf nodes', 'Hashing and chaining', 'Prefix and suffix compression'], a: 1, e: 'Making keys unique with the record id is the common choice.' },
      { q: 'Leaf values in index-organized storage for a secondary index are…', o: ['record ids', 'the tuple’s primary key', 'the full tuple', 'page ids'], a: 1, e: 'Primary index leaves hold the tuple; secondary index leaves hold the primary key.' },
      { q: 'Optimal B+Tree node size is LARGEST for…', o: ['in-memory DBMSs', 'SSDs', 'HDDs', 'it is always 4 KB'], a: 2, e: 'HDD ~1 MB, SSD ~10 KB, memory ~512 B.' },
      { q: 'Why sort record ids by page id before fetching tuples from an unclustered index?', o: ['To return results in key order', 'So each heap page is read only once', 'To enable prefix compression', 'To avoid latches'], a: 1, e: 'Index scan page sorting avoids redundant page reads.' },
      { q: 'Suffix truncation applies to…', o: ['leaf keys', 'inner-node keys, which only need enough of the key to route', 'record ids', 'the page header'], a: 1, e: 'Inner keys only direct traffic, so a shorter prefix suffices.' },
      { q: 'Pointer swizzling replaces…', o: ['keys with hashes', 'page ids with raw memory pointers for pinned pages', 'record ids with primary keys', 'leaves with overflow nodes'], a: 1, e: 'Avoids page-table lookups during traversal.' },
      { q: 'The fastest way to build a B+Tree over an existing table is…', o: ['insert keys one by one in random order', 'sort the keys, then build bottom-up', 'build a hash table first', 'insert in descending order'], a: 1, e: 'Bulk insert / bulk loading.' },
      { q: 'B<sup>ε</sup>-trees / Fractal trees improve B+Tree writes by…', o: ['skipping splits entirely', 'buffering updates in inner nodes and pushing them down in batches', 'using hash tables in leaves', 'storing values in inner nodes'], a: 1, e: 'Write-optimized B+Trees buffer changes and cascade them down incrementally.' }
    ]
  });
})();
