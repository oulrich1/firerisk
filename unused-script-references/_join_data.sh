#! /bin/bash

sourcedir="target-ndjson"
targetdir="target-joins"
mkdir -p $targetdir

ndjson-join 'd.properties.ZCTA5CE10' 'd.ZCTA5' \
  $sourcedir/cb_2017_06_zcta510_500k-albers.ndjson \
  $sourcedir/zcta_tract_rel_10-06.ndjson \
  > $sourcedir/zcta_join.ndjson

ndjson-join 'd[1].COUNTY' 'd.properties.COUNTYFP' \
  $sourcedir/zcta_join.ndjson \
  $sourcedir/cb_2017_06_county_500k-albers.ndjson \
  > $targetdir/zcta_join_county.ndjson

# final format, rows:
# [[zipcode, zip_to_county], county]
# There is a LOT of redundancy
