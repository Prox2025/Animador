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

    console.log('✅ JSON obtido da página:', jsonContent.slice(0, 100) + '...');
    fs.writeFileSync('image_data.json', jsonContent);
    const data = JSON.parse(jsonContent);
    if (!data.image_base64) throw new Error('❌ Campo image_base64 não encontrado no JSON');
    const buffer = Buffer.from(data.image_base64, 'base64');
    fs.writeFileSync('input_image.png', buffer);
    console.log('🖼️ Imagem salva como input_image.png');

    const width = 2048;
    const height = 1152;
    const duration = 26;

    const filterComplex = `
      [0:v]format=rgba,fade=t=in:st=0:d=3:alpha=1,fade=t=out:st=23:d=3:alpha=1,setsar=1[img];
      [1:v][img]overlay=x=0:y='if(lt(t,3), H-(H*t/3), if(lt(t,23), 0, if(lt(t,26), (t-23)*(H/3), H)))':format=auto:shortest=1[outv]
    `.replace(/\s+/g, ' ');

    const ffmpegArgs = [
      '-loop', '1',
      '-i', 'input_image.png',
      '-f', 'lavfi',
      '-i', `color=color=0x00000000:size=${width}x${height}:duration=${duration}`,
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-t', `${duration}`,
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-auto-alt-ref', '0',
      '-y',
      'video_saida.webm'
    ];

    console.log('🎬 Executando FFmpeg...');
    execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });
    console.log('✅ Vídeo final transparente e animado salvo como video_saida.webm');

  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
})();
