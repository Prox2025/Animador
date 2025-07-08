import subprocess
from collections import Counter
from PIL import Image
import os

ARQUIVO_VIDEO = "videos/entrada.mp4"
PASTA_SAIDA = "saida"
FRAME_PATH = os.path.join(PASTA_SAIDA, "frame.png")
ARQUIVO_MP4 = os.path.join(PASTA_SAIDA, "video_sem_fundo.mp4")
ARQUIVO_WEBM = os.path.join(PASTA_SAIDA, "video_sem_fundo.webm")

def extrair_primeiro_frame():
    os.makedirs(PASTA_SAIDA, exist_ok=True)
    print("🎞️ Extraindo primeiro frame com FFmpeg...")
    subprocess.run([
        "ffmpeg", "-y", "-i", ARQUIVO_VIDEO, "-vframes", "1", FRAME_PATH
    ], check=True)

def detectar_cor_dominante():
    print("🎯 Detectando cor dominante na imagem...")
    img = Image.open(FRAME_PATH).convert("RGB")
    pixels = list(img.getdata())

    # Arredonda cores para agrupar pixels semelhantes
    rounded = [(p[0]//10*10, p[1]//10*10, p[2]//10*10) for p in pixels]
    cor = Counter(rounded).most_common(1)[0][0]

    cor_hex = '0x%02X%02X%02X' % (cor[0], cor[1], cor[2])
    print(f"🧠 Cor dominante detectada: {cor_hex}")
    return cor_hex

def remover_fundo(cor_hex):
    print("🛠️ Gerando vídeo MP4 com alpha (ProRes)...")
    subprocess.run([
        "ffmpeg", "-y", "-i", ARQUIVO_VIDEO,
        "-vf", f"chromakey={cor_hex}:0.1:0.0,format=yuva444p10le",
        "-c:v", "prores_ks", "-profile:v", "4",
        ARQUIVO_MP4
    ], check=True)

    print("🛠️ Gerando vídeo WebM com alpha (libvpx)...")
    subprocess.run([
        "ffmpeg", "-y", "-i", ARQUIVO_VIDEO,
        "-vf", f"chromakey={cor_hex}:0.1:0.0,format=yuva420p",
        "-c:v", "libvpx", "-auto-alt-ref", "0", "-b:v", "2M",
        ARQUIVO_WEBM
    ], check=True)

    print(f"✅ Vídeos gerados:\n  - {ARQUIVO_MP4}\n  - {ARQUIVO_WEBM}")

if __name__ == "__main__":
    extrair_primeiro_frame()
    cor = detectar_cor_dominante()
    remover_fundo(cor)
