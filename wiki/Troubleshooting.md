# Troubleshooting

Common problems and how to fix them.

## "The .exe won't start."

- On Windows 10, you need the **Edge WebView2 Runtime**. Most systems have it (it comes with Edge). If not, install from [Microsoft's WebView2 page](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).
- On Windows 11 it's preinstalled — no action needed.
- If SmartScreen warns you because the binary is unsigned, click **More info → Run anyway**.

## "When I drop an image, nothing happens."

- Make sure you're on the latest build (check the file timestamp on `Asciidream.exe`).
- Drop has to be onto the **app window**, not the title bar. Aim for the canvas.
- File must be a real image — check the extension is `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, or `.bmp`. The drop overlay should appear before you release.
- As a fallback, click the **📁 Open Image** button in the titlebar.

## "I see boxes/rectangles instead of real characters."

The empty rectangle `□` (called "tofu") shows up when your system's monospace font doesn't have a glyph for a particular Unicode code point. Most common with:

- Braille charset (needs Cascadia Code, JetBrains Mono, DejaVu Sans Mono).
- Box drawing, Geometric, Katakana on older systems.

Fix: switch to a charset with broader font support (`Classic 10`, `Bourke 70`, `Blocks`).

If you specifically want Braille on Windows 10 with default Consolas, install **Cascadia Code** (free, from GitHub).

## "Palettes don't change my image."

By default, image layers have **Use image colors = on** — colours come from the photo itself, not the palette.

**Solution**: just click another palette. Asciidream auto-disables "Use image colors" the moment you do, so the palette becomes visibly effective. A toast tells you. `Ctrl+Z` puts it back to image-colour if you change your mind.

To keep image colours, don't change the palette — or re-enable the checkbox in the Inspector after a palette click.

## "The animation looks identical to a static image."

- Check that the **🌊 Animate** checkbox in the Inspector is on for the layer you expect to animate.
- Check that the timeline is **playing** (`▶ Play` highlighted, or press `Space`).
- If you only have one layer and it's an **Image** layer with no other animatable params, the visible motion is subtle — try cranking `· wiggle` up to 0.3.
- Try the **`🌊 Animate all`** button on the timeline strip if you want every visible layer to animate at once.

## "Exported GIF is a static line at the top."

This was a real bug in v0.x. Make sure you're on **v1.0.0 or later**. The GIF encoder was completely rewritten based on omggif and is now verified to produce valid GIFs.

If it still happens on v1.0+, please open an issue with:

- The size shown in the toast (e.g. `1820 KB`).
- The dimensions shown (e.g. `480×320`).
- Total frames and fps.

## "Export GIF takes forever / freezes."

- The canvas is downscaled to 480 px on the long side for GIF export, but encoding is still per-frame LZW which can be slow for large frame counts.
- Drop `total frames` to ~60.
- Drop the canvas to 120×60 cells if you're trying for long loops.
- Watch the progress overlay — if it's advancing frames every second or so, just wait.

## "Window won't drag."

- Try dragging from the **ASCIIDREAM brand text** or the empty area between the menus and the pills.
- Window controls (red Shutdown, X, etc.) and buttons don't drag — only the labelled drag regions do.

## "The Layers panel says 'Top of the stack' at the top but…"

The convention: **top of the panel = top of the visual stack** (drawn last). New layers always land at the top. If you're not sure where a new layer landed, look for the brief blue flash on the row.

## "Lucky always lands on the same generator."

Lucky picks from a curated pool of 30 generators and **excludes the current one**, so successive clicks will cycle through. If you only see one, your image layer is keeping its generator (intentionally — Lucky doesn't blow away loaded images, it only re-rolls dials there). Switch to a non-image layer first.

## "The window has a white title bar."

Make sure you're on **v1.0.0+** which is frameless with a custom dark titlebar. The very early builds used the native Windows title bar.

## "Clicking a pattern when I have an image deletes my image."

This was true in v0.x. As of **v1.0.0+** the behaviour is:

- Click a pattern with a layer that has an **image loaded** → adds a new layer on top of the image.
- Click a pattern on any other layer → swaps that layer's generator (as before).

This way your photo is safe but you can still freely change generators on pattern layers.

## "There's a 'tip box' overlaying my palettes / charsets."

Probably the **💡 What's next?** coach panel. It's anchored to the canvas bottom-right but can overlap nearby panels on small windows. Click the `×` in its header to close it. The pulsing button stays available — you can reopen any time.

## "Where's my saved file?"

Asciidream remembers three separate "last used" folders:

| For | Stored as |
|---|---|
| Image loading | `asciidream.lastImageDir` |
| Export (PNG/SVG/etc.) | `asciidream.lastExportDir` |
| .glyph project save/open | `asciidream.lastProjectDir` |

These live in your browser-style local storage attached to the .exe. If you can't find a file, search your Downloads folder first and your Documents second.

## "The app feels slow."

The renderer is single-threaded Canvas2D. Heavy generators at large canvas sizes can drop FPS noticeably:

- **Drop the canvas size** (Edit → Resize canvas…). 200×80 is the comfort zone.
- **Hide layers you're not actively editing** — the eye toggle.
- **Lower the Animate FPS** — 12 fps still looks good and halves the work.

## "Crash / black canvas / nothing renders."

Hit `Ctrl+Z` a bunch — your last change may have produced invalid state. If that doesn't help:

- File → New project (themed confirm) to reset.
- If completely stuck, close the .exe (red Shutdown button) and relaunch.

If a specific generator crashes consistently, please open an issue with the project's `.glyph` file attached if possible.

## Reset local storage

To wipe the welcome-shown flag, last-used folders, coach-shown flag, etc., open the **command palette** (`Ctrl+K`), type `reset`, and run **Reset settings**. (Or just delete `%LOCALAPPDATA%\pywebview\…` — but the command-palette path is cleaner.)

> *Note: the "Reset settings" command palette entry is on the v1.1 roadmap; in v1.0 you can clear via DevTools if you're brave.*

## Filing an issue

Please include:

- Asciidream version (look in the `.exe`'s file properties or open `Help → About`).
- Windows version (Win+R → `winver`).
- A description of what you did, what you expected, what happened.
- If possible, the `.glyph` file of the project that exhibits the bug.
- A screenshot of the canvas + Inspector at the failure moment.

We don't collect telemetry — we have nothing to look at except what you tell us.
