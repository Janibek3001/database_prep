(function () {
  'use strict';
  function marker(id, cls) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="' + (cls || 'arrowhead') + '"/></marker></defs>';
  }

  DBP.addTopic({
    id: 'relational',
    group: 'Lectures',
    num: 'L1',
    title: 'Relational Model & Relational Algebra',
    navTitle: 'Relational Model & Algebra',
    summary: 'Why DBMSs exist, data models, relations, keys, and the seven core algebra operators.',
    lead: 'Why we need a DBMS at all, how the relational model describes data, and the algebra that every query is ultimately translated into.',
    source: 'Lecture 1 slides; textbook chapters 1–2',
    sections: [
      {
        id: 'why-dbms', title: 'Why not just use files?',
        body: `
<div class="callout def"><span class="ct">Definition</span><p>A <b>database</b> is an organized collection of inter-related data that models some aspect of the real world. A <b>database management system (DBMS)</b> is the software that lets applications store and analyze information in a database — it supports <i>definition, creation, querying, update and administration</i> of databases according to some data model.</p></div>
<p>The lecture motivates the DBMS with a “strawman”: store a music store’s data as CSV files, one file per entity, and let the application parse them.</p>
<div class="grid2">
<pre>Artist(name, year, country)
"Wu-Tang Clan",1992,"USA"
"Notorious BIG",1992,"USA"
"GZA",1990,"USA"</pre>
<pre>Album(name, artist, year)
"Enter the Wu-Tang","Wu-Tang Clan",1993
"St. Ides Mix Tape","Wu-Tang Clan",1994
"Liquid Swords","GZA",1990</pre>
</div>
<p>To answer “what year did GZA go solo?” the program has to read every line, parse it and compare the first field. It works for a toy — but every real requirement breaks it. The slides group the problems into three families; this grouping is a favourite short-answer question:</p>
<div class="grid3">
<div class="card"><h4>Data integrity</h4><ul class="small"><li>How do we ensure the artist name is the same in every album entry?</li><li>What stops someone writing an invalid string into the year?</li><li>What if an album has several artists?</li><li>What happens to albums when we delete their artist?</li></ul></div>
<div class="card"><h4>Implementation</h4><ul class="small"><li>How do we find one record without scanning the file?</li><li>What if a second application needs the same data?</li><li>…running on a different machine?</li><li>What if two threads write the file at the same time?</li></ul></div>
<div class="card"><h4>Durability</h4><ul class="small"><li>What if the machine crashes in the middle of updating a record?</li><li>What if we replicate the data on several machines for high availability?</li></ul></div>
</div>
<p>A general-purpose DBMS solves these once, for every application: constraints for integrity, indexes and a query optimizer for finding data, concurrency control for simultaneous writers, and logging/recovery for crashes.</p>`
      },
      {
        id: 'data-models', title: 'Data models and schemas',
        body: `
<div class="grid2">
<div class="callout def" style="margin:0"><span class="ct">Data model</span><p>A collection of concepts for describing the data in a database: rules for what kinds of things can exist and how they relate.</p></div>
<div class="callout def" style="margin:0"><span class="ct">Schema</span><p>A description of one particular collection of data, using a given data model. Without a schema the stored bytes are just random bits with no meaning.</p></div>
</div>
<p>The slides list the common data models and who uses them:</p>
<table>
<thead><tr><th>Data model</th><th>Used for</th></tr></thead>
<tbody>
<tr><td><b>Relational</b></td><td>Most DBMSs — and this course</td></tr>
<tr><td>Key/value</td><td>Simple applications and caching</td></tr>
<tr><td>Graph · Document / JSON / XML / Object · Wide-column / Column-family</td><td>“NoSQL” systems. The document model is the leading alternative to relational.</td></tr>
<tr><td>Array (vector, matrix, tensor)</td><td>Machine learning and science — vectors are the “new hotness”</td></tr>
<tr><td>Hierarchical · Network · Semantic · Entity-Relationship</td><td>Obsolete, legacy or rare (E-R survives as a design notation)</td></tr>
</tbody></table>
<h3>A short history</h3>
<p>Early DBMSs of the 1960s (IDS, IMS, CODASYL) were hard to build applications on. “Computers were expensive, humans were cheap,” so the logical and physical layers were <b>tightly coupled</b>: programmers had to know roughly which queries would run before they could deploy the database, and a schema or layout change meant rewriting programs.</p>
<p><b>Edgar F. Codd</b>, a mathematician at IBM Research, watched developers rewrite database programs every time the layout changed and devised the <b>relational model</b> in 1969 to remove that maintenance overhead.</p>`
      },
      {
        id: 'relational-model', title: 'The relational model',
        body: `
<p>Codd’s three key tenets:</p>
<ol>
<li>Store the database in <b>simple data structures</b> — relations.</li>
<li>Leave the <b>physical storage</b> to the DBMS implementation.</li>
<li>Access data through a <b>high-level language</b>; the DBMS figures out the best execution strategy.</li>
</ol>
<p>A relational model has three parts: <b>Structure</b> (the definition of relations and their contents, independent of physical representation), <b>Integrity</b> (constraints the contents must satisfy) and <b>Manipulation</b> (the programming interface for reading and modifying contents).</p>

<h3>Data independence</h3>
<p>The user or application is isolated from the low-level data representation. The user worries only about application logic; the DBMS chooses and re-optimizes the layout for the environment, contents and workload.</p>
<figure class="diagram">
<svg viewBox="0 0 640 250" width="640" role="img" aria-label="Three schema levels: external views, logical schema, physical schema, with logical and physical data independence between them">
${marker('l1a')}
<rect x="40" y="16" width="120" height="40" rx="6" class="bx2"/><text x="100" y="41" text-anchor="middle">App A</text>
<rect x="180" y="16" width="120" height="40" rx="6" class="bx2"/><text x="240" y="41" text-anchor="middle">App B</text>
<rect x="320" y="16" width="120" height="40" rx="6" class="bx2"/><text x="380" y="41" text-anchor="middle">App C</text>
<rect x="40" y="82" width="400" height="40" rx="6" class="bxv"/><text x="240" y="107" text-anchor="middle" class="b">External schemas (views)</text>
<rect x="40" y="142" width="400" height="40" rx="6" class="bxa"/><text x="240" y="167" text-anchor="middle" class="b">Logical schema — tables, attributes, keys</text>
<rect x="40" y="202" width="400" height="40" rx="6" class="bxg"/><text x="240" y="227" text-anchor="middle" class="b">Physical schema — files, pages, indexes</text>
<path d="M100 56 V80 M240 56 V80 M380 56 V80" class="ln" marker-end="url(#l1a)"/>
<path d="M458 92 q12 0 12 12 v18 q0 8 8 8 q-8 0 -8 8 v18 q0 12 -12 12" class="ln"/>
<text x="486" y="128" class="b">Logical data</text><text x="486" y="145" class="b">independence</text>
<path d="M458 152 q12 0 12 12 v18 q0 8 8 8 q-8 0 -8 8 v18 q0 12 -12 12" class="lna"/>
<text x="486" y="188" class="b a">Physical data</text><text x="486" y="205" class="b a">independence</text>
</svg>
<figcaption>Changing a lower layer does not force changes to the layers above it.</figcaption>
</figure>
<div class="grid2">
<div class="card"><h4>Physical data independence</h4><p class="small">You can change how data is stored — add an index, move a table to SSD, switch from row to column layout — without changing the logical schema or rewriting queries.</p></div>
<div class="card"><h4>Logical data independence</h4><p class="small">You can change the logical schema (e.g. split a table, add a column) while applications keep working through views that present the old shape.</p></div>
</div>

<h3>Relations, tuples and attributes</h3>
<figure class="diagram">
<svg viewBox="0 0 640 230" width="640" role="img" aria-label="Anatomy of a relation">
${marker('l1b')}
<text x="150" y="24" class="b m">Artist(name, year, country)</text>
<rect x="60" y="36" width="330" height="30" class="bx2"/>
<text x="120" y="56" text-anchor="middle" class="b m">name</text><text x="245" y="56" text-anchor="middle" class="b m">year</text><text x="335" y="56" text-anchor="middle" class="b m">country</text>
<rect x="60" y="66" width="330" height="30" class="bx"/><text x="120" y="86" text-anchor="middle" class="m">Wu-Tang Clan</text><text x="245" y="86" text-anchor="middle" class="m">1992</text><text x="335" y="86" text-anchor="middle" class="m">USA</text>
<rect x="60" y="96" width="330" height="30" class="bxa"/><text x="120" y="116" text-anchor="middle" class="m">Notorious BIG</text><text x="245" y="116" text-anchor="middle" class="m">1992</text><text x="335" y="116" text-anchor="middle" class="m">USA</text>
<rect x="60" y="126" width="330" height="30" class="bx"/><text x="120" y="146" text-anchor="middle" class="m">GZA</text><text x="245" y="146" text-anchor="middle" class="m">1990</text><text x="335" y="146" text-anchor="middle" class="m">USA</text>
<line x1="180" y1="36" x2="180" y2="156" class="ln"/><line x1="290" y1="36" x2="290" y2="156" class="ln"/>
<path d="M410 111 H460" class="lna" marker-start="url(#l1b)"/><text x="468" y="106" class="b a">tuple (row)</text><text x="468" y="122" class="s">a set of attribute values</text>
<path d="M245 175 V160" class="ln" marker-end="url(#l1b)"/><text x="245" y="192" text-anchor="middle" class="b">attribute (column)</text><text x="245" y="208" text-anchor="middle" class="s">values come from a domain</text>
<text x="468" y="46" class="s">arity = 3 (attributes)</text><text x="468" y="64" class="s">cardinality = 3 (tuples)</text>
</svg>
<figcaption>A relation with n attributes is an <i>n-ary</i> relation, drawn as a table with n columns.</figcaption>
</figure>
<ul>
<li><b>Relation</b> — an <i>unordered set</i> of tuples that represent entities and the relationships among their attributes. Row order has no meaning.</li>
<li><b>Tuple</b> — a set of attribute values. Values are normally <b>atomic/scalar</b>. The special value <b>NULL</b> belongs to every domain (if allowed).</li>
<li><b>Arity</b> — the number of attributes. A relation with <i>n</i> attributes is <i>n</i>-ary.</li>
</ul>

<h3>Keys and constraints</h3>
<p>A <b>primary key</b> uniquely identifies a single tuple. Some DBMSs create an internal primary key if you do not define one. Unique keys can be generated automatically with identity columns: <code>IDENTITY</code> (SQL standard), <code>SEQUENCE</code> (PostgreSQL/Oracle), <code>AUTO_INCREMENT</code> (MySQL).</p>
<p>A <b>foreign key</b> specifies that an attribute of one relation maps to a tuple in another relation. A many-to-many relationship between artists and albums needs a third, “cross-reference” relation:</p>
<figure class="diagram">
<svg viewBox="0 0 640 170" width="640" role="img" aria-label="Foreign keys from ArtistAlbum to Artist and Album">
${marker('l1c', 'arrowhead-a')}
<rect x="20" y="20" width="170" height="28" class="bxa"/><text x="105" y="39" text-anchor="middle" class="b">Artist</text>
<rect x="20" y="48" width="170" height="104" class="bx"/>
<text x="34" y="70" class="m"><tspan class="b">id</tspan>  (PK)</text><text x="34" y="94" class="m">name</text><text x="34" y="118" class="m">year</text><text x="34" y="142" class="m">country</text>
<rect x="235" y="44" width="170" height="28" class="bxv"/><text x="320" y="63" text-anchor="middle" class="b">ArtistAlbum</text>
<rect x="235" y="72" width="170" height="56" class="bx"/>
<text x="249" y="94" class="m">artist_id (FK)</text><text x="249" y="118" class="m">album_id  (FK)</text>
<rect x="450" y="20" width="170" height="28" class="bxa"/><text x="535" y="39" text-anchor="middle" class="b">Album</text>
<rect x="450" y="48" width="170" height="80" class="bx"/>
<text x="464" y="70" class="m"><tspan class="b">id</tspan>  (PK)</text><text x="464" y="94" class="m">name</text><text x="464" y="118" class="m">year</text>
<path d="M235 90 C210 90 210 66 192 66" class="lna" marker-end="url(#l1c)"/>
<path d="M405 114 C430 114 430 66 448 66" class="lna" marker-end="url(#l1c)"/>
<text x="320" y="160" text-anchor="middle" class="s">(artist_id, album_id) together form ArtistAlbum’s primary key</text>
</svg>
<figcaption>Each ArtistAlbum tuple must reference an existing Artist and an existing Album (referential integrity).</figcaption>
</figure>
<p><b>Constraints</b> are user-defined conditions that must hold for <i>any</i> database instance. They can validate one tuple or span several relations, and the DBMS <b>rejects modifications that would violate them</b>. Unique-key and referential (foreign-key) constraints are the most common. SQL-92 also defines global <i>assertions</i>, but they are rarely used because they are too slow to check.</p>
<pre class="sql">
CREATE TABLE Artist (
  id      INT PRIMARY KEY,
  name    VARCHAR(32) NOT NULL,
  year    INT,
  country CHAR(60),
  CHECK (year > 1900)
);
CREATE TABLE ArtistAlbum (
  artist_id INT REFERENCES Artist(id),
  album_id  INT REFERENCES Album(id),
  PRIMARY KEY (artist_id, album_id)
);</pre>`
      },
      {
        id: 'dml', title: 'Procedural vs. declarative languages',
        body: `
<p>A <b>Data Manipulation Language (DML)</b> is the API a DBMS exposes to applications to store and retrieve information. There are two styles:</p>
<div class="grid2">
<div class="card"><h4>Procedural → Relational Algebra</h4><p class="small">The query specifies the high-level <i>strategy</i> (the order of steps) for finding the result, based on sets or bags.</p></div>
<div class="card"><h4>Non-procedural (declarative) → Relational Calculus</h4><p class="small">The query specifies only <i>what</i> data is wanted, not <i>how</i> to find it. SQL is declarative.</p></div>
</div>
<p>The relational model is independent of any query language. SQL is the de-facto standard (with many dialects). Compare the flat-file program with the SQL query:</p>
<div class="grid2">
<pre>for line in file.readlines():
    record = parse(line)
    if record[0] == "GZA":
        print(int(record[1]))</pre>
<pre class="sql">SELECT year FROM Artist
 WHERE name = 'GZA';</pre>
</div>`
      },
      {
        id: 'algebra', title: 'Relational algebra operators',
        body: `
<p>Relational algebra is a set of fundamental operations that retrieve and manipulate tuples. It is based on <b>set algebra</b> (unordered collections, no duplicates). Each operator takes one or more relations as input and outputs a <b>new relation</b>, so operators can be chained (composed) into bigger expressions.</p>
<table>
<thead><tr><th>Symbol</th><th>Operator</th><th>Meaning</th><th>SQL</th></tr></thead>
<tbody>
<tr><td class="ra" style="font-size:1.2em">σ<sub>p</sub>(R)</td><td>Select</td><td>Tuples of R that satisfy predicate <i>p</i></td><td><code>SELECT * FROM R WHERE p</code></td></tr>
<tr><td class="ra" style="font-size:1.2em">π<sub>A1,…,An</sub>(R)</td><td>Projection</td><td>Only the listed attributes (reorder, drop, or compute derived ones)</td><td><code>SELECT DISTINCT A1,…,An FROM R</code></td></tr>
<tr><td class="ra" style="font-size:1.2em">R ∪ S</td><td>Union</td><td>Tuples in either or both; duplicates removed</td><td><code>… UNION …</code></td></tr>
<tr><td class="ra" style="font-size:1.2em">R ∩ S</td><td>Intersection</td><td>Tuples in both</td><td><code>… INTERSECT …</code></td></tr>
<tr><td class="ra" style="font-size:1.2em">R − S</td><td>Difference</td><td>Tuples in R but not in S</td><td><code>… EXCEPT …</code></td></tr>
<tr><td class="ra" style="font-size:1.2em">R × S</td><td>Product</td><td>All combinations of tuples</td><td><code>R CROSS JOIN S</code></td></tr>
<tr><td class="ra" style="font-size:1.2em">R ⋈ S</td><td>Join</td><td>Combine tuples that share common values</td><td><code>R NATURAL JOIN S</code></td></tr>
</tbody></table>
<div class="callout warn"><span class="ct">Watch out</span><p><b>σ (select) ≠ SQL SELECT.</b> Relational-algebra <i>selection</i> filters rows — it corresponds to SQL’s <code>WHERE</code>. SQL’s <code>SELECT</code> list corresponds to <b>projection π</b>.</p></div>
<div class="callout key"><span class="ct">Union-compatible inputs</span><p>∪, ∩ and − require both inputs to have the <b>same attributes</b>. × does not: its output simply contains all attributes from both inputs.</p></div>
<div data-sim="raPlayground"></div>

<h3>Useful identities</h3>
<ul>
<li><span class="ra">R ∩ S = R − (R − S)</span> — intersection is expressible with difference, so it is not strictly “fundamental”.</li>
<li><span class="ra">R ⋈<sub>θ</sub> S = σ<sub>θ</sub>(R × S)</span> — a join is a product followed by a selection.</li>
<li><span class="ra">|R × S| = |R| · |S|</span> and the arity of R × S is arity(R) + arity(S).</li>
<li><span class="ra">σ<sub>p∧q</sub>(R) = σ<sub>p</sub>(σ<sub>q</sub>(R))</span> — conjunctions can be split into a cascade of selections.</li>
</ul>

<h3>Extended operators</h3>
<table>
<thead><tr><th>Operation</th><th>Relational algebra</th><th>SQL</th></tr></thead>
<tbody>
<tr><td>Rename</td><td class="ra">ρ<sub>S(B1,…,Bn)</sub>(R)</td><td><code>SELECT * FROM R AS S(B1,…,Bn)</code></td></tr>
<tr><td>Assignment</td><td class="ra">T ← R</td><td><code>WITH T AS (SELECT * FROM R) SELECT * FROM T</code></td></tr>
<tr><td>Duplicate elimination</td><td class="ra">δ(R)</td><td><code>SELECT DISTINCT * FROM R</code></td></tr>
<tr><td>Aggregation</td><td class="ra">γ<sub>G; f(A)→B</sub>(R)</td><td><code>SELECT G, f(A) AS B FROM R GROUP BY G</code></td></tr>
<tr><td>Sorting</td><td class="ra">τ<sub>A↑, B↓</sub>(R)</td><td><code>SELECT * FROM R ORDER BY A ASC, B DESC</code></td></tr>
</tbody></table>`
      },
      {
        id: 'order', title: 'Why the order of operators matters',
        body: `
<p>Relational algebra defines an <i>ordering</i> of high-level steps. Two expressions can produce the same answer with very different amounts of work:</p>
<figure class="diagram">
<svg viewBox="0 0 640 220" width="640" role="img" aria-label="Two query plans: selection above the join vs selection pushed below the join">
<text x="150" y="20" text-anchor="middle" class="b">σ<tspan baseline-shift="sub" font-size="10">b_id=102</tspan>(R ⋈ S)</text>
<circle cx="150" cy="62" r="24" class="bxw"/><text x="150" y="67" text-anchor="middle" class="b">σ</text>
<circle cx="150" cy="132" r="24" class="bx2"/><text x="150" y="137" text-anchor="middle" class="b">⋈</text>
<rect x="70" y="178" width="50" height="30" rx="5" class="bx"/><text x="95" y="198" text-anchor="middle" class="m">R</text>
<rect x="180" y="178" width="50" height="30" rx="5" class="bx"/><text x="205" y="198" text-anchor="middle" class="m">S</text>
<path d="M150 86 V108 M135 151 L102 178 M165 151 L198 178" class="ln"/>
<text x="250" y="137" class="s">joins every tuple first,</text><text x="250" y="152" class="s">then throws most away</text>

<text x="490" y="20" text-anchor="middle" class="b">R ⋈ σ<tspan baseline-shift="sub" font-size="10">b_id=102</tspan>(S)</text>
<circle cx="490" cy="62" r="24" class="bx2"/><text x="490" y="67" text-anchor="middle" class="b">⋈</text>
<rect x="400" y="110" width="50" height="30" rx="5" class="bx"/><text x="425" y="130" text-anchor="middle" class="m">R</text>
<circle cx="545" cy="125" r="24" class="bxg"/><text x="545" y="130" text-anchor="middle" class="b">σ</text>
<rect x="520" y="178" width="50" height="30" rx="5" class="bx"/><text x="545" y="198" text-anchor="middle" class="m">S</text>
<path d="M475 81 L435 110 M505 81 L533 103 M545 149 V178" class="ln"/>
<text x="580" y="68" class="s g">filter first:</text><text x="580" y="83" class="s g">join far</text><text x="580" y="98" class="s g">fewer tuples</text>
</svg>
<figcaption>Both expressions are equivalent (they return the same tuples), but pushing the selection below the join is usually much cheaper.</figcaption>
</figure>
<p>This is exactly why SQL is declarative: you state <i>what</i> you want (“joined tuples of R and S where S.b_id = 102”) and the DBMS’s <b>query optimizer</b> picks the cheapest equivalent algebra expression. We will meet relational algebra again in query optimization and execution.</p>`
      },
      {
        id: 'other-models', title: 'Alternative data models: document and vector',
        body: `
<div class="grid2">
<div class="card"><h4>Document model</h4>
<ul class="small">
<li>A collection of record <b>documents</b> containing a hierarchy of named field/value pairs.</li>
<li>A field’s value can be a scalar, an <b>array</b>, or <b>another document</b>.</li>
<li>Modern systems use JSON; older ones XML or custom objects.</li>
<li>Goal: avoid the <b>object-relational impedance mismatch</b> by tightly coupling application objects and the database.</li>
</ul></div>
<div class="card"><h4>Vector model</h4>
<ul class="small">
<li>One-dimensional arrays used for exact or <b>approximate nearest-neighbour</b> search.</li>
<li>Used for semantic search on <b>embeddings</b> produced by ML transformer models.</li>
<li>Specialized indexes answer nearest-neighbour queries quickly.</li>
<li>Not a big enough deviation to need new DBMS architectures — every major DBMS now has native vector indexes; vector DBMSs mainly offer better integration with AI tooling (OpenAI, LangChain).</li>
</ul></div>
</div>
<div class="grid2">
<pre>{ "name": "GZA",
  "year": 1990,
  "albums": [
    { "name": "Liquid Swords", "year": 1995 },
    { "name": "Beneath the Surface", "year": 1999 }
  ] }</pre>
<div class="callout key" style="margin:0"><span class="ct">Trade-off</span><p>Embedding albums inside the artist document makes “fetch an artist with all albums” one read — but an album with several artists must be duplicated, which brings back the integrity problems of flat files.</p></div>
</div>`
      }
    ],
    exercises: [
      {
        level: 'Warm-up', title: 'Classify the flat-file problem',
        q: '<p>For each issue, say whether it is a <b>data-integrity</b>, <b>implementation</b> or <b>durability</b> problem of the flat-file approach:</p><ol type="a"><li>Two threads append to <code>albums.csv</code> at the same time.</li><li>The year of an album is overwritten with the string <code>"nineteen"</code>.</li><li>The power fails halfway through rewriting a record.</li><li>Finding one artist requires reading the whole file.</li><li>An artist is deleted but their albums still mention them.</li></ol>',
        a: '<ol type="a"><li><b>Implementation</b> (concurrent writers).</li><li><b>Integrity</b> (no type/domain constraint).</li><li><b>Durability</b> (crash during update).</li><li><b>Implementation</b> (no way to find a record efficiently — no index).</li><li><b>Integrity</b> (no referential constraint).</li></ol>'
      },
      {
        level: 'Core', title: 'Compute the operators',
        q: '<p>Let <span class="ra">R(a_id, b_id) = {(a1,101), (a2,102), (a3,103)}</span> and <span class="ra">S(a_id, b_id) = {(a3,103), (a4,104), (a5,105)}</span>. Compute: <span class="ra">R ∪ S</span>, <span class="ra">R ∩ S</span>, <span class="ra">R − S</span>, <span class="ra">S − R</span>, and the number of tuples and attributes in <span class="ra">R × S</span>.</p>',
        a: '<ul><li><span class="ra">R ∪ S</span> = {(a1,101), (a2,102), (a3,103), (a4,104), (a5,105)} — 5 tuples, the shared (a3,103) appears once.</li><li><span class="ra">R ∩ S</span> = {(a3,103)}</li><li><span class="ra">R − S</span> = {(a1,101), (a2,102)}</li><li><span class="ra">S − R</span> = {(a4,104), (a5,105)}</li><li><span class="ra">R × S</span>: 3 · 3 = <b>9 tuples</b>, 2 + 2 = <b>4 attributes</b> (R.a_id, R.b_id, S.a_id, S.b_id).</li></ul><p>Check your work in the playground above.</p>'
      },
      {
        level: 'Core', title: 'Write the algebra',
        q: '<p>Using <code>student(sid, name, login, age, gpa)</code> and <code>enrolled(sid, cid, grade)</code>, write a relational algebra expression for: “the <b>names</b> of students who got an <b>A</b> in course <b>15-445</b>”. Then write an equivalent but more efficient expression.</p>',
        a: '<p>Straightforward version:</p><div class="formula ra">π<sub>name</sub>( σ<sub>cid=\'15-445\' ∧ grade=\'A\'</sub>( student ⋈ enrolled ) )</div><p>More efficient — push the selection down to <code>enrolled</code> before joining, so far fewer tuples participate in the join:</p><div class="formula ra">π<sub>name</sub>( student ⋈ σ<sub>cid=\'15-445\' ∧ grade=\'A\'</sub>(enrolled) )</div><p>Both return the same set of names (they are equivalent expressions).</p>'
      },
      {
        level: 'Core', title: 'Express one operator with others',
        q: '<p>(a) Express <span class="ra">R ∩ S</span> using only difference. (b) Express the theta-join <span class="ra">R ⋈<sub>R.x=S.y</sub> S</span> using product and selection.</p>',
        a: '<p>(a) <span class="ra">R ∩ S = R − (R − S)</span>. <span class="ra">R − S</span> is what R has that S lacks; removing that from R leaves what both have.</p><p>(b) <span class="ra">R ⋈<sub>R.x=S.y</sub> S = σ<sub>R.x=S.y</sub>(R × S)</span>.</p>'
      },
      {
        level: 'Concept', title: 'Data independence',
        q: '<p>Classify each change as relying on <b>physical</b> or <b>logical</b> data independence: (a) the DBA adds a B+Tree index on <code>student.login</code>; (b) <code>student</code> is split into <code>student_core</code> and <code>student_contact</code>, and a view named <code>student</code> recreates the old table; (c) the table is moved from a row store to a column store.</p>',
        a: '<p>(a) <b>Physical</b> — only the storage/access structures change; queries are unchanged (they may just get faster).</p><p>(b) <b>Logical</b> — the logical schema changed, but applications keep working through the view (external schema).</p><p>(c) <b>Physical</b> — the storage layout changed; the logical table is the same.</p>'
      },
      {
        level: 'Concept', title: 'σ versus SELECT',
        q: '<p>A classmate says “σ is the same as SQL SELECT and π is the same as WHERE”. Correct them, and translate <code>SELECT DISTINCT name FROM student WHERE gpa &gt; 3.5</code> into relational algebra.</p>',
        a: '<p>It is the other way round: <b>σ (selection) filters rows ↔ WHERE</b>, and <b>π (projection) chooses columns ↔ the SELECT list</b>.</p><div class="formula ra">π<sub>name</sub>( σ<sub>gpa &gt; 3.5</sub>(student) )</div><p><code>DISTINCT</code> is needed in SQL because SQL uses bags (duplicates allowed), while relational algebra’s π returns a set.</p>'
      },
      {
        level: 'Concept', title: 'Keys',
        q: '<p>In <code>ArtistAlbum(artist_id, album_id)</code>, why is neither <code>artist_id</code> nor <code>album_id</code> alone a valid primary key? What does the DBMS do if you insert <code>(7, 99)</code> but no artist with id 7 exists?</p>',
        a: '<p>An artist can appear on many albums and an album can have many artists, so each attribute alone repeats. Only the pair <code>(artist_id, album_id)</code> is unique — a <b>composite primary key</b>.</p><p>The insert violates the <b>foreign-key (referential) constraint</b> <code>artist_id REFERENCES Artist(id)</code>, so the DBMS <b>rejects</b> it.</p>'
      }
    ],
    quiz: [
      { q: 'Which statement about a relation in the relational model is TRUE?', o: ['Tuples are stored in insertion order and that order is meaningful', 'A relation is an unordered set of tuples', 'Every attribute must allow NULL', 'A relation must have exactly one foreign key'], a: 1, e: 'A relation is an <b>unordered set</b>; row order carries no meaning.' },
      { q: 'Which relational algebra operator corresponds to the SQL <code>WHERE</code> clause?', o: ['π (projection)', 'σ (selection)', '× (product)', 'ρ (rename)'], a: 1, e: 'Selection σ filters tuples using a predicate — exactly what WHERE does.' },
      { q: 'If |R| = 4 and |S| = 5, how many tuples does R × S have?', o: ['9', '20', '5', 'It depends on the common attributes'], a: 1, e: 'The Cartesian product pairs every tuple of R with every tuple of S: 4 × 5 = 20.' },
      { q: 'Which operators require both inputs to have the same attributes?', o: ['×, ⋈', '∪, ∩, −', 'σ, π', 'Only ⋈'], a: 1, e: 'Union, intersection and difference are set operations on tuples of the same shape (union-compatible).' },
      { q: 'Physical data independence means…', o: ['applications are unaffected by changes to how data is stored', 'every table is stored in its own file', 'the DBMS stores data independently on several machines', 'users can change the logical schema without views'], a: 0, e: 'The storage layout can change (indexes, files, layout) without changing the logical schema or queries.' },
      { q: 'SQL is best described as a…', o: ['procedural language based on relational algebra', 'declarative language: you state what you want, the DBMS decides how', 'physical storage language', 'language that requires choosing join order manually'], a: 1, e: 'SQL is declarative (closer to relational calculus); the optimizer chooses the execution strategy.' },
      { q: 'Who proposed the relational model, and when?', o: ['Jim Gray, 1975', 'Edgar F. Codd, 1969', 'Michael Stonebraker, 1986', 'Charles Bachman, 1960'], a: 1, e: 'Ted Codd at IBM Research devised the relational model in 1969 (published 1970).' },
      { q: 'Which expression is equivalent to R ∩ S?', o: ['R − (S − R)', 'R − (R − S)', '(R ∪ S) − R', 'R × S'], a: 1, e: 'R − S is what is only in R; removing it from R leaves the tuples in both.' },
      { q: 'What does the extended operator γ represent?', o: ['Sorting', 'Renaming', 'Aggregation (GROUP BY)', 'Duplicate elimination'], a: 2, e: 'γ<sub>G; f(A)→B</sub>(R) = SELECT G, f(A) AS B FROM R GROUP BY G. Sorting is τ, rename is ρ, duplicate elimination is δ.' },
      { q: 'Why are SQL:92 global assertions rarely used?', o: ['They are not part of any standard', 'They are too slow to check', 'They cannot reference more than one table', 'They only work with NULL values'], a: 1, e: 'Assertions can span many relations and must be re-checked on every modification, which is too expensive.' },
      { q: 'Which statement about the document data model is TRUE?', o: ['Field values must be atomic', 'A field value may be a scalar, an array or another document', 'It requires a fixed schema declared in advance', 'It was invented to replace vector databases'], a: 1, e: 'Documents are hierarchies of field/value pairs; values can be nested documents or arrays.' },
      { q: 'σ<sub>b_id=102</sub>(R ⋈ S) and R ⋈ σ<sub>b_id=102</sub>(S)…', o: ['return different results', 'return the same result, but the second is usually cheaper', 'return the same result and always cost the same', 'are both invalid'], a: 1, e: 'They are equivalent; pushing the selection down reduces the number of tuples entering the join.' }
    ]
  });
})();
