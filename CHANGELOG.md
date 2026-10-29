# Changelog

All notable changes to the content and the page are listed here, newest first.

## 2026-10-29 — Batch 9: README, links, final checks

- Added `README.md`, `tools/check_links.py` (checks every source link; needs internet) and a note about it in `CONTRIBUTING.md`.
- The About text no longer says that each batch is reviewed; it says the page is written with Claude and published by Angel I.
- Corrected the link for built-in types to the page that exists in the Python 3.15 documentation.
- Source links were confirmed to exist through search results or by fetching the pages, except where listed as not yet confirmed in the final report.

## 2026-10-29 — Batch 8: flashcards

- Added `content/flashcards.json` with 112 cards, in study-path order: one card for each of the 89 entries (question and short answer) and 23 extra cards for single facts, such as the `ddof` defaults or what `axis=0` returns. The progress buttons ("I know it", "Repeat later") save in the browser only.

## 2026-10-29 — Batch 7: common challenges

- Added 15 entries to **Common Challenges in Data Analysis** (`content/challenges.json`), each written as a question and grouped in five themes: data quality, combining data, trust in results, interpretation and communication, size and speed. Five matching modules were added to the study path.
- The selection is editorial. It draws on the dbt Labs 2026 State of Analytics Engineering report, the Stack Overflow 2025 Developer Survey and a list of common pandas errors; no source provides a ranked list of analyst challenges.

## 2026-10-29 — Batch 6: statistics and scipy

- Added 8 entries for **Statistics & scipy**: `describe`, mean vs median, standard deviation and `ddof` (pandas vs NumPy), quartiles and outliers, z-scores, correlation, what a p-value means, and a two-group t-test. Added the module "Statistics and scipy" to the study path.
- Added scipy 1.18.1 to the pinned versions (`requirements.txt`, `content/meta.json`). Every block was run on it.

## 2026-10-29 — Batch 5: NumPy

- Added 9 entries for **NumPy**: arrays, dtypes, vectorized calculation, boolean masks, `axis`, broadcasting, `NaN`, reproducible random numbers, and the link to pandas. Added the module "NumPy: arrays and calculation" to the study path (the planned NumPy module is now ready). Every block was run on NumPy 2.5.4.

## 2026-10-29 — Restructure: tools, groups, levels and a study path

- Every entry now has a `tool`, a `group`, a `level` and an `order`. The reference is grouped by tool and group, with filters for tool and level.
- Added a **Study path** (`content/path.json`): 9 modules in a suggested order, from tools and environments to the pitfalls of recent versions, with a checklist saved in the browser. 5 further modules are listed as planned (common challenges, NumPy, statistics and scipy, scikit-learn, a complete small project).
- Entries can be opened directly from the path.

## 2026-10-29 — Batch 4: visualization

- Added 12 entries in the category **Visualization** to Essentials: `plt`, Figure and Axes, line, bar, histogram, scatter, box plot, correlation heatmap, subplot grids, readable charts, choosing a chart type, saving figures, backends. The examples draw the charts with the Agg backend and print facts about the result (labels, counts, values), because the page does not display images.

## 2026-10-29 — Batch 3: pandas

- Added 17 entries in the category **pandas** to Essentials: DataFrame and Series, reading CSV, select and filter, `loc` and `iloc`, missing values, duplicates, new columns, type conversion, text columns, sorting, `groupby` (basic, multiple keys, `transform`), `merge`, `concat`, pivot tables, totals by month, copy behaviour in pandas 3. Entries with SQL equivalents are noted in the text. Every block was run on pandas 3.1.0.

## 2026-10-29 — Batch 2: essentials (environment and language basics)

- Added 18 entries to **Essentials** (`content/essentials.json`): 8 about the environment (distribution vs interpreter, pip vs conda, virtual environments, kernels, Jupyter, VS Code, ETL and Java, packages and libraries, library roles) and 10 about language basics (indentation, syntax errors, comments, bytecode, types, collections, loops, functions, exceptions). Entries with code were run on the pinned versions.
- The page title is now **Python for Data Analysis**, with a shorter description. The word "study" is no longer restricted.
- The page uses a dark theme only; the theme button was removed.
- Added a GitHub Actions check (`.github/workflows/check.yml`) that runs the code blocks and the term check on pull requests.
- The Java requirement of PySpark was checked against the official PySpark installation page (Java 17 or later in the 4.2.0 documentation).

## 2026-10-29 — Batch 1: common errors

- The page is described as an open-source study guide. The challenges section is **Common Challenges in Data Analysis** (`content/challenges.json`, added in a later batch).
- Single MIT license for code and text (`LICENSE`); added `CONTRIBUTING.md`.

- Added the dynamic page: `index.html`, `assets/app.js`, `assets/style.css`. Content is loaded from `content/*.json`.
- Added search, category filters, collapsible entries, dark mode, and a flashcard viewer (the flashcard deck is added in a later batch).
- Added 10 entries to **Common errors** (`content/errors.json`). Each code block was run on the pinned versions and its real output is stored with it.
  - `read-csv-squeeze`, `fillna-method`, `inplace-on-column`, `chained-assignment`, `text-into-numeric-column`
  - `string-dtype-not-object`, `concat-keys-ignore-index`, `merge-ignore-index`, `datetime-integer-resolution`
  - `seaborn-positional-arguments`
- Every code block was run on Python 3.13.18 and on Python 3.15.2 with the same library versions. All 10 outputs are identical.
- Pinned versions: Python 3.15.2, pandas 3.1.0, numpy 2.5.4, matplotlib 3.11.2, seaborn 0.13.2 (`requirements.txt`, `content/meta.json`).
- Added `tools/run_blocks.py` (runs every code block and compares the output) and `tools/check_terms.py` (checks for excluded terms).
