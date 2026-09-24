"""
見出し・導入文用の明朝体（しっぽり明朝）を、このサイトで使う文字だけに絞って書き出す。

  python3 scripts/build-mincho.py

next/font/google のまま使うと、日本語は約 120 個の断片に分かれて配られ、
1 つの断片に数百字が入っている。見出しと導入文の文字だけでも大半の断片にかかり、
トップページで 244 ファイル・約 7.5MB を読んでいた。
使う文字だけを残して 1 つのファイルに束ねると、太さ 1 つあたり数百 KB で済む。

入力  references/fonts/shippori-mincho/（next/font が取得した断片と faces.json。公開しない）
出力  public/fonts/shippori-mincho-{500,700}.woff2
      app/mincho.css（@font-face。layout.tsx から読む）

文字を足したら（新しい見出しや導入文を書いたら）これを実行し直す。
入れ忘れた字は端末の明朝（ヒラギノ明朝・游明朝）で表示されるだけで、崩れはしない。
"""
import json
import re
import tempfile
from pathlib import Path

from fontTools import subset
from fontTools.merge import Merger
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "references/fonts/shippori-mincho"
OUT = ROOT / "public/fonts"
CSS = ROOT / "app/mincho.css"
FAMILY = "Shippori Mincho Site"
# 導入文は 500、見出しと社名は 700（800 や 600 を指定しても一番近いこの 2 つで描かれる）
WEIGHTS = [500, 700]


def strip_comments(s: str) -> str:
    s = re.sub(r"\{/\*.*?\*/\}", "", s, flags=re.S)
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    return re.sub(r"(?m)(^|[^:\"'])//.*$", r"\1", s)


def site_chars() -> set[int]:
    chars: set[str] = set()
    for d in ["app", "components", "lib"]:
        for f in (ROOT / d).rglob("*.ts*"):
            # 3D の部分は画面に文字を出さない（コメントの漢字を拾わないため）
            if "hero3d" in f.parts:
                continue
            chars |= set(strip_comments(f.read_text()))
    cps = {ord(c) for c in chars if ord(c) > 0x7F}
    # 後から文章を直しても困らないよう、かな・記号・英数字は全部入れておく
    cps |= set(range(0x20, 0x7F))
    cps |= set(range(0x3000, 0x3040))  # 句読点・括弧
    cps |= set(range(0x3041, 0x3097))  # ひらがな
    cps |= set(range(0x30A0, 0x3100))  # カタカナ
    cps |= set(range(0xFF01, 0xFF5F))  # 全角英数・記号
    return cps


def parse_range(r: str) -> set[int]:
    out: set[int] = set()
    for part in r.split(","):
        part = part.strip().removeprefix("U+")
        if "-" in part:
            a, b = part.split("-")
            out |= set(range(int(a, 16), int(b, 16) + 1))
        else:
            out.add(int(part, 16))
    return out


def main() -> None:
    faces = json.loads((SRC / "faces.json").read_text())
    need = site_chars()
    OUT.mkdir(parents=True, exist_ok=True)
    css = [f"/* scripts/build-mincho.py が書き出す。手で編集しない */"]

    for w in WEIGHTS:
        parts = []
        covered: set[int] = set()
        with tempfile.TemporaryDirectory() as tmp:
            for i, face in enumerate(f for f in faces if f["weight"] == w):
                keep = need & parse_range(face["range"])
                if not keep:
                    continue
                font = TTFont(SRC / face["file"])
                opts = subset.Options()
                opts.hinting = False
                opts.layout_features = ["palt", "kern", "liga"]
                opts.name_IDs = ["*"]
                s = subset.Subsetter(opts)
                s.populate(unicodes=keep)
                s.subset(font)
                path = Path(tmp) / f"{i}.ttf"
                font.flavor = None
                font.save(path)
                parts.append(str(path))
                covered |= keep
            merged = Merger().merge(parts)
            merged.flavor = "woff2"
            dst = OUT / f"shippori-mincho-{w}.woff2"
            merged.save(dst)
        missing = sorted(c for c in need if c > 0x3000 and c not in covered and 0x4E00 <= c <= 0x9FFF)
        print(f"{dst.relative_to(ROOT)}  {dst.stat().st_size // 1024} KB  glyphs from {len(parts)} slices", end="")
        print(f"  (not in font: {''.join(map(chr, missing))})" if missing else "")
        css.append(
            "@font-face {\n"
            f"  font-family: '{FAMILY}';\n"
            "  font-style: normal;\n"
            f"  font-weight: {w};\n"
            "  font-display: swap;\n"
            f"  src: url('/fonts/shippori-mincho-{w}.woff2') format('woff2');\n"
            "}"
        )

    CSS.write_text("\n\n".join(css) + "\n")
    print(CSS.relative_to(ROOT))


if __name__ == "__main__":
    main()
