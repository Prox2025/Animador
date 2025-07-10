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

    console.log('✅ JSON obtido da página:', jsonContent.slice(0, 100) + '...');

    fs.writeFileSync('image_data.json', jsonContent);

    const data = JSON.parse(jsonContent);

    if (!data.image_base64) {
      throw new Error('❌ Campo image_base64 não encontrado no JSON');
    }

    const buffer = Buffer.from(data.image_base64, 'base64');
    fs.writeFileSync('input_image.png', buffer);
    console.log('🖼️ Imagem salva como input_image.png');

    const duration = 26; // 3s entrada + 20s fixo + 3s saída

    // Obter dimensões da imagem com ffprobe
    const ffprobeOutput = execSync(
      'ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json input_image.png',
      { encoding: 'utf8' }
    );
    const meta = JSON.parse(ffprobeOutput);
    const imageStream = meta.streams[0];
    const width = imageStream.width;
    const height = imageStream.height;

    console.log(`📏 Dimensões da imagem: largura=${width}, altura=${height}`);

    // Gerar animação com fundo transparente
    const filter = `[0:v]format=rgba,fade=t=in:st=0:d=3:alpha=1,fade=t=out:st=23:d=3:alpha=1,` +
                   `scale=${width}:${height},` +
                   `pad=iw:ih:0:0:color=0x00000000[outv]`;

    const ffmpegArgs = [
      '-loop', '1',
      '-i', 'input_image.png',
      '-filter_complex', filter,
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

    console.log('✅ Vídeo com transparência salvo como video_saida.webm');

  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
})();
