var transition_to_map, transition_to_chart;

// prepare for geo
var geopath = d3.geo.path();
var ctrlat, ctrlng, geoscale;

var letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
function x(d) { return letters.indexOf(d.properties.name[0]) + 1 }
function y(d) { return d.properties.name.length; }
function radius(d) { return 1; }
function color(d) { return d.properties.color; }

var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 75.5},
    width = 960 - margin.right,
    height = 600 - margin.top - margin.bottom;

// Various scales.
var xScale = d3.scale.linear().domain([-3, 26]).range([0, width]),
    yScale = d3.scale.linear().domain([3, 15]).range([height, 0]);

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
    .text("order of first letter");

// Add a y-axis label.
svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("letters in name");

// approximate centroid = average point
var centroidAndSpan = function(poly){
  var x = 0;
  var y = 0;
  var maxlat = -90;
  var minlat = 90;
  var maxlng = -180;
  var minlng = 180;
  if(poly.type == "Polygon"){
    var pts=poly.coordinates[0];
    for(var p=0;p<pts.length-1;p++){
      x += pts[p][0] * 1.0;
      y += pts[p][1] * 1.0;
      maxlat = Math.max(maxlat, y);
      minlat = Math.min(minlat, y);
      maxlng = Math.max(maxlng, x);
      minlng = Math.min(minlng, x);
    }
    x /= pts.length - 1;
    y /= pts.length - 1;
  }
  else{
    var ptcount = 0;
    var polys=poly.coordinates;
    for(var e=0;e<polys.length;e++){
      var pts=polys[e][0];
      ptcount += pts.length;
      for(var p=0;p<pts.length-1;p++){
        x += pts[p][0] * 1.0;
        y += pts[p][1] * 1.0;
        maxlat = Math.max(maxlat, y);
        minlat = Math.min(minlat, y);
        maxlng = Math.max(maxlng, x);
        minlng = Math.min(minlng, x);
      }
    }
    x /= ptcount - 1;
    y /= ptcount - 1;
  }
  return [[ x, y ], Math.max( maxlat - minlat, maxlng - minlng )];
};

// Load the data.
d3.json("usa.geojson", function(err, countries) {

  // calculate centroid and scale
  var minspan = null;
  var maxspan = null;
  for(var t=0;t<countries.features.length;t++){
    var ctr = centroidAndSpan(countries.features[t].geometry);
    countries.features[t].properties.centroid = ctr[0];
    countries.features[t].properties.span = ctr[1];
    countries.features[t].properties.color = "rgb(" + parseInt( Math.random() * 256 ) + "," + parseInt( Math.random() * 256 ) + "," + parseInt( Math.random() * 256 ) + ")";
    if(!minspan && !maxspan){
      minspan = ctr[1];
      maxspan = ctr[1];
    }
    else{
      maxspan = Math.max(maxspan, ctr[1]);
      minspan = Math.min(minspan, ctr[1]);
    }
  }
  geoscale = 100000;

  // load states
  var countrygeos = svg.selectAll("svg")
    .data(countries.features).enter()
    .append("path")
    .attr("d", geopath.projection( d3.geo.mercator().scale(geoscale).center([0,0]) ) )
    .style("fill", function(d) { return color(d); })
    .style("stroke", "#fff");

  // center states and scale them
  for(var t=0;t<countrygeos[0].length;t++){
    geoscale = 40000 / Math.pow(countries.features[t].properties.span, 0.3);
    d3.select(countrygeos[0][t]).attr("d", geopath.projection( d3.geo.mercator().scale(geoscale).center( centroidAndSpan(countries.features[t].geometry)[0] ) ) );
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