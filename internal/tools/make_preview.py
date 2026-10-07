#!/usr/bin/env python3
"""Generate preview.html (internal showcase page for screenshots) for one template.

Usage:
  python3 internal/tools/make_preview.py <folder> --title "Aurora Glass" --tagline "..." \
      --bg "#0b1020" --fg "#eef2ff" --accent "#7c9cff" --font "Sora" \
      --screens login,signup,forgot --features "Feature one|Feature two|..."

The page shows the template in a large desktop frame plus a phone frame for every screen.
Each frame is an <iframe> of index.html#<screen>, so the template must honour URL hashes.
"""
import argparse, html, pathlib

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family={font_q}:wght@400;600;700&amp;display=swap" rel="stylesheet">
<style>
  :root {{ --bg: {bg}; --fg: {fg}; --accent: {accent}; --muted: color-mix(in srgb, var(--fg) 65%, var(--bg)); }}
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: var(--bg); color: var(--fg); font-family: "{font}", system-ui, sans-serif; }}
  .wrap {{ max-width: 1280px; margin: 0 auto; padding: 48px 20px 72px; }}
  header {{ display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: end; justify-content: space-between; margin-bottom: 32px; }}
  .tag {{ display: inline-block; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--accent);
         border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent); padding: 6px 12px; border-radius: 999px; }}
  h1 {{ font-size: clamp(32px, 6vw, 64px); margin: 12px 0 8px; line-height: 1.05; }}
  p.lead {{ margin: 0; color: var(--muted); max-width: 56ch; font-size: 18px; }}
  ul.features {{ list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; font-size: 15px; }}
  ul.features li::before {{ content: "◆"; color: var(--accent); margin-right: 10px; font-size: 11px; }}
  .frame {{ position: relative; border-radius: 18px; overflow: hidden; background: #000;
           box-shadow: 0 30px 80px -20px rgba(0,0,0,.6), 0 0 0 1px color-mix(in srgb, var(--fg) 14%, transparent); }}
  .frame iframe {{ position: absolute; top: 0; left: 0; border: 0; transform-origin: 0 0; pointer-events: none; }}
  .desktop {{ aspect-ratio: 1440 / 900; }}
  .desktop iframe {{ width: 1440px; height: 900px; }}
  .phones {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 28px; margin-top: 40px; }}
  .phone {{ aspect-ratio: 375 / 812; border-radius: 28px; }}
  .phone iframe {{ width: 375px; height: 812px; }}
  figure {{ margin: 0; }}
  figcaption {{ margin-top: 10px; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); text-align: center; }}
</style>
</head>
<body>
<main class="wrap">
  <header>
    <div>
      <span class="tag">{category_label}</span>
      <h1>{title}</h1>
      <p class="lead">{tagline}</p>
    </div>
    <ul class="features">{features}</ul>
  </header>
  <figure>
    <div class="frame desktop"><iframe src="index.html#{first}" title="{title} desktop preview" tabindex="-1" loading="eager"></iframe></div>
    <figcaption>Desktop · 1440 × 900</figcaption>
  </figure>
  <section class="phones" aria-label="Mobile screens">{phones}
  </section>
</main>
<script>
  // Scale each fixed-size iframe to fit its frame
  function fit() {{
    document.querySelectorAll('.frame').forEach(function (f) {{
      var i = f.querySelector('iframe');
      i.style.transform = 'scale(' + (f.clientWidth / i.offsetWidth) + ')';
    }});
  }}
  window.addEventListener('resize', fit);
  fit();
</script>
</body>
</html>
"""

PHONE = """
    <figure>
      <div class="frame phone"><iframe src="index.html#{screen}" title="{label} mobile preview" tabindex="-1" loading="lazy"></iframe></div>
      <figcaption>{label}</figcaption>
    </figure>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    for a in ["title", "tagline", "bg", "fg", "accent", "font", "screens", "features"]:
        ap.add_argument(f"--{a}", required=True)
    a = ap.parse_args()
    folder = pathlib.Path(a.folder)
    category = folder.parent.name
    screens = [s.strip() for s in a.screens.split(",") if s.strip()]
    e = html.escape
    out = TEMPLATE.format(
        title=e(a.title), tagline=e(a.tagline), bg=a.bg, fg=a.fg, accent=a.accent,
        font=e(a.font), font_q=a.font.replace(" ", "+"),
        category_label="Login Template" if category == "login" else "Game Menu Template",
        features="".join(f"<li>{e(f)}</li>" for f in a.features.split("|")),
        first=screens[0],
        phones="".join(PHONE.format(screen=s, label=e(s.replace("-", " ").title())) for s in screens),
    )
    (folder / "preview.html").write_text(out)
    print(f"wrote {folder / 'preview.html'}")


if __name__ == "__main__":
    main()
