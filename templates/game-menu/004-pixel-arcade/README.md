# Pixel Arcade — Game Menu Template ("PIXEL QUEST")

A complete 8-bit menu system for platformers, RPGs and arcade games: a blinking
PRESS START title, menus with a pixel ► cursor, chunky framed windows, a parallax
pixel landscape and original pixel-art heroes. Pure HTML, CSS and vanilla
JavaScript — no frameworks, no build step, no image or audio files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Title | `#title` | Bouncing logo, hero sprite, PRESS START, credits line |
| Main menu | `#main` | Blinking pixel cursor, hi-score counter |
| In-game (demo) | `#play` | Hearts, score, spinning coins, ? blocks, jumping hero, patrolling enemy |
| Pause | `#pause` | Continue / retry / options / exit |
| Options | `#settings` | Sound (block sliders, ON/OFF), Video (CRT filter, parallax, palette), Controls (key table, difficulty) |
| World map | `#levels` | Path-connected level nodes, stars, locked levels, boss node, hero marker that walks to your selection |
| Heroes | `#characters` | 4 pixel heroes, big preview, stat pips, keyboard radio group |
| Continue? | `#gameover` | 9 → 0 arcade countdown, then GAME OVER and the high score table |
| High scores | `#leaderboard` | Classic rainbow rows, hero sprites, ALL TIME / TODAY tabs, your row blinks |
| Quit | `#quit` | Confirmation back to the title screen |

Open any screen directly: `index.html#levels`.

## Features

- Original pixel-art sprites rendered from simple text maps into crisp SVG — draw your own!
- 3 switchable palettes (Night, Day, Mono) — saved with the other options in `localStorage`
- CRT scanline filter and parallax animations can be turned off in Options
- Chiptune UI beeps generated with the Web Audio API (enable "Menu beeps" in Options)
- Keyboard: `↑` `↓` (and `←` `→` in YES/NO menus) move the cursor, `Enter` selects,
  `Esc` pauses / goes back; `←` `→` choose heroes; `Enter` starts from the title screen
- Accessible: real buttons and inputs with labels, dashed focus outlines, ARIA tabs and
  radio group, screen-reader text for icons, stars and stats, `prefers-reduced-motion` support
- Responsive from small phones to large desktops

## Files

```
index.html   all screens
style.css    all styles — palette variables at the top
script.js    navigation, sprites, map, heroes, scores, options
```

## Customize colors

Edit the `:root` block at the top of `style.css`. Each palette is a block of the same
variables, so you can also edit `[data-palette="day"]` and `[data-palette="mono"]` or add your own:

```css
:root {
  --sky-top: #0b0d2a;   --sky-bottom: #283a7a;
  --panel: #1d2b53;     --frame: #fff1e8;     /* menu windows */
  --yellow: #ffd23f;    --red: #ff4d6d;   --green: #00e436;   --blue: #29adff;
  --grass: #00b543;     --dirt: #8a4b2c;      /* ground */
  --px: 4px;            /* thickness of every pixel border */
}
```

To add a palette, copy a `[data-palette="..."]` block, give it a new name and add a
matching radio button in the Video tab.

## Customize fonts

Uses **Press Start 2P** (titles, buttons) and **VT323** (body text) from Google Fonts.
Swap the `<link>` in `index.html` and update `--font-pixel` / `--font-text`.

## Draw your own sprites

Sprites live in `SPRITES` at the top of `script.js`. Each row is a string, one character
per pixel, `.` for transparent. Colors come from `SPRITE_COLORS`:

```js
mage: [
  '.....KK.....',
  '....KPPK....',
  ...
]
```

Use them anywhere with `<div data-sprite="mage" data-scale="6"></div>`.

## Customize content

At the top of `script.js`: `HEROES` (name, bio, stats 0–5), `LEVELS` (map position in %,
stars, `locked`, `current`, `boss`) and `SCORES`. The game title is plain text in `index.html`.

## Hooking up your game

Every button uses `data-goto="<screen-id>"`. Put your own logic in `onEnter(id)` /
`onLeave(id)` in `script.js` — for example, start your game loop when `play` opens and
stop it when it closes.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
