const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'https://livestream.ct.ws/Api/vídeo.php';
const OUTPUT_PATH = path.join(__dirname, 'videos', 'entrada.mp4');

(async () => {
  console.log('🚀 Iniciando Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/91.0.4472.114 Safari/537.36");

    console.log('🌐 Acessando o servidor...');
    const response = await page.goto(SERVER_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const status = response.status();
    const contentType = response.headers()['content-type'];

    console.log(`📡 Status HTTP: ${status}`);
    console.log(`📁 Tipo de conteúdo: ${contentType}`);

    if (status !== 200 || !contentType.includes('video')) {
      console.error(`❌ Conteúdo inválido ou não é vídeo: ${contentType}`);
      const html = await page.content();
      console.error('🧾 HTML retornado (parcial):\n', html.slice(0, 500));
      await browser.close();
      process.exit(1);
    }

    console.log('📥 Recebendo vídeo binário...');
    const buffer = await response.buffer();

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, buffer);
    console.log(`✅ Vídeo salvo em: ${OUTPUT_PATH}`);

    await browser.close();
  } catch (err) {
    console.error('❌ Erro no Puppeteer:', err);
    await browser.close();
    process.exit(1);
  }
})();
