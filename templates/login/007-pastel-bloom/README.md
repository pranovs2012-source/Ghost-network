# Pastel Bloom — Login Template ("Puffy")

A soft, bouncy pastel authentication kit with a personality: a fluffy cloud mascot sits on
top of the card, follows your cursor with its eyes, covers them while you type a password,
cheers when you succeed and wobbles when something is wrong. Pure HTML, CSS and vanilla
JavaScript — no frameworks, no build step, no images.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Log in | `#login` | Email, password with peek button, "stay logged in" switch, magic-link button |
| Sign up | `#signup` | 3-step flow with animated stepper: **Account** (email, password) → **Profile** (display name, avatar color, live avatar preview) → **Vibes** (interest chips, terms switch) |
| Forgot | `#forgot` | Friendly reset request |
| Link sent | `#sent` | Paper plane flies in with a dotted trail, 30-second resend timer |

Open any screen with its hash, e.g. `index.html#signup`.

## Features

- **Mascot** with eye tracking, random blinking, speech bubble, shy mode for passwords,
  happy hop on success and a wobble on errors (decorative, hidden from screen readers)
- **Password strength as flowers** — four flowers bloom as the password gets stronger
- **Confetti** burst after logging in or finishing sign-up (skipped for reduced-motion users)
- Morphing pastel blobs and twinkling sparkles in the background
- Bouncy "3D" primary button, loading dots, toast messages
- Validation per step with friendly messages, `aria-invalid`, `aria-describedby`, shake on error
- Accessible: labels on every control, `aria-current="step"` on the stepper, radio group for
  colors, switches for toggles, visible focus rings, focus moves to each new screen,
  `prefers-reduced-motion` support
- Responsive from 320px phones to large screens

## Files

```
index.html   all screens and the mascot SVG
style.css    all styles — theme variables at the top
script.js    navigation, mascot, stepper, validation, flowers, confetti
```

## Customize colors

```css
:root {
  --bg: #fff6fa;
  --blob-1: #ffd3e4;  --blob-2: #cfe9ff;  --blob-3: #d6f5df;  --blob-4: #fff0b3;
  --ink: #3b2f5c;     /* text */
  --primary: #7652e6; /* buttons, focus, links */
  --primary-2: #d1457f; /* second color of the button gradient */
  --danger: #c92f5a;
}
```

Keep `--primary` and `--primary-2` dark enough for white button text (4.5:1 contrast).
The mascot's colors are set directly in its SVG in `index.html` (`#puff` gradient and strokes).

## Customize fonts

Uses **Fredoka** (headings, buttons) and **Nunito** (text) from Google Fonts. Swap the `<link>`
in `index.html` and update `--font-display` / `--font-body`.

## Customize content

- Mascot speech lines: the `LINES` object at the top of `script.js`.
- Avatar colors: the `.swatch` radio buttons in step 2.
- Interests: the `.chip` checkboxes in step 3.
- Confetti colors: `COLORS` in `script.js`.

## Connect your backend

Replace the `fakeRequest(...)` calls in the submit handlers in `script.js` with your own
`fetch()` requests. The sign-up handler only sends on the final step — all three steps'
fields are inside the same `<form>`, so `new FormData(form)` collects everything.

## License

Personal and commercial use allowed, including client work and products you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
