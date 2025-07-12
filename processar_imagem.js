const fs = require('fs');
const puppeteer = require('puppeteer');
const { execFileSync } = require('child_process');

// Função para obter largura e altura da imagem
function getImageDimensions(filename) {
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

  // Abre a página e espera até que não haja mais rede por 500ms
  await page.goto("https://livestream.ct.ws/Google%20drive/informadados.php", {
    waitUntil: "networkidle2"
  });

  // Extrai o JSON da página (espera que o body contenha JSON puro)
  const jsonData = await page.evaluate(() => JSON.parse(document.body.innerText));
  console.log("✅ JSON obtido da página:", Object.keys(jsonData));

  // Extrai e salva a imagem codificada em base64
  const imageBase64 = jsonData.image_base64;
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  fs.writeFileSync('input_image.png', imageBuffer);
  console.log("🖼️ Imagem salva como input_image.png");

  await browser.close();

  // Obtém dimensões da imagem
  const { width, height } = getImageDimensions('input_image.png');
  const duration = 26;

  console.log(`📏 Dimensões da imagem: largura=${width}, altura=${height}`);
  console.log("🎬 Executando FFmpeg...");

  // Filtro para aplicar: fundo translúcido + fade + movimento vertical
  const filterComplex = `
    [0:v]format=rgba,
    fade=t=in:st=0:d=3:alpha=1,
    fade=t=out:st=23:d=3:alpha=1,
    setpts=PTS-STARTPTS,
    scale=${width}:${height}[img];
    color=gray@0.1:s=${width}x${height}:d=${duration}[bg];
    [bg][img]overlay=x=0:y='if(lt(t,3),H-(H*(t/3)),if(lt(t,23),0,if(lt(t,26),(t-23)*(H/3),H)))':format=auto:shortest=1[outv]
  `.replace(/\s+/g, ''); // Remove quebras de linha e espaços desnecessários

  // Geração do vídeo com FFmpeg em .mp4 (sem canal alfa, compatível com redes sociais)
  try {
    execFileSync('ffmpeg', [
      '-loop', '1',                 // Mantém a imagem estática
      '-i', 'input_image.png',      // Imagem de entrada
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-t', duration.toString(),    // Duração final
      '-c:v', 'libx264',            // Codec compatível com .mp4
      '-pix_fmt', 'yuv420p',        // Formato sem canal alfa
      '-y', 'video_saida.mp4'       // Arquivo final
    ], { stdio: 'inherit' });

    console.log("✅ Vídeo MP4 gerado com fundo translúcido: video_saida.mp4");
  } catch (error) {
    console.error("❌ Erro ao processar:", error);
    process.exit(1);
  }
})();
