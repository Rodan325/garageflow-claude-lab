# Branding / white-label layer

The app is skinned at runtime by a brand config. The **default** brand is
Clikarage and reproduces the current UI exactly (no color/favicon/title
override). Everything is reversible and driven by config — there is **no
hard-coded brand name** in the app.

## Activate the Speedy demo

The app uses **HashRouter**, so demo URLs carry the `#` fragment:

- **Activate:** `https://<host>/#/demo/speedy`
- **Leave / reset:** `https://<host>/#/demo/reset`

Alternatives:

- `?brand=speedy` on any URL (e.g. `https://<host>/?brand=speedy#/login`) — the
  param is stripped on reset so a refresh cannot re-activate it.
- `VITE_BRAND=speedy` for a **dedicated build/preview only** — never set this on
  the production Vercel project.

Without any of the above, the app is byte-for-byte the default Clikarage.

## Reset procedure (single source of truth)

`exitBrandDemo()` (imperative) and the context `exitDemo()` both: remove
`gf-brand`, strip the `brand` URL param via `history.replaceState`, clear the
selected center, and restore the default title, favicon, theme-color and CSS
vars. It is wired to `/#/demo/reset`, the "Revenir à Clikarage" button in the
demo disclaimer. Persistent reset controls are intentionally absent from
presentation accounts. After reset + refresh, no Speedy element remains.

## Assets & PWA manifest

- No official Speedy logo is bundled: `SpeedyLogo` is a **placeholder zone** and
  colors are an approximation. To use an authorized asset, set `logoUrl` /
  `logoComponent` on the Speedy brand — used only in the dedicated demo mode.
- The **PWA manifest stays the main product's** for this version (it is not
  brand-swapped, to avoid embedding an unauthorized logo). This is intentional
  and does not block the demo, which runs from the in-browser skin.
