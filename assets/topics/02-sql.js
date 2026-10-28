(function () {
  'use strict';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function attr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
  // Runnable example (executed against a fresh copy of the sample DB)
  function run(sql, label) { return '<pre class="sql" data-run="' + attr(label || 'Runs on the sample database (SQLite)') + '">' + esc(sql) + '</pre>'; }
  // Display-only SQL (other dialects / not supported by SQLite)
  function code(sql) { return '<pre class="sql">' + esc(sql) + '</pre>'; }
  function chk(solution, ordered) {
    return '<div data-sim="sqlCheck" data-opts="' + attr(JSON.stringify({ solution: solution, ordered: !!ordered })) + '"></div>';
  }
  function marker(id) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker></defs>';
  }

  var S = {};

  S.sample = `
<p>All examples in this chapter use the same small university database (the one used in the lecture slides). Every grey code block with a <b>Run ▸</b> button executes in your browser on a fresh copy of it, using SQLite.</p>
<div class="grid3">
<div><div class="small muted">student</div><table class="rel"><thead><tr><th>sid</th><th>name</th><th>login</th><th>age</th><th>gpa</th></tr></thead><tbody>
<tr><td>53666</td><td>RZA</td><td>rza@cs</td><td>55</td><td>4.0</td></tr>
<tr><td>53688</td><td>Bieber</td><td>jbieber@cs</td><td>27</td><td>3.9</td></tr>
<tr><td>53655</td><td>Tupac</td><td>shakur@cs</td><td>25</td><td>3.5</td></tr>
<tr><td>53677</td><td>Kendrick</td><td>kdot@cs</td><td>37</td><td>3.8</td></tr>
<tr><td>53699</td><td>Adele</td><td>adele@music</td><td>36</td><td>3.6</td></tr>
<tr><td>53611</td><td>Drake</td><td>drake@ece</td><td>38</td><td>3.1</td></tr>
<tr><td>53622</td><td>Rihanna</td><td>rihanna@ece</td><td>36</td><td>3.3</td></tr>
<tr><td>53633</td><td>Eminem</td><td>slim@cs</td><td>52</td><td>2.9</td></tr>
<tr><td>53705</td><td>Lizzo</td><td>lizzo@music</td><td>34</td><td>3.7</td></tr>
</tbody></table></div>
<div><div class="small muted">enrolled</div><table class="rel"><thead><tr><th>sid</th><th>cid</th><th>grade</th></tr></thead><tbody>
<tr><td>53666</td><td>15-445</td><td>C</td></tr><tr><td>53688</td><td>15-721</td><td>A</td></tr><tr><td>53688</td><td>15-826</td><td>B</td></tr>
<tr><td>53655</td><td>15-445</td><td>B</td></tr><tr><td>53666</td><td>15-721</td><td>C</td></tr><tr><td>53677</td><td>15-445</td><td>A</td></tr>
<tr><td>53677</td><td>15-721</td><td>B</td></tr><tr><td>53699</td><td>15-826</td><td>A</td></tr><tr><td>53611</td><td>15-445</td><td>B</td></tr>
<tr><td>53622</td><td>18-213</td><td>A</td></tr><tr><td>53633</td><td>15-445</td><td>D</td></tr><tr><td>53611</td><td>18-213</td><td>C</td></tr>
</tbody></table></div>
<div><div class="small muted">course</div><table class="rel"><thead><tr><th>cid</th><th>name</th></tr></thead><tbody>
<tr><td>15-445</td><td>Database Systems</td></tr><tr><td>15-721</td><td>Advanced Database Systems</td></tr>
<tr><td>15-826</td><td>Data Mining</td></tr><tr><td>15-799</td><td>Special Topics in Databases</td></tr><tr><td>18-213</td><td>Intro to Computer Systems</td></tr>
</tbody></table></div>
</div>
<p class="small muted">Note: Lizzo is not enrolled in anything, and course 15-799 has no students — both are useful for “find the missing ones” questions.</p>
<div data-sim="sqlSandbox" data-opts='{"title":"Free SQL sandbox"}'></div>`;

  S.intro = `
<p>IBM created the first relational query language, <b>SQUARE</b>, in 1971, then <b>SEQUEL</b> (“Structured English Query Language”) in 1972 for the System R prototype. Commercial SQL DBMSs followed: System/38 (1979), SQL/DS (1981) and DB2 (1983). SQL is still the dominant database language — there are many natural-language-to-SQL tools, but writing SQL is not going away.</p>
<p>SQL is really several languages in one:</p>
<table><thead><tr><th>Part</th><th>Purpose</th><th>Examples</th></tr></thead><tbody>
<tr><td><b>DML</b> — Data Manipulation Language</td><td>Read and modify data</td><td><code>SELECT</code>, <code>INSERT</code>, <code>UPDATE</code>, <code>DELETE</code></td></tr>
<tr><td><b>DDL</b> — Data Definition Language</td><td>Define schemas</td><td><code>CREATE TABLE</code>, <code>ALTER</code>, <code>DROP</code>, <code>CREATE INDEX</code></td></tr>
<tr><td><b>DCL</b> — Data Control Language</td><td>Security / access control</td><td><code>GRANT</code>, <code>REVOKE</code></td></tr>
</tbody></table>
<p>It also includes view definitions, integrity and referential constraints, and transactions.</p>
<div class="callout key"><span class="ct">Bags, not sets</span><p><b>SQL is based on bags (duplicates allowed), not sets.</b> That is why you need <code>DISTINCT</code> to get set semantics, and why <code>UNION</code> removes duplicates while <code>UNION ALL</code> keeps them.</p></div>
<div class="callout exam"><span class="ct">General advice from the lecture</span><p>You should (almost) always strive to compute your answer as a <b>single SQL statement</b> — let the DBMS optimize the whole thing instead of shipping data back and forth to the application.</p></div>`;

  S.agg = `
<p>An <b>aggregate function</b> takes a bag of tuples and returns a single value:</p>
<table><thead><tr><th>Function</th><th>Returns</th></tr></thead><tbody>
<tr><td><code>AVG(col)</code></td><td>Average of the values in col</td></tr>
<tr><td><code>MIN(col)</code> / <code>MAX(col)</code></td><td>Minimum / maximum value</td></tr>
<tr><td><code>SUM(col)</code></td><td>Sum of the values</td></tr>
<tr><td><code>COUNT(col)</code></td><td>Number of (non-NULL) values; <code>COUNT(*)</code> counts rows</td></tr>
</tbody></table>
<p>Aggregates can (almost) only be used in the <code>SELECT</code> output list. Count the students with an “@cs” login — these three are equivalent:</p>
${run(`SELECT COUNT(login) AS cnt FROM student WHERE login LIKE '%@cs';
-- also: COUNT(*), COUNT(1), COUNT(1+1+1)`)}
<p>Several aggregates can be computed in one pass, and <code>DISTINCT</code> can be used inside <code>COUNT</code>, <code>SUM</code> and <code>AVG</code>:</p>
${run(`SELECT AVG(gpa), COUNT(sid), COUNT(DISTINCT login)
  FROM student WHERE login LIKE '%@cs';`)}
<div class="callout warn"><span class="ct">Undefined output</span><p>Columns outside an aggregate are <b>undefined</b> when there is no GROUP BY. The query below asks for “the average GPA <i>and</i> the cid” — but which cid? PostgreSQL and standard SQL reject it; SQLite and lenient MySQL modes just pick an arbitrary row.</p></div>
${run(`SELECT AVG(s.gpa), e.cid
  FROM enrolled AS e JOIN student AS s ON e.sid = s.sid;`, 'Wrong on purpose — SQLite returns an arbitrary cid')}

<h3>GROUP BY</h3>
<p><code>GROUP BY</code> projects tuples into subsets and calculates the aggregate against each subset. “Average GPA of students enrolled in <i>each</i> course”:</p>
${run(`SELECT e.cid, AVG(s.gpa) AS avg_gpa
  FROM enrolled AS e JOIN student AS s ON e.sid = s.sid
 GROUP BY e.cid;`)}
<figure class="diagram">
<svg viewBox="0 0 640 250" width="640" role="img" aria-label="GROUP BY collects rows with the same cid and computes one aggregate per group">
${marker('l2a')}
<text x="20" y="18" class="s">joined rows (cid, gpa)</text>
<g class="m">
<rect x="20" y="26" width="170" height="104" rx="4" class="bxa"/>
<text x="32" y="46" class="m">15-445  4.0</text><text x="32" y="64" class="m">15-445  3.5</text><text x="32" y="82" class="m">15-445  3.8</text><text x="32" y="100" class="m">15-445  3.1</text><text x="32" y="118" class="m">15-445  2.9</text>
<rect x="20" y="136" width="170" height="54" rx="4" class="bxg"/>
<text x="32" y="156" class="m">15-721  3.9</text><text x="32" y="174" class="m">15-721  4.0 …</text>
<rect x="20" y="196" width="170" height="24" rx="4" class="bxv"/><text x="32" y="213" class="m">15-826  …</text>
<rect x="20" y="224" width="170" height="24" rx="4" class="bxw"/><text x="32" y="241" class="m">18-213  …</text>
</g>
<path d="M200 78 H300 M200 163 H300 M200 208 H300 M200 236 H300" class="ln" marker-end="url(#l2a)"/>
<text x="250" y="70" text-anchor="middle" class="s">AVG</text>
<rect x="310" y="64" width="200" height="28" rx="4" class="bxa"/><text x="322" y="83" class="m">15-445  3.46</text>
<rect x="310" y="149" width="200" height="28" rx="4" class="bxg"/><text x="322" y="168" class="m">15-721  3.90</text>
<rect x="310" y="194" width="200" height="26" rx="4" class="bxv"/><text x="322" y="212" class="m">15-826  3.75</text>
<rect x="310" y="224" width="200" height="24" rx="4" class="bxw"/><text x="322" y="241" class="m">18-213  3.20</text>
<text x="530" y="83" class="s">one output</text><text x="530" y="99" class="s">row per group</text>
</svg>
<figcaption>GROUP BY collapses each group into one output row.</figcaption>
</figure>
<div class="callout key"><span class="ct">The GROUP BY rule</span><p>Every <b>non-aggregated</b> column in the <code>SELECT</code> list must appear in the <code>GROUP BY</code> clause. <code>SELECT AVG(s.gpa), e.cid, s.name … GROUP BY e.cid</code> is invalid: a group has many names.</p></div>

<h3>HAVING</h3>
<p><code>HAVING</code> filters <b>groups</b> based on an aggregate — it is “a WHERE clause for GROUP BY”. <code>WHERE</code> runs before grouping (on individual rows), so it cannot use aggregates.</p>
${run(`SELECT e.cid, AVG(s.gpa) AS avg_gpa
  FROM enrolled AS e, student AS s
 WHERE e.sid = s.sid
 GROUP BY e.cid
HAVING AVG(s.gpa) > 3.6;`)}
<div class="callout exam"><span class="ct">Logical order of evaluation</span><p><code>FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT/FETCH</code>. This explains most “why is this invalid?” questions: e.g. WHERE cannot see aggregates because grouping has not happened yet.</p></div>`;

  S.strings = `
<p>String handling differs a lot between systems:</p>
<table><thead><tr><th>System</th><th>String case</th><th>String quotes</th></tr></thead><tbody>
<tr><td>SQL-92 standard</td><td>Sensitive</td><td>Single only</td></tr>
<tr><td>PostgreSQL</td><td>Sensitive</td><td>Single only</td></tr>
<tr><td>MySQL</td><td>Insensitive</td><td>Single / double</td></tr>
<tr><td>SQLite</td><td>Sensitive</td><td>Single / double</td></tr>
<tr><td>Oracle, DB2</td><td>Sensitive</td><td>Single only</td></tr>
</tbody></table>
<p><code>WHERE UPPER(name) = UPPER('KaNyE')</code> is the portable way to compare case-insensitively (SQL-92); MySQL would match <code>name = 'KaNyE'</code> directly.</p>
<h3>LIKE pattern matching</h3>
<ul><li><code>%</code> matches any substring, <b>including the empty string</b>.</li><li><code>_</code> matches <b>exactly one</b> character.</li></ul>
${run(`SELECT * FROM enrolled AS e WHERE e.cid LIKE '15-%';`)}
${run(`SELECT * FROM student AS s WHERE s.login LIKE '%@c_';`)}
<p class="small muted">SQLite’s LIKE happens to be case-insensitive for ASCII letters; PostgreSQL’s is case-sensitive (it has ILIKE for insensitive matching).</p>
<h3>String functions and concatenation</h3>
<p>SQL-92 defines string functions (<code>SUBSTRING</code>, <code>UPPER</code>, <code>LOWER</code>, <code>TRIM</code>, …) and many DBMSs add their own. They can be used in the output <i>and</i> in predicates. The standard concatenation operator is <code>||</code> (MySQL uses <code>CONCAT()</code>; SQL Server uses <code>+</code>).</p>
${run(`SELECT SUBSTRING(name, 1, 3) AS abbrv_name,
       UPPER(name) AS shout,
       name || ' <' || login || '>' AS contact
  FROM student WHERE UPPER(name) LIKE 'K%';`)}
<h3>Date and time</h3>
<p>Operations to manipulate DATE/TIME attributes can be used in both output and predicates, but <b>support and syntax vary wildly</b>. The lecture demo — “number of days since the beginning of the year” — looks different in every system:</p>
${code(`-- PostgreSQL
SELECT DATE('2026-10-28') - DATE('2026-01-01') AS days;
-- MySQL
SELECT DATEDIFF(DATE('2026-10-28'), DATE('2026-01-01')) AS days;`)}
${run(`-- SQLite
SELECT CAST(julianday('2026-10-28') - julianday('2026-01-01') AS INTEGER) AS days;`)}`;

  S.output = `
<h3>Output redirection</h3>
<p>Store query results in <b>another table</b>. With <code>SELECT … INTO</code> / <code>CREATE TABLE … AS</code>, the table must <b>not already exist</b>; it gets the same number of columns with the same types as the query output.</p>
${code(`-- SQL standard (also SQL Server)
SELECT DISTINCT cid INTO CourseIds FROM enrolled;`)}
${run(`-- PostgreSQL, MySQL, SQLite
CREATE TABLE CourseIds AS SELECT DISTINCT cid FROM enrolled;
SELECT * FROM CourseIds;`)}
<p>To add into an <b>existing</b> table use <code>INSERT INTO … SELECT</code>. The inner SELECT must produce the same columns as the target. What happens on integrity violations (e.g. duplicate keys) is DBMS-specific: PostgreSQL <code>ON CONFLICT DO NOTHING</code>, MySQL <code>INSERT IGNORE</code>, SQLite <code>INSERT OR IGNORE</code>.</p>
${run(`CREATE TABLE CourseIds (cid TEXT PRIMARY KEY);
INSERT INTO CourseIds SELECT DISTINCT cid FROM enrolled;
INSERT OR IGNORE INTO CourseIds SELECT cid FROM course;  -- duplicates skipped
SELECT * FROM CourseIds;`)}

<h3>Output control: ORDER BY</h3>
<p><code>ORDER BY &lt;column*&gt; [ASC|DESC]</code> orders the output by one or more columns (ASC is the default). You can sort by expressions too.</p>
${run(`SELECT sid, grade FROM enrolled WHERE cid = '15-445'
 ORDER BY grade DESC, sid ASC;`)}

<h3>Limiting rows: FETCH / OFFSET</h3>
<p>The standard syntax is <code>FETCH {FIRST|NEXT} &lt;count&gt; ROWS ONLY</code> with an optional <code>OFFSET &lt;count&gt; ROWS</code> to return a “range”. <code>WITH TIES</code> also returns rows tied with the last one. Without ORDER BY, which rows you get is not defined.</p>
${code(`-- SQL standard / PostgreSQL
SELECT sid, name FROM student WHERE login LIKE '%@cs'
 ORDER BY gpa DESC
OFFSET 1 ROWS FETCH FIRST 3 ROWS ONLY;`)}
${run(`-- SQLite / MySQL / PostgreSQL shorthand
SELECT sid, name, gpa FROM student WHERE login LIKE '%@cs'
 ORDER BY gpa DESC
 LIMIT 3 OFFSET 1;`)}`;

  S.window = `
<p>A <b>window function</b> performs a calculation across a set of tuples that are related to the current tuple <b>without collapsing them</b> into a single output tuple. It is like an aggregation, but every input row stays in the output — perfect for running totals, ranks and moving averages.</p>
<figure class="diagram">
<svg viewBox="0 0 640 210" width="640" role="img" aria-label="GROUP BY collapses rows; a window function keeps every row and adds a column">
<text x="150" y="18" text-anchor="middle" class="b">GROUP BY cid</text>
<rect x="60" y="30" width="180" height="26" class="bxa"/><text x="72" y="48" class="m">15-445 │ COUNT=5</text>
<rect x="60" y="56" width="180" height="26" class="bxg"/><text x="72" y="74" class="m">15-721 │ COUNT=3</text>
<text x="150" y="104" text-anchor="middle" class="s">rows collapse — one per group</text>
<text x="460" y="18" text-anchor="middle" class="b">ROW_NUMBER() OVER (PARTITION BY cid)</text>
<rect x="330" y="30" width="260" height="22" class="bxa"/><text x="342" y="46" class="m">15-445 53611 B  │ 1</text>
<rect x="330" y="52" width="260" height="22" class="bxa"/><text x="342" y="68" class="m">15-445 53633 D  │ 2</text>
<rect x="330" y="74" width="260" height="22" class="bxa"/><text x="342" y="90" class="m">15-445 53655 B  │ 3</text>
<rect x="330" y="96" width="260" height="22" class="bxa"/><text x="342" y="112" class="m">  …                │ …</text>
<rect x="330" y="122" width="260" height="22" class="bxg"/><text x="342" y="138" class="m">15-721 53666 C  │ 1</text>
<rect x="330" y="144" width="260" height="22" class="bxg"/><text x="342" y="160" class="m">15-721 53677 B  │ 2</text>
<rect x="330" y="166" width="260" height="22" class="bxg"/><text x="342" y="182" class="m">15-721 53688 A  │ 3</text>
<text x="460" y="204" text-anchor="middle" class="s">every row kept; numbering restarts per partition</text>
</svg>
</figure>
${code(`SELECT ... FUNC-NAME(...) OVER (PARTITION BY ... ORDER BY ...)
  FROM tableName;`)}
<ul>
<li><b>Function</b>: any aggregate (<code>SUM</code>, <code>AVG</code>, <code>COUNT</code>…) or a special window function: <code>ROW_NUMBER()</code> — the number of the current row; <code>RANK()</code> — the order position of the current row (ties get the same rank and leave gaps: 1, 2, 2, 4).</li>
<li><b>OVER</b> specifies how to group tuples when computing the window function. An empty <code>OVER ()</code> means the whole result is one window.</li>
<li><b>PARTITION BY</b> specifies the groups.</li>
<li><b>ORDER BY</b> inside OVER sorts the entries within each group (and is what RANK ranks by).</li>
</ul>
${run(`SELECT cid, sid,
       ROW_NUMBER() OVER (PARTITION BY cid) AS row_num
  FROM enrolled
 ORDER BY cid;`)}
${run(`SELECT *, ROW_NUMBER() OVER (ORDER BY cid) AS row_num
  FROM enrolled
 ORDER BY cid;`)}
<p>The classic lecture example: <b>find the student with the second highest grade for each course</b>. Grades are letters, so the “highest” grade is the smallest string (A &lt; B &lt; C), hence <code>ORDER BY grade ASC</code>.</p>
${run(`SELECT * FROM (
  SELECT *, RANK() OVER (PARTITION BY cid ORDER BY grade ASC) AS rank
    FROM enrolled) AS ranking
 WHERE ranking.rank = 2;`)}
<div class="callout warn"><span class="ct">Why the nested query?</span><p>You cannot write <code>WHERE RANK() OVER (…) = 2</code>: window functions are computed after WHERE (they are part of SELECT). So compute the rank in an inner query and filter in the outer one. Notice that in 15-445 two students tie for rank 2.</p></div>`;

  S.nested = `
<p>A <b>nested query</b> (subquery) invokes a query inside another query to compose more complex computations. Inner queries can appear (almost) anywhere: in <code>FROM</code>, in <code>WHERE</code>, even in the <code>SELECT</code> list. They are often difficult for the DBMS to optimize.</p>
<p>Get the names of students in ’15-445’:</p>
${run(`SELECT name FROM student
 WHERE sid IN (SELECT sid FROM enrolled WHERE cid = '15-445');`)}
<table><thead><tr><th>Operator</th><th>Meaning</th></tr></thead><tbody>
<tr><td><code>ALL</code></td><td>Must satisfy the expression for <b>all</b> rows of the subquery</td></tr>
<tr><td><code>ANY</code></td><td>Must satisfy the expression for <b>at least one</b> row</td></tr>
<tr><td><code>IN</code></td><td>Equivalent to <code>= ANY()</code></td></tr>
<tr><td><code>EXISTS</code></td><td>At least one row is returned (without comparing it to an outer attribute)</td></tr>
</tbody></table>
${code(`-- PostgreSQL / standard: same query with = ANY
SELECT name FROM student
 WHERE sid = ANY (SELECT sid FROM enrolled WHERE cid = '15-445');`)}
<p>A subquery in the SELECT list must return a single value per row. It may reference the outer query — a <b>correlated</b> subquery, conceptually re-evaluated for each outer row:</p>
${run(`SELECT (SELECT s.name FROM student AS s WHERE s.sid = e.sid) AS sname
  FROM enrolled AS e
 WHERE cid = '15-445';`)}

<h3>“Student with the highest id enrolled in at least one course”</h3>
<p>This tempting query is <b>wrong in SQL-92</b>: <code>s.name</code> is not aggregated and there is no GROUP BY. It happens to run in SQLite (which returns the name from the max row), but not in PostgreSQL or MySQL 8 strict mode.</p>
${run(`SELECT MAX(e.sid), s.name
  FROM enrolled AS e, student AS s
 WHERE e.sid = s.sid;`, 'Non-standard: works in SQLite only')}
<p>Correct formulations:</p>
${code(`-- with ALL (PostgreSQL / standard; SQLite does not support ALL/ANY)
SELECT sid, name FROM student
 WHERE sid >= ALL (SELECT sid FROM enrolled);`)}
${run(`SELECT sid, name FROM student
 WHERE sid IN (SELECT MAX(sid) FROM enrolled);`)}
${run(`SELECT sid, name FROM student
 WHERE sid IN (SELECT sid FROM enrolled ORDER BY sid DESC LIMIT 1);`)}

<h3>Anti-join: “find all courses that have no students enrolled”</h3>
${run(`SELECT * FROM course
 WHERE NOT EXISTS (SELECT * FROM enrolled
                    WHERE course.cid = enrolled.cid);`)}
<p class="small muted">The inner query references <code>course.cid</code> from the outer query — it is correlated. <code>NOT IN (SELECT cid FROM enrolled)</code> also works here, but beware: <code>NOT IN</code> returns nothing if the subquery contains a NULL.</p>`;

  S.lateral = `
<p>The <b>LATERAL</b> operator lets a nested query in <code>FROM</code> reference attributes of other nested queries / tables that <b>precede it</b>. Think of it as a for-loop: for each tuple of the left table, invoke another query.</p>
${code(`-- PostgreSQL: number of students and average GPA per course,
-- sorted by enrollment count (descending)
SELECT * FROM course AS c,
  LATERAL (SELECT COUNT(*) AS cnt FROM enrolled
            WHERE enrolled.cid = c.cid) AS t1,
  LATERAL (SELECT AVG(gpa) AS avg FROM student AS s
             JOIN enrolled AS e ON s.sid = e.sid
            WHERE e.cid = c.cid) AS t2
 ORDER BY cnt DESC;`)}
<p>SQLite has no LATERAL; correlated scalar subqueries give the same result here:</p>
${run(`SELECT c.*,
       (SELECT COUNT(*) FROM enrolled e WHERE e.cid = c.cid) AS cnt,
       (SELECT AVG(s.gpa) FROM student s JOIN enrolled e ON s.sid = e.sid
         WHERE e.cid = c.cid) AS avg
  FROM course AS c
 ORDER BY cnt DESC;`)}`;

  S.cte = `
<p>A <b>common table expression (CTE)</b> specifies a temporary result set that can be referenced by another part of the same query — a temp table that exists only for one query. It is an alternative to nested queries, views and explicit temp tables, and often much easier to read.</p>
${run(`WITH cteName AS (
  SELECT 1
)
SELECT * FROM cteName;`)}
<p>You can bind/alias output columns to names before the <code>AS</code> keyword:</p>
${run(`WITH cteName (col1, col2) AS (
  SELECT 1, 2
)
SELECT col1 + col2 FROM cteName;`)}
<p>The highest-id question again, with a CTE:</p>
${run(`WITH cteSource (maxId) AS (
  SELECT MAX(sid) FROM enrolled
)
SELECT name FROM student, cteSource
 WHERE student.sid = cteSource.maxId;`)}
<h3>Recursive CTEs</h3>
<p>With <code>RECURSIVE</code>, a CTE can reference itself: a base case, <code>UNION ALL</code>, and a recursive step with a termination condition. This makes SQL Turing-complete (e.g. tree/graph traversal).</p>
${run(`WITH RECURSIVE cteSource (counter) AS (
  SELECT 1
  UNION ALL
  SELECT counter + 1 FROM cteSource WHERE counter < 10
)
SELECT * FROM cteSource;`)}

<h3>Other things to note</h3>
<ul>
<li>Identifiers (table and column names) are <b>case-insensitive</b>, which is awkward for applications that care about case (e.g. CamelCase). That is why you often see quoted names: <code>SELECT "ArtistList.firstName"</code>.</li>
<li>The SQL standard documents are not free — you have to pay to get them.</li>
</ul>`;

  DBP.addTopic({
    id: 'sql',
    group: 'Lectures',
    num: 'L2',
    title: 'Modern SQL',
    summary: 'Aggregates, GROUP BY/HAVING, strings & dates, output control, window functions, nested queries, LATERAL and CTEs.',
    lead: 'The parts of SQL beyond basic SELECT-FROM-WHERE that the lecture focuses on — with a live SQLite sandbox so you can run every example.',
    source: 'Lecture 2 slides; textbook chapters 3–5',
    sections: [
      { id: 'intro', title: 'SQL in one page', body: S.intro },
      { id: 'sample', title: 'The sample database & sandbox', body: S.sample },
      { id: 'aggregates', title: 'Aggregates, GROUP BY and HAVING', body: S.agg },
      { id: 'strings', title: 'String, date and time operations', body: S.strings },
      { id: 'output', title: 'Output redirection and output control', body: S.output },
      { id: 'window', title: 'Window functions', body: S.window },
      { id: 'nested', title: 'Nested queries', body: S.nested },
      { id: 'lateral', title: 'Lateral joins', body: S.lateral },
      { id: 'cte', title: 'Common table expressions', body: S.cte }
    ],
    exercises: [
      { level: 'Warm-up', title: 'Auto-checked', q: '<p>List the <b>name</b> and <b>gpa</b> of students older than 35 whose GPA is above 3.5.</p>' + chk("SELECT name, gpa FROM student WHERE age > 35 AND gpa > 3.5;"),
        a: run("SELECT name, gpa FROM student WHERE age > 35 AND gpa > 3.5;") },
      { level: 'Core', title: 'Auto-checked', q: '<p>For each course that has at least one student, return the <b>cid</b> and the <b>number of enrolled students</b>.</p>' + chk("SELECT cid, COUNT(*) FROM enrolled GROUP BY cid;"),
        a: run("SELECT cid, COUNT(*) AS num_students\n  FROM enrolled\n GROUP BY cid;") + '<p>Courses without students never appear in <code>enrolled</code>, so they are automatically excluded.</p>' },
      { level: 'Core', title: 'Auto-checked', q: '<p>Return the <b>cid</b> and <b>name</b> of every course with <b>no</b> students enrolled.</p>' + chk("SELECT cid, name FROM course WHERE cid NOT IN (SELECT cid FROM enrolled);"),
        a: run("SELECT cid, name FROM course c\n WHERE NOT EXISTS (SELECT 1 FROM enrolled e WHERE e.cid = c.cid);") + '<p>Alternatives: <code>WHERE cid NOT IN (SELECT cid FROM enrolled)</code>, or a <code>LEFT JOIN … WHERE e.sid IS NULL</code> anti-join.</p>' },
      { level: 'Core', title: 'Auto-checked', q: '<p>Return the <b>cid</b> and the <b>average GPA</b> of enrolled students for courses whose average GPA is greater than 3.4.</p>' + chk("SELECT e.cid, AVG(s.gpa) FROM enrolled e JOIN student s ON e.sid = s.sid GROUP BY e.cid HAVING AVG(s.gpa) > 3.4;"),
        a: run("SELECT e.cid, AVG(s.gpa) AS avg_gpa\n  FROM enrolled e JOIN student s ON e.sid = s.sid\n GROUP BY e.cid\nHAVING AVG(s.gpa) > 3.4;") + '<p>The condition is on an aggregate, so it belongs in <b>HAVING</b>, not WHERE.</p>' },
      { level: 'Core', title: 'Auto-checked', q: '<p>Return the <b>names</b> of students enrolled in <b>both</b> 15-445 and 15-721.</p>' + chk("SELECT name FROM student WHERE sid IN (SELECT sid FROM enrolled WHERE cid='15-445' INTERSECT SELECT sid FROM enrolled WHERE cid='15-721');"),
        a: run("SELECT name FROM student\n WHERE sid IN (SELECT sid FROM enrolled WHERE cid = '15-445'\n               INTERSECT\n               SELECT sid FROM enrolled WHERE cid = '15-721');") + '<p>A common mistake is <code>WHERE cid = \'15-445\' AND cid = \'15-721\'</code> — no single row has two cids, so it returns nothing. Alternatives: a self-join of enrolled, or <code>GROUP BY sid HAVING COUNT(DISTINCT cid) = 2</code> over the two courses.</p>' },
      { level: 'Core', title: 'Auto-checked', q: '<p>Return the <b>sid</b> and <b>name</b> of students who are <b>not enrolled</b> in any course.</p>' + chk("SELECT sid, name FROM student WHERE sid NOT IN (SELECT sid FROM enrolled);"),
        a: run("SELECT s.sid, s.name\n  FROM student s LEFT JOIN enrolled e ON s.sid = e.sid\n WHERE e.sid IS NULL;") },
      { level: 'Core', title: 'Auto-checked, order matters', q: '<p>Return the <b>name</b> and <b>gpa</b> of the 3 students with the highest GPA, best first.</p>' + chk("SELECT name, gpa FROM student ORDER BY gpa DESC LIMIT 3;", true),
        a: run("SELECT name, gpa FROM student\n ORDER BY gpa DESC\n LIMIT 3;   -- standard: FETCH FIRST 3 ROWS ONLY") },
      { level: 'Exam-style', title: 'Auto-checked, window function', q: '<p>Using a window function, return <b>cid</b> and <b>sid</b> of the student(s) with the <b>best</b> grade in each course (if several tie, return all of them).</p>' + chk("SELECT cid, sid FROM (SELECT cid, sid, RANK() OVER (PARTITION BY cid ORDER BY grade ASC) AS r FROM enrolled) WHERE r = 1;"),
        a: run("SELECT cid, sid FROM (\n  SELECT cid, sid,\n         RANK() OVER (PARTITION BY cid ORDER BY grade ASC) AS r\n    FROM enrolled) AS ranking\n WHERE r = 1;") + '<p>Use <code>RANK()</code> (not <code>ROW_NUMBER()</code>) so ties all get rank 1.</p>' },
      { level: 'Exam-style', title: 'Auto-checked, CTE', q: '<p>Using a CTE, return the <b>name</b> of the student with the highest GPA among those enrolled in <b>15-445</b>.</p>' + chk("WITH c AS (SELECT s.name, s.gpa FROM student s JOIN enrolled e ON s.sid=e.sid WHERE e.cid='15-445') SELECT name FROM c WHERE gpa = (SELECT MAX(gpa) FROM c);"),
        a: run("WITH c445 AS (\n  SELECT s.name, s.gpa\n    FROM student s JOIN enrolled e ON s.sid = e.sid\n   WHERE e.cid = '15-445'\n)\nSELECT name FROM c445\n WHERE gpa = (SELECT MAX(gpa) FROM c445);") },
      { level: 'Challenge', title: 'Auto-checked', q: '<p>For <b>every</b> course (including those with no students), return the course <b>name</b> and the number of <b>B</b> grades given.</p>' + chk("SELECT c.name, COUNT(CASE WHEN e.grade = 'B' THEN 1 END) FROM course c LEFT JOIN enrolled e ON c.cid = e.cid GROUP BY c.cid, c.name;"),
        a: run("SELECT c.name,\n       COUNT(CASE WHEN e.grade = 'B' THEN 1 END) AS num_b\n  FROM course c LEFT JOIN enrolled e ON c.cid = e.cid\n GROUP BY c.cid, c.name;") + '<p>Two traps: (1) an inner join or <code>WHERE grade = \'B\'</code> would drop courses with zero B’s; (2) <code>COUNT(*)</code> would count the NULL row produced by the LEFT JOIN as 1. <code>COUNT(expr)</code> ignores NULLs, so the CASE trick gives 0.</p>' },
      { level: 'Concept', title: 'Find the bug', q: '<p>Explain why each query is invalid (in standard SQL) and fix it.</p><ol type="a"><li><code>SELECT cid, AVG(gpa) FROM enrolled JOIN student USING (sid) WHERE AVG(gpa) &gt; 3 GROUP BY cid;</code></li><li><code>SELECT cid, name, AVG(gpa) FROM enrolled JOIN student USING (sid) GROUP BY cid;</code></li><li><code>SELECT * FROM enrolled WHERE RANK() OVER (ORDER BY grade) = 1;</code></li></ol>',
        a: '<ol type="a"><li>Aggregates cannot appear in WHERE (it runs before grouping). Move it: <code>… GROUP BY cid HAVING AVG(gpa) &gt; 3</code>.</li><li><code>name</code> is neither aggregated nor in GROUP BY — one course has many names. Remove it, or group by it too.</li><li>Window functions are evaluated after WHERE. Compute the rank in a subquery/CTE and filter outside: <code>SELECT * FROM (SELECT *, RANK() OVER (ORDER BY grade) AS r FROM enrolled) t WHERE r = 1;</code></li></ol>' }
    ],
    quiz: [
      { q: 'SQL is based on…', o: ['sets — duplicates are never allowed', 'bags — duplicates are allowed unless you ask for DISTINCT', 'lists — rows always keep insertion order', 'graphs'], a: 1, e: 'SQL uses bag semantics; DISTINCT (or UNION instead of UNION ALL) gives set semantics.' },
      { q: 'Which clause filters groups based on an aggregate value?', o: ['WHERE', 'HAVING', 'ORDER BY', 'OVER'], a: 1, e: 'HAVING is “a WHERE clause for GROUP BY”; WHERE runs before grouping.' },
      { q: "Which strings match <code>LIKE '15-_4%'</code>?", o: ["'15-445' and '15-14'", "'15-445' only", "'15-45' and '15-445'", "'15-4' only"], a: 0, e: "<code>_</code> is exactly one character, <code>%</code> is any substring (including empty). '15-445': _ = 4, then '4', then '5'. '15-14': _ = 1, then '4', then empty. '15-45' fails: _ = 4 then needs another 4." },
      { q: 'What is the difference between ROW_NUMBER() and RANK() when two rows tie?', o: ['No difference', 'ROW_NUMBER gives tied rows distinct numbers; RANK gives them the same rank (then skips)', 'RANK gives tied rows distinct numbers', 'ROW_NUMBER cannot be used with PARTITION BY'], a: 1, e: 'With ties, RANK produces e.g. 1, 2, 2, 4; ROW_NUMBER always produces 1, 2, 3, 4.' },
      { q: 'What does PARTITION BY do inside OVER()?', o: ['Sorts the final output', 'Splits rows into groups for the window computation without collapsing them', 'Creates table partitions on disk', 'Removes duplicate rows'], a: 1, e: 'PARTITION BY defines the groups the window function is computed over; every row stays in the output.' },
      { q: '<code>x IN (subquery)</code> is equivalent to…', o: ['x = ALL (subquery)', 'x = ANY (subquery)', 'EXISTS (subquery)', 'x &gt;= ALL (subquery)'], a: 1, e: 'IN means “equal to at least one value” = ANY.' },
      { q: 'What does EXISTS (subquery) check?', o: ['That the subquery returns at least one row', 'That every row of the subquery matches', 'That the subquery returns exactly one row', 'That the subquery has no NULLs'], a: 0, e: 'EXISTS is true when the subquery returns at least one row.' },
      { q: 'What does LATERAL allow?', o: ['A subquery in FROM to reference columns of tables that precede it', 'Joining tables on non-equal conditions', 'Recursion in CTEs', 'Parallel execution of subqueries'], a: 0, e: 'LATERAL is like a for-loop: for each preceding tuple, run the nested query that refers to it.' },
      { q: 'A common table expression (WITH …) is best described as…', o: ['a permanent view stored in the catalog', 'a temporary result set that exists only for one query', 'an index hint', 'a stored procedure'], a: 1, e: 'Think of a CTE as a temp table just for one query.' },
      { q: '<code>SELECT … INTO newtable</code> / <code>CREATE TABLE … AS SELECT</code> requires that…', o: ['the table already exists with the same columns', 'the table does not already exist', 'the query has a GROUP BY', 'the target table has a primary key'], a: 1, e: 'Output redirection creates a new table with the same number/types of columns as the query. To add to an existing table use INSERT INTO … SELECT.' },
      { q: 'Which query is INVALID in standard SQL?', o: ['SELECT cid, COUNT(*) FROM enrolled GROUP BY cid', 'SELECT cid, sid, COUNT(*) FROM enrolled GROUP BY cid', 'SELECT COUNT(DISTINCT cid) FROM enrolled', 'SELECT cid FROM enrolled GROUP BY cid HAVING COUNT(*) > 1'], a: 1, e: 'sid is neither aggregated nor in the GROUP BY clause.' },
      { q: 'Standard SQL syntax to return only the first 10 rows is…', o: ['TOP 10', 'FETCH FIRST 10 ROWS ONLY', 'ROWNUM <= 10', 'LIMIT 10 is the only option'], a: 1, e: 'FETCH FIRST n ROWS ONLY (with optional OFFSET) is the standard; LIMIT is a widely supported non-standard shorthand.' },
      { q: 'Which of these is part of DDL?', o: ['SELECT', 'GRANT', 'CREATE TABLE', 'UPDATE'], a: 2, e: 'DDL defines schemas (CREATE/ALTER/DROP). GRANT is DCL; SELECT and UPDATE are DML.' },
      { q: 'What is the SQL-standard string concatenation operator?', o: ['+', '||', '&', 'CONCAT only'], a: 1, e: '|| is the SQL standard; MySQL uses CONCAT(), SQL Server uses +.' }
    ]
  });
})();
