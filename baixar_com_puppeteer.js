const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const SERVER_URL = 'https://livestream.ct.ws/Api/video.php'; // Corrija a URL se necessário
const OUTPUT_PATH = path.join(__dirname, 'videos', 'entrada.mp4');

(async () => {
  console.log('🚀 Iniciando Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/91.0.4472.114 Safari/537.36");

  try {
    console.log('🌐 Acessando a API para buscar os dados binários do vídeo...');
    await page.goto(SERVER_URL, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    const jsonContent = await page.evaluate(() => {
      try {
        return JSON.parse(document.body.innerText);
      } catch (err) {
        return {};
      }
    });

    if (!jsonContent.dados_base64) {
      console.error('❌ Nenhum dado base64 encontrado no JSON.');
      await browser.close();
      process.exit(1);
    }

    const buffer = Buffer.from(jsonContent.dados_base64, 'base64');

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, buffer);
    console.log(`✅ Vídeo salvo em: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('❌ Erro ao acessar servidor ou processar dados:', error);
  } finally {
    await browser.close();
  }
})();
