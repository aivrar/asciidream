# Tips & Tricks

Things you can build by combining features. Each block here is a "recipe" — try it as written, then tweak.

## Photo recipes

### Crisp pen-and-ink portrait

1. Drop a photo.
2. **Mode** → `edges`.
3. **Charset** → `Bourke 70` or `Box drawing`.
4. **Palette** → `Paper white` or `Amber`.
5. **Contrast** → ~1.5 (drag the label up).

Result: a black-line drawing on warm paper, like a Moleskine sketch.

### Highest-detail photo

1. Drop a photo.
2. **Charset** → `Braille`.
3. **Mode** → `density`.
4. **Brightness** → +0.05 (slight lift).
5. **Use image colors** = on (default).

Braille = 2×4 sub-pixels per cell. This is the densest format available.

### Posterized retro

1. Drop a photo.
2. **Mode** → `dithered`.
3. **Charset** → `Classic 10`.
4. **Palette** → `Game Boy DMG` (auto-disables image colours).

You'll get a green, four-shade Game-Boy-Camera-style image.

### Cyberpunk poster

1. Drop a photo.
2. **Mode** → `edges`.
3. **Charset** → `Quadrants`.
4. **Palette** → `Cyberpunk` or `Vaporwave`.
5. Add a **Kaleidoscope** modifier (`folds=2`) for subtle mirror symmetry.

## Multi-layer compositions

### Image with breathing background

1. Drop a photo.
2. Click the `+ Add` button — adds a new generic layer (Layer 2 = Perlin Density by default).
3. Drag the new layer **below** the image in the panel.
4. Show both (eye `●` on for both).
5. On the image layer, set **Blend** → `multiply` and **Opacity** → 0.7.
6. Hit `🌊 Animate all`. The Perlin breathes, the photo overlays.

### Mandala from a photo

1. Drop a photo.
2. On the image layer, add a **Kaleidoscope** modifier with `folds=8`.
3. The photo becomes a radial mandala. Tweak `folds` to 6/12/16 for different rosettes.

### Aurora over Mandelbrot

1. Pattern = Mandelbrot.
2. Add a layer above: pattern = fBm.
3. fBm blend = `screen`, opacity 0.4.
4. Mandelbrot palette = `Inferno`, fBm palette doesn't matter (use solid).
5. Toggle Animate on fBm only — the "aurora" wisps move over the fractal.

### Three-image stack

1. Drop image A. (clean photo view)
2. Drop image B. (becomes a new layer on top of A)
3. Drop image C. (new layer on top of B)
4. Toggle eye to compare. Try blend = `difference` on top for psychedelic comparison.

## Generator tricks

### Phyllotaxis at the golden angle

Phyllotaxis with `angle = 137.508` is the actual golden-angle phyllotactic ratio — what sunflower seeds use. Move it by `0.01` and the pattern explodes into chaos.

### Mandelbrot zoom animation

1. Pattern = Mandelbrot.
2. Set `cx = -0.7269`, `cy = 0.1889`. This is a known interesting point.
3. Turn on Animate.
4. Set the layer's `· wiggle` → 0.02 (very subtle).
5. Set `· speed` → 0.3 (slow drift).
6. Result: a meditative drift through fractal space.

### L-System plant with seasons

1. Pattern = L-System, preset = `plant`, iterations = 5.
2. Turn on Animate (`· wiggle` = 0.1, `· speed` = 0.5).
3. The angle, iterations, and step size wiggle slowly — the plant gently bends and grows/shrinks.

### Game of Life in motion

1. Pattern = Conway's Life.
2. Increase `steps` to 200 to settle the simulation into a quasi-stable pattern.
3. Animate. The `density` parameter wiggles, which re-seeds slightly different patterns each frame — generates new life forms.

## Charset alchemy

- Switch from `Classic 10` to `Quadrants` to **add half a stop of detail** without changing anything else.
- Switch to `Hex digits` to make any generator look like falling Matrix code.
- Switch to `Arrows` and animate a Flow Field — the glyphs literally indicate the flow direction.

## Palette alchemy

- Click `Newsprint` on any pattern → instantly looks like a Sunday comics page.
- Cycle through palettes by clicking each one in turn — the canvas updates live, and you can find an unexpected favourite.

## Blend mode combinations

### "Photoshop curves" effect

Two copies of the same image layer (`Ctrl+J` to duplicate). Top layer blend = `multiply`. Drop top opacity to 0.4. You'll get a deeply contrasty image.

### "Outlined text"

1. Banner with your text. Solid colour palette.
2. Duplicate the banner layer.
3. Top layer modifier = `Dilate` (1 iter), blend = `darken`, slight offset via `Shift` modifier.
4. Result: outlined text.

### Glitch art

Any image. Modifier = `Pixel sort` (axis=h, threshold=0.2). Then `Mirror` (v). Then `Ripple` (amp=2, freq=0.4).

## Animation tricks

### Different speeds per layer

When `🌊 Animate all` is on, every layer animates at the same speed by default. Click each layer in turn and set its **`· speed`** to a different value — front layer at speed 2, middle at 1, back at 0.3 — creates parallax depth.

### Subtle vs dramatic

`· wiggle = 0.05` → cinematic breathing. `· wiggle = 0.4` → manic carnival ride. Both are valid for different vibes.

### GIF export tips

- 30 fps × 60 frames = a tight 2-second loop. Most internet-share-sized.
- 24 fps × 96 frames = 4-second loop, more "filmic".
- Heavy generators (Flow Field with 2000 particles) will take noticeably longer to encode. Drop particle counts before exporting if patience is short.

## Productivity

- **Press `R` repeatedly** in any pattern: it cycles seeds. Often the third seed is the right one.
- **Press `Ctrl+R` repeatedly**: cycles through random *generators*. Great for "show me something different" exploration.
- **`Ctrl+K`** → command palette. Way faster than mousing into the right panel.
- **Use the coach panel** (`💡 What's next?` button in the canvas corner) — it has one-click experiments and is contextual to whatever layer you're on.

## Keep your work

- `Ctrl+S` saves a `.glyph` file. Do this often.
- `.glyph` files are tiny JSON archives — version-control them.
- Don't trust the .exe to remember anything outside `localStorage` (welcome flag, last folders). The project lives in the file you save.
