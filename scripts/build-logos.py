"""
ヒーローに大きく出す白抜きロゴを作る。

  python3 scripts/build-logos.py

入力
  public/images/logo.jpg            … 家紋のようなマーク（白地に黒の版画調）
  references/logo-moji.heic         … 看板の写真（木の板に黒く彫った「株式会社 山蔵」）
出力（白・透明背景、余白を詰めてある）
  public/images/logo-mark-white.webp     … ヒーロー用（表示 208px の 3 倍まで）
  public/images/logo-mark-white-sm.webp  … メニューバー用（表示 44px なので 256px）
  public/images/logo-mark-black.webp     … メニューバーが白地になったとき用
画像は最適化を通さず（next.config の images.unoptimized）そのまま配信されるので、使う大きさで書き出す
  public/images/logo-moji-white.webp

看板の文字は「黒い（明度が低い）か、色が抜けている（彩度が低い）」画素として取り出す。
木肌は明るく橙色で彩度が高いので分かれる。彫り込みの内側に映るつやは灰色なので、
彩度の条件で文字側に入る。木目の細い筋は開口処理（細い線を消す）で落とす。
"""
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent


def to_white(alpha: np.ndarray, value: int = 255) -> Image.Image:
    out = np.zeros((*alpha.shape, 4), np.uint8)
    out[..., :3] = value
    out[..., 3] = np.clip(alpha * 255 + 0.5, 0, 255).astype(np.uint8)
    return Image.fromarray(out)


def trim(img: Image.Image, pad: int) -> Image.Image:
    box = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    x0, y0, x1, y1 = box
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


def smoothstep(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def save(img: Image.Image, name: str, width: int) -> None:
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    path = ROOT / "public/images" / name
    img.save(path, lossless=True, method=6)
    print(path.relative_to(ROOT), img.size, path.stat().st_size // 1024, "KB")


# --- マーク：白地の黒インクをそのまま透明度にする ---
mark = Image.open(ROOT / "public/images/logo.jpg").convert("L")
lum = np.asarray(mark).astype(np.float32) / 255
# 版画のかすれ（白い点）は残す。紙の白は完全に抜く
mark_alpha = smoothstep(1 - lum, 0.18, 0.6)
save(trim(to_white(mark_alpha), 24), "logo-mark-white.webp", 640)
save(trim(to_white(mark_alpha), 24), "logo-mark-white-sm.webp", 256)
# 墨色（真っ黒より少し柔らかい）
save(trim(to_white(mark_alpha, 26), 24), "logo-mark-black.webp", 256)

# --- 看板の文字 ---
heic = ROOT / "references/logo-moji.heic"
with tempfile.TemporaryDirectory() as tmp:
    png = Path(tmp) / "moji.png"
    subprocess.run(["sips", "-s", "format", "png", str(heic), "--out", str(png)], check=True, capture_output=True)
    photo = Image.open(png).convert("RGB")

# 文字の範囲（元写真 5712x4284 の座標）
sign = photo.crop((999, 1999, 4337, 2677))
hsv = np.asarray(sign.convert("HSV")).astype(np.float32) / 255
s, v = hsv[..., 1], hsv[..., 2]
hard = (v < 0.33) | ((s < 0.42) & (v < 0.85))
m = Image.fromarray((hard * 255).astype(np.uint8))
# 開口：木目の細い筋と点を消す。続けて閉口：彫りの内側に残った小さなつやの抜けを埋める
m = m.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))
m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
# 輪郭をなめらかにして、2px ほどの幅で締め直す
m = m.filter(ImageFilter.GaussianBlur(1.6))
alpha = smoothstep(np.asarray(m).astype(np.float32) / 255, 0.38, 0.62)
save(trim(to_white(alpha), 16), "logo-moji-white.webp", 2400)
