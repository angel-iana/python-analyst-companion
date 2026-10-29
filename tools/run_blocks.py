#!/usr/bin/env python3
"""Run every code block in content/*.json and compare its output with the stored output.

Usage (from the repository root, inside the pinned virtual environment):
    python tools/run_blocks.py            # verify: exit code 1 if any block fails or differs
    python tools/run_blocks.py --update   # write the real output of each block into the JSON files

Each block runs in a fresh interpreter, in an empty temporary directory.
Only standard output is compared. The installed library versions must match content/meta.json.
"""
import json
import subprocess
import sys
import tempfile
from importlib import metadata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
TIMEOUT = 120


def check_versions():
    meta = json.loads((CONTENT / "meta.json").read_text(encoding="utf-8"))
    problems = []
    py = "%d.%d.%d" % sys.version_info[:3]
    if py != meta["python"]:
        problems.append("python: expected %s, found %s" % (meta["python"], py))
    for name, want in meta["libraries"].items():
        try:
            have = metadata.version(name)
        except metadata.PackageNotFoundError:
            have = "not installed"
        if have != want:
            problems.append("%s: expected %s, found %s" % (name, want, have))
    return problems


def run_code(code):
    with tempfile.TemporaryDirectory() as tmp:
        p = subprocess.run(
            [sys.executable, "-I", "-c", code],
            cwd=tmp, capture_output=True, text=True, timeout=TIMEOUT,
        )
    return p.returncode, p.stdout, p.stderr


def main():
    update = "--update" in sys.argv
    problems = check_versions()
    if problems:
        print("Environment does not match content/meta.json:")
        for p in problems:
            print("  -", p)
        return 1

    ok = failed = changed = 0
    for path in sorted(CONTENT.glob("*.json")):
        if path.name == "meta.json":
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        dirty = False
        for e in data.get("entries", []):
            code = e.get("code")
            if not code:
                continue
            rc, out, err = run_code(code)
            if rc != 0:
                failed += 1
                print("FAIL  %s/%s (exit %d)\n%s" % (path.name, e["id"], rc, err.strip()))
                continue
            if update:
                if e.get("output") != out:
                    e["output"] = out
                    dirty = True
                    changed += 1
                ok += 1
            elif out != e.get("output"):
                failed += 1
                print("DIFF  %s/%s\n--- stored\n%s--- actual\n%s" % (path.name, e["id"], e.get("output"), out))
            else:
                ok += 1
                print("ok    %s/%s" % (path.name, e["id"]))
        if update and dirty:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("\n%d ok, %d failed%s" % (ok, failed, ", %d output(s) updated" % changed if update else ""))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
