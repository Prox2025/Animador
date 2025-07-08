import cv2
import numpy as np
import subprocess
import os

input_path = 'videos/entrada.mp4'
output_path = 'videos/video_fundo_removido.webm'

def detect_background_color_static(video_path):
    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()
    if not ret:
        raise Exception("Não foi possível ler o frame do vídeo")

    # Pega as bordas do frame (topo, base, esquerda, direita) com 10 pixels de largura/altura
    top = frame[0:10, :, :]
    bottom = frame[-10:, :, :]
    left = frame[:, 0:10, :]
    right = frame[:, -10:, :]

    # Calcula a média da cor em cada borda (BGR)
    mean_top = top.mean(axis=(0,1))
    mean_bottom = bottom.mean(axis=(0,1))
    mean_left = left.mean(axis=(0,1))
    mean_right = right.mean(axis=(0,1))

    # Média geral das bordas
    mean_color = (mean_top + mean_bottom + mean_left + mean_right) / 4
    cap.release()
    return mean_color  # Retorna cor em BGR

def bgr_to_hex(color_bgr):
    r, g, b = int(color_bgr[2]), int(color_bgr[1]), int(color_bgr[0])
    return f'0x{r:02X}{g:02X}{b:02X}'

def remove_background_ffmpeg(input_video, output_video, color_hex, similarity=0.4, blend=0.2):
    cmd = [
        'ffmpeg',
        '-i', input_video,
        '-vf', f'colorkey={color_hex}:{similarity}:{blend},format=yuva420p',
        '-c:v', 'libvpx-vp9',
        '-auto-alt-ref', '0',
        '-b:v', '1M',
        '-pix_fmt', 'yuva420p',
        output_video
    ]
    print("🔧 Executando FFmpeg para remover o fundo:")
    print(' '.join(cmd))
    subprocess.run(cmd, check=True)

if __name__ == "__main__":
    if not os.path.exists(input_path):
        print(f"Arquivo de entrada não encontrado: {input_path}")
        exit(1)

    print("🎥 Detectando cor do fundo no primeiro frame...")
    bg_color = detect_background_color_static(input_path)
    print(f"Cor detectada (BGR): {bg_color}")

    color_hex = bgr_to_hex(bg_color)
    print(f"Cor convertida para colorkey: {color_hex}")

    remove_background_ffmpeg(input_path, output_path, color_hex)
    print(f"✅ Vídeo com fundo removido salvo em: {output_path}")
