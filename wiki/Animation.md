# Animation

Asciidream animates by **modulating numeric parameters on a sine wave driven by a timeline**. Every layer has its own Animate toggle; turn it on and the layer breathes.

## Quick path: animate everything

1. Open a project with a few visible layers.
2. Click **🌊 Animate all** on the timeline strip at the bottom.
3. Hit **▶ Play** (or `Space`).
4. Adjust **fps** and **total frames** in the same strip.

![Timeline strip](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/timeline.png)

Every visible layer is now wiggling. `Ctrl+Z` reverts (turns all of them off again).

## Per-layer control

For finer control, open the Inspector for any layer and tick **🌊 Animate**:

![Animate row](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/animate-row.png)

Two extra dials appear:

- **`· wiggle`** — how far each parameter swings from its base. 0 = no motion; 0.5 = swings 50 % of the parameter's full range. Default 0.18.
- **`· speed`** — multiplier on the sine frequency. 1 = default tempo. Try 0.3 for slow-motion, 2 for energetic.

Each numeric parameter wiggles independently (different phase + frequency per param-name hash), so the layer **ripples** instead of pulsing in unison.

## What gets animated

When `Animate` is on, every parameter whose type is `number` or `int` on that layer's generator wiggles. Bools, enums, and strings stay fixed.

That means:

- **Image → ASCII** layers wiggle their `contrast` and `brightness` (pulsing dynamic range), not the mode or the image itself.
- **Mandelbrot** wiggles `cx`, `cy`, `zoom`, `iter` — cinematic drift through the Mandelbrot set.
- **Flow Field** wiggles `scale`, `particles`, `steps`, `speed` — the field morphs and the particle count rises and falls.
- **Perlin / fBm** wiggle the `scale` and `octaves` — clouds breathing.

## The timeline strip

| Control | Purpose |
|---|---|
| `▶ Play / ⏸ Pause` | Start / stop. `Space` is the shortcut. |
| `⏴` / `⏵` | Single-frame step. `←` / `→`. |
| `Frame N/M` | Current frame / total. |
| `fps` | Frame rate. Higher = smoother but more frames to render. |
| `total` | Total number of frames in one cycle. |
| `loop` | Wrap to 0 at the end. |
| `🌊 Animate all` | Toggles **Animate** on every visible layer. |
| `Export GIF` | See below. |

## Exporting animation as GIF

The headline output: a real `.gif` file you can share anywhere.

1. Set up your animation (Animate on for at least one layer; play & verify it looks right).
2. Click **🎞 Anim GIF** in the Export modal, or **Export GIF** on the timeline strip.
3. A centred progress overlay shows `Rendering frame 28 / 120…`, then `Encoding…`, then `Saving…`.
4. A native Save-As dialog opens. The folder is remembered for next time.

![GIF export progress](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/gif-export-progress.png)

A toast confirms: `GIF: 120 frames @ 24fps · 480×320 · 1820 KB · encoded in 420 ms`.

### Encoding details

- Inline **GIF89a** encoder (no external libraries). LZW logic based on omggif (MIT/public-domain).
- Pixels quantized to a **216-colour palette** (6 levels per channel) before encoding.
- The canvas is downscaled to a maximum of **480 px on the long side** before encoding. This keeps the GIF small enough to pass cleanly through pywebview's IPC; without the cap, large files were getting truncated.
- Disposal method = 0 (unspecified, broad viewer compatibility).
- NETSCAPE2.0 application extension marks the GIF to loop forever.

### Tips for good GIFs

- **30 fps × 60 frames = 2 seconds**: short loops feel snappy and share well.
- **Subtle wiggle (0.05–0.15)** looks more cinematic than dramatic (0.3+) — most projects look better breathing than flailing.
- **Slow speed on fractal layers** lets the camera drift naturally.
- **Multiple layers animating at different speeds** (set Animate-speed individually) creates depth — front layer moves fast, back layer slow.

## Animated text export

If GIF isn't what you want, the Export modal also has **Anim TXT** — concatenated frames in a single plain-text file with `--- frame N ---` separators. Useful for sharing into terminals or for ASCII-art video pipelines.

## Limits

- **No per-keyframe authoring** in v1.0 — animation is currently parametric (sine wave per numeric param). Keyframing is on the v2 roadmap.
- **No MP4 export** — would need ffmpeg.wasm or similar bundled. GIF + frame-by-frame PNG dump are the available paths.
- Very long animations (1000+ frames) at large canvas sizes can exceed available RAM. Drop the canvas to 120×60 cells if you need long loops.

## Use cases people have built

- **A 4-second looping Mandelbrot zoom** for a Twitter banner.
- **A breathing portrait** — a photograph layer with Animate on (subtle), used as a video background.
- **An animated logo** — Banner generator + Kaleidoscope modifier + Animate.
- **A live wallpaper** — full-canvas Slime Mold with `--canvas-size` set high.
