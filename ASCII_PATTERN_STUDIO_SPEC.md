# GLYPHFORGE — ASCII Art & Generative Pattern Studio

> A pro-grade, offline-first algorithmic art toy. Build, mutate, and export ASCII / Unicode / vector patterns from a deep library of generators. Layer, animate, color, post-process, export. No accounts. No telemetry. No cloud. Everything runs on the user's machine.

---

## 0. PRIME DIRECTIVES (read first, do not violate)

1. **Offline-first.** No network calls of any kind at runtime. No fonts/CDNs/analytics. App must work fully airplane-mode on first launch and every launch after.
2. **Deterministic.** Every render is reproducible from `{generator_id, params, seed, canvas_size}`. Same inputs → byte-identical output.
3. **No data leaves the machine.** All persistence is local (filesystem + IndexedDB/local SQLite). Nothing phones home. Telemetry = absent, not "opt-out".
4. **Composable.** Generators, modifiers, palettes, post-FX, and exporters are independent plugins behind stable interfaces. Adding a new generator must not require touching unrelated code.
5. **Keyboard-driven.** Every action has a shortcut. Mouse/touch is a convenience, not a requirement.
6. **Undo everything.** Every state mutation goes through a command stack. Unlimited undo/redo bounded only by RAM, with a configurable cap.
7. **Performance is a feature.** Target 60fps preview at 200×80 char canvas on a mid-2020 laptop. Background workers for anything > 16ms.
8. **Accessibility is not optional.** WCAG AA color contrast in UI, full screen-reader support, configurable motion-reduce, dyslexia-friendly font option for UI.

---

## 1. STACK & ARCHITECTURE

### 1.1 Recommended stack
- **Runtime:** Tauri (Rust + WebView) for the desktop shell. Falls back to a pure-web PWA build that runs from `file://` if Tauri is unavailable.
- **Frontend:** TypeScript + React 18 + Vite. Zustand for state. Immer for immutable updates. React-Aria for primitives.
- **Rendering:**
  - Canvas2D for ASCII glyph grid (primary preview).
  - WebGL2 (regl or raw) for heavy generative fields (flow fields, reaction-diffusion).
  - Web Workers + OffscreenCanvas for background generation.
  - SVG DOM for vector export and overlay UI handles.
- **Math/RNG:** `seedrandom` (Mulberry32 or Xoshiro128**). Custom noise lib: Perlin, Simplex, Worley, OpenSimplex2, Value, Fractal Brownian Motion. No native `Math.random()` in generators ever.
- **Storage:** Local filesystem via Tauri APIs; IndexedDB fallback in PWA. Project files are zipped JSON (`.glyph` extension) — see §10.
- **Build:** Single static bundle. No SSR. No external runtime deps. All fonts/icons bundled.

### 1.2 Module layout
```
/src
  /core
    /rng            // seeded RNG, noise functions
    /grid           // CharGrid data structure + ops
    /color          // color spaces, palettes, gradients
    /command        // undo/redo stack
    /pipeline       // generator → modifier → post-fx → exporter
  /generators       // one folder per generator, each a plugin
  /modifiers        // mutate an existing grid
  /post             // post-processing FX
  /exporters        // SVG, PNG, GIF, MP4, TXT, ANSI, HTML, JSON
  /ui
    /panels         // dockable panels
    /canvas         // preview surface
    /inspector      // parameter editor
    /timeline       // animation timeline
    /palette        // color/charset pickers
  /app              // routing, shell, hotkeys, theming
  /workers          // off-thread generation
  /persistence      // project I/O, autosave, recents
```

### 1.3 Plugin contract (all generators conform)
```ts
interface Generator<P extends ParamSchema> {
  id: string;                  // "flow-field", "l-system", etc.
  name: string;
  category: GeneratorCategory; // see §3.1
  description: string;
  tags: string[];
  params: P;                   // schema for the inspector to render
  defaults: ParamValues<P>;
  presets: Array<{ name: string; values: ParamValues<P> }>;
  generate(ctx: GenContext, params: ParamValues<P>): CharGrid;
  // Optional:
  animate?(ctx: GenContext, params: ParamValues<P>, t: number): CharGrid;
  thumbnail?(): Promise<ImageBitmap>;
}
```

The same shape applies to modifiers, post-fx, and exporters with their own input/output types.

---

## 2. CORE DATA MODEL

### 2.1 CharGrid
The universal canvas representation. Every generator outputs one; every exporter consumes one.

```ts
type Cell = {
  ch: string;            // a single grapheme cluster (supports emoji + ZWJ)
  fg: ColorRef;          // foreground color (index into palette or RGB)
  bg: ColorRef | null;   // background, null = transparent
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  rotate?: 0 | 90 | 180 | 270; // glyph rotation (SVG export only)
  flipX?: boolean;
  flipY?: boolean;
  opacity?: number;      // 0..1, defaults 1
  meta?: Record<string, unknown>; // generator-specific tags
};

type CharGrid = {
  cols: number;
  rows: number;
  cells: Cell[];         // row-major, length = cols*rows
  palette: Palette;      // see §5
  charset: Charset;      // see §4
  meta: { seed: number; generator: string; params: object; };
};
```

### 2.2 Layers
Projects are a stack of layers. Each layer holds one generator instance + its modifier chain. Layers composite top-down with a blend mode.

```ts
type Layer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;       // 0..1
  blend: BlendMode;      // see §6.3
  generatorId: string;
  generatorParams: object;
  seed: number;
  modifiers: ModifierInstance[];
  mask?: CharGrid | null; // optional alpha mask grid
};
```

### 2.3 Project
```ts
type Project = {
  version: 1;
  name: string;
  canvas: { cols: number; rows: number; cellAspect: number; };
  layers: Layer[];
  palettes: Palette[];
  charsets: Charset[];
  postChain: PostFXInstance[];
  animation: { fps: number; frames: number; loop: boolean; } | null;
  metadata: { createdAt: string; modifiedAt: string; author?: string; notes?: string; };
};
```

---

## 3. GENERATOR LIBRARY

Every generator below must ship. This is the headline feature — do not cut from this list.

### 3.1 Categories
- **Noise & Fields** — continuous fields mapped to glyph density
- **L-Systems & Fractals** — recursive grammars
- **Cellular Automata** — discrete grid evolution
- **Geometric** — shapes, tilings, lines
- **Particle / Agent** — emergent motion
- **Typographic** — text-centric pattern work
- **Image-derived** — convert raster input to ASCII (purely local, no upload)
- **Text-only** — pure character art
- **Hybrid / Compositional**

### 3.2 The full list

**Noise & Fields**
1. **Perlin Density** — map Perlin noise to a density ramp.
2. **Simplex Density** — Simplex variant, supports 2D/3D/4D (4th dim = time).
3. **Worley / Cellular** — F1, F2, F2-F1 distance, configurable distance metric (Euclidean, Manhattan, Chebyshev, Minkowski).
4. **Value Noise** — classic lattice noise.
5. **Fractal Brownian Motion (fBm)** — stacked octaves; configurable lacunarity & gain.
6. **Ridged Multifractal** — `1 - |noise|` stacking for mountain-like ridges.
7. **Domain Warp** — warp UV with noise of noise (Inigo Quilez style).
8. **Curl Noise** — divergence-free vector field for flow.
9. **Flow Field** — particles advected by noise field, traces draw glyphs.
10. **Reaction-Diffusion (Gray-Scott)** — runs on WebGL, configurable feed/kill.
11. **Wave Interference** — N point sources, sum amplitudes, threshold to chars.
12. **Heightmap-to-ASCII** — generate a 2D heightmap, render with shade ramp `" .,:;ilwW#@"` etc.
13. **Voronoi Stippling** — Lloyd's relaxation, glyph per cell.

**L-Systems & Fractals**
14. **L-System** — full Lindenmayer system; user-editable axiom + rules + angle + iterations. Bundled presets: Koch curve, Sierpinski triangle/arrowhead, dragon curve, Hilbert curve, Gosper curve, Peano curve, fractal plants (5+).
15. **Mandelbrot ASCII** — escape-time → shade ramp. Zoom/pan.
16. **Julia Set** — same with `c` parameter, animatable.
17. **Burning Ship** — variant fractal.
18. **Newton Fractal** — root coloring by basin.
19. **IFS (Iterated Function System)** — chaos game; presets: Sierpinski, Barnsley fern, dragon.
20. **Strange Attractors** — Lorenz, Rössler, Clifford, De Jong, Peter de Jong, Pickover, Aizawa, Thomas, Halvorsen. Each animatable.
21. **Apollonian Gasket** — recursive packed circles.
22. **Quadtree Subdivision** — recursive split with threshold rules; glyph picks per quadrant.

**Cellular Automata**
23. **Conway's Game of Life** — pause/step/run. Configurable rules (B3/S23 default), wraparound toggle, seed patterns library (glider, gosper gun, pulsar, lwss, etc.).
24. **Generic Life-like CA** — Bxxx/Sxxx rule string editor.
25. **Elementary CA (Wolfram)** — rules 0–255, classic rule 30/90/110/184.
26. **Brian's Brain** — 3-state CA.
27. **Wireworld** — for circuit art.
28. **Langton's Ant** — single + multi-ant, configurable color/turn states.
29. **Forest Fire** — probabilistic CA.
30. **Cyclic CA** — color cycling waves.
31. **Lenia** — continuous CA (heavy; WebGL).

**Geometric**
32. **Tilings** — square, triangular, hex, rhombic, Penrose (P2 & P3), pinwheel, Truchet (classic + multi-scale + smooth).
33. **Truchet Tiles** — quarter-arc, diagonal, hex, custom; randomized rotation.
34. **Maze Generators** — recursive backtracker, Prim's, Kruskal's, Eller's, Wilson's, Aldous-Broder, recursive division, hunt-and-kill, sidewinder, binary tree.
35. **Spirograph / Roulettes** — hypotrochoid, epitrochoid, rose curves, Lissajous.
36. **Polygonal Star Fields** — N-gons scattered, rotated, scaled.
37. **Concentric Rings** — moiré-friendly, animatable.
38. **Voronoi / Delaunay** — random or Poisson-disk seeds.
39. **Phyllotaxis** — sunflower / Vogel spiral, configurable angle.
40. **Spiral Pack** — Fibonacci, Archimedean, logarithmic.
41. **Bezier Bramble** — many random Bezier curves stroked into glyphs.
42. **Line Hatching** — directional hatching of regions, glyph density ramps.

**Particle / Agent**
43. **Boids** — Reynolds flocking; trail draws characters.
44. **Diffusion-Limited Aggregation (DLA)** — sticky random walk, tree growth.
45. **Brownian Trees** — variant of DLA.
46. **Slime Mold (Physarum)** — agents with sensors, trails diffuse and decay.
47. **Sand Piles** — Bak-Tang-Wiesenfeld abelian sandpile.
48. **Random Walks** — single, Lévy flight, self-avoiding.
49. **Eden Growth** — cluster growth.
50. **Percolation** — site/bond percolation lattices.

**Typographic**
51. **Marquee Text** — input string tiled with kerning, scaling, perspective tilt.
52. **Big Banner** — Figlet-style fonts (bundle ~20 figlet fonts: standard, slant, big, block, banner3-D, doom, isometric1, alligator, smkeyboard, larry3d, sub-zero, calvin, etc.).
53. **ASCII Map** — render text onto a path or shape.
54. **Word Cloud** — frequency-weighted layout.
55. **Concrete Poetry** — shape-fill with words (heart, spiral, custom path).
56. **Glitch Type** — Zalgo / combining-mark stack, controlled intensity.
57. **Mirror & Kaleidoscope Text** — N-fold symmetry on input string.

**Image-derived (LOCAL only, no upload)**
58. **Image-to-ASCII** — drop a PNG/JPG, choose charset + dithering (Floyd-Steinberg, Atkinson, Ordered Bayer 2/4/8, Burkes, Sierra, Stucki, Jarvis-Judice-Ninke, threshold). Edge detection toggle (Sobel/Canny) maps edges to `/\\|_-` etc.
59. **Image Edge Trace** — Canny edges → ASCII outline only.
60. **Image Glyph-density** — luminance → glyph from custom ramp.
61. **Color Quantize → Palette** — extract palette from an image (median cut / k-means / Wu).

**Text-only / Pure Char**
62. **Random Soup** — weighted random chars from a charset.
63. **Markov Char Field** — train tiny n-gram from input text, sample to fill grid.
64. **Symmetric Fill** — pick base pattern, mirror radially/horizontally/vertically.
65. **Kolam / Sona drawings** — algorithmic Indian/African knot patterns on a dot grid.
66. **Knot Patterns** — Celtic knot generator on a tile grid.

**Hybrid / Compositional**
67. **Mosaic** — split canvas into regions, run a different generator per region.
68. **Layered Composite** — multiple generators with blend modes (handled via Layers, see §6).
69. **Recursive Frame** — picture-in-picture self-reference at decreasing scale.
70. **Mandala Builder** — N-fold radial symmetry wrapper around any other generator.

> **Required minimum at v1.0 ship:** 1, 3, 5, 7, 9, 14, 15, 20 (Lorenz + Clifford), 23, 25, 32 (square + Truchet), 34 (recursive backtracker + Prim's), 39, 44, 46, 51, 52, 58, 62, 67, 70. The rest can be staged but the plugin interface must support all of them from day one.

### 3.3 Per-generator inspector parameters
Every generator exposes its params via a typed schema. The inspector auto-renders controls. Supported control types:
- `number` — slider + numeric input + scrub-drag
- `range` — dual-handle min/max
- `int` — stepped
- `boolean` — toggle
- `enum` — dropdown / segmented
- `color` — color picker (HSL/RGB/HEX/OKLCH)
- `palette-ref` — pick from project palettes
- `charset-ref` — pick from project charsets
- `string` — text input
- `multiline` — text area (for L-system rules, etc.)
- `vec2` — XY pad
- `curve` — bezier curve editor (for density ramps)
- `seed` — int with dice button to re-roll
- `file` — local file picker (no upload)

Every numeric param supports: tweening (animation), randomize, lock/unlock, reset-to-default, copy/paste value.

---

## 4. CHARSETS (the "alphabet" system)

A charset is an ordered list of grapheme clusters used by density-mapped generators.

### 4.1 Built-in charsets (must all ship)
- **Classic ramp 10:** `" .:-=+*#%@"`
- **Classic ramp 70:** the standard 70-char ramp by Paul Bourke.
- **Dense block:** `" ░▒▓█"`
- **Quadrants:** `" ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█"` (Unicode quadrant blocks)
- **Braille 2x4:** all 256 Braille patterns U+2800–U+28FF (highest spatial resolution).
- **Box drawing:** ╔╗╚╝═║╠╣╦╩╬┌┐└┘─│├┤┬┴┼ etc.
- **Domino/Card glyphs:** 🀰–🁫 etc. (optional, behind toggle, may not render in all fonts)
- **Geometric shapes:** ●○■□▲▼◆◇★☆ etc.
- **Arrows:** ←↑→↓↖↗↘↙⇐⇑⇒⇓
- **Math symbols:** ∀∂∃∅∇∈∉∋∏∑∞∫
- **Hex/binary:** `0123456789ABCDEF` and `01`
- **Letters only:** A–Z, a–z
- **Digits only:** 0–9
- **Katakana half-width:** for Matrix-rain aesthetic.
- **Emoji weather:** ☀️🌤☁️🌧⛈❄️ etc.
- **Custom:** user enters a string; preview shows it laid out.

### 4.2 Charset editor
- Reorder by drag.
- Weight per glyph (probability when sampled).
- Toggle "treat as density ramp" vs "treat as random pool".
- Live preview rendering a luminance gradient with the current charset.
- Save/load to project + export to JSON.

### 4.3 Grapheme handling
- Use `Intl.Segmenter` for proper grapheme clustering. Emoji ZWJ sequences count as one cell.
- All width math uses East Asian Width tables. Wide chars (CJK, many emoji) occupy 2 cells horizontally — handle this in CharGrid math and in the canvas renderer (no overlap, no clipping).

---

## 5. COLOR

### 5.1 Color model
Internal color is **OKLCH** (perceptually uniform). Conversions: OKLCH ↔ OKLab ↔ sRGB ↔ Display-P3 ↔ HSL ↔ HEX. Always round-trip through OKLab for interpolation — never lerp in sRGB.

### 5.2 Palettes
Bundle these palettes (all editable, all exportable as JSON / `.ase` / `.gpl` / `.hex`):

**Monochrome**
- Pure black on white, white on black, paper-white on ink, terminal green-on-black, amber-on-black, IBM blue-on-cyan.

**Retro computing**
- Apple II hi-res (6 colors), C64 (16), CGA palettes 0/1 high/low, EGA, VGA mode 13h default 256, MSX, ZX Spectrum, Game Boy DMG (4 greens), Game Boy Pocket, Game Boy Light, Game Boy Color hardware tints, NES, PICO-8 (16), Sweetie-16, Endesga-32, Endesga-64.

**Print & ink**
- Risograph (mint, lavender, fluorescent pink, federal blue, etc., 21 stock colors), CMYK process, single-spot duotones, newsprint halftone duotone.

**Photography & film**
- Kodachrome, Portra 400, Velvia, Tri-X (mono), Polaroid SX-70, faded VHS, faded 35mm.

**Design systems**
- Bauhaus primaries, De Stijl, Memphis (80s), Swiss-typographic neutrals, Brutalist mono+accent.

**Natural & scientific**
- Viridis, Inferno, Magma, Plasma, Cividis, Turbo, Twilight, RdBu, BrBG (matplotlib/seaborn diverging + sequential).

**Vibey**
- Vaporwave, synthwave, cyberpunk neon, solarized light/dark, gruvbox light/dark, nord, dracula, tokyo night, catppuccin (latte/frappe/macchiato/mocha), tomorrow night, monokai.

**Earth & nature**
- Forest, desert, ocean, autumn, spring, winter, lava, ice.

**Total target:** 80+ bundled palettes.

### 5.3 Palette tools
- Extract from image (median cut, k-means, Wu, neuquant).
- Generate from color theory: complementary, split-complementary, triadic, tetradic, analogous, monochromatic, square. Input one color, get a harmonious palette.
- Gradient builder: define stops in OKLCH, sample N colors, optionally quantize.
- Palette rotate / shift hue / shift lightness / shift chroma.
- Lock individual colors during shuffles.
- Force WCAG-AA contrast on a chosen pair.
- Color-blind safe filter (re-render palette under deuteranopia/protanopia/tritanopia/achromatopsia simulation).

### 5.4 Color application modes
Per-layer "colorizer" decides how a generator's output gets colored:
- **Solid** — single fg+bg.
- **Two-tone threshold** — split by density.
- **Gradient by density** — map density to a gradient.
- **Gradient by position** — linear / radial / angular / diamond / conic gradient across canvas.
- **Palette random** — sample palette per cell using seeded RNG.
- **Palette by region** — divide canvas (voronoi/stripe/checker) → assign palette index.
- **Per-generator native** — generator defines its own coloring (Newton fractal basins, Game of Life age, etc.).
- **From mask layer** — sample color from another layer's grid.

---

## 6. LAYERS, BLEND, MASKS

### 6.1 Layer panel
- Drag to reorder.
- Eye-toggle visibility. Lock-toggle edits. Solo button.
- Right-click: duplicate, merge down, flatten, convert to mask, rasterize, export single layer.
- Folder groups (collapse/expand).
- Per-layer thumbnail (small live preview).

### 6.2 Per-layer transforms
Independent of generator content:
- Offset X/Y in cells.
- Tile/wrap.
- Mirror H/V.
- Rotate 0/90/180/270 (cell-accurate).
- Crop rect.
- Scale (nearest-neighbor only, since chars are discrete).

### 6.3 Blend modes (operate on CHAR + COLOR)
Color blends use OKLab. Char blends are decided per mode:
- **Normal** — top replaces bottom.
- **Multiply / Screen / Overlay / Soft Light / Hard Light** — color only; char comes from top if non-space else bottom.
- **Add / Subtract / Difference** — color only.
- **Char-only** — only top's chars affect output; bottom's color stays.
- **Color-only** — only top's colors affect output; bottom's chars stay.
- **Darken-char** — use the "denser" char of the two (lookup against active ramp).
- **Lighten-char** — use the "sparser" char.
- **Mask** — top's luminance becomes alpha for bottom.
- **Erase** — top's non-space chars erase bottom.
- **Replace-where-space** — fill bottom's spaces with top.

### 6.4 Masks
- Any layer can be designated a mask for the layer below.
- Mask source: luminance, density (vs charset ramp), color-key, or a custom predicate.
- Soft masks supported via per-cell opacity.

---

## 7. MODIFIERS (mid-pipeline mutators)

Modifiers transform a CharGrid → CharGrid. Stack any number, drag to reorder.

1. **Threshold** — binarize by density.
2. **Posterize** — reduce density levels.
3. **Quantize charset** — remap to a different charset.
4. **Invert density** — reverse the ramp.
5. **Dither** — Floyd-Steinberg / Atkinson / Bayer 2/4/8 / Burkes / Sierra / Stucki / random / blue-noise.
6. **Noise jitter** — randomly swap N% of cells with neighbors in ramp.
7. **Shift** — offset rows/cols (with wrap or clip).
8. **Mirror** — H, V, diagonal, anti-diagonal.
9. **Rotate** — 90° increments only.
10. **Kaleidoscope** — N-fold radial symmetry.
11. **Scatter** — randomly displace cells within radius.
12. **Smear** — directional motion blur of glyph density.
13. **Erode / Dilate** — morphological ops on non-space cells.
14. **Skeletonize** — Zhang-Suen thinning.
15. **Outline** — keep only edges of regions.
16. **Fill flood** — paint-bucket-style fill.
17. **Find & Replace char** — regex over the grid.
18. **Crop / Pad** — change cols/rows.
19. **Mask by curve** — keep cells inside a bezier-defined region.
20. **Ripple** — sinusoidal column/row offset.
21. **Lens / Pinch / Bulge** — radial warps.
22. **Twirl** — angular swirl.
23. **Wave** — sin/cos displacement.
24. **Glitch** — random row shifts, channel-split coloring.
25. **Pixel-sort** — sort each row/column segment by luminance, thresholded.
26. **ASCII halftone** — convert dense regions into dot patterns.
27. **Hatching** — replace fills with directional line glyphs.
28. **Edge detect** — Sobel/Prewitt over density.
29. **Blur** — box / Gaussian over density values (then re-quantize).
30. **Sharpen** — unsharp mask.

---

## 8. POST-PROCESS (output-only effects)

Applied after layers composite. Affects render only (does not change underlying CharGrid). All post-FX have a single "wet/dry" mix knob.

1. **Scanlines** — horizontal lines, configurable opacity/spacing.
2. **CRT curvature** — barrel distortion preview (does not affect SVG/TXT export, only PNG/MP4).
3. **Bloom / glow** — gaussian bloom around bright cells.
4. **Chromatic aberration** — RGB channel offset.
5. **Vignette** — radial darken/lighten.
6. **Grain** — film grain noise on top.
7. **Halftone overlay** — dot pattern overlay.
8. **Burn-in trails** — phosphor decay (for animations).
9. **Bayer dither overlay** — post-only stylistic dither.
10. **Color grade** — lift/gamma/gain + per-channel curves + LUT support (3D `.cube` LUTs).
11. **Frame / matte** — bordered framing, configurable margin + label/title.
12. **Watermark** — text or image, position + opacity.
13. **Letterbox** — aspect-lock crop.
14. **ANSI emulator look** — emulate specific terminal palettes / fonts (xterm, VT100, IBM 5151 amber, IBM 3270, etc.).

---

## 9. ANIMATION

### 9.1 Capabilities
- Per-param keyframes on any numeric/vec2/color parameter.
- Easing curves: linear, ease-in/out (cubic), ease-in-out (cubic), back, elastic, bounce, custom bezier, step.
- Per-layer animation enable/disable.
- Global timeline: fps (default 24, configurable 1–60), total frames, loop toggle, ping-pong toggle.
- Onion-skin preview (N before/after frames at low opacity).
- Time-based generators (Simplex 3D, Julia c-wander, CA step-per-frame, Lorenz integration step) automatically advance.
- Frame stepping: ←/→ to step, space to play/pause, hold shift for 10x.

### 9.2 Timeline UI
- Track per animated parameter.
- Drag keyframes; right-click for easing menu.
- Scrub the playhead.
- Region select + copy/paste keyframes.
- Loop region markers.

### 9.3 Export targets for animation
GIF, animated PNG (APNG), animated SVG (SMIL + CSS), WebM (VP9), MP4 (H.264, requires ffmpeg.wasm bundled offline), animated ASCII (concatenated frames with ANSI escape clear-screen between).

---

## 10. EXPORT

### 10.1 Static formats
- **TXT** — plain text, optional trailing-space trim, BOM toggle, line ending choice (LF/CRLF).
- **ANSI** — colored text with ANSI 24-bit or 256-color escapes. Includes optional clear-screen prelude.
- **HTML** — `<pre>` with inline spans for color, or a CSS-class-per-color version. Optional fully-standalone HTML with embedded font.
- **Markdown** — fenced code block.
- **SVG** — text-as-paths option (no font dependency) or text-as-`<text>` (smaller file, requires font). Per-cell color, optional background rect. Configurable cell aspect, font, line height.
- **PNG** — rasterize at any DPI; choose font, font size, antialiasing on/off, bg color, transparency.
- **JPG/WEBP** — same, with quality slider.
- **PDF** — single-page or multi-page (one page per layer or per frame). Vector text or rasterized.
- **EPS** — for print workflows.
- **JSON** — full CharGrid serialization for tool interop.
- **Glyph project (`.glyph`)** — zipped JSON of full project. The native save format.

### 10.2 Animated formats
- **GIF** — with palette quantization, dither toggle, loop count.
- **APNG**
- **Animated SVG** — SMIL + CSS @keyframes variant; user picks.
- **WebM (VP9)** — via WebCodecs or ffmpeg.wasm.
- **MP4 (H.264)** — via ffmpeg.wasm (bundled, offline).
- **Frame sequence** — PNG/SVG numbered files in a chosen folder.
- **ASCII video** — `.txt` with frame separators, plus a self-contained HTML player.

### 10.3 Print-ready preset
"Print mode": export at 300 DPI, CMYK preview (soft proof), bleed area, crop marks, single-page or N-up imposition.

### 10.4 Sharing
- "Copy as text" / "Copy as ANSI" / "Copy as SVG" → clipboard.
- "Save preset" — bundle generator + params + palette + charset to a single shareable JSON.
- **Manual import only** — no auto-fetch, no URL imports unless user pastes content.

---

## 11. UI / UX

### 11.1 Layout
Resizable dockable panel system:
```
┌─────────────────────────────────────────────────────────┐
│ Top bar: File · Edit · View · Generator · Palette · Help│
├──────────┬───────────────────────────────────┬──────────┤
│ Layers   │                                   │ Inspector│
│ panel    │      Canvas Preview               │ (params) │
│          │                                   │          │
├──────────┤                                   ├──────────┤
│ Palettes │                                   │ Charset  │
│          │                                   │          │
├──────────┴───────────────────────────────────┴──────────┤
│ Timeline (collapsible)                                  │
├─────────────────────────────────────────────────────────┤
│ Status bar: seed · cols×rows · fps · mem · zoom         │
└─────────────────────────────────────────────────────────┘
```
- Every panel is dockable, floatable, closable.
- Save/load workspace layouts (presets: "Default", "Animation", "Print prep", "Minimal").

### 11.2 Canvas
- Zoom 25%–800% with `Cmd/Ctrl + scroll`.
- Pan with space-drag.
- Optional cell grid overlay, rulers (cells & pixels), guides.
- Pixel-perfect render: each cell renders to N×N pixel block; no subpixel antialiasing in the cell grid itself (font glyphs antialias internally).
- Real-time preview update on param change, debounced 60fps.
- "Compare" mode: split-view A/B with previous render.
- Fullscreen / presentation mode (`F` key).

### 11.3 Themes
Bundled UI themes: Light, Dark, High-contrast, Solarized Light/Dark, Nord, Dracula, Sepia, Paper. Theme is independent from project palette — important.

### 11.4 Fonts
Bundle these monospace fonts (license-clean, embed locally):
- **IBM Plex Mono** (default)
- **JetBrains Mono**
- **Fira Code** (with ligatures toggle off by default)
- **Iosevka** (multiple weights)
- **Source Code Pro**
- **Hack**
- **Inconsolata**
- **DejaVu Sans Mono** (broadest Unicode coverage — required for Braille/box drawing)
- **Noto Sans Mono**
- **VT323** (CRT look)
- **PressStart2P** (8-bit look)
- **Cascadia Code**

Plus a **"use system font"** option that scans installed monospace fonts.

### 11.5 Onboarding
First launch:
1. Short interactive tour (5 steps, skippable).
2. Loads a demo project with annotations.
3. Gallery of starter presets, "remix" button on each.

No login. No tracking. No "telemetry to improve your experience" dialog. None.

### 11.6 Help
- Bundled offline docs accessible via `?` key.
- Searchable command palette (`Cmd/Ctrl+K`).
- Tooltips on every control.
- "Why does this look weird?" diagnostics panel — points out: wide-character mismatch, missing glyphs in chosen font, palette outside-gamut warnings, etc.

---

## 12. KEYBOARD SHORTCUTS (defaults; all remappable)

| Action                       | Mac           | Win/Linux     |
|------------------------------|---------------|---------------|
| New project                  | ⌘N            | Ctrl+N        |
| Open                         | ⌘O            | Ctrl+O        |
| Save                         | ⌘S            | Ctrl+S        |
| Save As                      | ⇧⌘S           | Ctrl+Shift+S  |
| Export                       | ⌘E            | Ctrl+E        |
| Quick export PNG             | ⌘⇧E           | Ctrl+Shift+E  |
| Undo / Redo                  | ⌘Z / ⇧⌘Z      | Ctrl+Z / Y    |
| Re-seed                      | R             | R             |
| Lock seed                    | ⇧R            | Shift+R       |
| Randomize all unlocked params| ⌘R            | Ctrl+R        |
| Step forward (anim)          | →             | →             |
| Play/pause                   | Space         | Space         |
| Zoom in/out                  | ⌘+ / ⌘−       | Ctrl+ / −     |
| Fit to window                | ⌘0            | Ctrl+0        |
| Toggle panel: Layers         | 1             | 1             |
| Toggle panel: Inspector      | 2             | 2             |
| Toggle panel: Palette        | 3             | 3             |
| Toggle panel: Charset        | 4             | 4             |
| Toggle panel: Timeline       | 5             | 5             |
| Command palette              | ⌘K            | Ctrl+K        |
| Fullscreen                   | F             | F             |
| Cycle generator              | [ / ]         | [ / ]         |
| New layer                    | ⌘⇧N           | Ctrl+Shift+N  |
| Duplicate layer              | ⌘J            | Ctrl+J        |
| Merge down                   | ⌘E            | Ctrl+E        |
| Toggle gridlines             | G             | G             |
| Toggle dark/light theme      | ⌘⇧L           | Ctrl+Shift+L  |

---

## 13. RANDOMIZATION SEMANTICS

- A project has a master seed.
- Every layer has its own seed, derived from master+layerId by default but unlockable to an explicit value.
- Every randomize button must show *which* seed it would change — never randomize silently across scopes.
- "Lucky button" (`⌘L` / `Ctrl+L`): randomize unlocked params on current layer.
- "Lucky everything" (`⌘⇧L`): randomize unlocked params across all layers using a new master seed.
- Param-level lock toggle (padlock icon) prevents randomization.
- "History of seeds" panel — last 50 seeds with thumbnails, one-click revert.

---

## 14. UNDO / REDO

- All state changes go through commands. Each command has `do()` / `undo()` / `merge(other)`.
- Continuous changes (slider drag) merge into a single command at drag-end.
- Configurable history depth (default 200, max 10,000).
- Visible history panel showing last N actions with timestamps, jump-to-state.

---

## 15. PERSISTENCE

### 15.1 Project files
- `.glyph` = zip of:
  - `project.json` (everything)
  - `palettes/*.json`
  - `charsets/*.json`
  - `thumbnail.png` (auto-generated)
  - `README.md` (optional user notes)
  - `assets/` (any imported images, embedded)
- Forward-compatible: include a `version` field; loader migrates older versions.

### 15.2 Autosave
- Configurable (off / 1m / 5m / 15m).
- Recovery prompt on crash.
- Versioned backups, last N kept (default 10).

### 15.3 Recent files
- List of last 20 opened. Right-click → reveal in OS.

### 15.4 Library
- Local "library" folder: user-saved presets, palettes, charsets, custom L-system rules, custom Markov sources. All plain files. User can sync via their own Dropbox/iCloud/etc. — the app doesn't care.

---

## 16. PERFORMANCE TARGETS

- 200×80 canvas: 60fps preview for all generators except WebGL-heavy ones (Reaction-Diffusion, Lenia: 30fps acceptable).
- 800×400 canvas: 15fps acceptable on a 2020 MacBook Air.
- Cold launch: < 2s to interactive on the same machine.
- Memory cap: warn at 500MB, hard limit configurable.
- Background generation uses Web Workers; main thread never blocks > 16ms.
- Renderer batches glyphs by color to minimize Canvas2D state changes.
- Dirty-rect rendering: only re-draw cells that changed since last frame.

---

## 17. ACCESSIBILITY

- Full keyboard navigation, visible focus rings, no keyboard traps.
- ARIA on all custom controls; tested with VoiceOver + NVDA.
- Reduced-motion mode (`prefers-reduced-motion`): disables UI animations, optional pause-by-default for content animations.
- Configurable UI font size (small / medium / large / huge).
- Dyslexia-friendly UI font option (OpenDyslexica).
- High-contrast theme.
- Color-blind safe palette filter (see §5.3).
- All actions reachable from the command palette (`Cmd/Ctrl+K`).
- No flashing > 3Hz unless user explicitly enables and confirms a warning dialog.

---

## 18. TESTING

- **Unit tests:** every generator produces a deterministic CharGrid for fixed `{params, seed}`. Snapshot tested.
- **Property tests:** modifiers preserve grid dimensions (unless documented otherwise), idempotency of `invert∘invert`, etc.
- **Visual regression:** golden PNG snapshots of each generator at fixed seed; diff on CI.
- **Performance:** budget assertions per generator at standard canvas sizes.
- **Accessibility:** axe-core sweep on every panel.
- **Export integrity:** round-trip JSON → load → JSON equality.
- **Fuzz:** random param values across each generator for 10k iterations, must not throw, must not produce NaN cells.

---

## 19. ERROR HANDLING & DIAGNOSTICS

- Never crash silently. Every caught error surfaces a user-readable toast + a "Copy diagnostics" button that gathers project state and last command stack.
- Generators that fail show the layer with a red overlay and an inline error message, not a blank canvas.
- "Diagnostics" panel: WebGL info, available fonts, font glyph coverage check against current charset, RAM usage, render budget per layer.
- Verbose log to local file (off by default).

---

## 20. BUILD & DELIVERY

- One CI workflow producing:
  - macOS `.dmg` (universal binary, signed + notarized — instructions in README, not part of the build pipeline by default).
  - Windows `.msi` and portable `.exe`.
  - Linux `.AppImage`, `.deb`, `.rpm`, Flatpak.
  - PWA build (single-folder static, runs from `file://`).
- All builds include all bundled fonts, palettes, ffmpeg.wasm, docs.
- Build is fully reproducible: no datestamps embedded in binaries; locked dependencies; lockfile committed.
- License: MIT for code; fonts under their own licenses, redistributed verbatim in `THIRD_PARTY_LICENSES.md`.

---

## 21. STRETCH / V2 IDEAS (NOT in v1.0 scope, design for them but don't build)

- Live MIDI input → param modulation.
- Audio reactivity from local mic / file (FFT bands → params).
- WebUSB plotter export (AxiDraw, etc.).
- Thermal printer export (raw ESC/POS).
- Hand-drawn vector pen lines as a generator (input via stylus).
- Co-op multiplayer canvas over local network (Bonjour discovery, CRDT state). Still offline-from-internet.
- Custom generator scripting in a sandboxed JS/Lua subset.
- Mobile builds (iOS/Android, Tauri mobile when stable).

These must not bleed into v1.0 scope, but every architectural choice in v1 should keep them feasible.

---

## 22. ACCEPTANCE CRITERIA FOR v1.0

The product is "done" when:

1. All required generators in §3.2 work, are deterministic, have presets, and pass snapshot tests.
2. All charsets in §4.1 render correctly with bundled DejaVu Sans Mono.
3. All palettes in §5.2 are bundled and editable.
4. Layers, blend modes, masks, modifiers, post-fx all work as specified.
5. All export formats in §10.1 and §10.2 produce valid files. SVG opens in Illustrator + Inkscape + Figma + Chrome. PNG matches preview pixel-for-pixel at 1×. MP4 plays in QuickTime + VLC.
6. Animation timeline supports keyframing any numeric param of any generator, with onion skin and all listed easings.
7. Undo/redo covers every state mutation.
8. App launches and runs fully offline on a fresh machine with no internet on first run.
9. All keyboard shortcuts in §12 work and are remappable.
10. Accessibility audit (§17) passes axe-core with zero serious issues.
11. Performance targets in §16 are met on the reference machine.
12. No analytics, telemetry, or network calls of any kind exist in the production build. Verifiable by running with the loopback interface disabled.

---

## 23. NON-GOALS (be explicit)

- Not a general image editor. We never composite raster pixels; we composite character cells.
- Not a font designer.
- Not a code-art livecoding environment (no live shader-coding REPL). Param tweaking only.
- Not cloud-backed. No accounts. No "team" features.
- Not AI-image-generation. Generators are algorithmic and deterministic, never neural.

---

## 24. STYLE & CODE GUIDELINES

- TypeScript strict mode. No `any` without a `// reason:` comment.
- ESLint + Prettier. Pre-commit hook.
- All public functions documented with TSDoc.
- One generator per file. No god files.
- No global mutable state outside the Zustand store.
- All RNG accepts a seed argument; no implicit `Math.random()` in `/src/core` or `/src/generators`.
- All user-facing strings live in an i18n bundle (even if only English ships at v1.0).
- Commit messages: Conventional Commits.

---

## 25. SUGGESTED IMPLEMENTATION ORDER

1. Scaffolding: monorepo, Vite, TS strict, Zustand store, base UI shell.
2. Core: CharGrid, RNG, command stack, plugin contracts.
3. Canvas2D renderer with the cell grid.
4. Three generators end-to-end: Perlin Density, Game of Life, L-System. These exercise the full pipeline.
5. Inspector with auto-generated controls from param schema.
6. Palettes + charsets + color application modes.
7. Layers + blend modes + modifiers (start with shift, mirror, kaleidoscope, threshold, dither).
8. Export pipeline: TXT, ANSI, SVG, PNG first. Then animated GIF.
9. Animation timeline + keyframing.
10. Remaining generators in batches by category.
11. Post-FX layer.
12. Polish: themes, command palette, onboarding, docs.
13. Accessibility + performance pass.
14. Build/distribution.

---

## 26. THE NAME

If "GLYPHFORGE" is not desired, alternates to consider: **Asciiglyph**, **Charsmith**, **Glyphwright**, **Patternforge**, **Glyphlab**, **Asciidream**, **Cellsmith**. Replace freely. None of this depends on the name.

---

**End of spec.** Build it.
