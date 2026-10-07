# Synthwave — Login Template ("NIGHTDRIVE")

An 80s retrowave sign-in experience: a striped neon sun, wireframe mountains, palm
silhouettes and an endless grid you drive across. Screens switch with a VHS tracking glitch,
and the **cassette deck really plays** — a synthwave loop generated live in the browser.
Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step, no images or audio files.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Sign in | `#login` | Neon-bordered card, show/hide password, "fast lane" switch |
| Sign up | `#signup` | Driver name, email, password with a 10-bar **equalizer strength meter**, club-rules checkbox |
| Forgot password | `#forgot` | Single email field |
| Link sent | `#sent` | Floating neon envelope, resend countdown |

Open any screen directly with its hash, e.g. `index.html#signup`.

## Features

- Animated scene: twinkling stars, striped sun, driving perspective grid, VHS scanlines and tracking bar
- VHS glitch transition between screens, plus a REC indicator and a live VCR clock (forever in 1986)
- Cassette deck: play / pause / previous / next, spinning reels, animated equalizer, tape counter.
  Music is synthesized with the Web Audio API (arpeggio, bass, pads, drums) and only starts when
  the visitor presses play; it pauses when the tab is hidden
- Two palettes — **Sunset** (pink / orange) and **Midnight** (cyan / violet) — remembered in `localStorage`
- Inline validation with friendly messages, shake on error, loading spinner
- Accessible: real labels, `aria-invalid` / `aria-describedby`, live regions, labelled icon buttons,
  visible focus, `prefers-reduced-motion` support (glitches and animations off)
- Responsive: two columns on desktop; on phones the card comes right after the logo

## Files

```
index.html   all screens
style.css    all styles — palette variables at the top
script.js    navigation, validation, meter, palette, VCR clock, music synth
```

## Customize colors

```css
:root {
  --sky-1: #12002b;  --sky-2: #3d0a5c;  --sky-3: #a3216e;  --sky-4: #ff7a59;  /* sky, top to horizon */
  --sun-1: #ffe66b;  --sun-2: #ff3fa4;                                         /* sun gradient */
  --neon: #ff4fd8;   --neon-2: #ffb86b;  --cyan: #3ff5ff;                      /* neon accents */
  --grid: #ff4fd8;   --floor: #12001f;
  --horizon: 62%;    /* height of the horizon line */
}
[data-palette="midnight"] { /* second palette */ }
```

Add more palettes with another `[data-palette="name"]` block and list the name in `PALETTES`
in `script.js`.

## Customize fonts

Uses **Kanit** (text, logo) and **Mr Dafoe** (neon script) from Google Fonts. Swap the `<link>` in
`index.html` and update `--font` / `--font-script`.

## Customize the music

`TRACKS` at the top of `script.js` holds each song's name, tempo (`bpm`) and four chords written as
MIDI note numbers (60 = middle C). Remove the `.deck` section from `index.html` if you don't want music.

## Connecting your backend

Each form calls `onSubmit(formId, handler)`. Replace `fakeRequest` with a `fetch` to your API and
put the success logic (redirect, store session) in the handler. Point the "club rules" link to
your real terms page and remove its demo handler.

## License

Personal and commercial use allowed, including client projects. Reselling or
redistributing the template itself is not allowed. See `LICENSE.txt`.
