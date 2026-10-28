(function () {
  'use strict';
  function marker(id, cls) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="' + (cls || 'arrowhead') + '"/></marker></defs>';
  }

  var probeDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 170" width="640" role="img" aria-label="Linear probing: key C hashes to an occupied slot and is placed in the next free slot">
${marker('l6p', 'arrowhead-a')}
<text x="20" y="22" class="m">hash(C) mod 8 = 2</text>
<g>
<rect x="40" y="50" width="70" height="44" class="bx2"/><text x="75" y="77" text-anchor="middle" class="m">·</text><text x="75" y="110" text-anchor="middle" class="s">0</text>
<rect x="110" y="50" width="70" height="44" class="bx"/><text x="145" y="77" text-anchor="middle" class="m">A|val</text><text x="145" y="110" text-anchor="middle" class="s">1</text>
<rect x="180" y="50" width="70" height="44" class="bxw"/><text x="215" y="77" text-anchor="middle" class="m">B|val</text><text x="215" y="110" text-anchor="middle" class="s">2</text>
<rect x="250" y="50" width="70" height="44" class="bxw"/><text x="285" y="77" text-anchor="middle" class="m">D|val</text><text x="285" y="110" text-anchor="middle" class="s">3</text>
<rect x="320" y="50" width="70" height="44" class="bxg"/><text x="355" y="77" text-anchor="middle" class="m b">C|val</text><text x="355" y="110" text-anchor="middle" class="s">4</text>
<rect x="390" y="50" width="70" height="44" class="bx2"/><text x="425" y="77" text-anchor="middle" class="m">·</text><text x="425" y="110" text-anchor="middle" class="s">5</text>
<rect x="460" y="50" width="70" height="44" class="bx"/><text x="495" y="77" text-anchor="middle" class="m">E|val</text><text x="495" y="110" text-anchor="middle" class="s">6</text>
<rect x="530" y="50" width="70" height="44" class="bx2"/><text x="565" y="77" text-anchor="middle" class="m">·</text><text x="565" y="110" text-anchor="middle" class="s">7</text>
</g>
<path d="M150 28 C190 28 210 36 214 46" class="lna" marker-end="url(#l6p)"/>
<path d="M222 132 C240 150 270 150 282 98" class="lna" marker-end="url(#l6p)"/>
<path d="M292 132 C310 150 340 150 352 98" class="lna" marker-end="url(#l6p)"/>
<text x="250" y="164" class="s a">slot 2 taken → try 3 → taken → 4 is free</text>
</svg>
<figcaption>Store the key in the slot (not just the value) so a lookup knows when it has found the right entry and when to stop (at an empty slot).</figcaption>
</figure>`;

  var extDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 230" width="640" role="img" aria-label="Extendible hashing: a directory of 2^global-depth pointers to buckets with local depths">
${marker('l6e')}
<text x="20" y="20" class="b">global depth = 2</text>
<rect x="40" y="34" width="70" height="34" class="bxa"/><text x="75" y="56" text-anchor="middle" class="m">00</text>
<rect x="40" y="76" width="70" height="34" class="bxa"/><text x="75" y="98" text-anchor="middle" class="m">01</text>
<rect x="40" y="118" width="70" height="34" class="bxa"/><text x="75" y="140" text-anchor="middle" class="m">10</text>
<rect x="40" y="160" width="70" height="34" class="bxa"/><text x="75" y="182" text-anchor="middle" class="m">11</text>
<rect x="330" y="34" width="250" height="40" rx="4" class="bxg"/><text x="342" y="58" class="s">local depth 1</text><text x="440" y="58" class="m">A: 01110…  B: 01101…</text>
<rect x="330" y="96" width="250" height="40" rx="4" class="bxg"/><text x="342" y="120" class="s">local depth 2</text><text x="440" y="120" class="m">C: 10111…</text>
<rect x="330" y="158" width="250" height="40" rx="4" class="bxg"/><text x="342" y="182" class="s">local depth 2</text><text x="440" y="182" class="m">D: 11010…</text>
<path d="M110 51 C220 51 220 54 328 54" class="ln" marker-end="url(#l6e)"/>
<path d="M110 93 C220 93 220 58 328 58" class="ln" marker-end="url(#l6e)"/>
<path d="M110 135 C220 135 220 116 328 116" class="ln" marker-end="url(#l6e)"/>
<path d="M110 177 C220 177 220 178 328 178" class="ln" marker-end="url(#l6e)"/>
<text x="20" y="218" class="s">Two directory slots (00, 01) share one bucket because its local depth (1) &lt; global depth (2): it only looks at the first bit.</text>
</svg>
<figcaption>Here the directory uses the first (most significant) bits of the hash, as on the lecture slides.</figcaption>
</figure>`;

  DBP.addTopic({
    id: 'hashing',
    group: 'Lectures',
    num: 'L5',
    title: 'Hash Tables',
    summary: 'Hash functions, static schemes (linear probing, cuckoo) and dynamic schemes (chained, extendible, linear hashing).',
    lead: 'The DBMS uses hash tables everywhere internally — page tables, joins, aggregations. This chapter covers how they handle collisions and how they grow.',
    source: 'Lecture 5 slides; textbook 14.5, 24.5',
    sections: [
      {
        id: 'background', title: 'Data structures in a DBMS',
        body: `
<p>We now look at how the execution engine reads and writes data from pages. There are two families of data structures: <b>hash tables (unordered)</b> and <b>trees (ordered)</b>. A DBMS uses them for:</p>
<div class="grid2">
<div class="card small"><b>Internal meta-data</b> — keep track of information about the database and system state (e.g. the page table, page directory).</div>
<div class="card small"><b>Core data storage</b> — the base storage for tuples (e.g. index-organized tables).</div>
<div class="card small"><b>Temporary data structures</b> — built on the fly while processing a query (e.g. hash tables for joins).</div>
<div class="card small"><b>Table indexes</b> — auxiliary structures that make it easier to find specific tuples.</div>
</div>
<p>Two design decisions for any of them:</p>
<ul><li><b>Data organization</b> — how to lay out the structure in memory/pages and what information to store to support efficient access.</li><li><b>Concurrency</b> — how to let multiple threads access it at the same time without causing problems.</li></ul>`
      },
      {
        id: 'hash-tables', title: 'Hash tables and hash functions',
        body: `
<p>A <b>hash table</b> implements an <b>unordered associative array</b> that maps keys to values. It uses a <b>hash function</b> to compute an offset into an array for a given key, from which the desired value can be found.</p>
<table><thead><tr><th></th><th>Complexity</th></tr></thead><tbody>
<tr><td>Space</td><td><i>O(n)</i></td></tr>
<tr><td>Time</td><td>Average <i>O(1)</i>, worst <i>O(n)</i></td></tr>
</tbody></table>
<p class="small muted">“Databases care about constants!” — an O(1) structure that is 3× slower in practice matters.</p>
<h3>The static hash table strawman</h3>
<p>Allocate a giant array with one slot for every element. To find an entry, take <code>key mod n</code> to get the offset. This only works under three <b>unrealistic assumptions</b>:</p>
<ol><li>The number of elements is <b>known ahead of time and fixed</b>.</li><li>Each key is <b>unique</b>.</li><li>A <b>perfect hash function</b> exists: if key1 ≠ key2 then hash(key1) ≠ hash(key2).</li></ol>
<p>So a real hash table has two design decisions:</p>
<div class="grid2">
<div class="card"><h4>#1 Hash function</h4><p class="small">How to map a large key space into a smaller domain. Trade-off: <b>being fast vs. collision rate</b>.</p></div>
<div class="card"><h4>#2 Hashing scheme</h4><p class="small">How to handle collisions after hashing. Trade-off: allocating a <b>large table</b> vs. <b>extra instructions</b> to get/put keys.</p></div>
</div>
<h3>Hash functions</h3>
<p>For any input key, return an integer representation of it — converting an arbitrary byte array into a fixed-length code. We want something <b>fast with a low collision rate</b>. We do <b>not</b> want a cryptographic hash function (e.g. SHA-2) for DBMS hash tables: we don’t need to protect the keys, and crypto hashes are far too slow. (Real systems use e.g. XXHash, MurmurHash, CityHash/FarmHash.)</p>
<div class="callout key"><span class="ct">Desired properties</span><ol>
<li><b>Determinism</b> — identical inputs and seeds produce identical hashes.</li>
<li><b>Speed</b> — efficient CPU integer operations.</li>
<li><b>Uniform distribution</b> — spread hashes evenly across the output space.</li>
<li><b>Avalanche effect</b> — changing one input bit changes many output bits.</li>
<li><b>Low overhead</b> — no expensive cryptographic transformations.</li></ol></div>
<p class="small muted">The simulators below use <code>k mod n</code> so you can follow them by hand, which is also what exam questions typically do.</p>`
      },
      {
        id: 'linear-probing', title: 'Static hashing: linear probing',
        body: `
<p>Static schemes use <b>open addressing</b>: all entries live in one array of fixed-length slots. (Others, covered in the advanced course: Robin Hood hashing, Hopscotch hashing, Swiss tables.)</p>
<p><b>Linear probe hashing</b>: a single giant table of slots. Resolve collisions by <b>linearly searching for the next free slot</b>.</p>
<ul>
<li><b>Lookup</b>: hash to a slot and scan forward until you find the key (hit) or an <b>empty</b> slot (miss). Keys are stored in the table so you know when to stop.</li>
<li><b>Insert / delete</b> are generalizations of lookup.</li>
<li>The table’s <b>load factor</b> (#keys / #slots) tells when it is getting too full; then allocate a new table <b>twice as large</b> and rehash all entries.</li>
</ul>
${probeDiag}
<h3>Key/value entries</h3>
<ul>
<li><b>Fixed-length</b> keys/values: store them <b>inline</b> in the hash table pages. Optionally store the key’s hash with the key for faster comparisons.</li>
<li><b>Variable-length</b> keys/values: insert the data into a separate private temporary table; store the hash as the key and the <b>record id</b> of the entry in the temp table as the value.</li>
</ul>
<h3>Deletes</h3>
<p>You cannot just empty the slot: a later lookup for a key that probed past it would stop at the hole and wrongly report “not found”.</p>
<div class="grid2">
<div class="card"><h4>Approach #1: Movement</h4><p class="small">Rehash keys after the deleted slot until you find the first empty slot, moving them back. <b>Expensive</b> — may need to reorganize much of the table. <b>No DBMS does this.</b></p></div>
<div class="card"><h4>Approach #2: Tombstone</h4><p class="small">Mark the slot as <b>logically deleted</b> (e.g. in a separate bitmap). Lookups probe past tombstones; inserts can <b>reuse</b> them. May need periodic garbage collection.</p></div>
</div>
<div data-sim="linearProbe"></div>
<h3>Non-unique keys</h3>
<div class="grid2">
<div class="card"><h4>Choice #1: Separate linked list</h4><p class="small">Store the values in a separate storage area for each key; value lists can overflow to multiple pages if there are many duplicates.</p></div>
<div class="card"><h4>Choice #2: Redundant keys</h4><p class="small">Store duplicate key entries together in the hash table. Easier to implement — <b>this is what most systems do</b>.</p></div>
</div>
<h3>Optimizations</h3>
<ul>
<li>Specialized implementations based on key type(s) and sizes (e.g. separate tables for different string sizes).</li>
<li>Store meta-data in a separate array: a packed bitmap tracks whether a slot is empty or a tombstone.</li>
<li>Use table + slot <b>versioning</b> meta-data to invalidate all entries at once: if the table’s version doesn’t match a slot’s version, treat the slot as empty.</li>
</ul>`
      },
      {
        id: 'cuckoo', title: 'Static hashing: cuckoo hashing',
        body: `
<p>Use <b>multiple hash functions</b> to find multiple possible locations for each key (often one per table).</p>
<ul>
<li><b>Insert</b>: check the possible locations and pick one that is empty. If none is available, <b>evict</b> the element from one of them and re-hash it to find a new location for it — which may evict another element, and so on.</li>
<li><b>Lookups and deletions are always O(1)</b>: only one location per hash table must be checked.</li>
<li>If the evictions run into a <b>cycle</b>, the table must be rebuilt with new hash functions (usually larger).</li>
</ul>
<p>The best open-source implementation is from CMU (libcuckoo).</p>
<div data-sim="cuckoo"></div>
<div class="callout warn"><span class="ct">Limitation of static schemes</span><p>Linear probing and cuckoo hashing require the DBMS to know (roughly) how many elements it will store. Otherwise it must <b>rebuild the whole table</b> when it needs to grow or shrink. <b>Dynamic hash tables</b> resize themselves incrementally.</p></div>`
      },
      {
        id: 'chained', title: 'Dynamic hashing: chained hashing',
        body: `
<p>Maintain a <b>linked list of buckets</b> for each slot. Resolve collisions by placing all elements with the same hash key into the same bucket (and chaining new bucket pages when one fills up).</p>
<ul><li>To find an element, hash to its bucket and scan the chain.</li><li>Insertions and deletions are generalizations of lookups.</li><li>The table never “fills up”, but chains can grow long — degrading lookups toward O(n).</li></ul>
<div data-sim="chained"></div>`
      },
      {
        id: 'extendible', title: 'Dynamic hashing: extendible hashing',
        body: `
<p>A chained-hashing approach that <b>splits buckets incrementally</b> instead of letting chains grow forever.</p>
<ul>
<li>A <b>directory</b> of 2<sup>global depth</sup> slots; each slot points to a bucket. The directory is indexed by <b>global depth</b> bits of the hash.</li>
<li>Each bucket has a <b>local depth</b> ≤ global depth: the number of hash bits all its keys agree on. Multiple directory slots can point to the same bucket (exactly 2<sup>global − local</sup> of them).</li>
<li><b>Insert into a full bucket</b>:
<ul><li>If local depth &lt; global depth: <b>split</b> the bucket (local depth + 1), redistribute its keys on the new bit, and update only the directory slots that pointed to it.</li>
<li>If local depth = global depth: first <b>double the directory</b> (global depth + 1, each new slot copies its sibling’s pointer), then split.</li></ul></li>
<li>Data movement is <b>localized to the split bucket</b>; the directory doubling just copies pointers.</li>
</ul>
${extDiag}
<div data-sim="extendible"></div>
<div class="callout exam"><span class="ct">How exam questions are usually phrased</span><p>“Global depth is 2, buckets hold 2 keys, use the <b>last</b> 2 bits of the hash. Insert keys with hashes 0110, 1011, … Draw the directory and buckets with their local depths.” Always check whether the question uses the first or last bits — the simulator supports both.</p></div>`
      },
      {
        id: 'linear-hashing', title: 'Dynamic hashing: linear hashing',
        body: `
<p>Extendible hashing doubles the whole directory at once. <b>Linear hashing</b> grows one bucket at a time and needs no directory doubling.</p>
<ul>
<li>The table keeps a <b>split pointer</b> that tracks the <b>next bucket to split</b>.</li>
<li>When <b>any</b> bucket overflows, split the bucket <b>at the pointer location</b> — not necessarily the one that overflowed. Its keys are rehashed with the next hash function; some move to a new bucket at the end. Then advance the pointer.</li>
<li>Use <b>multiple hash functions</b> to find the right bucket: <code>h<sub>i</sub>(k) = k mod (n · 2<sup>i</sup>)</code>. Compute h<sub>level</sub>(k); if the result is <b>below the split pointer</b> that bucket was already split this round, so use h<sub>level+1</sub>(k).</li>
<li>Overflow criteria can vary: space utilization, average length of overflow chains…</li>
</ul>
<div data-sim="linearHash"></div>
<h3>Resizing and deletes</h3>
<p>Splitting buckets in pointer order eventually reaches every overflowed bucket. When the pointer reaches the <b>last slot</b> of the round, delete the first hash function (h<sub>level</sub>) and move the pointer back to the beginning — the table has doubled.</p>
<p>Deletes can run in reverse: if the highest bucket below the split pointer is empty, the table can remove it and move the split pointer backwards.</p>
<div class="callout key"><span class="ct">Conclusion</span><p>Fast data structures with O(1) lookups are used throughout DBMS internals; it’s a trade-off between speed and flexibility. But hash tables are usually <b>not</b> what you want for a <b>table index</b>: they only support equality lookups — no range scans, no prefix searches, no sorted output. That is what B+Trees are for.</p></div>`
      }
    ],
    exercises: [
      {
        level: 'Exam-style', title: 'Linear probing with tombstones',
        q: '<p>A linear-probe hash table has 8 slots and h(k) = k mod 8. Starting empty: (a) insert 10, 18, 26, 3, 11 — show the table. (b) Delete 18 using a tombstone. (c) Which slots does <code>find(26)</code> visit? (d) Which slots does <code>find(34)</code> visit? (e) Where does <code>insert(34)</code> go?</p>',
        a: '<p>(a) 10→2; 18→2 taken→3; 26→2,3 taken→4; 3→3,4 taken→5; 11→3,4,5 taken→6.</p><div class="formula">[ · | · | 10 | 18 | 26 | 3 | 11 | · ]</div><p>(b) <code>[ · | · | 10 | ✝18 | 26 | 3 | 11 | · ]</code></p><p>(c) Slots 2, 3 (tombstone — keep going), 4 → found.</p><p>(d) Slots 2, 3, 4, 5, 6, 7 → slot 7 is empty → <b>not found</b> (6 probes).</p><p>(e) It probes 2 (taken), 3 = tombstone → <b>reuse slot 3</b>. (A real implementation first confirms 34 isn’t already present further along, as in (d).)</p><p>Why not simply empty slot 3 in (b)? Then <code>find(26)</code> would stop at the empty slot 3 and wrongly report “not found”.</p>'
      },
      {
        level: 'Core', title: 'Movement-based delete',
        q: '<p>Same table as above, before the tombstone: <code>[ · | · | 10 | 18 | 26 | 3 | 11 | · ]</code>. Delete 18 with the <b>movement</b> approach. What does the table look like, and why does no real DBMS do this?</p>',
        a: '<p>Empty slot 3, then rehash every key after it until the first empty slot: 26 (home 2) moves to 3; 3 (home 3) moves to 4; 11 (home 3) moves to 5.</p><div class="formula">[ · | · | 10 | 26 | 3 | 11 | · | · ]</div><p>It can require rehashing a long cluster (potentially much of the table) for one delete — too expensive, so DBMSs use tombstones.</p>'
      },
      {
        level: 'Exam-style', title: 'Cuckoo hashing',
        q: '<p>Two tables of size 5, h1(k) = k mod 5, h2(k) = ⌊k/5⌋ mod 5. Insert 1, 6, 7, 32. If both candidate slots are full, put the new key in T1 and push the evicted key to its other table, and so on. Show every move.</p>',
        a: '<ul><li>1: h1=1 → T1[1].</li><li>6: h1=1 taken (1); h2=1 empty → T2[1].</li><li>7: h1=2 → T1[2].</li><li>32: h1=2 (7) and h2=1 (6) both taken → place 32 in T1[2], evicting <b>7</b> → 7 goes to T2[h2(7)=1], evicting <b>6</b> → 6 goes to T1[h1(6)=1], evicting <b>1</b> → 1 goes to T2[h2(1)=0], empty → done.</li></ul><p>Final: T1 = [ ·, 6, 32, ·, · ], T2 = [ 1, 7, ·, ·, · ]. Every key is still in one of its two possible slots, so any lookup checks at most 2 slots.</p>'
      },
      {
        level: 'Exam-style', title: 'Extendible hashing',
        q: '<p>Extendible hashing, bucket capacity 2, the directory uses the <b>last</b> global-depth bits of the hash, hash(k) = k. Starting with global depth 0 and one empty bucket, insert 12, 5, 9, 16, 22, 7, 3. Show the final directory, buckets and local depths.</p>',
        hint: 'Binary: 12=01100, 5=00101, 9=01001, 16=10000, 22=10110, 7=00111, 3=00011.',
        a: '<ul><li>12, 5 → bucket B0 (gd 0).</li><li>9: B0 full, local = global = 0 → double (gd 1), split B0 on bit 0: B0 {12} (…0), B1 {5} (…1). 9 (…1) → B1 {5, 9}.</li><li>16 (…0) → B0 {12, 16}.</li><li>22 (…0): B0 full, local 1 = global 1 → double (gd 2), split B0 on bit 1: 12 (…00), 16 (…00) stay in B0; new B2 gets …10. 22 (…10) → B2.</li><li>7 (…11): directory[11] → B1 (local depth 1) is full, but local &lt; global → split without doubling: 5 (…01), 9 (…01) stay; new B3 gets …11. 7 → B3.</li><li>3 (…11) → B3 {7, 3}.</li></ul><div class="formula">gd = 2: 00 → B0{12,16} (ld 2) · 01 → B1{5,9} (ld 2) · 10 → B2{22} (ld 2) · 11 → B3{7,3} (ld 2)</div><p>Verify it in the simulator (bucket size 2, last bits).</p>'
      },
      {
        level: 'Exam-style', title: 'Linear hashing',
        q: '<p>Linear hashing with 4 initial buckets, h0(k) = k mod 4, h1(k) = k mod 8, 2 keys per page, split pointer at 0. Buckets: 0:{8, 20} 1:{9, 13} 2:{6} 3:{7, 11}. A split happens whenever an insert creates an overflow page. Insert 17, 25, 4, 12. Then: in which bucket is 20?</p>',
        a: '<ul><li><b>17</b>: h0 = 1 → bucket 1 overflows → split the bucket at the <b>pointer (0)</b>, not bucket 1! Rehash {8, 20} with h1: 8 → 0, 20 → 4 (new bucket 4). Pointer → 1. Bucket 1 keeps {9, 13, 17} with an overflow page.</li><li><b>25</b>: h0 = 1 (not &lt; pointer 1) → bucket 1 → {9, 13, 17, 25} (fits on the existing overflow page; no new overflow).</li><li><b>4</b>: h0 = 0 &lt; pointer 1 → use h1 = 4 → bucket 4 {20, 4}.</li><li><b>12</b>: h0 = 0 &lt; 1 → h1 = 4 → bucket 4 overflows → split bucket at pointer <b>1</b> with h1: 9→1, 13→5, 17→1, 25→1. New bucket 5 = {13}. Pointer → 2.</li></ul><p>Final: 0:{8} 1:{9, 17, 25} 2:{6} 3:{7, 11} 4:{20, 4, 12} 5:{13}, level 0, pointer 2.</p><p><b>Find 20</b>: h0(20) = 0 &lt; pointer 2 → use h1(20) = 4 → bucket 4.</p>'
      },
      {
        level: 'Concept', title: 'Hash functions',
        q: '<p>Why don’t DBMSs use SHA-256 for their hash tables? Which property would <code>h(k) = k mod 8</code> violate badly if all keys were multiples of 8?</p>',
        a: '<p>Cryptographic hashes are designed to be hard to invert, which DBMS hash tables don’t need, and they are much slower than non-cryptographic hashes (XXHash, MurmurHash…). For an internal hash table, speed and a low collision rate are what matter.</p><p>With all keys multiples of 8, <code>k mod 8 = 0</code> for every key: it violates <b>uniform distribution</b> (and has no avalanche effect) — every key collides into slot 0, degrading to O(n).</p>'
      },
      {
        level: 'Concept', title: 'Static vs. dynamic',
        q: '<p>(a) What happens in a linear-probe table when the load factor gets too high, and why is that a problem for a DBMS? (b) How do extendible and linear hashing avoid it? (c) Give one reason hash tables are rarely used as table indexes.</p>',
        a: '<p>(a) Probe sequences get long; eventually the table must be rebuilt: allocate a table 2× larger and rehash every entry — a big, blocking operation.</p><p>(b) They grow <b>incrementally</b>: extendible hashing splits one bucket at a time (doubling only the cheap pointer directory when necessary); linear hashing splits one bucket per overflow in round-robin order with no directory at all.</p><p>(c) They only support equality lookups on the whole key — no range queries, no prefix lookups on composite keys, no sorted order.</p>'
      }
    ],
    quiz: [
      { q: 'Average and worst-case lookup time of a hash table?', o: ['O(log n) and O(n)', 'O(1) and O(n)', 'O(1) and O(log n)', 'O(n) and O(n²)'], a: 1, e: 'Average O(1); worst O(n) when everything collides.' },
      { q: 'Why don’t DBMSs use cryptographic hash functions for hash tables?', o: ['They are not deterministic', 'They are too slow and the protection isn’t needed', 'They produce variable-length output', 'They cannot hash strings'], a: 1, e: 'Speed and low collision rate matter, not resistance to attacks.' },
      { q: 'The avalanche effect means…', o: ['the table resizes automatically', 'changing one input bit changes many output bits', 'collisions cascade through the table', 'hashes are spread uniformly'], a: 1, e: 'Small input changes should produce very different hashes.' },
      { q: 'In linear probing, a lookup stops when it…', o: ['reaches a tombstone', 'finds the key or reaches an empty slot', 'has probed 3 slots', 'reaches the end of the array'], a: 1, e: 'Tombstones must be skipped, not treated as empty.' },
      { q: 'Why are tombstones needed for deletes in linear probing?', o: ['To save memory', 'So lookups for keys that probed past the deleted slot don’t stop early', 'To keep keys sorted', 'To implement cuckoo hashing'], a: 1, e: 'An emptied slot would cut the probe chain.' },
      { q: 'What do most systems do with non-unique keys in a hash table?', o: ['Reject duplicates', 'Store redundant key entries together in the table', 'Use a separate B+Tree', 'Use cuckoo hashing'], a: 1, e: 'Redundant keys are easier to implement than separate value lists.' },
      { q: 'In cuckoo hashing, lookups are…', o: ['O(log n)', 'always O(1) — check one slot per table', 'O(n) in the worst case', 'amortized O(1) only'], a: 1, e: 'A key can only be in its few candidate slots.' },
      { q: 'What happens if cuckoo-hashing evictions form a cycle?', o: ['The key is dropped', 'Rebuild the table with new hash functions (usually larger)', 'Insert a tombstone', 'Switch to linear probing for that key'], a: 1, e: 'The insert cannot succeed with the current functions.' },
      { q: 'In extendible hashing, the directory is doubled when…', o: ['any bucket overflows', 'a full bucket’s local depth equals the global depth', 'the load factor exceeds 0.5', 'the split pointer wraps around'], a: 1, e: 'If local < global, the bucket can split without doubling.' },
      { q: 'A bucket with local depth 1 in a directory with global depth 3 is pointed to by how many directory slots?', o: ['1', '2', '4', '8'], a: 2, e: '2^(global − local) = 2^(3−1) = 4.' },
      { q: 'In linear hashing, when a bucket overflows, which bucket is split?', o: ['The overflowing bucket', 'The bucket at the split pointer', 'The largest bucket', 'Bucket 0 always'], a: 1, e: 'Splits happen in round-robin order at the pointer; eventually every overflowed bucket gets split.' },
      { q: 'In linear hashing, when do you use h<sub>level+1</sub> for a lookup?', o: ['Always', 'When h<sub>level</sub>(k) is below the split pointer', 'When the bucket has an overflow page', 'When h<sub>level</sub>(k) is above the split pointer'], a: 1, e: 'Buckets below the pointer were already split this round.' },
      { q: 'Which is a dynamic hashing scheme?', o: ['Linear probing', 'Cuckoo hashing', 'Extendible hashing', 'Robin Hood hashing'], a: 2, e: 'Chained, extendible and linear hashing resize incrementally.' },
      { q: 'Why are hash tables usually not the right choice for a table index?', o: ['They use too much memory', 'They cannot support range scans or ordered access', 'They are slower than B+Trees for equality lookups', 'They cannot be persisted'], a: 1, e: 'Hash tables are unordered.' }
    ]
  });
})();
