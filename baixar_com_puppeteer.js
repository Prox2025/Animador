const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'https://livestream.ct.ws/Api/vídeo.php';
const OUTPUT_PATH = path.join(__dirname, 'videos', 'entrada.mp4');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.emulateTimezone('Africa/Maputo');
    console.log("🌐 Acessando servidor de vídeo...");

    const response = await page.goto(SERVER_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const buffer = await response.buffer();

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, buffer);
    console.log(`✅ Vídeo salvo em: ${OUTPUT_PATH}`);

    await browser.close();
  } catch (err) {
    console.error('❌ Erro ao baixar vídeo:', err);
    await browser.close();
    process.exit(1);
  }
})();
