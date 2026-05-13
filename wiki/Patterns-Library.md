# Patterns Library

The catalog of every algorithm Asciidream ships with — 35+ generators across 8 categories.

> **Click any tile in the Patterns panel to apply.** Clicking on an image layer adds the pattern as a new layer on top of your photo (so the image is safe). Clicking on a non-image layer swaps that layer's generator. Use the search box at the top of the panel to filter by name (`mandel`, `fbm`, `maze`, `image`, …).

Every generator below is **deterministic**: same seed + same params = byte-identical output. Hit `R` to re-seed for a new variation, or `Ctrl+R` (Lucky) to also pick a different random generator.

## Image

| Tile | Notes |
|---|---|
| `Image → ASCII` | The main image generator. Density / Edges / Dithered modes. See [Image-to-ASCII](Image-to-ASCII). |
| `Image → Edges` | Sobel-edges-only with directional glyph picking. Lighter than Edges-mode of the main image generator. |

## Noise & Fields

These generators map a continuous noise field to a glyph density ramp. They're the workhorses of the "generative" side of the app.

| Tile | What it does |
|---|---|
| `Perlin Density` | Classic Perlin noise → ramp. `scale`, `offsetX/Y`, `contrast`, `invert`. |
| `Simplex Density` | Same idea with Simplex noise — slightly different texture. |
| `Worley / Cellular` | Cellular F1, F2, F2-F1, F1×F2 distances. Euclidean / Manhattan / Chebyshev. |
| `Fractal Brownian Motion` | Multi-octave noise. `octaves`, `lacunarity`, `gain`, choice of `perlin/simplex/value`. Clouds, mountains. |
| `Ridged Multifractal` | `1-|noise|` stacking — sharp ridges, mountain ranges. |
| `Domain Warp` | iQ-style noise of noise. `warp` strength controls swirl. |
| `Flow Field` | Particles advected by a noise field; trails draw glyphs. Probably the most visually-striking. |
| `Wave Interference` | N point sources; sum amplitudes. Concentric ring patterns. |
| `Voronoi Cells` | Random seeds + nearest-neighbour map. Stained-glass look. |

![Noise & Fields collage](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/cat-noise.png)

## L-Systems & Fractals

| Tile | What it does |
|---|---|
| `Mandelbrot Set` | Escape-time fractal. `cx`, `cy`, `zoom`, `iter` — zoom in by scrubbing `zoom`. |
| `Julia Set` | Julia with adjustable `c.x`, `c.y`. Animating `c.x` produces dramatic morphs. |
| `Burning Ship` | `|Re|+|Im|` variant. Spiky, almost biological. |
| `L-System` | Turtle-graphics Lindenmayer system. Presets: Koch, Sierpinski, Dragon, Hilbert, Plant, Arrowhead, Peano. Custom rules editable inline. |
| `Strange Attractor` | Clifford / De Jong / Lorenz / Peter de Jong / Aizawa. Iterate the chaotic map and plot density. |
| `Quadtree Subdivision` | Recursive grid split based on a noise threshold. |

![Fractals collage](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/cat-fractals.png)

## Cellular Automata

Each evolves a grid of cells over discrete steps. Use the **Animate** toggle to step them frame-by-frame.

| Tile | What it does |
|---|---|
| `Conway's Life` | The original. Rule string editable (`B3/S23` default). Tweak `density`, `steps`, `wrap`. |
| `Elementary CA (Wolfram)` | 1-D rules 0–255. Try 30, 90, 110, 184. Seed single-cell or random. |
| `Brian's Brain` | 3-state CA (off / dying / on). Glider-style flow. |

![CA collage](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/cat-ca.png)

## Geometric

| Tile | What it does |
|---|---|
| `Truchet Tiles` | Randomized arcs / diagonals / boxes. The classic Truchet pattern. |
| `Tiling` | Repeated tile pattern: square, brick, hex, checker. |
| `Maze` | Recursive backtracker, Prim's, sidewinder, binary tree. |
| `Phyllotaxis Spiral` | Vogel sunflower. `angle` ≈ 137.508° gives the golden spiral. |
| `Spirograph` | Hypotrochoid, epitrochoid, rose curves, Lissajous. |
| `Concentric Rings` | Moiré-friendly bullseyes. |

![Geometric collage](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/cat-geometric.png)

## Particle / Agent

Emergent patterns from many tiny rules.

| Tile | What it does |
|---|---|
| `DLA Tree` | Diffusion-limited aggregation — sticky random walks form fractal trees. |
| `Random Walk` | Many walkers, configurable forward bias. |
| `Slime Mold (Physarum)` | Agents with sensors, pheromone trails diffuse and decay. Animate it — it crawls. |

![Particle collage](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/cat-particle.png)

## Typographic

| Tile | What it does |
|---|---|
| `Random Soup` | Weighted random chars from the active charset. The classic ASCII noise field. |
| `Marquee Text` | Tiled text with scaling. Type any string. |
| `Big Banner` | Block-font display text. 5×7 internal font, scalable. |

![Typographic collage](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/cat-typo.png)

## Hybrid / Compositional

| Tile | What it does |
|---|---|
| `Mandala (radial wrap)` | N-fold radial symmetry around a noise field. Set `folds` to 6/8/12 for kaleidoscope-style outputs. |
| `Mosaic` | Splits the canvas into tiles, runs a *different* random generator per tile. The "everything-bagel" pattern. |
| `Solid Fill` | A background fill — useful as the base of a multi-layer composition. |

![Hybrid collage](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/cat-hybrid.png)

## How `Lucky` chooses

The **✨ Lucky** button on the titlebar (or `Ctrl+R`) picks one generator at random from a curated pool of 30 visually-interesting ones — skipping things like Solid Fill and the image generators (which would clobber any loaded image). It applies random params and a fresh seed, then renames the layer to match the new generator.

If the current layer has a loaded image, Lucky **keeps the generator** and only re-rolls the dials — your photo isn't wiped.

## Adding your own

See [Architecture](Architecture). Each generator is a self-contained block:

```js
registerGen({
  id: 'my-generator',
  name: 'My Generator',
  category: 'Noise & Fields',
  description: 'What it does in one line.',
  params: {
    scale: { type: 'number', label: 'Scale', min: 0.01, max: 1, step: 0.01, default: 0.1 },
    invert: { type: 'bool', label: 'Invert', default: false }
  },
  generate(ctx, p){
    const g = makeGrid(ctx.cols, ctx.rows);
    // … fill g.ch[i], g.fg[i] using ctx.rng, ctx.noise, ctx.palette …
    return g;
  }
});
```

Drop it into `asciidream.html` between the existing `registerGen` calls. Rebuild. The new generator shows up in the Patterns panel automatically.
