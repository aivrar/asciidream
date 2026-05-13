# Modifiers

A **modifier** is a post-process applied to a single layer's output, between the generator and the layer-blend step. Stack as many as you want; they run top-down.

The Modifiers panel sits below the Inspector on the right:

![Modifiers panel](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/modifiers-panel.png)

## Adding modifiers

1. Pick a modifier from the dropdown.
2. Click **+ Add**.
3. The row appears below with its parameters exposed as scrub-drag controls.
4. Use **↑** / **↓** to reorder, **×** to remove.

Multiple modifiers compound — each runs on the output of the previous one.

## The 13 bundled modifiers

| Modifier | Params | What it does |
|---|---|---|
| **Shift** | `dx`, `dy`, `wrap` | Pan the grid horizontally / vertically. With wrap, content wraps around. |
| **Mirror** | `axis` (h / v / both) | Flip horizontally, vertically, or both. |
| **Kaleidoscope** | `folds` | N-fold radial symmetry around the canvas centre. 2–24 folds. |
| **Invert density** | — | Flip the density ramp — light chars become dense chars. |
| **Threshold** | `value` | Binarize: cells below the threshold become space, cells above become the densest char. |
| **Dither (Floyd-Steinberg)** | `levels` | Error-diffusion dithering to a small number of levels. Use with the active charset ramp. |
| **Ripple** | `amp`, `freq` | Sinusoidal column offset → wave distortion. |
| **Twirl** | `strength`, `radius` | Angular swirl around the centre. |
| **Re-charset** | — | Re-quantize using the active charset (handy after blending layers with different charsets). |
| **Noise jitter** | `amount` | Randomly nudge cells up or down the ramp. Adds organic texture. |
| **Erode** | `iterations` | Morphological erosion — non-space cells next to spaces become space. |
| **Dilate** | `iterations` | Opposite of erode — non-space cells leak into adjacent spaces. |
| **Pixel sort** | `axis`, `threshold` | Sort runs of pixels above the threshold by luminance. Glitch aesthetic. |

## Recommended stacks

**Mirror everything**
- `Mirror` (axis=both) → a 4-fold symmetric output.

**Mandala from any layer**
- `Kaleidoscope` (folds=8) — turn any single image / pattern into a mandala without using the Mandala generator.

**Glitch portrait**
- Image → ASCII (Braille)
- `Pixel sort` (axis=h, threshold=0.3)
- Output: horizontally-sorted bands wherever the image is bright.

**Posterized print**
- Any generator
- `Threshold` (value=0.5) → binary
- `Dilate` (iterations=2) → fatter blocks

**Soft chalk**
- Perlin / fBm
- `Erode` (iterations=1)
- `Noise jitter` (amount=0.05)
- Result: organic, hand-drawn feel.

**4-way symmetry image**
- Image → ASCII
- `Mirror` (h) → `Mirror` (v)
- Or simpler: `Mirror` (both).

## Modifier order matters

`Mirror → Threshold` produces a mirrored binary. `Threshold → Mirror` produces a binary, then mirrored. The output is visually identical here, but for `Pixel sort → Mirror` vs `Mirror → Pixel sort` you'll get very different aesthetics.

Reorder with **↑** and **↓** on each modifier row.

## Modifiers vs. blend modes

| | Modifiers | Blend modes |
|---|---|---|
| Where applied | Inside a single layer | Between layers |
| Stackable | Yes, multiple per layer | One per layer (the layer's blend setting) |
| Visible in panel | The Modifiers panel on the right | The Inspector dropdown |
| Examples | Mirror, Dither, Twirl | Multiply, Screen, Darken-char |

Modifiers shape the layer's content. Blend modes shape how that content interacts with what's underneath.

## Re-charset is special

The active charset can change at any time (clicking the Charsets panel). When that happens, existing layers still show whatever glyphs they emitted. Stack a **Re-charset** modifier and it remaps the layer's existing glyphs into the new alphabet — handy when you've built a project using one charset and want to switch to Braille for export.

## Tip: combine `Kaleidoscope` with `Pixel sort`

- Any pattern layer
- `Pixel sort` (axis=h, threshold=0.2) — produces glitch bars
- `Kaleidoscope` (folds=6) — wraps them radially

The result looks like an alien crop circle.
