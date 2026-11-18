# Self-hosted 3D and 360° vehicle showroom

The showroom uses a locally hosted viewer. It does not embed Sketchfab or another third-party viewer.

## Current free 3D asset status

| Vehicle | Local asset | Status |
|---|---|---|
| Ford Model T | `assets/360/model_t.blend` → `public/models/ford-model-t.glb` | Available; locally rendered interactive 3D model |
| Ford Model A | — | Free exact-model asset pending |
| Ford V8 | — | Free exact-model asset pending |
| Ford Deluxe Coupe | — | Free exact-model asset pending |
| Ford Thunderbird | — | Free exact-model asset pending |
| Ford F-100 | — | Free exact-model asset pending |
| Ford Mustang (1965 reference) | — | Free exact-model asset pending |
| Ford GT40 | — | Free exact-model asset pending; exact variant and rights need confirmation |
| Ford Bronco | — | Free exact-model asset pending |
| Ford Falcon | — | Free exact-model asset pending |
| Ford Pinto | — | Free exact-model asset pending |

The Model T source mesh is a low-poly community model, not an official Ford factory scan. It is distributed under CC0. See `CREDITS.md` for source and license details.

## Interactive 3D model requirements

- Prefer free downloadable assets only; do not add paid models, subscriptions, or trial-only downloads.
- Verify that the asset depicts the exact vehicle and that its license permits downloading, modification, conversion, and website use.
- Host model files in this repository and load them through the locally bundled viewer. Do not use external embeds or remote viewer fallbacks.
- Record creator, source, license, attribution, and any modifications in `CREDITS.md`.
- Test the model's appearance, scale, materials, loading behavior, and mobile interaction before marking it ready.

## 360° turntable video requirements

A draggable 3D mesh is an interactive 3D viewer, not a 360° turntable video. For actual turntable footage, use a full exterior rotation of the exact vehicle and stated model year.

- MP4/H.264, preferably 1920×1080 or 1440×1080, 24–30 fps.
- 6–15 seconds, stable camera, consistent lighting, and centered vehicle.
- Keep the image sharp while optimizing file size for GitHub Pages.
- Store each video in this folder and connect its relative path in the relevant page code.
- If footage is rendered from a 3D asset, that asset's license must permit rendering and website use.

A single photograph, a cropped image, or a generic vehicle is not a genuine 360° view. Do not label an asset as exact or operational until it has been checked.
