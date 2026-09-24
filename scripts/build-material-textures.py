#!/usr/bin/env python3
"""
写真から起こす素材テクスチャと、HDRI から起こす空。

担当する出力:
  public/textures/surface/kawara-*     ← references/textures-new/kawara1.png
  public/textures/surface/plaster-*    ← references/textures-new/shikkui1.png
  public/textures/surface/gold-*       ← references/textures-new/gold1.png
  public/textures/surface/ishigaki-*   ← references/textures-new/ishigaki1.png
  public/textures/env/sky-view.webp    ← references/hdri/*.hdr（見える空）
  public/textures/env/sky-env.webp     ← 同上（映り込み用。PMREM でぼけるので小さくてよい）

地面（ground-*）は写真が無いので scripts/build-surface-textures.py が
手続き的に作り続ける。分担が分かれているのはそのため。

原画像には手を加えない（やり直せるようにしておく）。

使い方:
  python3 scripts/build-material-textures.py
"""

# 型注釈を実行時に評価させない（この環境の Python は `X | None` を解釈できない）
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hdr import load_hdr, tonemap  # noqa: E402

import zipfile
import io as _io

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "references" / "textures-new"
HDRI = ROOT / "references" / "hdri"
GROUND_SRC = ROOT / "references" / "textures-ground"
OUT = ROOT / "public" / "textures" / "surface"
ENV_OUT = ROOT / "public" / "textures" / "env"

WEBP_QUALITY = 86
# 継ぎ目消しに使う帯の幅（画像幅に対する比）
BLEND = 0.12

LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)

# 使う HDRI。夜の星空だけが暗いヒーローに合う。
# 昼・朝焼けのものは明るすぎて、既存 Navbar の白文字が読めなくなる。
SKY_FILE = "rogland_clear_night_4k.hdr"
# 露出。1.0 でも明るすぎたので絞ってある
SKY_EXPOSURE = 0.85
# 見える空の圧縮率。星が高周波なので、ここを上げると一気に重くなる
SKY_VIEW_QUALITY = 70
# 見える空の幅。4096（等倍）にすると 806KB になるが、px/度 は 8.5 → 11.4 の
# 1.3 倍にしかならない。容量の増え方に見合わないので 3072 で止める
SKY_VIEW_WIDTH = 3072

# HDRI の地形を消す範囲（v = 0 が天頂、1 が真下）。
#
# **山は自前の稜線で作る**ので、HDRI からは空だけ borrow する。
# **消し「終わる」位置を、地形が始まる位置より上に取ること。**
#
# ここは 2 回間違えた。
#   1 回目: 緯度ごとの平均輝度で v=0.45 と判断 → 平均は「その帯の大半が空」
#           なので落ちるのが遅く、岩峰（v=0.378 まで伸びている）が残った
#   2 回目: 始点を 0.36 に上げた → だが終点が 0.52 のままだったので、
#           v=0.378 の時点でまだ 3% しか消えておらず、やはり残った
#
# 効くのは始点ではなく**終点**。地形の上端 v=0.378 より前に消し切る。
SKY_GROUND_FADE = (0.28, 0.375)
# 消したあとの暗さ。地平のすぐ上の空に対する比
SKY_GROUND_GAIN = 0.30


# ---------------------------------------------------------------------------
# 共通処理
# ---------------------------------------------------------------------------


def make_seamless(arr: np.ndarray, blend_frac: float = BLEND) -> np.ndarray:
    """
    重ね合わせブレンドで上下左右がつながるようにする。

    画像生成 AI の「シームレス」はまず信用できないので、届いた画像は
    必ずここを通す。右端の帯を左端へ、下端の帯を上端へ余弦カーブで溶かす。
    """
    a = arr.astype(np.float32)

    h, w = a.shape[:2]
    bw = max(1, int(w * blend_frac))
    out = a[:, : w - bw].copy()
    for x in range(bw):
        t = (x + 1) / (bw + 1)
        t = 0.5 - 0.5 * np.cos(np.pi * t)  # 端で傾きが 0 になり継ぎ目が目立たない
        out[:, x] = a[:, x] * t + a[:, w - bw + x] * (1 - t)

    a = out
    h, w = a.shape[:2]
    bh = max(1, int(h * blend_frac))
    out = a[: h - bh].copy()
    for y in range(bh):
        t = (y + 1) / (bh + 1)
        t = 0.5 - 0.5 * np.cos(np.pi * t)
        out[y] = a[y] * t + a[h - bh + y] * (1 - t)

    return out


def luminance(rgb: np.ndarray) -> np.ndarray:
    return rgb @ LUMA


def box_blur(g: np.ndarray, radius: int = 2) -> np.ndarray:
    """numpy だけで済ませる簡易ぼかし。ノーマルのノイズ取りに使う。"""
    out = g.astype(np.float32)
    for _ in range(2):
        acc = np.zeros_like(out)
        n = 0
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                acc += np.roll(np.roll(out, dy, axis=0), dx, axis=1)
                n += 1
        out = acc / n
    return out


def normal_from(lum: np.ndarray, strength: float) -> Image.Image:
    """
    明るさを高さと見なして法線を起こす。周期境界なのでタイリングする。

    strength は**模様の周波数に合わせて決める**こと。
    幅の広い緩やかな山（丸瓦など）は 1 画素あたりの傾きが小さいので、
    細かい模様と同じ強度では法線がほぼ平らになる。
    """
    h = box_blur(lum / 255.0, 2)
    dx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * strength
    dy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * strength
    nz = np.ones_like(h)
    ln = np.sqrt(dx * dx + dy * dy + nz * nz)
    rgb = np.stack([-dx / ln, -dy / ln, nz / ln], axis=-1)
    return Image.fromarray(np.clip((rgb * 0.5 + 0.5) * 255, 0, 255).astype(np.uint8))


def rough_from(lum: np.ndarray, lo: float, hi: float) -> Image.Image:
    """
    明るいところほど滑らか、暗いところほど粗い、と見なす。
    一様な粗さが CG 臭さの最大要因なので、必ず作る。
    """
    n = lum / 255.0
    r = hi - (hi - lo) * n
    g = np.clip(r * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(g, "L").convert("RGB")


def save(img: Image.Image, name: str, size: int, out_dir: Path = OUT) -> int:
    out_dir.mkdir(parents=True, exist_ok=True)
    if img.size[0] != size or img.size[1] != size:
        img = img.resize((size, size), Image.LANCZOS)
    path = out_dir / name
    img.save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    n = path.stat().st_size
    print(f"  {name:28s} {n / 1024:6.0f} KB  {size}x{size}")
    return n


def grade(rgb: np.ndarray, saturation: float, gain: float) -> np.ndarray:
    """彩度と明るさだけ整える。模様（＝情報）は触らない。"""
    lum = luminance(rgb)[..., None]
    out = (lum + (rgb - lum) * saturation) * gain
    return np.clip(out, 0, 255)


# ---------------------------------------------------------------------------
# 素材
# ---------------------------------------------------------------------------


def build(
    src_name: str,
    out_stem: str,
    albedo_size: int,
    normal_size: int,
    normal_strength: float,
    saturation: float,
    gain: float,
    rough: tuple[float, float] | None,
    rough_size: int = 512,
) -> int:
    path = SRC / src_name
    if not path.exists():
        print(f"!! 見つかりません（飛ばします）: {path}")
        return 0

    print(f"{out_stem}  ← {src_name}")
    img = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
    tile = make_seamless(img)
    tile = grade(tile, saturation, gain)

    total = 0
    total += save(Image.fromarray(tile.astype(np.uint8)), f"{out_stem}-albedo.webp", albedo_size)

    lum = luminance(tile)
    total += save(normal_from(lum, normal_strength), f"{out_stem}-normal.webp", normal_size)
    if rough:
        total += save(rough_from(lum, rough[0], rough[1]), f"{out_stem}-rough.webp", rough_size)
    return total


# ---------------------------------------------------------------------------
# 地面（Poly Haven の PBR セット）
# ---------------------------------------------------------------------------


def _from_zip(zip_path: Path, suffix: str) -> Image.Image:
    """zip を展開せずに 1 枚だけ取り出す。60MB を作業ディレクトリに撒かない"""
    with zipfile.ZipFile(zip_path) as z:
        name = next(n for n in z.namelist() if n.endswith(suffix))
        return Image.open(_io.BytesIO(z.read(name)))


def _height(img: Image.Image) -> np.ndarray:
    """16bit グレースケールにも RGBA にもなりうる disp を 0..1 に正規化する"""
    if img.mode in ("I;16", "I", "I;16B"):
        a = np.asarray(img, dtype=np.float32) / 65535.0
    else:
        a = np.asarray(img.convert("L"), dtype=np.float32) / 255.0
    return a


def build_ground(zip_name: str, out_stem: str, albedo_size: int, normal_size: int,
                 rough_size: int, gain: float, saturation: float,
                 normal_strength: float, want_normal: bool) -> int:
    path = GROUND_SRC / zip_name
    if not path.exists():
        print(f"!! 見つかりません（飛ばします）: {path}")
        return 0

    print(f"{out_stem}  ← {zip_name}")

    # Poly Haven のテクスチャは**元からシームレス**なので、
    # 継ぎ目消しは掛けない。掛けると逆に模様を潰してしまう。
    diff = np.asarray(_from_zip(path, "_diff_2k.jpg").convert("RGB"), dtype=np.float32)
    diff = grade(diff, saturation, gain)

    total = 0
    total += save(Image.fromarray(diff.astype(np.uint8)), f"{out_stem}-albedo.webp", albedo_size)

    # 法線は**高さ（disp）から起こす**。
    # 明るさから推測するのと違い、これは本物の高さデータなので凹凸の向きが正しい。
    # 法線マップ本体は EXR でしか配布されておらず、この環境では読めない。
    if want_normal:
        h = _height(_from_zip(path, "_disp_2k.png"))
        total += save(normal_from(h * 255.0, normal_strength), f"{out_stem}-normal.webp", normal_size)

    # ARM の G が粗さ。実測値なので、明るさから推測するより正確
    arm = np.asarray(_from_zip(path, "_arm_2k.jpg").convert("RGB"), dtype=np.float32)
    rough = Image.fromarray(np.clip(arm[..., 1], 0, 255).astype(np.uint8), "L").convert("RGB")
    total += save(rough, f"{out_stem}-rough.webp", rough_size)
    return total


# ---------------------------------------------------------------------------
# 空
# ---------------------------------------------------------------------------


def build_sky() -> int:
    path = HDRI / SKY_FILE
    if not path.exists():
        print(f"!! 見つかりません（飛ばします）: {path}")
        return 0

    print(f"空  ← {SKY_FILE}")
    rgb = load_hdr(path)
    ldr = tonemap(rgb, SKY_EXPOSURE).astype(np.float32)

    # --- 地形を消す ---
    # 山は自前の稜線で作るので、HDRI の地形が残っていると二重になり、
    # しかも縮尺の合わない岩山が手前に居座る（実際そうなった）。
    h = ldr.shape[0]
    v0, v1 = SKY_GROUND_FADE
    # 消した先の色は、地平のすぐ上の空を落としたもの。
    # 無関係な色を置くと、そこだけ帯に見える
    band = ldr[int(h * (v0 - 0.06)) : int(h * v0)].reshape(-1, 3).mean(axis=0)
    target = band * SKY_GROUND_GAIN

    vs = np.linspace(0, 1, h, endpoint=False)[:, None]
    t = np.clip((vs - v0) / (v1 - v0), 0, 1)
    # 端で傾きが 0 になるので、消し際が線として出ない
    t = t * t * (3 - 2 * t)
    ldr = ldr * (1 - t[..., None]) + target[None, None, :] * t[..., None]

    img = Image.fromarray(np.clip(ldr, 0, 255).astype(np.uint8))
    print(f"  元 {img.size[0]}x{img.size[1]}  地形を v {v0}-{v1} で消去")

    ENV_OUT.mkdir(parents=True, exist_ok=True)
    total = 0

    # 見える空。正距円筒図なので 2:1。
    #
    # **解像度が効く。** 1600px だと 360 度を 4.4 px/度 でしか描けず、
    # 画面（38 度に 1330px ＝ 35 px/度）に対して 8 倍足りずに一目でぼける。
    # 元データが 4096px なので、等倍まで上げるのが上限。
    # それでも 11 px/度 なので、遠景として柔らかいのは原理的に避けられない。
    view = img.resize((SKY_VIEW_WIDTH, SKY_VIEW_WIDTH // 2), Image.LANCZOS)
    p = ENV_OUT / "sky-view.webp"
    view.save(p, "WEBP", quality=SKY_VIEW_QUALITY, method=6)
    total += p.stat().st_size
    print(f"  {'sky-view.webp':28s} {p.stat().st_size / 1024:6.0f} KB  {view.size[0]}x{view.size[1]}")

    # 映り込み用。PMREM が大きくぼかすので小さくてよい
    env = img.resize((256, 128), Image.LANCZOS)
    p = ENV_OUT / "sky-env.webp"
    env.save(p, "WEBP", quality=88, method=6)
    total += p.stat().st_size
    print(f"  {'sky-env.webp':28s} {p.stat().st_size / 1024:6.0f} KB  256x128")

    return total


def main() -> None:
    total = 0

    # 瓦。丸瓦の畝は幅が広く傾きが緩いので、法線は強めに出す
    # 屋根は引きで見るので 800 で足りる
    total += build("kawara1.png", "kawara", 800, 512, 26.0, 0.8, 0.92, (0.38, 0.72))
    # 漆喰。凹凸はごく浅い
    total += build("shikkui1.png", "plaster", 512, 512, 9.0, 0.85, 0.9, (0.82, 0.96))
    # 金箔。箔の継ぎ目だけが凹凸。粗さは低め（金属なので）
    total += build("gold1.png", "gold", 512, 512, 12.0, 1.0, 1.0, (0.2, 0.46))
    # 石垣。石の輪郭が質感そのものなので、法線と粗さの両方をしっかり出す
    # 1 個の石には写真の 1/3 の窓しか乗らないので、768 でも 1 石あたり 256px ある
    total += build("ishigaki1.png", "ishigaki", 768, 512, 16.0, 0.75, 0.92, (0.72, 0.98))

    # 地面。近景は踏み固めた土、遠景に混ぜるのは粗い砕石。
    # **2 枚あるので、本物の 2 テクスチャ混合ができる**（1 枚を縮尺違いで
    # 掛ける誤魔化しが要らなくなる）
    total += build_ground("forest_ground_06_2k.zip", "ground", 768, 768, 512, 1.0, 0.85, 3.2, True)
    total += build_ground("rocks_ground_01_2k.zip", "ground2", 512, 512, 256, 0.9, 0.8, 3.2, False)

    total += build_sky()

    print(f"\n合計 {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
