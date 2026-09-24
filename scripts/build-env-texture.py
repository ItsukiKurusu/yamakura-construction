#!/usr/bin/env python3
"""
背景（古い木造内部）の加工。

references/wood/timber-bg1.png から 2 種類を書き出す。

  1. 背景板用（16:9）… 継手の遠くに敷く板に貼る
  2. 映り込み用（2:1）… PMREM に通して環境マップにする。ぼかされるので小さくてよい

いまは RoomEnvironment（明るいスタジオ）を無理に絞って使っている。
暗い木造内部の環境に替えれば、映り込みが場面と一致して、
envMapIntensity を絞らずに済むようになる。

使い方:
  python3 scripts/build-env-texture.py
"""

from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "references" / "wood" / "timber-bg1.png"
OUT = ROOT / "public" / "textures" / "env"

# 背景板。遠景なのでこれ以上は要らない
PLATE_SIZE = (1600, 900)
# 環境マップ。PMREM が大きくぼかすので小さくてよい。equirect なので 2:1
ENV_SIZE = (1024, 512)

# 背景を落とす量。主役は継手なので、背景は「気配」まで沈める
PLATE_GAIN = 0.85
# 背景のぼかし。
# 継手と背景はどちらも暗い古材なので、そのままだと主役が背景に埋もれる。
# 継手にピントが合っていれば奥はボケる——写真として正しい形で分離させる。
PLATE_BLUR = 5.5
# 環境マップ側は明るさを保つ（ここを落とすと木が暗くなりすぎる）
ENV_GAIN = 0.9

WEBP_QUALITY = 86


def main() -> None:
    if not SRC.exists():
        print(f"!! 見つかりません: {SRC}")
        return

    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    print(f"元: {SRC.name} {src.width}x{src.height}\n")

    # --- 1. 背景板 ---
    plate = src.resize(PLATE_SIZE, Image.LANCZOS)
    plate = plate.filter(ImageFilter.GaussianBlur(PLATE_BLUR))
    a = np.asarray(plate, dtype=np.float32) * PLATE_GAIN
    plate = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    p1 = OUT / "hall-plate.webp"
    plate.save(p1, "WEBP", quality=WEBP_QUALITY, method=6)
    print(f"背景板   → {p1.name}  {p1.stat().st_size/1024:.0f} KB  {PLATE_SIZE[0]}x{PLATE_SIZE[1]}")

    # --- 2. 環境マップ ---
    # equirect として扱うため 2:1 にする。元は 16:9 なので上下を少し伸ばす形になるが、
    # PMREM でぼかされるうえ、効くのは明るさの分布だけなので実用上は問題ない。
    env = src.resize(ENV_SIZE, Image.LANCZOS)
    a = np.asarray(env, dtype=np.float32) * ENV_GAIN
    env = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    p2 = OUT / "hall-env.webp"
    env.save(p2, "WEBP", quality=WEBP_QUALITY, method=6)
    print(f"環境マップ → {p2.name}  {p2.stat().st_size/1024:.0f} KB  {ENV_SIZE[0]}x{ENV_SIZE[1]}")

    total = p1.stat().st_size + p2.stat().st_size
    print(f"\n合計 {total/1024:.0f} KB")


if __name__ == "__main__":
    main()
