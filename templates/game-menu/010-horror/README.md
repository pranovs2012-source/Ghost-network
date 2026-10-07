# Horror — Game Menu Template ("WHISPERWOOD")

A complete horror menu kit with real atmosphere: a moonlit house in a black forest, rolling
fog, a flashlight that follows the cursor (or keyboard focus), film grain and rare soft
lightning — while every menu stays perfectly readable. Typewriter text, handwritten notes,
polaroids, case files and a corkboard tie it together. Pure HTML, CSS and vanilla
JavaScript — no frameworks, no build step, no image or audio files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Main menu | `#main` | Unsettling title, typewriter menu with handwritten asides, content warning |
| In game (demo) | `#play` | Found-footage camcorder HUD: REC, timestamp, low battery, sanity meter, whispers |
| Pause | `#pause` | "Hold your breath" polaroid with a watching figure |
| Settings | `#settings` | **Gamma calibration** (three marks), sound, comfort options — saved locally |
| Chapters | `#levels` | Polaroids pinned on a corkboard, linked with red string; locked chapters struck out |
| Survivors | `#characters` | Manila case files with folder tabs, photo, traits and a rubber stamp |
| Game over | `#gameover` | "They found you", dripping blood, counting survival time |
| Survivors’ log | `#leaderboard` | Handwritten journal on lined paper; lost survivors crossed out, you circled |
| Leave | `#quit` | Polaroid confirmation |

Open any screen directly: `index.html#levels`.

## Comfort & accessibility

Horror should scare people on purpose, never by accident:

- **Comfort tab:** turn off film grain, lightning flashes and jump scares (whispers); pick a fear level
- **Gamma calibration** with a live preview, so dark scenes stay readable on any screen
- Lightning is soft, rare (once every ~16 s) and never more than 3 flashes per second;
  lightning and grain are disabled automatically for `prefers-reduced-motion` users
- The flashlight darkens only the background scene — menu text is never hidden in the dark
- The flashlight also follows keyboard focus, so keyboard users get the same effect
- Real buttons, labelled form controls, ARIA tabs, visible dashed focus outlines,
  screen-reader text for locked/lost/you states, focus moves to each new screen
- Keyboard: `↑` `↓` move through menus, `Enter` selects, `Esc` pauses/goes back,
  `←` `→` switch case files and tabs

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    navigation, flashlight, grain, settings, chapters, case files, log
```

## Customize colors

```css
:root {
  --void: #070606;        /* background */
  --bone: #e8e2d4;        /* main text */
  --blood: #e5484d;       /* red text on dark */
  --blood-deep: #7d0a0f;  /* red fills (buttons, drips) */
  --paper: #d9d2c0;       /* settings sheet, journal */
  --ink: #1b1612;         /* text on paper */
  --ink-red: #9b1b1b;     /* red text on paper */
  --cork: #8a6440;        /* corkboard */
  --fog: rgba(190, 196, 210, 0.10);
}
```

For a **cold, ghostly** look try `--blood: #7fd6e6; --blood-deep: #1e4f5c; --ink-red: #1e4f5c;`.

## Customize fonts

Uses **IM Fell English SC** (titles), **Special Elite** (typewriter text) and **Caveat**
(handwriting) from Google Fonts. Swap the `<link>` in `index.html` and update
`--font-title`, `--font-type` and `--font-hand`.

## Customize content

At the top of `script.js`:
- `CHAPTERS` — name, `scene` (`scene-1` … `scene-4`, painted with CSS in `style.css`), `done`, `current`, `locked`
- `SURVIVORS` — name, case number, photo tone, status stamp, note, traits
- `LOG` — `[name, nights, lost?]`; `PLAYER_NAME` gets circled
- `WHISPERS` — lines that fade in on the camcorder screen

## Hooking up your game

Buttons use `data-goto="<screen-id>"`. Start or stop your game in `onEnter(id)` / `onLeave(id)`
in `script.js`. Read `settings.jumpScares` and `settings.fear` before scheduling scares.

## License

Personal and commercial use allowed, including in games and client projects you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
