const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

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

  console.log('🌐 Acessando a API para buscar os dados binários do vídeo...');
  await page.goto(SERVER_URL, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  const jsonContent = await page.evaluate(() => {
    return JSON.parse(document.body.innerText);
  });

  if (!jsonContent.dados_base64) {
    console.error('❌ Nenhum dado base64 encontrado no JSON.');
    await browser.close();
    process.exit(1);
  }

  const buffer = Buffer.from(jsonContent.dados_base64, 'base64');

  // Cria a pasta de destino se necessário
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`✅ Vídeo salvo em: ${OUTPUT_PATH}`);

  await browser.close();
})();
