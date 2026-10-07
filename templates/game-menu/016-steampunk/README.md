# Steampunk — Game Menu Template ("AETHERWORKS")

A Victorian airship adventure menu kit: riveted brass plates, interlocking gears that really
turn, copper pipes venting steam, a parchment voyage chart and a boiler that bursts in style.
Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step, no image or audio files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Main menu | `#main` | Floating airship with spinning propeller, wood-and-brass title plaque, 6 brass plate buttons with turning cogs |
| Set sail (demo) | `#play` | Sunset sky, drifting clouds, scrolling hills, live pressure gauge, altitude / distance / cogs |
| Engines idling (pause) | `#pause` | Pocket watch with ticking hand |
| The Workshop (settings) | `#settings` | Tabs, brass slider knobs, lever switches, difficulty chips — saved locally |
| Voyage chart (levels) | `#levels` | Parchment map with islands, compass and a smooth route through 7 ports; travelled path inked in red; locked ports |
| Engineers’ Guild (characters) | `#characters` | 4 original SVG engineers in cameo frames; stats shown as **dial gauges** whose needles swing into place |
| Boiler burst (game over) | `#gameover` | Cracked, rattling gauge with bursting steam; counting stats |
| Hall of Inventors (leaderboard) | `#leaderboard` | Ledger table with gold/silver/bronze medals, two ranking tabs |
| Abandon ship? | `#quit` | Confirmation |

Open any screen directly with its hash, e.g. `index.html#levels`.

## Features

- Background gears are generated as SVG, interlock in opposite directions and turn at a speed
  you can change (or stop) in settings
- Steam vents: choose how many puffs rise from the pipes (0–12)
- **Sepia photograph mode** and adjustable lamp glow
- Optional synthesized clanks and a steam whistle on save (Web Audio API, no audio files)
- Keyboard: `↑` `↓` move through menus, `Enter` selects, `Esc` pauses / goes back,
  `←` `→` browse ports and engineers
- Accessible: labelled controls, ARIA tabs and radio groups, screen-reader text for locked
  ports and cog ratings, visible focus, `prefers-reduced-motion` support
- Responsive from small phones to desktop

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    gears, airship, portraits, navigation, settings, chart, guild, hall
```

## Customize colors

```css
:root {
  --brass: #c9a227;   --brass-light: #f3d98a;   --brass-dark: #7a5a12;
  --copper: #d98b56;  --verdigris: #3f9a86;
  --wood: #3b1f14;    --parchment: #f2e2bd;     --ink: #2a1a10;
  --danger: #a3241a;
  --gear-color: #6e4f17;   /* background gears */
}
```

## Customize fonts

Uses **Playfair Display SC** (titles, buttons) and **Alegreya** (text) from Google Fonts.
Swap the `<link>` in `index.html` and update `--font-display` / `--font-body`.

## Customize content

At the top of `script.js`:
- `PORTS` — name, position on the 100 × 60 chart (`x`, `y`), cogs earned (`0–3`, `null` = locked),
  description and three facts. The route line is drawn through the ports automatically.
- `ENGINEERS` — name, trade, gadget, bio, stats (0–100) and `look`
  (`skin`, `hair`, `coat`, `accent`, `hat`: `top` / `goggles` / `bowler` / `cap`, plus
  `mustache`, `beard`, `monocle`, `bun`)
- `HALL` — leaderboard rows `[name, airship, value]`
- `GEAR_LAYOUT` — size, teeth and position of the background gears

The island shapes are plain SVG paths inside `.map__art` in `index.html`.

## Hooking up your game

Buttons use `data-goto="<screen-id>"`. Start/stop your game in `onEnter(id)` / `onLeave(id)`
in `script.js`. Settings are stored as JSON in `localStorage` under `aetherworks-settings`.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
