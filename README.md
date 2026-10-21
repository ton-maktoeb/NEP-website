# NoEggPlant website

Right now the whole site is one image (a chicken in a cape riding an eggplant
rocket) on a black page: `index.html` plus `assets/chicken-on-eggplant.jpg`.
Hosted on Vercel, no build step.

## Getting the full site back

The complete earlier site (all sections, calculator, methodology page, contact
form) is saved under the git tag `site-before-chicken`. To look at it:

```bash
git checkout site-before-chicken
```

To put it live again, restore those files onto `main`:

```bash
git checkout site-before-chicken -- .
```

## Preview locally

```bash
npx serve .
```
