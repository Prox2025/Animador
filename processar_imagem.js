const fs = require("fs");
const puppeteer = require("puppeteer");
const { execFileSync } = require("child_process");

(async () => {
  console.log("🚀 Iniciando Puppeteer...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://livestream.ct.ws/Google%20drive/informadados.php", { waitUntil: "networkidle2" });

  const jsonData = await page.evaluate(() => {
    return JSON.parse(document.body.innerText);
  });

  console.log("✅ JSON obtidos da página: ", Object.keys(jsonData));

  const imageBuffer = Buffer.from(jsonData.image_base64, "base64");
  fs.writeFileSync("input_image.png", imageBuffer);
  console.log("🖼️ Imagem salva como input_image.png");

  const width = 2048;
  const height = 1152;
  const duration = 26;

  console.log("📏 Dimensões da imagem: largura=2048, altura=1152");
  console.log("🎬 Executando FFmpeg...");

  const ffmpegArgs = [
    "-loop", "1",
    "-i", "input_image.png",
    "-filter_complex",
    `format=rgba,fade=t=in:st=0:d=3:alpha=1,fade=t=out:st=23:d=3:alpha=1,scale=${width}:${height},setsar=1,setpts=PTS-STARTPTS,pad=iw:ih:0:'if(lt(t,3),H-(H*t/3),if(lt(t,23),0,if(lt(t,26),(t-23)*(H/3),H)))':color=0x00000000`,
    "-t", `${duration}`,
    "-c:v", "libvpx-vp9",
    "-pix_fmt", "yuva420p",
    "-auto-alt-ref", "0",
    "-y", "video_saida.webm"
  ];

  try {
    execFileSync("ffmpeg", ffmpegArgs, { stdio: "inherit" });
    console.log("✅ Vídeo salvo como video_saida.webm");
  } catch (error) {
    console.error("❌ Erro ao processar:", error);
  }

  await browser.close();
})();
