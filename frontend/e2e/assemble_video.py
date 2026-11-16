"""Assemble les images de demo-video.mjs en une vidéo MP4 à 30 images par seconde.

Usage (depuis frontend/) : python e2e/assemble_video.py
Chrome n'envoie une image que lorsque l'écran change : chaque image est donc tenue jusqu'à la suivante,
d'après son horodatage, pour respecter le rythme réel de la démo.
"""

import json
from pathlib import Path

import av
from PIL import Image

FPS = 30
HERE = Path(__file__).parent / "demo-video"
FRAMES = HERE / "frames"
OUTPUT = HERE / "campusfund-demo.mp4"
SIZE = (1280, 720)


def main() -> None:
    index = json.loads((FRAMES / "index.json").read_text(encoding="utf-8"))
    if not index:
        raise SystemExit("Aucune image : lancez d'abord node e2e/demo-video.mjs")
    start, end = index[0]["t"], index[-1]["t"] + 1.0
    container = av.open(str(OUTPUT), mode="w")
    stream = container.add_stream("libx264", rate=FPS)
    stream.width, stream.height = SIZE
    stream.pix_fmt = "yuv420p"
    stream.options = {"crf": "20", "preset": "medium"}

    cursor = 0
    current = None
    total = int((end - start) * FPS)
    for n in range(total):
        t = start + n / FPS
        while cursor + 1 < len(index) and index[cursor + 1]["t"] <= t:
            cursor += 1
            current = None
        if current is None:
            image = Image.open(FRAMES / index[cursor]["file"]).convert("RGB")
            if image.size != SIZE:
                canvas = Image.new("RGB", SIZE, (9, 9, 10))
                canvas.paste(image, ((SIZE[0] - image.width) // 2, (SIZE[1] - image.height) // 2))
                image = canvas
            current = av.VideoFrame.from_image(image)
        for packet in stream.encode(current):
            container.mux(packet)
    for packet in stream.encode():
        container.mux(packet)
    container.close()
    print(f"{OUTPUT} : {total / FPS:.0f} s, {total} images")


if __name__ == "__main__":
    main()
