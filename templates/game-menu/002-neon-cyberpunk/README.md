# Neon Cyberpunk — Game Menu Template ("NEON//DRIFT")

A complete, rain-soaked neon city menu system for action, racing or runner games:
glitching title, angled HUD buttons, a pure-CSS skyline with flickering windows,
neon rain and CRT scanlines. Pure HTML, CSS and vanilla JavaScript — no frameworks,
no build step, no image files. Open `index.html` in any modern browser.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Main menu | `#main` | Glitch logo, 6 numbered menu items with meta text, status bar with key hints |
| In-game (demo) | `#play` | Live score counter, integrity bar, animated road, pause button |
| Pause | `#pause` | Run stats, resume / restart / settings / quit to menu |
| Settings | `#settings` | Tabs (Audio, Video, Gameplay): sliders, switches, select, difficulty selector — saved in `localStorage` |
| Level select | `#levels` | 12 sectors with star ratings, locked levels, selection state, star total |
| Character select | `#characters` | 4 original runners drawn in SVG, stat bars, arrows / keyboard / swipe / dots |
| Game over | `#gameover` | Animated score count-up, rank badge, retry / leaderboard / menu |
| Leaderboard | `#leaderboard` | Global / Weekly / Friends tabs, top-3 colors, your row highlighted |
| Quit confirm | `#quit` | Confirmation dialog |

Link straight to any screen with its hash, e.g. `index.html#settings`.

## Controls

- **Mouse / touch:** click any button; swipe the character card on phones.
- **Keyboard:** `↑` `↓` move through menu items, `Enter` selects, `Esc` pauses in game,
  resumes from pause, or goes back from any other screen. `←` `→` browse characters and tabs.
- **Back buttons** remember where you came from (Pause → Settings → back returns to Pause).

## Features

- Every screen transition is animated (scan-in reveal); menu items cascade in
- Hover and focus effects on every control: neon sweep, glow, slide
- Settings apply live (brightness, scanlines, rain) and persist between visits
- Optional synthesized UI sounds via Web Audio (toggle "Menu sounds" in Settings) — no audio files
- Accessible: real buttons and form controls with labels, visible focus outlines, ARIA tabs,
  `aria-pressed` selection states, focus moves to each new screen, `prefers-reduced-motion` support
- Responsive from 320px phones to wide desktop screens

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    navigation, settings, level/character/leaderboard data and behaviour
```

## Customize colors

Edit the `:root` block at the top of `style.css`:

```css
:root {
  --bg-0: #06030d;     /* deepest background */
  --bg-1: #140a2b;     /* sky */
  --neon-1: #ff2bd6;   /* primary neon (magenta) */
  --neon-2: #22f3ff;   /* secondary neon (cyan) */
  --neon-3: #f9f871;   /* highlights, focus ring, scores */
  --danger: #ff4d7a;
  --panel-bg: rgba(12, 6, 28, 0.84);
  --building-1: #1a0d38;   /* skyline */
  ...
}
```

Example "toxic" palette: `--neon-1: #a3ff12; --neon-2: #12ffd1; --neon-3: #ffe600;`.

## Customize fonts

Uses **Orbitron** (display) and **Chakra Petch** (body) from Google Fonts. Swap the
`<link>` in `index.html` and update `--font-display` / `--font-body`.

## Customize content

All game data is at the top of `script.js`:

- `LEVELS` — name, stars (0–3), `locked: true`
- `CHARACTERS` — name, role, color, bio, stats (0–100), `look` (`visor`, `antenna`, `mohawk`, `hood`)
- `BOARDS` — leaderboard rows `[name, sector, score]`; `PLAYER_NAME` marks your row

Menu labels and the game title are plain text in `index.html`. Change the title in both
the text and the `data-text` attribute (used by the glitch effect).

## Hooking up your game

Every button uses `data-goto="<screen-id>"`. Add your own logic in `runAction()` (buttons
with `data-action="..."`) and `onEnter(id)` (runs whenever a screen opens) in `script.js`,
for example to start your game loop when `#play` opens.

## Browser support

Latest Chrome, Edge, Firefox and Safari, desktop and mobile.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
