#! /bin/bash

sourcedir="target-ndjson"
targetdir="target-topojson"
mkdir -p $targetdir

basename="cb_2017_06_county_500k"
src="$sourcedir/$basename.ndjson"
tgt="$targetdir/$basename.topojson"
simple_tgt="$targetdir/$basename-simple.topojson"
quanti_tgt="$targetdir/$basename-quantized.topojson"
geo2topo -n  counties=$src > $tgt
toposimplify -p 1 -f < $tgt > $simple_tgt
topoquantize 1e5 < $simple_tgt > $quanti_tgt

basename="cb_2017_06_zcta510_500k"
src="$sourcedir/$basename.ndjson"
tgt="$targetdir/$basename.topojson"
simple_tgt="$targetdir/$basename-simple.topojson"
quanti_tgt="$targetdir/$basename-quantized.topojson"
geo2topo -n zipcodes=$src > $tgt
topoquantize 1e5 < $tgt > $quanti_tgt

