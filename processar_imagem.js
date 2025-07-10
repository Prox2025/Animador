const puppeteer = require('puppeteer');
const fs = require('fs');
const { execSync, execFileSync } = require('child_process');

(async () => {
  try {
    console.log('🚀 Iniciando Puppeteer...');
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    const url = 'https://livestream.ct.ws/Google%20drive/informadados.php';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const jsonContent = await page.evaluate(() => document.body.innerText);
    await browser.close();

    const data = JSON.parse(jsonContent);
    if (!data.image_base64) throw new Error('❌ Campo image_base64 não encontrado no JSON');

    const buffer = Buffer.from(data.image_base64, 'base64');
    fs.writeFileSync('input_image.png', buffer);
    console.log('🖼️ Imagem salva como input_image.png');

    // Pega dimensões da imagem
    const ffprobeOutput = execSync(
      'ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json input_image.png',
      { encoding: 'utf8' }
    );
    const { width, height } = JSON.parse(ffprobeOutput).streams[0];
    console.log(`📏 Dimensões da imagem: ${width}x${height}`);

    const duration = 26;

    // Filtros para entrada/saída com transparência mantida e movimento vertical suave
    const filterComplex = `
      [1:v][0:v]overlay=x=0:y='
        if(lt(t,3), H-(H*t/3),
          if(lt(t,23), 0,
            if(lt(t,26), (t-23)*(H/3), H)
          )
        )
      ':format=auto:shortest=1
    `.replace(/\s+/g, ''); // Remove quebras para o shell

    const ffmpegArgs = [
      '-loop', '1',
      '-i', 'input_image.png',

      // Fundo transparente sem cor
      '-f', 'lavfi',
      '-i', `nullsrc=size=${width}x${height}:duration=${duration}:rate=30`,

      '-filter_complex', filterComplex,

      '-t', `${duration}`,
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-auto-alt-ref', '0',
      '-y',
      'video_saida.webm'
    ];

    console.log('🎬 Executando FFmpeg...');
    execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    console.log('✅ Vídeo salvo com fundo transparente em video_saida.webm');

  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
})();
