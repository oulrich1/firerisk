# 'source-data' acquired from CENSUS BUREAU
https://www.census.gov/programs-surveys/geography.html

also, the filenames are google-able

# 'common-data' is data shared within our team


# Then mostly following this tutorial to process data for d3 consumption
https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c

npm install -g shapefile
    shp2json
npm install -g d3-geo-projection
    geoproject
    geo2svg

# Preparing data to be stream processed via ndjson format (newline deliminated json)
npm install -g ndjson-cli
    ndjson-*

npm install -g d3
    
npm install -g topojson
    geo2topo
    toposimplify
    topoquantize
    topomerge
    topo2geo

npm install -g d3-scale-chromatic
    d3.schemeOrRd

npm install -g json2csv
npm install -g csv2json
    csv2json <json> <target>
    




