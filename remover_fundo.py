import cv2
import numpy as np
from collections import Counter
import subprocess
import os

ARQUIVO_VIDEO = "videos/entrada.mp4"
PASTA_SAIDA = "saida"
ARQUIVO_MP4 = os.path.join(PASTA_SAIDA, "video_sem_fundo.mp4")
ARQUIVO_WEBM = os.path.join(PASTA_SAIDA, "video_sem_fundo.webm")

def detectar_cor_dominante():
    print("🎯 Detectando cor dominante...")
    cap = cv2.VideoCapture(ARQUIVO_VIDEO)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        raise Exception("Erro ao ler vídeo.")

    small = cv2.resize(frame, (100, 100))
    pixels = small.reshape(-1, 3)
    rounded = [tuple((p // 10) * 10) for p in pixels]
    cor = Counter(rounded).most_common(1)[0][0]
    cor_hex = '0x%02X%02X%02X' % (cor[2], cor[1], cor[0])
    print(f"🧠 Cor detectada: {cor_hex}")
    return cor_hex

def remover_fundo(cor_hex):
    os.makedirs(PASTA_SAIDA, exist_ok=True)

    print("🛠️ Gerando MP4 com alpha (ProRes)...")
    cmd_mp4 = [
        "ffmpeg", "-y", "-i", ARQUIVO_VIDEO,
        "-vf", f"chromakey={cor_hex}:0.1:0.0,format=yuva444p10le",
        "-c:v", "prores_ks", "-profile:v", "4",
        ARQUIVO_MP4
    ]
    subprocess.run(cmd_mp4, check=True)

    print("🛠️ Gerando WebM com alpha (libvpx)...")
    cmd_webm = [
        "ffmpeg", "-y", "-i", ARQUIVO_VIDEO,
        "-vf", f"chromakey={cor_hex}:0.1:0.0,format=yuva420p",
        "-c:v", "libvpx", "-auto-alt-ref", "0", "-b:v", "2M",
        ARQUIVO_WEBM
    ]
    subprocess.run(cmd_webm, check=True)

    print(f"✅ Vídeos gerados:\n  - {ARQUIVO_MP4}\n  - {ARQUIVO_WEBM}")

if __name__ == "__main__":
    cor = detectar_cor_dominante()
    remover_fundo(cor)
