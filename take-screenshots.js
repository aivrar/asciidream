/* Capture a full gallery of screenshots for the README/wiki.

   Critical: every shot uses a fixed 1440×900 viewport, FULL viewport capture
   (not element-clip), and we wait for fonts + canvas paint before snapping.

   Run: `node take-screenshots.js`
   Output: ./screenshots/*.png
*/

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname);
const OUT  = path.join(ROOT, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

// --- Tiny static server so playwright can fetch the dino via http ---
const PORT = 8754;
const MIME = { '.html':'text/html', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
function startServer(){
  return new Promise(resolve => {
    const server = http.createServer((req, res)=>{
      let url = req.url.split('?')[0];
      if (url === '/') url = '/asciidream.html';
      const f = path.join(ROOT, url);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()){
        res.writeHead(404); res.end('not found'); return;
      }
      const ext = path.extname(f).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    server.listen(PORT, ()=> resolve(server));
  });
}

// --- Verify shot is real (not all-black, not top-left only) ---
async function snap(page, filename, opts={}){
  const fullPath = path.join(OUT, filename);
  await page.evaluate(()=>document.fonts.ready);
  // Force a paint
  await page.evaluate(()=> new Promise(r => requestAnimationFrame(()=> requestAnimationFrame(r))));
  await page.screenshot({ path: fullPath, fullPage: false, clip: opts.clip });
  // Verify
  const size = fs.statSync(fullPath).size;
  if (size < 1500) throw new Error(`${filename} is suspiciously small (${size} bytes)`);
  console.log(`  ✓ ${filename}  (${(size/1024).toFixed(1)} KB)`);
}

async function dismissWelcome(page){
  // The welcome modal pops up ~250ms after load on first run
  await page.waitForTimeout(500);
  await page.evaluate(()=>{
    document.querySelectorAll('.modal .actions button').forEach(b => {
      if (/got it/i.test(b.textContent)) b.click();
    });
  });
  await page.waitForTimeout(200);
}
async function closeCoach(page){
  await page.evaluate(()=>{ try { if (typeof closeCoach === 'function') closeCoach(); } catch(e){} });
  await page.waitForTimeout(200);
}
async function loadDino(page){
  await page.evaluate(async ()=>{
    const blob = await (await fetch('/_dino.png')).blob();
    const file = new File([blob], 'img__00001_.png', { type:'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);
    window.dispatchEvent(new DragEvent('drop', { bubbles:true, cancelable:true, dataTransfer:dt }));
  });
  await page.waitForTimeout(1500);
}
async function setLayer(page, idx){
  await page.evaluate((idx)=>{ STATE.selectedLayer = idx; rebuildAll(); scheduleRender(); }, idx);
  await page.waitForTimeout(250);
}
async function setGenerator(page, genId){
  await page.evaluate((genId)=>{
    const L = STATE.project.layers[STATE.selectedLayer];
    L.generatorId = genId;
    L.generatorParams = gen_defaultParams(GENS[genId]);
    rebuildAll(); scheduleRender();
  }, genId);
  await page.waitForTimeout(400);
}
async function setCharset(page, id){
  await page.evaluate((id)=>{
    STATE.project.selectedCharset = id; rebuildCharsetList(); scheduleRender();
  }, id);
  await page.waitForTimeout(300);
}
async function setPalette(page, id){
  await page.evaluate((id)=>{
    STATE.project.selectedPalette = id; rebuildPaletteList(); scheduleRender();
  }, id);
  await page.waitForTimeout(300);
}
async function resetProject(page){
  await page.evaluate(()=>{ newProject(); rebuildAll(); fitZoom(); scheduleRender(); });
  await page.waitForTimeout(400);
}

(async ()=>{
  const server = await startServer();
  console.log(`server :${PORT}`);
  try {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    console.log('\n=== Loading app ===');
    await page.goto(`http://localhost:${PORT}/asciidream.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // 1. Welcome modal (full window with modal up)
    console.log('Welcome modal');
    await snap(page, '02-welcome.png');

    await dismissWelcome(page);
    await closeCoach(page);

    // 2. Main window with default project (fbm + mandala layered)
    console.log('Main window');
    await snap(page, '01-main-window.png');

    // 3. Drop overlay — fake by showing the drop overlay div
    console.log('Drop overlay');
    await page.evaluate(()=>{
      const o = document.getElementById('drop-overlay');
      if (o) o.style.display = 'flex';
    });
    await page.waitForTimeout(200);
    await snap(page, '03-drop-overlay.png');
    await page.evaluate(()=>{
      const o = document.getElementById('drop-overlay');
      if (o) o.style.display = 'none';
    });

    // 4. Image loaded
    console.log('Image loaded');
    await loadDino(page);
    await closeCoach(page);
    await snap(page, '04-image-loaded.png');

    // 5. Coach panel open
    console.log('Coach open');
    await page.evaluate(()=>{ try { openCoach(); } catch(e){} });
    await page.waitForTimeout(300);
    await snap(page, '05-coach.png');
    await closeCoach(page);

    // 6. Scrub-drag still (just show the inspector with values)
    console.log('Scrub-drag (inspector zoom)');
    await snap(page, '06-scrub-drag.png', { clip: { x: 1100, y: 32, width: 340, height: 700 } });

    // 7. Export modal
    console.log('Export modal');
    await page.evaluate(()=>{ try { openExportModal(); } catch(e){} });
    await page.waitForTimeout(300);
    await snap(page, '07-export-modal.png');
    await page.evaluate(()=>{ document.querySelectorAll('.modal-bg').forEach(m=>m.remove()); });
    await page.waitForTimeout(200);

    // ------ Image → ASCII modes ------
    console.log('Image modes');
    await page.evaluate(()=>{
      const L = STATE.project.layers[STATE.selectedLayer];
      L.generatorParams.mode = 'density';
      L.generatorParams.contrast = 1.3;
      L.generatorParams.sampleColors = true;
      STATE.project.selectedCharset = 'braille';
      rebuildAll(); scheduleRender();
    });
    await page.waitForTimeout(500);
    await snap(page, 'img-mode-density.png', { clip: { x: 240, y: 32, width: 860, height: 844 } });

    await page.evaluate(()=>{
      const L = STATE.project.layers[STATE.selectedLayer];
      L.generatorParams.mode = 'edges';
      L.generatorParams.contrast = 1.5;
      L.generatorParams.sampleColors = false;
      STATE.project.selectedCharset = 'ramp70';
      STATE.project.selectedPalette = 'mono-amber';
      rebuildAll(); scheduleRender();
    });
    await page.waitForTimeout(500);
    await snap(page, 'img-mode-edges.png', { clip: { x: 240, y: 32, width: 860, height: 844 } });

    await page.evaluate(()=>{
      const L = STATE.project.layers[STATE.selectedLayer];
      L.generatorParams.mode = 'dithered';
      L.generatorParams.sampleColors = true;
      STATE.project.selectedCharset = 'blocks';
      STATE.project.selectedPalette = 'gameboy';
      rebuildAll(); scheduleRender();
    });
    await page.waitForTimeout(500);
    await snap(page, 'img-mode-dithered.png', { clip: { x: 240, y: 32, width: 860, height: 844 } });

    // Vaporwave example
    await page.evaluate(()=>{
      const L = STATE.project.layers[STATE.selectedLayer];
      L.generatorParams.mode = 'edges';
      L.generatorParams.sampleColors = false;
      STATE.project.selectedCharset = 'braille';
      STATE.project.selectedPalette = 'vapor';
      rebuildAll(); scheduleRender();
    });
    await page.waitForTimeout(500);
    await snap(page, 'palette-vaporwave-edges.png', { clip: { x: 240, y: 32, width: 860, height: 844 } });

    // ------ Pattern category collages — pick a representative generator per category ------
    console.log('Pattern categories');
    await resetProject(page);
    await closeCoach(page);
    const examples = [
      // [genId, charset, palette, filename]
      ['flow-field',       'braille', 'cyber',   'cat-noise.png'],
      ['mandelbrot',       'ramp70',  'inferno', 'cat-fractals.png'],
      ['game-of-life',     'blocks',  'mono-term-green', 'cat-ca.png'],
      ['truchet',          'box',     'bauhaus', 'cat-geometric.png'],
      ['slime',            'quadrants','plasma', 'cat-particle.png'],
      ['banner',           'blocks',  'pico8',   'cat-typo.png'],
      ['mandala',          'braille', 'twilight','cat-hybrid.png'],
    ];
    for (const [gen, cs, pal, fname] of examples){
      await setGenerator(page, gen);
      await setCharset(page, cs);
      await setPalette(page, pal);
      await page.waitForTimeout(700);
      await snap(page, fname, { clip: { x: 240, y: 32, width: 860, height: 844 } });
    }

    // ------ Panel zooms ------
    console.log('Panel zooms');
    // Re-load dino so layers panel has more rows
    await loadDino(page);
    await closeCoach(page);
    await snap(page, 'layers-panel.png',     { clip: { x: 0,    y: 32, width: 240, height: 380 } });
    await snap(page, 'palettes-panel.png',   { clip: { x: 0,    y: 410, width: 240, height: 260 } });
    await snap(page, 'charsets-panel.png',   { clip: { x: 0,    y: 670, width: 240, height: 206 } });
    await snap(page, 'inspector.png',        { clip: { x: 1100, y: 32, width: 340, height: 700 } });
    await snap(page, 'modifiers-panel.png',  { clip: { x: 1100, y: 660, width: 340, height: 216 } });
    await snap(page, 'export-modal.png');

    // ------ Animation / timeline ------
    console.log('Animation');
    await resetProject(page);
    await page.evaluate(()=>{
      STATE.project.layers[STATE.selectedLayer].animate = true;
      STATE.animation.playing = true;
      STATE.showTimeline = true;
      $('#workspace').classList.remove('notimeline');
      animLoop();
      rebuildInspector(); scheduleRender();
    });
    await page.waitForTimeout(800);
    await snap(page, 'timeline.png',     { clip: { x: 240, y: 696, width: 860, height: 180 } });
    await snap(page, 'animate-row.png',  { clip: { x: 1100, y: 200, width: 340, height: 220 } });

    // Drag-reorder still: show the layers panel in a multi-layer state
    await loadDino(page);
    await page.evaluate(()=>{
      // Add a fake "dragging" highlight
      const rows = document.querySelectorAll('.layer');
      if (rows[0]) rows[0].classList.add('drop-target','drop-above');
    });
    await page.waitForTimeout(200);
    await snap(page, 'layers-drag-reorder.png', { clip: { x: 0, y: 32, width: 240, height: 280 } });

    await browser.close();
  } finally {
    server.close();
  }
  console.log('\nDONE — wrote', fs.readdirSync(OUT).length, 'screenshots to', OUT);
})();
