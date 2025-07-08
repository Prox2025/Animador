import cv2
import numpy as np
import subprocess
import os
import sys

input_path = 'videos/entrada.mp4'
output_path = 'videos/video_fundo_removido.webm'

def detect_background_color_static(video_path):
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()
    if not ret:
        raise Exception("Não foi possível ler o frame do vídeo")

    top = frame[0:10, :, :]
    bottom = frame[-10:, :, :]
    left = frame[:, 0:10, :]
    right = frame[:, -10:, :]

    mean_top = top.mean(axis=(0,1))
    mean_bottom = bottom.mean(axis=(0,1))
    mean_left = left.mean(axis=(0,1))
    mean_right = right.mean(axis=(0,1))

    mean_color = (mean_top + mean_bottom + mean_left + mean_right) / 4
    cap.release()
    return mean_color  # BGR

def bgr_to_hex(color_bgr):
    r, g, b = int(color_bgr[2]), int(color_bgr[1]), int(color_bgr[0])
    return f'0x{r:02X}{g:02X}{b:02X}'

def remove_background_ffmpeg(input_video, output_video, color_hex, similarity=0.8, blend=0.3):
    cmd = [
        'ffmpeg',
        '-i', input_video,
        '-vf', f'chromakey={color_hex}:{similarity}:{blend},format=yuva420p',
        '-c:v', 'libvpx-vp9',
        '-auto-alt-ref', '0',
        '-b:v', '1M',
        '-pix_fmt', 'yuva420p',
        output_video
    ]
    print("🔧 Executando FFmpeg para remover o fundo usando chromakey:")
    print(' '.join(cmd))
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao executar FFmpeg: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if not os.path.exists(input_path):
        print(f"Arquivo de entrada não encontrado: {input_path}")
        exit(1)

    print("🎥 Detectando cor do fundo no primeiro frame...")
    bg_color = detect_background_color_static(input_path)
    print(f"Cor detectada (BGR): {bg_color}")

    color_hex = bgr_to_hex(bg_color)
    print(f"Cor convertida para chromakey: {color_hex}")

    print("⚠️ Usando parâmetros conservadores para garantir remoção do fundo...")
    remove_background_ffmpeg(input_path, output_path, color_hex, similarity=0.8, blend=0.3)

    print(f"✅ Vídeo com fundo removido salvo em: {output_path}")
    print("⚠️ Se o fundo não foi removido, tente ajustar manualmente a cor ou aumentar 'similarity'.")
