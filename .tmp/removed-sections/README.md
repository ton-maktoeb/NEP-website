# Removed sections — parked for later

Sections pulled from `index.html` before the public launch, kept here so they can
go back in without rewriting them. Each `.html` file is the complete, unmodified
block: the comment header, the `<section>`, and everything inside it.

## What is in here

| File | Section | Why it was pulled | Safe to restore when |
|------|---------|-------------------|----------------------|
| `foundation.html` | The No Egg Foundation (`id="foundation"`) | The foundation is not set up yet, so the page was claiming something not yet true. | The foundation actually exists and the profit-share wording is accurate. |
| `evidence.html` | Backed by people who know the field (`id="evidence"`) | Awaiting approval from the Louis Bolk Institute to use their name and logo. | Louis Bolk gives written approval. |
| `backed-by-line.html` | The "Backed by the Louis Bolk Institute and Lekker Lupine." line under the impact calculator | Same reason as `evidence.html` — it made the same endorsement claim in smaller type. | Louis Bolk gives written approval. |
| `price-row.html` | The Price block ("Better for the planet. And, soon, for your wallet.") — the closing block of `#about` | Pulled ahead of launch (2026-08-17), price ambition not ready to publish. | The pricing story is ready to tell. |
| `middleware-password-gate.js` | The whole pre-launch password gate (Vercel Edge Middleware, was `middleware.js` in the repo root) | Site went public at launch (2026-08-24). | You want to gate a preview again: copy it back to `middleware.js`, restore `"@vercel/edge": "^1.2.1"` in package.json dependencies, and check the SITE_* env vars still exist in Vercel. |

## How to put one back

Paste the file's contents into `index.html` at the spot noted below. Order on the
page runs: `partner` (the call to action) then `contact` (last).

- **`foundation.html`** sat between `#partner` and `#evidence`. With `#evidence`
  also gone, it goes between `#partner` and `#contact`.
- **`evidence.html`** sat between `#partner` and `#contact`.

If both go back, the original order was `partner` -> `foundation` -> `evidence` -> `contact`.

`price-row.html` is not a section either. It was the last block inside `#about`
(after the seed/plant/table loop figure, right before the section's closing tag).
Its `.price-row` / `.price-img` layout rules still live in `responsive.css`, left
in place so a restore needs no CSS work. It uses `assets/price-scramble-bowl.jpg`,
which stays in the repo.

`backed-by-line.html` is not a section. It goes back inside `#solution`, as the last
child of the same `<div>` that holds the impact calculator — immediately before the
two `</div>` tags that close the section. It is a flex row holding a small yellow
dot and the sentence, so paste the whole block; the dot alone would be an orphan.

## Two things to watch when restoring

1. **The divider line.** `#evidence` in `evidence.html` carries
   `border-top:1px solid rgba(241,252,122,.16)`. That line exists because
   `foundation.html` (a white section) used to provide the visual break between
   two dark sections. If you restore `foundation.html`, the white block does that
   job again and the border on `#evidence` becomes unnecessary — drop it.
2. **`responsive.css` still lists both.** Line 44 has a mobile padding rule whose
   selector still includes `#evidence`, and it was deliberately left alone so a
   restore needs no CSS work. A selector naming a section that does not exist is
   harmless — it simply matches nothing.

## Also worth knowing

Nothing is lost even if this folder is deleted — both sections are in git history:

- Foundation: last present in commit `0a62fa5`
- Evidence: last present in commit `aee6a64`

Recover either with `git show <commit>:index.html`.
