const fs = require('fs');
const puppeteer = require('puppeteer');
const { execFileSync } = require('child_process');

function getImageDimensions(filename) {
  const { execFileSync } = require('child_process');
  const stdout = execFileSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'csv=p=0:s=x',
    filename
  ], { encoding: 'utf-8' });
  const [width, height] = stdout.trim().split('x').map(Number);
  return { width, height };
}

(async () => {
  console.log("🚀 Iniciando Puppeteer...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.goto("https://livestream.ct.ws/Google%20drive/informadados.php", {
    waitUntil: "networkidle2"
  });

  const jsonData = await page.evaluate(() => JSON.parse(document.body.innerText));
  console.log("✅ JSON obtido da página:", Object.keys(jsonData));

  const imageBase64 = jsonData.image_base64;
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  fs.writeFileSync('input_image.png', imageBuffer);
  console.log("🖼️ Imagem salva como input_image.png");

  await browser.close();

  const { width, height } = getImageDimensions('input_image.png');
  const duration = 26;

  console.log(`📏 Dimensões da imagem: largura=${width}, altura=${height}`);
  console.log("🎬 Executando FFmpeg...");

  const filterComplex = `[0:v]format=rgba,fade=t=in:st=0:d=3:alpha=1,fade=t=out:st=23:d=3:alpha=1,setpts=PTS-STARTPTS,scale=${width}:${height}[img];` +
                        `color=black@0.0:s=${width}x${height}:d=${duration}[bg];` +
                        `[bg][img]overlay=x=0:y='if(lt(t,3),H-(H*(t/3)),if(lt(t,23),0,if(lt(t,26),(t-23)*(H/3),H)))':format=auto:shortest=1[outv]`;

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
