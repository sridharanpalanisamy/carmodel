# Classic Ford — The Heritage Collection

A responsive, image-led showcase of Ford automotive heritage, built with HTML, CSS and vanilla JavaScript.

## Live website
https://sridharanpalanisamy.github.io/carmodel/

## Features
- Editorial-style hero and heritage introduction.
- Searchable and filterable model collection.
- Interactive model detail profiles.
- Responsive layout for desktop, tablet and mobile.
- Seven-image archive gallery.
- Centralized image assets in `assets/images/`.

## Project structure
```
carmodel/
├── assets/
│   └── images/       # All project photographs and vehicle images
├── index.html        # Main showcase homepage
├── index.css
├── index.js
├── home.html         # Full model collection page
├── styles.css
├── about.html
├── about.css
├── contact.html
├── contact.css
├── car.js
└── README.md
```

## Image management
All image files are stored in `assets/images/`. Reference them from root-level HTML and JavaScript files using paths such as:

```html
<img src="assets/images/ford-mustang.png" alt="Ford Mustang">
```

When adding a new image, place it in that folder and use the same relative path convention.

## Run locally
Open `index.html` in a browser, or use the VS Code Live Server extension for a local development server.

## Technology
- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts (Playfair Display and DM Sans)
- GitHub Pages hosting
