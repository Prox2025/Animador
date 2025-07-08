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

    const response = await page.goto(SERVER_URL, { timeout: 60000 });
    const status = response.status();
    const contentType = response.headers()['content-type'];

    console.log(`📡 Status HTTP: ${status}`);
    console.log(`📁 Tipo de conteúdo: ${contentType}`);

    if (status !== 200 || !contentType.startsWith('video/')) {
      console.error('❌ Conteúdo inválido ou não é um vídeo.');
      await browser.close();
      process.exit(1);
    }

    // Agora faz o download binário com https.get
    console.log('📥 Baixando o vídeo com https.get...');

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    const file = fs.createWriteStream(OUTPUT_PATH);

    https.get(SERVER_URL, (res) => {
      if (res.statusCode !== 200) {
        console.error(`❌ Erro HTTP ao baixar: ${res.statusCode}`);
        process.exit(1);
      }

      const type = res.headers['content-type'] || '';
      if (!type.startsWith('video/')) {
        console.error(`❌ Resposta não é vídeo: ${type}`);
        process.exit(1);
      }

      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`✅ Vídeo salvo em: ${OUTPUT_PATH}`);
        });
      });
    }).on('error', (err) => {
      console.error('❌ Erro de rede:', err.message);
      process.exit(1);
    });

    await browser.close();
  } catch (err) {
    console.error('❌ Erro no Puppeteer:', err);
    await browser.close();
    process.exit(1);
  }
})();
