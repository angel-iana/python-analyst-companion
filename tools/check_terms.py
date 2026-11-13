#!/usr/bin/env python3
"""Fail if a publishable file contains an excluded term.

Scans index.html, assets/, content/, README.md, CHANGELOG.md and the license files.
Run from the repository root:  python tools/check_terms.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EXCLUDED = [
    r"new\s?tech",
    r"netflix",
    r"wawiwa",
    r"class\s+practice",
    r"my\s+learning",
    r"\bi\s+learn(ed|t)\b",
]

TARGETS = ["index.html", "README.md", "CHANGELOG.md", "LICENSE", "CONTRIBUTING.md", "assets", "content"]


def files():
    for t in TARGETS:
        p = ROOT / t
        if p.is_file():
            yield p
        elif p.is_dir():
            for f in sorted(p.rglob("*")):
                if f.is_file():
                    yield f


def main():
    pattern = re.compile("|".join(EXCLUDED), re.IGNORECASE)
    hits = 0
    scanned = 0
    for f in files():
        scanned += 1
        for n, line in enumerate(f.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            m = pattern.search(line)
            if m:
                hits += 1
                print("%s:%d: %r" % (f.relative_to(ROOT), n, m.group(0)))
    print("%d file(s) scanned, %d hit(s)" % (scanned, hits))
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main())
