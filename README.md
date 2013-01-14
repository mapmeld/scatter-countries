# Scatter-Countries

Scatter-Countries uses D3.js to turn a GeoJSON file into a scatter plot of countries.

## Examples

<h3><a href="http://mapmeld.github.com/scatter-countries/index.html">Scatter Plot (Nations)</a></h3>

<img src="https://raw.github.com/mapmeld/scatter-countries/gh-pages/screen.png"/>

<h3><a href="http://mapmeld.github.com/scatter-countries/scatterstates.html">Scatter Plot (Independently-Scaled US States)</a></h3>

<img src="https://raw.github.com/mapmeld/scatter-countries/gh-pages/scaledstates.png"/>

<h3><a href="http://mapmeld.github.com/scatter-countries/population.html">Scatter Plot (Population)</a></h3>


The data in these demos are a subset of https://github.com/johan/world.geo.json

## How does it work?

D3 reads data from a GeoJSON file to load the countries and the underlying data

    d3.json("samerica.geojson", function(err, countries) {
       ...
    });

The axes and scale of the scatter plot, color codes, and other details are written in JavaScript.

The GeoJSON has the name of each country. Creating and positioning a dot for each country:

    var dot = svg.append("g")
      .attr("class", "dots")
      .selectAll(".dot")
      .data(parcels.features)
      .enter()
      .append("circle")
        .attr("class", function(d) { return "dot d" + replaceAll(d.properties.name, " ", ""); })
        .style("fill", function(d) { return color(d); })
        .call(position);

To snap the countries to their dots, you run this code to re-center and translate them

    // center countries on their centroids
    for(var t=0;t<countrygeos[0].length;t++){
      d3.select(countrygeos[0][t]).attr("d", geopath.projection( d3.geo.mercator().scale(geoscale).center( centroid(countries.features[t].geometry) ) ) );
    }

    // move countries to their dots
    countrygeos.attr("transform", function(d) {
      var matchCircle = svg.select(".d" + replaceAll(d.properties.name, " ", "") );
      return "translate(" + (matchCircle.attr("cx") - 480) + "," + (matchCircle.attr("cy") - 250) + ")";
    });

## License

Scatter-Countries is available under an open source MIT License

It is based on Mike Bostock's "Nations" scatter plot from https://github.com/mbostock/bost.ocks.org/blob/gh-pages/mike/nations/index.html
