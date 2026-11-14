from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "icons")
os.makedirs(OUT, exist_ok=True)

BG = (47, 111, 237, 255)   # #2f6fed
FG = (255, 255, 255, 255)

def make(size, maskable=False, filename=None):
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    text = "V"
    font_size = int(size * (0.5 if not maskable else 0.4))
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), text, font=font, fill=FG)
    path = os.path.join(OUT, filename)
    img.save(path)
    print("wrote", path)

make(192, filename="icon-192.png")
make(512, filename="icon-512.png")
make(512, maskable=True, filename="icon-512-maskable.png")
