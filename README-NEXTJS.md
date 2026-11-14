# Classic Ford — Next.js migration

The site is being migrated to Next.js App Router with static export for GitHub Pages.

## Routes
- /carmodel/ — Home
- /carmodel/models/ — Model archive
- /carmodel/heritage/ — Heritage
- /carmodel/contact/ — Contact

## Development
```bash
npm install
mkdir -p public
cp index.css pages.css public/
cp -R assets public/assets
mkdir -p public/scripts
cp index.js models.js public/scripts/
cp assets/js/local-3d-viewer.js public/scripts/
npm run dev
```

The approved existing HTML markup and CSS are retained during this first migration phase to protect the checked design. The interactive scripts continue to run locally; no third-party 3D viewer is introduced.

## Production
GitHub Actions builds the static export into `out/` and deploys it to GitHub Pages.
