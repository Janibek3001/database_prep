(function () {
  'use strict';
  function marker(id, cls) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="' + (cls || 'arrowhead') + '"/></marker></defs>';
  }

  var workloadDiag = `
<figure class="diagram">
<svg viewBox="0 0 560 280" width="560" role="img" aria-label="Workload chart: OLTP is simple and write-heavy, OLAP is complex and read-heavy, HTAP in between">
${marker('l4w')}
<path d="M70 240 H520" class="ln" marker-end="url(#l4w)"/><path d="M70 240 V24" class="ln" marker-end="url(#l4w)"/>
<text x="295" y="270" text-anchor="middle" class="b">Workload focus</text>
<text x="80" y="258" class="s">writes</text><text x="510" y="258" text-anchor="end" class="s">reads</text>
<text x="30" y="140" class="b" transform="rotate(-90 30 140)" text-anchor="middle">Operation complexity</text>
<text x="80" y="232" class="s">simple</text><text x="80" y="40" class="s">complex</text>
<ellipse cx="170" cy="190" rx="80" ry="34" class="bxa"/><text x="170" y="195" text-anchor="middle" class="b a">OLTP</text>
<ellipse cx="420" cy="80" rx="80" ry="34" class="bxg"/><text x="420" y="85" text-anchor="middle" class="b g">OLAP</text>
<ellipse cx="295" cy="138" rx="74" ry="28" class="bxv"/><text x="295" y="143" text-anchor="middle" class="b">HTAP</text>
</svg>
<figcaption>OLTP: many small reads/writes on single entities. OLAP: few complex read-only queries over large portions of the data.</figcaption>
</figure>`;

  var nsmDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 170" width="640" role="img" aria-label="NSM page stores whole tuples one after another; DSM stores each attribute in its own pages">
<text x="20" y="18" class="b">NSM page (row store)</text>
<rect x="20" y="28" width="280" height="130" rx="4" class="bx"/>
<rect x="20" y="28" width="280" height="22" class="bx2"/><text x="160" y="44" text-anchor="middle" class="s">header | slot array</text>
<g class="m">
<rect x="30" y="60" width="260" height="26" class="bxa"/><text x="40" y="78" class="m">id₁ name₁ pass₁ host₁ login₁</text>
<rect x="30" y="90" width="260" height="26" class="bxa"/><text x="40" y="108" class="m">id₂ name₂ pass₂ host₂ login₂</text>
<rect x="30" y="120" width="260" height="26" class="bxa"/><text x="40" y="138" class="m">id₃ name₃ pass₃ host₃ login₃</text>
</g>
<text x="340" y="18" class="b">DSM (column store)</text>
<rect x="340" y="28" width="52" height="130" rx="4" class="bxg"/><text x="366" y="48" text-anchor="middle" class="s">id</text><text x="366" y="76" text-anchor="middle" class="m">id₁</text><text x="366" y="98" text-anchor="middle" class="m">id₂</text><text x="366" y="120" text-anchor="middle" class="m">id₃</text><text x="366" y="142" text-anchor="middle" class="m">⋮</text>
<rect x="398" y="28" width="52" height="130" rx="4" class="bxg"/><text x="424" y="48" text-anchor="middle" class="s">name</text><text x="424" y="76" text-anchor="middle" class="m">n₁</text><text x="424" y="98" text-anchor="middle" class="m">n₂</text><text x="424" y="120" text-anchor="middle" class="m">n₃</text><text x="424" y="142" text-anchor="middle" class="m">⋮</text>
<rect x="456" y="28" width="52" height="130" rx="4" class="bxg"/><text x="482" y="48" text-anchor="middle" class="s">pass</text><text x="482" y="76" text-anchor="middle" class="m">p₁</text><text x="482" y="98" text-anchor="middle" class="m">p₂</text><text x="482" y="120" text-anchor="middle" class="m">p₃</text><text x="482" y="142" text-anchor="middle" class="m">⋮</text>
<rect x="514" y="28" width="52" height="130" rx="4" class="bxg"/><text x="540" y="48" text-anchor="middle" class="s">host</text><text x="540" y="76" text-anchor="middle" class="m">h₁</text><text x="540" y="98" text-anchor="middle" class="m">h₂</text><text x="540" y="120" text-anchor="middle" class="m">h₃</text><text x="540" y="142" text-anchor="middle" class="m">⋮</text>
<rect x="572" y="28" width="52" height="130" rx="4" class="bxg"/><text x="598" y="48" text-anchor="middle" class="s">login</text><text x="598" y="76" text-anchor="middle" class="m">l₁</text><text x="598" y="98" text-anchor="middle" class="m">l₂</text><text x="598" y="120" text-anchor="middle" class="m">l₃</text><text x="598" y="142" text-anchor="middle" class="m">⋮</text>
</svg>
<figcaption>In DSM, the <i>i</i>-th value of every column belongs to tuple <i>i</i>.</figcaption>
</figure>`;

  var paxDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 230" width="640" role="img" aria-label="PAX file: row groups each containing column chunks, with a footer of metadata">
<rect x="20" y="10" width="600" height="210" rx="6" class="bx"/>
<text x="34" y="30" class="b">PAX file (e.g. Parquet)</text>
<rect x="34" y="40" width="270" height="130" rx="4" class="bxa"/><text x="44" y="58" class="b a">Row group 1</text>
<rect x="44" y="66" width="250" height="18" class="bx2"/><text x="169" y="79" text-anchor="middle" class="s">row group header (meta-data)</text>
<rect x="44" y="90" width="76" height="70" class="bxg"/><text x="82" y="122" text-anchor="middle" class="m">col A</text><text x="82" y="140" text-anchor="middle" class="s">chunk</text>
<rect x="131" y="90" width="76" height="70" class="bxg"/><text x="169" y="122" text-anchor="middle" class="m">col B</text><text x="169" y="140" text-anchor="middle" class="s">chunk</text>
<rect x="218" y="90" width="76" height="70" class="bxg"/><text x="256" y="122" text-anchor="middle" class="m">col C</text><text x="256" y="140" text-anchor="middle" class="s">chunk</text>
<rect x="336" y="40" width="270" height="130" rx="4" class="bxa"/><text x="346" y="58" class="b a">Row group 2</text>
<rect x="346" y="66" width="250" height="18" class="bx2"/><text x="471" y="79" text-anchor="middle" class="s">row group header (meta-data)</text>
<rect x="346" y="90" width="76" height="70" class="bxg"/><text x="384" y="122" text-anchor="middle" class="m">col A</text><text x="384" y="140" text-anchor="middle" class="s">chunk</text>
<rect x="433" y="90" width="76" height="70" class="bxg"/><text x="471" y="122" text-anchor="middle" class="m">col B</text><text x="471" y="140" text-anchor="middle" class="s">chunk</text>
<rect x="520" y="90" width="76" height="70" class="bxg"/><text x="558" y="122" text-anchor="middle" class="m">col C</text><text x="558" y="140" text-anchor="middle" class="s">chunk</text>
<rect x="34" y="180" width="572" height="30" rx="4" class="bxv"/><text x="320" y="200" text-anchor="middle" class="b">Footer: global meta-data — offsets to each row group (for immutable files)</text>
</svg>
<figcaption>Horizontally partition rows into row groups, then vertically partition each row group into column chunks.</figcaption>
</figure>`;

  var tidDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 150" width="640" role="img" aria-label="DSM tuple identification: fixed-length offsets vs embedded tuple ids">
<text x="20" y="18" class="b">Choice #1: fixed-length offsets</text>
<g>
<rect x="20" y="28" width="60" height="100" class="bxg"/><rect x="86" y="28" width="60" height="100" class="bxg"/><rect x="152" y="28" width="60" height="100" class="bxg"/>
<text x="50" y="48" text-anchor="middle" class="m">A₀</text><text x="50" y="72" text-anchor="middle" class="m">A₁</text><text x="50" y="96" text-anchor="middle" class="m">A₂</text>
<text x="116" y="48" text-anchor="middle" class="m">B₀</text><text x="116" y="72" text-anchor="middle" class="m">B₁</text><text x="116" y="96" text-anchor="middle" class="m">B₂</text>
<text x="182" y="48" text-anchor="middle" class="m">C₀</text><text x="182" y="72" text-anchor="middle" class="m">C₁</text><text x="182" y="96" text-anchor="middle" class="m">C₂</text>
<rect x="20" y="62" width="192" height="16" fill="none" class="lna"/>
</g>
<text x="20" y="146" class="s">value of tuple i = column start + i × width</text>
<text x="340" y="18" class="b">Choice #2: embedded tuple ids</text>
<rect x="340" y="28" width="80" height="100" class="bxg"/><rect x="430" y="28" width="80" height="100" class="bxg"/><rect x="520" y="28" width="80" height="100" class="bxg"/>
<text x="380" y="48" text-anchor="middle" class="m">0: A₀</text><text x="380" y="72" text-anchor="middle" class="m">1: A₁</text><text x="380" y="96" text-anchor="middle" class="m">2: A₂</text>
<text x="470" y="48" text-anchor="middle" class="m">0: B₀</text><text x="470" y="72" text-anchor="middle" class="m">1: B₁</text><text x="470" y="96" text-anchor="middle" class="m">2: B₂</text>
<text x="560" y="48" text-anchor="middle" class="m">0: C₀</text><text x="560" y="72" text-anchor="middle" class="m">1: C₁</text><text x="560" y="96" text-anchor="middle" class="m">2: C₂</text>
<text x="340" y="146" class="s">each value carries its tuple id (wastes space; rarely used)</text>
</svg>
</figure>`;

  var innodbDiag = `
<figure class="diagram">
<svg viewBox="0 0 640 200" width="640" role="img" aria-label="MySQL InnoDB compression: compressed pages on disk, both compressed and uncompressed copies in the buffer pool">
${marker('l4i')}
<text x="20" y="20" class="b">Buffer pool</text>
<rect x="20" y="28" width="250" height="70" rx="4" class="bxa"/>
<rect x="34" y="40" width="90" height="46" class="bx"/><text x="79" y="60" text-anchor="middle" class="s">mod log</text><text x="79" y="76" text-anchor="middle" class="m">compressed</text>
<rect x="140" y="40" width="118" height="46" class="bxg"/><text x="199" y="60" text-anchor="middle" class="m">uncompressed</text><text x="199" y="76" text-anchor="middle" class="s">16 KB page</text>
<text x="20" y="130" class="b">Disk</text>
<rect x="20" y="138" width="600" height="50" rx="4" class="bx2"/>
<rect x="34" y="148" width="90" height="30" class="bx"/><text x="79" y="168" text-anchor="middle" class="s">mod log | 1 KB</text>
<rect x="134" y="148" width="100" height="30" class="bx"/><text x="184" y="168" text-anchor="middle" class="s">mod log | 2 KB</text>
<rect x="244" y="148" width="120" height="30" class="bx"/><text x="304" y="168" text-anchor="middle" class="s">mod log | 4 KB</text>
<rect x="374" y="148" width="150" height="30" class="bx"/><text x="449" y="168" text-anchor="middle" class="s">mod log | 8 KB</text>
<path d="M79 146 V100" class="ln" marker-end="url(#l4i)"/>
<text x="300" y="50" class="s">Compressed pages are padded to a power-of-two size.</text>
<text x="300" y="68" class="s">Updates can be appended to the “mod log” without</text>
<text x="300" y="86" class="s">decompressing; reads need the decompressed copy.</text>
</svg>
</figure>`;

  DBP.addTopic({
    id: 'models',
    group: 'Lectures',
    num: 'L4a',
    title: 'Storage Models & Compression',
    summary: 'OLTP vs OLAP, row stores (NSM), column stores (DSM), PAX, and columnar compression schemes.',
    lead: 'The relational model does not say how a tuple’s attributes must be laid out. Choosing rows vs. columns — and compressing them — is a workload decision.',
    source: 'Lecture 4, first half; textbook 11.2, 13.6',
    sections: [
      {
        id: 'workloads', title: 'Database workloads',
        body: `
<table><thead><tr><th>Workload</th><th>What it looks like</th></tr></thead><tbody>
<tr><td><b>OLTP</b> — On-Line Transaction Processing</td><td>Fast, simple queries that read/update a <b>small amount of data</b> related to a <b>single entity</b>. Usually the first kind of application people build.</td></tr>
<tr><td><b>OLAP</b> — On-Line Analytical Processing</td><td><b>Complex</b> queries that read <b>large portions</b> of the database spanning many entities to compute aggregates. They run on data collected by OLTP applications.</td></tr>
<tr><td><b>HTAP</b> — Hybrid Transaction + Analytical Processing</td><td>OLTP + OLAP together on the same database instance.</td></tr>
</tbody></table>
${workloadDiag}
<h3>The Wikipedia example</h3>
<p>Schema: <code>useracct(userID, userName, userPass, hostname, lastLogin)</code>, <code>pages(pageID, title, latest)</code>, <code>revisions(revID, userID, pageID, content, updated)</code>.</p>
<div class="grid2">
<pre class="sql">-- OLTP: touch one entity
SELECT P.*, R.* FROM pages AS P
 INNER JOIN revisions AS R ON P.latest = R.revID
 WHERE P.pageID = ?;

UPDATE useracct SET lastLogin = NOW(),
       hostname = ?
 WHERE userID = ?;

INSERT INTO revisions VALUES (?,?...,?);</pre>
<pre class="sql">-- OLAP: scan many entities
SELECT COUNT(U.lastLogin),
       EXTRACT(month FROM U.lastLogin) AS month
  FROM useracct AS U
 WHERE U.hostname LIKE '%.gov'
 GROUP BY EXTRACT(month FROM U.lastLogin);</pre>
</div>
<div class="callout key"><span class="ct">Observation</span><p>The relational model does <b>not</b> specify that a tuple’s attributes must be stored together in a single page. That freedom is what storage models exploit.</p></div>`
      },
      {
        id: 'nsm-dsm', title: 'Storage models: NSM, DSM, PAX',
        body: `
<p>A DBMS’s <b>storage model</b> specifies how it physically organizes tuples on disk and in memory. Performance depends on the target workload, and the choice influences the design of the rest of the DBMS.</p>
<h3>N-ary Storage Model (NSM) — row store</h3>
<p>The DBMS stores (almost) <b>all attributes of a single tuple contiguously</b> in a single page — the slotted pages from Lecture 3. Ideal for <b>OLTP</b>: queries access individual entities and do many writes. NSM page sizes are typically a constant multiple of 4 KB hardware pages. A tuple’s record id (page#, slot#) identifies it.</p>
<div class="pro-con">
<div class="card pro"><h4>Advantages</h4><ul class="small"><li>Fast inserts, updates and deletes.</li><li>Good for queries that need the entire tuple (OLTP).</li><li>Can use index-oriented physical storage for clustering.</li></ul></div>
<div class="card con"><h4>Disadvantages</h4><ul class="small"><li>Poor for scanning large portions of a table and/or a subset of attributes.</li><li>Poor memory locality in access patterns.</li><li>Not ideal for compression: multiple value domains within a page.</li></ul></div>
</div>
<h3>Decomposition Storage Model (DSM) — column store</h3>
<p>The DBMS stores <b>a single attribute for all tuples contiguously</b> in a block of data. Ideal for <b>OLAP</b>: read-only queries that scan large portions of a <i>subset</i> of attributes. The DBMS splits a tuple’s attributes when writing and combines (“stitches”) them when reading. Attributes and meta-data (e.g. nulls) live in separate arrays of fixed-length values, with separate pages per attribute and a dedicated header for meta-data about the whole column.</p>
${nsmDiag}
<h4>Tuple identification</h4>
<p>How do we find the attributes that belong to the same tuple?</p>
<ul>
<li><b>Choice #1: fixed-length offsets</b> — each value has the same length for an attribute, so the <i>i</i>-th value of each column belongs to tuple <i>i</i>. (Most common.)</li>
<li><b>Choice #2: embedded tuple ids</b> — each value is stored together with its tuple id.</li>
</ul>
${tidDiag}
<p><b>Variable-length data</b>: padding variable-length fields to a fixed length is wasteful, especially for large attributes. A better approach is <b>dictionary compression</b>: convert repetitive variable-length values into fixed-length codes (typically 32-bit integers).</p>
<div class="pro-con">
<div class="card pro"><h4>Advantages</h4><ul class="small"><li>Less wasted I/O: reads only the data it needs.</li><li>Faster query processing: better locality and cached data reuse.</li><li>Better data compression (one value domain per block).</li></ul></div>
<div class="card con"><h4>Disadvantages</h4><ul class="small"><li>Slow point queries, inserts, updates and deletes — because of tuple splitting / stitching / reorganization.</li></ul></div>
</div>
<h3>PAX — Partition Attributes Across (hybrid)</h3>
<p>OLAP queries almost never access a single column by itself: during execution the DBMS must fetch other columns and stitch the tuple back together. We want columnar storage that still keeps each tuple’s data <b>physically close</b>. <b>PAX</b> vertically partitions attributes <i>within a database page</i>: horizontally partition the data into <b>row groups</b>, then vertically partition attributes into <b>column chunks</b>. A global meta-data directory (in the <b>footer</b> for immutable files like Parquet and ORC) has offsets to the row groups, and each row group has its own meta-data header. Examples: <b>Parquet, ORC, Arrow</b>.</p>
${paxDiag}
<div data-sim="storageModels"></div>
<div class="callout exam"><span class="ct">One-line summary</span><p><b>OLTP → row store (NSM). OLAP → column store (DSM).</b> PAX gets columnar processing speed while keeping the spatial locality of row storage.</p></div>`
      },
      {
        id: 'compression-why', title: 'Why and how to compress',
        body: `
<p><b>I/O is the main bottleneck</b> when the DBMS fetches data from disk during query execution. Compressing pages increases the amount of <b>useful data per I/O</b>. The key trade-off is <b>speed vs. compression ratio</b>; compression also reduces DRAM requirements and may <i>decrease</i> CPU costs during execution.</p>
<h3>Goals of database compression</h3>
<ol>
<li><b>Produce fixed-length values</b> (exception: variable-length data stored in a separate pool) — so offsets still work.</li>
<li><b>Postpone decompression as long as possible</b> during query execution — known as <b>late materialization</b>.</li>
<li>Use a <b>lossless</b> scheme — people don’t like losing data. Any lossy compression must be done by the application.</li>
</ol>
<h3>Compression granularity</h3>
<table><thead><tr><th>Granularity</th><th>What is compressed</th><th>Works with</th></tr></thead><tbody>
<tr><td>Block-level</td><td>A block of tuples of the same table</td><td>NSM / DSM</td></tr>
<tr><td>Tuple-level</td><td>The contents of an entire tuple</td><td>NSM only</td></tr>
<tr><td>Attribute-level</td><td>A single attribute within one tuple (overflow); can target several attributes of the same tuple</td><td>NSM / DSM</td></tr>
<tr><td>Column-level</td><td>Multiple values of one or more attributes across many tuples</td><td>DSM only</td></tr>
</tbody></table>
<h3>Naïve compression</h3>
<p>Use a <b>general-purpose</b> algorithm; compression depends only on the input bytes: LZO (1996), LZ4 (2011), Snappy (2011), Oracle OZIP (2014), Zstd (2015). Considerations: computational overhead, and compression vs. decompression speed.</p>
<h4>Example: MySQL InnoDB</h4>
${innodbDiag}
<div class="callout warn"><span class="ct">Limits of naïve compression</span><ul><li>The DBMS must <b>decompress data before it can be read</b> (and possibly modified) — limiting the scope of the scheme.</li><li>These schemes ignore the high-level <b>meaning or semantics</b> of the data.</li></ul><p>Ideally the DBMS can operate on compressed data <i>without decompressing it first</i> — which is what the columnar schemes below allow.</p></div>`
      },
      {
        id: 'columnar', title: 'Columnar compression schemes',
        body: `
<h3>Run-length encoding (RLE)</h3>
<p>Compress runs of the same value in a single column into <b>triplets</b>: <b>(value, start position, number of elements in the run)</b>. Sort columns intelligently first to maximize compression opportunities.</p>
<div class="grid2">
<div class="card small"><b>Original</b> <span class="mono">sex</span>: <span class="mono">M M M F M F F M</span><br><b>RLE</b>: <span class="mono">(M,0,3) (F,3,1) (M,4,1) (F,5,2) (M,7,1)</span> — 5 triplets, barely helps.</div>
<div class="card small"><b>Sorted</b>: <span class="mono">F F F M M M M M</span><br><b>RLE</b>: <span class="mono">(F,0,3) (M,3,5)</span> — 2 triplets.</div>
</div>
<h3>Bit packing</h3>
<p>If integer values are smaller than the range of their declared type, use <b>fewer bits</b> per value. Bit-shifting lets the CPU operate on several packed values in a single word. E.g. an <code>INT32</code> column whose values are all &lt; 256 needs only 8 bits each: 4× smaller.</p>
<p><b>Patching / “mostly” encoding</b>: a variant for values that are <i>mostly</i> small enough. Store the few values that don’t fit separately, in raw form (e.g. a column of small ints with one 99,999,999 → pack everything in 8 bits, and keep a side table <code>{offset 3: 99999999}</code>).</p>
<h3>Bitmap encoding</h3>
<p>Store a separate <b>bitmap for each unique value</b>; position <i>i</i> in a bitmap says whether tuple <i>i</i> has that value. Segment the bitmaps into chunks to avoid allocating large blocks of contiguous memory. <b>Only practical when cardinality is low</b>. Some DBMSs provide bitmap indexes.</p>
<div class="callout exam"><span class="ct">The zip-code calculation (from the slides)</span><p>10 million tuples, 43,000 US zip codes.</p><ul><li>Stored as 32-bit integers: 10,000,000 × 32 bits = <b>40 MB</b>.</li><li>As bitmaps: 10,000,000 × 43,000 bits = <b>53.75 GB</b>.</li></ul><p>And every inserted tuple must extend 43,000 bitmaps. Compressed structures for sparse data (e.g. <b>Roaring Bitmaps</b>) help.</p></div>
<h3>Delta encoding</h3>
<p>Record the <b>difference</b> between consecutive values in the same column. The base value is stored inline or in a separate lookup table. Combine with RLE for even better ratios.</p>
<div class="card small"><span class="mono">time: 12:00 12:01 12:02 12:03 12:04</span> → <span class="mono">12:00 +1 +1 +1 +1</span> → with RLE: <span class="mono">12:00 (+1, 4)</span><br><span class="mono">temp: 99.5 99.4 99.5 100.0 101.2</span> → <span class="mono">99.5 −0.1 +0.1 +0.5 +1.2</span></div>
<p><b>Frame-of-reference</b> variant: store offsets from the <b>global minimum</b> instead of from the previous value, so each value decodes independently.</p>
<h3>Dictionary compression</h3>
<p>Replace frequent values with smaller <b>fixed-length codes</b> and keep a dictionary mapping codes back to values. Typically one code per attribute value. <b>The most widely used native compression scheme in DBMSs.</b> It needs fast:</p>
<ul><li><b>Encode / Locate</b>: uncompressed value → its code;</li><li><b>Decode / Extract</b>: code → original value.</li></ul>
<h4>Order-preserving dictionaries</h4>
<p>The encoded values must support the same <b>collation (sort order)</b> as the originals: assign codes in sorted value order. Then range predicates and prefix LIKEs can be evaluated <b>directly on the codes</b>.</p>
<div class="grid2">
<div><table class="rel"><thead><tr><th>code</th><th>value</th></tr></thead><tbody><tr><td>10</td><td>Andrea</td></tr><tr><td>20</td><td>Andy</td></tr><tr><td>30</td><td>Jignesh</td></tr><tr><td>40</td><td>Mr.Pickles</td></tr></tbody></table></div>
<pre class="sql">SELECT * FROM users
 WHERE name LIKE 'And%';
-- becomes
SELECT * FROM users
 WHERE name BETWEEN 10 AND 20;

-- Still must scan the column:
SELECT name FROM users WHERE name LIKE 'And%';
-- Only needs the dictionary:
SELECT DISTINCT name FROM users WHERE name LIKE 'And%';</pre>
</div>
<div data-sim="compression"></div>
<div class="callout key"><span class="ct">Conclusion</span><p>Choose the storage model for the target workload — OLTP: row store; OLAP: column store. DBMSs can combine compression approaches. <b>Dictionary encoding is probably the most useful scheme because it does not require pre-sorting.</b></p></div>`
      }
    ],
    exercises: [
      {
        level: 'Warm-up', title: 'OLTP or OLAP?',
        q: '<p>Classify each query: (a) <code>UPDATE account SET balance = balance - 50 WHERE id = 7</code>; (b) total revenue per country per quarter over the last 5 years; (c) show one user’s shopping cart; (d) the average session length of all users who logged in from a <code>.gov</code> host.</p>',
        a: '<p>(a) <b>OLTP</b> — one entity, a write. (b) <b>OLAP</b> — complex aggregation over a large part of the data. (c) <b>OLTP</b> — small read about one entity. (d) <b>OLAP</b> — scans many tuples, two attributes, aggregates.</p>'
      },
      {
        level: 'Exam-style', title: 'Count the pages',
        q: '<p>A table has 1,000,000 tuples, each with 10 attributes of 8 bytes (80 bytes per tuple; ignore headers). Pages are 4 KB (4096 bytes). How many pages must be read for <code>SELECT SUM(a3), AVG(a7) FROM t</code> in (a) an NSM row store and (b) a DSM column store?</p>',
        hint: 'In NSM a page holds whole tuples; in DSM a page holds values of one attribute.',
        a: '<p>(a) NSM: ⌊4096 / 80⌋ = 51 tuples per page → ⌈1,000,000 / 51⌉ = <b>19,608 pages</b>, all of which must be read (even though only 2 of 10 attributes are used — 80% of the I/O is wasted).</p><p>(b) DSM: one attribute = 1,000,000 × 8 B = 8,000,000 B → ⌈8,000,000 / 4096⌉ = 1,954 pages per column; two columns = <b>3,908 pages</b>, about 5× less I/O.</p>'
      },
      {
        level: 'Core', title: 'RLE',
        q: '<p>RLE-encode the column <code>A A A B B A C C C C</code> as (value, start, length) triplets. Then sort the column and encode it again. How many triplets in each case?</p>',
        a: '<p>Unsorted: <code>(A,0,3) (B,3,2) (A,5,1) (C,6,4)</code> — 4 triplets.</p><p>Sorted <code>A A A A B B C C C C</code>: <code>(A,0,4) (B,4,2) (C,6,4)</code> — 3 triplets. Sorting puts equal values together so runs are longer (with many distinct runs the gain is much larger).</p>'
      },
      {
        level: 'Exam-style', title: 'Bitmap size',
        q: '<p>A table has 10 million tuples. Compare storing a column as 32-bit integers vs. bitmap encoding when the column is (a) <code>sex</code> with 2 distinct values and (b) <code>zipcode</code> with 43,000 distinct values.</p>',
        a: '<p>32-bit integers: 10,000,000 × 32 bits = 320,000,000 bits = <b>40 MB</b> in both cases.</p><p>(a) Bitmaps: 2 × 10,000,000 bits = 20,000,000 bits = <b>2.5 MB</b> — 16× smaller. ✔</p><p>(b) Bitmaps: 43,000 × 10,000,000 bits = 4.3 × 10¹¹ bits = <b>53.75 GB</b> — over 1000× bigger. ✘ Bitmap encoding only works for low-cardinality columns.</p>'
      },
      {
        level: 'Core', title: 'Delta and frame-of-reference',
        q: '<p>Encode <code>1000, 1002, 1003, 1003, 1007</code> with (a) delta encoding and (b) frame-of-reference. How many bits does each encoded value (after the base) need?</p>',
        a: '<p>(a) Delta: base 1000, then <code>+2, +1, 0, +4</code>. Max |delta| = 4 → 3 bits (plus a sign bit if deltas can be negative).</p><p>(b) FOR: base = min = 1000, offsets <code>0, 2, 3, 3, 7</code>. Max offset 7 → 3 bits. Compared with 32 bits per value, both are about 10× smaller. FOR lets you decode any single value directly (1000 + offset); delta needs a running sum.</p>'
      },
      {
        level: 'Exam-style', title: 'Order-preserving dictionary',
        q: '<p>Build an order-preserving dictionary for <code>Mr.Pickles, Andrea, Jignesh, Andy, Andrea</code> using codes 0, 1, 2, … and rewrite <code>WHERE name LIKE \'And%\'</code> over codes. Which of these can be answered from the dictionary alone: <code>SELECT name … LIKE \'And%\'</code> or <code>SELECT DISTINCT name … LIKE \'And%\'</code>?</p>',
        a: '<p>Sorted distinct values: Andrea → 0, Andy → 1, Jignesh → 2, Mr.Pickles → 3. Encoded column: <code>3, 0, 2, 1, 0</code>.</p><p><code>LIKE \'And%\'</code> → <code>code BETWEEN 0 AND 1</code> (works only because the dictionary preserves order).</p><p><code>SELECT DISTINCT name</code> can be answered from the <b>dictionary alone</b> (it already lists each distinct value). <code>SELECT name</code> (without DISTINCT) must still <b>scan the column</b> to output one row per matching tuple, including duplicates.</p>'
      },
      {
        level: 'Concept', title: 'Compression goals',
        q: '<p>Explain the three goals of database compression from the lecture, and why “late materialization” matters.</p>',
        a: '<ol><li><b>Fixed-length values</b> keep offset-based access working (variable-length data goes into a separate pool).</li><li><b>Postpone decompression</b> (late materialization): operate on compressed data (e.g. compare dictionary codes) as long as possible; decompress only the few values that end up in the result. This saves CPU and memory bandwidth.</li><li><b>Lossless</b>: the DBMS must return exactly what was stored; lossy schemes are the application’s business.</li></ol>'
      },
      {
        level: 'Concept', title: 'PAX',
        q: '<p>Why does Parquet store its meta-data in a <b>footer</b> instead of a header? And what problem of pure DSM does PAX address?</p>',
        a: '<p>Parquet files are written once and immutable. The writer doesn’t know the offsets/statistics of row groups until they are written, so it appends the global meta-data (offsets to row groups) at the end.</p><p>Pure DSM spreads a tuple’s attributes across different pages/files, so stitching tuples back together is expensive. PAX keeps all attributes of a row group in the same page/file region (spatial locality of a row store) while still storing each attribute contiguously within the row group (columnar scans and compression).</p>'
      }
    ],
    quiz: [
      { q: 'Which workload is best served by a row store (NSM)?', o: ['OLAP scans of a few columns', 'OLTP: many small reads/writes of whole tuples', 'Bulk analytics on Parquet files', 'Bitmap-indexed reporting'], a: 1, e: 'NSM keeps a whole tuple in one page: ideal for OLTP.' },
      { q: 'Which is a DISADVANTAGE of DSM (column store)?', o: ['Reads unnecessary attributes', 'Poor compression', 'Slow point queries, inserts, updates, deletes', 'Cannot run aggregates'], a: 2, e: 'Tuples must be split on write and stitched back on read.' },
      { q: 'PAX organizes data as…', o: ['one file per column', 'row groups, each split into column chunks', 'a log of PUT/DELETE records', 'a B+Tree with tuples in the leaves'], a: 1, e: 'Horizontal partition into row groups, then vertical partition into column chunks (Parquet/ORC).' },
      { q: 'In DSM with fixed-length offsets, how is tuple i found in each column?', o: ['By searching an embedded tuple id', 'The i-th value of each column belongs to tuple i', 'By a hash index', 'By the slot array'], a: 1, e: 'Equal-width values allow direct offset computation.' },
      { q: '“Late materialization” means…', o: ['writing pages to disk as late as possible', 'postponing decompression as long as possible during query execution', 'creating indexes after loading data', 'delaying transaction commits'], a: 1, e: 'It is goal #2 of database compression.' },
      { q: 'Which compression granularity is only possible with DSM?', o: ['Block-level', 'Tuple-level', 'Attribute-level', 'Column-level'], a: 3, e: 'Column-level compression works across many values of one attribute. Tuple-level is NSM-only.' },
      { q: 'A main drawback of naïve (general-purpose) compression like LZ4/Zstd is…', o: ['it is lossy', 'data must be decompressed before it can be read; it ignores data semantics', 'it only works on integers', 'it requires sorted data'], a: 1, e: 'The DBMS cannot operate on the compressed bytes directly.' },
      { q: 'RLE stores runs as triplets of…', o: ['(value, start position, run length)', '(key, value, timestamp)', '(page, slot, offset)', '(min, max, count)'], a: 0, e: 'Value, where the run starts, and how many elements it has.' },
      { q: 'Bitmap encoding is practical only when…', o: ['the column is sorted', 'the column has low cardinality', 'values are floating point', 'the table is small'], a: 1, e: 'One bitmap per distinct value: high cardinality explodes the size (zip-code example: 53.75 GB).' },
      { q: 'Why must a dictionary be order-preserving to evaluate <code>LIKE \'And%\'</code> on codes?', o: ['So codes are unique', 'So the prefix range maps to a contiguous range of codes', 'So decoding is faster', 'It doesn’t need to be'], a: 1, e: 'Codes sorted like the values mean the matching values form a code range (BETWEEN).' },
      { q: 'According to the lecture, which scheme is probably the most useful because it does not require pre-sorting?', o: ['RLE', 'Delta', 'Dictionary', 'Bitmap'], a: 2, e: 'Dictionary encoding is the most widely used native scheme.' },
      { q: '“Mostly” encoding (patching) is a variant of…', o: ['dictionary encoding', 'bit packing', 'RLE', 'delta encoding'], a: 1, e: 'Pack mostly-small values in fewer bits and store the rare large ones separately.' }
    ]
  });
})();
