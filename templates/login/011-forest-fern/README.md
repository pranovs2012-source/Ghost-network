# Forest Fern — Login Template ("Fernwood")

A calm, nature-inspired authentication kit. A layered forest landscape fills the page and
**follows the visitor's real time of day** — warm dawn, bright day, violet dusk or a starry
night with fireflies — while leaves drift down in daylight. The sign-in card feels like a
page from a botanical journal. Pure HTML, CSS and vanilla JavaScript — no frameworks,
no build step, no images.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Sign in | `#login` | Email, password with show/hide, keep-me-signed-in |
| Plant your account | `#signup` | Trail name with "Suggest one" generator, email, password meter that **grows from seed to oak**, terms |
| Lost on the trail? | `#forgot` | Email field |
| A bird is on its way | `#sent` | Animated carrier bird with a letter, 30-second resend timer |

Open any screen with its hash, e.g. `index.html#signup`.

## Features

- **Time-aware scene:** dawn (5–9h), day (9–17h), dusk (17–20h), night — colors, sun/moon, stars,
  leaves and fireflies all change, with a matching greeting. A small Dawn / Day / Dusk / Night
  picker lets visitors (and you) preview every mood
- **Growing-tree password meter:** seed → sprout → sapling → young tree → old oak
- **Trail name generator** combining nature words (QuietFern, MossyOwl…)
- Swaying tree layers, falling leaves, glowing fireflies — all skipped for reduced-motion users
- Inline validation, `aria-invalid`, `aria-describedby`, shake on error, loading state
- Responsive: scene + card side by side on desktop, stacked on phones (new screens scroll into view)
- Accessible: labelled inputs, visible focus rings, radio group for the time picker, focus moves
  to each new screen heading, `prefers-reduced-motion` support

## Files

```
index.html   all screens + the landscape SVG
style.css    all styles — card colors and the four time-of-day palettes at the top
script.js    time of day, ambience, navigation, validation, generator, meter
```

## Customize colors

The card colors are in `:root`; each time of day is a small block of landscape colors:

```css
:root {
  --cream: #f7f2e4;  --ink: #1f2d22;  --moss: #3f6b45;  --fern: #7fa56b;
  /* DAY landscape */
  --sky-top: #9fd3f0; --sky-bottom: #e8f6f1; --sun: #fff3b8;
  --hill-4: #b4cf9f; --hill-3: #8db57c; --hill-2: #649660; --hill-1: #3f6c46;
  --on-scene: #1d2a20;   /* brand & greeting text over the landscape */
}
[data-time="dawn"] { ... }  [data-time="dusk"] { ... }  [data-time="night"] { ... }
```

For an **autumn** forest, warm the hills (`--hill-2: #b8743c; --hill-1: #7d4a24;`) and the
leaf colors in `LEAF_COLORS` (`script.js`).

## Customize fonts

Uses **Fraunces** (headings) and **DM Sans** (text) from Google Fonts. Swap the `<link>` in
`index.html` and update `--font-serif` / `--font-sans`.

## Customize behavior

In `script.js`:
- `timeFromClock()` — change the hour ranges, or return a fixed value (e.g. `'day'`) to lock the scene
- `GREETINGS` — the greeting for each time of day
- `NAME_PARTS` — words used by the trail name generator
- `STAGES` — the meter labels
- To hide the time picker, delete the `.timepick` element in `index.html`

## Connect your backend

Replace the `fakeRequest(...)` calls inside `onSubmit(...)` with your own `fetch()` requests.
Always validate on the server as well.

## License

Personal and commercial use allowed, including client work and products you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
