#! /bin/bash

# Not Projected
items=(
  cb_2017_us_county_500k
  cb_2017_06_zcta510_500k

  # cb_2017_06_cousub_500k
  # cb_2017_06_tract_500k
)
sourcedir="target-json"
targetdir="target-ndjson"
mkdir -p $targetdir
for d in "${items[@]}"; do
  echo "processing $d..."
  ndjson-split 'd.features' \
    < $sourcedir/$d.json \
    > $targetdir/$d.ndjson
done

csv_2_json=(
  zcta_tract_rel_10
  zcta_county_rel_10
)
for d in "${csv_2_json[@]}"; do
  echo "converting $d.json to ndjson"
  ndjson-cat $sourcedir/$d.json \
    | ndjson-split \
    | ndjson-filter 'd.STATE === "06"' \
    > $targetdir/$d-06.ndjson
done
