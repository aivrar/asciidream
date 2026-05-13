# Inspector & Scrub-Drag

The Inspector is the right-side panel that shows everything you can tune about the currently-selected layer. It's the most-used surface in the app, so the controls are designed for speed.

![Inspector panel](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/inspector.png)

## Anatomy

For each layer, the Inspector shows:

1. **Generator name + description** at the top, in cyan.
2. **A "Pro tip" hint** reminding you about scrub-drag.
3. **Universal fields**: Seed, Name, Color mode, Blend, Opacity, 🌊 Animate.
4. **Generator-specific params**: scale / contrast / iterations / brightness / etc., automatically generated from each generator's param schema.

## Scrub-drag

The defining interaction. **Drag any parameter label horizontally**:

![Scrub-drag in motion](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/scrub-drag.png)

While dragging, a small tooltip near the cursor shows the live value:

```
Contrast: 1.85
```

The canvas updates in real time. Release to commit (one undo step covers the whole drag).

### Sensitivity modifiers

| Hold | Effect |
|---|---|
| (nothing) | Default sensitivity. About 300 pixels of horizontal travel covers the full parameter range. |
| **Shift** | 5× sensitivity. Useful for bigger swings. |
| **Alt** | 0.1× sensitivity. Useful for precision dialling. |

### Why scrub-drag

Traditional slider-only inputs require precise mouse positioning on a small target. Scrub-drag treats every label as an infinite slider you can grab from anywhere. Same idea as Figma's number inputs and Blender's "drag-to-scrub". It's much faster once you internalize it.

## Mouse wheel

Hover the parameter label *or* the number box on the right of the row, then scroll:

- Each wheel notch = one step.
- **Shift** + wheel = 10 steps.
- **Alt** + wheel = 0.1 steps.

The number box also auto-syncs with the slider.

## Direct typing

Click into the number box (right of each row). Type a value. Hit Enter or click out. Clamped to the parameter's min/max.

## Slider behavior

The slider in the middle of each row is fully synchronized with everything else. Drag it, scrub the label, type in the box, or wheel — they all reflect the same state.

## Universal rows (every layer)

- **Seed** — integer 0–10⁹. `R` re-rolls the current layer. `Ctrl+R` (Lucky) re-rolls *and* picks a different generator.
- **Name** — layer name. Auto-renamed when the generator changes, unless you've customized it.
- **Color mode** — `solid`, `two-tone`, `palette-density`, `palette-random`, `palette-by-pos`. Affects how the generator's density gets coloured.
- **Blend** — see [Layers](Layers) for the 17 modes.
- **Opacity** — 0…1. Alpha-blends this layer's colours toward the layer below.
- **🌊 Animate** — turn on the sine-wave wiggle on every numeric param of this layer. When on, two more dials appear: `· wiggle` (0…0.5 of the parameter range) and `· speed` (0.05…5).

## Parameter types

The Inspector auto-renders controls based on each generator's typed param schema:

| Schema type | Control rendered |
|---|---|
| `number` | Scrubbable label + slider + number box. |
| `int` | Same, snapped to integers. |
| `bool` | Checkbox. |
| `enum` | Dropdown. |
| `string` | Text input. |
| `multiline` | Textarea (used for L-System custom rules). |
| `color` | Native browser color picker. |
| `file` | "📁 Load image…" button + filename status. Used by the Image generators. |

You don't ever have to write UI code per generator — adding a new generator and giving it a param schema makes its UI appear automatically.

## Inspector during multi-selection

When you Ctrl-click several layers, the Inspector still shows the **primary** layer's settings. The crucial exception: **Animate**, **Delete**, and **Duplicate** apply to *all* selected layers when you trigger them.

For per-parameter tweaks, you have to edit each layer individually — or use the timeline-strip **🌊 Animate all** button to flip every visible layer's Animate at once.

## Pro tips

- **Drag, don't click.** Once you internalize scrub-drag, you'll never click a slider again.
- **Shift = big, Alt = small.** Combine them: shift-drag for first-pass aim, then alt-drag for fine-tuning.
- **Wheel inside the number box.** Doesn't move the cursor, snaps to step.
- **Press R repeatedly.** Cycles through random seeds on the current generator. Useful for "I like this style, give me another version" exploration.
- **Press Ctrl+R repeatedly.** Cycles through random *generators*. The same workflow but for "show me something totally different".
