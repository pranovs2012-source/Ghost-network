# Aurora Glass — Login Template

A glassmorphism authentication kit: a frosted glass card floating over a slowly drifting
aurora, with a brand/pitch panel on desktop. Pure HTML, CSS and vanilla JavaScript —
no frameworks, no build step. Open `index.html` in any modern browser.

## Screens

| Screen | URL hash | What it does |
|---|---|---|
| Sign in | `#login` | Email + password, show/hide password, "keep me signed in", magic-link & passkey buttons |
| Sign up | `#signup` | Name, email, password with live 4-step strength meter, terms checkbox |
| Forgot password | `#forgot` | Email field, sends you to the confirmation screen |
| Check your inbox | `#sent` | Animated check mark, shows the entered email, 30-second resend countdown |

You can link straight to any screen, e.g. `index.html#signup`.

## Features

- Animated aurora background and rotating light sheen on the card edge — CSS only
- Frosted glass surfaces using `backdrop-filter`
- Inline validation with friendly messages, `aria-invalid` and `aria-describedby`
- Shake animation on invalid submit, loading spinner on buttons
- Password show/hide toggle and strength meter
- Toast notifications for demo actions
- Fully responsive: two-column layout on desktop, single focused card on mobile
- Accessible: real `<label>`s, visible focus rings, keyboard friendly, focus moves to the
  heading of each new screen, respects `prefers-reduced-motion`
- No images — icons are inline SVG, everything else is CSS

## Files

```
index.html   markup for all screens
style.css    all styles (theme variables at the very top)
script.js    navigation, validation and demo behaviour
```

## Customize colors

All colors live in the `:root` block at the top of `style.css`:

```css
:root {
  --bg-1: #070b1a;        /* page background */
  --aurora-1: #6d7cff;    /* aurora blob colors */
  --aurora-2: #22d3ee;
  --aurora-3: #c084fc;
  --glass-bg: rgba(18, 24, 52, 0.55);   /* card fill */
  --accent: #8b9bff;      /* links, focus, primary button */
  --accent-2: #5eead4;
  --danger: #ff8fa3;      /* error messages */
  ...
}
```

Try `--aurora-1: #f472b6; --aurora-2: #fb923c; --aurora-3: #facc15;` for a warm sunset look.
Keep text colors light (or switch them to dark along with `--glass-bg`) so contrast stays readable.

## Customize fonts

The template uses **Sora** (headings) and **Plus Jakarta Sans** (body) from Google Fonts.
To change them:

1. Replace the Google Fonts `<link>` in the `<head>` of `index.html`.
2. Update `--font-display` and `--font-body` in `style.css`.

## Change the text and brand

- Brand name and logo: the `.brand` block in `index.html` (the logo is a small inline SVG).
- Marketing copy, stats and testimonial: the `<aside class="pitch">` section (hidden on mobile).

## Connect your backend

`script.js` simulates requests with `fakeRequest(1200)`. Replace the three
`handleSubmit(...)` callbacks at the bottom of the file with your own `fetch()` calls,
for example:

```js
handleSubmit(document.getElementById('login-form'), function (form) {
  fetch('/api/login', { method: 'POST', body: new FormData(form) })
    .then(function (r) { if (r.ok) location.href = '/app'; });
});
```

Always validate passwords and emails on your server as well — browser validation is for
convenience only.

## Browser support

Latest Chrome, Edge, Firefox and Safari (desktop and mobile). Browsers without
`backdrop-filter` show a solid translucent card instead.

## License

Personal and commercial use allowed, including client projects and products you sell.
Reselling or redistributing the template itself is not allowed. See `LICENSE.txt`.
