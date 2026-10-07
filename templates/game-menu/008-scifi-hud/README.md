# Sci-Fi HUD — Game Menu Template ("AXIOM FRONT")

A holographic tactical command interface for shooters, mech, space and strategy games:
a boot sequence, a sweeping radar with a turning wireframe mech, scrolling data streams,
a perspective hex-grid floor and notched holo panels. Pure HTML, CSS and vanilla
JavaScript — no frameworks, no build step, no image files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Command (main) | `#main` | Boot sequence, live UTC clock, bracketed command menu, radar + mech, system readouts |
| In mission (demo) | `#play` | Rotating reticle with shield arc, range finder, ammo counter, mini radar, objective tracker |
| Tactical pause | `#pause` | Mission objective checklist + menu |
| Systems (settings) | `#settings` | Audio / Display / Controls tabs; segmented sliders, [ ON ] / [ OFF ] switches, HUD color, **live key rebinding** |
| Mission select | `#levels` | Mission list + briefing card with threat meter and a spinning hologram globe that pins the location |
| Pilot select | `#characters` | Roster + dossier with hex portrait and an **animated SVG radar chart** of attributes |
| Mission failed | `#gameover` | Red alert stripes, glitching title, counting debrief |
| Rankings | `#leaderboard` | Global / Squadron tabs, rank insignia chevrons, your row highlighted |
| Terminate | `#quit` | Shutdown confirmation |

Open any screen with its hash: `index.html#characters`.

## Features

- **One-color theming:** the whole HUD follows `--holo`. Players can switch Cyan / Amber / Green in Systems → Display
- **Key rebinding:** click a binding, press a key (Esc cancels). Bindings and all other settings are saved in `localStorage`
- Holo intensity, scan line and data stream toggles apply live
- Optional interface tones via the Web Audio API (no audio files)
- Keyboard: `↑` `↓` select, `Enter` confirm, `Esc` pause/back; `←` `→` browse pilots and tabs
- Accessible: labelled controls, visible focus outlines, ARIA tabs and radio group, text alternatives
  for the radar chart and threat meter, focus moves to each new screen, `prefers-reduced-motion` support
- Responsive: side-by-side layouts on desktop collapse to single columns on phones

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    navigation, boot, systems + rebinding, missions, pilots, rankings
```

## Customize colors

```css
:root {
  --holo: #4fd1ff;            /* the hologram color */
  --holo-rgb: 79, 209, 255;   /* the same color as r, g, b — keep both in sync */
  --bg: #02060d;              /* background */
  --bg-2: #061322;            /* panels */
  --warn: #ffb347;  --alert: #ff5566;  --ok: #59ffa8;
}
[data-hue="amber"] { ... }    /* extra hues offered in Systems → Display */
```

To add a hue, add a `[data-hue="name"]` block and a matching radio button in the Display tab.

## Customize fonts

Uses **Rajdhani** (display) and **Share Tech Mono** (data) from Google Fonts. Swap the
`<link>` in `index.html` and update `--font-display` / `--font-mono`.

## Customize content

At the top of `script.js`: `MISSIONS` (code, name, status `done`/`active`/`new`/`locked`,
threat 1–5, terrain, reward, globe position x/y in %, briefing text), `PILOTS` (callsign,
name, color, bio, five stats 0–100 — the radar chart adapts to any number of stats),
`RANKS` and `DEFAULT_BINDS`. The boot lines are in `BOOT`.

## Hooking up your game

Buttons use `data-goto="<screen-id>"`. Put your own logic in `onEnter(id)` / `onLeave(id)`
in `script.js`. Read the player's bindings from `settings.binds` when you set up input.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
