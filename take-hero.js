/* Hero: full canvas only, no UI chrome.
   Big resolution, dense charset, vibrant palette, dramatic generator. */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname);
const OUT  = path.join(ROOT, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const PORT = 8758;
const MIME = { '.html':'text/html', '.png':'image/png', '.jpg':'image/jpeg' };
function startServer(){
  return new Promise(resolve => {
    const server = http.createServer((req, res)=>{
      let url = req.url.split('?')[0];
      if (url === '/') url = '/asciidream.html';
      const f = path.join(ROOT, url);
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
      const ext = path.extname(f).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    server.listen(PORT, ()=> resolve(server));
  });
}

(async ()=>{
  const server = await startServer();
  try {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}/asciidream.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Dismiss welcome
    await page.evaluate(()=>{
      document.querySelectorAll('.modal .actions button').forEach(b => {
        if (/got it/i.test(b.textContent)) b.click();
      });
    });
    await page.waitForTimeout(300);

    // Hero: full-canvas Voronoi cells in Turbo (rainbow), each cell a
    // saturated colour from palette-random, every grid position filled.
    await page.evaluate(()=>{
      try { if (typeof closeCoach === 'function') closeCoach(); } catch(e){}
      const proj = STATE.project;
      proj.canvas.cols = 280;
      proj.canvas.rows = 110;
      proj.selectedCharset = 'quadrants';
      proj.selectedPalette = 'turbo';
      proj.layers = [
        Object.assign(defaultLayer('Cells', 'voronoi-stipple'), {
          generatorParams: Object.assign(gen_defaultParams(GENS['voronoi-stipple']), {
            points: 60, glyphPerCell: true
          }),
          seed: 23, blend: 'normal', opacity: 1, colorMode: 'palette-random'
        }),
        Object.assign(defaultLayer('Mandala', 'mandala'), {
          generatorParams: Object.assign(gen_defaultParams(GENS['mandala']), {
            folds: 14, scale: 0.05, layers: 3
          }),
          seed: 1, blend: 'multiply', opacity: 0.55, colorMode: 'palette-density'
        })
      ];
      STATE.selectedLayer = 1;
      rebuildAll(); fitZoom(); scheduleRender();
    });
    await page.waitForTimeout(1200);

    // Pull the rendered canvas at its NATIVE pixel resolution (every cell
    // at full cellW × cellH). The viewport screenshot would downscale it.
    const dataUrl = await page.evaluate(()=>{
      const c = document.getElementById('preview');
      return c.toDataURL('image/png');
    });
    const b64 = dataUrl.split(',')[1];
    const buf = Buffer.from(b64, 'base64');
    fs.writeFileSync(path.join(OUT, '00-hero.png'), buf);
    console.log(`hero: ${(buf.length/1024).toFixed(1)} KB, ${buf.length} bytes`);

    await browser.close();
  } finally {
    server.close();
  }
})();
