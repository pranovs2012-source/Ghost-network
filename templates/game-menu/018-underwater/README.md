# Underwater — Game Menu Template ("ABYSSAL")

A deep-sea exploration menu kit where **every screen sits at its own depth**: the ocean
scrolls down as players navigate, sunlight rays fade, bubbles give way to marine snow and
glowing jellyfish drift by. Pure HTML, CSS and vanilla JavaScript — no frameworks, no build
step, no image or audio files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Main menu | `#main` | Light rays, swaying kelp, bubble buttons that release bubbles on hover |
| Dive (demo) | `#play` | Submarine with lamp beam, fish schools, sonar ring, live depth / oxygen / pearls — runs out of oxygen into the game over |
| Holding position (pause) | `#pause` | Porthole with a passing fish |
| Settings | `#settings` | Tabs, bubble sliders and switches, water tint, oxygen supply — saved locally |
| Dive chart (levels) | `#levels` | Sites on a descending cable grouped by ocean zone (Sunlight → Hadal), pearls found, locked sites |
| Hangar (characters) | `#characters` | 4 SVG submersibles, bubble stat meters, **lamp color picker** that tints every sub |
| Hull breach (game over) | `#gameover` | Cracked, leaking sub sinking into the abyss; counting stats |
| Deepest dives (leaderboard) | `#leaderboard` | Pearl rank badges, Depth / Pearls tabs |
| Surface already? | `#quit` | Confirmation |

Open any screen directly with its hash, e.g. `index.html#levels`.

## Features

- Depth gauge on the right shows how deep the current screen is
- Canvas particles: rising bubbles near the surface, falling marine snow in the deep
  (amount adjustable, 0 turns them off)
- Toggle sun rays and jellyfish; shift the water tint
- Optional synthesized bubble "bloops" and sonar pings with echo (Web Audio API, no audio files)
- The chosen submersible and lamp color are remembered and used in the dive and game over
- Keyboard: `↑` `↓` move through menus, `Enter` selects, `Esc` pauses / goes back,
  `←` `→` browse submersibles, arrow keys move between dive sites
- Accessible: labelled controls, ARIA tabs and radio groups, screen-reader text for locked sites,
  pearls and stat meters, visible focus, `prefers-reduced-motion` support
- Responsive from small phones to desktop

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    particles, jellyfish, submarines, navigation, settings, chart, hangar, leaderboard
```

## Customize colors

```css
:root {
  --water-0: #3bb3c9;  /* surface … */  --water-5: #010812;  /* … abyss */
  --glow: #5ff7e6;     --glow-2: #b38bff;   --coral: #ff8a9a;   --pearl: #fff4e3;
  --kelp: #0f5a46;     --text: #e8fbff;     --muted: #a9d8e2;
}
```

Each screen's depth is its `data-depth` attribute (0 = surface, 1 = deepest). Change it to make
a screen deeper or shallower.

## Customize fonts

Uses **Comfortaa** (titles) and **Outfit** (text) from Google Fonts. Swap the `<link>` in
`index.html` and update `--font-display` / `--font-body`.

## Customize content

At the top of `script.js`:
- `ZONES` — ocean zones with their maximum depth and color
- `SITES` — name, depth in meters, pearls found (`0–3`, `null` = locked), water temperature, creature, description
- `SUBS` — name, class, hull color, description, stats (1–5)
- `LAMPS` — lamp colors offered in the hangar
- `BOARD` — leaderboard rows `[name, submersible, value]`
- `MAX_DEPTH_M` — how many meters `data-depth="1"` represents on the gauge

## Hooking up your game

Buttons use `data-goto="<screen-id>"`. Start/stop your game in `onEnter(id)` / `onLeave(id)`.
Settings (including `sub` and `lamp`) are stored as JSON in `localStorage` under `abyssal-settings`.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
