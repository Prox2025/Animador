import os
import subprocess
from PIL import Image
import numpy as np

ENTRADA = 'videos/entrada.mp4'
FRAME = 'saida/frame.png'
SAIDA = 'saida/video_sem_fundo.webm'

def extrair_frame():
    print("🎞️ Extraindo primeiro frame com FFmpeg...")
    subprocess.run([
        'ffmpeg', '-y', '-i', ENTRADA,
        '-vframes', '1', FRAME
    ], check=True)

def detectar_cor_dominante():
    print("🎯 Detectando cor dominante...")
    imagem = Image.open(FRAME).convert('RGB')
    pixels = np.array(imagem).reshape(-1, 3)
    media = pixels.mean(axis=0).astype(int)
    cor_hex = f"{media[0]:02X}{media[1]:02X}{media[2]:02X}"
    print(f"🧠 Cor dominante detectada: #{cor_hex}")
    return cor_hex

def remover_fundo(cor):
    print("🛠️ Removendo fundo e gerando vídeo WebM com alpha...")
    subprocess.run([
        'ffmpeg', '-y', '-i', ENTRADA,
        '-vf', f"chromakey=0x{cor}:0.1:0.2,format=yuva420p",
        '-c:v', 'libvpx-vp9', '-b:v', '2M',
        '-auto-alt-ref', '0',
        SAIDA
    ], check=True)

if __name__ == "__main__":
    if not os.path.exists(ENTRADA):
        raise FileNotFoundError(f"❌ Arquivo de entrada não encontrado: {ENTRADA}")

    extrair_frame()
    cor = detectar_cor_dominante()
    remover_fundo(cor)
    print(f"✅ Vídeo gerado com fundo removido: {SAIDA}")
