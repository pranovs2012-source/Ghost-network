# Dark Luxury — Login Template ("Aurum Private")

A members-club authentication kit in black and champagne gold: serif display type with
a slow foil shimmer, floating-label fields, a gold monogram, a slowly rotating gold
sculpture and drifting gold dust. Includes a real two-step verification screen.
Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Sign in | `#login` | Floating labels, show/hide password, remember me |
| Two-step verification | `#verify` | Six code boxes: auto-advance, backspace, arrow keys, paste a full code, auto-submit |
| Request membership | `#signup` | Name, email, password meter, membership tier cards (Residence / Global / Founder), terms |
| Forgotten password | `#forgot` | Email field |
| Link sent | `#sent` | Animated wax-seal check mark, 30-second resend timer |

Signing in takes you to the verification screen (in the demo any six digits are accepted).
Open any screen directly with its hash, e.g. `index.html#verify`.

## Features

- Gold foil shimmer on headings and a light sweep across the gold button
- Floating labels that rise into small gold caps on focus
- Gold underline that draws in on focus
- Editorial side panel (desktop): CSS sculpture of orbiting rings, quote and key facts
- Drifting gold dust particles (generated in JS, disabled for reduced-motion users)
- Inline validation with friendly messages, `aria-invalid`, `aria-describedby` and a shake on error
- Responsive: editorial + card on desktop, focused card on tablet and phone
- Accessible: proper labels (including each code digit), visible focus, keyboard friendly,
  focus moves to the new screen heading, `prefers-reduced-motion` support

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    navigation, validation, code entry, meter, particles
```

## Customize colors

```css
:root {
  --black: #0a0907;        /* page background */
  --card: #12100c;         /* card surface */
  --gold-light: #f6e7b8;   /* gold highlights */
  --gold: #c9a24d;         /* main gold */
  --gold-deep: #8a6a2a;    /* gold shadows */
  --text: #f2ede3;
  --text-muted: #a8a194;
  --on-gold: #1a1408;      /* text on gold buttons */
}
```

For a **rose gold** look try `--gold-light: #fbe1d6; --gold: #c98b73; --gold-deep: #8a5040;`.
For **platinum** try `--gold-light: #ffffff; --gold: #b8bcc4; --gold-deep: #6b7079;`.
The monogram and seal use the same colors through the `goldGrad` SVG gradient in `index.html`.

## Customize fonts

Uses **Cormorant Garamond** (headings, wordmark) and **Manrope** (text) from Google Fonts.
Swap the `<link>` in `index.html` and update `--font-serif` / `--font-sans`.

## Customize content

- Brand: the monogram SVG and `.wordmark` in the card header.
- Editorial panel: quote and facts in `<aside class="editorial">`.
- Membership tiers: the three `.tier` labels in the sign-up form.
- Particle count: change `28` in the gold dust loop at the top of `script.js`.

## Connect your backend

The `onSubmit(...)` handlers in `script.js` use a `fakeRequest` timer. Replace them with
your own `fetch()` calls. For the code step, send the six digits to your server and only
continue when it confirms them. Always validate on the server as well.

## Browser support

Latest Chrome, Edge, Firefox and Safari, desktop and mobile.

## License

Personal and commercial use allowed, including client work and products you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
