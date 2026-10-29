#!/usr/bin/env python3
"""Check that every source link used in content/*.json answers.

Needs internet access. Run from the repository root:
    python tools/check_links.py
    python tools/check_links.py --content some/other/folder

Exit code 1 if any link fails. Links that answer with a redirect are followed.
"""
import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HEADERS = {"User-Agent": "Mozilla/5.0 (link check for python-analyst-companion)"}


def urls(content_dir):
    found = {}
    for f in sorted(Path(content_dir).glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        for e in data.get("entries", []):
            for s in e.get("sources", []):
                found.setdefault(s["url"].split("#")[0], []).append(e["id"])
    return found


def check(url, timeout=20):
    """Return (ok, status text)."""
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return True, str(r.status)
        except urllib.error.HTTPError as e:
            if method == "HEAD" and e.code in (403, 405, 501):
                continue  # some servers refuse HEAD; retry with GET
            return False, "HTTP %d" % e.code
        except Exception as e:  # network error, timeout, bad certificate
            return False, type(e).__name__
    return False, "failed"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--content", default=str(ROOT / "content"))
    args = ap.parse_args()
    found = urls(args.content)
    bad = 0
    for url, ids in found.items():
        ok, status = check(url)
        print("%-4s %-10s %s" % ("ok" if ok else "FAIL", status, url))
        if not ok:
            bad += 1
            print("     used by:", ", ".join(ids))
    print("%d link(s) checked, %d failed" % (len(found), bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
