#!/bin/bash

dirs=(
  cb_2017_06_cousub_500k
  cb_2017_us_county_500k
  cb_2017_06_tract_500k
  cb_2017_06_zcta510_500k
)

sourcedir="target-json"
targetdir="target-json"
mkdir -p "$targetdir"
for d in "${dirs[@]}"; do
  echo "processing $d..."
  geoproject 'd3.geoConicEqualArea().parallels([34, 40.5]).rotate([120, 0]).fitSize([960, 960], d)' \
    < ./$sourcedir/$d.json \
    > ./$targetdir/$d-albers.json
  geo2svg -w 960 -h 960 < ./$targetdir/$d-albers.json > ./$targetdir/$d-albers.svg
done


