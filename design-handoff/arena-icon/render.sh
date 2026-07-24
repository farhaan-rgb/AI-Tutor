#!/bin/zsh
# Arena icon render pipeline (free/local).
# Renders 48 frames of arena-icon.html at 480px via headless Chrome (batched
# parallel), then ffmpeg supersamples -> 240px single-global-palette GIF,
# 24fps, 2s seamless loop.
#
# Usage: ./render.sh <bg> <outname> [renderpx] [outpx]
#   bg      = dark | white | transparent
#   outname = output basename (no extension)
set -e
SP="${0:A:h}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BG="${1:-dark}"
OUT="${2:-arena-icon-$BG}"
RENDER_PX="${3:-480}"
OUT_PX="${4:-240}"
N=48
BATCH=8
FRAMES="$SP/frames_$BG"
rm -rf "$FRAMES"; mkdir -p "$FRAMES"

echo "Rendering $N frames @${RENDER_PX}px (bg=$BG)..."
i=0
while (( i < N )); do
  for (( j=0; j<BATCH && i<N; j++, i++ )); do
    t=$(printf "%.5f" $(( (i + 0.0) / N )))
    idx=$(printf "%03d" $i)
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
      --force-device-scale-factor=1 \
      --screenshot="$FRAMES/f$idx.png" \
      --window-size=$RENDER_PX,$RENDER_PX \
      "file://$SP/arena-icon.html?t=${t}&bg=$BG&size=$RENDER_PX" 2>/dev/null &
  done
  wait
done

echo "Encoding GIF -> $OUT.gif (supersample ${RENDER_PX}->${OUT_PX}, 24fps)..."
ffmpeg -y -framerate 24 -i "$FRAMES/f%03d.png" \
  -vf "scale=${OUT_PX}:${OUT_PX}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=200:stats_mode=full[p];[s1][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle" \
  -loop 0 "$SP/$OUT.gif" 2>/dev/null

SZ=$(ls -lh "$SP/$OUT.gif" | awk '{print $5}')
echo "Done: $SP/$OUT.gif ($SZ)"
