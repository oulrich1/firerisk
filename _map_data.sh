#! /bin/bash

sourcedir="target-joins"
targetdir="target-mapped"
mkdir -p $targetdir
ndjson-map \
  'd[0]' \
  < $sourcedir/county_join_tracts.ndjson \
  > $targetdir/county_tracts.ndjson
