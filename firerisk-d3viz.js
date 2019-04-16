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

function formatLandCoverageData(data) {
  return {
    year: +data.year,
    postal_code: data.postal_code,
    elevation: +data.elevation,
    forest: +data.forest,
    urban: +data.urban,
    other: +data.other,
    years_till_next_fire: +data.years_till_next_fire,
  };
}

async function getData() {
  const ca_counties = "./target-topojson/cb_2017_06_county_500k.topojson";
  const ca_zipcodes = "./target-topojson/cb_2017_06_zcta510_500k-simple.topojson";
  //const zip2county = "./d3-data/zcta_county_rel_10.csv";
  const zip2county = "./target-json/zcta_county_rel_10-06.json";
  const postcalcode2firedata = "./common-data/pass_2/ca_postalcode_fire_intersections_data.csv";
  const listOfZipsWithNoFires = "./common-data/pass_2/postal_codes_no_fires_last_20_years.txt";
  const postcalcode2landcoverage = "./common-data/pass_2/postal_code_fire_yearly_landcoverage.csv";
  return await Promise.all([
    d3.json(ca_counties),
    d3.json(ca_zipcodes),
    d3.json(zip2county),
    d3.csv(postcalcode2firedata, formatFireData),
    d3.json(listOfZipsWithNoFires),
    d3.csv(postcalcode2landcoverage, formatLandCoverageData),
  ])
}

function predictYearsUntilNextFire(variables, coefficients) {
  const [elevation, forest, urban, other] = variables;
  const [b, e, f, u, o] =
      coefficients || [4.72102069, -.0000437228105, -0.935146471, 3.26084516, -2.352569869];
  const year = b
      + (e*elevation)
      + (f*forest)
      + (u*urban)
      + (o*other)
  return year;
}

function getWeatherData(zipCode) {
  const proxyServer = "https://cors-anywhere.herokuapp.com/";
  // TODO: move this into a private config...
  const apiKey = "fa3197b32718f839f0a33d152abaa6a5";
  const unit = 'imperial'; // metric
  const openWeatherMapAPI = `https://api.openweathermap.org/data/2.5/weather?zip=${zipCode},us&appid=${apiKey}&units=${unit}`;
  const url = `${proxyServer}${openWeatherMapAPI}`;
  return d3.json(url);
}

function updateZipCodeDetails(data) {
  let title = 'Fire Prediction for ZipCode';
  if (data.zipCode) {
    title += ` ${data.zipCode}`;
  } else {
    title += ` (Unselected)`;
  }
  d3.select('#zipcode-details-title').text(title);
  d3.select("#fireCount").text(data.fireCount !== undefined ? data.fireCount : 'Unknown');

  updateFireInYears(data);
}

function updateFireInYears(data) {
  function fireInYearsText() {
    if (data.fireInYears !== undefined) {
      if (data.neverHadFire || data.fireInYears >= 20)
        return '20+';
      return `${data.fireInYears.toFixed(1)}`;
    }
    return 'Unknown';
  }

  const text = fireInYearsText();
  d3.select("#fireInYears").text(text);
  if (text !== 'Unknown') {
    const fireInYearsColorScale = d3.scaleLinear()
      .domain([1, 5])
      .range(['#fc8d59', '#91cf60']);
    d3.select("#fireInYearsFlag")
      .style('background-color', text !== '20+' ? fireInYearsColorScale(data.fireInYears) : 'lightgreen')
      .style('width', '10px')
      .style('height', '10px')
      .style('opacity', 1);
  } else {
    d3.select("#fireInYearsFlag")
      .style('opacity', 0);
  }
}

function updateLandcoverDetails(row) {
  function valueOrUnknown(maybeValue, transformIfValue) {
    if (maybeValue !== undefined) {
      let definitelyValue = maybeValue;
      if (transformIfValue) {
        definitelyValue = transformIfValue(definitelyValue);
      }
      return definitelyValue;
    }
    return 'Unknown';
  }
  function toPercentage(maybeValue) {
    return valueOrUnknown(maybeValue, d => Math.round(d * 100));
  }
  d3.select("#elevation").text(valueOrUnknown(row.elevation));

  d3.select("#forest").text(toPercentage(row.forest));
  d3.select('#forest-selection').property('value', row.forest * 100 || 0);

  d3.select("#urban").text(toPercentage(row.urban));
  d3.select('#urban-selection').property('value', row.urban * 100 || 0);

  d3.select("#other").text(toPercentage(row.other));
  d3.select('#other-selection').property('value', row.other * 100 || 0);
}

async function main() {
  const [ca_cou, ca_zips, glue, fireHistory, noFires, landCoverage] = await getData();
  const minYear = d3.min(fireHistory, row => row.fire_year);
  const maxYear = 2017;// d3.max(fireHistory, row => row.fire_year);
  let currentYear = maxYear;
  let curFireHistory = fireHistory.filter(row => +row.fire_year === +currentYear);
  let curPostalCode = undefined;

  updateZipCodeDetails({});
  updateLandcoverDetails({});

  function neverHadFire() {
    return noFires.filter(zip => `${zip}` === curPostalCode).length > 0;
  }

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
    width: Math.min(680, window.innerWidth || document.body.clientWidth),
    height: Math.min(720, window.innerHeight || document.body.clientHeight),
  };
  const svg = body.select('#map-container')
    .attr('width', size.width)
    .attr('height', size.height);

  let zipCodeColorScale = d3.scaleSqrt()
    .domain([0, 6])
    .range(['#f9f9e3', 'darkorange']);

  const map = svg.append('g');

  const projection = d3.geoMercator()
    .center([-117, 37.5])
    .translate([size.width / 1.5, size.height / 2])
    .scale([size.width * 5]);

  drawCountyPaths();
  drawZipCodePaths();
  enableYearSlider()
  enableZoom(svg, map);

  // Title
  svg
    .append('text')
    .attr('x', size.width / 1.7)
    .attr('y', 20)
    .style('text-anchor', 'middle')
    .style('font-size', '2em')
    .style('font-weight', 'bold')
    .classed('title', true)
    .text(`Fires in ${currentYear}`);

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
      .property("value", currentYear);
    d3.select(sliderID)
      .on("input", function () {
        currentYear = +d3.event.target.value;
        svg.select('.title')
          .text(`Fires in ${currentYear}`)
        curFireHistory = fireHistory.filter(row => +row.fire_year === currentYear);
        d3.select('.zipcodes')
          .selectAll("path")
          .transition()
          .attr('fill', d => {
            const code = d.properties.ZCTA5CE10;
            const fires = curFireHistory.filter(row => row.postal_code === code);
            return zipCodeColorScale(fires.length);
          });
      })
      .on('change', function() {
        updateDetails(curPostalCode);
      })
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
      .on('mouseover', d => {
          return tipZip.show(d)
      })
      .on('mouseout', tipZip.hide)
      .on('click', async function(d) {
        delete modifedLandCoverage[curPostalCode];
        curPostalCode = d.properties.ZCTA5CE10;
        updateDetails();
        updateHistSVG();
      });
  }

  function getCurLandCoverage() {
    return landCoverage.filter(
      row => +row.year === +currentYear &&
      row.postal_code === curPostalCode);
  }

  let modifedLandCoverage = {}; // by zipcode

  function updateLandcoverSpecifically(key, value) {
      const curLandCoverage = getCurLandCoverage();
      if (curLandCoverage.length) {
        if (!modifedLandCoverage[curPostalCode]) {
          modifedLandCoverage[curPostalCode] = Object.assign({}, curLandCoverage[0]);
        }
        const row = modifedLandCoverage[curPostalCode];
        row[key] = value;

        // Adjusts landcover percentages to add to 1
        const otherKeys = ['forest', 'urban', 'other'].filter(k => k !== key);
        const total = ['forest', 'urban', 'other'].reduce((p, k) => p + row[k], 0);
        const diff = 1 - total;
        otherKeys.forEach(k => {
          row[k] += diff / otherKeys.length;
          row[k] = Math.max(Math.min(row[k], 1), 0);
        });

        updateLandcoverDetails(row);
        const yearsUntilFire = predictYearsUntilNextFire([
          row.elevation,
          row.forest,
          row.urban,
          row.other
        ]);

        updateFireInYears({
          fireInYears: yearsUntilFire,
          neverHadFire: neverHadFire()
        });
      }
  }

  d3.select('#forest-selection')
    .on('input', () => {
      const value = +d3.event.target.value;
      updateLandcoverSpecifically('forest', value/100, ['urban', 'other']);
    });
  d3.select('#urban-selection')
    .on('input', () => {
      const value = +d3.event.target.value;
      updateLandcoverSpecifically('urban', value/100, ['forest', 'other']);
    });
  d3.select('#other-selection')
    .on('input', () => {
      const value = +d3.event.target.value;
      updateLandcoverSpecifically('other', value/100, ['forest', 'urban']);
    });

  function updateDetails() {
    const curLandCoverage = getCurLandCoverage();
    // the land coverage data starts at 1997 and the last year is 2018.
    // so we can't make any predictions, without that data.
    let yearsUntilFire = undefined;
    if (curLandCoverage.length) {
      const row = curLandCoverage[0];
      updateLandcoverDetails(row);
      yearsUntilFire = predictYearsUntilNextFire([
        row.elevation,
        row.forest,
        row.urban,
        row.other
      ]);
    } else {
      updateLandcoverDetails({});
    }

    const fires = curFireHistory.filter(row => row.postal_code === curPostalCode);
    updateZipCodeDetails({
      zipCode: curPostalCode,
      fireCount: fires.length,
      fireInYears: yearsUntilFire,
      neverHadFire: neverHadFire(),
    });

    if (curPostalCode) {
      getWeatherData(curPostalCode).then(weather => {
        const curLandCoverage = getCurLandCoverage();        
        if (!curLandCoverage.length) return;
        const elevation = curLandCoverage[0].elevation;

        const rain_volume = weather.rain && weather.rain["1h"] || 0;
        d3.select('#precipitation').text(rain_volume);
        d3.select('#min-temp').text(weather.main.temp_min);
        d3.select('#max-temp').text(weather.main.temp_max);

        // TODO: use this to predict probabilty of fire TODAY
        function predictTodayFireProb(elevation, vol, minTemp, maxTemp) {
          return undefined;
        }

        const prob = predictTodayFireProb(
          elevation,
          rain_volume,
          weather.main.temp_min,
          weather.main.temp_max);
        d3.select('#fireTodayProb').text(prob !== undefined ? prob : "Unknown");
      }).catch(err => {
        log(`ERROR: ${err}`);
      });
    }
  }


  function updateHistSVG() {
    // curPostalCode, currentYear
    const fires = fireHistory.filter(row => row.postal_code === curPostalCode); 

    const width = 375;
    const height = 250;
    const padding = 40;
    const histSVG = body.select('#histogram-svg')
      .attr('width', width)
      .attr('height', height);

    const title = histSVG
      .selectAll('.title')
      .data([curPostalCode]);
    title.exit().remove();
    const newTitle = title
      .enter()
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .style('text-anchor', 'middle')
      .style('font-size', '2em')
      .classed('title', true);
    newTitle.merge(title)
      .text(`Fire Frequency per Year at '${curPostalCode}'`);

    const xScale = d3.scaleLinear()
      .domain([minYear, maxYear])
      .range([padding, width-padding])

    const optimalTicks = xScale.ticks();

    const hist = d3.histogram()
      .domain(xScale.domain())
      .thresholds(optimalTicks)
      .value(d => d.fire_year);

    const bins = hist(fires);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length)])
      .range([height-padding, padding]);

    const bars = histSVG
      .selectAll('.bar')
      .data(bins);
  
    bars.exit().remove();
  
    const g = bars.enter()
      .append('g')
      .classed('bar', true);
  
    g.append('rect');
    g.merge(bars)
      .select('rect')
      .transition()
        .attr('x', d => xScale(d.x0))
        .attr('y', d => yScale(d.length))
        .attr('height', d => height - yScale(d.length) - padding)
        .attr('width', d => {
            const width = xScale(d.x1) - xScale(d.x0) - 1;
            return width < 0 ? 0 : width;
        })
        .attr('fill', 'darkorange')

    const xAxis = d3.axisBottom(xScale)
      .tickSizeOuter(0)
      .tickFormat((d,i,vals) => {
        if (i === 0 || i == vals.length-1) {
          return d;
        }
        return `${d}`.slice(2);
      })
    const yAxis = d3.axisLeft(yScale)
      .tickSize(-width + 2 * padding)
      .tickSizeOuter(0)
    histSVG.select('.xAxis').remove();
    histSVG.append('g')
      .classed('xAxis', true)
      .attr('transform', `translate(0, ${height-padding})`)
      .call(xAxis);
    histSVG.select('.yAxis').remove();
    histSVG.append('g')
      .classed('yAxis', true)
      .style("stroke-dasharray", "5 3")
      .attr('transform', `translate(${padding}, 0)`)
      .call(yAxis);
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
