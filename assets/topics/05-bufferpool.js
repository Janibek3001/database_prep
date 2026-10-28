(function () {
  'use strict';
  function marker(id, cls) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="' + (cls || 'arrowhead') + '"/></marker></defs>';
  }

  var bpDiag = `
<figure class="diagram">
<svg viewBox="0 0 660 300" width="660" role="img" aria-label="Buffer pool: page table maps page ids to frames; frames hold copies of disk pages">
${marker('l5a')}
${marker('l5aa', 'arrowhead-a')}
<text x="20" y="20" class="b">Memory</text>
<rect x="20" y="30" width="160" height="28" class="bxv"/><text x="100" y="49" text-anchor="middle" class="b">Page table</text>
<rect x="20" y="58" width="160" height="116" class="bx"/>
<text x="30" y="80" class="m">page1 → frame 1</text><text x="30" y="104" class="m">page3 → frame 2</text><text x="30" y="128" class="m">page2 → frame 3</text>
<text x="30" y="156" class="s">+ dirty flag, pin count,</text><text x="30" y="170" class="s">access tracking info</text>
<rect x="250" y="30" width="390" height="100" rx="6" class="bxa"/><text x="262" y="48" class="b a">Buffer pool (array of frames)</text>
<rect x="262" y="60" width="80" height="56" class="bx"/><text x="302" y="84" text-anchor="middle" class="s">frame 1</text><text x="302" y="102" text-anchor="middle" class="m">page1</text>
<rect x="355" y="60" width="80" height="56" class="bxw"/><text x="395" y="84" text-anchor="middle" class="s">frame 2</text><text x="395" y="102" text-anchor="middle" class="m">page3 *</text>
<rect x="448" y="60" width="80" height="56" class="bx"/><text x="488" y="84" text-anchor="middle" class="s">frame 3</text><text x="488" y="102" text-anchor="middle" class="m">page2</text>
<rect x="541" y="60" width="86" height="56" class="bx2"/><text x="584" y="84" text-anchor="middle" class="s">frame 4</text><text x="584" y="102" text-anchor="middle" class="s">free</text>
<path d="M180 76 C220 76 230 88 260 88" class="ln" marker-end="url(#l5a)"/>
<path d="M180 100 C260 100 300 136 380 118" class="ln" marker-end="url(#l5a)"/>
<path d="M180 124 C300 150 420 150 480 118" class="ln" marker-end="url(#l5a)"/>
<line x1="20" y1="196" x2="640" y2="196" class="lnd"/>
<text x="20" y="216" class="b">Disk — database file</text>
<g>
<rect x="250" y="226" width="70" height="40" class="bx"/><text x="285" y="251" text-anchor="middle" class="m">page0</text>
<rect x="326" y="226" width="70" height="40" class="bx"/><text x="361" y="251" text-anchor="middle" class="m">page1</text>
<rect x="402" y="226" width="70" height="40" class="bx"/><text x="437" y="251" text-anchor="middle" class="m">page2</text>
<rect x="478" y="226" width="70" height="40" class="bxw"/><text x="513" y="251" text-anchor="middle" class="m">page3</text>
<rect x="554" y="226" width="70" height="40" class="bx"/><text x="589" y="251" text-anchor="middle" class="m">page4</text>
</g>
<path d="M361 224 C361 170 302 160 302 120" class="lnd" marker-end="url(#l5a)"/>
<path d="M403 120 C430 170 513 170 513 224" class="lna" marker-end="url(#l5aa)"/>
<text x="460" y="290" class="s a">* dirty: written back later (write-back cache)</text>
</svg>
<figcaption>The page table (in memory only) maps page ids to frames. The page directory (on disk) maps page ids to file locations.</figcaption>
</figure>`;

  var clockDiag = `
<figure class="diagram">
<svg viewBox="0 0 520 250" width="520" role="img" aria-label="CLOCK: frames arranged in a circle with reference bits and a sweeping hand">
${marker('l5c', 'arrowhead-a')}
<circle cx="200" cy="125" r="88" class="lnd"/>
<g>
<rect x="170" y="14" width="60" height="44" rx="6" class="bxa"/><text x="200" y="34" text-anchor="middle" class="m">page1</text><text x="200" y="50" text-anchor="middle" class="s">ref=1</text>
<rect x="268" y="103" width="60" height="44" rx="6" class="bx"/><text x="298" y="123" text-anchor="middle" class="m">page2</text><text x="298" y="139" text-anchor="middle" class="s">ref=0</text>
<rect x="170" y="192" width="60" height="44" rx="6" class="bxa"/><text x="200" y="212" text-anchor="middle" class="m">page3</text><text x="200" y="228" text-anchor="middle" class="s">ref=1</text>
<rect x="72" y="103" width="60" height="44" rx="6" class="bx"/><text x="102" y="123" text-anchor="middle" class="m">page4</text><text x="102" y="139" text-anchor="middle" class="s">ref=0</text>
</g>
<path d="M200 125 L188 68" class="lna" marker-end="url(#l5c)"/><circle cx="200" cy="125" r="4" class="bxa"/>
<text x="350" y="60" class="b">Hand at page1:</text>
<text x="350" y="80" class="s">ref=1 → set to 0, move on</text>
<text x="350" y="104" class="b">Next, page2:</text>
<text x="350" y="124" class="s">ref=0 → evict page2</text>
<text x="350" y="160" class="s">Any access sets the page’s</text><text x="350" y="176" class="s">ref bit back to 1 —</text><text x="350" y="192" class="s">a “second chance”.</text>
</svg>
</figure>`;

  var mysqlDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 140" width="640" role="img" aria-label="MySQL approximate LRU-K: one list with a young and an old region">
${marker('l5m')}
${marker('l5ma', 'arrowhead-a')}
<rect x="40" y="50" width="330" height="40" class="bxg"/><text x="205" y="44" text-anchor="middle" class="b g">young list</text>
<rect x="370" y="50" width="230" height="40" class="bxw"/><text x="485" y="44" text-anchor="middle" class="b w">old list</text>
<text x="56" y="75" class="m">p7  p2  p9  p4  p1</text><text x="386" y="75" class="m">p8  p5  p3</text>
<path d="M386 120 V94" class="lna" marker-end="url(#l5ma)"/><text x="394" y="124" class="s">new pages enter the head of the old list</text>
<path d="M480 50 C470 10 80 10 60 46" class="ln" marker-end="url(#l5m)"/><text x="190" y="18" class="s">accessed again while in the old list → move to the young head</text>
<path d="M600 70 H630" class="ln" marker-end="url(#l5m)"/><text x="604" y="104" class="s">evict</text>
</svg>
<figcaption>A page read once by a scan stays in the old region and is evicted quickly; hot pages migrate to the young region.</figcaption>
</figure>`;

  var scanShare = `
<figure class="diagram">
<svg viewBox="0 0 640 150" width="640" role="img" aria-label="Scan sharing: Q2 attaches to Q1's cursor and later wraps around to read the pages it missed">
${marker('l5s')}
${marker('l5sa', 'arrowhead-a')}
<g>
<rect x="40" y="56" width="70" height="36" class="bx"/><text x="75" y="79" text-anchor="middle" class="m">page0</text>
<rect x="115" y="56" width="70" height="36" class="bx"/><text x="150" y="79" text-anchor="middle" class="m">page1</text>
<rect x="190" y="56" width="70" height="36" class="bx"/><text x="225" y="79" text-anchor="middle" class="m">page2</text>
<rect x="265" y="56" width="70" height="36" class="bxa"/><text x="300" y="79" text-anchor="middle" class="m">page3</text>
<rect x="340" y="56" width="70" height="36" class="bx"/><text x="375" y="79" text-anchor="middle" class="m">page4</text>
<rect x="415" y="56" width="70" height="36" class="bx"/><text x="450" y="79" text-anchor="middle" class="m">page5</text>
</g>
<path d="M300 22 V52" class="ln" marker-end="url(#l5s)"/><text x="300" y="16" text-anchor="middle" class="s">Q1 cursor (started at page0)</text>
<path d="M300 124 V96" class="lna" marker-end="url(#l5sa)"/><text x="300" y="140" text-anchor="middle" class="s a">Q2 arrives and attaches here</text>
<path d="M490 74 C560 74 560 116 300 116 C80 116 60 110 60 96" class="lnd" marker-end="url(#l5s)"/>
<text x="510" y="132" class="s">Q2 then wraps around for pages 0–2</text>
</svg>
</figure>`;

  DBP.addTopic({
    id: 'bufferpool',
    group: 'Lectures',
    num: 'L4b',
    title: 'Buffer Pools & Memory Management',
    navTitle: 'Buffer Pools',
    summary: 'Frames, page table vs page directory, locks vs latches, why not mmap, LRU / CLOCK / LRU-K, dirty pages, I/O scheduling, optimizations.',
    lead: 'How the DBMS moves pages between disk and memory — and why it insists on doing this itself instead of trusting the operating system.',
    source: 'Lecture 4, second half; textbook 13.2–13.5',
    sections: [
      {
        id: 'goals', title: 'Spatial and temporal control',
        body: `
<p>Database storage problem #2: how the DBMS <b>manages memory</b> and moves data back and forth from disk. Two kinds of control:</p>
<div class="grid2">
<div class="card"><h4>Spatial control</h4><p class="small"><b>Where</b> to write pages on disk. Goal: keep pages that are used together physically close together on disk.</p></div>
<div class="card"><h4>Temporal control</h4><p class="small"><b>When</b> to read pages into memory and when to write them to disk. Goal: minimize the number of stalls from having to read data from disk.</p></div>
</div>
<p>Besides tuples and indexes, the DBMS needs memory for other things — <b>sorting and join buffers, query caches, maintenance buffers, log buffers, dictionary caches</b>. Depending on the implementation, these pools may not be backed by disk.</p>`
      },
      {
        id: 'organization', title: 'Buffer pool organization',
        body: `
<p>The <b>buffer pool</b> is a memory region organized as an <b>array of fixed-size pages</b>. Each array entry is called a <b>frame</b>. When the DBMS requests a page, an exact copy is placed into one of the frames. <b>Dirty pages are buffered and not written to disk immediately</b> — it is a <b>write-back cache</b>.</p>
${bpDiag}
<h3>Buffer pool meta-data</h3>
<p>The <b>page table</b> keeps track of the pages currently in memory. It is usually a fixed-size <b>hash table</b> protected with <b>latches</b> for thread-safe access. For each page it also tracks:</p>
<ul>
<li><b>Dirty flag</b> — set when a thread modifies the page; the page must be written back before eviction.</li>
<li><b>Pin / reference counter</b> — how many threads are using the page right now. A pinned page (count &gt; 0) must <b>not</b> be evicted.</li>
<li><b>Access tracking information</b> — what the replacement policy needs (timestamps, ref bits…).</li>
</ul>
<div class="callout exam"><span class="ct">Fetching a page, step by step</span><ol>
<li>Look up the page id in the page table (under a latch).</li>
<li>Hit: pin the frame, record the access, return it.</li>
<li>Miss: pick a frame — a free one, or a victim chosen by the replacement policy among <b>unpinned</b> frames. If the victim is dirty, write it back first.</li>
<li>Read the requested page from disk into the frame, update the page table, pin it, return it.</li>
<li>When the caller is done it <b>unpins</b> the page (and marks it dirty if it wrote).</li></ol></div>

<h3>Locks vs. latches</h3>
<table><thead><tr><th></th><th>Locks</th><th>Latches (mutexes)</th></tr></thead><tbody>
<tr><td>Protect</td><td>The database’s <b>logical contents</b> (tuples, tables) from other <b>transactions</b></td><td>Critical sections of the DBMS’s <b>internal data structures</b> from other <b>threads</b></td></tr>
<tr><td>Held for</td><td>The <b>transaction</b> duration</td><td>The <b>operation</b> duration</td></tr>
<tr><td>Rollback</td><td>Need to support rolling back changes</td><td>Do not need to support rollback</td></tr>
</tbody></table>

<h3>Page table vs. page directory</h3>
<table><thead><tr><th>Page directory</th><th>Page table</th></tr></thead><tbody>
<tr><td>Maps page ids → <b>locations in the database files</b></td><td>Maps page ids → <b>frames in the buffer pool</b></td></tr>
<tr><td>Changes <b>must be recorded on disk</b> so the DBMS can find pages after a restart</td><td>An <b>in-memory</b> structure that does not need to be stored on disk</td></tr>
</tbody></table>`
      },
      {
        id: 'mmap', title: 'Why not just use the OS (mmap)?',
        body: `
<p>With memory-mapped I/O (<code>mmap</code>) the file’s contents appear in the program’s address space and the OS moves file pages in and out of memory — so why should the DBMS bother managing memory itself? What if multiple DBMS threads access the mmap’d files to hide page-fault stalls?</p>
<table><thead><tr><th>Problem</th><th>Why it hurts</th></tr></thead><tbody>
<tr><td><b>#1 Transaction safety</b></td><td>The OS can flush dirty pages to disk <b>at any time</b> — even before the transaction commits or before its log records are written.</td></tr>
<tr><td><b>#2 I/O stalls</b></td><td>The DBMS does not know which pages are in memory; any access may page-fault and <b>stall the thread</b>.</td></tr>
<tr><td><b>#3 Error handling</b></td><td>Hard to validate pages. Any access can raise a <b>SIGBUS</b> that the DBMS must handle.</td></tr>
<tr><td><b>#4 Performance issues</b></td><td>OS data-structure contention and <b>TLB shootdowns</b>.</td></tr>
</tbody></table>
<p>Partial fixes exist — <code>madvise</code> (tell the OS how pages will be read), <code>mlock</code> (prevent ranges from being paged out), <code>msync</code> (flush ranges to disk) — but getting the OS to behave correctly is <b>as onerous as managing memory yourself</b>.</p>
<div class="callout key"><span class="ct">The DBMS (almost) always wants control</span><p>It can do a better job than the OS because it knows the query plans: flushing dirty pages <b>in the correct order</b>, <b>specialized prefetching</b>, <b>buffer replacement policy</b>, and <b>thread/process scheduling</b>. “The OS is not your friend.”</p></div>`
      },
      {
        id: 'replacement', title: 'Buffer replacement policies',
        body: `
<p>When the DBMS needs to free a frame for a new page, it must decide which page to <b>evict</b>. Goals of a replacement policy: <b>correctness, accuracy, speed, meta-data overhead</b>.</p>
<h3>LRU — Least Recently Used</h3>
<p>Maintain a timestamp of when each page was last accessed; evict the page with the <b>oldest</b> timestamp. Keep the pages sorted (e.g. a linked list) to reduce search time on eviction.</p>
<h3>CLOCK</h3>
<p>An approximation of LRU without a separate timestamp per page. Each page has a <b>reference bit</b>; accessing a page sets it to 1. Organize the pages in a circular buffer with a “clock hand”. On a sweep: if the page’s bit is <b>1, set it to 0</b> and move on; if it is <b>0, evict</b> it.</p>
${clockDiag}
<h3>The problem: sequential flooding</h3>
<p>LRU and CLOCK are susceptible to <b>sequential flooding</b>: a query does a sequential scan that reads every page (maybe more than once, e.g. in nested-loop joins). Those pages are read once and never again, yet they look “recently used” and <b>pollute the buffer pool</b>, pushing out hot pages. In OLAP workloads the <b>most recently used</b> page is often the best one to evict. The root cause: LRU and CLOCK track <i>when</i> a page was last accessed, but <b>not how often</b>.</p>
<div class="callout exam"><span class="ct">Sequential flooding in one example</span><p>3 frames; Q1 keeps reading hot pages 1 and 2; Q2 scans pages 3, 4, 5, 6. Under LRU, the scan pages evict 1 and 2, so Q1’s next requests miss — although pages 3–6 will never be read again. Try the “Sequential flooding” preset below and compare LRU with LRU-2 and MRU.</p></div>
<h3>LRU-K</h3>
<p>Track the history of the last <b>K</b> references to each page as timestamps, and compute the interval between subsequent accesses. Use this history to estimate the next access time: <b>evict the page whose K-th most recent access is oldest</b> (largest <i>backward K-distance</i>). Pages with fewer than K accesses have distance +∞ and go first. This balances <b>recency and frequency</b>, can distinguish reference types, and the DBMS can keep an ephemeral in-memory history of recently evicted pages to avoid repeatedly evicting the same page. (Homework 2 implements exactly this with K = 2.)</p>
<div data-sim="bufferPool"></div>
<h3>MySQL’s approximate LRU-K</h3>
<p>A single LRU linked list with two entry points, <b>“old” and “young”</b>. New pages are inserted at the head of the old list. If a page in the old list is accessed again, it moves to the head of the young list.</p>
${mysqlDiag}
<h3>Localization</h3>
<p>Choose which pages to evict on a <b>per-query</b> basis, minimizing pollution of the buffer pool by each query. Track the pages a query has accessed. Example: <b>PostgreSQL</b> assigns a limited number of buffer-pool pages to a sequential-scan query and uses them as a <b>circular ring buffer</b>.</p>
<h3>Priority hints</h3>
<p>The DBMS knows the context of each page during query execution, so it can tell the buffer pool whether a page is important or not (e.g. the root and upper levels of an index are almost always worth keeping).</p>`
      },
      {
        id: 'dirty', title: 'Dirty pages and background writing',
        body: `
<ul>
<li><b>Fast path</b>: if a page in the buffer pool is <b>not dirty</b>, the DBMS can simply “drop” it.</li>
<li><b>Slow path</b>: if a page is <b>dirty</b>, the DBMS must write it back to disk to make its changes persistent.</li>
</ul>
<p>Trade-off between <b>fast evictions</b> and writing dirty pages that will not be read again in the future.</p>
<h3>Background writing</h3>
<p>The DBMS can periodically walk through the page table and write dirty pages to disk. Once a dirty page is safely written, the DBMS can either evict it or just unset its dirty flag (so a later eviction takes the fast path).</p>
<div class="callout warn"><span class="ct">Important rule</span><p>Do <b>not</b> write dirty pages before their <b>log records</b> have been written (write-ahead logging — covered in the recovery lectures). This is exactly what mmap cannot guarantee.</p></div>`
      },
      {
        id: 'io', title: 'Disk I/O scheduling and the OS page cache',
        body: `
<p>The OS and hardware try to maximize disk bandwidth by <b>reordering and batching</b> I/O requests — but they do not know which requests are more important. Many DBMSs (Oracle, Vertica, MySQL) recommend Linux’s <b>deadline</b> or <b>noop (FIFO)</b> scheduler.</p>
<p>So the DBMS keeps <b>internal queues</b> to track page read/write requests from the entire system, and computes priorities based on several factors the OS doesn’t know:</p>
<ul class="small"><li>Sequential vs. random I/O</li><li>Critical path task vs. background task</li><li>Table vs. index vs. log vs. ephemeral data</li><li>Transaction information</li><li>User-based SLAs</li></ul>
<h3>OS page cache and O_DIRECT</h3>
<p>Most disk operations go through the OS API, and by default the OS keeps its own filesystem cache (page / buffer cache). Most DBMSs use <b>direct I/O (<code>O_DIRECT</code>)</b> to bypass it:</p>
<ul><li>avoid <b>redundant copies</b> of pages (once in the OS cache, once in the buffer pool);</li><li>avoid <b>different eviction policies</b> fighting each other;</li><li>retain <b>control over file I/O</b>.</li></ul>
<div class="callout key"><span class="ct">fsync problems (“fsyncgate”)</span><p>If the kernel fails to write a dirty page, <code>fsync</code> returns an error — but Linux then marks the page clean anyway. PostgreSQL used to retry fsync, assuming the data would be written, and silently lost data. Lesson: the DBMS cannot blindly trust the OS; PostgreSQL now crashes (panics) on fsync failure and recovers from its log.</p></div>`
      },
      {
        id: 'optimizations', title: 'Buffer pool optimizations',
        body: `
<h3>Multiple buffer pools</h3>
<p>The DBMS does not have to use one buffer pool for the whole system: multiple instances, per-database pools, per-page-type pools. Partitioning memory <b>reduces latch contention</b> and improves locality (including contention on the LRU tracking meta-data).</p>
<div class="grid2">
<div class="card"><h4>Approach #1: Object id</h4><p class="small">Embed an object identifier in record ids and maintain a mapping from objects to specific buffer pools.</p></div>
<div class="card"><h4>Approach #2: Hashing</h4><p class="small">Hash the page id to select which buffer pool to access.</p></div>
</div>
<h3>Pre-fetching</h3>
<p>The DBMS can prefetch pages based on the <b>query plan</b> — sequential scans (next pages in order) and <b>index scans</b> (the leaf pages the scan will visit next, which need not be contiguous on disk — something the OS could never guess). Some DBMSs prefetch to fill empty frames at startup.</p>
<h3>Scan sharing (synchronized scans)</h3>
<p>Queries can reuse data retrieved from storage or operator computations. Multiple queries <b>attach to a single cursor</b> that scans a table. Different from result caching: the queries don’t have to be the same; they just share the I/O.</p>
${scanShare}
<p class="small muted">Side effect: a query like <code>SELECT * FROM A LIMIT 100</code> (no ORDER BY) may return different rows depending on where it attached.</p>
<h3>Buffer pool bypass</h3>
<p>A sequential scan does not store fetched pages in the buffer pool, to avoid overhead. Memory is local to the running query. Works well when the operator needs to read a large sequence of contiguous pages; also used for temporary data (sorting, joins). Called <b>“light scans”</b> in Informix.</p>
<div class="callout key"><span class="ct">Conclusion</span><p>The DBMS can almost always manage memory better than the OS. It leverages the semantics of the query plan to make better decisions about <b>evictions, allocations and pre-fetching</b>.</p></div>`
      }
    ],
    exercises: [
      {
        level: 'Exam-style', title: 'LRU trace',
        q: '<p>A buffer pool has <b>3 frames</b> (initially empty) and uses <b>LRU</b>. Process the requests <code>1 2 3 1 4 2 5 1 2 4</code>. For every miss that evicts, name the victim. How many hits?</p>',
        a: '<table><thead><tr><th>t</th><th>req</th><th>result</th><th>frames after</th></tr></thead><tbody>' +
          '<tr><td>1</td><td>1</td><td>miss</td><td>1 · ·</td></tr><tr><td>2</td><td>2</td><td>miss</td><td>1 2 ·</td></tr><tr><td>3</td><td>3</td><td>miss</td><td>1 2 3</td></tr>' +
          '<tr class="good"><td>4</td><td>1</td><td>hit</td><td>1 2 3</td></tr><tr><td>5</td><td>4</td><td>miss, evict <b>2</b> (last used t=2)</td><td>1 4 3</td></tr>' +
          '<tr><td>6</td><td>2</td><td>miss, evict <b>3</b> (t=3)</td><td>1 4 2</td></tr><tr><td>7</td><td>5</td><td>miss, evict <b>1</b> (t=4)</td><td>5 4 2</td></tr>' +
          '<tr><td>8</td><td>1</td><td>miss, evict <b>4</b> (t=5)</td><td>5 1 2</td></tr><tr class="good"><td>9</td><td>2</td><td>hit</td><td>5 1 2</td></tr><tr><td>10</td><td>4</td><td>miss, evict <b>5</b> (t=7)</td><td>4 1 2</td></tr></tbody></table>' +
          '<p><b>2 hits, 8 misses.</b> Check it in the simulator (enter the trace, 3 frames, LRU).</p>'
      },
      {
        level: 'Exam-style', title: 'CLOCK trace',
        q: '<p>3 frames, <b>CLOCK</b>, hand starts at frame 0, a page’s ref bit is set to 1 when it is loaded or accessed. Process <code>A B C A D B E A</code>. Show the frames, ref bits and hand after each eviction.</p>',
        hint: 'When all ref bits are 1, the hand clears every bit, comes back to where it started, and evicts that page.',
        a: '<ul><li>A, B, C fill frames 0–2 (all ref=1). A hits (ref stays 1).</li><li><b>D</b>: hand at 0. A=1→0, B=1→0, C=1→0, back to A: ref 0 → <b>evict A</b>. Frames: D[1] B[0] C[0], hand → 1.</li><li><b>B</b>: hit, B’s ref → 1.</li><li><b>E</b>: hand at 1: B=1→0; frame 2: C=0 → <b>evict C</b>. Frames: D[1] B[0] E[1], hand → 0.</li><li><b>A</b>: hand at 0: D=1→0; frame 1: B=0 → <b>evict B</b>. Frames: D[0] A[1] E[1], hand → 2.</li></ul><p>Total: <b>2 hits</b> (A at t4, B at t6), 6 misses.</p>'
      },
      {
        level: 'Exam-style', title: 'LRU vs LRU-2',
        q: '<p>3 frames. Trace: <code>1 1 2 2 3 4 1 5</code>. Run (a) LRU and (b) LRU-2 (pages with fewer than 2 accesses have backward distance +∞; ties broken by oldest first access). Which policy does better, and why?</p>',
        a: '<p>(a) <b>LRU</b>: 1m 1h 2m 2h 3m · <b>4</b> evicts 1 (last used t=2) · <b>1</b> misses, evicts 2 (t=4) · <b>5</b> evicts 3 (t=5). <b>2 hits.</b></p><p>(b) <b>LRU-2</b>: same until t5 (frames 1,2,3). <b>4</b>: pages 1 and 2 have two accesses; page 3 has one → +∞ → <b>evict 3</b>. <b>1</b> → <b>hit</b>. <b>5</b>: page 4 has one access → +∞ → <b>evict 4</b>. <b>3 hits.</b></p><p>LRU-2 wins because it uses frequency: pages 1 and 2 were accessed twice (“hot”), while 3 and 4 were touched once (scan-like) and are the right ones to throw away.</p>'
      },
      {
        level: 'Core', title: 'Dirty pages',
        q: '<p>2 frames, LRU. <code>W</code> means the request modifies the page. Trace: <code>W1 2 3 W1 4 1</code>. How many pages are written back to disk because of evictions, and which?</p>',
        a: '<p>t1 W1 miss (1 dirty) · t2 2 miss · t3 <b>3</b>: evict LRU page <b>1, which is dirty → write back</b> (slow path) · t4 W1: miss, evict 2 (clean → just drop); 1 is dirty again · t5 4: evict 3 (clean) · t6 1: hit.</p><p><b>1 write-back</b> (page 1 at t3). Page 1 is still dirty at the end; it will be written by eviction or by the background writer later.</p>'
      },
      {
        level: 'Concept', title: 'Lock or latch?',
        q: '<p>Lock or latch? (a) Protecting the page table hash map while a thread inserts an entry. (b) Preventing another transaction from updating a row I have read until I commit. (c) Protecting a frame’s bytes while one thread copies a page into it.</p>',
        a: '<p>(a) <b>Latch</b> — internal data structure, held only for the operation. (b) <b>Lock</b> — logical database content, held for the transaction, must support rollback. (c) <b>Latch</b> — protects an in-memory structure from other threads during one operation.</p>'
      },
      {
        level: 'Concept', title: 'Why not mmap?',
        q: '<p>Give the four problems the lecture lists with using <code>mmap</code> instead of a buffer pool. Which one breaks correctness (not just performance)?</p>',
        a: '<ol><li><b>Transaction safety</b>: the OS may flush dirty pages at any time — e.g. before the transaction commits or before its log records are on disk. <b>This one breaks correctness</b> (recovery guarantees).</li><li><b>I/O stalls</b>: the DBMS doesn’t know which pages are in memory; a page fault blocks the thread.</li><li><b>Error handling</b>: hard to validate pages; any access can raise SIGBUS.</li><li><b>Performance</b>: OS data-structure contention, TLB shootdowns.</li></ol>'
      },
      {
        level: 'Concept', title: 'Page table or page directory?',
        q: '<p>After a crash and restart, which structure must the DBMS be able to rebuild from disk — the page table or the page directory? Why is the other one not persisted?</p>',
        a: '<p>The <b>page directory</b> (page id → location in the database files) must be persisted; otherwise the DBMS cannot find its pages after a restart. The <b>page table</b> (page id → buffer frame) describes only what is in memory right now; after a restart the buffer pool is empty anyway, so there is nothing to persist.</p>'
      },
      {
        level: 'Concept', title: 'Optimizations',
        q: '<p>For each scenario, name the buffer-pool optimization: (a) 64 threads contend on one LRU latch; (b) a B+Tree range scan will visit leaf pages 17, 3 and 42 next; (c) two analysts scan the same 1 TB table a few seconds apart; (d) a one-off full table scan shouldn’t wipe out the cache.</p>',
        a: '<p>(a) <b>Multiple buffer pools</b> (partition by object id or by hashing the page id). (b) <b>Pre-fetching</b> based on the query plan (index scans know the next leaves; the OS would only guess sequential pages). (c) <b>Scan sharing</b> — the second query attaches to the first one’s cursor and wraps around afterwards. (d) <b>Buffer pool bypass</b> (“light scans”) or <b>localization</b> (e.g. Postgres ring buffer for scans).</p>'
      }
    ],
    quiz: [
      { q: 'A buffer pool frame is…', o: ['a lock held by a transaction', 'a fixed-size slot in the buffer pool array that holds one page', 'a page on disk', 'an entry in the page directory'], a: 1, e: 'The buffer pool is an array of fixed-size frames; each can hold a copy of one page.' },
      { q: 'What does the pin count protect against?', o: ['Writing dirty pages too early', 'Evicting a page that a thread is still using', 'Two transactions updating the same tuple', 'Torn writes'], a: 1, e: 'A pinned page (pin count > 0) cannot be chosen as a victim.' },
      { q: 'Which statement about the page table is TRUE?', o: ['It must be persisted to disk', 'It maps page ids to frames and lives only in memory', 'It maps page ids to file offsets', 'It is managed by the OS'], a: 1, e: 'The page directory is the persisted one (page id → file location).' },
      { q: 'Latches differ from locks because latches…', o: ['are held for the whole transaction', 'protect internal data structures from other threads, for the duration of an operation', 'support rollback', 'are only used for indexes'], a: 1, e: 'Locks protect logical contents from transactions; latches protect internal structures from threads.' },
      { q: 'Which mmap problem threatens correctness of transactions?', o: ['TLB shootdowns', 'The OS can flush dirty pages at any time', 'SIGBUS handling', 'Page-fault stalls'], a: 1, e: 'The DBMS must control when dirty pages hit disk (after their log records).' },
      { q: 'CLOCK approximates…', o: ['MRU', 'LRU', 'LRU-K', 'FIFO with priorities'], a: 1, e: 'CLOCK uses one reference bit per page instead of timestamps to approximate LRU.' },
      { q: 'In CLOCK, when the hand reaches a page with ref bit = 1, it…', o: ['evicts it', 'sets the bit to 0 and moves on', 'sets the bit to 1', 'stops sweeping'], a: 1, e: 'The page gets a “second chance”; it is evicted only if its bit is still 0 next time.' },
      { q: 'Sequential flooding happens because LRU/CLOCK…', o: ['track how often but not when', 'track when a page was last used but not how often', 'cannot handle dirty pages', 'use too much meta-data'], a: 1, e: 'Pages read once by a scan look recently used and push out frequently-used pages.' },
      { q: 'LRU-K evicts the page with…', o: ['the most recent access', 'the oldest K-th most recent access (largest backward K-distance)', 'the fewest total accesses ever', 'the smallest page id'], a: 1, e: 'Pages with fewer than K accesses have +∞ distance and are evicted first.' },
      { q: 'How does PostgreSQL limit buffer-pool pollution by a sequential scan?', o: ['It uses mmap', 'Localization: the scan gets a small circular ring buffer', 'It disables the buffer pool entirely', 'It uses MRU for all queries'], a: 1, e: 'Postgres assigns a limited number of pages to the query and reuses them as a ring buffer.' },
      { q: 'Evicting a clean page is the “fast path” because…', o: ['it has no locks', 'it can simply be dropped — no write to disk needed', 'it was prefetched', 'it is pinned'], a: 1, e: 'Dirty pages must be written back first (slow path).' },
      { q: 'Why do most DBMSs open files with O_DIRECT?', o: ['To enable mmap', 'To bypass the OS page cache: avoid double caching and conflicting eviction policies', 'To make writes atomic', 'To compress pages'], a: 1, e: 'The DBMS wants control over file I/O and to avoid redundant copies.' },
      { q: 'In MySQL’s approximate LRU-K, a newly read page is inserted…', o: ['at the head of the young list', 'at the head of the old list', 'at the tail of the young list', 'directly into a separate pool'], a: 1, e: 'It only moves to the young list if accessed again while in the old list.' },
      { q: 'Scan sharing differs from result caching because…', o: ['it caches query results', 'queries share the I/O of a cursor, even if they are different queries', 'it only works for identical queries', 'it requires an index'], a: 1, e: 'Multiple queries attach to a single cursor scanning a table.' },
      { q: 'Which rule must background writing respect?', o: ['Write pages in page-id order', 'Do not write a dirty page before its log records are written', 'Only write pinned pages', 'Only write during idle time'], a: 1, e: 'Write-ahead logging: log records first, then the data page.' }
    ]
  });
})();
