const log = console.log;
log("Document Ready");

function formatFireData(data) {
  return {
    fire_area_acres: +data.fire_area_acres,
    fire_contained_date: data.fire_contained_date,
    fire_name: data.fire_name,
    fire_start_date: data.fire_start_date,
    fire_year: +data.fire_year,
    postal_code: data.postal_code,
  }
}

async function getData() {
  const ca_counties = "./target-topojson/cb_2017_06_county_500k.topojson";
  const ca_zipcodes = "./target-topojson/cb_2017_06_zcta510_500k-simple.topojson";
  //const zip2county = "./d3-data/zcta_county_rel_10.csv";
  const zip2county = "./target-json/zcta_county_rel_10-06.json";
  const postcalcode2firedata = "./common-data/pass_2/ca_postalcode_fire_intersections_data.csv";
  // const openWeatherMapAPI = "https://samples.openweathermap.org/data/2.5/weather?zip=94040,us&appid=b6907d289e10d714a6e88b30761fae22";
  return await Promise.all([
    d3.json(ca_counties),
    d3.json(ca_zipcodes),
    d3.json(zip2county),
    d3.csv(postcalcode2firedata, formatFireData),
    // d3.json(openWeatherMapAPI, {crossOrigin: "anonymous", mode: 'no-cors'}),
  ])
}

async function main() {
  const [ca_cou, ca_zips, glue, fireHistory, weather] = await getData();
  const minYear = d3.min(fireHistory, row => row.fire_year);
  const maxYear = d3.max(fireHistory, row => row.fire_year);
  let curFireHistory = fireHistory.filter(row => +row.fire_year === +minYear);
  log(weather);

  // fire_area_acres: "584.888061523437"
  // fire_contained_date: "7/11/06"
  // fire_name: "MESQUITE"
  // fire_start_date: "7/9/06"
  // fire_year: "2006"
  // postal_code: "89019"

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

  const body = d3.select('body')
  // const margin = { left: 20, right: 20, top: 40, bottom: 5 };
  const size = {
    width: Math.min(480, window.innerWidth || document.body.clientWidth),
    height: Math.min(700, window.innerHeight || document.body.clientHeight),
  };
  const svg = body.append('svg')
    .attr('width', size.width)
    .attr('height', size.height);

  const zipCodeColorScale = d3.scaleLinear()
    .domain([0, curFireHistory.length])
    .range(['#f9f9e3', 'darkorange']);

  const map = svg.append('g')
    .attr("class", "map")
    .attr("id", "TheMap");

  const projection = d3.geoMercator()
    .center([-117, 37])
    .translate([size.width / 1.5, size.height / 2])
    .scale([size.width * 5]);

  drawCountyPaths();
  drawZipCodePaths();
  enableYearSlider()
  enableZoom(svg, map);

  // Title
  svg
    .append('text')
    .attr('x', size.width / 2)
    .attr('y', 30)
    .style('text-anchor', 'middle')
    .style('font-size', '2em')
    .classed('title', true)
    .text(`Fires in ${minYear}`);

  function enableZoom(svg, map) {
    /* This enables ZOOM on the map:
    *  - scroll with mouse,
    *  - double click to zoom,
    *  - click and drag to PAN,
    *  - reset view with button */
    const zoom = d3.zoom()
      .scaleExtent([1, 5])
    svg.call(zoom.on("zoom", () => {
      map.attr("transform", d3.event.transform);
    }));
    d3.select("#reset-zoom")
      .on("click", () => {
        svg.transition()
          .duration(100)
          .call(zoom.transform, d3.zoomIdentity);
      });
  }

  function enableYearSlider() {
    const sliderID = "#year-selection";
    d3.select(sliderID)
      .property("min", minYear)
      .property("max", maxYear)
      .property("value", minYear);
    d3.select(sliderID)
      .on("input", function () {
        var year = +d3.event.target.value;
        svg.select('.title')
          .text(`Fires in ${year}`)
        curFireHistory = fireHistory.filter(row => +row.fire_year === year);
        d3.select('.zipcodes')
          .selectAll("path")
          .transition()
          .attr('fill', d => {
            const code = d.properties.ZCTA5CE10;
            const fires = curFireHistory.filter(row => row.postal_code === code);
            return zipCodeColorScale(fires.length);
          });
      });
  }

  function drawCountyPaths() {
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

    // TODO: i wonder if drawing with canvas or using
    //       map tiles will be better performant
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
  }

  function drawZipCodePaths() {
    const getZipHTML = (d) => {
      let props = d.properties;
      const arr = zipInfos.get(props.ZCTA5CE10);
      let zipCode = arr[0].ZCTA5;
      let countyNames = arr
        .map(el => countyInfos.get(el.COUNTY).NAME)
        .join(', ');
      const history = curFireHistory.filter(row => row.postal_code === zipCode);
      const zipHTML = [
          `County Name(s): ${countyNames}`,
          `ZipCode: ${zipCode}`,
          `# Fires: ${history.length} / ${curFireHistory.length}`]
        .map(v => `<span class='tip-li'>${v}</span>`)
        .join('');
      return `<div class='tooltip'> ${zipHTML} </div>`;
    };

    const tipZip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-15, 0])
      .html(getZipHTML);

    const zipData = topojson.feature(ca_zips, ca_zips.objects.zipcodes).features;
    const zipPath = d3.geoPath().projection(projection);
    const zipcodes = map.append("g")
        .attr("class", "zipcodes");
    zipcodes.call(tipZip);
    zipcodes.selectAll("path")
      .data(zipData)
      .enter()
      .append("path")
        .attr('class', 'zipcode-path')
        .attr("d", zipPath)
        .attr('fill', d => {
          const code = d.properties.ZCTA5CE10;
          const fires = curFireHistory.filter(row => row.postal_code === code);
          return zipCodeColorScale(fires.length);
        })
      .on('mouseover', tipZip.show)
      .on('mouseout', tipZip.hide);
  }
}

main();



// TODO: use tilemap for better performance, possibly..
//   // Alternatively using the leaflet zoom controls
//   var mymap = L.map('mapid').setView([51.505, -0.09], 13);
//   L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
//       attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
//       maxZoom: 18,
//       id: 'mapbox.streets',
//       accessToken: 'pk.eyJ1Ijoib3VscmljaDYiLCJhIjoiY2p0cmMwazR2MGZ0azQ1cGltNjNmb24waSJ9.uedEyuYU6dY5swCG9OHZTg'
//   }).addTo(mymap);
