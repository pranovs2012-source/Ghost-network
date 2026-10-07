# Neumorphism — Login Template ("Hush")

A calm soft-UI authentication kit: every surface is the same color, extruded or pressed in
with paired light and dark shadows. Unlike many neumorphic designs, text, borders and focus
states are tuned to stay readable and to meet contrast guidelines. Pure HTML, CSS and
vanilla JavaScript — no frameworks, no build step.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Sign in | `#login` | Segmented Sign in / Sign up control, pressed-in fields with icons, remember-me switch, **passkey button with fingerprint scan** |
| Sign up | `#signup` | Name, email, password with a **circular strength ring** (0–100), terms switch |
| Reset password | `#forgot` | Email field |
| Check your inbox | `#sent` | Pressed-in circle with a drawn check mark, resend timer |

Open any screen with its hash, e.g. `index.html#signup`.

## Features

- **4 accent colors** (indigo, teal, rose, amber) — pick from the swatches in the corner
- **Dark soft mode** with its own shadow pair; follows the system setting on first visit;
  the accent and mode are remembered
- Passkey demo: scanning line over a fingerprint, then "Verified" (hook up WebAuthn where marked)
- Segmented control with a sliding raised thumb
- Inline validation with friendly messages, `aria-invalid`, `aria-describedby`, shake on error
- Responsive from 320px phones to desktop
- Accessible: labelled inputs, focus rings in the accent color, ARIA radio group for colors,
  switch roles, `aria-current` on the segmented control, `prefers-reduced-motion` support

## Files

```
index.html   all screens
style.css    all styles — surface and shadow variables at the top
script.js    navigation, appearance, passkey demo, strength ring, validation
```

## Customize colors

```css
:root {
  --bg: #e4e9f0;                          /* the surface color */
  --shadow-dark: rgba(150, 164, 186, .75); /* lower-right shadow */
  --shadow-light: rgba(255, 255, 255, .95);/* upper-left highlight */
  --text: #26303d;  --text-soft: #4f5a69;
  --lift: 8px;  --blur: 18px;             /* how "tall" raised surfaces look */
}
[data-mode="dark"] { ... }
[data-accent="indigo"] { --accent: #4c5bd4; }   /* add your own accents here */
```

Neumorphism works best when `--shadow-dark` is a darker, slightly blue-shifted version of
`--bg`, and `--shadow-light` is a lighter version. To add an accent, add a
`[data-accent="name"]` rule (and a dark-mode variant) plus a matching `.swatch` button.

## Customize fonts

Uses **Lexend** from Google Fonts. Swap the `<link>` in `index.html` and update `--font`.

## Connect your backend

- Replace the `fakeRequest(...)` handlers in `onSubmit(...)` with `fetch()` calls.
- For real passkeys, replace the timer inside the `#passkey` click handler with
  `navigator.credentials.get({ publicKey: ... })` using options from your server.

## License

Personal and commercial use allowed, including client work and products you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
