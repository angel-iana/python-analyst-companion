#!/usr/bin/env python3
"""Check the interactive visuals in content/*.json against real Python.

Usage (from the repository root, inside the pinned virtual environment):
    python tools/check_visuals.py

What is checked:
  trace    the stored frames (line about to run, variables, printed text) are rebuilt by
           running the code, and must be identical to what is stored.
  predict  every expression is evaluated; the stored result and type must match.
  slice    the text must exist; presets must be written as strings.

The page itself never runs Python: all values shown by a visual were produced here.
"""
import contextlib
import io
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"


def trace_code(code):
    """Run module-level code and record, before every line, the variables and the output so far."""
    frames = []
    buf = io.StringIO()
    env = {"__name__": "__main__"}

    def snapshot():
        return {
            k: [repr(v), type(v).__name__]
            for k, v in env.items()
            if not k.startswith("__")
        }

    def local_trace(frame, event, arg):
        if event == "line":
            frames.append({"line": frame.f_lineno, "vars": snapshot(), "out": buf.getvalue()})
        return local_trace

    def global_trace(frame, event, arg):
        if frame.f_code.co_filename == "<trace>" and frame.f_code.co_name == "<module>":
            return local_trace
        return None

    compiled = compile(code, "<trace>", "exec")
    with contextlib.redirect_stdout(buf):
        sys.settrace(global_trace)
        try:
            exec(compiled, env)
        finally:
            sys.settrace(None)
    frames.append({"line": None, "vars": snapshot(), "out": buf.getvalue()})
    return frames


def predict_item(expr):
    """Return (result text, type text) for an expression, or the exception name for an error."""
    try:
        value = eval(expr, {"__builtins__": __builtins__}, {})
    except Exception as exc:  # the lesson may be that this raises
        return type(exc).__name__, "error"
    return repr(value), type(value).__name__


def main():
    problems = checked = 0
    for path in sorted(CONTENT.glob("*.json")):
        if path.name == "meta.json":
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for e in data.get("entries", []):
            v = e.get("visual")
            if not v:
                continue
            checked += 1
            tag = "%s/%s" % (path.name, e["id"])
            kind = v.get("type")
            if kind == "trace":
                want = trace_code(v["code"])
                if want != v["frames"]:
                    problems += 1
                    print("DIFF  %s: stored frames differ from the real run" % tag)
                else:
                    print("ok    %s (trace, %d frames)" % (tag, len(want)))
            elif kind == "predict":
                bad = [it["expr"] for it in v["items"] if (it["result"], it["type"]) != predict_item(it["expr"])]
                if bad:
                    problems += 1
                    print("DIFF  %s: %s" % (tag, ", ".join(bad)))
                else:
                    print("ok    %s (predict, %d items)" % (tag, len(v["items"])))
            elif kind == "slice":
                if not v.get("text") or not all(all(isinstance(x, str) for x in p) for p in v.get("presets", [])):
                    problems += 1
                    print("FAIL  %s: slice needs text and presets written as strings" % tag)
                else:
                    print("ok    %s (slice)" % tag)
            else:
                problems += 1
                print("FAIL  %s: unknown visual type %r" % (tag, kind))
    print("\n%d visuals checked, %d problems" % (checked, problems))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
