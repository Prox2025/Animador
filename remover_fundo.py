import cv2
import numpy as np
import subprocess
from collections import Counter
import os

entrada_video = "videos/entrada.mp4"
frame_saida = "saida/frame.png"
saida_video = "saida/video_sem_fundo.webm"

# Garante que as pastas existam
os.makedirs("saida", exist_ok=True)

def extrair_primeiro_frame():
    print("🎞️ Extraindo primeiro frame com FFmpeg...")
    subprocess.run([
        'ffmpeg', '-y',
        '-i', entrada_video,
        '-vframes', '1',
        frame_saida
    ], check=True)

def detectar_cor_dominante():
    print("🎯 Detectando cor dominante na imagem...")
    imagem = cv2.imread(frame_saida)
    if imagem is None:
        raise Exception("Erro ao ler frame extraído.")

    imagem_rgb = cv2.cvtColor(imagem, cv2.COLOR_BGR2RGB)
    pixels = imagem_rgb.reshape(-1, 3)
    pixels_tuple = [tuple(p) for p in pixels]
    cor_mais_comum = Counter(pixels_tuple).most_common(1)[0][0]
    cor_hex = '%02X%02X%02X' % cor_mais_comum
    print(f"🧠 Cor dominante detectada: 0x{cor_hex}")
    return f"0x{cor_hex}"

def remover_fundo(cor):
    print("🛠️ Gerando vídeo WebM com alpha (transparência)...")
    subprocess.run([
        'ffmpeg', '-y',
        '-i', entrada_video,
        '-vf', f'chromakey={cor}:0.1:0.0,format=yuva420p',
        '-c:v', 'libvpx',
        '-auto-alt-ref', '0',
        saida_video
    ], check=True)
    print(f"✅ Vídeo final salvo em: {saida_video}")

if __name__ == "__main__":
    extrair_primeiro_frame()
    cor = detectar_cor_dominante()
    remover_fundo(cor)
