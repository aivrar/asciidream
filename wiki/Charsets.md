# Charsets

A **charset** is the alphabet of glyphs that Asciidream uses to draw density. The active charset affects how every generator looks — Perlin noise drawn with Braille looks completely different from the same Perlin drawn with the 10-char ramp.

Click a row in the Charsets panel (lower-left) to switch the active charset for the whole project. The change is **instant** and undoable.

![Charset panel](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/charsets-panel.png)

## The 14 bundled charsets

| Name | Chars | Best for |
|---|---|---|
| `Classic 10` | `" .:-=+*#%@"` | Quick low-detail rendering. Posters. |
| `Bourke 70` | The classic 70-char Paul Bourke ramp | Natural gradients. Default choice for fields. |
| `Blocks` | `" ░▒▓█"` | Retro / 8-bit / posterized. |
| `Quadrants` | `" ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█"` | Higher detail than Blocks via 2×2 sub-pixel coverage. |
| `Braille` | All 64 patterns of the 2×4-dot Braille block | **Highest detail** — best charset for photos. |
| `Box drawing` | `─│┌┐└┘├┤┬┴┼╔╗═║…` | Schematics, technical aesthetics. |
| `Geometric` | `●○■□▲▼◆◇★☆…` | Decorative, dotty. |
| `Arrows` | `←↑→↓↖↗↘↙⇐⇑⇒⇓` | Direction-flavoured renderings of flow fields. |
| `Katakana` | half-width katakana | The Matrix aesthetic. |
| `Hex digits` | `0123456789ABCDEF` | "Code falling off the screen" look. |
| `Binary` | `01` | Extreme posterization. |
| `Letters` | `A-Z` | Generic text-noise. |
| `Digits` | `0-9` | Generic numeric-noise. |
| `Density dots` | `" ·∙•●"` | Very minimalist, gentle. |

> Some charsets contain Unicode characters that may not render in every monospace font. If you see `□ □ □` (tofu rectangles) in the canvas, switch to a more glyph-rich font like **Cascadia Code** (default on Windows 11) or **DejaVu Sans Mono**.

## Two charset roles

In the underlying code each charset has a `random` flag:

- `random:false` (a **density ramp**) — the order matters. Generators map a 0-to-1 density value to a position in the ramp.
- `random:true` (a **pool**) — order doesn't matter. Generators that randomly pick (like Random Soup) sample uniformly from the pool.

`Classic 10`, `Bourke 70`, `Blocks`, `Quadrants`, `Braille`, `Density dots` are ramps. The rest are pools. You generally never need to think about this — Asciidream picks the right mode per generator.

## Recommended combos

| Generator | Best charset |
|---|---|
| Image → ASCII (density) | Braille |
| Image → ASCII (edges) | Bourke 70 or Box drawing |
| Perlin / fBm / Worley | Blocks or Quadrants (good gradient texture) |
| Game of Life / Brian's Brain | Quadrants or Blocks (binary look) |
| Mandelbrot / Julia | Bourke 70 (smooth shading) |
| Flow Field | Arrows ⬅ on the head |
| L-System | Box drawing (clean lines) |
| Banner / Marquee | Blocks (`█`) — looks like a marquee |

## Switching charsets affects modifiers too

Some modifiers re-quantize using the active charset:

- **Re-charset** maps an existing layer's glyphs into the active alphabet.
- **Dither (Floyd-Steinberg)** uses the active charset's ramp depth as the quantization level.
- **Threshold** binarizes by ramp index.
- **Invert density** flips the ramp direction.
- **Darken-char / Lighten-char** blend modes use the active ramp to decide which of two glyphs is "denser".

So the charset isn't just a cosmetic choice — it's part of the math.

## Tip: the secret of Braille

The Braille charset is 8-times denser than the 10-char ramp per cell (since a Braille character represents 8 sub-pixels via dots). For a 200×80 canvas, Braille gives you ~128 000 effective sub-pixels worth of detail, vs. ~16 000 for `Classic 10`. That's why photos look so much better in Braille.

The trade-off: Braille requires a Unicode-supporting monospace font. Cascadia Code (Win 11 default) and JetBrains Mono support it. Older Consolas does not.
