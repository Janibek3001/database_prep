# database_prep

Interactive midterm preparation for **Database Systems** (Inha University in Tashkent, Fall 2026).

Covers Lectures 1–6 and Homework 1–2:

| Chapter | Topics |
|---|---|
| L1 | Relational model, keys, data independence, relational algebra |
| L2 | Modern SQL: aggregates, GROUP BY/HAVING, window functions, nested queries, LATERAL, CTEs |
| L3 | Database storage: pages, heap files, slotted pages, tuple layout, LSM, index-organized storage, data representation |
| L4a | Storage models (NSM / DSM / PAX) and columnar compression |
| L4b | Buffer pools: page table, locks vs latches, mmap, LRU / CLOCK / LRU-K, I/O scheduling |
| L5 | Hash tables: linear probing, cuckoo, chained, extendible, linear hashing |
| L6 | B+Trees: insert/delete, composite & clustered indexes, design choices, optimizations |
| HW1 | Count-min sketch and Bloom filters |
| HW2 | LRU-K replacer, disk scheduler, page guards, buffer pool manager |

Each chapter has explanations, diagrams, interactive simulators, exam-style exercises with
solutions, and a quiz. There is also a timed **mock midterm** and a printable **cheat sheet**.

## Running it

It is a static site with no build step:

- open `index.html` in a browser, or
- serve the folder (`python3 -m http.server`) and visit `http://localhost:8000`, or
- enable GitHub Pages for this repository.

The SQL sandbox runs SQLite in the browser via [sql.js](https://github.com/sql-js/sql.js),
loaded from cdnjs, so it needs an internet connection. Everything else works offline.
Progress (quiz scores, ticked exercises) is stored in the browser's localStorage.

## Layout

```
index.html
assets/
  style.css        colours, layout, light/dark themes
  app.js           router, sidebar, progress, quizzes, exercises, SQL runner
  sims/            simulators (B+Tree, hashing, buffer pool, storage, compression, sketches)
  topics/          one file per chapter (content, exercises, quiz)
```
