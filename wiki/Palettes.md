# Palettes

The Palettes panel sits in the middle of the left sidebar and contains 28 bundled colour themes. Click any palette to apply it to the whole project — the change is instant and undoable.

![Palettes panel](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/palettes-panel.png)

## The 28 bundled palettes

### Monochrome / paper

- `Paper white` — black on warm off-white.
- `Terminal green` — phosphor-CRT classic.
- `Amber` — IBM amber-on-black.

### Retro computing

- `Game Boy DMG` — original Game Boy 4-green.
- `PICO-8` — Lexaloffle's 16-colour palette.
- `NES`, `CGA 0`, `CGA 1`, `CGA hi`.

### Scientific (matplotlib / D3)

- `Viridis`, `Magma`, `Inferno`, `Plasma`, `Turbo`, `Cividis`.

### Modern / dark-mode

- `Gruvbox`, `Nord`, `Dracula`, `Solarized D`, `Cyberpunk`, `Vaporwave`, `Twilight`.

### Print / poster

- `Risograph`, `Bauhaus`, `Memphis 80s`, `Newsprint`.

### Nature

- `Forest`, `Ocean`.

## How palettes are used

Each generator can colour its output in different ways via the **Color mode** dropdown in the Inspector:

| Color mode | What it does |
|---|---|
| `solid` | Single foreground colour (last palette entry). |
| `two-tone` | Split by density — light pixels get one palette colour, dark pixels get another. |
| `palette-density` *(default)* | Sample the palette as a gradient from low to high density. |
| `palette-random` | Sample randomly per cell, seeded. |
| `palette-by-pos` | Sample by position on the canvas (linear/radial). |

## The image-layer quirk (and the auto-fix)

By default the **Image → ASCII** generator has **`Use image colors`** turned on, which means each cell gets a colour sampled from the original photo — the palette has no visible effect on an image layer.

To make palette clicks work intuitively on images, **Asciidream auto-disables "Use image colors" when you click a palette while an image layer is selected**. A toast tells you it happened, and a single `Ctrl+Z` restores both the previous palette and the previous "use image colors" setting.

If you want to keep the original photo colours, just don't click another palette. If you want palette colouring, the click does the right thing.

## Interpolation in OKLab

Colours in palettes are stored as hex RGB but interpolated through **OKLab** — a perceptually-uniform colour space. So a gradient from blue to yellow doesn't pass through muddy grey; it passes through perceptually-balanced midtones.

```
RGB midpoint of (0,0,255) and (255,255,0)?
  = (127, 127, 127) — gray
OKLab midpoint?
  = a saturated mid-purple that feels equidistant
```

This matters most for `palette-density` mode on generators with smooth gradients (Perlin, fBm, Mandelbrot escape-time).

## Adding palettes

Palettes are defined inline near the top of `asciidream.html`:

```js
const PALETTES = [
  {id:'mono-paper',    name:'Paper white',    colors:['#0a0a0a','#e8e6df']},
  {id:'gameboy',       name:'Game Boy DMG',   colors:['#0f380f','#306230','#8bac0f','#9bbc0f']},
  // …
];
```

Add an entry, rebuild. Order in this array = order in the panel.

## Tip: the "vaporwave dino"

For instant aesthetic results:

1. Drop a dramatic photo (silhouette, building, fossil — see the spec).
2. Set Charset = Braille.
3. Click `Vaporwave` palette (note "Use image colors" auto-turns off).
4. Switch Mode to `edges`.

You'll get a pink-and-cyan neon outline drawing.

![Vaporwave example](https://raw.githubusercontent.com/aivrar/asciidream/main/screenshots/palette-vaporwave-edges.png)
