/* Generate a single hero shot for the README front page.
   Wider aspect ratio, dramatic content, full window with the app's chrome. */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname);
const OUT  = path.join(ROOT, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const PORT = 8757;
const MIME = { '.html':'text/html', '.png':'image/png', '.jpg':'image/jpeg' };
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

(async ()=>{
  const server = await startServer();
  console.log(`server :${PORT}`);
  try {
    const browser = await chromium.launch();
    // Wide banner-style aspect for a hero
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    await page.goto(`http://localhost:${PORT}/asciidream.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    // dismiss welcome
    await page.evaluate(()=>{
      document.querySelectorAll('.modal .actions button').forEach(b => {
        if (/got it/i.test(b.textContent)) b.click();
      });
    });
    await page.waitForTimeout(300);

    // Load dino, then set a striking config: braille + vaporwave + edges
    await page.evaluate(async ()=>{
      const blob = await (await fetch('/_dino.png')).blob();
      const file = new File([blob], 'img__00001_.png', { type:'image/png' });
      const dt = new DataTransfer();
      dt.items.add(file);
      window.dispatchEvent(new DragEvent('drop', { bubbles:true, cancelable:true, dataTransfer:dt }));
    });
    await page.waitForTimeout(1500);

    // close the coach + tune the look
    await page.evaluate(()=>{
      try { if (typeof closeCoach === 'function') closeCoach(); } catch(e){}
      const L = STATE.project.layers[STATE.selectedLayer];
      L.generatorParams.mode = 'density';
      L.generatorParams.contrast = 1.25;
      L.generatorParams.sampleColors = true;
      STATE.project.selectedCharset = 'braille';
      STATE.project.selectedPalette = 'vapor';
      // Resize the canvas larger to fill the hero
      STATE.project.canvas.cols = 200;
      STATE.project.canvas.rows = 80;
      rebuildAll(); fitZoom(); scheduleRender();
    });
    await page.waitForTimeout(900);

    // Snap full window — gives us a 1600×900 hero
    await page.screenshot({ path: path.join(OUT, '00-hero.png') });
    const size = fs.statSync(path.join(OUT, '00-hero.png')).size;
    console.log(`hero: ${(size/1024).toFixed(1)} KB`);

    await browser.close();
  } finally {
    server.close();
  }
})();
