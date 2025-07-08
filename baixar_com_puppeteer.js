const puppeteer = require('puppeteer');
const https = require('https');
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
    console.log('🌐 Acessando o servidor...');

    const response = await page.goto(SERVER_URL, {
      timeout: 60000
    });

    // Verifica se o servidor está respondendo corretamente
    const status = response.status();
    if (status !== 200 && status !== 206) {
      console.error(`❌ Erro HTTP: ${status}`);
      await browser.close();
      return;
    }

    // Use Node.js para baixar o vídeo binário
    console.log('📥 Baixando o vídeo com https.get...');

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    const file = fs.createWriteStream(OUTPUT_PATH);

    https.get(SERVER_URL, (res) => {
      if (res.statusCode !== 200 && res.statusCode !== 206) {
        console.error(`❌ Erro ao baixar vídeo: ${res.statusCode}`);
        return;
      }

      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`✅ Vídeo salvo em: ${OUTPUT_PATH}`);
        });
      });
    }).on('error', (err) => {
      console.error('❌ Erro ao baixar com https.get:', err.message);
    });

    await browser.close();
  } catch (err) {
    console.error('❌ Erro no Puppeteer:', err);
    await browser.close();
    process.exit(1);
  }
})();
