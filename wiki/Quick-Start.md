# Quick Start

The first 30 seconds with Asciidream.

## 1. Get the .exe

Download **`Asciidream.exe`** from the [Releases page](https://github.com/aivrar/asciidream/releases/latest). It's a single ~16 MB file. No installer, no Python, no admin rights.

## 2. Open it

Double-click the file. The app window opens to a default project with a noise pattern on the canvas and a **first-run welcome** modal:

![Welcome modal](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/02-welcome.png)

Three steps:

1. **Convert a photo, or pick a pattern.** Click **📁 Open Image** in the titlebar, drag a PNG/JPG onto the canvas, or click any tile in the **Patterns** panel on the right.
2. **Pick colours & characters.** Click a palette on the left. Click a charset (Braille is best for photos; Bourke-70 for fields; Blocks for posters).
3. **Tweak in the Inspector.** Drag any parameter label sideways to scrub the value. Wheel = nudge. Shift = 10×, Alt = 0.1×.

Dismiss the modal with **Got it — let me play**. You won't see it again unless you click the **`?`** button on the titlebar.

## 3. Drop an image

Drag any file from File Explorer onto the canvas. You'll see a full-screen dashed outline as you drag in:

![Drop overlay](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/03-drop-overlay.png)

Release. Your photo appears as ASCII immediately. The Layers panel on the left gets a new top layer named `Image — yourfile.png`; the demo layers underneath are auto-hidden so the photo reads cleanly.

![Image loaded](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/04-image-loaded.png)

A coach panel pops up in the bottom-right of the canvas with one-click suggestions: try Braille charset, switch to edges, add a kaleidoscope, recolor with a random palette, export. Each is a single click and applies immediately.

![Coach panel](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/05-coach.png)

## 4. Tweak with scrub-drag

In the Inspector on the right, **click and drag any parameter label sideways**. The value scrubs while the canvas updates live. Modifier keys:

| Key | Effect |
|---|---|
| `Shift` while dragging | 5× sensitivity (bigger swings) |
| `Alt` while dragging | 0.1× (precision dialling) |
| Mouse wheel over label or number box | Nudge by one step (`Shift` = 10 steps) |

You can also type directly into the number box on the right of each row.

![Scrub-drag in action](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/06-scrub-drag.png)

## 5. Export

Hit **💾 Export** in the titlebar (or `Ctrl+E`). Pick a format:

![Export modal](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/07-export-modal.png)

- **PNG** — high-res raster.
- **SVG** — vector, scales infinitely.
- **TXT** — the raw characters (paste into a terminal).
- **ANSI** — colored terminal output.
- **HTML** — standalone web page with the art inlined.
- **🎞 Anim GIF** — real animated GIF (see [Animation](Animation)).

A native Windows save dialog opens. The folder you last used is remembered per export type (image-load folder is separate from project-save folder).

## 6. Save your project

`Ctrl+S` → produces a `.glyph` file (a JSON project archive). `Ctrl+O` reopens.

## 7. Shutdown

Red **⏻ SHUTDOWN** button in the top-right of the titlebar. No prompts, no save dialog, clean exit. Or **`✕`** for the close button. Both do the same thing.

---

## Next: pick where you want to go

- [Image → ASCII](Image-to-ASCII) — make your photos sing.
- [Patterns Library](Patterns-Library) — the algorithmic side.
- [Layers](Layers) — combine multiple images / patterns.
- [Animation](Animation) — make it move, export GIF.
