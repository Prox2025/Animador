import asyncio
import sys
from pyppeteer import launch
import base64

async def grava_animacao(url, entrada, saida, duracao_animacao=7, output_file='saida.webm'):
    browser = await launch(headless=True, 
                           args=[
                               '--autoplay-policy=no-user-gesture-required',
                               '--disable-gpu',
                               '--no-sandbox',
                               '--disable-setuid-sandbox'
                           ])
    page = await browser.newPage()

    # Viewport 16:9
    await page.setViewport({'width': 1280, 'height': 720})

    # Monta URL com query params
    url_completa = f"{url}?entrada={entrada}&saida={saida}"
    print(f"Acessando: {url_completa}")

    await page.goto(url_completa, waitUntil='networkidle2')
    await asyncio.sleep(2)  # espera extra para garantir carregamento e início animação

    # Inicia gravação via MediaRecorder no navegador
    result = await page.evaluate('''
      () => {
        return new Promise(resolve => {
          const el = document.getElementById('preview');
          if (!el) {
            resolve('elemento_preview_nao_encontrado');
            return;
          }
          let stream;
          if(el.captureStream) {
            stream = el.captureStream(30);
          } else if (el.mozCaptureStream) {
            stream = el.mozCaptureStream(30);
          } else {
            resolve('captureStream_nao_suportado');
            return;
          }
          window.chunks = [];
          const recorder = new MediaRecorder(stream, {mimeType: 'video/webm; codecs=vp8,opus'});
          recorder.ondataavailable = e => {
            if(e.data && e.data.size > 0) window.chunks.push(e.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(window.chunks, {type: 'video/webm'});
            const reader = new FileReader();
            reader.onload = () => {
              const base64data = reader.result.split(',')[1];
              resolve(base64data);
            };
            reader.readAsDataURL(blob);
          };
          recorder.start();
          window._recorder = recorder;
          resolve('recorder_iniciado');
        });
      }
    ''')

    if result != 'recorder_iniciado':
      print(f"Erro ao iniciar gravação: {result}")
      await browser.close()
      return

    print("Gravação iniciada, aguardando animação terminar...")

    await asyncio.sleep(duracao_animacao)  # aguardar duração total animação

    # Parar gravação e pegar vídeo base64
    base64_video = await page.evaluate('''
      () => {
        return new Promise(resolve => {
          window._recorder.stop();
          let check = setInterval(() => {
            if(window.chunks && window.chunks.length > 0) {
              clearInterval(check);
              const blob = new Blob(window.chunks, {type: 'video/webm'});
              const reader = new FileReader();
              reader.onload = () => {
                resolve(reader.result.split(',')[1]);
              };
              reader.readAsDataURL(blob);
            }
          }, 100);
        });
      }
    ''')

    with open(output_file, 'wb') as f:
      f.write(base64.b64decode(base64_video))

    print(f"Vídeo gravado salvo em: {output_file}")

    await browser.close()


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Uso: python grava_animacao.py <URL_da_pagina> <animacao_entrada> <animacao_saida>")
        print("Exemplo: python grava_animacao.py http://localhost:8000/index.html fadeIn fadeOut")
        sys.exit(1)

    url = sys.argv[1]
    anim_entrada = sys.argv[2]
    anim_saida = sys.argv[3]

    asyncio.get_event_loop().run_until_complete(grava_animacao(url, anim_entrada, anim_saida))
