const fs = require('fs');
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const { execFileSync } = require('child_process');

(async () => {
  console.log('🚀 Iniciando Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const url = 'https://livestream.ct.ws/Google%20drive/informadados.php';
  await page.goto(url, { waitUntil: 'networkidle2' });

  const json = await page.evaluate(() => {
    return JSON.parse(document.body.innerText);
  });

  await browser.close();
  console.log('✅ JSON obtidos da página:', Object.keys(json));

  const base64Data = json.image_base64;
  const buffer = Buffer.from(base64Data, 'base64');

  fs.writeFileSync('input_image.png', buffer);
  console.log('🖼️ Imagem salva como input_image.png');

  // Detectar dimensões da imagem
  const { width, height } = await sharp(buffer).metadata();
  console.log(`📏 Dimensões: ${width}x${height}`);

  const duration = 26;
  const fadeInDuration = 3;
  const fadeOutStart = 23;
  const fadeOutDuration = 3;

  // Filtro FFmpeg com animação de entrada e saída sem cor de fundo
  const filter = `[0:v]format=rgba,` +
                 `fade=t=in:st=0:d=${fadeInDuration}:alpha=1,` +
                 `fade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}:alpha=1,` +
                 `scale=${width}:${height},` +
                 `setpts=PTS-STARTPTS,` +
                 `crop=iw:ih:0:'if(lt(t,${fadeInDuration}), ih-(ih*t/${fadeInDuration}), if(lt(t,${fadeOutStart}), 0, if(lt(t,${duration}), (t-${fadeOutStart})*(ih/${fadeOutDuration}), ih)))'` +
                 `[outv]`;

  console.log('🎬 Executando FFmpeg...');
  try {
    execFileSync('ffmpeg', [
      '-loop', '1',
      '-i', 'input_image.png',
      '-filter_complex', filter,
      '-map', '[outv]',
      '-t', `${duration}`,
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-auto-alt-ref', '0',
      '-y', 'video_saida.webm'
    ], { stdio: 'inherit' });

    console.log('✅ Vídeo salvo como video_saida.webm com fundo transparente e animações.');
  } catch (err) {
    console.error('❌ Erro ao processar:', err);
  }
})();
