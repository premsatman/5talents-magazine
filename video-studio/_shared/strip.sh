#!/bin/bash
# Contact strip of the source segment: START seconds, DUR seconds, FPS samples/sec, 10 per row.
# usage: bash ../_shared/strip.sh START DUR FPS OUT.jpg   (tile i = START + i/FPS)
S=$1; D=$2; F=$3; O=$4
N=$(echo "($D*$F+9)/10" | bc)
ffmpeg -v error -y -ss "$S" -t "$D" -i assets/footage/seg.mp4 -vf "fps=$F,scale=192:-1,tile=10x$N:padding=3:color=red" -frames:v 1 "$O"
