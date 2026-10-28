/* ==========================================================================
   App shell: topic registry, router, sidebar, progress, exercises, quizzes,
   SQL runner. Topics and simulators register themselves on window.DBP.
   ========================================================================== */
(function () {
  'use strict';

  var DBP = window.DBP = {
    topics: [],
    sims: {},
    logic: {}
  };

  /* ---------------- Utilities ---------------- */

  DBP.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  DBP.qs = function (sel, root) { return (root || document).querySelector(sel); };
  DBP.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Build the standard widget frame and return its body element.
  DBP.widget = function (el, title, tag) {
    el.classList.add('widget');
    el.innerHTML =
      '<div class="widget-head"><div class="widget-title">' +
      (tag ? '<span class="tag">' + DBP.esc(tag) + '</span>' : '') +
      DBP.esc(title) + '</div></div><div class="widget-body"></div>';
    return el.querySelector('.widget-body');
  };

  DBP.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  var CHECK_SVG = '<svg class="nav-status" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="currentColor" opacity=".15"/><path d="M4.8 8.2l2.1 2.1 4.3-4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var DOT_SVG = '<svg class="nav-status" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor" opacity=".55"/></svg>';

  /* ---------------- Persistent progress ---------------- */

  var STORE_KEY = 'dbprep:v1';
  var state = { visited: {}, quiz: {}, ex: {} };
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      state.visited = parsed.visited || {};
      state.quiz = parsed.quiz || {};
      state.ex = parsed.ex || {};
    }
  } catch (e) { /* storage unavailable: progress lives only in memory */ }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  DBP.state = state;
  DBP.resetProgress = function () {
    state.visited = {}; state.quiz = {}; state.ex = {};
    save(); renderSidebar(); route();
  };

  function topicProgress(t) {
    var parts = 0, done = 0;
    if (t.exercises && t.exercises.length) {
      parts += t.exercises.length;
      t.exercises.forEach(function (_, i) { if (state.ex[t.id + ':' + i]) done++; });
    }
    if (t.quiz && t.quiz.length) {
      parts += t.quiz.length;
      var q = state.quiz[t.id];
      if (q) done += Math.min(q.best, t.quiz.length);
    }
    return parts ? done / parts : (state.visited[t.id] ? 1 : 0);
  }

  /* ---------------- Registry ---------------- */

  DBP.addTopic = function (t) { DBP.topics.push(t); };
  function findTopic(id) {
    for (var i = 0; i < DBP.topics.length; i++) if (DBP.topics[i].id === id) return DBP.topics[i];
    return null;
  }

  /* ---------------- Sidebar ---------------- */

  var GROUPS = ['Lectures', 'Homework', 'Practice'];

  function renderSidebar() {
    var side = document.getElementById('sidebar');
    var current = (location.hash.replace(/^#\/?/, '').split('/')[0]) || '';
    var html =
      '<a class="brand" href="#/">' +
      '<span class="brand-mark"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg></span>' +
      '<span><span class="brand-title">Database Systems</span><br><span class="brand-sub">Midterm preparation</span></span></a>';

    html += '<nav class="nav"><a href="#/" class="' + (current === '' ? 'active' : '') + '"><span class="nav-num">⌂</span><span class="nav-title">Start here</span></a></nav>';

    GROUPS.forEach(function (g) {
      var items = DBP.topics.filter(function (t) { return t.group === g; });
      if (!items.length) return;
      html += '<div class="nav-group"><div class="nav-label">' + g + '</div><nav class="nav">';
      items.forEach(function (t) {
        var p = topicProgress(t);
        var status = p >= 0.999 ? CHECK_SVG : (p > 0 ? DOT_SVG : '');
        html += '<a href="#/' + t.id + '" class="' + (t.id === current ? 'active' : '') + '">' +
          '<span class="nav-num">' + DBP.esc(t.num || '') + '</span>' +
          '<span class="nav-title">' + DBP.esc(t.navTitle || t.title) + '</span>' + status + '</a>';
      });
      html += '</nav></div>';
    });

    var all = DBP.topics.filter(function (t) { return t.group === 'Lectures' || t.group === 'Homework'; });
    var overall = all.length ? all.reduce(function (s, t) { return s + topicProgress(t); }, 0) / all.length : 0;
    var theme = currentTheme();
    html += '<div class="sidebar-foot">' +
      '<div class="theme-switch" role="group" aria-label="Colour theme">' +
      ['light', 'system', 'dark'].map(function (m) {
        return '<button type="button" data-theme-set="' + m + '" aria-pressed="' + (theme === m) + '">' + m.charAt(0).toUpperCase() + m.slice(1) + '</button>';
      }).join('') + '</div>' +
      '<div class="overall">Overall progress: <b>' + Math.round(overall * 100) + '%</b>' +
      '<div class="bar"><span style="width:' + (overall * 100).toFixed(1) + '%"></span></div></div>' +
      '</div>';

    side.innerHTML = html;
    DBP.qsa('[data-theme-set]', side).forEach(function (b) {
      b.addEventListener('click', function () { setTheme(b.getAttribute('data-theme-set')); });
    });
  }

  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  }
  function setTheme(m) {
    if (m === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', m);
    try { if (m === 'system') localStorage.removeItem('dbprep:theme'); else localStorage.setItem('dbprep:theme', m); } catch (e) {}
    renderSidebar();
  }

  /* ---------------- Rendering helpers ---------------- */

  var SQL_KW = ('SELECT FROM WHERE AND OR NOT AS ON JOIN INNER LEFT RIGHT OUTER FULL CROSS NATURAL GROUP BY HAVING ORDER ASC DESC ' +
    'LIMIT OFFSET FETCH FIRST NEXT ROWS ROW ONLY UNION INTERSECT EXCEPT ALL ANY SOME IN EXISTS DISTINCT WITH RECURSIVE ' +
    'INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE INDEX VIEW DROP ALTER ADD COLUMN PRIMARY KEY FOREIGN REFERENCES ' +
    'UNIQUE CHECK DEFAULT NULL IS LIKE BETWEEN CASE WHEN THEN ELSE END OVER PARTITION LATERAL TRUE FALSE INTEGER INT ' +
    'VARCHAR TEXT REAL FLOAT NUMERIC DECIMAL DATE TIMESTAMP CHAR BIGINT SMALLINT COUNT SUM AVG MIN MAX RANK ROW_NUMBER ' +
    'DENSE_RANK CAST COALESCE UPPER LOWER SUBSTRING SUBSTR LENGTH CONCAT NOW EXTRACT INTERVAL IF ON DUPLICATE IGNORE ' +
    'CONFLICT DO NOTHING TEMP TEMPORARY BEGIN COMMIT ROLLBACK GRANT REVOKE AUTO_INCREMENT IDENTITY SEQUENCE CASCADE').split(' ');
  var KW_SET = {};
  SQL_KW.forEach(function (k) { KW_SET[k] = true; });

  DBP.highlightSQL = function (text) {
    var out = '', last = 0;
    var re = /(--[^\n]*)|('(?:[^']|'')*')|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_][A-Za-z_0-9]*)\b/g;
    var m;
    while ((m = re.exec(text))) {
      out += DBP.esc(text.slice(last, m.index));
      if (m[1]) out += '<span class="cm">' + DBP.esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="str">' + DBP.esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="num">' + m[3] + '</span>';
      else if (KW_SET[m[4].toUpperCase()]) out += '<span class="kw">' + DBP.esc(m[4]) + '</span>';
      else out += DBP.esc(m[4]);
      last = re.lastIndex;
    }
    return out + DBP.esc(text.slice(last));
  };

  function enhance(root) {
    // SQL highlighting and inline "Run" buttons
    DBP.qsa('pre.sql', root).forEach(function (pre) {
      var src = pre.textContent.replace(/^\n+|\s+$/g, '');
      pre.innerHTML = DBP.highlightSQL(src);
      if (pre.hasAttribute('data-run')) {
        var head = document.createElement('div');
        head.className = 'code-head';
        head.innerHTML = '<span>' + DBP.esc(pre.getAttribute('data-run') || 'SQL — runs on the sample database') + '</span>';
        var btn = document.createElement('button');
        btn.className = 'btn sm primary';
        btn.type = 'button';
        btn.textContent = 'Run ▸';
        head.appendChild(btn);
        pre.parentNode.insertBefore(head, pre);
        var out = document.createElement('div');
        out.className = 'sql-result';
        pre.parentNode.insertBefore(out, pre.nextSibling);
        btn.addEventListener('click', function () {
          if (out.childNodes.length) { out.innerHTML = ''; btn.textContent = 'Run ▸'; return; }
          out.innerHTML = '<div class="sql-meta">Running…</div>';
          DBP.sql.runFresh(src).then(function (res) {
            DBP.sql.renderResult(out, res);
            btn.textContent = 'Hide';
          }, function (err) {
            out.innerHTML = '<div class="status bad">' + DBP.esc(err.message || err) + '</div>';
            btn.textContent = 'Hide';
          });
        });
      }
    });

    // Simulators
    DBP.qsa('[data-sim]', root).forEach(function (el) {
      var name = el.getAttribute('data-sim');
      var opts = {};
      try { opts = JSON.parse(el.getAttribute('data-opts') || '{}'); } catch (e) {}
      if (DBP.sims[name]) {
        try { DBP.sims[name](el, opts); }
        catch (e) { el.innerHTML = '<div class="status bad">Simulator failed to load: ' + DBP.esc(e.message) + '</div>'; console.error(e); }
      } else {
        el.innerHTML = '<div class="status warn">Missing simulator: ' + DBP.esc(name) + '</div>';
      }
    });

    // Wrap bare tables for horizontal scroll on phones
    DBP.qsa('table', root).forEach(function (t) {
      if (t.parentNode.classList && t.parentNode.classList.contains('table-wrap')) return;
      var w = document.createElement('div');
      w.className = 'table-wrap';
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    });
  }
  DBP.enhance = enhance;

  /* ---------------- Exercises ---------------- */

  function exerciseBox(ex, label, key) {
    var done = !!state.ex[key];
    return '<div class="exercise' + (done ? ' done' : '') + '" data-ex="' + key + '">' +
      '<div class="ex-head"><span class="ex-num">' + DBP.esc(label) + '</span>' +
      '<span class="ex-level">' + DBP.esc(ex.level || '') + (ex.title ? (ex.level ? ' · ' : '') + DBP.esc(ex.title) : '') + '</span></div>' +
      '<div class="ex-q">' + ex.q + '</div>' +
      (ex.hint ? '<div class="ex-hint"><b>Hint:</b> ' + ex.hint + '</div>' : '') +
      '<div class="ex-actions">' +
      (ex.hint ? '<button type="button" class="btn sm" data-act="hint">Hint</button>' : '') +
      '<button type="button" class="btn sm" data-act="sol">Show solution</button>' +
      '<label class="ex-done"><input type="checkbox" data-act="done"' + (done ? ' checked' : '') + '> I can do this</label>' +
      '</div><div class="ex-ans">' + ex.a + '</div></div>';
  }

  function renderExercises(t) {
    if (!t.exercises || !t.exercises.length) return '';
    var html = '<h2 id="exercises">Practice exercises</h2>' +
      '<p class="muted">Try each one on paper first, then open the solution. Tick “I can do this” when you could solve it without peeking — it counts toward your progress.</p>';
    t.exercises.forEach(function (ex, i) {
      html += exerciseBox(ex, (t.num || '') + '.' + (i + 1), t.id + ':' + i);
    });
    return html;
  }

  // items: [{ topic, idx }] — used by the practice pages
  DBP.renderExerciseList = function (container, items) {
    container.innerHTML = items.map(function (it) {
      return exerciseBox(it.topic.exercises[it.idx], (it.topic.num || '') + '.' + (it.idx + 1), it.topic.id + ':' + it.idx);
    }).join('');
    enhance(container);
    wireExercises(container);
  };

  function wireExercises(root) {
    DBP.qsa('.exercise', root).forEach(function (box) {
      var key = box.getAttribute('data-ex');
      box.addEventListener('click', function (e) {
        var act = e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'sol') {
          var ans = box.querySelector('.ex-ans');
          var open = ans.classList.toggle('open');
          e.target.textContent = open ? 'Hide solution' : 'Show solution';
          if (open && !ans.getAttribute('data-enhanced')) { ans.setAttribute('data-enhanced', '1'); enhance(ans); }
        } else if (act === 'hint') {
          box.querySelector('.ex-hint').classList.toggle('open');
        }
      });
      var cb = box.querySelector('input[data-act="done"]');
      if (cb && key) cb.addEventListener('change', function () {
        if (cb.checked) state.ex[key] = 1; else delete state.ex[key];
        box.classList.toggle('done', cb.checked);
        save(); renderSidebar();
      });
    });
  }

  /* ---------------- Quiz ---------------- */

  var LETTERS = 'ABCDEFGH';

  // mode: 'instant' (feedback per click) or 'exam' (answer everything, then submit)
  DBP.renderQuiz = function (container, questions, opts) {
    var original = questions;
    opts = opts || {};
    var mode = opts.mode || 'instant';
    // Shuffle answer options so the correct one isn't always in the same position.
    questions = questions.map(function (q) {
      var perm = DBP.shuffle(q.o.map(function (_, i) { return i; }));
      var c = Object.assign({}, q);
      c.o = perm.map(function (i) { return q.o[i]; });
      c.a = perm.indexOf(q.a);
      return c;
    });
    var answers = new Array(questions.length);
    var html = '<div class="quiz">';
    questions.forEach(function (q, i) {
      html += '<div class="q" data-q="' + i + '">' +
        (opts.showTopic && q._topic ? '<div class="q-tag">' + DBP.esc(q._topic) + '</div>' : '') +
        '<div class="q-text"><span class="qn">' + (i + 1) + '.</span>' + q.q + '</div><div class="opts">';
      q.o.forEach(function (o, j) {
        html += '<button type="button" class="opt" data-o="' + j + '"><span class="ol">' + LETTERS[j] + '</span><span>' + o + '</span></button>';
      });
      html += '</div><div class="q-exp">' + (q.e || '') + '</div></div>';
    });
    html += '</div><div class="quiz-foot"></div>';
    container.innerHTML = html;
    var foot = container.querySelector('.quiz-foot');

    function reveal(qEl, i) {
      var q = questions[i];
      qEl.classList.add('answered');
      DBP.qsa('.opt', qEl).forEach(function (b, j) {
        b.disabled = true;
        b.classList.remove('on');
        if (j === q.a) b.classList.add('correct');
        else if (j === answers[i]) b.classList.add('wrong');
      });
      var exp = qEl.querySelector('.q-exp');
      exp.innerHTML = (answers[i] === q.a ? '<b style="color:var(--good)">Correct.</b> ' : (answers[i] == null ? '<b>Not answered.</b> ' : '<b style="color:var(--bad)">Not quite.</b> ')) +
        'Answer: <b>' + LETTERS[q.a] + '</b>. ' + (q.e || '');
      enhance(exp);
    }

    function score() {
      var s = 0;
      questions.forEach(function (q, i) { if (answers[i] === q.a) s++; });
      return s;
    }

    function finish() {
      var s = score();
      foot.innerHTML = '<div class="quiz-score"><span>Score: <b>' + s + ' / ' + questions.length + '</b> (' +
        Math.round(100 * s / questions.length) + '%)</span><button type="button" class="btn sm" data-retry>Try again</button></div>';
      if (opts.breakdown) foot.innerHTML += opts.breakdown(questions, answers);
      foot.querySelector('[data-retry]').addEventListener('click', function () {
        if (opts.onRetry) opts.onRetry(); else DBP.renderQuiz(container, original, opts);
      });
      if (opts.onDone) opts.onDone(s, questions.length);
    }

    DBP.qsa('.q', container).forEach(function (qEl) {
      var i = +qEl.getAttribute('data-q');
      qEl.addEventListener('click', function (e) {
        var b = e.target.closest('.opt');
        if (!b || b.disabled) return;
        answers[i] = +b.getAttribute('data-o');
        if (mode === 'instant') {
          reveal(qEl, i);
          var answered = answers.filter(function (a) { return a != null; }).length;
          if (answered === questions.length) finish();
          else foot.innerHTML = '<p class="muted small">' + answered + ' of ' + questions.length + ' answered.</p>';
        } else {
          DBP.qsa('.opt', qEl).forEach(function (x) { x.style.borderColor = x === b ? 'var(--accent)' : ''; x.style.background = x === b ? 'var(--accent-soft)' : ''; });
          var n = answers.filter(function (a) { return a != null; }).length;
          foot.querySelector('.cnt').textContent = n + ' of ' + questions.length + ' answered';
        }
      });
    });

    if (mode === 'exam') {
      foot.innerHTML = '<div class="quiz-score"><span class="cnt">0 of ' + questions.length + ' answered</span><button type="button" class="btn primary" data-submit>Submit exam</button></div>';
      foot.querySelector('[data-submit]').addEventListener('click', function () {
        DBP.qsa('.q', container).forEach(function (qEl) {
          var i = +qEl.getAttribute('data-q');
          DBP.qsa('.opt', qEl).forEach(function (x) { x.style.borderColor = ''; x.style.background = ''; });
          reveal(qEl, i);
        });
        finish();
        foot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
    enhance(container);
  };

  function renderTopicQuiz(t, root) {
    var box = root.querySelector('#quiz-box');
    if (!box) return;
    DBP.renderQuiz(box, t.quiz, {
      onDone: function (s) {
        var prev = state.quiz[t.id];
        if (!prev || s > prev.best) state.quiz[t.id] = { best: s, total: t.quiz.length };
        save(); renderSidebar();
      }
    });
  }

  /* ---------------- Pages ---------------- */

  function renderHome(page) {
    var lectures = DBP.topics.filter(function (t) { return t.group === 'Lectures'; });
    var hw = DBP.topics.filter(function (t) { return t.group === 'Homework'; });
    var practice = DBP.topics.filter(function (t) { return t.group === 'Practice'; });
    function cards(list) {
      return '<div class="topic-cards">' + list.map(function (t) {
        var p = Math.round(topicProgress(t) * 100);
        return '<a class="topic-card" href="#/' + t.id + '"><div class="n">' + DBP.esc(t.num || '') + '</div>' +
          '<div class="t">' + DBP.esc(t.title) + '</div><div class="d">' + DBP.esc(t.summary || '') + '</div>' +
          (t.group !== 'Practice' ? '<div class="p">' + p + '% complete</div><div class="bar"><span style="width:' + p + '%"></span></div>' : '') +
          '</a>';
      }).join('') + '</div>';
    }
    page.innerHTML =
      '<div class="hero"><div class="page-head"><div class="eyebrow">Inha University in Tashkent · Database Systems · Fall 2026</div></div>' +
      '<h1>Midterm preparation</h1>' +
      '<p class="lead">Everything from Lectures 1–6 and Homework 1–2, rebuilt as an interactive study guide: short explanations, diagrams, simulators you can poke at, worked exercises and self-check quizzes.</p></div>' +
      '<h3>How to use this site</h3><ol class="howto">' +
      '<li><span><b>Read a chapter</b> in order. Each one starts with the big picture, then goes concept by concept, with a diagram wherever a picture helps.</span></li>' +
      '<li><span><b>Play with the simulators.</b> Hash tables, B+Trees, buffer pools and storage layouts are much easier to remember once you have stepped through them yourself.</span></li>' +
      '<li><span><b>Do the exercises on paper</b> before opening the solution. These are written in the style of exam questions (trace an algorithm, compute a value, explain a trade-off).</span></li>' +
      '<li><span><b>Take the quiz</b> at the end of each chapter, then the <a href="#/mock">mock midterm</a>. Use the <a href="#/cheatsheet">cheat sheet</a> for the final review the night before.</span></li>' +
      '</ol>' +
      '<div class="callout exam"><span class="ct">Midterm scope</span><p>Lecture 3’s architecture slide marks query execution as “after mid-term”, so this guide covers everything before it: relational model &amp; algebra, modern SQL, database storage, storage models &amp; compression, buffer pools, hash tables and B+Trees — plus the two homework topics (count-min sketch and the LRU-K buffer pool manager).</p></div>' +
      '<h2 style="border:0;margin-top:1.4em">Lectures</h2>' + cards(lectures) +
      '<h3>Homework topics</h3>' + cards(hw) +
      '<h3>Final practice</h3>' + cards(practice) +
      '<p class="muted small" style="margin-top:2.5em">Progress is saved in this browser only. <button type="button" class="btn sm ghost" id="resetProgress">Reset progress</button></p>';
    var r = page.querySelector('#resetProgress');
    r.addEventListener('click', function () {
      if (confirm('Clear all saved quiz scores and exercise ticks?')) DBP.resetProgress();
    });
  }

  function renderTopic(page, t, sectionId) {
    state.visited[t.id] = 1; save();
    if (t.render) { t.render(page); appendPager(page, t); return; }

    var html = '<div class="page-head"><div class="eyebrow">' + DBP.esc((t.num ? t.num + ' · ' : '') + (t.group === 'Lectures' ? 'Lecture' : t.group)) + '</div>' +
      '<h1>' + DBP.esc(t.title) + '</h1>' +
      (t.lead ? '<p class="lead">' + t.lead + '</p>' : '') +
      (t.source ? '<div class="source">Source: ' + t.source + '</div>' : '') + '</div>';

    var tocItems = t.sections.map(function (s) { return '<li><a href="#/' + t.id + '/' + s.id + '">' + s.title + '</a></li>'; });
    if (t.exercises && t.exercises.length) tocItems.push('<li><a href="#/' + t.id + '/exercises">Practice exercises</a></li>');
    if (t.quiz && t.quiz.length) tocItems.push('<li><a href="#/' + t.id + '/quiz">Quick-check quiz</a></li>');
    html += '<div class="toc"><div class="toc-title">In this chapter</div><ol>' + tocItems.join('') + '</ol></div>';

    t.sections.forEach(function (s) {
      html += '<section><h2 id="' + s.id + '">' + s.title + '</h2>' + s.body + '</section>';
    });
    html += renderExercises(t);
    if (t.quiz && t.quiz.length) {
      var best = state.quiz[t.id];
      html += '<h2 id="quiz">Quick-check quiz</h2><p class="muted">' + t.quiz.length +
        ' questions. Click an answer to see whether it is right and why.' +
        (best ? ' Your best score so far: <b>' + best.best + ' / ' + best.total + '</b>.' : '') + '</p><div id="quiz-box"></div>';
    }
    page.innerHTML = html;
    enhance(page);
    wireExercises(page);
    renderTopicQuiz(t, page);
    appendPager(page, t);

    if (sectionId) {
      var target = document.getElementById(sectionId);
      if (target) setTimeout(function () { target.scrollIntoView(); }, 0);
    }
  }

  function appendPager(page, t) {
    var idx = DBP.topics.indexOf(t);
    var prev = DBP.topics[idx - 1], next = DBP.topics[idx + 1];
    var div = document.createElement('div');
    div.className = 'pager';
    div.innerHTML =
      (prev ? '<a href="#/' + prev.id + '"><div class="d">← Previous</div>' + DBP.esc(prev.title) + '</a>' : '<span></span>') +
      (next ? '<a class="next" href="#/' + next.id + '"><div class="d">Next →</div>' + DBP.esc(next.title) + '</a>' : '<span></span>');
    page.appendChild(div);
  }

  /* ---------------- Router ---------------- */

  var lastTopic = null;
  function route() {
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    var id = parts[0], sec = parts[1];
    var page = document.getElementById('page');
    var t = id ? findTopic(id) : null;
    document.body.classList.remove('nav-open');

    // Same topic, just a section jump: scroll without re-rendering.
    if (t && t === lastTopic && sec) {
      var el = document.getElementById(sec);
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    lastTopic = t;
    if (t) {
      renderTopic(page, t, sec);
      document.title = t.title + ' — DB Midterm Prep';
      document.getElementById('topTitle').textContent = (t.num ? t.num + ' · ' : '') + t.title;
    } else {
      renderHome(page);
      document.title = 'Database Systems — Midterm Prep';
      document.getElementById('topTitle').textContent = 'Database Systems';
    }
    if (!sec) window.scrollTo(0, 0);
    renderSidebar();
  }

  DBP.start = function () {
    renderSidebar();
    route();
    window.addEventListener('hashchange', route);
    document.getElementById('menuBtn').addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('nav-open') && !e.target.closest('.sidebar') && !e.target.closest('#menuBtn')) {
        document.body.classList.remove('nav-open');
      }
    });
  };

  /* ---------------- SQL (sql.js / SQLite in the browser) ---------------- */

  var SEED = [
    'CREATE TABLE student (sid INTEGER PRIMARY KEY, name TEXT, login TEXT, age INTEGER, gpa REAL);',
    'CREATE TABLE course (cid TEXT PRIMARY KEY, name TEXT);',
    'CREATE TABLE enrolled (sid INTEGER REFERENCES student(sid), cid TEXT REFERENCES course(cid), grade TEXT, PRIMARY KEY (sid, cid));',
    "INSERT INTO student VALUES (53666,'RZA','rza@cs',55,4.0),(53688,'Bieber','jbieber@cs',27,3.9),(53655,'Tupac','shakur@cs',25,3.5)," +
    "(53677,'Kendrick','kdot@cs',37,3.8),(53699,'Adele','adele@music',36,3.6),(53611,'Drake','drake@ece',38,3.1)," +
    "(53622,'Rihanna','rihanna@ece',36,3.3),(53633,'Eminem','slim@cs',52,2.9),(53705,'Lizzo','lizzo@music',34,3.7);",
    "INSERT INTO course VALUES ('15-445','Database Systems'),('15-721','Advanced Database Systems'),('15-826','Data Mining')," +
    "('15-799','Special Topics in Databases'),('18-213','Intro to Computer Systems');",
    "INSERT INTO enrolled VALUES (53666,'15-445','C'),(53688,'15-721','A'),(53688,'15-826','B'),(53655,'15-445','B')," +
    "(53666,'15-721','C'),(53677,'15-445','A'),(53677,'15-721','B'),(53699,'15-826','A'),(53611,'15-445','B')," +
    "(53622,'18-213','A'),(53633,'15-445','D'),(53611,'18-213','C');"
  ].join('\n');

  var sqlReady = null;
  function loadSQL() {
    if (sqlReady) return sqlReady;
    sqlReady = new Promise(function (resolve, reject) {
      var tries = 0;
      (function wait() {
        if (typeof window.initSqlJs === 'function') {
          window.initSqlJs({ locateFile: function (f) { return 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + f; } })
            .then(resolve, function (e) { sqlReady = null; reject(e); });
        } else if (tries++ < 100) {
          setTimeout(wait, 100);
        } else {
          sqlReady = null;
          reject(new Error('Could not load the SQL engine (sql.js). It is downloaded from cdnjs.cloudflare.com — check your internet connection, then try again.'));
        }
      })();
    });
    return sqlReady;
  }

  DBP.sql = {
    seed: SEED,
    newDB: function () {
      return loadSQL().then(function (SQL) {
        var db = new SQL.Database();
        db.run(SEED);
        return db;
      });
    },
    exec: function (db, query) {
      var res = db.exec(query);
      return res.length ? res[res.length - 1] : null;
    },
    runFresh: function (query) {
      return DBP.sql.newDB().then(function (db) {
        try { return DBP.sql.exec(db, query); } finally { db.close(); }
      });
    },
    renderResult: function (out, res) {
      if (!res) { out.innerHTML = '<div class="status good">Statement executed. (No rows returned.)</div>'; return; }
      var h = '<div class="table-wrap"><table><thead><tr>' + res.columns.map(function (c) { return '<th>' + DBP.esc(c) + '</th>'; }).join('') +
        '</tr></thead><tbody>' + res.values.map(function (r) {
          return '<tr>' + r.map(function (v) { return '<td>' + (v === null ? '<span class="muted">NULL</span>' : DBP.esc(typeof v === 'number' && !Number.isInteger(v) ? +v.toFixed(4) : v)) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div><div class="sql-meta">' + res.values.length + ' row' + (res.values.length === 1 ? '' : 's') + '</div>';
      out.innerHTML = h;
    }
  };

  // Interactive sandbox: <div data-sim="sqlSandbox" data-opts='{"query":"..."}'>
  DBP.sims.sqlSandbox = function (el, opts) {
    var body = DBP.widget(el, opts.title || 'SQL sandbox', 'SQLite');
    body.innerHTML =
      '<div class="schema-chips">' +
      '<span class="schema-chip"><b>student</b>(sid, name, login, age, gpa)</span>' +
      '<span class="schema-chip"><b>course</b>(cid, name)</span>' +
      '<span class="schema-chip"><b>enrolled</b>(sid, cid, grade)</span></div>' +
      '<textarea class="sql-editor" spellcheck="false" aria-label="SQL query"></textarea>' +
      '<div class="controls" style="margin:10px 0 0">' +
      '<button type="button" class="btn primary" data-run>Run ▸</button>' +
      '<button type="button" class="btn" data-reset>Reset database</button>' +
      '<span class="muted small">Ctrl/⌘ + Enter runs the query. Changes (INSERT, CREATE …) persist until you reset.</span></div>' +
      '<div class="sql-result"></div>';
    var ta = body.querySelector('textarea');
    var out = body.querySelector('.sql-result');
    ta.value = opts.query || 'SELECT * FROM student;';
    var db = null;
    function ensure() { return db ? Promise.resolve(db) : DBP.sql.newDB().then(function (d) { db = d; return d; }); }
    function run() {
      out.innerHTML = '<div class="sql-meta">Running…</div>';
      ensure().then(function (d) {
        try { DBP.sql.renderResult(out, DBP.sql.exec(d, ta.value)); }
        catch (e) { out.innerHTML = '<div class="status bad">' + DBP.esc(e.message) + '</div>'; }
      }, function (e) { out.innerHTML = '<div class="status bad">' + DBP.esc(e.message || e) + '</div>'; });
    }
    body.querySelector('[data-run]').addEventListener('click', run);
    body.querySelector('[data-reset]').addEventListener('click', function () {
      if (db) { db.close(); db = null; }
      out.innerHTML = '<div class="status info">Database reset to the original sample data.</div>';
    });
    ta.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    });
    // Let other parts of the page load a query into this sandbox.
    el._load = function (q) { ta.value = q; run(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  };

  // Auto-checked SQL exercise: <div data-sim="sqlCheck" data-opts='{"solution":"...","ordered":false}'>
  DBP.sims.sqlCheck = function (el, opts) {
    el.innerHTML =
      '<textarea class="sql-editor" spellcheck="false" style="min-height:90px" aria-label="Your SQL answer" placeholder="Write your query here…"></textarea>' +
      '<div class="controls" style="margin:8px 0 0"><button type="button" class="btn primary sm" data-check>Check my query</button>' +
      '<button type="button" class="btn sm" data-expected>Show expected output</button></div><div class="sql-result"></div>';
    var ta = el.querySelector('textarea');
    var out = el.querySelector('.sql-result');
    ta.value = opts.start || '';
    function canon(res, ordered) {
      if (!res) return [];
      var rows = res.values.map(function (r) {
        return JSON.stringify(r.map(function (v) { return typeof v === 'number' ? +v.toFixed(4) : v; }));
      });
      return ordered ? rows : rows.sort();
    }
    el.querySelector('[data-check]').addEventListener('click', function () {
      out.innerHTML = '<div class="sql-meta">Checking…</div>';
      DBP.sql.newDB().then(function (db) {
        var mine, want;
        try {
          want = DBP.sql.exec(db, opts.solution);
          db.close();
        } catch (e) { out.innerHTML = '<div class="status bad">Internal error: ' + DBP.esc(e.message) + '</div>'; return; }
        DBP.sql.newDB().then(function (db2) {
          try { mine = DBP.sql.exec(db2, ta.value); }
          catch (e) { out.innerHTML = '<div class="status bad">SQL error: ' + DBP.esc(e.message) + '</div>'; db2.close(); return; }
          db2.close();
          var a = canon(mine, opts.ordered), b = canon(want, opts.ordered);
          var sameCols = mine && want && mine.columns.length === want.columns.length;
          var ok = sameCols && a.length === b.length && a.every(function (x, i) { return x === b[i]; });
          var div = document.createElement('div');
          DBP.sql.renderResult(div, mine);
          out.innerHTML = (ok
            ? '<div class="status good">Correct — your result matches the expected output' + (opts.ordered ? ' (including row order)' : '') + '.</div>'
            : '<div class="status bad">Not yet. ' + (!mine ? 'Your query returned no result set.' : !sameCols ? 'Expected ' + want.columns.length + ' column(s), got ' + mine.columns.length + '.' : 'Expected ' + b.length + ' row(s), got ' + a.length + (a.length === b.length ? ' — but the values' + (opts.ordered ? ' or their order' : '') + ' differ.' : '.')) + '</div>') +
            '<div class="sql-meta">Your output:</div>' + div.innerHTML;
        });
      }, function (e) { out.innerHTML = '<div class="status bad">' + DBP.esc(e.message || e) + '</div>'; });
    });
    el.querySelector('[data-expected]').addEventListener('click', function () {
      DBP.sql.runFresh(opts.solution).then(function (res) {
        var div = document.createElement('div');
        DBP.sql.renderResult(div, res);
        out.innerHTML = '<div class="sql-meta">Expected output:</div>' + div.innerHTML;
      }, function (e) { out.innerHTML = '<div class="status bad">' + DBP.esc(e.message || e) + '</div>'; });
    });
  };
})();
