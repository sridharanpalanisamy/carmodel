# Self-hosted 3D and 360° vehicle showroom

The showroom uses a locally hosted viewer. It does not embed Sketchfab or another third-party viewer.

## Current free 3D asset status

| Vehicle | Local asset | Status |
|---|---|---|
| Ford Model T | `assets/360/model_t.blend` → `public/models/ford-model-t.glb` | Available; locally rendered interactive 3D model |
| 1967 Ford Mustang Fastback | `assets/360/1967_ford_mustang_fastback_-_4096px2-compressed (1).glb` → `public/models/ford-mustang-1967.glb` | Available; locally rendered interactive 3D model (15.82 MB) |
| Ford Model A | — | Free CC BY candidate found; download and inspect pending |
| Ford V8 | — | Exact free Ford V8 car body not yet cleared |
| Ford Deluxe Coupe | — | Exact free model not found; paid results excluded |
| Ford Thunderbird | — | Free CC BY candidates found; download and inspect pending |
| Ford F-100 | — | Free CC BY candidates found; download and inspect pending |
| Ford Mustang (1965 reference) | — | Free CC BY candidate found; download and inspect pending |
| Ford GT40 | — | Free exact-model asset pending; exact variant and rights need confirmation |
| Ford Bronco | — | Search result found, but CC BY-NC-SA restriction excludes it from the approved list |
| Ford Falcon | — | Free CC BY candidates found; download and inspect pending |
| Ford Pinto | — | Exact free model not found; paid results excluded |

The Model T source mesh is a low-poly community model, not an official Ford factory scan. It is distributed under CC0. See `CREDITS.md` for source and license details.

## Free candidate research (not yet added to the website)

The following Sketchfab pages advertise free downloadable models under CC BY. These are research leads only: no files have been imported, visually inspected, or marked ready. Sketchfab's download API requires an authenticated account. Download the original asset, retain its creator attribution, and inspect its source files and license before adding it.

- Model A: [Ford Model A V2 — Libau Media](https://sketchfab.com/3d-models/ford-model-a-v2-downloadable-7c5b1727026b407baa67a10ba9e2be23)
- Thunderbird: [Ford Thunderbird '66 — Aidan6604](https://sketchfab.com/3d-models/ford-thunderbird-66-free-model-0a71cb1edcca4c269309fc063a6d63f1)
- F-100: [Old Ford F-100 — jtressle](https://sketchfab.com/3d-models/old-ford-f-100-fa7387fe41294eed8457ca14e0e8f7ab) and [Ford F-100 1966 — Nieve5677](https://sketchfab.com/3d-models/ford-f-100-1966-208b8b0dfcad414481ad4d99535e8af3)
- Mustang: [1965 Ford Mustang — Libau Media](https://sketchfab.com/3d-models/1965-ford-mustang-46e5bb2562f2423faedfe3f5ea0444f3)
- Falcon: [Ford Falcon GT 1973 — Tom Zimmermann](https://sketchfab.com/3d-models/ford-falcon-gt-1973-13d628c752db4ae0acb755e3ba927aa0) and [Ford Falcon EA 1988 — Nieve5677](https://sketchfab.com/3d-models/ford-falcon-aumk5-ea-1988-3246c34c335f4b30b6e825043405ab18)

A 2021 Bronco community model was found, but its CC BY-NC-SA licence is not cleared for commercial reuse and it is excluded pending a suitable alternative. Free Ford Pinto and Deluxe Coupe exact-model assets were not found in this search; paid listings are not acceptable substitutes.

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


## Additional free candidates found (18 November 2026)

These are exact Ford-branded community model listings with permissive free licenses. They are **not yet installed**: the files still need to be downloaded, inspected in Blender, checked for texture integrity, and converted to optimized GLB before appearing in the local viewer.

- **1957 Ford Thunderbird** — Riley_Lowe, BlendSwap, CC0. The creator notes that rear topology is rough and the interior is limited, so inspect before use: https://blendswap.com/blend/6043
- **Ford Mustang GT (approx. 2016)** — koumis, BlendSwap, CC0. The uploader describes the year as approximate: https://blendswap.com/blend/21904
- **1968 Mustang GT Fastback** — Tryder, BlendSwap, CC0. Search the exact title on BlendSwap and confirm the asset page before download.
- **1985 Ford Bronco** — computergeekman, BlendSwap, CC BY-SA. Commercial use is not excluded, but attribution and share-alike obligations apply to adaptations: https://blendswap.com/3d/offroad

The BlendSwap download pages are currently not accessible to the automation session (HTTP 403). No model binaries were retrieved or copied into this repository in this pass. Do not mark these as ready until the actual files are inspected and locally hosted.


## Further Ford-specific candidates verified on BlendSwap (18 November 2026)

These listings have identifiable Ford models and stated free licenses. They remain **candidate downloads only**; no source binaries were accessible to this automated session, so none are marked as installed.

| Model | Creator | Listing license | Notes |
|---|---|---|---|
| 1969 Ford Mustang Boss 429 | shontoloyo | CC0 | Creator warns the model may not be fully accurate due to limited reference blueprints; inspect before using: https://blendswap.com/blend/15616 |
| 1957 Ford Thunderbird custom build | rianvermeulen | CC0 | Customised 1957 Thunderbird, not stock-original specification: https://blendswap.com/blend/12654 |
| 1950s Ford F-100 pickup | MajorNightmare | CC BY | Attribution required; inspect whether it matches the desired F-100 generation: browse https://blendswap.com/3d/truck-ford |
| 1985 Ford Bronco (untextured) | computergeekman | CC BY-SA | Attribution and share-alike obligations apply; untextured asset: browse https://blendswap.com/3d/truck-ford |
| Ford Model A | lovelyfish75 | CC BY | Exact individual asset page not resolved in this research pass; browse https://blendswap.com/3d/ford |

Additional Mustang listings include a 1968 Mustang GT Fastback and a Ford Mustang GT, both shown as CC0 in BlendSwap's Mustang catalogue: https://blendswap.com/3d/ford-mustang. Their individual files still require retrieval and inspection.

BlendSwap's individual listing pages expose previews and license labels, but downloads returned HTTP 403 to the automation session. A listing or license label alone does not prove that the downloaded archive is intact, correctly textured, or suitable for this site's presentation. Do not copy these candidates into `public/models` until the files have been inspected and attribution/license records completed.


## Owner-supplied additional 3D models (18 November 2026)

Two Ford-specific GLB files were supplied and inspected. Both are valid GLB 2.0 scenes and have been texture-optimized while preserving their mesh geometry:

| Vehicle | Creator / license | Original | Optimized | Repository path | Status |
|---|---|---:|---:|---|---|
| 1967 Ford Mustang Fastback | Mark Peters · CC BY 4.0 | 52.64 MB | 31.96 MB | `public/models/ford-mustang-1967.glb` | Optimized; binary awaiting repository upload |
| 1973 Ford Falcon GT | Tom Zimmermann · CC BY 4.0 | 84.06 MB | 13.77 MB | `public/models/ford-falcon-gt-1973.glb` | Optimized; binary awaiting repository upload |

The homepage currently exposes the locally committed 1967 Mustang Fastback and Model T in its model picker. The 1967 Mustang GLB is present in both `assets/360/` and `public/models/` (15.82 MB). The 1973 Falcon GT GLB is not yet present in `public/models/`, so it remains unavailable in the picker until its binary is added. The viewer checks for that file before exposing the Falcon option. See `CREDITS.md` for creator links and optimization details.
