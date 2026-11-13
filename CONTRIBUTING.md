# Contributing

Anyone can add or correct an entry. Content lives in `content/*.json`.

## Entry format
Each entry has: `id`, `tool`, `group`, `level` (1 beginner, 2 intermediate, 3 advanced), `order` (position in the study path), `category`, `title`, `body`, `code`, `output`, `tested_with`, `sources`, `added`.

An entry can also have a `visual` block shown above the code. Three types exist:

- `{"type": "trace", "code": "...", "frames": [...]}`: a step-by-step view of how variables change. Do not write the frames by hand.
- `{"type": "predict", "items": [{"expr": "7 // 2", "result": "3", "type": "int"}]}`: results are hidden until clicked.
- `{"type": "slice", "text": "PYTHON", "presets": [["1", "4"]]}`: an interactive text slicer.

Every value a visual shows is produced by real Python and checked by `tools/check_visuals.py`; generate it with the helper functions in that file (`trace_code`, `predict_item`) rather than typing it.

A new entry also needs a place in `content/path.json`: add its `id` to the `steps` of one module. The reference groups entries by `tool`, then `group`; the study path follows the module order.

- `body`: your own wording. Do not copy text, code or examples from books, courses or websites. Link the source instead.
- `code`: a complete block that runs on its own.
- `output`: the real output. Generate it with `python tools/run_blocks.py --update`, never type it by hand.
- `tested_with`: the versions you ran it on (see `content/meta.json`).
- `sources`: official documentation links where possible.
- Anything you could not verify by running: say so in `body` and mark it "to be confirmed".

## Checks before opening a pull request
1. `pip install -r requirements.txt` (Python version in `.python-version`)
2. `python tools/run_blocks.py` must pass
3. `python tools/check_visuals.py` must report 0 problems
4. `python tools/check_terms.py` must report 0 hits
5. If you added sources, `python tools/check_links.py` (needs internet) should report 0 failed links
6. Preview locally with `python -m http.server` and open the page at phone width

## Rules
- Challenges are written as questions an analyst meets in real work.
- No private, employer or course material, and no personal data.
- By contributing you agree that your contribution is released under the MIT License.
