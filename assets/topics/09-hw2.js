(function () {
  'use strict';
  function marker(id, cls) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="' + (cls || 'arrowhead') + '"/></marker></defs>';
  }

  var archDiag = `
<figure class="diagram">
<svg viewBox="0 0 660 300" width="660" role="img" aria-label="Homework 2 architecture: buffer pool manager uses the LRU-K replacer and the disk scheduler; callers hold page guards">
${marker('l9a')}
<rect x="20" y="16" width="170" height="44" rx="6" class="bxv"/><text x="105" y="36" text-anchor="middle" class="b">Caller (query)</text><text x="105" y="52" text-anchor="middle" class="s">holds Read/WritePageGuard</text>
<rect x="230" y="16" width="250" height="120" rx="6" class="bxa"/><text x="355" y="36" text-anchor="middle" class="b a">BufferPoolManager (Task 3)</text>
<text x="244" y="58" class="s">bpm_latch_ protects:</text>
<text x="252" y="76" class="m">page_table_: page_id → frame_id</text>
<text x="252" y="94" class="m">free_list_, frames_[ ]</text>
<text x="244" y="118" class="s">frame: data, pin_count, is_dirty, rwlatch</text>
<rect x="520" y="16" width="125" height="58" rx="6" class="bxg"/><text x="582" y="38" text-anchor="middle" class="b g">LRUKReplacer</text><text x="582" y="56" text-anchor="middle" class="s">(Task 1) who to evict</text>
<rect x="230" y="176" width="250" height="52" rx="6" class="bxw"/><text x="355" y="198" text-anchor="middle" class="b w">DiskScheduler (Task 2)</text><text x="355" y="216" text-anchor="middle" class="s">request queue + background thread</text>
<rect x="230" y="256" width="250" height="36" rx="6" class="bx2"/><text x="355" y="279" text-anchor="middle" class="b">DiskManager (provided)</text>
<path d="M190 38 H228" class="ln" marker-end="url(#l9a)"/><text x="195" y="78" class="s">Checked</text><text x="195" y="92" class="s">Read/Write</text><text x="195" y="106" class="s">Page()</text>
<path d="M480 45 H518" class="ln" marker-end="url(#l9a)"/><text x="486" y="96" class="s">RecordAccess</text><text x="486" y="110" class="s">SetEvictable</text><text x="486" y="124" class="s">Evict</text>
<path d="M355 136 V174" class="ln" marker-end="url(#l9a)"/><text x="362" y="160" class="s">Schedule(DiskRequest) → future&lt;bool&gt;</text>
<path d="M355 228 V254" class="ln" marker-end="url(#l9a)"/><text x="362" y="246" class="s">ReadPage / WritePage</text>
</svg>
<figcaption>Tasks must be done in order: the pool (Task 3) needs both the replacer (Task 1) and the scheduler (Task 2).</figcaption>
</figure>`;

  var fetchDiag = `
<figure class="diagram">
<svg viewBox="0 0 660 330" width="660" role="img" aria-label="CheckedReadPage flow chart">
${marker('l9f')}
<rect x="230" y="10" width="200" height="34" rx="17" class="bxv"/><text x="330" y="32" text-anchor="middle" class="b">CheckedReadPage(p)</text>
<rect x="210" y="62" width="240" height="34" rx="4" class="bxa"/><text x="330" y="84" text-anchor="middle" class="m">lock bpm_latch_; p in page_table_?</text>
<rect x="20" y="120" width="200" height="50" rx="4" class="bxg"/><text x="120" y="140" text-anchor="middle" class="s b g">yes (hit)</text><text x="120" y="158" text-anchor="middle" class="s">pin++, RecordAccess, SetEvictable(false)</text>
<rect x="250" y="120" width="390" height="50" rx="4" class="bx"/><text x="445" y="140" text-anchor="middle" class="s b">no (miss): take a free frame, else Evict()</text><text x="445" y="158" text-anchor="middle" class="s">no free frame and nothing evictable → return std::nullopt</text>
<rect x="250" y="188" width="390" height="34" rx="4" class="bxw"/><text x="445" y="210" text-anchor="middle" class="s">victim dirty? → write it back first (never lose a write!)</text>
<rect x="250" y="240" width="390" height="34" rx="4" class="bx"/><text x="445" y="262" text-anchor="middle" class="s">update page_table_, pin = 1, read p from disk into the frame</text>
<rect x="160" y="290" width="340" height="34" rx="4" class="bxa"/><text x="330" y="312" text-anchor="middle" class="s b">unlock bpm_latch_ → then build the guard (takes the frame latch)</text>
<path d="M330 44 V60" class="ln" marker-end="url(#l9f)"/>
<path d="M260 96 L150 118" class="ln" marker-end="url(#l9f)"/><path d="M400 96 L440 118" class="ln" marker-end="url(#l9f)"/>
<path d="M445 170 V186" class="ln" marker-end="url(#l9f)"/><path d="M445 222 V238" class="ln" marker-end="url(#l9f)"/>
<path d="M445 274 L380 288" class="ln" marker-end="url(#l9f)"/><path d="M120 170 C120 260 200 290 230 290" class="ln" marker-end="url(#l9f)"/>
<text x="20" y="214" class="s r">Performance: don’t hold</text><text x="20" y="230" class="s r">bpm_latch_ while waiting for</text><text x="20" y="246" class="s r">the disk or a frame latch</text>
</svg>
</figure>`;

  DBP.addTopic({
    id: 'hw2',
    group: 'Homework',
    num: 'HW2',
    title: 'Buffer Pool Manager & LRU-K',
    navTitle: 'Buffer Pool Manager',
    summary: 'LRU-K replacer, disk scheduler, page guards and the buffer pool manager — the concepts behind Homework 2.',
    lead: 'Homework 2 turned the buffer-pool lecture into code. This chapter reviews the LRU-K rule with an API-level playground, plus the scheduler, page guards and the classic bugs.',
    source: 'Homework 2 handout; Lecture 4 (buffer pools)',
    sections: [
      {
        id: 'why', title: 'Why LRU-K instead of LRU',
        body: `
<p>A database is bigger than memory, and reading from disk is roughly <b>five orders of magnitude</b> slower than RAM, so the most valuable thing the buffer pool does is avoid disk reads. Everything interesting is in “pick a frame to reuse”.</p>
<p>Plain LRU fails on the <b>sequential scan</b>: a scan touches thousands of pages exactly once, each looks freshly used, and together they push out the small set of hot pages — one scan flushes the cache. LRU-K asks a better question: not “when was this page last used?” but “<b>when was it used K times ago?</b>”.</p>
<div class="callout def"><span class="ct">The LRU-K rule (K = 2 in the homework)</span><ul>
<li>The <b>backward k-distance</b> of a frame = now − (timestamp of its k-th most recent access).</li>
<li>Evict the <b>evictable</b> frame with the <b>largest</b> backward k-distance.</li>
<li>A frame with fewer than k accesses has distance <b>+∞</b> and beats every frame with a full history.</li>
<li>Several +∞ frames → evict the one whose <b>earliest recorded access is oldest</b> (plain LRU among newcomers).</li></ul></div>
<h3>The handout’s example</h3>
<p>Frames A, B, C, D; k = 2; accesses at timestamps 1–6: <code>A A B B C D</code>. It is now t = 7.</p>
<table><thead><tr><th>Frame</th><th>Accessed at</th><th>2nd most recent</th><th>Backward 2-distance</th><th>Evicted</th></tr></thead><tbody>
<tr><td>A</td><td>1, 2</td><td>t = 1</td><td>7 − 1 = 6</td><td>3rd (hot)</td></tr>
<tr><td>B</td><td>3, 4</td><td>t = 3</td><td>7 − 3 = 4</td><td>4th (hot)</td></tr>
<tr><td>C</td><td>5</td><td>—</td><td>+∞</td><td>1st (scanned once)</td></tr>
<tr><td>D</td><td>6</td><td>—</td><td>+∞</td><td>2nd (scanned once)</td></tr></tbody></table>
<p>Eviction order: <b>C, D, A, B</b>. Under plain LRU (= LRU-K with k = 1) the distances are 5, 3, 2, 1 and the order reverses to <b>A, B, C, D</b> — LRU throws away both hot pages first and keeps the scan pages that will never be read again.</p>`
      },
      {
        id: 'replacer', title: 'Task 1 — the LRUKReplacer API',
        body: `
<table><thead><tr><th>Method</th><th>Must do</th></tr></thead><tbody>
<tr><td><code>LRUKReplacer(n, k)</code></td><td>Throw <code>std::invalid_argument</code> if n or k is 0.</td></tr>
<tr><td><code>RecordAccess(f)</code></td><td>Stamp this access with the current timestamp. A frame seen for the first time starts <b>not evictable</b>. Throw if f is out of range.</td></tr>
<tr><td><code>SetEvictable(f, b)</code></td><td>Flip the flag and keep <code>Size()</code> in step. Do nothing if the frame has no history. Range-checked.</td></tr>
<tr><td><code>Evict()</code></td><td>Return the evictable frame with the largest backward k-distance and <b>forget</b> it; <code>std::nullopt</code> if nothing is evictable.</td></tr>
<tr><td><code>Remove(f)</code></td><td>Forget the frame. No-op if unknown; <b>throw</b> if it exists but is not evictable.</td></tr>
<tr><td><code>Size()</code></td><td>Number of evictable frames right now.</td></tr>
</tbody></table>
<p>Every method must be thread-safe (one <code>latch_</code>), and you never need more than the last k timestamps per frame.</p>
<div data-sim="lruKReplacer"></div>
<div class="callout exam"><span class="ct">The public test, explained</span><p>RecordAccess on 0, 1, 2, 0 (timestamps 0–3), all set evictable → Size() = 3. Frame 0 has two accesses; frames 1 and 2 have one each (+∞). Evict() → <b>1</b> (oldest +∞), then <b>2</b>, then <b>0</b>, then <code>std::nullopt</code>. A frame recorded but never made evictable gives Size() = 0, and Remove() on it throws.</p></div>`
      },
      {
        id: 'scheduler', title: 'Task 2 — the disk scheduler',
        body: `
<p>The buffer pool must not block on disk I/O while holding its latch. So I/O goes through a <b>DiskScheduler</b>: a thread-safe queue (<code>Channel</code>) of <code>DiskRequest</code>s and one background worker thread.</p>
<pre>struct DiskRequest {
  bool is_write_;                 // write or read
  char *data_;                    // PAGE_SIZE bytes, source or destination
  page_id_t page_id_;             // which page
  std::promise&lt;bool&gt; callback_;  // set to true once the transfer is done
};</pre>
<ul>
<li><code>Schedule(r)</code> puts the request on <code>request_queue_</code>. The caller keeps <code>r.callback_.get_future()</code> and waits on it.</li>
<li><code>StartWorkerThread()</code> loops: take a request, perform it with <code>ReadPage()</code>/<code>WritePage()</code>, then <code>set_value(true)</code> on its promise.</li>
<li>The destructor puts <code>std::nullopt</code> on the queue — the loop must treat it as <b>“stop” and return</b>, otherwise the program hangs on exit (a timed-out test usually means this, or a deadlock).</li>
</ul>
<div class="callout key"><span class="ct">Concept link</span><p>This is the lecture’s “disk I/O scheduling” idea in miniature: the DBMS keeps its own queue of I/O requests instead of letting callers hit the disk directly. A real system would prioritize requests (sequential vs random, foreground vs background…).</p></div>`
      },
      {
        id: 'guards', title: 'Task 3 — page guards and the buffer pool',
        body: `
${archDiag}
<h3>Page guards (RAII)</h3>
<p>A page guard is how a caller holds a page. While a guard is alive the page is <b>pinned</b> (cannot be evicted) and <b>latched</b> (read guard: shared latch; write guard: exclusive latch). The guard releases both when it is destroyed, so a caller cannot forget to unpin.</p>
<ul>
<li>Guards are <b>move-only</b>: copying would create two owners of the same pin, and one would release it too early.</li>
<li>A move must <b>empty the source</b> — otherwise both guards’ destructors unpin (double release) and the page could be evicted while someone still reads it.</li>
<li><code>Drop()</code>: unpin; if this was the last holder, make the frame evictable again; release the latch. A <b>second Drop() must be harmless</b> (idempotent), and the destructor just calls Drop().</li>
</ul>
<h3>BufferPoolManager methods</h3>
<table><thead><tr><th>Method</th><th>Must do</th></tr></thead><tbody>
<tr><td><code>NewPage()</code></td><td>Reserve and return the next page id. Nothing is read, written or pinned.</td></tr>
<tr><td><code>CheckedReadPage(p)</code></td><td>Pin p for reading (loading it from disk if needed) and return a guard; <code>std::nullopt</code> if every frame is pinned.</td></tr>
<tr><td><code>CheckedWritePage(p)</code></td><td>Same, exclusively, and the page becomes dirty.</td></tr>
<tr><td><code>DeletePage(p)</code></td><td><code>false</code> if p is pinned; otherwise remove it from the pool and return true (also true if it was never cached).</td></tr>
<tr><td><code>FlushPage(p)</code></td><td>Write p to disk and clear its dirty flag; false if not in the pool.</td></tr>
<tr><td><code>GetPinCount(p)</code></td><td>How many guards hold p, or <code>std::nullopt</code> if not cached.</td></tr>
</tbody></table>
${fetchDiag}
<div class="callout warn"><span class="ct">The three things that decided most of the grade</span><ol>
<li><b>Never hold <code>bpm_latch_</code> while you wait</b> — not while the disk scheduler runs a request and not while a guard takes a frame latch. Holding it is correct but serializes the whole pool; the 1 ms-latency benchmark measures how many misses can overlap.</li>
<li><b>Get the pin count right</b>: a leaked pin makes a frame permanently unevictable (the pool runs out of frames); a pin released twice lets a page be evicted while it is still being read.</li>
<li><b>Write dirty pages back before reusing the frame</b> — silently losing a write only shows up when the pool is small enough to force eviction.</li></ol></div>`
      }
    ],
    exercises: [
      {
        level: 'Exam-style', title: 'LRU-K replacer trace',
        q: '<p><code>LRUKReplacer(5, 2)</code>. Call RecordAccess on frames 1, 2, 3, 4, 1, 2, 3, 1 (timestamps 0–7), then SetEvictable(f, true) for f = 1..4. (a) Give each frame’s backward 2-distance at time 8. (b) In what order do repeated Evict() calls return frames? (c) Same, but call SetEvictable(2, false) before evicting.</p>',
        a: '<p>Last two timestamps: frame 1 → {4, 7}, frame 2 → {1, 5}, frame 3 → {2, 6}, frame 4 → {3}.</p><p>(a) Distances at now = 8: frame 1: 8 − 4 = <b>4</b>; frame 2: 8 − 1 = <b>7</b>; frame 3: 8 − 2 = <b>6</b>; frame 4: only one access → <b>+∞</b>.</p><p>(b) <b>4, 2, 3, 1</b>, then <code>std::nullopt</code>.</p><p>(c) Frame 2 is not evictable (Size() = 3): <b>4, 3, 1</b>, then <code>std::nullopt</code>.</p><p>Check with the playground: num_frames 5, k 2.</p>'
      },
      {
        level: 'Core', title: 'LRU vs LRU-2',
        q: '<p>Four frames hold pages A, B, C, D accessed at t = 1..6 as <code>A A B B C D</code>. A new page E arrives at t = 7 and then F at t = 8. Which pages do LRU and LRU-2 evict?</p>',
        a: '<p><b>LRU</b>: E evicts A (last used t = 2), F evicts B (t = 4) — both hot pages are gone.</p><p><b>LRU-2</b>: C and D have one access each (+∞); E evicts C (older single access), F evicts D. Hot pages A and B survive. (Try the “HW2 example” preset in the buffer-pool simulator in Lecture 4b.)</p>'
      },
      {
        level: 'Core', title: 'Pin counts',
        q: '<p>For page p in a pool: (a) two read guards are taken — GetPinCount(p)? (b) one of them is dropped? (c) a write guard is moved with <code>auto g2 = std::move(g1)</code> — GetPinCount(p)? (d) <code>g2.Drop()</code> is called twice?</p>',
        a: '<p>(a) <b>2</b>. (b) <b>1</b>. (c) <b>1, not 2</b> — a move transfers ownership; it must not take another pin, and the moved-from guard must become empty so its destructor does nothing. (d) The first Drop unpins (count 0, frame evictable again, latch released); the second is a <b>harmless no-op</b>.</p>'
      },
      {
        level: 'Core', title: 'Write-back before reuse',
        q: '<p>A 2-frame pool. You write “hello” into page 0 with a write guard and drop it, then read pages 1 and 2. Now CheckedReadPage(0). What must it return, and what must have happened in between?</p>',
        a: '<p>It must return the bytes <b>“hello”</b>. Reading pages 1 and 2 into a 2-frame pool forced page 0 out; since its frame was <b>dirty</b>, the pool had to write it to disk (through the disk scheduler, waiting on the future) <b>before</b> reusing the frame. Reading page 0 again loads the written version from disk.</p>'
      },
      {
        level: 'Concept', title: 'Why no latch across I/O?',
        q: '<p>A correct buffer pool holds <code>bpm_latch_</code> while it waits for <code>ReadPage</code>. Why does that lose most of the performance points when every disk read takes 1 ms?</p>',
        a: '<p>While one thread waits 1 ms for its miss, every other thread — including those that would <i>hit</i> in memory or miss on different pages — is blocked on the latch. Misses can’t overlap, so throughput collapses to ~1000 misses/s. Releasing the pool latch before waiting (after reserving the frame and pinning it) lets many reads be in flight at once.</p>'
      },
      {
        level: 'Concept', title: 'Scheduler shutdown',
        q: '<p>A test hangs at the very end of the program. Name two likely causes in HW2.</p>',
        a: '<p>(1) The disk scheduler’s worker loop never treats <code>std::nullopt</code> as “stop”, so the destructor’s <code>join()</code> waits forever. (2) A deadlock: e.g. taking a frame latch while still holding <code>bpm_latch_</code>, while another thread holding that frame latch is waiting for <code>bpm_latch_</code> (for example inside Drop()).</p>'
      }
    ],
    quiz: [
      { q: 'With k = 2, a frame accessed only once has backward k-distance…', o: ['0', '1', '+∞', 'equal to its last access time'], a: 2, e: 'It has no 2nd most recent access, so its distance is +∞ and it is evicted first.' },
      { q: 'Among several frames with +∞ distance, LRU-K evicts…', o: ['the most recently accessed', 'the one whose earliest recorded access is oldest', 'a random one', 'the lowest frame id'], a: 1, e: 'Plain LRU among the newcomers.' },
      { q: 'A frame seen for the first time by RecordAccess is…', o: ['evictable', 'not evictable until SetEvictable(f, true)', 'immediately evicted', 'removed'], a: 1, e: 'Frames start non-evictable (they are pinned when first accessed).' },
      { q: 'Remove(f) on a tracked but non-evictable frame…', o: ['is a no-op', 'throws std::invalid_argument', 'evicts it anyway', 'returns false'], a: 1, e: 'Unknown frames are a no-op; pinned (non-evictable) ones throw.' },
      { q: 'The disk scheduler’s worker thread stops when it…', o: ['finds the queue empty', 'receives std::nullopt', 'times out', 'processes 100 requests'], a: 1, e: 'The destructor pushes std::nullopt as a stop signal.' },
      { q: 'Why are page guards move-only?', o: ['Copying is slow', 'A copy would create two owners of one pin, releasing it twice', 'C++ forbids copying latches', 'To support SetEvictable'], a: 1, e: 'Exactly one guard must own each pin/latch.' },
      { q: 'CheckedWritePage(p) returns std::nullopt when…', o: ['p is dirty', 'every frame is pinned so nothing can be evicted', 'p was never created', 'the disk is busy'], a: 1, e: 'No free frame and no evictable frame.' },
      { q: 'DeletePage(p) returns false when…', o: ['p is not in the pool', 'p is pinned', 'p is dirty', 'never'], a: 1, e: 'A pinned page cannot be deleted; an uncached page returns true.' }
    ]
  });
})();
