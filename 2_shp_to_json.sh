#!/bin/bash

if [ "$1" == "clean" ]; then
    rm -rf ./target
    exit 0;
fi

dirs=(
#cb_2017_06_bg_500k
#cb_2017_06_county_within_ua_500k
cb_2017_06_cousub_500k
cb_2017_06_tract_500k
#cb_2017_06_elsd_500k
#cb_2017_06_place_500k
#cb_2017_06_puma10_500k
#cb_2017_06_scsd_500k
#cb_2017_06_sldl_500k
#cb_2017_06_sldu_500k
#cb_2017_06_tract_500k
#cb_2017_06_unsd_500k

#cb_2017_us_cbsa_500k
#cb_2017_us_cd115_500k
cb_2017_us_county_500k
#cb_2017_us_division_500k
#cb_2017_us_necta_500k
#cb_2017_us_region_500k
#cb_2017_us_state_500k
#cb_2017_us_ua10_500k

#cb_2017_us_zcta510_500k
)

sourcedir="d3-data"
targetdir="target-json"
mkdir -p "$targetdir"
for d in "${dirs[@]}"; do
  echo "processing $d..."
  shp2json $sourcedir/$d/$d.shp -o $targetdir/$d.json
done

# This was extracted from the larger zcta
moves=(
  cb_2017_06_zcta510_500k
)
for d in "${moves[@]}"; do
  echo "simply copying $d..."
  cp $sourcedir/$d/$d.json $targetdir/
done

csv_2_json=(
  zcta_tract_rel_10
  zcta_county_rel_10
)
for d in "${csv_2_json[@]}"; do
  echo "converting $d.csv to json"
  csv2json $sourcedir/$d.csv $targetdir/$d.json
done


