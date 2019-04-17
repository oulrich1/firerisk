#! /bin/bash

items=(
  cb_2017_06_cousub_500k-albers
  cb_2017_us_county_500k-albers
  cb_2017_06_tract_500k-albers
)
sourcedir="target-ndjson"
targetdir="target-ndjson"
# "GEOID":  "0607992860"
for d in "${items[@]}"; do
  echo "processing $d..."
  ndjson-map 'd.id = d.properties.GEOID.slice(2), d' \
    < $sourcedir/$d.ndjson \
    > $targetdir/$d-id.ndjson
done

special=(
  cb_2017_06_zcta510_500k-albers
)
# "GEOID10":"0694601"
for d in "${special[@]}"; do
  echo "processing $d..."
  ndjson-map 'd.id = d.properties.GEOID10.slice(2), d' \
    < $sourcedir/$d.ndjson \
    > $targetdir/$d-id.ndjson
done
