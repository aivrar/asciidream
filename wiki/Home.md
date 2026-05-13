# Asciidream Wiki

Welcome to the **Asciidream** documentation.

Asciidream is a single-exe ASCII / Unicode generative art studio. It runs entirely offline, is fully deterministic, and ships as a portable ~16 MB Windows binary.

![Main window](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/01-main-window.png)

## Three ways to think about this app

| Mode | What you do | What you get |
|---|---|---|
| **Image converter** | Drag a PNG / JPG onto the canvas | The same photo rendered as ASCII art, with optional original colours, density / edge / dithered modes |
| **Algorithmic art studio** | Click any tile in the **Patterns** panel | A live pattern (Perlin field, Mandelbrot, Game of Life, L-System, etc.) you can tweak with sliders |
| **Layered compositor** | Stack patterns + photos, set blend modes & opacity | Photoshop-style layered output, optionally animated and exported as GIF |

## Pages

| | |
|---|---|
| 🚀 [Quick Start](Quick-Start) | First 30 seconds — install, open, drop image, export. |
| 🖼 [Image → ASCII](Image-to-ASCII) | Modes, contrast, brightness, image-colour sampling, edge detection. |
| 🎨 [Patterns Library](Patterns-Library) | The full generator catalog with one screenshot per algorithm. |
| 🔤 [Charsets](Charsets) | The "alphabet" that paints density — Braille, Blocks, Quadrants, etc. |
| 🌈 [Palettes](Palettes) | The 28 bundled colour themes and how palette-clicks affect images. |
| 🪜 [Layers](Layers) | Stack, blend, opacity, drag-reorder, multi-select, the 17 blend modes. |
| 🎛 [Modifiers](Modifiers) | Post-process the layer with mirror, kaleidoscope, dither, ripple, twirl, … |
| 🎯 [Inspector & Scrub-Drag](Inspector) | How to actually tune the parameters efficiently. |
| 🌊 [Animation](Animation) | Wiggle params, animate-all, timeline, FPS, total frames. |
| 🎞 [Export Formats](Export-Formats) | TXT / ANSI / SVG / PNG / HTML / Markdown / GIF / `.glyph`. |
| ⌨️ [Keyboard Shortcuts](Keyboard-Shortcuts) | All of them in one table. |
| 💡 [Tips & Tricks](Tips-and-Tricks) | Effects you can build by combining features. |
| 🩹 [Troubleshooting](Troubleshooting) | When things look wrong. |
| 🧱 [Architecture](Architecture) | For developers who want to add their own pattern. |

## Prime directives

The app is built around four hard constraints:

1. **Offline-first.** No network calls of any kind at runtime. No fonts/CDNs/analytics. Asciidream works fully airplane-mode every launch.
2. **Deterministic.** Same `{ generator, params, seed, canvas, charset, palette, layers, modifiers }` ⇒ byte-identical output. No `Math.random()` inside any generator — all RNG goes through a seeded Mulberry32.
3. **No data leaves the machine.** All persistence is local. Telemetry is absent, not "opt-out".
4. **Undo everything.** Every state mutation passes through a command stack with merge-by-tag.

## Where to start

1. Download `Asciidream.exe` from the [Releases page](https://github.com/aivrar/asciidream/releases/latest) and run it.
2. Drag any image onto the canvas → you'll see it become ASCII.
3. Click the **💡 What's next?** button in the bottom-right of the canvas — it suggests one-click experiments tailored to whatever layer you're on.
4. Press `?` any time for the keyboard shortcut sheet.
5. Press `Ctrl+K` for the command palette to jump anywhere.
