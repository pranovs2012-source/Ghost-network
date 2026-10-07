#!/usr/bin/env python3
"""Build downloads/bundle-<n>.zip from the 10 template ZIPs listed in internal/bundles/bundle-<n>.md.

Usage: python3 internal/tools/make_bundle.py <n>
The bundle .md must list each ZIP filename in backticks, e.g. `login-001-aurora-glass.zip`.
"""
import re, sys, zipfile, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]

def main(n):
    md = (ROOT / "internal" / "bundles" / f"bundle-{n}.md").read_text()
    zips = list(dict.fromkeys(re.findall(r"`((?:login|game-menu)-\d{3}-[a-z0-9-]+\.zip)`", md)))
    assert len(zips) == 10, f"expected 10 template zips in bundle-{n}.md, found {len(zips)}"
    out = ROOT / "downloads" / f"bundle-{n}.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_STORED) as z:
        for name in zips:
            src = ROOT / "downloads" / name
            assert src.is_file(), f"missing {src}"
            info = zipfile.ZipInfo(f"bundle-{n}/{name}", date_time=(2026, 1, 1, 0, 0, 0))
            info.external_attr = 0o644 << 16
            z.writestr(info, src.read_bytes())
    with zipfile.ZipFile(out) as z:
        assert z.testzip() is None
        assert sorted(z.namelist()) == sorted(f"bundle-{n}/{x}" for x in zips)
        for x in zips:  # each inner zip must itself be valid
            import io
            with zipfile.ZipFile(io.BytesIO(z.read(f"bundle-{n}/{x}"))) as inner:
                assert inner.testzip() is None and len(inner.namelist()) == 5, x
    print(f"OK {out.relative_to(ROOT)}: {len(zips)} template zips")

if __name__ == "__main__":
    main(sys.argv[1])
