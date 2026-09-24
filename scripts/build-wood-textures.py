#!/usr/bin/env python3
"""
木材テクスチャの加工。

references/wood/ の原画像から、3D で使えるテクスチャ一式を public/textures/wood/ へ書き出す。
原画像には手を加えない（やり直せるようにしておく）。

やっていること:
  1. 繰り返しても継ぎ目が出ないようにする（重ね合わせブレンド）
  2. 彩度と明るさを、姫路城の参考写真から決めた色域へ寄せる
  3. 粗さマップを起こす（一様な粗さが CG 臭さの最大要因なので必ず作る）
  4. ノーマルマップを起こす（木目と干割れの凹凸）

使い方:
  python3 scripts/build-wood-textures.py
"""

from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "references" / "wood"
OUT = ROOT / "public" / "textures" / "wood"
PREVIEW = ROOT / ".texture-preview"  # 目視確認用。公開されない

# 出力解像度。マップの種類で変える。
#   色     … 1024。ここだけは解像度が効く
#   粗さ   … 512。もともと低周波なので落としても分からない
#   ノーマル… 512。高周波が多く webp が効きにくいので、ここを削るのが一番効く
SIZE = {"albedo": 1024, "rough": 512, "normal": 512}
# 継ぎ目消しに使う帯の幅（画像幅に対する比）
BLEND = 0.12
WEBP_QUALITY = 88


# ---------------------------------------------------------------------------
# 1. 継ぎ目消し
# ---------------------------------------------------------------------------

def make_seamless(arr: np.ndarray, blend_frac: float = BLEND) -> np.ndarray:
    """
    重ね合わせブレンドで上下左右がつながるようにする。

    右端の帯を左端へ、下端の帯を上端へ、余弦カーブで溶かし込む。
    その分だけ画像は小さくなるが、あとで拡大して戻す。
    タイル状に並べたときに境目が出なくなる。
    """
    a = arr.astype(np.float32)

    # --- 横方向 ---
    h, w = a.shape[:2]
    bw = max(1, int(w * blend_frac))
    out = a[:, : w - bw].copy()
    for x in range(bw):
        t = (x + 1) / (bw + 1)
        t = 0.5 - 0.5 * np.cos(np.pi * t)  # 端で傾きが 0 になるので継ぎ目が目立たない
        out[:, x] = a[:, x] * t + a[:, w - bw + x] * (1 - t)

    # --- 縦方向 ---
    a = out
    h, w = a.shape[:2]
    bh = max(1, int(h * blend_frac))
    out = a[: h - bh].copy()
    for y in range(bh):
        t = (y + 1) / (bh + 1)
        t = 0.5 - 0.5 * np.cos(np.pi * t)
        out[y] = a[y] * t + a[h - bh + y] * (1 - t)

    return out


# ---------------------------------------------------------------------------
# 2. 色を整える
# ---------------------------------------------------------------------------

LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)


def luminance(rgb: np.ndarray) -> np.ndarray:
    return rgb @ LUMA


def grade(rgb: np.ndarray, saturation: float, target: tuple[int, int, int]) -> np.ndarray:
    """
    彩度を落としてから、画像全体の平均色を target に合わせる。

    生成された木材はどれも彩度が高くオレンジ寄りで、暗いヒーローに置くと浮く。
    平均色を合わせる方式なら、木目の濃淡（＝情報）は保ったまま色域だけ移せる。
    target は既存の constants.ts で詰めた木の色をそのまま使う。
    """
    lum = luminance(rgb)[..., None]
    out = lum + (rgb - lum) * saturation

    mean = out.reshape(-1, 3).mean(axis=0)
    scale = np.array(target, dtype=np.float32) / np.maximum(mean, 1e-3)
    out = out * scale

    return np.clip(out, 0, 255)


# ---------------------------------------------------------------------------
# 3. 粗さ・ノーマル
# ---------------------------------------------------------------------------

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


def roughness_from(rgb: np.ndarray, lo: float = 0.62, hi: float = 0.88) -> np.ndarray:
    """
    明暗から粗さを起こす。
    暗いところ（晩材の硬い帯・干割れ・節）ほど繊維が荒れているので粗く、
    明るいところ（早材の面）はわずかに艶が出る、という向きにしている。
    """
    lum = luminance(rgb)
    lo_p, hi_p = np.percentile(lum, 2), np.percentile(lum, 98)
    n = np.clip((lum - lo_p) / max(hi_p - lo_p, 1e-3), 0, 1)
    rough = hi - n * (hi - lo)
    return np.clip(rough * 255, 0, 255)


def normal_from(rgb: np.ndarray, strength: float = 2.6) -> np.ndarray:
    """
    明暗の勾配から凹凸を起こす。木目の溝と干割れが凹んで見えるようになる。
    面取りが無いぶん、ここで表面の情報量を稼ぐ。
    """
    lum = box_blur(luminance(rgb) / 255.0, radius=1)

    # 環状に差分を取る（継ぎ目消し済みなので端で破綻しない）
    gx = (np.roll(lum, -1, axis=1) - np.roll(lum, 1, axis=1)) * 0.5
    gy = (np.roll(lum, -1, axis=0) - np.roll(lum, 1, axis=0)) * 0.5

    nx = -gx * strength * 255.0
    ny = -gy * strength * 255.0
    nz = np.ones_like(nx)

    length = np.sqrt(nx**2 + ny**2 + nz**2)
    nx, ny, nz = nx / length, ny / length, nz / length

    out = np.stack([nx, ny, nz], axis=-1) * 0.5 + 0.5
    return np.clip(out * 255, 0, 255)


# ---------------------------------------------------------------------------
# 出力する組み合わせ
# ---------------------------------------------------------------------------

JOBS = [
    {
        "name": "side-a",
        "src": "old-timber2.jpeg",
        "saturation": 0.85,
        # constants.ts の WOOD.beamA と同じ色に寄せる
        "target": (107, 89, 65),
        "maps": ("albedo", "rough", "normal"),
        "note": "梁A。灰褐色の古材",
    },
    {
        "name": "side-b",
        "src": "old-timber1.png",
        "saturation": 0.7,
        # WOOD.beamB。A より暗くして継ぎ目を読ませる
        "target": (76, 62, 45),
        "maps": ("albedo", "rough", "normal"),
        "note": "梁B。節と深い割れのある古材",
    },
    {
        "name": "end",
        "src": "growthrings2.jpeg",
        "saturation": 0.55,
        # 木口は切ったばかりなので側面よりわずかに明るい
        "target": (122, 102, 76),
        "maps": ("albedo", "normal"),
        "note": "木口。年輪",
    },
    {
        "name": "fresh",
        "src": "hinoki-planed-01.png",
        "saturation": 0.6,
        # 車知栓。最後に打ち込む新材なので明るい
        "target": (138, 115, 80),
        "maps": ("albedo",),
        "note": "車知栓・込栓。檜の仕上げ面",
    },
]


def save(img: np.ndarray, path: Path, kind: str) -> int:
    size = SIZE[kind]
    im = Image.fromarray(img.astype(np.uint8))
    im = im.resize((size, size), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    return path.stat().st_size


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)

    total = 0
    print(f"原画像: {SRC}")
    print(f"出力先: {OUT}\n")

    for job in JOBS:
        src = SRC / job["src"]
        if not src.exists():
            print(f"!! 見つかりません: {src}")
            continue

        rgb = np.asarray(Image.open(src).convert("RGB"), dtype=np.float32)
        tiled = make_seamless(rgb)
        graded = grade(tiled, job["saturation"], job["target"])

        print(f"[{job['name']}] {job['note']}")
        print(f"  元: {job['src']} {rgb.shape[1]}x{rgb.shape[0]}")

        for kind in job["maps"]:
            path = OUT / f"wood-{job['name']}-{kind}.webp"
            if kind == "albedo":
                size = save(graded, path, kind)
            elif kind == "rough":
                g = roughness_from(graded)
                size = save(np.stack([g] * 3, axis=-1), path, kind)
            elif kind == "normal":
                size = save(normal_from(graded), path, kind)
            total += size
            print(f"  → {path.name}  {size/1024:.0f} KB")

        # 継ぎ目の確認用に 2x2 で並べたものを出す（公開されない場所）
        prev = SIZE["albedo"]
        im = Image.fromarray(graded.astype(np.uint8)).resize((prev, prev), Image.LANCZOS)
        sheet = Image.new("RGB", (prev, prev))
        for ox in (0, 1):
            for oy in (0, 1):
                sheet.paste(im.resize((prev // 2, prev // 2), Image.LANCZOS),
                            (ox * prev // 2, oy * prev // 2))
        sheet.save(PREVIEW / f"tile-{job['name']}.jpg", quality=90)
        print()

    print(f"合計 {total/1024/1024:.2f} MB")
    print(f"タイル確認用: {PREVIEW}")


if __name__ == "__main__":
    main()
