# Architecture

For developers who want to understand or extend Asciidream.

## Repository layout

```
asciidream/
├── asciidream.html        ← all UI + engine + generators in one file
├── asciidream.py          ← pywebview host (file picker, save, window controls)
├── build.bat              ← PyInstaller wrapper
├── ASCII_PATTERN_STUDIO_SPEC.md  ← original design spec
├── README.md
├── LICENSE
├── RELEASE_NOTES.md
└── wiki/                  ← copy of this wiki
```

Everything ships in `Asciidream.exe`. `asciidream.html` is bundled as a PyInstaller data file and read at startup.

## Runtime stack

```
┌─────────────────────────────────────────────────┐
│  Asciidream.exe — PyInstaller --onefile         │
├─────────────────────────────────────────────────┤
│  asciidream.py     pywebview frameless window   │
│                    │                            │
│                    │  Edge WebView2 host        │
│                    ▼                            │
│  asciidream.html   one self-contained app       │
│      ├─ Mulberry32 seeded RNG                   │
│      ├─ Perlin/Simplex/Worley/Value noise       │
│      ├─ OKLab colour interpolation              │
│      ├─ CharGrid data structure                 │
│      ├─ Generator plugin registry               │
│      ├─ Modifier plugin registry                │
│      ├─ Undo/redo command stack (merge-by-tag)  │
│      ├─ Canvas2D renderer (batched-by-colour)   │
│      ├─ Inline GIF89a encoder                   │
│      └─ Toast / modal / coach UI                │
└─────────────────────────────────────────────────┘
```

No Node.js at runtime. No backend. No worker threads (yet).

## Data model

```ts
type CharGrid = {
  cols: number;
  rows: number;
  ch:  string[];   // row-major, length = cols*rows
  fg:  string[];   // hex color per cell
  bg:  (string|null)[];
}

type Layer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;          // 0..1
  blend: BlendMode;
  generatorId: string;
  generatorParams: object;  // shaped by the generator's param schema
  seed: number;
  modifiers: { id: string; params: object }[];
  colorMode: 'solid' | 'two-tone' | 'palette-density' | 'palette-random' | 'palette-by-pos';
  animate: boolean;
  animateAmount: number;    // 0..0.5
  animateSpeed: number;     // 0.05..5
}

type Project = {
  version: 1;
  name: string;
  canvas: { cols: number; rows: number; };
  layers: Layer[];
  palettes: Palette[];
  charsets: Charset[];
  selectedPalette: string;
  selectedCharset: string;
  seed: number;
  postChain: never[];       // reserved for v2
  animation: null;          // reserved for keyframes in v2
  metadata: { createdAt: string; modifiedAt: string; };
}
```

`Project` serializes 1:1 to `.glyph` files (a JSON archive).

## Generator plugin contract

Every generator implements the same shape:

```js
registerGen({
  id:          string,           // unique id; used as the generatorParams key
  name:        string,           // user-facing name
  category:    string,           // for grouping in the Patterns panel
  description: string,           // shown in the inspector
  params: {
    [paramName]: {
      type:   'number'|'int'|'bool'|'enum'|'string'|'multiline'|'color'|'file',
      label:  string,
      // type-specific:
      min?, max?, step?, default?, options?: string[]
    }
  },
  generate(ctx, params): CharGrid
});
```

Where `ctx` contains:

```js
{
  cols, rows,
  seed: number,
  time: number,              // for animation
  palette: string[],         // hex colours
  charset: Charset,
  ramp: string[],            // active charset's chars
  rng: { next(), int(min,max), range(min,max), pick(arr), chance(p), gauss() },
  noise: { perlin2, perlin3, simplex2, worley, valueNoise2, fbm },
  colorMode: string
}
```

`generate` is expected to be **pure** — same `(ctx, params)` produces the same CharGrid every call. The only randomness is `ctx.rng` (seeded).

### Adding a new generator

Just append a `registerGen(...)` call to the `generators-script` block of `asciidream.html`. The Inspector renders its UI automatically from the param schema; the Patterns panel categorizes it by `category`.

Example — a simple "stripes" generator:

```js
registerGen({
  id: 'stripes',
  name: 'Stripes',
  category: 'Geometric',
  description: 'Horizontal stripes at a configurable spacing.',
  params: {
    spacing: { type: 'int', label: 'Spacing', min: 1, max: 32, step: 1, default: 4 },
    glyph:   { type: 'string', label: 'Glyph', default: '#' }
  },
  generate(ctx, p){
    const g = makeGrid(ctx.cols, ctx.rows);
    for (let y = 0; y < ctx.rows; y++){
      if (y % p.spacing !== 0) continue;
      for (let x = 0; x < ctx.cols; x++){
        const i = y * ctx.cols + x;
        g.ch[i] = p.glyph;
        g.fg[i] = colorize(ctx, y / ctx.rows, i);
      }
    }
    return g;
  }
});
```

Rebuild (`build.bat`) and the new tile appears in the Patterns panel under Geometric.

## Modifier plugin contract

```js
registerMod({
  id:    string,
  name:  string,
  params: { [name]: defaultValue },
  apply(grid: CharGrid, params, ctx): CharGrid
});
```

Modifiers receive a CharGrid and return a (possibly new) CharGrid. They're chained per layer.

## Rendering pipeline

For each frame:

```
for layer in project.layers:
  if not layer.visible: continue
  if layer.animate:
    params = modulateParams(layer.generatorParams, time)
  else:
    params = layer.generatorParams
  grid = generator.generate(ctx, params)
  for modifier in layer.modifiers:
    grid = modifier.apply(grid, modifier.params, ctx)
  output = compositeInto(output, grid, layer.blend, layer.opacity)
draw(output)
```

`composeProject(t)` builds the final grid. `drawGrid(grid)` paints it to a Canvas2D, batched by foreground colour to minimize state changes (typical rendering is dominated by `fillText` calls).

## Undo/redo: command stack

Every state mutation goes through `pushCmd(do, undo, mergeTag?)`:

```js
pushCmd(
  ()=>{ STATE.project.layers.push(L); rebuildAll(); scheduleRender(); },
  ()=>{ STATE.project.layers.pop();   rebuildAll(); scheduleRender(); }
);
```

Commands with the same `mergeTag` within 500 ms are merged into one undo step — that's what lets a slider drag count as a single undo even though it fires hundreds of input events.

## Python ↔ JS API surface

The HTML side calls into Python via `window.pywebview.api.<method>`:

| Method | Purpose |
|---|---|
| `open_image(start_dir)` | Native file dialog filtered to images, returns the file as a data URL + dimensions. |
| `open_file(extensions, start_dir)` | Native file dialog, returns text contents. Used for `.glyph` open. |
| `save_file(name, dataURL, start_dir)` | Native save dialog; writes base64-decoded bytes. Used for all exports. |
| `minimize()` / `toggle_maximize()` | Window controls. |
| `get_position()` / `move_window(x, y)` | Drag fallback (currently unused — `pywebview-drag-region` does the work). |
| `quit()` | Close the window. PyInstaller cleans up its tempdir on normal exit. |

When running the raw HTML in a browser (without the .exe wrapper), `window.pywebview` is undefined and the app falls back to standard browser file pickers and `<a download>` saves.

## Determinism guarantees

- Every generator uses `ctx.rng` (seeded Mulberry32) — never `Math.random()`.
- Layer composition is fully deterministic for a fixed input project + canvas size.
- Color interpolation goes through OKLab (perceptual), not sRGB linear, but the output is still deterministic.

Note: animation is also deterministic given a fixed frame number. The sine wave for each param is keyed off the param name's hash + the layer's current parameter base.

## Build artefacts

`build.bat` runs:

```
python -m PyInstaller \
  --onefile \
  --windowed \
  --name Asciidream \
  --add-data "asciidream.html;." \
  asciidream.py
```

Produces `dist/Asciidream.exe`. The `--add-data` flag bundles the HTML into the .exe; `resource_path` in `asciidream.py` resolves it at runtime via `sys._MEIPASS`.

## Where to extend

- **New generators** — append a `registerGen` block.
- **New modifiers** — append a `registerMod` block.
- **New palettes / charsets** — entries in the `PALETTES` and `CHARSETS` arrays.
- **New blend modes** — branch in `compositeInto` and (if applicable) `_mixColor`.
- **New export formats** — function in the exporters section + button in the Export modal.
- **New language for the UI** — strings are inline today; an i18n pass would lift them into a single object.

## Roadmap candidates

These are *designed-for* but not built:

- Web Workers for off-thread generation (heavy generators on small machines).
- Per-keyframe authoring on the timeline instead of parametric wiggle only.
- WebGL backend for Reaction-Diffusion, Lenia, large-canvas Slime Mold.
- Plugin loader for user-supplied generators (currently you have to edit and rebuild).
- MP4 / WebM export (would need ffmpeg.wasm).
- Linux / macOS builds (PyInstaller works there too — just needs CI matrix).
