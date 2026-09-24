#!/usr/bin/env python3
"""
地面・瓦・漆喰のテクスチャを**手続き的に**起こす。

木材と違って元写真が無いので、ここだけは計算で作る。
写真が手に入ったら、この 3 つはそのまま差し替えられる（出力ファイル名は固定）。

作るもの:
  ground  … 踏み固めた土と砂利。天守台のまわりに敷く
  kawara  … 本瓦葺（丸瓦の畝 ＋ 平瓦 ＋ 段ごとの重ね）
  plaster … 漆喰。真壁の壁面

いずれも**繰り返しても継ぎ目が出ない**ように、ノイズの補間も法線の微分も
すべて周期境界（np.roll）で計算している。

使い方:
  python3 scripts/build-surface-textures.py
"""

from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "textures" / "surface"

WEBP_QUALITY = 86
SEED = 20261013

# 1 タイルが実寸で何ミリか。tenshu.ts の UV スケールと必ず揃えること
TILE_MM = {"ground": 3000, "kawara_u": 1120, "kawara_v": 1200, "plaster": 1800}


# ---------------------------------------------------------------------------
# 周期境界のノイズ
# ---------------------------------------------------------------------------


def tile_noise(size: int, freq: int, rng: np.random.Generator) -> np.ndarray:
    """freq x freq の格子を滑らかに補間して size x size にする。上下左右が繋がる。"""
    g = rng.random((freq, freq))
    t = np.linspace(0, freq, size, endpoint=False)
    i0 = np.floor(t).astype(int) % freq
    i1 = (i0 + 1) % freq
    f = t - np.floor(t)
    # smoothstep。線形補間のままだと格子の目が見える
    f = f * f * (3 - 2 * f)
    fy = f[:, None]
    fx = f[None, :]
    a = g[np.ix_(i0, i0)]
    b = g[np.ix_(i0, i1)]
    c = g[np.ix_(i1, i0)]
    d = g[np.ix_(i1, i1)]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fractal(size: int, base: int, octaves: int, rng: np.random.Generator) -> np.ndarray:
    out = np.zeros((size, size), dtype=np.float64)
    amp = 1.0
    total = 0.0
    for o in range(octaves):
        freq = base * (2**o)
        if freq > size:
            break
        out += tile_noise(size, freq, rng) * amp
        total += amp
        amp *= 0.5
    return out / max(total, 1e-6)


def normalize(a: np.ndarray) -> np.ndarray:
    lo, hi = a.min(), a.max()
    return (a - lo) / max(hi - lo, 1e-6)


# ---------------------------------------------------------------------------
# 高さ → ノーマルマップ
# ---------------------------------------------------------------------------


def normal_from(height: np.ndarray, strength: float) -> Image.Image:
    """
    周期境界で微分するので、法線もタイリングする。

    strength は**模様の周波数に合わせて決める**こと。
    丸瓦のような「幅の広い緩やかな山」は 1 画素あたりの傾きが小さいので、
    砂利のような高周波と同じ強度では法線がほぼ平らになり、
    ノーマルマップが効いていないように見える（実際そうなった）。
    """
    dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * strength
    dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * strength
    nz = np.ones_like(height)
    ln = np.sqrt(dx * dx + dy * dy + nz * nz)
    rgb = np.stack([(-dx / ln), (-dy / ln), (nz / ln)], axis=-1)
    rgb = (rgb * 0.5 + 0.5) * 255
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), "RGB")


def gray(a: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8), "L").convert("RGB")


def tint(h: np.ndarray, lo: tuple, hi: tuple) -> Image.Image:
    """高さ（0..1）を 2 色の間で引く。"""
    a = np.stack(
        [h * (hi[i] - lo[i]) + lo[i] for i in range(3)],
        axis=-1,
    )
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB")


def save(img: Image.Image, name: str, size: int) -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    if img.size[0] != size:
        img = img.resize((size, size), Image.LANCZOS)
    path = OUT / name
    img.save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    kb = path.stat().st_size / 1024
    print(f"  {name:28s} {kb:6.0f} KB  {size}x{size}")
    return path.stat().st_size


# ---------------------------------------------------------------------------
# 1. 地面（踏み固めた土と砂利）
# ---------------------------------------------------------------------------


def build_ground(rng) -> int:
    S = 512
    print("地面")

    # 低周波のうねり（地形）＋ 中周波の土の粒 ＋ 高周波の砂利
    swell = fractal(S, 3, 3, rng)
    grain = fractal(S, 24, 3, rng)
    gravel = fractal(S, 96, 2, rng)

    # 砂利は「しきい値を超えた粒だけ」にする。全面に散らすと砂に見える
    stones = np.clip((gravel - 0.62) * 4.0, 0, 1)

    height = normalize(swell * 0.55 + grain * 0.3 + stones * 0.35)

    # 色。暗い土に、石だけわずかに明るく
    base = tint(height, (26, 22, 18), (74, 66, 56))
    b = np.asarray(base, dtype=np.float64)
    b += stones[..., None] * np.array([34, 32, 30])
    albedo = Image.fromarray(np.clip(b, 0, 255).astype(np.uint8), "RGB")

    # 粗さ。土はざらざら、石だけ少し滑らか
    rough = np.clip(0.97 - stones * 0.22 - grain * 0.06, 0, 1)

    total = 0
    total += save(albedo, "ground-albedo.webp", S)
    total += save(normal_from(height, 5.0), "ground-normal.webp", S)
    total += save(gray(rough), "ground-rough.webp", 256)
    return total


# ---------------------------------------------------------------------------
# 2. 本瓦葺（丸瓦の畝 ＋ 平瓦 ＋ 段の重ね）
# ---------------------------------------------------------------------------


def build_kawara(rng) -> int:
    S = 512
    ROLLS = 4  # 横方向に丸瓦 4 本ぶん
    COURSES = 4  # 縦方向に 4 段ぶん
    print("本瓦")

    v = np.linspace(0, 1, S, endpoint=False)[:, None]  # 流れ方向（軒→棟）
    u = np.linspace(0, 1, S, endpoint=False)[None, :]  # 桁行方向

    # --- 丸瓦。半円の畝 ---
    pu = (u * ROLLS) % 1.0
    # 畝の幅は 1 周期の 42%。残りが平瓦の面になる
    w = 0.42
    inside = pu < w
    t = np.where(inside, pu / w, 0.0)
    roll = np.where(inside, np.sqrt(np.clip(1 - (2 * t - 1) ** 2, 0, 1)), 0.0)

    # --- 平瓦。わずかに反った皿 ---
    tp = np.where(inside, 0.0, (pu - w) / (1 - w))
    pan = np.where(inside, 0.0, -0.12 * np.sin(np.pi * tp))

    # --- 段。軒側が上に重なるので、境目に段差が出る ---
    pv = (v * COURSES) % 1.0
    lap = np.clip((pv - 0.80) / 0.20, 0, 1) * 0.34

    # 1 枚ごとのわずかな狂い。全部揃うと工業製品に見える
    jitter = (fractal(S, ROLLS * 2, 2, rng) - 0.5) * 0.10

    height = normalize(roll * 0.62 + pan + lap + jitter)

    # 色。いぶし瓦の青灰色。畝の頂部だけ明るく
    # 色は控えめにする。陰影はノーマルマップが作るので、
    # albedo に明暗を焼き込むと二重に効いて作り物に見える
    albedo = tint(height, (44, 46, 52), (86, 90, 98))
    a = np.asarray(albedo, dtype=np.float64)
    # 段の境目に溜まる影
    shadow = np.clip((pv - 0.9) / 0.1, 0, 1) * 26
    a -= shadow[..., None]
    # 1 枚ごとの色むら
    a += ((fractal(S, ROLLS * 2, 1, rng) - 0.5) * 22)[..., None]
    albedo = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGB")

    total = 0
    total += save(albedo, "kawara-albedo.webp", S)
    total += save(normal_from(height, 52.0), "kawara-normal.webp", S)
    return total


# ---------------------------------------------------------------------------
# 3. 漆喰
# ---------------------------------------------------------------------------


def build_plaster(rng) -> int:
    S = 256
    print("漆喰")

    # 鏝（こて）むら。低周波だけで作る
    mottle = fractal(S, 5, 3, rng)
    fine = fractal(S, 40, 2, rng)
    height = normalize(mottle * 0.8 + fine * 0.2)

    # 真っ白にしない。暗い場面で白を置くと必ず飛ぶ
    albedo = tint(height, (150, 144, 133), (205, 199, 187))

    total = 0
    total += save(albedo, "plaster-albedo.webp", S)
    total += save(normal_from(height, 6.0), "plaster-normal.webp", S)
    return total


def main() -> None:
    rng = np.random.default_rng(SEED)
    total = 0
    total += build_ground(rng)
    total += build_kawara(rng)
    total += build_plaster(rng)
    print(f"\n合計 {total / 1024:.0f} KB")
    print("\n1 タイルの実寸（tenshu.ts の UV スケールと揃えること）:")
    for k, v in TILE_MM.items():
        print(f"  {k:10s} {v} mm")


if __name__ == "__main__":
    main()
