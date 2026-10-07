# Retro Terminal — Login Template ("MAINFRAME/77")

A glowing CRT terminal for sign-in, registration and password recovery. It boots with a
BIOS sequence, has scanlines and a soft flicker, and includes a **working command line**.
Users can type `help`, `register` or `theme amber`, or press the function keys F1–F4.
Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step, no images.

## Screens

| Screen | Hash | Highlights |
|---|---|---|
| Login | `#login` | ASCII-art logo, "last login" line, `login:` / `password:` prompts, `[x]` remember checkbox |
| Register | `#signup` | Username, email, password with an **ASCII strength meter** (`[######----]  60% OK`), policy checkbox |
| Reset password | `#forgot` | `passwd --reset` style form |
| Token sent | `#sent` | Transmission log, resend countdown |

Open any screen directly with its hash, e.g. `index.html#signup`.

## Features

- Power-on animation, BIOS boot text, CRT scanlines, vignette and flicker
- Command line with history (`↑` / `↓`): `help`, `login`, `register`, `reset`,
  `theme green|amber|ice`, `whoami`, `date`, `clear` — easy to extend
- Function keys: **F1** login, **F2** register, **F3** recover, **F4** cycles phosphor color
- Three phosphor colors (green, amber, ice blue); the choice is remembered in `localStorage`
- Inline validation with terminal-style `ERR:` messages, a shake on errors and a loading cursor
- Accessible: real labels, `aria-invalid` / `aria-describedby`, live regions, visible focus,
  keyboard-only friendly, `prefers-reduced-motion` support
- Responsive from 320px phones to large desktops

## Files

```
index.html   all screens
style.css    all styles — theme variables at the top
script.js    boot text, navigation, validation, command line, phosphor switcher
```

## Customize colors

```css
:root {
  --phosphor: #33ff77;       /* main text and glow */
  --phosphor-dim: #22b552;   /* secondary text */
  --phosphor-rgb: 51, 255, 119;
  --screen: #03120a;         /* screen background */
  --bezel: #1b1d1a;          /* monitor frame */
  --error: #ff6b5b;
}
```

The amber and ice palettes are the `[data-phosphor="amber"]` and `[data-phosphor="ice"]`
blocks right below. Add your own block and append its name to `PHOSPHORS` in `script.js`.

## Customize fonts

Uses **JetBrains Mono** from Google Fonts. Swap the `<link>` in `index.html` and update
`--font`. Any monospace font works.

## Customize content

At the top of `script.js`:
- `SYSTEM_NAME` — shown by `whoami`
- `BOOT_LINES` — the boot sequence text
- `PHOSPHORS` — color themes cycled by F4

Add a command by adding a function to `COMMANDS`; whatever it returns is printed.
The ASCII logo is plain text inside `<pre class="ascii">` in `index.html` — generate your own
with any ASCII-art tool (remember to write `<` as `&lt;`).

## Connecting your backend

Each form calls `onSubmit(formId, handler)`. Replace `fakeRequest` with a `fetch` to your
API, and put the success logic (redirect, store session) in the handler.
Link the "acceptable use policy" anchor to your real policy page and remove its demo handler.

## License

Personal and commercial use allowed, including client projects. Reselling or
redistributing the template itself is not allowed. See `LICENSE.txt`.
