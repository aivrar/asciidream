/* Regenerate the artistic showcase shots at NATIVE canvas resolution
   (canvas.toDataURL) so they're actually impressive, not tiny clips of a
   mostly-black canvas. */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname);
const OUT  = path.join(ROOT, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const PORT = 8759;
const MIME = { '.html':'text/html', '.png':'image/png' };
function startServer(){
  return new Promise(resolve => {
    const s = http.createServer((req, res)=>{
      let url = req.url.split('?')[0];
      if (url === '/') url = '/asciidream.html';
      const f = path.join(ROOT, url);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(PORT, ()=> resolve(s));
  });
}

async function grabCanvas(page, filename){
  const dataUrl = await page.evaluate(()=> document.getElementById('preview').toDataURL('image/png'));
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  const p = path.join(OUT, filename);
  fs.writeFileSync(p, buf);
  console.log(`  ✓ ${filename}  (${(buf.length/1024).toFixed(1)} KB, ${buf.length} bytes)`);
}

async function setup(page, cfg){
  await page.evaluate((cfg)=>{
    const proj = STATE.project;
    proj.canvas.cols = cfg.cols || 240;
    proj.canvas.rows = cfg.rows || 100;
    proj.selectedCharset = cfg.charset;
    proj.selectedPalette = cfg.palette;
    const newL = Object.assign(defaultLayer(cfg.gen, cfg.gen), {
      generatorParams: Object.assign(gen_defaultParams(GENS[cfg.gen]), cfg.params || {}),
      seed: cfg.seed || 7,
      blend: 'normal',
      opacity: 1,
      colorMode: cfg.colorMode || 'palette-density'
    });
    // Some generators bake colorMode in via the ctx.colorMode shadow on the
    // layer (set in defaultLayer). Make sure the override sticks.
    newL.colorMode = cfg.colorMode || 'palette-density';
    proj.layers = [newL];
    STATE.selectedLayer = 0;
    rebuildAll(); fitZoom(); scheduleRender();
  }, cfg);
  await page.waitForTimeout(900);
}

(async ()=>{
  const server = await startServer();
  try {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}/asciidream.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.evaluate(()=>{
      document.querySelectorAll('.modal .actions button').forEach(b => { if (/got it/i.test(b.textContent)) b.click(); });
    });
    await page.waitForTimeout(300);
    await page.evaluate(()=>{ try { if (typeof closeCoach==='function') closeCoach(); }catch(e){} });

    const shots = [
      // [filename, config]
      // Flow Field: ~3000 particles to fill canvas with vibrant trails
      ['cat-noise.png', {
        gen: 'flow-field', charset: 'braille', palette: 'turbo',
        params: { scale: 0.018, particles: 3500, steps: 100, speed: 0.8 },
        cols: 240, rows: 100, seed: 11
      }],
      // Mandelbrot zoom=1 = whole set + colorful escape gradient
      ['cat-fractals.png', {
        gen: 'mandelbrot', charset: 'bourke70', palette: 'plasma',
        params: { cx: -0.5, cy: 0, zoom: 1.2, iter: 150 },
        cols: 240, rows: 100, seed: 1
      }],
      // Wolfram rule 30 — fills the canvas top to bottom
      ['cat-ca.png', {
        gen: 'elem-ca', charset: 'blocks', palette: 'inferno',
        params: { rule: 30, seedMode: 'single' },
        cols: 200, rows: 100, seed: 1,
        colorMode: 'palette-by-pos'
      }],
      // Truchet was already good — keep as-is
      ['cat-geometric.png', {
        gen: 'truchet', charset: 'box', palette: 'bauhaus',
        params: { tileSize: 6, style: 'arc' },
        cols: 200, rows: 90, seed: 5
      }],
      // Slime mold — needs many agents over many steps to coat the canvas
      ['cat-particle.png', {
        gen: 'slime', charset: 'quadrants', palette: 'turbo',
        params: { agents: 3000, steps: 80, sensorAngle: 25, sensorDist: 4, turn: 22, decay: 0.96 },
        cols: 200, rows: 90, seed: 9
      }],
      // Mosaic — runs different generator per tile = lots of variety
      ['cat-typo.png', {
        gen: 'banner', charset: 'blocks', palette: 'pico8',
        params: { text: 'ASCII', scaleX: 4, scaleY: 4, align: 'center', fill: '█' },
        cols: 240, rows: 100, seed: 1
      }],
      // Mandala — spread color across the canvas by position, not density
      ['cat-hybrid.png', {
        gen: 'mandala', charset: 'braille', palette: 'turbo',
        params: { folds: 14, scale: 0.05, layers: 4 },
        cols: 240, rows: 100, seed: 17,
        colorMode: 'palette-by-pos'
      }],
    ];

    for (const [name, cfg] of shots){
      console.log(name);
      await setup(page, cfg);
      await grabCanvas(page, name);
    }

    // Also re-do the image-mode shots
    const dinoPath = path.join(ROOT, '_dino.png');
    if (fs.existsSync(dinoPath)){
      console.log('image modes');
      await page.evaluate(async ()=>{
        const blob = await (await fetch('/_dino.png')).blob();
        const file = new File([blob], 'dino.png', {type:'image/png'});
        const dt = new DataTransfer(); dt.items.add(file);
        window.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));
      });
      await page.waitForTimeout(1200);
      await page.evaluate(()=>{ try{closeCoach();}catch(e){} });

      const dinoConfigs = [
        // Bright density: lift brightness a lot + use original colors
        ['img-mode-density.png',  { mode:'density',  contrast:0.9, brightness:0.45, sampleColors:true, charset:'braille', palette:'inferno' }],
        // Edges in amber: technical-drawing aesthetic
        ['img-mode-edges.png',    { mode:'edges',    contrast:1.5,                  sampleColors:false, charset:'ramp70',  palette:'mono-amber' }],
        // Dithered Game Boy — bright lift
        ['img-mode-dithered.png', { mode:'dithered', brightness:0.15,               sampleColors:false, charset:'blocks',  palette:'gameboy', colorMode:'palette-density' }],
        // Vaporwave neon — palette-by-pos color spread
        ['palette-vaporwave-edges.png', { mode:'edges', contrast:1.6,               sampleColors:false, charset:'braille', palette:'vapor', colorMode:'palette-by-pos' }],
      ];
      for (const [name, c] of dinoConfigs){
        console.log(name);
        await page.evaluate((c)=>{
          const proj = STATE.project;
          proj.canvas.cols = 280; proj.canvas.rows = 110;
          proj.selectedCharset = c.charset;
          proj.selectedPalette = c.palette;
          const L = proj.layers[proj.layers.length-1];
          L.generatorParams.mode = c.mode;
          if (c.contrast !== undefined) L.generatorParams.contrast = c.contrast;
          if (c.brightness !== undefined) L.generatorParams.brightness = c.brightness;
          L.generatorParams.sampleColors = c.sampleColors;
          if (c.colorMode) L.colorMode = c.colorMode;
          rebuildAll(); fitZoom(); scheduleRender();
        }, c);
        await page.waitForTimeout(1100);
        await grabCanvas(page, name);
      }
    }

    await browser.close();
  } finally {
    server.close();
  }
})();
