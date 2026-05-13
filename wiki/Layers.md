# Layers

Layers in Asciidream work the same way they do in Photoshop or Figma — a stack of independently-edited images, blended top-down.

## Reading the Layers panel

The Layers panel sits in the upper-left and is labelled to keep the orientation clear:

```
▲ TOP — drawn last
─────────────────
[selected primary]    Image — dino.png    image-to-ascii
                      Pattern             mandala
                      Background          fbm
─────────────────
▼ BOTTOM — drawn first
```

**Top of the panel = top of the visual stack**, just like Photoshop. The topmost layer covers (or blends with) the layers underneath. New layers always land at the top.

![Layers panel](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/layers-panel.png)

Each row has:

- **`● / ○`** — visibility toggle.
- **`⠿`** — drag handle for reordering.
- **Name** — editable in the Inspector.
- **Generator id** — small grey text on the right.

A **freshly-added layer briefly flashes blue** at the top of the panel so you can see where it landed (drop an image / click a pattern over an image / use `+ Add`).

## Selecting layers

| Action | Result |
|---|---|
| Click a layer | Make it the **primary** selection (Inspector follows it). |
| Ctrl-click / ⌘-click | Toggle a layer in/out of the multi-selection. |
| Shift-click | Range-select between the primary and the clicked layer. |
| Click `●` while multi-selected | Toggle visibility on **all** selected. |
| Click an Inspector control while multi-selected | Some controls (notably **Animate**, **Delete**, **Duplicate**) apply to all selected. |
| Click `+ Add` / `Dup` / `Del` | Bulk versions of these honour the selection. |

The layer count badge in the panel header shows `3 · 2 sel` when multiple layers are selected.

## Reordering by drag-drop

Grab any layer row (the `⠿` handle is the obvious target but the whole row is draggable). Drag onto another layer. An orange line shows the drop position:

- Drag above the midpoint → drops **above** the target in the panel (= higher in the visual stack).
- Below the midpoint → drops **below**.

Release. One `Ctrl+Z` reverts.

![Drag-reorder](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/layers-drag-reorder.png)

## Per-layer settings (in the Inspector)

When a layer is selected, the Inspector on the right shows its settings:

- **Seed** — the layer's seed (re-roll with **R** for new variations).
- **Name** — editable text.
- **Color mode** — solid / two-tone / palette-density / palette-random / palette-by-pos.
- **Blend** — one of 17 blend modes (see below).
- **Opacity** — 0…1 alpha. At opacity < 1 the layer's colours alpha-blend toward the layer below.
- **🌊 Animate** — wiggle every numeric param of this layer on a sine wave.
- **(generator-specific params)** — scale, contrast, iterations, etc.

## The 17 blend modes

Asciidream supports both standard image-compositing blends and ASCII-native ones.

### Color blends (mix the colours of the two layers)

| Mode | Math |
|---|---|
| `normal` | Top replaces bottom where non-space; opacity alpha-blends colour. |
| `multiply` | per-channel `a × b / 255`. Darkens. |
| `screen` | per-channel `255 - (255-a)(255-b)/255`. Lightens. |
| `overlay` | Multiply darks, screen lights. High contrast. |
| `soft-light` | Smoother overlay (W3C formula). |
| `darken` | per-channel `min(a, b)`. |
| `lighten` | per-channel `max(a, b)`. |
| `add` | per-channel `clamp(a + b, 0, 255)`. |
| `subtract` | per-channel `clamp(a - b, 0, 255)`. |
| `difference` | per-channel `|a - b|`. |

### Character blends (decide which glyph wins)

| Mode | Behavior |
|---|---|
| `char-only` | Top's character replaces bottom's where non-space; colour stays from bottom. |
| `color-only` | Top's colour replaces bottom's; character stays from bottom. |
| `replace-where-space` | Top fills only the bottom's spaces. Good for overlaying patterns onto sparse output. |
| `erase` | Top's non-space chars erase to space on bottom. |
| `darken-char` | Per cell, keep the **denser** glyph of the two (looked up in the active charset's ramp). |
| `lighten-char` | Same but keep the **sparser** glyph. |
| `mask` | Top's luminance gates the bottom: bright top → bottom shows; dark top → bottom is hidden. |

### Combining: opacity + blend

`opacity` is applied **after** the blend math. So `opacity=0.5 + multiply` produces a multiplied result that's then alpha-blended halfway toward the original underlying colour. This gives smooth fade-in/out of effect-layers.

## Tips

- **Start with one image, then add a pattern on top.** Use blend = `multiply` or `overlay` to texture the photo. Drop opacity to 0.3 for a subtle effect.
- **Use a Mandala layer on top of an image** with `multiply` blend for a kaleidoscopic photo.
- **Stack multiple images** — drop several photos in a row; each lands as a new layer. Use blend = `darken` on the top one to combine.
- **Use `mask` blend** when you want the top layer to act as a stencil for the bottom. Try a high-contrast image generator on top of a noise field.
- **Use `darken-char` between two CA layers** to keep whichever automaton is currently "denser" at each cell — interesting evolution interferences.

## Bulk actions

| Button | Without multi-select | With multi-select |
|---|---|---|
| `+ Add` | Adds one layer on top, named "Layer N". | (Same.) |
| `Dup` | Duplicates the selected layer just above itself. | Duplicates all selected, contiguous, just above the highest. |
| `Del` | Deletes the selected layer. | Deletes all selected in one undo. Refuses if it would leave zero layers. |

All bulk operations are a single undo step.
