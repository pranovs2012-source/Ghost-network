#!/usr/bin/env python3
"""Finish a template: build its buyer ZIP, add the catalog row, commit and push.

Usage:
  python3 internal/tools/finish.py templates/<category>/<nnn-theme> "<Theme Name>" "<one-line selling description>" "<backlog label to remove>"

Run only after internal/tools/qa/check.js passes for the folder.
"""
import pathlib, re, subprocess, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[2]
BRANCH = "ccr-b2a60efe-sk85z1"
TRAILER = ("\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n"
           "Claude-Session: https://claude.ai/code/session_01VtkfiNd9SmSLUTSPS9Xz5G")


def run(*cmd, check=True):
    return subprocess.run(cmd, cwd=ROOT, check=check, capture_output=True, text=True)


def main(folder, theme, line, backlog_label=""):
    src = (ROOT / folder).resolve()
    category = src.parent.name
    number, slug = src.name.split("-", 1)
    zip_name = f"{category}-{number}-{slug}.zip"

    print(run("python3", "internal/tools/package.py", folder).stdout.strip())

    catalog = ROOT / "internal" / "CATALOG.md"
    lines = catalog.read_text().split("\n")
    if any(l.startswith(f"| {number} |") for l in lines):
        sys.exit(f"catalog already has #{number}")
    last = max(i for i, l in enumerate(lines) if re.match(r"^\| \d{3} \|", l))
    lines.insert(last + 1, f"| {number} | {category} | {theme} | `templates/{category}/{src.name}/` | `{zip_name}` | {line} |")
    text = "\n".join(lines)
    marker = "## Themes used (never repeat)\n\n"
    head, rest = text.split(marker, 1)
    used, tail = rest.split("\n", 1)
    text = head + marker + used + f", {slug}" + "\n" + tail
    if backlog_label:
        # Only touch the backlog section, never the "Themes used" line.
        bmark = "## Theme backlog"
        before, backlog = text.split(bmark, 1)
        for sep in (f", {backlog_label}", f": {backlog_label}, ", f"{backlog_label}, "):
            if sep in backlog:
                backlog = backlog.replace(sep, ": " if sep.startswith(":") else "", 1)
                break
        text = before + bmark + backlog
    catalog.write_text(text)

    run("git", "add", "-A", "templates", "internal", "downloads")
    label = "login" if category == "login" else "game-menu"
    run("git", "commit", "-q", "-m", f"Add {label} #{number}: {theme}{TRAILER}")
    for delay in (2, 4, 8, 16, 32):
        run("git", "push", "-q", "-u", "origin", BRANCH, check=False)
        run("git", "fetch", "-q", "origin", BRANCH, check=False)
        if not run("git", "log", "--oneline", f"origin/{BRANCH}..HEAD").stdout.strip():
            print(f"pushed: Add {label} #{number}: {theme}")
            return
        time.sleep(delay)
    sys.exit("push failed after retries — commit is local, retry later")


if __name__ == "__main__":
    main(*sys.argv[1:])
