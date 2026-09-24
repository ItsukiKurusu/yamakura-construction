#!/usr/bin/env python3
"""
森の木のテクスチャを組み立てる。

references/textures-trees/ と references/textures-wood/ の ZIP（ambientCG・Poly Haven、CC0）を
解凍せずに読み、public/textures/trees/ へ書き出す。

  cedar-branch.webp … 杉の「枝 1 本ぶん」の板。付け根が左（u=0）、先が右。上下 2 種
  broad-clump.webp  … 広葉樹・灌木の「葉の塊」の板。2x2 で 4 種
  bark-albedo.webp  … 幹の樹皮

**写真をそのまま大きな板に貼らない**のが肝。杉の房は 30〜60cm、葉は 10cm ほどしかないので、
樹冠の大きさの板に 1 房・1 枚を貼ると、房や葉が人の背丈ほどになって縮尺が壊れる。
実物大の房を枝に沿って何本も並べ、葉を何十枚も重ねた板を作ってから使う。

使い方:
  python3 scripts/build-tree-textures.py
"""
from __future__ import annotations

import io
import math
import random
import zipfile
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
TREES = ROOT / "references" / "textures-trees"
WOOD = ROOT / "references" / "textures-wood"
OUT = ROOT / "public" / "textures" / "trees"
PREVIEW = ROOT / ".texture-preview"

WEBP_QUALITY = 86


def from_zip(path: Path, suffix: str) -> Image.Image:
    with zipfile.ZipFile(path) as z:
        name = next(n for n in z.namelist() if n.endswith(suffix))
        return Image.open(io.BytesIO(z.read(name)))


def sprites(zip_name: str, stem: str, min_px: int = 30) -> list[Image.Image]:
    """透過マップの連結成分ごとに、1 房・1 枚ずつの RGBA 画像に切り出す（大きい順）"""
    path = TREES / zip_name
    col = from_zip(path, f"{stem}_Color.jpg").convert("RGB")
    op = from_zip(path, f"{stem}_Opacity.jpg").convert("L")
    W, H = op.size
    # 縮小した画像で成分を探し、元の解像度で切り出す
    s = 256
    small = np.asarray(op.resize((s, round(s * H / W)))) > 40
    h, w = small.shape
    seen = np.zeros_like(small)
    boxes = []
    for y in range(h):
        for x in range(w):
            if small[y, x] and not seen[y, x]:
                q = deque([(y, x)])
                seen[y, x] = True
                ys, xs = [y], [x]
                while q:
                    cy, cx = q.popleft()
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < h and 0 <= nx < w and small[ny, nx] and not seen[ny, nx]:
                                seen[ny, nx] = True
                                q.append((ny, nx))
                                ys.append(ny)
                                xs.append(nx)
                if len(ys) >= min_px:
                    boxes.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1, len(ys)))
    boxes.sort(key=lambda b: -b[4])
    out = []
    rgba = col.copy()
    rgba.putalpha(op)
    for x0, y0, x1, y1, _ in boxes:
        k = W / w
        pad = 2
        box = (max(0, int(x0 * k) - pad), max(0, int(y0 * k) - pad), min(W, int(x1 * k) + pad), min(H, int(y1 * k) + pad))
        out.append(rgba.crop(box))
    return out


def shade(im: Image.Image, f: float, tint: tuple[float, float, float] = (1, 1, 1)) -> Image.Image:
    """明るさと色味を掛ける（下に重なる葉ほど暗くして、塊の奥行きを出す）"""
    a = np.asarray(im, dtype=np.float32)
    a[..., 0] *= f * tint[0]
    a[..., 1] *= f * tint[1]
    a[..., 2] *= f * tint[2]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def paste_rotated(canvas: Image.Image, sprite: Image.Image, cx: float, cy: float,
                  length: float, angle_deg: float, anchor_left: bool) -> None:
    """
    sprite を長さ length（長い辺）に縮め、angle_deg 回して貼る。
    anchor_left なら sprite の左端中央（杉の房の付け根）を (cx, cy) に合わせる
    """
    sw, sh = sprite.size
    scale = length / max(sw, sh)
    sp = sprite.resize((max(1, round(sw * scale)), max(1, round(sh * scale))), Image.LANCZOS)
    w, h = sp.size
    rot = sp.rotate(angle_deg, resample=Image.BICUBIC, expand=True)
    rw, rh = rot.size
    if anchor_left:
        # 付け根（左端中央）が回転後にどこへ来るか
        ax, ay = -w / 2, 0.0
        t = math.radians(angle_deg)
        bx = ax * math.cos(t) + ay * math.sin(t)
        by = -ax * math.sin(t) + ay * math.cos(t)
        px, py = cx - (rw / 2 + bx), cy - (rh / 2 + by)
    else:
        px, py = cx - rw / 2, cy - rh / 2
    canvas.alpha_composite(rot, (round(px), round(py)))


def bleed(im: Image.Image, passes: int = 14) -> Image.Image:
    """
    透明な部分へ葉の色を広げる。**元画像の背景は白**なので、そのままだと
    縮小（ミップマップ）のときに白が縁に混ざり、葉の輪郭が白く光る。
    """
    a = np.asarray(im, dtype=np.float32) / 255.0
    rgb, al = a[..., :3], a[..., 3:4]
    known = (al > 0.02).astype(np.float32)
    acc = rgb * known
    w = known.copy()
    out = rgb.copy()
    for _ in range(passes):
        acc = (acc + np.roll(acc, 1, 0) + np.roll(acc, -1, 0) + np.roll(acc, 1, 1) + np.roll(acc, -1, 1)) / 5
        w = (w + np.roll(w, 1, 0) + np.roll(w, -1, 0) + np.roll(w, 1, 1) + np.roll(w, -1, 1)) / 5
        fill = acc / np.maximum(w, 1e-4)
        out = np.where(known > 0, rgb, fill)
    res = np.concatenate([out, al], axis=-1)
    return Image.fromarray(np.clip(res * 255, 0, 255).astype(np.uint8))


def grade_mean(im: Image.Image, target: tuple[int, int, int], saturation: float) -> Image.Image:
    """不透明な部分の平均色を target に合わせる"""
    a = np.asarray(im, dtype=np.float32)
    rgb, al = a[..., :3], a[..., 3]
    mask = al > 128
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    rgb = lum[..., None] + (rgb - lum[..., None]) * saturation
    mean = rgb[mask].mean(axis=0)
    rgb *= np.array(target, dtype=np.float32) / np.maximum(mean, 1e-3)
    out = np.concatenate([np.clip(rgb, 0, 255), al[..., None]], axis=-1)
    return Image.fromarray(out.astype(np.uint8))


# ---------------------------------------------------------------------------
# 杉の枝
# ---------------------------------------------------------------------------

def build_cedar() -> Image.Image:
    fronds = sprites("LeafSet019_2K-JPG.zip", "LeafSet019_2K-JPG")[:3]
    # 元の房は付け根が右。左右を返して、付け根を左（幹の側）にそろえる
    fronds = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in fronds]
    W, H = 1024, 512
    sheet = Image.new("RGBA", (W, H * 2), (0, 0, 0, 0))
    for row in range(2):
        rnd = random.Random(20261013 + row)
        c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        # 小枝。付け根から先へ、わずかに垂れる
        axis = [(18 + t * (W - 60), H / 2 + (t ** 2) * 40) for t in np.linspace(0, 1, 40)]
        twig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        from PIL import ImageDraw
        d = ImageDraw.Draw(twig)
        d.line(axis, fill=(78, 58, 40, 255), width=7)
        c.alpha_composite(twig)
        # 房を枝に沿って並べる。付け根側は下（奥）に、先ほど上に重ねる
        n = 17
        for i in range(n):
            t = 0.04 + (i / (n - 1)) * 0.88
            x, y = axis[min(len(axis) - 1, int(t * (len(axis) - 1)))]
            side = 1 if i % 2 == 0 else -1
            ang = side * rnd.uniform(12, 38) - t * 6
            length = W * rnd.uniform(0.3, 0.44) * (1.0 - 0.45 * t)
            depth = 0.62 + 0.38 * (i / (n - 1))
            f = shade(rnd.choice(fronds), depth)
            paste_rotated(c, f, x, y + rnd.uniform(-10, 10), length, -ang, anchor_left=True)
        # 先端の房
        paste_rotated(c, fronds[0], axis[-1][0] - W * 0.2, axis[-1][1], W * 0.26, -4, anchor_left=True)
        sheet.alpha_composite(c, (0, row * H))
    # 杉の葉は暗い青みの緑。写真の房は明るい黄緑なので寄せる
    sheet = grade_mean(sheet, (64, 86, 56), 0.75)
    return bleed(sheet)


# ---------------------------------------------------------------------------
# 広葉樹・灌木の葉の塊
# ---------------------------------------------------------------------------

def build_clump() -> Image.Image:
    leaves = sprites("LeafSet005_2K-JPG.zip", "LeafSet005_2K-JPG")
    # いちばん大きいのは 3 枚付きの小枝、残りは 1 枚ずつ
    S = 512
    sheet = Image.new("RGBA", (S * 2, S * 2), (0, 0, 0, 0))
    for k in range(4):
        rnd = random.Random(777 + k)
        c = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        n = 70
        for i in range(n):
            # 中心ほど密に。円の中にばらまく
            r = (rnd.random() ** 0.7) * S * 0.4
            th = rnd.random() * math.tau
            x = S / 2 + math.cos(th) * r
            y = S / 2 + math.sin(th) * r * 0.9
            size = S * rnd.uniform(0.13, 0.2)
            src = leaves[0] if rnd.random() < 0.25 else rnd.choice(leaves[1:] or leaves)
            if src is leaves[0]:
                size *= 1.8
            depth = 0.5 + 0.5 * (i / n)
            tint = (rnd.uniform(0.92, 1.05), rnd.uniform(0.95, 1.05), rnd.uniform(0.9, 1.0))
            paste_rotated(c, shade(src, depth, tint), x, y, size, rnd.uniform(0, 360), anchor_left=False)
        sheet.alpha_composite(c, ((k % 2) * S, (k // 2) * S))
    sheet = grade_mean(sheet, (70, 88, 52), 0.8)
    return bleed(sheet)


# ---------------------------------------------------------------------------
# 樹皮
# ---------------------------------------------------------------------------

def build_bark() -> Image.Image:
    path = WOOD / "eucalyptus_bark_2k.zip"
    col = from_zip(path, "eucalyptus_bark_diff_2k.jpg").convert("RGB")
    a = np.asarray(col, dtype=np.float32)
    # 苔の緑みを抜き、杉の樹皮の赤茶へ寄せる
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    a = lum[..., None] + (a - lum[..., None]) * 0.35
    a *= np.array((88, 62, 44), dtype=np.float32) / np.maximum(a.reshape(-1, 3).mean(0), 1e-3)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS)


def save(im: Image.Image, name: str, size: tuple[int, int] | None = None) -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    if size:
        im = im.resize(size, Image.LANCZOS)
    path = OUT / name
    im.save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    prev = Image.new("RGB", im.size, (20, 22, 26))
    if im.mode == "RGBA":
        prev.paste(im, mask=im.split()[3])
    else:
        prev = im.convert("RGB")
    prev.save(PREVIEW / name.replace(".webp", ".jpg"), quality=88)
    size_b = path.stat().st_size
    print(f"  → {name}  {im.size[0]}x{im.size[1]}  {size_b / 1024:.0f} KB")
    return size_b


def main() -> None:
    total = 0
    print("杉の枝 ← LeafSet019")
    total += save(build_cedar(), "cedar-branch.webp")
    print("広葉樹の葉の塊 ← LeafSet005")
    total += save(build_clump(), "broad-clump.webp")
    print("樹皮 ← eucalyptus_bark")
    total += save(build_bark(), "bark-albedo.webp")
    print(f"合計 {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
