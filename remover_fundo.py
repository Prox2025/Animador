import subprocess
from PIL import Image
import os

VIDEO_INPUT = "videos/entrada.mp4"
FRAME_OUTPUT = "saida/frame.png"
VIDEO_OUTPUT = "saida/video_sem_fundo.webm"

os.makedirs("saida", exist_ok=True)

def extrair_primeiro_frame():
    print("🎞️ Extraindo primeiro frame com FFmpeg...")
    cmd = [
        "ffmpeg", "-y",
        "-i", VIDEO_INPUT,
        "-vframes", "1",
        FRAME_OUTPUT
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        print(result.stderr.decode())
        raise Exception("Erro ao extrair o frame com FFmpeg.")

def detectar_cor_dominante():
    print("🎯 Detectando cor dominante com Pillow...")
    imagem = Image.open(FRAME_OUTPUT).convert("RGB")
    cores = imagem.getcolors(imagem.size[0] * imagem.size[1])
    cor_mais_frequente = max(cores, key=lambda item: item[0])[1]
    print(f"🧠 Cor dominante detectada: {cor_mais_frequente}")
    return cor_mais_frequente

def cor_rgb_para_hex(cor_rgb):
    return f"0x{cor_rgb[0]:02X}{cor_rgb[1]:02X}{cor_rgb[2]:02X}"

def remover_fundo(cor_rgb):
    cor_hex = cor_rgb_para_hex(cor_rgb)
    print("🛠️ Removendo fundo com FFmpeg...")
    cmd = [
        "ffmpeg", "-y",
        "-i", VIDEO_INPUT,
        "-vf", f"chromakey={cor_hex}:0.1:0.0,format=yuva420p",
        "-c:v", "libvpx",  # WebM com alpha
        "-auto-alt-ref", "0",
        VIDEO_OUTPUT
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        print(result.stderr.decode())
        raise Exception("Erro ao remover o fundo com FFmpeg.")

# Execução principal
if not os.path.exists(VIDEO_INPUT):
    raise FileNotFoundError("🚫 Vídeo de entrada não encontrado.")

extrair_primeiro_frame()
cor_dominante = detectar_cor_dominante()
remover_fundo(cor_dominante)

print("✅ Vídeo com fundo removido salvo em:", VIDEO_OUTPUT)
