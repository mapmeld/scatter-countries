var transition_to_map, transition_to_chart;

// prepare for geo
var geopath = d3.geo.path();
var ctrlat, ctrlng, geoscale;

function x(d) { return d.properties.area }
function y(d) { return d.properties.population; }
function radius(d) { return 1; }
function color(d) { return setcolor[ d.properties.name ]; }

var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 75.5},
    width = 960 - margin.right,
    height = 600 - margin.top - margin.bottom;

// Various scales.
var xScale = d3.scale.log().domain([50000, 10000000]).range([0, width]),
    yScale = d3.scale.log().domain([400000, 1000000000]).range([height, 0]);

// The x & y axes.
var toyr = function(e){ console.log(e); return "" + e; };
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(8),
    yAxis = d3.svg.axis().scale(yScale).orient("left");

// Create the SVG container and set the origin.
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Add the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// Add an x-axis label.
svg.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height - 6)
    .text("land area (sq mi)");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("population");

// approximate centroid = average point
var centroid = function(poly, mytimer, time_end){
  var x = 0;
  var y = 0;
  if(poly.type == "Polygon"){
    var pts=poly.coordinates[0];
    for(var p=0;p<pts.length-1;p++){
      x += pts[p][0] * 1.0;
      y += pts[p][1] * 1.0;
    }
    x /= pts.length - 1;
    y /= pts.length - 1;
  }
  else{
    var polys=poly.coordinates;
    for(var e=0;e<polys.length;e++){
      var pts=polys[e][0];
      for(var p=0;p<pts.length-1;p++){
        x += pts[p][0] * 1.0;
        y += pts[p][1] * 1.0;
      }
      x /= pts.length - 1;
      y /= pts.length - 1;
    }
  }
  if(mytimer || time_end){
    return [ (x - ctrlng) * mytimer / time_end + ctrlng, (y - ctrlat) * mytimer / time_end + ctrlat ];
  }
  else{
    return [ x, y ];
  }
};

// Load the data.
d3.json("samerica.geojson", function(err, countries) {
  // calculate centroid and scale
  var minlat = 90;
  var maxlat = -90;
  var minlng = 180;
  var maxlng = -180;
  for(var t=0;t<countries.features.length;t++){
    var ctr = centroid(countries.features[t].geometry);
    minlat = Math.min(minlat, ctr[1]);
    maxlat = Math.max(maxlat, ctr[1]);
    minlng = Math.min(minlng, ctr[0]);
    maxlng = Math.max(maxlng, ctr[0]);
  }
  ctrlat = (minlat + maxlat) / 2;
  ctrlng = (minlng + maxlng) / 2;
  geoscale = 12000000 / (Math.max(maxlng - minlng, 1.5 * (maxlat - minlat)) / 0.01967949560602733);

  // load countries
  var countrygeos = svg.selectAll("svg")
    .data(countries.features).enter()
    .append("path")
    .attr("d", geopath.projection( d3.geo.mercator().scale(geoscale).center([ctrlng, ctrlat]) ) )
    .style("fill", function(d) { return color(d); })
    .style("stroke", "#fff");

  // center countries on their centroids
  for(var t=0;t<countrygeos[0].length;t++){
    d3.select(countrygeos[0][t]).attr("d", geopath.projection( d3.geo.mercator().scale(geoscale).center( centroid(countries.features[t].geometry) ) ) );
  }

  // Add a dot per country
  var dot = svg.append("g")
      .attr("class", "dots")
    .selectAll(".dot")
      .data(countries.features)
    .enter().append("circle")
      .attr("class", function(d) { return "dot d" + d.properties.name.replace(" ","").replace(" ","").replace(" ",""); })
      .style("fill", function(d) { return color(d); })
      .call(position);

  // move countries to their dots
  countrygeos.attr("transform", function(d) {
    var matchCircle = svg.select(".d" + d.properties.name.replace(" ","").replace(" ","").replace(" ","") );
    return "translate(" + (matchCircle.attr("cx") - 480) + "," + (matchCircle.attr("cy") - 250) + ")";
  });

  // Positions the dots based on data.
  function position(dot) {
    try{
      dot.attr("cx", function(d) { return xScale(x(d)); })
       .attr("cy", function(d) { return yScale(y(d)); })
       .attr("r", 3);
    }
    catch(e){
      // impossible cy
    }
  }
});