#!/bin/bash
# List hard scene changes in a short's source segment (seconds), to time layout switches.
# usage: bash ../_shared/scenes.sh [threshold]   (run inside a short's project folder)
T=${1:-0.25}
ffmpeg -v info -i assets/footage/seg.mp4 -vf "select='gt(scene,$T)',showinfo" -an -f null - 2>&1 \
  | grep -o 'pts_time:[0-9.]*' | cut -d: -f2 | awk '{printf "%.2f  ", $1} END {print ""}'
