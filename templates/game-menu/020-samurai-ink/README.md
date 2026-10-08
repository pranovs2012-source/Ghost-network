# Samurai Ink — Game Menu Template ("INKBLADE")

A calm, ink-wash (sumi-e) menu kit for action, adventure and story games: rice paper, misty
ink mountains, a red sun, swaying bamboo and drifting petals. Menu items are revealed by a
**brush stroke** that sweeps behind them, and panels are hanging scrolls with wooden rods.
Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step, no image or audio files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Main menu | `#main` | Large serif title with a red brush underline, seal stamp, vertical caption, brush-sweep buttons |
| Duel (demo) | `#play` | Swaying lanterns, ink warrior, sword-slash stroke, brush vitality bar, spirit seals, honor score |
| Meditation (pause) | `#pause` | An ensō circle painted stroke by stroke |
| Dojo (settings) | `#settings` | Tabs, seal-knob sliders, ink switches, difficulty — saved locally |
| The Path (levels) | `#levels` | Horizontal hand scroll with a winding road through 8 stages across four seasons; seals earned; locked stages |
| Warriors (characters) | `#characters` | 4 original ink-drawn warriors (hat + weapon combinations) with brush-stroke stat bars |
| Defeated (game over) | `#gameover` | Broken ensō with a red ink splash; counting stats |
| Scroll of Honor (leaderboard) | `#leaderboard` | Ranked table with red seal stamps for the top three, two ranking tabs |
| Leave the dojo? | `#quit` | Confirmation |

Open any screen directly with its hash, e.g. `index.html#levels`.

## Features

- Organic "inky" edges with an SVG turbulence filter (no images)
- Adjustable petals, ink strength, red sun and drifting mist
- Optional **koto plucks** on hover, synthesized with the Karplus–Strong algorithm in the Web Audio API
- The chosen warrior is remembered and appears in the duel
- Keyboard: `↑` `↓` move through menus, `Enter` selects, `Esc` pauses / goes back,
  arrow keys move between stages and warriors
- Accessible: labelled controls, ARIA tabs and radio groups, screen-reader text for locked stages
  and seals, visible focus, `prefers-reduced-motion` support
- Responsive from small phones to desktop (the stage scroll pans horizontally on narrow screens)

## Files

```
index.html   all screens + the shared SVG ink filters
style.css    all styles — theme variables at the top
script.js    brush strokes, warriors, petals, koto, navigation, settings, path, rankings
```

## Customize colors

```css
:root {
  --paper: #f3ecdf;  --paper-2: #e7dcc7;  --paper-3: #d8c9ad;
  --ink: #1b1a17;    --ink-2: #3a3833;    --wash: #6f6a60;
  --seal: #b8332a;   --petal: #e9a7ae;    --rod: #3b2a1d;
}
```

## Customize fonts

Uses **Shippori Mincho** (titles) and **Zen Kaku Gothic New** (text) from Google Fonts. Swap the
`<link>` in `index.html` and update `--font-display` / `--font-body`.

## Customize content

At the top of `script.js`:
- `STAGES` — name, season, seals earned (`0–3`, `null` = locked), description
- `WARRIORS` — name, school, description, `look` (`hat`: `kasa` / `topknot` / `hood` / `mask`,
  `weapon`: `katana` / `staff` / `twin` / `spear`) and stats (0–100)
- `BOARD` — leaderboard rows `[name, school, value]`
- `KOTO_NOTES` — frequencies used for the plucks

## Hooking up your game

Buttons use `data-goto="<screen-id>"`. Start/stop your game in `onEnter(id)` / `onLeave(id)`.
Settings (including `warrior`) are stored as JSON in `localStorage` under `inkblade-settings`.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
