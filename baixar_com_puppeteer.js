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

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/91.0.4472.114 Safari/537.36");

  console.log('🎯 Interceptando resposta com vídeo...');
  let videoCaptured = false;

  page.on('response', async (response) => {
    const url = response.url();
    const headers = response.headers();

    if (headers['content-type'] && headers['content-type'].includes('video/mp4') && !videoCaptured) {
      videoCaptured = true;

      console.log(`📡 Capturado vídeo da URL: ${url}`);
      console.log(`📁 Tipo de conteúdo: ${headers['content-type']}`);

      try {
        const buffer = await response.buffer();
        fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
        fs.writeFileSync(OUTPUT_PATH, buffer);
        console.log(`✅ Vídeo salvo em: ${OUTPUT_PATH}`);
        await browser.close();
        process.exit(0);
      } catch (err) {
        console.error('❌ Erro ao capturar binário:', err);
        await browser.close();
        process.exit(1);
      }
    }
  });

  console.log('🌐 Acessando o servidor...');
  await page.goto(SERVER_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // Se o vídeo não for capturado em até 15s, encerramos
  setTimeout(async () => {
    if (!videoCaptured) {
      console.error('❌ Vídeo não foi detectado na resposta.');
      await browser.close();
      process.exit(1);
    }
  }, 15000);
})();
