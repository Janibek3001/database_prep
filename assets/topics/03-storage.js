(function () {
  'use strict';
  function marker(id, cls) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="' + (cls || 'arrowhead') + '"/></marker></defs>';
  }

  var hierarchy = `
<figure class="diagram">
<svg viewBox="0 0 660 300" width="660" role="img" aria-label="Storage hierarchy from CPU registers to network storage">
<polygon points="250,14 330,14 350,56 230,56" class="bxa"/><text x="290" y="41" text-anchor="middle" class="b">CPU registers</text>
<polygon points="230,60 350,60 372,102 208,102" class="bxa"/><text x="290" y="87" text-anchor="middle" class="b">CPU caches</text>
<polygon points="208,106 372,106 394,148 186,148" class="bxa"/><text x="290" y="133" text-anchor="middle" class="b">DRAM</text>
<polygon points="186,156 394,156 416,198 164,198" class="bxg"/><text x="290" y="183" text-anchor="middle" class="b">SSD</text>
<polygon points="164,202 416,202 438,244 142,244" class="bxg"/><text x="290" y="229" text-anchor="middle" class="b">HDD</text>
<polygon points="142,248 438,248 460,290 120,290" class="bxg"/><text x="290" y="275" text-anchor="middle" class="b">Network storage</text>
<line x1="100" y1="152" x2="480" y2="152" class="lnd"/>
<text x="20" y="70" class="b a">Volatile</text><text x="20" y="88" class="s">random access</text><text x="20" y="104" class="s">byte-addressable</text>
<text x="20" y="214" class="b g">Non-volatile</text><text x="20" y="232" class="s">sequential access</text><text x="20" y="248" class="s">block-addressable</text>
<text x="500" y="40" class="s">faster</text><text x="500" y="56" class="s">smaller</text><text x="500" y="72" class="s">more expensive</text>
<text x="500" y="250" class="s">slower</text><text x="500" y="266" class="s">larger</text><text x="500" y="282" class="s">cheaper</text>
<path d="M490 80 V236" class="ln" marker-start="url(#l3h)" marker-end="url(#l3h)"/>
${marker('l3h')}
</svg>
<figcaption>The DBMS assumes the database lives on non-volatile storage (below the dashed line) and moves data up into memory to work on it.</figcaption>
</figure>`;

  var diskOriented = `
<figure class="diagram">
<svg viewBox="0 0 660 330" width="660" role="img" aria-label="Disk-oriented DBMS: execution engine requests a page, buffer pool loads it from the database file">
${marker('l3d')}
${marker('l3da', 'arrowhead-a')}
<rect x="230" y="12" width="200" height="40" rx="6" class="bxv"/><text x="330" y="37" text-anchor="middle" class="b">Execution engine</text>
<rect x="150" y="96" width="360" height="86" rx="6" class="bxa"/><text x="166" y="116" class="b">Buffer pool (memory)</text>
<rect x="166" y="128" width="60" height="40" rx="3" class="bx"/><text x="196" y="153" text-anchor="middle" class="m">dir</text>
<rect x="236" y="128" width="60" height="40" rx="3" class="bxw"/><text x="266" y="153" text-anchor="middle" class="m">page 2</text>
<rect x="306" y="128" width="60" height="40" rx="3" class="bx2"/>
<rect x="376" y="128" width="60" height="40" rx="3" class="bx2"/>
<rect x="446" y="128" width="50" height="40" rx="3" class="bx2"/>
<rect x="100" y="236" width="460" height="82" rx="6" class="bxg"/><text x="116" y="256" class="b">Database file (disk)</text>
<rect x="116" y="266" width="62" height="40" rx="3" class="bx"/><text x="147" y="291" text-anchor="middle" class="m">dir</text>
<rect x="186" y="266" width="62" height="40" rx="3" class="bx"/><text x="217" y="291" text-anchor="middle" class="m">page 1</text>
<rect x="256" y="266" width="62" height="40" rx="3" class="bxw"/><text x="287" y="291" text-anchor="middle" class="m">page 2</text>
<rect x="326" y="266" width="62" height="40" rx="3" class="bx"/><text x="357" y="291" text-anchor="middle" class="m">page 3</text>
<rect x="396" y="266" width="62" height="40" rx="3" class="bx"/><text x="427" y="291" text-anchor="middle" class="m">page 4</text>
<text x="490" y="291" class="m">⋯</text>
<path d="M300 52 V94" class="ln" marker-end="url(#l3d)"/><text x="240" y="78" class="s">① get page #2</text>
<path d="M147 266 V172" class="lnd" marker-end="url(#l3d)"/><text x="24" y="214" class="s">② read directory:</text><text x="24" y="228" class="s">where is page 2?</text>
<path d="M287 266 V172" class="lna" marker-end="url(#l3da)"/><text x="296" y="214" class="s a">③ copy page 2 into a free frame</text>
<path d="M360 94 V52" class="ln" marker-end="url(#l3d)"/><text x="368" y="78" class="s">④ pointer to page 2 → interpret layout, update</text>
<text x="520" y="214" class="s">⑤ later: write the</text><text x="520" y="228" class="s">dirty page back</text>
</svg>
<figcaption>Lecture 3 covers the database file on disk; Lecture 4 covers the buffer pool; execution comes after the midterm.</figcaption>
</figure>`;

  var heapDir = `
<figure class="diagram">
<svg viewBox="0 0 640 200" width="640" role="img" aria-label="Page directory pointing to data pages with free-space information">
${marker('l3p')}
<rect x="20" y="24" width="190" height="28" class="bxv"/><text x="115" y="43" text-anchor="middle" class="b">Page directory</text>
<rect x="20" y="52" width="190" height="120" class="bx"/>
<text x="32" y="74" class="m">page 1 → free 12%</text><text x="32" y="98" class="m">page 2 → free 64%</text><text x="32" y="122" class="m">page 3 → full</text><text x="32" y="146" class="m">page 4 → empty</text>
<rect x="330" y="20" width="110" height="36" rx="4" class="bx"/><text x="385" y="43" text-anchor="middle" class="m">data page 1</text>
<rect x="330" y="66" width="110" height="36" rx="4" class="bx"/><text x="385" y="89" text-anchor="middle" class="m">data page 2</text>
<rect x="330" y="112" width="110" height="36" rx="4" class="bx"/><text x="385" y="135" text-anchor="middle" class="m">data page 3</text>
<rect x="330" y="158" width="110" height="36" rx="4" class="bx2"/><text x="385" y="181" text-anchor="middle" class="m">data page 4</text>
<path d="M210 70 C270 70 270 38 328 38 M210 94 C270 94 270 84 328 84 M210 118 C270 118 270 130 328 130 M210 142 C270 142 270 176 328 176" class="ln" marker-end="url(#l3p)"/>
<text x="460" y="80" class="s">Inserts check the directory</text><text x="460" y="96" class="s">for a page with free space</text><text x="460" y="112" class="s">instead of scanning the file.</text>
</svg>
<figcaption>The directory pages must be kept in sync with the data pages.</figcaption>
</figure>`;

  var slotted = `
<figure class="diagram">
<svg viewBox="0 0 640 170" width="640" role="img" aria-label="Slotted page: header and slot array at the front, tuples packed from the end">
${marker('l3s', 'arrowhead-a')}
<rect x="20" y="30" width="600" height="110" rx="4" class="bx"/>
<rect x="20" y="30" width="120" height="40" class="bx2"/><text x="80" y="55" text-anchor="middle" class="b">Header</text>
<rect x="140" y="30" width="40" height="40" class="bxa"/><text x="160" y="55" text-anchor="middle" class="m">1</text>
<rect x="180" y="30" width="40" height="40" class="bxa"/><text x="200" y="55" text-anchor="middle" class="m">2</text>
<rect x="220" y="30" width="40" height="40" class="bxa"/><text x="240" y="55" text-anchor="middle" class="m">3</text>
<rect x="260" y="30" width="40" height="40" class="bxa"/><text x="280" y="55" text-anchor="middle" class="m">4</text>
<path d="M305 50 H360" class="lna" marker-end="url(#l3s)"/>
<text x="400" y="92" text-anchor="middle" class="s">free space</text>
<rect x="420" y="100" width="70" height="40" class="bxg"/><text x="455" y="125" text-anchor="middle" class="m">tuple 4</text>
<rect x="490" y="100" width="50" height="40" class="bxg"/><text x="515" y="125" text-anchor="middle" class="m">tuple 3</text>
<rect x="540" y="70" width="80" height="30" class="bxg"/><text x="580" y="90" text-anchor="middle" class="m">tuple 1</text>
<rect x="540" y="100" width="80" height="40" class="bxg"/><text x="580" y="125" text-anchor="middle" class="m">tuple 2</text>
<path d="M415 120 H365" class="lna" marker-end="url(#l3s)"/>
<text x="140" y="22" class="s">slot array grows →</text><text x="470" y="160" class="s">← tuple data grows</text>
<path d="M160 70 C160 110 520 70 538 82" class="lnd"/>
</svg>
<figcaption>Each slot stores the offset (and length) of one tuple. The page is full when the two regions meet.</figcaption>
</figure>`;

  var lsmDiag = `
<figure class="diagram">
<svg viewBox="0 0 660 250" width="660" role="img" aria-label="LSM tree: writes go to the MemTable, which is flushed to SSTables that are compacted into lower levels">
${marker('l3l')}
<rect x="20" y="20" width="160" height="40" rx="6" class="bxv"/><text x="100" y="45" text-anchor="middle" class="b">PUT / DELETE</text>
<rect x="240" y="14" width="190" height="52" rx="6" class="bxa"/><text x="335" y="36" text-anchor="middle" class="b">MemTable</text><text x="335" y="54" text-anchor="middle" class="s">sorted, in memory</text>
<path d="M180 40 H238" class="ln" marker-end="url(#l3l)"/>
<line x1="20" y1="88" x2="640" y2="88" class="lnd"/><text x="630" y="82" text-anchor="end" class="s">memory</text><text x="630" y="104" text-anchor="end" class="s">disk</text>
<path d="M335 66 V112" class="ln" marker-end="url(#l3l)"/><text x="345" y="96" class="s">flush (sequential write)</text>
<text x="40" y="136" class="b">Level 0</text>
<rect x="240" y="116" width="80" height="32" rx="4" class="bxg"/><text x="280" y="137" text-anchor="middle" class="m">SSTable</text>
<rect x="330" y="116" width="80" height="32" rx="4" class="bxg"/><text x="370" y="137" text-anchor="middle" class="m">SSTable</text>
<rect x="420" y="116" width="80" height="32" rx="4" class="bxg"/><text x="460" y="137" text-anchor="middle" class="m">SSTable</text>
<text x="40" y="186" class="b">Level 1</text>
<rect x="240" y="166" width="170" height="32" rx="4" class="bxg"/><text x="325" y="187" text-anchor="middle" class="m">SSTable</text>
<rect x="420" y="166" width="170" height="32" rx="4" class="bxg"/><text x="505" y="187" text-anchor="middle" class="m">SSTable</text>
<text x="40" y="236" class="b">Level 2</text>
<rect x="240" y="216" width="390" height="32" rx="4" class="bxg"/><text x="435" y="237" text-anchor="middle" class="m">SSTable (larger, older)</text>
<path d="M560 132 C610 132 610 150 590 164" class="ln" marker-end="url(#l3l)"/><text x="604" y="136" class="s">compact</text>
<path d="M600 182 C640 182 640 205 626 214" class="ln" marker-end="url(#l3l)"/>
</svg>
<figcaption>Writes are always sequential appends. Compaction sort-merges SSTables, keeping only the latest value of each key.</figcaption>
</figure>`;

  var ioDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 210" width="640" role="img" aria-label="Index-organized storage: B+Tree inner nodes route to leaf pages that store tuples sorted by key">
${marker('l3i')}
<rect x="250" y="14" width="140" height="34" rx="4" class="bxa"/><text x="320" y="36" text-anchor="middle" class="m">[ 20 | 60 ]</text>
<text x="400" y="36" class="s">inner node: keys only, route the search</text>
<path d="M270 48 L120 96 M320 48 L320 96 M370 48 L520 96" class="ln" marker-end="url(#l3i)"/>
<g>
<rect x="40" y="98" width="170" height="100" rx="4" class="bx"/>
<rect x="40" y="98" width="170" height="20" class="bx2"/><text x="125" y="113" text-anchor="middle" class="s">header | slots</text>
<text x="52" y="138" class="m">5  → tuple(5,…)</text><text x="52" y="160" class="m">11 → tuple(11,…)</text><text x="52" y="182" class="m">17 → tuple(17,…)</text>
</g>
<g>
<rect x="235" y="98" width="170" height="100" rx="4" class="bx"/>
<rect x="235" y="98" width="170" height="20" class="bx2"/><text x="320" y="113" text-anchor="middle" class="s">header | slots</text>
<text x="247" y="138" class="m">20 → tuple(20,…)</text><text x="247" y="160" class="m">34 → tuple(34,…)</text><text x="247" y="182" class="m">47 → tuple(47,…)</text>
</g>
<g>
<rect x="430" y="98" width="170" height="100" rx="4" class="bx"/>
<rect x="430" y="98" width="170" height="20" class="bx2"/><text x="515" y="113" text-anchor="middle" class="s">header | slots</text>
<text x="442" y="138" class="m">60 → tuple(60,…)</text><text x="442" y="160" class="m">72 → tuple(72,…)</text><text x="442" y="182" class="m">88 → tuple(88,…)</text>
</g>
<path d="M210 150 H233 M405 150 H428" class="lnd" marker-end="url(#l3i)"/>
</svg>
<figcaption>Leaf pages still look like slotted pages, but the tuples themselves live in the index, sorted by key.</figcaption>
</figure>`;

  var tupleDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 150" width="640" role="img" aria-label="Tuple layout: header with visibility info and null bitmap, followed by attribute data">
<rect x="40" y="40" width="190" height="44" class="bxv"/><text x="135" y="60" text-anchor="middle" class="b">Header</text><text x="135" y="76" text-anchor="middle" class="s">visibility · null bitmap</text>
<rect x="230" y="40" width="110" height="44" class="bxg"/><text x="285" y="67" text-anchor="middle" class="m">a</text>
<rect x="340" y="40" width="110" height="44" class="bxg"/><text x="395" y="67" text-anchor="middle" class="m">b</text>
<rect x="450" y="40" width="150" height="44" class="bxg"/><text x="525" y="67" text-anchor="middle" class="m">c</text>
<text x="40" y="26" class="s">CREATE TABLE foo (a INT PRIMARY KEY, b INT NOT NULL, c VARCHAR(16));</text>
<text x="230" y="108" class="s">attribute data, in the order the columns were declared</text>
<text x="40" y="108" class="s">no schema info stored here</text>
<text x="40" y="134" class="s">The catalog tells the DBMS how to interpret the bytes (types, offsets, lengths).</text>
</svg>
</figure>`;

  var overflow = `
<figure class="diagram">
<svg viewBox="0 0 640 150" width="640" role="img" aria-label="A tuple whose large value is stored in overflow pages">
${marker('l3o')}
<rect x="30" y="40" width="80" height="40" class="bxv"/><text x="70" y="65" text-anchor="middle" class="s">header</text>
<rect x="110" y="40" width="70" height="40" class="bxg"/><text x="145" y="65" text-anchor="middle" class="m">a</text>
<rect x="180" y="40" width="70" height="40" class="bxg"/><text x="215" y="65" text-anchor="middle" class="m">b</text>
<rect x="250" y="40" width="90" height="40" class="bxw"/><text x="295" y="58" text-anchor="middle" class="m">c →</text><text x="295" y="73" text-anchor="middle" class="s">size|loc</text>
<text x="30" y="30" class="s">tuple in a data page</text>
<rect x="400" y="20" width="200" height="40" rx="4" class="bx"/><text x="500" y="45" text-anchor="middle" class="m">overflow page 1</text>
<rect x="400" y="90" width="200" height="40" rx="4" class="bx"/><text x="500" y="115" text-anchor="middle" class="m">overflow page 2</text>
<path d="M340 60 C370 60 370 40 398 40" class="ln" marker-end="url(#l3o)"/>
<path d="M600 40 C630 40 630 110 602 110" class="ln" marker-end="url(#l3o)"/>
</svg>
<figcaption>Large values (e.g. Postgres TOAST &gt; 2 KB) are moved to separate overflow pages that can be chained.</figcaption>
</figure>`;

  DBP.addTopic({
    id: 'storage',
    group: 'Lectures',
    num: 'L3',
    title: 'Database Storage',
    summary: 'Storage hierarchy, files and pages, heap files, slotted pages, tuple layout, LSM and index-organized storage, data representation, catalogs.',
    lead: 'How a disk-oriented DBMS lays the database out in files, pages and tuples — and the alternatives (log-structured and index-organized storage).',
    source: 'Lecture 3 slides; textbook 12.1–12.4, 13.2–13.3, 14.8.1, 24.2',
    sections: [
      {
        id: 'hierarchy', title: 'Disk-based architecture',
        body: `
<p>A <b>disk-oriented DBMS</b> assumes the primary storage location of the database is <b>non-volatile disk</b>. Its components manage the movement of data between non-volatile and volatile storage.</p>
${hierarchy}
<h3>Access times</h3>
<p>“Latency numbers every programmer should know” — and the same numbers scaled so that an L1 cache hit takes one second:</p>
<table><thead><tr><th>Operation</th><th>Latency</th><th>If L1 = 1 second</th></tr></thead><tbody>
<tr><td>L1 cache reference</td><td>0.5 ns</td><td>0.5 sec</td></tr>
<tr><td>L2 cache reference</td><td>7 ns</td><td>7 sec</td></tr>
<tr><td>DRAM</td><td>100 ns</td><td>100 sec</td></tr>
<tr><td>SSD</td><td>150,000 ns</td><td>1.7 days</td></tr>
<tr><td>HDD</td><td>10,000,000 ns</td><td>16.5 weeks</td></tr>
<tr><td>Network storage</td><td>~30,000,000 ns</td><td>11.4 months</td></tr>
<tr><td>Tape archives</td><td>1,000,000,000 ns</td><td>31.7 years</td></tr>
</tbody></table>
<h3>Sequential vs. random access</h3>
<p>Random access on non-volatile storage is almost always <b>much slower than sequential access</b>. So the DBMS wants to maximize sequential access: its algorithms try to reduce the number of writes to random pages so that data is stored in contiguous blocks. Allocating multiple pages at the same time is called an <b>extent</b>.</p>
<div class="callout key"><span class="ct">System design goals</span><ul>
<li>Allow the DBMS to manage databases that <b>exceed the amount of memory</b> available.</li>
<li>Reading/writing disk is expensive, so it must be managed carefully to avoid large stalls and performance degradation.</li>
<li>Maximize <b>sequential</b> access.</li></ul></div>
${diskOriented}
<p>Database storage has two problems: <b>(1)</b> how the DBMS represents the database in files on disk (this lecture), and <b>(2)</b> how it manages memory and moves data back and forth (the buffer pool, next chapter).</p>`
      },
      {
        id: 'files', title: 'Files, pages and the storage manager',
        body: `
<p>The DBMS stores a database as one or more <b>files on disk</b>, typically in a proprietary format. The OS knows nothing about their contents. (Early 1980s systems used custom filesystems on raw block storage; some “enterprise” DBMSs still support this, most newer ones do not.)</p>
<p>The <b>storage manager</b> maintains the database’s files. Some do their own scheduling of reads and writes to improve spatial and temporal locality. It organizes the files as a <b>collection of pages</b>, tracks data read/written to pages and tracks the available space. A DBMS typically does <b>not</b> keep multiple copies of a page on disk (replication happens above or below the storage manager).</p>
<h3>Pages</h3>
<p>A <b>page</b> is a fixed-size block of data. It can contain tuples, meta-data, indexes, log records… Most systems do not mix page types within a page, and some require a page to be <b>self-contained</b> (all info needed to read it is inside it, e.g. Oracle). Each page has a unique <b>page ID</b> — unique per DBMS instance, per database, or per table — and an <b>indirection layer</b> maps page IDs to physical locations.</p>
<table><thead><tr><th>“Page” means…</th><th>Typical size</th></tr></thead><tbody>
<tr><td>Hardware page</td><td>usually 4 KB</td></tr>
<tr><td>OS page</td><td>usually 4 KB (x64 also 2 MB / 1 GB huge pages)</td></tr>
<tr><td>Database page</td><td>512 B – 32 KB</td></tr>
</tbody></table>
<div class="callout key"><span class="ct">Why the hardware page matters</span><p>A hardware page is the <b>largest block the storage device can guarantee a failsafe (atomic) write</b> for. If a database page is larger than a hardware page, a crash can leave it half-written (a “torn page”), so the DBMS must take extra precautions. DBMSs specialized for read-only workloads use larger pages.</p></div>
<h3>Page storage architectures</h3>
<p>Different DBMSs manage pages in files differently: <b>heap file</b> organization, <b>tree file</b> organization, <b>sequential/sorted</b> file organization (ISAM) and <b>hashing</b> file organization. At this level we don’t care what is inside the pages.</p>
<h3>Heap files and the page directory</h3>
<p>A <b>heap file</b> is an <b>unordered</b> collection of pages with tuples stored in random order. It supports create / get / write / delete page and must support iterating over all pages. Extra meta-data tracks where pages are and how much free space they have.</p>
<p>The DBMS maintains special <b>directory pages</b> that track the location of data pages in the database files (one entry per database object). It also keeps meta-data about each page’s contents: <b>amount of free space</b>, list of <b>free/empty pages</b>, and <b>page type</b> (data vs. meta-data).</p>
${heapDir}`
      },
      {
        id: 'page-layout', title: 'Page layout and slotted pages',
        body: `
<p>Every page has a <b>header</b> with meta-data about its contents: page size, checksum, DBMS version, transaction visibility, compression/encoding meta-data, schema information, data summaries/sketches.</p>
<p>How do we organize the data inside a page? (For now we assume row-oriented storage.) Three approaches: <b>tuple-oriented</b> storage, <b>log-structured</b> storage, and <b>index-organized</b> storage.</p>
<h3>Strawman: append tuples</h3>
<p>Keep a count of tuples in the header and append each new tuple at the end. Problems: <b>what happens if we delete a tuple?</b> (a hole appears that the simple counter cannot track), and <b>what if attributes are variable-length?</b> (we can no longer compute where tuple <i>i</i> starts).</p>
<h3>Slotted pages</h3>
<p>The most common layout. A <b>slot array</b> at the start of the page maps “slots” to the tuples’ starting offsets. The header tracks the number of used slots and the offset of the start of the last slot used. Slots grow from the front; tuple data grows from the back; the page is full when they meet.</p>
${slotted}
<div data-sim="slottedPage"></div>
<h3>Record IDs</h3>
<p>The DBMS assigns each logical tuple a unique <b>record identifier</b> representing its physical location — most commonly <b>(file id, page id, slot #)</b>. Most DBMSs do not store the id in the tuple itself. SQLite uses <code>ROWID</code> as the true primary key and stores it as a hidden attribute; PostgreSQL calls it <code>CTID</code>.</p>
<div class="callout warn"><span class="ct">Applications should never rely on record IDs</span><p>They describe a <i>physical</i> location and can change (e.g. after a vacuum/compaction moves tuples to other pages, or when an update doesn’t fit and the tuple moves).</p></div>
<div class="callout key"><span class="ct">Why the slot array is clever</span><p>It is a level of <b>indirection</b>: the DBMS can move a tuple <i>within</i> the page (e.g. to compact free space) by updating only its slot’s offset. The record id (page, slot) stays the same, so indexes pointing at it remain valid.</p></div>`
      },
      {
        id: 'tuple-layout', title: 'Tuple layout',
        body: `
<p>A tuple is essentially a <b>sequence of bytes</b> (not necessarily contiguous). It is the DBMS’s job to interpret those bytes into attribute types and values.</p>
${tupleDiag}
<ul>
<li><b>Tuple header</b>: visibility information (for concurrency control) and a <b>bitmap for NULL values</b>. We do <i>not</i> store schema meta-data in each tuple.</li>
<li><b>Tuple data</b>: attributes are typically stored in the order you declared them in <code>CREATE TABLE</code> — for software-engineering simplicity — although another order might be more efficient (see word alignment below).</li>
</ul>
<h3>Denormalized tuple data</h3>
<p>The DBMS can <b>physically denormalize</b> (“pre-join”) related tuples and store them together in the same page. This can reduce I/O for common access patterns but makes updates more expensive. Not new: IBM System R did it in the 1970s, and several NoSQL DBMSs do it without calling it that.</p>
<div class="grid2">
<pre class="sql">CREATE TABLE foo (a INT PRIMARY KEY, b INT NOT NULL);
CREATE TABLE bar (c INT PRIMARY KEY,
                  a INT REFERENCES foo (a));</pre>
<div class="card small"><b>Pre-joined page:</b><br><span class="mono">[ foo(a=1,b) | bar(c=10) bar(c=11) ]<br>[ foo(a=2,b) | bar(c=12) ]</span><br>Each <code>foo</code> tuple is stored next to the <code>bar</code> tuples that reference it.</div>
</div>
<h3>Operations on tuple-oriented storage</h3>
<div class="grid2">
<div class="card"><h4>Insert a new tuple</h4><ol class="small"><li>Check the page directory to find a page with a free slot.</li><li>Retrieve the page from disk (if not in memory).</li><li>Check the slot array to find empty space that fits.</li></ol></div>
<div class="card"><h4>Update a tuple by record id</h4><ol class="small"><li>Check the page directory for the page’s location.</li><li>Retrieve the page from disk (if not in memory).</li><li>Find the offset using the slot array.</li><li>If the new data fits, overwrite it. Otherwise mark the old tuple deleted and insert the new version in a different page.</li></ol></div>
</div>
<div class="callout warn"><span class="ct">Problems with tuple-oriented storage</span><ol>
<li><b>Fragmentation</b> — pages are not fully utilized (unusable space, empty slots).</li>
<li><b>Useless disk I/O</b> — the DBMS must fetch an entire page to update one tuple.</li>
<li><b>Random disk I/O</b> — in the worst case, each tuple to update is on a separate page.</li></ol>
<p>And what if the system <i>cannot</i> overwrite pages, only create new ones (some object stores, HDFS, Google Colossus)? → log-structured storage.</p></div>`
      },
      {
        id: 'lsm', title: 'Log-structured storage',
        body: `
<p>Instead of storing tuples in pages and updating them in place, the DBMS maintains a <b>log of changes</b> to tuples. Each log entry is a <b>PUT</b> (with the tuple contents) or a <b>DELETE</b> (marks the tuple deleted — a “tombstone”), and every record must contain the tuple’s unique identifier. Originally proposed as <b>log-structured merge trees (LSM trees)</b> in 1996.</p>
<p>The DBMS applies changes to an in-memory data structure, the <b>MemTable</b>, and writes the changes out <b>sequentially</b> to disk as <b>SSTables</b> (sorted string tables). As the application makes changes, the DBMS appends records <b>without checking previous log records</b>.</p>
${lsmDiag}
<h3>Compaction</h3>
<p>Periodically the DBMS <b>compacts</b> SSTables to reduce wasted space and speed up reads: it keeps only the latest value for each key using a <b>sort-merge</b> algorithm.</p>
<h3>Reading</h3>
<p>To read a key, check the MemTable first, then the SSTables from <b>newest to oldest</b>, stopping at the first match. (Real systems add a summary table with min/max keys and a Bloom filter per SSTable to skip files.)</p>
<div data-sim="lsm"></div>
<div class="pro-con">
<div class="card pro"><h4>Why it’s popular</h4><ul class="small"><li>All writes are fast <b>sequential appends</b>.</li><li>Ideal for write-heavy workloads; works on append-only storage.</li><li>Much more common today, partly due to the spread of <b>RocksDB</b> (also LevelDB, Cassandra, HBase…).</li></ul></div>
<div class="card con"><h4>Downsides</h4><ul class="small"><li><b>Write amplification</b>: the same tuple is rewritten many times by compactions.</li><li><b>Compaction is expensive</b>.</li><li>Reads may have to check several SSTables.</li></ul></div>
</div>`
      },
      {
        id: 'index-organized', title: 'Index-organized storage',
        body: `
<p>Both table storage approaches so far (tuple-oriented heap and log-structured) need <b>separate indexes</b> to find individual tuples, because the tables are inherently unsorted. What if the DBMS kept tuples sorted automatically using an index?</p>
<p>In <b>index-organized storage</b>, the DBMS stores a table’s tuples as the <b>value</b> of an index data structure (e.g. the leaves of a B+Tree). Pages still use a slotted-page-like layout, and tuples are typically sorted within a page by key. Examples: MySQL InnoDB and SQLite tables are organized around their primary key.</p>
${ioDiag}
<div class="callout key"><span class="ct">Remember this one-liner</span><p><b>B+Trees pay maintenance costs upfront</b> (keep things sorted on every insert), <b>whereas LSMs pay for it later</b> (during compaction).</p></div>`
      },
      {
        id: 'data-repr', title: 'Data representation',
        body: `
<p>The DBMS’s <b>catalogs</b> contain the schema information it uses to figure out a tuple’s layout.</p>
<h3>Word alignment</h3>
<p>All attributes in a tuple should be <b>word-aligned</b> so the CPU can access them without unexpected behaviour or extra work. Example: with 64-bit words, if a 64-bit <code>cdate</code> starts 32 bits into a word, reading it needs two memory accesses (or crashes on some architectures).</p>
<div class="grid2">
<div class="card"><h4>Padding</h4><p class="small">Add empty bits after attributes so that the tuple is word-aligned — essentially round the storage size of each attribute up to the next word.</p></div>
<div class="card"><h4>Reordering</h4><p class="small">Switch the order of attributes in the <i>physical</i> layout so they fit together in words. May still need padding to fill the remaining space.</p></div>
</div>
<div data-sim="wordAlign"></div>
<h3>Data types</h3>
<table><thead><tr><th>SQL types</th><th>Representation</th></tr></thead><tbody>
<tr><td><code>INTEGER</code>, <code>BIGINT</code>, <code>SMALLINT</code>, <code>TINYINT</code></td><td>Same as in C/C++</td></tr>
<tr><td><code>FLOAT</code>, <code>REAL</code>/<code>DOUBLE</code></td><td>IEEE-754 standard (inexact, variable precision)</td></tr>
<tr><td><code>NUMERIC</code>, <code>DECIMAL</code></td><td>Fixed-point decimals (exact, arbitrary precision)</td></tr>
<tr><td><code>VARCHAR</code>, <code>VARBINARY</code>, <code>TEXT</code>, <code>BLOB</code></td><td>Header with length followed by the data bytes, <b>or</b> a pointer to another page/offset with the data. Must also handle collations/sorting.</td></tr>
<tr><td><code>TIME</code>, <code>DATE</code>, <code>TIMESTAMP</code>, <code>INTERVAL</code></td><td>32/64-bit integer of (micro/milli)seconds since the Unix epoch (January 1, 1970)</td></tr>
</tbody></table>
<div class="grid2">
<div class="card"><h4>Variable precision (FLOAT, REAL)</h4><p class="small">Stored directly as IEEE-754 using “native” C/C++ types. <b>Fast</b>, because CPUs have instructions and registers for them — but they do <b>not guarantee exact values</b>: <code>0.1 + 0.2</code> prints as <code>0.30000000000000004</code>.</p></div>
<div class="card"><h4>Fixed precision (NUMERIC, DECIMAL)</h4><p class="small">Arbitrary precision and scale; used when <b>rounding errors are unacceptable</b> (money!). Typically stored as an exact variable-length binary representation plus meta-data (e.g. Postgres stores digits, weight, scale and sign). Slower than floats.</p></div>
</div>
<h3>NULL values</h3>
<table><thead><tr><th>Approach</th><th>How</th><th>Notes</th></tr></thead><tbody>
<tr><td><b>1. Null column bitmap header</b></td><td>A bitmap in a central header marks which attributes are null</td><td>The <b>most common</b> approach in row stores</td></tr>
<tr><td><b>2. Special values</b></td><td>A placeholder value means NULL (e.g. <code>INT32_MIN</code>)</td><td>More common in column stores</td></tr>
<tr><td><b>3. Per-attribute null flag</b></td><td>Store a flag next to each value</td><td>Wastes space: needs more than 1 bit, or word alignment breaks</td></tr>
</tbody></table>
<h3>Large values</h3>
<p>Most DBMSs do not allow a tuple to exceed the size of a single page. Larger values go to separate <b>overflow pages</b>: PostgreSQL <b>TOAST</b> (&gt; 2 KB), MySQL overflow (&gt; ½ of a page), SQL Server overflow (&gt; page size). Possible optimizations: overflow compression, “German strings”.</p>
${overflow}
<p>Some systems can store a large value in an <b>external file</b>, treated as a BLOB (Oracle <code>BFILE</code>, Microsoft <code>FILESTREAM</code>). The DBMS <b>cannot manipulate</b> the contents of the external file: <b>no durability protections and no transaction protections</b>.</p>`
      },
      {
        id: 'catalogs', title: 'System catalogs and schema changes',
        body: `
<p>A DBMS stores meta-data about its databases in internal <b>catalogs</b>: tables, columns, indexes, views; users and permissions; internal statistics. Almost every DBMS stores the catalog <b>inside itself, as tables</b> — wrapped in an object abstraction — with special code to “bootstrap” the catalog tables.</p>
<p>You can query the ANSI-standard <b><code>INFORMATION_SCHEMA</code></b>: a set of read-only views with information about all tables, views, columns and procedures. DBMSs also have non-standard shortcuts:</p>
<pre class="sql">-- SQL-92: list all tables in the current database
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE table_catalog = '&lt;db name&gt;';
-- Postgres: \\d      MySQL: SHOW TABLES;      SQLite: .tables

-- SQL-92: describe the student table
SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'student';
-- Postgres: \\d student   MySQL: DESCRIBE student;   SQLite: .schema student</pre>
<pre class="sql" data-run="SQLite stores its catalog as a table, too">SELECT type, name, sql FROM sqlite_master;</pre>
<h3>Schema changes</h3>
<table><thead><tr><th>Change</th><th>Row store (NSM)</th><th>Column store (DSM)</th></tr></thead><tbody>
<tr><td><code>ADD COLUMN</code></td><td>Copy tuples into a new region of memory</td><td>Just create the new column segment on disk</td></tr>
<tr><td><code>DROP COLUMN</code></td><td>#1 copy tuples to a new region; #2 mark column “deprecated”, clean up later</td><td>Just drop the column and free memory</td></tr>
<tr><td><code>CHANGE COLUMN</code></td><td colspan="2">Check whether the conversion is allowed; depends on default values</td></tr>
</tbody></table>
<h3>Indexes</h3>
<ul>
<li><b>CREATE INDEX</b>: scan the entire table and populate the index. Changes made by transactions <i>while</i> the index is being built must be recorded; when the scan completes, lock the table and resolve the changes missed after the scan started.</li>
<li><b>DROP INDEX</b>: just drop it logically from the catalog. It only becomes “invisible” when the dropping transaction commits — existing transactions must still update it until then.</li>
</ul>
<div class="callout key"><span class="ct">Conclusion of the lecture</span><p>A database is organized in pages, with different ways to track and store pages and tuples. Log-structured storage is an alternative to the tuple-oriented architecture that suits write-heavy workloads by maximizing sequential I/O. And the storage manager is not entirely independent from the rest of the DBMS.</p></div>`
      }
    ],
    exercises: [
      {
        level: 'Warm-up', title: 'Storage hierarchy',
        q: '<p>Order these from fastest to slowest and mark each as volatile or non-volatile: HDD, DRAM, CPU cache, SSD, network storage, CPU registers. Which ones are byte-addressable?</p>',
        a: '<p>Registers → CPU caches → DRAM → SSD → HDD → network storage. The first three are <b>volatile</b>, random-access and <b>byte-addressable</b>; SSD, HDD and network storage are <b>non-volatile</b> and <b>block-addressable</b> (you read/write whole blocks/pages), and favour sequential access.</p>'
      },
      {
        level: 'Core', title: 'How many tuples fit?',
        q: '<p>A slotted page is 4 KB (4096 bytes). The page header uses 24 bytes, each slot-array entry uses 4 bytes, and every tuple is exactly 100 bytes. What is the maximum number of tuples per page? How much space is left unused?</p>',
        hint: 'Each tuple costs its own bytes plus one slot entry.',
        a: '<p>Each tuple needs 100 + 4 = 104 bytes. Available: 4096 − 24 = 4072 bytes. ⌊4072 / 104⌋ = <b>39 tuples</b> (39 × 104 = 4056 bytes), leaving <b>16 bytes</b> unused — an example of internal fragmentation.</p>'
      },
      {
        level: 'Core', title: 'Delete, insert, compact',
        q: '<p>A slotted page contains tuples in slots #0, #1, #2. Tuple #1 is deleted, then a new tuple is inserted, then the page is compacted. (a) Which slot does the new tuple likely get? (b) After compaction, which record ids changed?</p>',
        a: '<p>(a) The DBMS can <b>reuse the empty slot #1</b> (if the new tuple fits in the free space), so the new tuple’s record id is (page, 1). (b) <b>None.</b> Compaction moves tuple bytes inside the page and updates the offsets <i>in the slot array</i>; slot numbers — and therefore record ids — stay the same. That indirection is the whole point of the slot array. (Try it in the simulator above.)</p>'
      },
      {
        level: 'Exam-style', title: 'Word alignment',
        q: '<p>Assume 64-bit words. A table has attributes, in declared order: <code>a SMALLINT</code> (16 bits), <code>b BIGINT</code> (64), <code>c INT</code> (32), <code>d CHAR(2)</code> (16), <code>e INT</code> (32). (a) Stored as declared without padding, which attributes straddle a word boundary? (b) What is the tuple size with padding (each attribute rounded up to a word)? (c) With reordering?</p>',
        a: '<p>(a) Offsets: a 0–15, b 16–79 (<b>crosses</b> bit 64), c 80–111, d 112–127, e 128–159. Only <b>b</b> straddles a boundary.</p><p>(b) Padding: every attribute is smaller than or equal to a word, so each takes one word: <b>5 words = 40 bytes</b>.</p><p>(c) Reordering: <code>[b]</code>, <code>[c | e]</code>, <code>[a | d | 32 bits of padding]</code> = <b>3 words = 24 bytes</b>. You can verify this by entering the schema in the simulator.</p>'
      },
      {
        level: 'Exam-style', title: 'LSM trace',
        q: '<p>An LSM store has a MemTable that is flushed when it contains 2 keys. Starting empty, run: <code>PUT a=1, PUT b=2, PUT a=3, DELETE b, PUT c=5, PUT a=7</code>. (a) Show the SSTables and MemTable afterwards. (b) Trace <code>GET b</code>. (c) Show the result of compacting all SSTables.</p>',
        a: '<ol type="a"><li><code>PUT a=1, PUT b=2</code> → MemTable {a=1, b=2} is full → flushed as <b>SST#1 {a=1, b=2}</b>. <code>PUT a=3, DELETE b</code> → {a=3, b=✝} → flushed as <b>SST#2 {a=3, b=✝}</b>. <code>PUT c=5, PUT a=7</code> → {a=7, c=5} → flushed as <b>SST#3 {a=7, c=5}</b>. MemTable is empty.</li><li><code>GET b</code>: MemTable (miss) → SST#3 (newest, miss) → SST#2: finds the <b>tombstone</b> → result is <b>not found</b>. It stops there and never looks at the stale b=2 in SST#1.</li><li>Compaction keeps the latest value per key and drops tombstones: <b>{a=7, c=5}</b>.</li></ol>'
      },
      {
        level: 'Concept', title: 'FLOAT or NUMERIC?',
        q: '<p>You store bank balances. Should the column be <code>FLOAT</code> or <code>NUMERIC(12,2)</code>? Justify using how each is represented.</p>',
        a: '<p><b>NUMERIC/DECIMAL.</b> FLOAT/REAL use IEEE-754 binary floating point: fast (hardware support) but inexact — e.g. 0.1 cannot be represented exactly, so rounding errors accumulate. NUMERIC is fixed-point with exact, arbitrary precision (stored as a variable-length exact representation with meta-data), which is what you need when rounding errors are unacceptable. The cost is slower arithmetic.</p>'
      },
      {
        level: 'Concept', title: 'Three problems',
        q: '<p>Name the three problems of tuple-oriented (slotted page) storage that the lecture lists, and explain how log-structured storage addresses the I/O-related ones.</p>',
        a: '<p>(1) <b>Fragmentation</b>: pages are not fully used. (2) <b>Useless disk I/O</b>: fetch an entire page to update one tuple. (3) <b>Random disk I/O</b>: updating many tuples may touch many different pages.</p><p>Log-structured storage never updates in place: it appends PUT/DELETE records to an in-memory MemTable and writes them out <b>sequentially</b> as SSTables, so writes avoid both the read-modify-write of whole pages and random I/O. The price is write amplification and expensive compaction (and slower reads).</p>'
      },
      {
        level: 'Concept', title: 'NULLs and large values',
        q: '<p>(a) Why does a per-attribute null flag usually cost more than one bit? (b) What happens when a tuple has a 1 MB TEXT value in PostgreSQL? (c) Why is storing a value in an external file (BFILE / FILESTREAM) risky?</p>',
        a: '<p>(a) A single-bit flag next to each attribute would break word alignment, so the flag ends up taking a byte or a whole word — which is why the centralized null bitmap in the tuple header is more common.</p><p>(b) It exceeds the TOAST threshold (2 KB), so the value is moved to separate <b>overflow (TOAST) pages</b> and the tuple keeps a pointer to it.</p><p>(c) The DBMS cannot manipulate the external file, so it provides <b>no durability and no transaction protection</b> for it.</p>'
      }
    ],
    quiz: [
      { q: 'Which storage devices are non-volatile?', o: ['CPU caches and DRAM', 'SSD and HDD', 'Registers and DRAM', 'Only tape'], a: 1, e: 'SSD, HDD, network storage and tape keep data without power. DRAM and caches are volatile.' },
      { q: 'Why does a DBMS try to maximize sequential I/O?', o: ['Sequential I/O uses less memory', 'Random access on non-volatile storage is much slower than sequential access', 'The OS forbids random access', 'Sequential I/O avoids the need for logging'], a: 1, e: 'Random access is almost always much slower on disk/SSD, so DBMS algorithms favour contiguous blocks (extents).' },
      { q: 'What is an “extent”?', o: ['A page header field', 'Allocating multiple contiguous pages at the same time', 'A type of index', 'The maximum tuple size'], a: 1, e: 'Allocating several pages at once keeps them contiguous so later reads are sequential.' },
      { q: 'What is special about the hardware page size?', o: ['It is always 1 MB', 'It is the largest block the device can guarantee a failsafe write for', 'It must equal the database page size', 'It is chosen by the DBMS'], a: 1, e: 'Writes up to the hardware page size are atomic; larger database pages risk torn writes.' },
      { q: 'What does a heap file’s page directory track?', o: ['Tuple values', 'Locations of data pages and their free space / type', 'Only the B+Tree root', 'The SQL query plan'], a: 1, e: 'Directory pages map page IDs to locations and keep meta-data like free space per page and page type.' },
      { q: 'In a slotted page, the slot array…', o: ['stores the tuples themselves', 'maps slot numbers to tuple starting offsets', 'is stored at the end of the page after the tuples', 'is only used for variable-length tuples in column stores'], a: 1, e: 'The slot array maps slots to offsets; it grows from the front while tuples grow from the back.' },
      { q: 'A typical record id consists of…', o: ['(table name, primary key)', '(file id, page id, slot #)', '(hash value, bucket)', '(LSN, timestamp)'], a: 1, e: 'Record ids describe the physical location: file, page and slot.' },
      { q: 'What is stored in the tuple header?', o: ['The table’s schema', 'Visibility info and a NULL bitmap', 'The page directory', 'The index keys'], a: 1, e: 'The header holds concurrency-control visibility info and a bitmap for NULLs. Schema info lives in the catalog.' },
      { q: 'In log-structured storage, a DELETE is recorded as…', o: ['an in-place overwrite with zeros', 'a log record that marks the tuple as deleted (tombstone)', 'removal of the key from every SSTable immediately', 'a new page'], a: 1, e: 'Deletes are appended as tombstones; compaction removes the old data later.' },
      { q: 'What is a main downside of log-structured storage?', o: ['Random writes', 'Write amplification and expensive compaction', 'It cannot store variable-length data', 'It needs a slotted page per tuple'], a: 1, e: 'Data gets rewritten during compactions (write amplification), which is expensive.' },
      { q: '“B+Trees pay maintenance costs upfront, whereas LSMs pay for it later.” What does “later” refer to?', o: ['Query optimization', 'Compaction', 'Recovery', 'Vacuum of the page directory'], a: 1, e: 'LSMs defer the work of keeping data sorted/clean to compaction.' },
      { q: 'Why might a DBMS reorder a tuple’s attributes physically?', o: ['To satisfy foreign keys', 'To keep attributes word-aligned with less padding', 'Because SQL requires alphabetical order', 'To compress NULLs'], a: 1, e: 'Reordering lets small attributes share a word, reducing padding while keeping alignment.' },
      { q: 'Which type should you use when rounding errors are unacceptable?', o: ['FLOAT', 'REAL', 'NUMERIC / DECIMAL', 'DOUBLE'], a: 2, e: 'Fixed-precision NUMERIC/DECIMAL are exact; FLOAT/REAL follow IEEE-754 and are inexact.' },
      { q: 'What is the most common way row stores represent NULL?', o: ['Special values like INT32_MIN', 'A null bitmap in the tuple header', 'A per-attribute 1-byte flag', 'Storing the string "NULL"'], a: 1, e: 'Special values are more common in column stores; per-attribute flags waste space.' },
      { q: 'What is TOAST in PostgreSQL?', o: ['Its transaction log', 'Overflow storage for values larger than ~2 KB', 'Its query optimizer', 'Its buffer replacement policy'], a: 1, e: 'Large values are moved to separate overflow (TOAST) pages.' },
      { q: 'Where do almost all DBMSs store their catalog?', o: ['In a separate XML file', 'Inside the database itself, as tables', 'Only in memory', 'In the OS registry'], a: 1, e: 'Catalogs are stored as tables inside the DBMS, with special bootstrapping code.' }
    ]
  });
})();
