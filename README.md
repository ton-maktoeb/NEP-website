# NoEggPlant website

Marketing site for NoEggPlant — a plant-based egg scramble made from lupin.

Built as a plain **static website**: HTML, CSS, and one JavaScript file. No build
step and no framework, so it can be hosted anywhere that serves static files
(this one is deployed on Vercel).

## Files

| File / folder      | What it is                                                      |
|--------------------|----------------------------------------------------------------|
| `index.html`       | The main page (hero, problem, solution, product, story, CTA).  |
| `methodology.html` | The "how we calculate our impact" page.                        |
| `styles.css`       | Brand colours and the self-hosted Poppins font.                |
| `main.js`          | All interactivity (impact calculator, carousel, sticky nav…).  |
| `assets/`          | Images, videos, and the custom cursor.                         |
| `fonts/`           | Poppins font files.                                            |

## Editing the site

Everything is hand-editable. To preview locally you need [Node.js](https://nodejs.org):

```bash
npx serve .
```

Then open the address it prints (usually http://localhost:3000).

## Notes

- The contact form currently shows a thank-you message but does **not** send email
  yet. Wire it to a form service (e.g. Formspree) to receive messages.
- The hero's left video and the "problem" photo are loaded from Pexels (free stock).
  Swap in your own footage in `index.html` when ready.
- Impact figures (nitrogen saved) are provisional, pending confirmation with the
  Louis Bolk Institute — see `methodology.html`. 
