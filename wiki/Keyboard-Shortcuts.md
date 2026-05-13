# Keyboard Shortcuts

All shortcuts in one table. Press **`?`** inside the app to bring up an in-app version of this.

## File

| Key | Action |
|---|---|
| `Ctrl+N` | New project (themed confirm before discarding the current one). |
| `Ctrl+O` | Open `.glyph` project file. |
| `Ctrl+S` | Save as `.glyph`. |
| `Ctrl+E` | Open the Export modal. |

## Edit

| Key | Action |
|---|---|
| `Ctrl+Z` | Undo. Unlimited up to 500 steps (configurable). |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo. |
| `R` | Re-seed the **current layer** (same generator, new random seed). |
| `Ctrl+R` | **Lucky** — swap to a random generator + random params + new seed. Image layers keep their generator and only re-roll dials. |

## View

| Key | Action |
|---|---|
| `Ctrl+0` | Fit canvas to window. |
| `Ctrl+K` | Open the **command palette** — fuzzy search for any generator, modifier, palette, charset, or action. |
| `F` | Toggle fullscreen. |
| `?` | Open the keyboard shortcuts modal (= this page). |
| `Ctrl+Mouse-wheel` over canvas | Zoom. |

## Patterns (Generators)

| Key | Action |
|---|---|
| `]` | Cycle to next generator. |
| `[` | Cycle to previous generator. |

## Layers

| Key | Action |
|---|---|
| `Ctrl+Shift+N` | New layer (above the current one). |
| `Ctrl+J` | Duplicate current selection. |
| `Ctrl+click` / `⌘+click` on a layer | Toggle in the multi-selection. |
| `Shift+click` on a layer | Range-select between primary and clicked. |
| Drag the `⠿` handle | Reorder layers. |
| `Del` button in panel | Delete all selected layers (themed). |

## Animation

| Key | Action |
|---|---|
| `Space` | Play / Pause the timeline. |
| `←` | Step back one frame. |
| `→` | Step forward one frame. |
| Click `🌊 Animate all` on timeline | Flip Animate on every visible layer. |

## Inspector & scrub-drag

These aren't quite keyboard shortcuts but they live with the keyboard:

| Mouse action | Effect |
|---|---|
| Drag any parameter **label** horizontally | Scrub the value. |
| `Shift` while dragging | 5× sensitivity. |
| `Alt` while dragging | 0.1× sensitivity (precision). |
| Wheel over a number box / label | Nudge by one step. |
| `Shift` + wheel | Nudge by 10 steps. |
| `Alt` + wheel | Nudge by 0.1 steps. |

## Window controls

| Button | Action |
|---|---|
| `─` | Minimize. |
| `▢` | Maximize / restore. |
| `⏻ SHUTDOWN` | Hard close — no save prompt, exits cleanly. |
| `✕` | Same as Shutdown. |

The titlebar between menus and pills is a **drag region** — grab to move the window.

## Command Palette (`Ctrl+K`)

The command palette searches across **every action in the app**:

- Every generator name.
- Every modifier name.
- Every palette name.
- Every charset name.
- Re-seed, Lucky, New layer, Resize canvas, Help, Export.

Type a few letters. Up/Down to navigate. Enter to apply.

Use it when you've forgotten where something lives in the UI, or when you just want to keep your hands on the keyboard.

## Drag-drop

Drop any image file (PNG/JPG/GIF/WEBP) anywhere on the window → it loads as a new top layer.
