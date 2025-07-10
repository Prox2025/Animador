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

    const duration = 26; // total duração (3s entrada + 20s parada + 3s saída)

    // Pega dimensões da imagem
    const ffprobeOutput = execSync(
      'ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json input_image.png',
      { encoding: 'utf8' }
    );
    const meta = JSON.parse(ffprobeOutput);
    const width = meta.streams[0].width;
    const height = meta.streams[0].height;

    console.log(`📏 Dimensões da imagem: largura=${width}, altura=${height}`);

    /*
      - Criamos uma "fake" entrada de vídeo transparente color=rgba(0,0,0,0)
      - Usamos overlay da imagem sobre essa tela transparente
      - A posição vertical 'y' da imagem é animada para:
        * entrar do lado de baixo (altura do vídeo para 0) nos 3 primeiros segundos
        * ficar parada (y=0) durante 20 segundos
        * sair deslizando para baixo (de y=0 até altura do vídeo) nos últimos 3 segundos
    */

    const filter = `[1:v]format=rgba,trim=duration=${duration},setpts=PTS-STARTPTS[bg];` +
                   `[0:v]format=rgba,setpts=PTS-STARTPTS,` +
                   `scale=${width}:${height}[img];` +
                   `[bg][img]overlay=x=0:y='if(lt(t,3), H-(H*t/3), if(lt(t,23), 0, if(lt(t,26), (t-23)*(H/3), H)))':format=auto:shortest=1`;

    const ffmpegArgs = [
      '-loop', '1',
      '-i', 'input_image.png',
      '-f', 'lavfi',
      '-i', `color=0x00000000:s=${width}x${height}:d=${duration}`, // fundo transparente
      '-filter_complex', filter,
      '-t', `${duration}`,
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-auto-alt-ref', '0',
      '-y',
      'video_saida.webm'
    ];

    console.log('🎬 Executando FFmpeg...');

    execFileSync('ffmpeg', ffmpegArgs, { stdio: 'inherit' });

    console.log('✅ Vídeo com transparência e animação salvo como video_saida.webm');

  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
})();
