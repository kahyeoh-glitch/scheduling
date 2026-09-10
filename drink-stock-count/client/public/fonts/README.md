Drop the FunkisA font files here, named:

- `FunkisA-Bold.woff2` (and `.woff`)
- `FunkisA-Medium.woff2` (and `.woff`)
- `FunkisA-Regular.woff2` (and `.woff`)

`src/index.css` already declares `@font-face` rules pointing at these paths
with a bold-sans-serif fallback stack, so the dashboard renders correctly
before the files are added and picks them up automatically once they land
here — no code changes needed.
