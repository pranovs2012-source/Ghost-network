# Cartoon Pop — Game Menu Template ("BOUNCE BUDDIES")

A bright Saturday-morning cartoon menu kit for casual, kids and party games: chunky
outlines, jelly buttons that squash and stretch, comic "POW!" bursts on every click,
a spinning sunburst sky and four original blob buddies drawn in SVG. Pure HTML, CSS and
vanilla JavaScript — no frameworks, no build step, no image or audio files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Main menu | `#main` | Wobbling logo, 6 jelly buttons, hopping buddy, speech-bubble tip |
| Play (demo) | `#play` | Star counter, hearts, bouncing buddy, spinning coins, scrolling grass |
| Time out (pause) | `#pause` | Halftone comic panel |
| Settings | `#settings` | Gooey sliders, pill switches, **Wobble power** (controls how bouncy everything is), difficulty — saved locally |
| Sticker book (levels) | `#levels` | World tabs, tilted stickers with peel corners and stars, locked slots |
| Pick a buddy | `#characters` | Buddy on a pedestal with speech bubble, candy-stripe stat bars, **paint picker** to recolor |
| Oopsie! (game over) | `#gameover` | Dizzy buddy with circling stars |
| Top bouncers | `#leaderboard` | **Podium** for the top three + ranked list, All time / Friends tabs |
| Leaving already? | `#quit` | Sad buddy confirmation |

Open any screen directly with its hash, e.g. `index.html#characters`.

## Features

- Squash-and-stretch hover animations; strength follows the **Wobble power** slider (0 = calm)
- Comic bursts (POW!, BOING!, ZAP!…) wherever you click — can be turned off
- Optional synthesized "boing" sounds via the Web Audio API (no audio files)
- Buddies are generated as SVG in three moods (happy, dizzy, sad); the chosen buddy and
  paint color appear on the main menu and in the game
- Keyboard: `↑` `↓` move through menus, `Enter` selects, `Esc` pauses/goes back,
  `←` `→` browse buddies, tabs and paint colors
- Accessible: labelled controls, thick dashed focus outlines, ARIA tabs and radio groups,
  screen-reader text for stars, stats and podium places, `prefers-reduced-motion` support
- Responsive from small phones to desktop

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    navigation, buddies (SVG), settings, sticker book, podium
```

## Customize colors

```css
:root {
  --sky-1: #7fd3ff;  --sun: #ffe066;  --grass-1: #7ddc5a;
  --ink: #1d1b33;    /* outlines and text */
  --green: #6ee36a;  --blue: #6ac8ff;  --pink: #ff8cc6;  --yellow: #ffd84d;
  --purple: #c3a2ff; --red: #ff7b7b;   --orange: #ffab4d;
  --line: 4px;       /* outline thickness */
  --drop: 6px;       /* 3D button depth */
}
```

Buttons pick their fill from these with classes like `jelly--pink`. Keep fills bright so
the dark `--ink` text stays readable.

## Customize fonts

Uses **Luckiest Guy** (titles, buttons) and **Baloo 2** (text) from Google Fonts. Swap the
`<link>` in `index.html` and update `--font-display` / `--font-body`.

## Customize content

At the top of `script.js`:
- `BUDDIES` — name, `shape` (`blob`, `ears`, `frog`, `star`), color, catchphrase, stats
- `PAINTS` — colors offered by the paint picker
- `WORLDS` — sticker colors and levels `[name, stars 0–3 or null for locked, 'boss']`
- `BOARD` — `[name, score, buddy index]`
- `POWS` — words used by the comic bursts

## Hooking up your game

Buttons use `data-goto="<screen-id>"`. Start/stop your game in `onEnter(id)` / `onLeave(id)`.
The player's choice is saved as `settings.buddy` and `settings.paint` in `localStorage`.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
