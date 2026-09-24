"""
Radiance HDR（.hdr / RGBE）の読み込み。

imageio も OpenCV もこの環境に無いので自前で読む。
Poly Haven の HDRI はすべてこの形式。

形式:
  - ASCII のヘッダ（空行で終わり）
  - 解像度行  例) "-Y 2048 +X 4096"
  - 走査線。新形式は [2, 2, hi, lo] で始まり、R/G/B/E の 4 成分を
    それぞれ RLE で並べる。旧形式は RGBE の生の 4 バイト組。
"""

from pathlib import Path
import numpy as np


def _read_header(f):
    """ヘッダを読み飛ばして (width, height, flipY) を返す。"""
    line = f.readline()
    if not line.startswith(b"#?"):
        raise ValueError("Radiance HDR ではありません")
    while True:
        line = f.readline()
        if line in (b"\n", b"\r\n", b""):
            break
    res = f.readline().decode("ascii").strip().split()
    # 例: -Y 2048 +X 4096
    if res[0] not in ("-Y", "+Y") or res[2] not in ("+X", "-X"):
        raise ValueError(f"対応していない解像度行: {res}")
    height = int(res[1])
    width = int(res[3])
    return width, height


def _decode_rle_scanline(buf, pos, width):
    """新形式の 1 走査線を RGBE の (4, width) に展開する。"""
    out = np.empty((4, width), dtype=np.uint8)
    for c in range(4):
        x = 0
        while x < width:
            count = buf[pos]
            pos += 1
            if count > 128:
                # 同じ値が (count-128) 回続く
                n = count - 128
                out[c, x : x + n] = buf[pos]
                pos += 1
            else:
                # そのまま count 個並ぶ
                out[c, x : x + count] = np.frombuffer(buf, np.uint8, count, pos)
                pos += count
                x += count - 1
                x += 1
                continue
            x += n
    return out, pos


def load_hdr(path: Path) -> np.ndarray:
    """(height, width, 3) の float32 リニア RGB を返す。"""
    with open(path, "rb") as f:
        width, height = _read_header(f)
        buf = f.read()

    rgbe = np.empty((height, width, 4), dtype=np.uint8)
    pos = 0
    for y in range(height):
        # 新形式の走査線か判定する
        if (
            pos + 4 <= len(buf)
            and buf[pos] == 2
            and buf[pos + 1] == 2
            and ((buf[pos + 2] << 8) | buf[pos + 3]) == width
            and width >= 8
            and width < 32768
        ):
            pos += 4
            line, pos = _decode_rle_scanline(buf, pos, width)
            rgbe[y] = line.T
        else:
            # 旧形式。RGBE がそのまま並ぶ
            n = width * 4
            rgbe[y] = np.frombuffer(buf, np.uint8, n, pos).reshape(width, 4)
            pos += n

    # RGBE → リニア float
    e = rgbe[..., 3].astype(np.int32)
    scale = np.where(e == 0, 0.0, np.ldexp(1.0, e - (128 + 8))).astype(np.float32)
    rgb = rgbe[..., :3].astype(np.float32) * scale[..., None]
    return rgb


def tonemap(rgb: np.ndarray, exposure: float = 1.0) -> np.ndarray:
    """
    ACES 近似のトーンマップ → sRGB の 0..255。

    three 側も ACESFilmicToneMapping を使っているので、
    **背景の見た目と 3D の見た目が同じ曲線**に乗る。
    """
    x = rgb * exposure
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    y = np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)
    srgb = np.where(y <= 0.0031308, y * 12.92, 1.055 * np.power(y, 1 / 2.4) - 0.055)
    return np.clip(srgb * 255, 0, 255).astype(np.uint8)
