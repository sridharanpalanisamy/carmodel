# Self-hosted 360° vehicle showroom

The local showroom selector now lists all 11 vehicles in the Classic Ford collection. It never embeds Sketchfab or another third-party viewer.

**Important: no actual 360° media files have been added yet.** All eleven entries currently show a clear placeholder until their matching, locally hosted turntable assets are produced and added. A selector entry is not a claim that a working 360° model exists.

| Vehicle | Required local filename | Current status |
|---|---|---|
| Ford Model T | `ford-model-t.mp4` | Footage pending |
| Ford Model A | `ford-model-a.mp4` | Footage pending |
| Ford V8 | `ford-v8.mp4` | Footage pending |
| Ford Deluxe Coupe | `ford-deluxe-coupe.mp4` | Footage pending |
| Ford Thunderbird | `ford-thunderbird.mp4` | Footage pending |
| Ford F-100 | `ford-f100.mp4` | Footage pending |
| Ford Mustang (1965 reference) | `ford-mustang-1965.mp4` | Footage pending |
| Ford GT40 | `ford-gt40-1964.mp4` | Footage pending; exact variant and rights need confirmation |
| Ford Bronco | `ford-bronco.mp4` | Footage pending |
| Ford Falcon | `ford-falcon.mp4` | Footage pending |
| Ford Pinto | `ford-pinto.mp4` | Footage pending |

## Asset requirements

- Full exterior 360° rotation of the exact vehicle and stated model year.
- MP4/H.264, preferably 1920×1080 or 1440×1080, 24–30 fps.
- 6–15 seconds, stable camera, consistent lighting and centered vehicle.
- Keep the image sharp while optimizing file size for GitHub Pages.
- Store each file in this folder and connect its relative path in `index.js`.
- Record creator, source, license/permission and attribution in `CREDITS.md`.

A single photograph, a cropped image, or a generic vehicle is not a genuine 360° view. If footage is rendered from a 3D asset, that asset must match the vehicle and its license must permit modification, rendering and website use. Do not use third-party embedded viewers or remote viewer fallbacks.
