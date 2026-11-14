# Classic Ford — The Heritage Collection

A responsive editorial-style showcase of Ford automotive heritage, built with HTML, CSS and vanilla JavaScript.

## Live website
https://sridharanpalanisamy.github.io/carmodel/

## Design direction
The interface uses an editorial automotive layout inspired by the supplied visual reference:
- Soft lavender-grey canvas and thin modular grid lines.
- High-contrast black typography with a vivid orange accent.
- Large vehicle photography and asymmetric two-column composition.
- Compact innovation tiles, featured vehicle panels and curated model cards.
- Responsive navigation and stacked mobile layouts.

## Features
- Image-led homepage with curated Ford highlights.
- Searchable model collection with eleven vehicle profiles.
- Heritage timeline and motorsport feature.
- Responsive layouts for desktop, tablet and mobile.
- Centralized image assets in `assets/images/`.

## Project structure
```
carmodel/
├── assets/
│   └── images/       # All project photographs and vehicle images
├── index.html        # Editorial homepage
├── index.css         # Homepage design system
├── index.js          # Homepage navigation behavior
├── home.html         # Searchable vehicle collection
├── pages.css         # Shared inner-page design system
├── about.html        # Ford heritage and timeline
├── contact.html      # Feedback/contact information
├── styles.css        # Legacy stylesheet (retained)
├── about.css         # Legacy stylesheet (retained)
├── contact.css       # Legacy stylesheet (retained)
├── car.js            # Legacy script (retained)
└── README.md
```

## Image management
All vehicle images are stored in `assets/images/`. Reference them from root-level HTML and CSS files using relative paths, for example:

```html
<img src="assets/images/ford-mustang.png" alt="Ford Mustang">
```

When adding a photograph, place it in that folder and follow the same path convention.

## Run locally
Open `index.html` in a browser, or use the VS Code Live Server extension.

## Technology
- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts (Manrope and DM Sans)
- GitHub Pages
