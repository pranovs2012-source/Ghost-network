# Brutalist — Login Template ("SYSTEM/LOGIN")

A loud, honest, hard-edged authentication kit: thick black borders, hard offset shadows,
acid yellow highlights, a scrolling marquee, slapped-on stickers and giant type that
changes for every screen. It is also genuinely practical: Caps Lock warnings, a live
username availability check, a password rule checklist and an attempt counter.
Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step.

## Screens

| Screen | Hash | Giant word | Highlights |
|---|---|---|---|
| Sign in | `#login` | LOG IN. | Numbered fields, show/hide, Caps Lock warning, attempt counter |
| Create account | `#signup` | JOIN NOW. | Username availability check, 3-rule password checklist, terms |
| Lost it? | `#forgot` | RESET. | Email field |
| Sent. | `#sent` | DONE ✓ | Monospace "receipt", resend timer |

Open any screen with its hash, e.g. `index.html#signup`.

## Features

- **Invert** button flips the whole page to white-on-black (remembered between visits)
- **Caps Lock warning** appears under password fields while Caps Lock is on
- **Username check**: lowercases and strips invalid characters as you type, then shows
  AVAILABLE / TAKEN after a short pause (demo list: `admin`, `root`, `system`, `user`, `test`, `login`)
- Inputs turn acid yellow and "press in" on focus; buttons physically press into their shadow
- Inline validation with blunt messages, `aria-invalid`, `aria-describedby`, shake on error
- Scrolling marquee, wiggling stickers, slam-in headline
- Responsive: masthead beside the form on desktop, stacked on phones (the new screen scrolls into view)
- Accessible: real labels, thick visible focus outlines, keyboard friendly, focus moves to the
  new screen heading, `prefers-reduced-motion` support

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    navigation, validation, caps lock, username check, invert mode
```

## Customize colors

```css
:root {
  --paper: #f1efe7;        /* background */
  --ink: #0a0a0a;          /* text, borders, shadows */
  --acid: #e4ff3c;         /* highlight */
  --hot: #ff4f1f;          /* stickers, error shadows */
  --error-text: #b52a00;
  --link: #2323e0;
  --border: 3px;           /* border thickness */
  --shadow: 6px;           /* hard shadow offset */
}
[data-mode="inverted"] { /* the inverted palette */ }
```

Try `--acid: #ff7ad9` (hot pink) or `--acid: #7af7ff` (ice blue) for a different mood.

## Customize fonts

Uses **Archivo Black** (headlines, buttons) and **Space Mono** (everything else) from Google
Fonts. Swap the `<link>` in `index.html` and update `--font-display` / `--font-mono`.

## Customize content

- Marquee text: the two identical `<span>`s inside `.marquee__track` (keep them identical for a seamless loop).
- Giant words per screen: `BIG_WORDS` at the top of `script.js`.
- Taken usernames (demo): `TAKEN_USERNAMES` in `script.js` — replace the check with a request to your API.
- Max attempts shown in the counter: `MAX_ATTEMPTS`.

## Connect your backend

Replace the `fakeRequest(...)` handlers in `onSubmit(...)` at the bottom of `script.js` with
`fetch()` calls. Enforce attempt limits and username uniqueness on your server.

## License

Personal and commercial use allowed, including client work and products you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
