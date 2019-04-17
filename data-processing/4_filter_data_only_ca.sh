#! /bin/bash

sourcedir="target-ndjson"
targetdir="target-ndjson"
mkdir -p $targetdir
ndjson-filter \
  'd.properties.STATEFP === "06"' \
  < $sourcedir/cb_2017_us_county_500k.ndjson \
  > $targetdir/cb_2017_06_county_500k.ndjson

