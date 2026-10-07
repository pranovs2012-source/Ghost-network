#!/usr/bin/env python3
"""Build and verify the buyer ZIP for one template.

Usage: python3 internal/tools/package.py templates/login/001-aurora-glass
Creates downloads/<category>-<number>-<theme>.zip containing ONLY the buyer files,
inside a top-level folder of the same name, then re-opens it to verify.
"""
import sys, zipfile, pathlib, hashlib

BUYER_FILES = ["index.html", "style.css", "script.js", "README.md", "LICENSE.txt"]
ROOT = pathlib.Path(__file__).resolve().parents[2]

def main(folder):
    src = (ROOT / folder).resolve()
    category = src.parent.name            # login | game-menu
    number, theme = src.name.split("-", 1)
    zip_name = f"{category}-{number}-{theme}"
    out = ROOT / "downloads" / f"{zip_name}.zip"
    out.parent.mkdir(exist_ok=True)

    missing = [f for f in BUYER_FILES if not (src / f).is_file()]
    if missing:
        sys.exit(f"missing buyer files: {missing}")

    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in BUYER_FILES:
            info = zipfile.ZipInfo(f"{zip_name}/{f}", date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, (src / f).read_bytes())

    # Verify: archive is readable, has exactly the buyer files, and bytes match the sources
    with zipfile.ZipFile(out) as z:
        assert z.testzip() is None, "corrupt zip member"
        names = sorted(z.namelist())
        expected = sorted(f"{zip_name}/{f}" for f in BUYER_FILES)
        assert names == expected, f"unexpected contents: {names}"
        for f in BUYER_FILES:
            a = hashlib.sha256(z.read(f"{zip_name}/{f}")).hexdigest()
            b = hashlib.sha256((src / f).read_bytes()).hexdigest()
            assert a == b, f"content mismatch for {f}"
    print(f"OK {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB): {', '.join(BUYER_FILES)}")

if __name__ == "__main__":
    main(sys.argv[1])
