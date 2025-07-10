const puppeteer = require('puppeteer');
const fs = require('fs');
const { execFileSync } = require('child_process');

(async () => {
  try {
    console.log('🚀 Iniciando Puppeteer...');
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const url = 'https://livestream.ct.ws/Google%20drive/informadados.php';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const jsonContent = await page.evaluate(() => document.body.innerText);
    await browser.close();

    console.log('✅ JSON obtido:', jsonContent.slice(0, 100) + '...');
    const data = JSON.parse(jsonContent);
    if (!data.image_base64) throw new Error('❌ Campo image_base64 ausente');

    const buffer = Buffer.from(data.image_base64, 'base64');
    fs.writeFileSync('input_image.png', buffer);
    console.log('🖼️ Imagem salva como input_image.png');

    const width = 2048;
    const height = 1152;
    const duration = 26;

    const filter = `[0:v]format=rgba,fade=t=in:st=0:d=3:alpha=1,fade=t=out:st=23:d=3:alpha=1,scale=${width}:${height},setpts=PTS-STARTPTS`;

    const ffmpegArgs = [
      '-loop', '1',
      '-i', 'input_image.png',
      '-filter_complex', filter,
      '-t', `${duration}`,
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-auto-alt-ref', '0',
      '-y', 'video_saida.webm'
    ];

    console.log('🎬 Executando FFmpeg...');
    execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    console.log('✅ Vídeo salvo com transparência: video_saida.webm');

  } catch (err) {
    console.error('❌ Erro ao processar:', err);
    process.exit(1);
  }
})();
