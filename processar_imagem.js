const puppeteer = require('puppeteer');
const fs = require('fs');
const { execFileSync, execSync } = require('child_process');

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
    if (!data.image_base64) throw new Error('❌ Campo image_base64 não encontrado');

    const buffer = Buffer.from(data.image_base64, 'base64');
    fs.writeFileSync('input_image.png', buffer);
    console.log('🖼️ Imagem salva como input_image.png');

    // Detecta tamanho da imagem
    const ffprobe = execSync('ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json input_image.png', { encoding: 'utf-8' });
    const dimensions = JSON.parse(ffprobe).streams[0];
    const width = dimensions.width;
    const height = dimensions.height;

    console.log(`📐 Dimensões detectadas: ${width}x${height}`);

    const duration = 26;

    const ffmpegArgs = [
      '-i', 'input_image.png',
      '-f', 'lavfi',
      '-i', `color=color=0x00000000:s=${width}x${height}:d=${duration}`, // fundo transparente
      '-filter_complex',
      `[1:v][0:v]overlay=x=0:y='if(lt(t,3),H-(H*t/3),if(lt(t,23),0,if(lt(t,26),(t-23)*(H/3),H)))':shortest=1,format=yuva420p`,
      '-t', `${duration}`,
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-auto-alt-ref', '0',
      '-y', 'video_saida.webm'
    ];

    console.log('🎬 Executando FFmpeg com animação e transparência...');

    execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    console.log('✅ Vídeo final com animação + transparência salvo como video_saida.webm');

  } catch (err) {
    console.error('❌ Erro:', err.message || err);
    process.exit(1);
  }
})();
