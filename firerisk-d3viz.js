const log = console.log;
log("Document Ready");

async function getData() {
  const ca_counties = "./target-topojson/cb_2017_06_county_500k.topojson";
  const ca_zipcodes = "./target-topojson/cb_2017_06_zcta510_500k-simple.topojson";
  //const zip2county = "./d3-data/zcta_county_rel_10.csv";
  const zip2county = "./target-json/zcta_county_rel_10-06.json";
  return await Promise.all([
    d3.json(ca_counties),
    d3.json(ca_zipcodes),
    d3.json(zip2county),
  ])
}

async function main() {
  const [ca_cou, ca_zips, glue] = await getData();


  /* These 'infos' maps are for tieing zips->counties */
  const zipInfos = d3.map();
  glue.features.forEach(d => {
    const arr = zipInfos.get(d.ZCTA5);
    if (!arr) {
      zipInfos.set(d.ZCTA5, [d]);
    } else {
      arr.push(d);
    }
  });

  const countyInfos = d3.map();
  ca_cou.objects.counties.geometries.forEach(d => {
    countyInfos.set(d.properties.COUNTYFP, d.properties);
  });

  const body = d3.select('body');
  const margin = {
    left: 20,
    right: 20,
    top: 40,
    bottom: 5,
  };

  const size = {
    width: Math.min(1200, window.innerWidth || document.body.clientWidth),
    height: Math.min(768, window.innerHeight || document.body.clientHeight),
  };
  const svg = body.append('svg')
    .attr('width', size.width)
    .attr('height', size.height);


  var projection = d3.geoMercator()
               .center([ -115.2, 37.5 ])
               .translate([ size.width/2, size.height/2 ])
               .scale([ size.width*3 ]);

  const map = svg.append('g')
    .attr("class", "map");

  /* These are for generating html for the Tooltips
    * when hovering over Zipcode and County(if no zip exists
    * at location in county) */
  const getCountyHTML = (d) => {
    const countyHTML = [ `County Name: ${d.properties.NAME}` ]
      .map(v => `<span class='tip-li'>${v}</span>`)
      .join('');
    return `<div class='tooltip'> ${countyHTML} </div>`;
  };
  const tipCounty = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-15, 0])
    .html(getCountyHTML);

  const getZipHTML = (d) => {
    let props = d.properties;
    const arr = zipInfos.get(props.ZCTA5CE10);
    let zipCode = arr[0].ZCTA5;
    let countyNames = arr
      .map(el => countyInfos.get(el.COUNTY).NAME)
      .join(', ');
    const zipHTML = [ `County Name(s): ${countyNames}`, `ZipCode: ${zipCode}`]
      .map(v => `<span class='tip-li'>${v}</span>`)
      .join('');
    return `<div class='tooltip'> ${zipHTML} </div>`;
  };

  const tipZip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-15, 0])
    .html(getZipHTML);

  /* This is where the data is drawn onto the SVG
   * TODO: i think we should consider drawing with CANVAS
   *       instead of SVG for performance reasons.
   * */
  const path = d3.geoPath().projection(projection);
  const counties = map.append("g")
      .attr("class", "counties");
  counties.call(tipCounty);
  counties.selectAll("path")
    .data(topojson.feature(ca_cou, ca_cou.objects.counties).features)
    .enter()
    .append("path")
      .attr('class', 'county-path')
      .attr('id', (d) => {
        return `${d.properties.COUNTYFP}`;
      })
      .attr("d", path)
      .on('mouseover', tipCounty.show)
      .on('mouseout', tipCounty.hide);


  const zipPath = d3.geoPath().projection(projection);
  const zipcodes = map.append("g")
      .attr("class", "zipcodes");
  zipcodes.call(tipZip);
  zipcodes.selectAll("path")
    .data(topojson.feature(ca_zips, ca_zips.objects.zipcodes).features)
    .enter()
    .append("path")
      .attr('class', 'zipcode-path')
      .attr("d", zipPath)
    .on('mouseover', tipZip.show)
    .on('mouseout', tipZip.hide);


  /* This enables ZOOM on the map:
    *  - scroll with mouse,
    *  - double click to zoom,
    *  - click and drag to PAN,
    *  - reset view with button */
  const zoom = d3.zoom();
  svg.call(zoom.on("zoom", () => {
      map.attr("transform", d3.event.transform);
    }));

  d3.select("button")
    .on("click", () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    });
}

main();
