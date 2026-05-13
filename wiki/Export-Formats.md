# Export Formats

Asciidream can export your project as static text, static images, vector graphics, animated images, and full project files.

Open the export modal via:
- **💾 Export** button in the titlebar
- `Ctrl+E` keyboard shortcut
- **File → Export…** menu

![Export modal](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/export-modal.png)

## Static text formats

### TXT

Plain text. The raw characters of the canvas, one row per line, no colour. Trailing spaces stripped.

```
                                  .:--+++++#####++++---::
                              .::-=+##%@@@@@@@@@@@%%#+=-:.
                          .:=+#%@@@@@@@@@@@@@@@@@@@@@@%#+=-.
                       .-+#%@@@@@@@@@@@@@@@@@@@@@@@@@@@@%*=:
```

Use case: paste into a terminal, embed in a `<pre>` block, share over IRC.

### ANSI

Plain text plus 24-bit ANSI escape codes for colour. Looks correct in any modern terminal (Windows Terminal, iTerm, etc.).

```bash
cat asciidream.ans  # prints the coloured art in your terminal
```

Use case: terminal screenshots, MOTD banners.

### Markdown

The TXT output wrapped in a fenced code block. Ready to paste into a GitHub README.

### HTML (standalone)

A self-contained `.html` file with the art rendered as `<pre>` with `<span style="color:…">` per cell. Open in any browser — looks identical to the canvas.

Use case: embed in a blog post; archive a rendering as a static page.

### JSON

The full CharGrid: a list of cells with character + foreground + background. Useful for downstream tools that want to consume the structured output.

## Static raster formats

### PNG

The canvas rasterized at the current font size, with anti-aliasing.

Use case: anything that takes a PNG. The same path is used internally for the standalone web HTML embed.

## Static vector formats

### SVG

Each cell becomes a `<text>` element with `fill=` set to the cell colour. Scales infinitely. Opens in Illustrator, Inkscape, Figma, browsers.

Use case: print, large-format poster, anywhere you need vector.

## Animated formats

### Anim GIF (real .gif)

The inline GIF89a encoder (see [Animation](Animation)) — produces a real animated GIF that loops forever. Capped at 480 px on the long side. Use this for sharing animated art to anywhere that accepts GIFs.

### Anim TXT

A plain-text file with `--- frame N ---` separators between frame dumps. Useful for ASCII video pipelines.

## Project file

### .glyph

The full project as a JSON archive: layers, generators, params, palettes, charsets, modifiers, animation settings, metadata. Open later via **File → Open .glyph…** (or `Ctrl+O`).

Use case: save your work-in-progress, share a project file with someone else, version-control your art.

`.glyph` files are just JSON — you can `git diff` them, edit them by hand, etc.

## Clipboard

Three additional buttons in the export modal:

- **Copy TXT** — the text rendering onto your clipboard.
- **Copy SVG** — full SVG.
- **Copy ANSI** — the colored escape-code version.

No file dialog, instant.

## Where the file goes

In the .exe build, all exports go through pywebview's native Save dialog, which remembers the folder per export type. Three separate "last folders" are tracked:

| Action | Remembered folder |
|---|---|
| `📁 Open Image` / Inspector image picker | `asciidream.lastImageDir` |
| `Export → anything` | `asciidream.lastExportDir` |
| `File → Save .glyph` / `File → Open .glyph` | `asciidream.lastProjectDir` |

So image-loading doesn't trample your "where I save my art" folder, and vice-versa.

## Determinism

Every static export is a pure function of the project state. Save a `.glyph` file, give it to someone else with the same Asciidream version → they get byte-identical PNG / SVG / TXT exports.

## Recommended formats per use case

| Use case | Format |
|---|---|
| Twitter / Mastodon static post | PNG |
| Twitter animated post | GIF |
| Blog post embed | HTML (standalone) or PNG |
| Vector poster / print | SVG |
| GitHub README | Markdown |
| Terminal banner / MOTD | ANSI |
| Discord share (animated) | GIF |
| Archive of a project | .glyph |
| Pipeline / programmatic use | JSON or .glyph |
