# Space Odyssey — Game Menu Template ("STELLAR ATLAS")

A cosmic exploration menu system: a living canvas starfield that drifts with the mouse
and stretches into a warp tunnel during flight, glowing nebula clouds, shooting stars and a
ringed gas giant — plus six worlds painted entirely with CSS gradients. Pure HTML, CSS and
vanilla JavaScript — no frameworks, no build step, no image or audio files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Bridge (main) | `#main` | Gradient logo, planet-bullet menu with orbiting moons on hover, ship status |
| In flight (demo) | `#play` | Warp-speed starfield, bobbing ship with engine flame, oxygen/fuel gauges, speed and ETA |
| Pause | `#pause` | Rotating blue planet with drifting clouds |
| Ship settings | `#settings` | Visuals (star density, nebula hue, parallax, shooting stars), audio, controls — saved locally |
| Destinations | `#levels` | Planet carousel: ocean, lava, gas giant with rings, ice, jungle, locked anomaly; facts card; swipe on touch |
| Crew manifest | `#characters` | Crew list (radio group) + astronaut helmet portrait, bio and skill bars |
| Signal lost | `#gameover` | An astronaut drifts away into the stars; counting stats |
| Explorers’ hall | `#leaderboard` | Farthest / Most worlds tabs, medal colors, your row highlighted |
| Return to Earth | `#quit` | Confirmation |

Open any screen directly: `index.html#levels`.

## Features

- **Canvas starfield**: depth-sorted stars with twinkle, mouse parallax and a smooth warp effect
- **Live settings**: star density rebuilds the starfield, the nebula hue slider recolors space instantly
- **CSS planets**: a fixed shaded globe plus a scrolling surface texture creates real rotation
- Optional interface blips via the Web Audio API (no audio files)
- Keyboard: `↑` `↓` move through menus, `Enter` selects, `Esc` pauses/goes back,
  `←` `→` change destination and crew member
- Accessible: labelled controls, visible focus rings, ARIA tabs and radio group, planets have
  text alternatives, focus moves to each new screen, `prefers-reduced-motion` freezes the starfield
- Responsive: side-by-side layouts on desktop, stacked on phones

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    starfield, navigation, settings, destinations, crew, hall
```

## Customize colors

```css
:root {
  --space: #05040f;
  --nebula-1: #6b3fd1;  --nebula-2: #1fb5c4;  --nebula-3: #ff5fa8;
  --accent: #7ad3ff;    --accent-2: #c79bff;  --warm: #ffb46b;
  --panel: rgba(14, 13, 38, .72);
}
```

Players can also rotate the nebula colors with **Ship Settings → Nebula hue**.

## Customize fonts

Uses **Exo 2** (display) and **Space Grotesk** (text) from Google Fonts. Swap the `<link>` in
`index.html` and update `--font-display` / `--font-body`.

## Customize content

At the top of `script.js`:
- `PLANETS` — name, type, glow color, spin speed, `ringed`, `locked`, description, facts.
  Each planet has a `base` (the shaded globe) and a `texture` (CSS gradients that scroll to make it spin)
- `CREW` — name, role, suit color, bio, skills 0–100
- `HALL` — `[name, ship, value, color]` for each ranking

## Hooking up your game

Buttons use `data-goto="<screen-id>"`. Put your game start/stop logic in `onEnter(id)` /
`onLeave(id)`. Set `warpTarget = 1` (or `0`) yourself to drive the warp effect from gameplay.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
