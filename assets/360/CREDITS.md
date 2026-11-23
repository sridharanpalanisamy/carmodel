# Self-hosted 3D and 360° showroom credits and rights

The interactive viewer and its 3D assets are hosted in this repository. No third-party embedded viewer is used.

## Ford Model T — locally hosted 3D mesh

- Asset source: [Ford Model-T — OpenGameArt](https://opengameart.org/content/ford-model-t)
- Creator: egore911
- Original file: `model_t.blend`
- Repository copy: `assets/360/model_t.blend`
- Converted file: `public/models/ford-model-t.glb`
- License shown on the source page: CC0 (Creative Commons Zero)
- Source description: low-poly Ford Model T model (approximately 2k)
- Conversion: Blender glTF exporter, using the repository workflow in `.github/workflows/convert-blend-to-glb.yml`
- Modifications: converted from Blender format to GLB for local browser rendering
- Rights checked: 18 November 2026

The model is a community-created low-poly representation, not an official Ford factory scan or a photogrammetry capture. CC0 applies to the creator's contribution; it does not imply endorsement by or affiliation with Ford.

## Free candidate sources — not imported

The following are advertised as free downloadable CC BY models. They are not included in the repository yet; a free account is required to download Sketchfab assets. Confirm the license on the download page and retain attribution in the published website before use.

- Ford Model A V2 — Libau Media: https://sketchfab.com/3d-models/ford-model-a-v2-downloadable-7c5b1727026b407baa67a10ba9e2be23
- Ford Thunderbird '66 — Aidan6604: https://sketchfab.com/3d-models/ford-thunderbird-66-free-model-0a71cb1edcca4c269309fc063a6d63f1
- Old Ford F-100 — jtressle: https://sketchfab.com/3d-models/old-ford-f-100-fa7387fe41294eed8457ca14e0e8f7ab
- Ford F-100 1966 — Nieve5677: https://sketchfab.com/3d-models/ford-f-100-1966-208b8b0dfcad414481ad4d99535e8af3
- 1965 Ford Mustang — Libau Media: https://sketchfab.com/3d-models/1965-ford-mustang-46e5bb2562f2423faedfe3f5ea0444f3
- Ford Falcon GT 1973 — Tom Zimmermann: https://sketchfab.com/3d-models/ford-falcon-gt-1973-13d628c752db4ae0acb755e3ba927aa0
- Ford Falcon EA 1988 — Nieve5677: https://sketchfab.com/3d-models/ford-falcon-aumk5-ea-1988-3246c34c335f4b30b6e825043405ab18

Excluded candidate: 2021 Ford Bronco by Ddiaz Design is listed under CC BY-NC-SA and is based on a Forza Customs model. It is not cleared for this project's intended reuse. Paid Pinto and Deluxe Coupe listings are not acceptable substitutes.

## Other vehicles

No other 3D model or turntable video is cleared for use at this time. Do not add paid models, subscription-only assets, or assets whose license does not permit the intended website use.

For every future asset, record:
- Exact vehicle and model year / variant
- Local filename
- Creator / renderer
- Original source of any 3D asset used
- License or written permission allowing modification, rendering, and website use
- Required attribution and modifications
- Date rights were checked

Do not add footage unless it depicts the exact vehicle and the rights permit its intended use. No third-party viewer should be reintroduced as a fallback.


## 1967 Ford Mustang Fastback — owner-supplied GLB

- Creator: Mark Peters — https://sketchfab.com/mark-peters
- Source: https://sketchfab.com/3d-models/1967-ford-mustang-fastback-4096px2-02933292f4d64a52a9bec5923e24b0af
- License embedded in original GLB: CC BY 4.0
- Intended local file: `public/models/ford-mustang-1967.glb`
- Optimization: 4096px textures reduced to 2048px; opaque color maps encoded as JPEG; normal/data maps retained as PNG; mesh geometry unchanged.
- Size: 52.64 MB original → 31.96 MB optimized.
- Status: optimized and validated; locally hosted at `public/models/ford-mustang-1967.glb`.

## 1973 Ford Falcon GT — owner-supplied GLB

- Creator: Tom Zimmermann — https://sketchfab.com/tomm8
- Source: https://sketchfab.com/3d-models/ford-falcon-gt-1973-13d628c752db4ae0acb755e3ba927aa0
- License embedded in original GLB: CC BY 4.0
- Intended local file: `public/models/ford-falcon-gt-1973.glb`
- Optimization: textures reduced to 1024px; opaque color maps encoded as JPEG; normal/data maps retained as PNG; mesh geometry unchanged.
- Size: 84.06 MB original → 13.77 MB optimized.
- Status: optimized and validated; awaiting addition of the binary to the repository.

The Mustang GLB is now committed at `public/models/ford-mustang-1967.glb` and mirrored in `assets/360/` (15,822,600 bytes in the repository). The Falcon GT binary is not yet committed. The optimized GLBs preserve the original mesh geometry and face counts. Reduced texture resolution is a deliberate loading-performance trade-off. Provide creator attribution and a link to the CC BY 4.0 source pages wherever the models are displayed.
