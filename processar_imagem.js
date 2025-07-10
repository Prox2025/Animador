const fs = require('fs');
const puppeteer = require('puppeteer');
const { execFileSync } = require('child_process');
const path = require('path');

(async () => {
  console.log("🚀 Iniciando Puppeteer...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // <-- flags para ambientes restritos
  });

  const page = await browser.newPage();

  await page.goto("https://livestream.ct.ws/Google%20drive/informadados.php", {
    waitUntil: "networkidle2"
  });

  const jsonData = await page.evaluate(() => JSON.parse(document.body.innerText));
  console.log("✅ JSON obtidos da página: ", Object.keys(jsonData));

  const imageBase64 = jsonData.image_base64;
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  fs.writeFileSync('input_image.png', imageBuffer);
  console.log("🖼️ Imagem salva como input_image.png");

  await browser.close();

  // Detecta dimensões da imagem
  const sizeOf = require('image-size');
  const dimensions = sizeOf('input_image.png');
  const width = dimensions.width;
  const height = dimensions.height;
  const duration = 26;

  console.log(`📏 Dimensões da imagem: largura=${width}, altura=${height}`);
  console.log("🎬 Executando FFmpeg...");

  // Filter para animação de entrada (fade up) e saída (fade down) mantendo transparência
  const filterComplex = `[0:v]format=rgba,fade=t=in:st=0:d=3:alpha=1,fade=t=out:st=23:d=3:alpha=1,setpts=PTS-STARTPTS,\
crop=iw:ih:'0':'if(lt(t,3), ih-(ih*t/3), if(lt(t,23), 0, if(lt(t,26), (t-23)*(ih/3), ih)))'[outv]`;

  try {
    execFileSync('ffmpeg', [
      '-loop', '1',
      '-i', 'input_image.png',
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-t', duration.toString(),
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-auto-alt-ref', '0',
      '-y', 'video_saida.webm'
    ], { stdio: 'inherit' });

    console.log("✅ Vídeo salvo com sucesso: video_saida.webm");

  } catch (error) {
    console.error("❌ Erro ao processar:", error);
    process.exit(1);
  }
})();
