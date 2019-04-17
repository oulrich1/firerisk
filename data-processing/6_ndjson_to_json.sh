#! /bin/bash

ndjson_2_json=(
  cb_2017_06_county_500k
  zcta_county_rel_10-06
)
sourcedir="target-ndjson"
targetdir="target-json"
for d in "${ndjson_2_json[@]}"; do
  echo "converting $d.ndjson to json"
  ndjson-reduce 'p.features.push(d), p' '{type: "FeatureCollection", features: []}' \
    < $sourcedir/$d.ndjson \
    > $targetdir/$d.json
done
