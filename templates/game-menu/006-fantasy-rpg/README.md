# Fantasy RPG — Game Menu Template ("Embervale")

A storybook menu system for RPGs and adventure games: a gilded title under a hanging
banner, engraved menu plaques with glowing gem sockets, parchment panels with gold
filigree corners, and a moonlit castle with drifting mist and rising embers.
Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step, no image files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Main menu | `#main` | Swaying banner with an original sigil, gilded title, 6 plaque buttons with gem glow |
| In-game (demo) | `#play` | Health & mana orbs with sloshing liquid, quest tracker, swinging compass |
| Pause | `#pause` | Animated CSS campfire above a parchment menu |
| Options | `#settings` | Sound / Sight / Play tabs: gilded sliders, glowing rune switches, text size, difficulty — saved locally |
| Quest log | `#levels` | Illuminated chapter numerals, progress bars, wax-sealed locked chapters |
| Heroes | `#characters` | Tarot-style cards that flip to reveal bio and stats (keyboard radio group) |
| Game over | `#gameover` | "Thou Hast Fallen" with a falling sword and counting tallies |
| Hall of legends | `#leaderboard` | Heraldic shields, Renown / Swiftest / Guild tabs, your row highlighted |
| Quit | `#quit` | Parchment confirmation |

Open any screen directly: `index.html#levels`.

## Features

- Every effect is CSS or inline SVG: castle, moon, mist, embers, campfire, sigil, emblems, shields
- Options apply live and persist: gamma, embers, mist, text size (scales the whole UI), sounds
- Optional soft chime sounds generated with the Web Audio API (turn on "Menu chimes")
- Keyboard: `↑` `↓` move through menus, `Enter` selects, `Esc` rests (pauses) in game,
  resumes from rest, or goes back; arrows move between hero cards and tabs
- Back buttons remember where you came from (Pause → Options → back returns to Pause)
- Accessible: labelled controls, visible focus, ARIA tabs/radios, screen-reader text for
  chapter progress and locks, focus moves to each new screen, `prefers-reduced-motion` support
- Responsive: two-column title + menu on desktop, stacked on phones; cards go 4 → 2 columns

## Files

```
index.html   all screens + shared SVG symbols (sigil, ornamental corner, gilt gradient)
style.css    all styles — theme variables at the top
script.js    navigation, options, chapters, heroes, legends, embers
```

## Customize colors

```css
:root {
  --night-1: #0c1120;   --night-2: #1f2540;   /* sky */
  --gold-light: #fbe7a1; --gold: #d4a541; --gold-dark: #8c5f17;
  --banner: #7d1a1f;                          /* hanging banner cloth */
  --parchment: #efe3c4; --parchment-dark: #d3bd8f;
  --ink: #2a1d0f;       --blood: #8e1c1c;     /* text & accents on parchment */
  --emerald: #2f6b4f;                         /* progress */
}
```

For a **frost** kingdom try `--banner: #1d3b6b; --blood: #1d4f8e; --gold: #b8c7d9; --gold-light: #eef4ff; --gold-dark: #5d7590;`.
The SVG gilt gradient (`#gilt` in `index.html`) colors the sigil, corners and emblems.

## Customize fonts

Uses **Cinzel** (titles, buttons) and **EB Garamond** (body) from Google Fonts. Swap the
`<link>` in `index.html` and update `--font-title` / `--font-body`.

## Customize content

At the top of `script.js`:
- `HEROES` — name, role, emblem (`sword`, `bow`, `staff`, `chalice` — or add your own SVG to `EMBLEMS`), card tint, bio, stats
- `CHAPTERS` — title, description, `progress` (0–100), `current`, `locked`
- `LEGENDS` — rows of `[name, title, score, color1, color2, pattern]` where pattern is `''`, `chevron` or `band`

The game title, book subtitle and plaque labels are plain text in `index.html`.

## Hooking up your game

Buttons use `data-goto="<screen-id>"`; actions use `data-action` (handled in the click
listener). Use `onEnter(id)` in `script.js` to start or stop your game when screens open.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
