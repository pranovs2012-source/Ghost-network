# Swiss Minimal — Login Template ("Raster")

An authentication kit in the International Typographic Style: a visible 12-column grid,
oversized grotesque type, mono labels and a single signal red. The left "poster" column
changes its giant headline for every screen while a red disc glides to a new grid
position. Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step.

## Screens

| Screen | Hash | Poster headline | Highlights |
|---|---|---|---|
| Sign in | `#login` | Sign in. | Underline inputs, show/hide password, remember device |
| Create account | `#signup` | Join us. | First/last name, live 4-rule password checklist, terms |
| Reset password | `#forgot` | Reset. | Single email field |
| Link sent | `#sent` | Sent ✓ | 30-second draining progress line and resend timer |

Open any screen directly with its hash, e.g. `index.html#signup`.

## Features

- Poster headline reveal animation and travelling red disc on every screen change
- Numbered step navigation (01 / 02 / 03) with an animated red progress rule
- Light and dark mode toggle — follows the visitor's system setting on first visit, then remembers the choice
- Live clock in the top bar
- Inline validation with clear messages, `aria-invalid`, `aria-describedby` and a shake on invalid submit
- Red "wipe" hover on the primary button, arrow nudge, underline grow on links
- Responsive: two columns on desktop, poster header + form stacked on tablet and phone
- Accessible: proper labels, visible focus, keyboard friendly, focus moves to each new screen,
  `aria-current` on the active step, respects `prefers-reduced-motion`

## Files

```
index.html   all screens
style.css    styles — theme variables (light + dark) at the top
script.js    navigation, headlines, validation, theme, clock
```

## Customize colors

```css
:root {
  --paper: #f3f1ec;     /* background */
  --ink: #111111;       /* text, lines, button */
  --ink-soft: #55534e;  /* secondary text */
  --signal: #c8102e;    /* the single accent color */
}
[data-theme="dark"] { /* the same variables for dark mode */ }
```

Try `--signal: #0047ff` (Swiss blue) or `--signal: #ff6a00` (signal orange). Keep the
signal color dark enough to stay readable on `--paper` (aim for 4.5:1 contrast).

## Customize fonts

Uses **Inter Tight** (all text) and **IBM Plex Mono** (labels) from Google Fonts. Replace the
`<link>` in `index.html`, then update `--font-sans` and `--font-mono`.

## Customize text

- Brand name/mark: the `.brand` link in the top bar (the mark is two CSS squares).
- Poster headlines: the `HEADLINES` object at the top of `script.js`.
- City in the clock label: plain text next to `<time id="clock">` in `index.html`.
- Password rules: the `RULES` object in `script.js` and the matching `<li data-rule>` items.

## Connect your backend

Replace the `handleSubmit(...)` callbacks at the bottom of `script.js` (they use a
`fakeRequest` timer) with your own `fetch()` calls. Always validate on the server too.

## Browser support

Latest Chrome, Edge, Firefox and Safari, desktop and mobile.

## License

Personal and commercial use allowed, including client work and products you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
