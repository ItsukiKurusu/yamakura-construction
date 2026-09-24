"""
旧トップの筆文字（references/originals/letter.png, 1200x400。元は public/images にあった）を高精細にする。

元画像は幅 1200px しかなく、高精細な画面で大きく出すとにじむ。
アルファを 3 倍に滑らかに拡大してから、縁を細い幅でしきい値処理し直すと、
筆の形を保ったまま輪郭だけがくっきりする（ベクター化ツールを入れずに済む）。

  python3 scripts/build-letter.py
出力: public/images/letter-hd.webp（白・透明背景、余白を詰めてある）
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "references/originals/letter.png"
OUT = ROOT / "public/images/letter-hd.webp"
SCALE = 3
PAD = 12  # 元画像での余白（px）

im = Image.open(SRC)
alpha = im.getchannel("A")
x0, y0, x1, y1 = alpha.point(lambda v: 255 if v > 12 else 0).getbbox()
box = (max(0, x0 - PAD), max(0, y0 - PAD), min(im.width, x1 + PAD), min(im.height, y1 + PAD))
alpha = alpha.crop(box)

big = alpha.resize((alpha.width * SCALE, alpha.height * SCALE), Image.LANCZOS)
# 拡大で出た階段の角を少しだけ丸める
big = big.filter(ImageFilter.GaussianBlur(SCALE * 0.45))
a = np.asarray(big).astype(np.float32) / 255
# 縁を 2px ほどのなめらかな段差に締め直す
lo, hi = 0.42, 0.58
t = np.clip((a - lo) / (hi - lo), 0, 1)
a = t * t * (3 - 2 * t)

out = np.zeros((*a.shape, 4), np.uint8)
out[..., :3] = 255
out[..., 3] = (a * 255).round().astype(np.uint8)
Image.fromarray(out).save(OUT, lossless=True, method=6)
print(OUT.relative_to(ROOT), out.shape[1], "x", out.shape[0], OUT.stat().st_size // 1024, "KB")
