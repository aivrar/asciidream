## Asciidream v1.0.1 — Palette-by-position bug fix

Quick patch:

- **Fix**: `palette-by-pos` colour mode was using `idx >> 16` which collapsed to 0 for any realistic canvas size, so palette-by-pos always rendered as `palette[0]` (typically black). Now correctly spreads colours across positions.
- **Refresh**: regenerated all README / wiki screenshots with the fix in place — colour-by-position now looks vibrant.

Everything from v1.0.0 still applies; see below.

---

## Asciidream v1.0.0 — Initial release

Single-file portable Windows executable. Download `Asciidream.exe`, double-click, no install.

### Highlights

- **Image → ASCII**: drag any PNG/JPG onto the canvas, tune contrast / mode / charset.
- **35+ generators** across Noise, Fractals, Cellular Automata, Geometric, Particle, Typographic categories.
- **Layers** with 17 blend modes, opacity, drag-reorder, multi-select.
- **Animation** with `Animate` toggle per layer plus an `Animate all visible` shortcut. Wiggle / speed dials.
- **Real animated GIF export** (inline GIF89a encoder).
- **Static exports**: TXT, ANSI, SVG, PNG, HTML, Markdown, JSON, `.glyph` projects.
- **Scrub-drag inputs** — Figma-style label drag, mouse-wheel, Shift = 10×, Alt = 0.1×.
- **Built-in coach** that suggests next steps based on your current layer.
- **Custom dark titlebar** with a dedicated red `⏻ Shutdown` button.

### Install

1. Download `Asciidream.exe` below.
2. Run.
3. There is no step three.

### Requirements

Windows 10 / 11 x64 with WebView2 Runtime (preinstalled on Windows 11; available via Edge on Windows 10).

### Known limits in v1.0.0

- GIF export downscales to max 480 px on the long side (large files chewed through pywebview's IPC).
- Some Unicode-heavy charsets (Braille, Box drawing) need a font with glyph coverage — Cascadia Code / DejaVu Sans Mono recommended.
- L-System custom rule editor accepts axioms A–Z only.
