# Image → ASCII

The headline feature: take a photograph (or any image) and convert it to ASCII art that you can re-colour, blend, animate, and export.

## Three ways to load an image

1. **📁 Open Image** button in the titlebar. Opens a native Windows file picker, remembers the last folder you browsed.
2. **Drag-drop** any image file from File Explorer onto the canvas. Works anywhere on the canvas; a full-screen dashed outline confirms the drop target.
3. **📁 Load image…** button inside the Inspector — only visible when the currently-selected layer is already an Image generator.

All three call the same code path. The first two **add a new layer** on top of your stack; the third **replaces the image on the currently-selected layer**.

## The three modes

After loading, the Inspector shows a **Mode** dropdown. Each gives a different look:

### Density (default)

The image's luminance maps to characters from the active charset, light to dense. Bright pixels become spaces or dots; dark pixels become `#`, `@`, `█`, etc.

![Density mode](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/img-mode-density.png)

Tune with **Contrast** (gamma) and **Brightness** (offset).

### Edges

Sobel edge detection. The output is a sketched line drawing using directional glyphs (`─ │ \ /`) chosen by the local gradient direction.

![Edges mode](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/img-mode-edges.png)

Tune with **Contrast** (which is interpreted as edge strength here).

### Dithered

Floyd–Steinberg dithering — error-diffuses brightness so that even with a small charset, smooth gradients render cleanly.

![Dithered mode](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/img-mode-dithered.png)

Best with low-character charsets (`Classic 10`, `Blocks`).

## The "Use image colors" toggle

Default: **on**. The Inspector samples a region of the original image per cell and emits that average colour for the glyph foreground. The output looks like the original photo, recoloured into characters.

**Off**: the glyph colours come from the active **palette** instead — a sepia-coloured image becomes a viridis-coloured rendering of the same photo.

### Tip: clicking a palette auto-disables this

If you click a palette in the Palettes panel while an Image layer is selected with "Use image colors" on, Asciidream automatically turns image-colors off — otherwise the palette click wouldn't be visibly effective. A toast confirms it; one `Ctrl+Z` restores both.

## Charset choice matters a lot

The same photo looks completely different depending on the charset:

| Charset | What you get |
|---|---|
| `Classic 10` | Quick, blocky, low-detail. Good for posters. |
| `Bourke 70` | The "classic" 70-character Paul Bourke ramp — natural-looking gradients. |
| `Braille` | **2×4 pixels per cell** — by far the highest detail. Best for photos. |
| `Blocks` (`░▒▓█`) | Posterized, retro. |
| `Quadrants` (`▘▝▖▌▞▛…`) | 2×2 per cell, smoother than blocks. |
| `Hex digits` | The Matrix on acid. |
| `Katakana` | Specifically The Matrix. |

Switch with one click in the Charsets panel (lower-left).

## Recommended combos

| Goal | Mode | Charset | Palette |
|---|---|---|---|
| Maximum detail | Density | Braille | Use image colours |
| Technical drawing of a fossil / object | Edges | Bourke 70 | Amber |
| Retro Game Boy photo | Dithered | Blocks | Game Boy DMG |
| High-contrast monochrome | Density + Contrast=2 | Quadrants | Paper white |
| Posterized portrait | Dithered | Classic 10 | PICO-8 |
| Trippy psychedelia | Density + Invert | Hex digits | Cyberpunk |

## Editing parameters with scrub-drag

In the Inspector, drag any label sideways. For an image:

- **Contrast** (0.2–4) — gamma; >1 darkens midtones, <1 lifts them.
- **Brightness** (-0.5–+0.5) — pre-shift before gamma.
- **Mode** — discrete dropdown.
- **Invert** — flip the density ramp.
- **Use image colors** — checkbox.

## What about the image when I switch generators?

Clicking a non-image generator in the Patterns panel **adds a new layer on top** rather than replacing the image. Your photo stays put on its own layer. Toggle its eye `●` to hide it, drag the new layer below it, or use the Opacity slider to fade between them.

## File limits

- Asciidream downsamples loaded images to 768 px on the long side before quantizing — works fine for any source up to ~4K.
- For GIF export specifically, the canvas is further downscaled to 480 px on the long side to keep the GIF small enough to pass through pywebview's IPC reliably. See [Export Formats](Export-Formats).
