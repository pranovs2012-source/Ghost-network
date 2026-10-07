# Internal tooling (not shipped to buyers)

| Tool | Use |
|---|---|
| `qa/check.js` | QA for one template: `node internal/tools/qa/check.js templates/<cat>/<nnn-theme> [--shots]` |
| `make_preview.py` | Generates `preview.html` (showcase page) for a template |
| `new_license.sh` | Writes `LICENSE.txt` from `LICENSE.template.txt` |
| `package.py` | Builds and verifies the buyer ZIP in `/downloads/` |
| `make_bundle.py` | Builds `/downloads/bundle-<n>.zip` from 10 template ZIPs |

Setup once per machine: `cd internal/tools/qa && npm install`.
`check.js` expects Playwright + Chromium (in this environment: `/opt/node-tools/node_modules/playwright`
and `/opt/pw-browsers/chromium`). Screenshots go to `$SHOTS_DIR` (default: `<tmp>/template-shots`).

## Conventions every template follows (the QA harness relies on them)

- Each screen: `<section class="screen" id="<name>" data-screen>`; the visible one has `.is-active`,
  the others have the `hidden` attribute.
- Navigation buttons: `data-goto="<screen-id>"`. Every screen also opens from the URL hash (`index.html#settings`).
- Login templates use `#login-form`, `#signup-form`, `#forgot-form`, a `#sent` confirmation screen and a `.toast`.
- `:root` color variables at the very top of `style.css`.
- No external assets except Google Fonts; icons are inline SVG.

## Per-template workflow

1. Build `index.html`, `style.css`, `script.js`.
2. `python3 internal/tools/make_preview.py ...` and `sh internal/tools/new_license.sh <folder> "<Theme>"`.
3. `node internal/tools/qa/check.js <folder> --shots` — must print `all checks passed`; review the screenshots.
4. Write `README.md`, then `python3 internal/tools/package.py <folder>`.
5. Update `internal/CATALOG.md`; every 10 templates write `internal/bundles/bundle-<n>.md` and run `make_bundle.py`.
6. Commit `Add <category> #<number>: <theme>` and push.
