# Paper Origami — Login Template ("FOLD")

A warm, tactile paper-craft sign-in: a folded-corner sheet on a textured desk, floating paper
scraps, an origami crane that glides and flaps, screens that **unfold** into view and a paper
plane that takes off when the visitor signs in. Pure HTML, CSS and vanilla JavaScript — no
frameworks, no build step, no images.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Sign in | `#login` | Email + password with Show/Hide, remember me, inline "Forgot?" link, paper-plane button |
| Sign up | `#signup` | Name, email, password with a **fold-the-crane strength meter**, terms checkbox |
| Forgot password | `#forgot` | Single email field |
| Link sent | `#sent` | A paper plane loops along a dashed flight path into an envelope; resend countdown |

Open any screen directly with its hash, e.g. `index.html#signup`.

## Features

- Origami crane drawn with SVG polygons; every facet is shaded from one accent color
- **Choose your paper**: vermilion, indigo, teal or mustard — recolors the crane, buttons, scraps
  and folded corner, and is remembered in `localStorage`
- Password meter folds a mini crane piece by piece (5 folds) and says which fold you reached
- Paper plane launches from the button after signing in or sending a reset link
- Inline validation with friendly messages, shake on error, loading spinner
- Accessible: real labels, `aria-invalid` / `aria-describedby`, live regions, radio-group color picker
  with names, visible dashed focus, `prefers-reduced-motion` support; all paper colors keep text
  contrast at WCAG AA
- Responsive: two columns on desktop, compact crane + card on phones

## Files

```
index.html   all screens
style.css    all styles — variables at the top
script.js    navigation, validation, crane meter, paper picker, paper plane
```

## Customize colors

```css
:root {
  --paper: #c8432a;       /* accent paper */
  --paper-ink: #ffffff;   /* text on the accent (use dark text for light papers) */
  --bg: #f4ede1;  --sheet: #fffdf8;  --kraft: #dcc6a0;
  --ink: #2e2a26; --ink-soft: #645a50; --error: #b3261e;
}
[data-paper="indigo"] { --paper: #3557a6; }
```

To add a paper, add a `[data-paper="name"]` block in `style.css` and a matching radio + label in the
`.papers` fieldset in `index.html`.

## Customize fonts

Uses **Young Serif** (headings) and **Figtree** (text) from Google Fonts. Swap the `<link>` in
`index.html` and update `--font-display` / `--font-body`.

## Customize content

`FOLD_STEPS` at the top of `script.js` holds the five meter messages. The crane is plain SVG
`<polygon>`s in `index.html` — the classes `p-base`, `p-light`, `p-mid`, `p-dark`, `p-shade` and
`p-shadow` pick the facet shade.

## Connecting your backend

Each form calls `onSubmit(formId, handler)`. Replace `fakeRequest` with a `fetch` to your API and
put the success logic (redirect, store session) in the handler. Point the "terms" link to your real
page and remove its demo handler.

## License

Personal and commercial use allowed, including client projects. Reselling or
redistributing the template itself is not allowed. See `LICENSE.txt`.
