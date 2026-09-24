#!/usr/bin/env bash
# 旧トップの現場動画（references/ の元ファイル）から、3D ヒーローの下に置くループ動画を作る。
#
#   bash scripts/build-craft-video.sh [入力ファイル] [入力の先頭が元動画の何秒目か]
#
# 入力を省略すると references/538620822806856036.MP4 を使う。
# AI で高画質化した中間ファイル（scripts/upscale-video.swift の出力。元動画の 19.9 秒目から切り出して
# 4 倍にしたもの）を渡すときは、2 つ目の引数に 19.9 を渡す。区間が同じ場面に揃う。
#   bash scripts/build-craft-video.sh references/craft-upscaled.mov 19.9
# 解像度は入力に関係なく 1920/1280 に揃える。
#
# 出力（public/videos/）
#   craft-1080.mp4  … H.264 1920x1080（デスクトップ）
#   craft-720.mp4   … H.264 1280x720（スマホ）
#   craft-1080-av1.mp4 … AV1 1920x1080（対応ブラウザは軽い方を使う）
#   craft-poster.jpg … 最初のコマ（読み込み前・動きを止めた人向けの静止画）
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="${1:-references/538620822806856036.MP4}"
OFFSET="${2:-0}"
OUT=public/videos
mkdir -p "$OUT"

# 区間: 板を押し出す → 1 本切る → 次の板を押し出す直前。18 秒。
# 終わりの XF 秒を、開始直前の XF 秒と重ねてつなぐので、繰り返しの継ぎ目が見えない
XF=0.6
START=$(python3 -c "print(round(20.5 - $OFFSET, 3))")
END=$(python3 -c "print(round(38.5 - $OFFSET, 3))")
# 高画質化した素材は圧縮ノイズがもう取れているので、ノイズ除去と輪郭強調を弱める
if [ "$OFFSET" = "0" ]; then DENOISE="hqdn3d=1.5:1.5:4:4,"; SHARP=0.45; else DENOISE=""; SHARP=0.2; fi

# 色: 蛍光灯の青白い現場を、夜の 3D から続く暖かい色に寄せる。
# 暗さの大部分はページ側の CSS で重ねる（動画そのものは静止画としても使えるように明るめに残す）
grade() {
  local w=$1 h=$2
  echo "${DENOISE}scale=${w}:${h}:flags=lanczos,eq=contrast=1.1:brightness=-0.035:saturation=0.78:gamma=0.96,colorbalance=rs=0.03:bs=-0.05:rm=0.03:bm=-0.04:rh=0.02:bh=-0.03,vignette=angle=PI/4.2,cas=${SHARP},format=yuv420p"
}

loop_filter() {
  local g=$1
  local body_end head_start
  body_end=$(python3 -c "print($END - $XF)")
  head_start=$(python3 -c "print($START - $XF)")
  cat <<EOF
[0:v]trim=start=${START}:end=${body_end},setpts=PTS-STARTPTS[body];
[0:v]trim=start=${body_end}:end=${END},setpts=PTS-STARTPTS[tail];
[0:v]trim=start=${head_start}:end=${START},setpts=PTS-STARTPTS[head];
[tail][head]xfade=transition=fade:duration=${XF}:offset=0[seam];
[body][seam]concat=n=2:v=1:a=0,fps=30,${g}[v]
EOF
}

echo "→ craft-1080.mp4"
ffmpeg -v error -y -i "$SRC" -filter_complex "$(loop_filter "$(grade 1920 1080)")" -map "[v]" -an \
  -c:v libx264 -preset slow -crf 22 -profile:v high -movflags +faststart "$OUT/craft-1080.mp4"

echo "→ craft-720.mp4"
ffmpeg -v error -y -i "$SRC" -filter_complex "$(loop_filter "$(grade 1280 720)")" -map "[v]" -an \
  -c:v libx264 -preset slow -crf 24 -profile:v high -movflags +faststart "$OUT/craft-720.mp4"

echo "→ craft-1080-av1.mp4"
ffmpeg -v error -y -i "$SRC" -filter_complex "$(loop_filter "$(grade 1920 1080)")" -map "[v]" -an \
  -c:v libsvtav1 -preset 5 -crf 36 -g 240 -movflags +faststart "$OUT/craft-1080-av1.mp4"

echo "→ craft-poster.jpg"
ffmpeg -v error -y -i "$OUT/craft-1080.mp4" -frames:v 1 -q:v 3 "$OUT/craft-poster.jpg"

ls -la "$OUT"
