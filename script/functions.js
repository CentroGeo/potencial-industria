// Setup stuff for the bar chart

var idToName = {
    1 : "Noreste",
    2 : "Centro-Occidente",
    3 : "Megalopolis",
    4 : "Noroeste",
    5 : "Golfo Oriente",
    6 : "Centro Norte",
    7 : "Peninsula"
};
//r update_axes;

var svgBar = d3.select("#barChart"),
    margin = {top: 100, right: 30, bottom: 30, left: 45},
    width = +svgBar.attr("width") - margin.left - margin.right,
    height = +svgBar.attr("height") - margin.top - margin.bottom;


var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1),
    y = d3.scaleLinear().rangeRound([height - margin.top, 0]);

var xAxis = d3.axisTop()
    .tickSizeInner(0) // the inner ticks will be of size 0
    .tickSizeOuter(0)
    .scale(x);

var yAxis = d3.axisLeft()
    .tickSizeOuter(0)
    .scale(y);


var gBar = svgBar.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Set basic functions for styling the map
var rateById = d3.map(); // will hold the map from ids to property values
var colors5 = ['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']; // 5 color scheme
var quantile = d3.scaleQuantile() 
    .range(d3.range(5).map(function(i) { return colors5[i]; })); // quantile scale with 5 classes

// map and base layer
var map = L.map('mapdiv', {attributionControl: false}).setView([23.75, -101.9], 5);
L.control.attribution({position: 'bottomleft'}).addTo(map);

var overlay = new L.map('overlaydiv', {
    zoomControl: false,
   // inertia: false,
    keyboard: false,
//    dragging: false,
    scrollWheelZoom: false,
    attributionControl:false,
    zoomAnimation:false
}).setView([23.75, -101.9], 5);

var mapBase = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(map);

var overlayBase = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(overlay);

map.sync(overlay, {offsetFn: offsetGlobal});

function offsetGlobal (center, zoom, refMap, tgtMap) {
    var refC = refMap.getContainer();
    var tgtC = tgtMap.getContainer();
    var pt = refMap.project(center, zoom)
                   .subtract([refC.offsetLeft, refC.offsetTop])
                   .subtract(refMap.getSize().divideBy(2))
                   .add([tgtC.offsetLeft, tgtC.offsetTop])
                   .add(tgtMap.getSize().divideBy(2));
    return refMap.unproject(pt, zoom);
}

// Load json data
var properties; // properties for each city
var averages; // store average values
var imcoAvgsRadar;
var varsImco;
var q = d3.queue();
q.defer(d3.json, "data/regiones.geojson")
    .defer(d3.json, "data/ciudades.geojson")
    .defer(d3.csv, "data/variables-potencial-industrial.csv")
    .await(function(error, regiones, ciudades, variables) {
        if (error) {
            console.error('Oh dear, something went wrong: ' + error);
        }
        else {
            ciudades.features.forEach(function(e) {
                // Populate the map
                rateById.set(e.properties.id, +e.properties.grado_total);
            });
            properties = []
            ciudades.features.forEach(function(e) {
                // Populate the map
                var dict = {};
                dict.id = e.properties.id;
                dict.nombre = e.properties.nom_ciudad;
                dict.grado_carretera = e.properties.grado_carretera;
                dict.grado_ferrocarril = e.properties.grado_ferrocarril;
                dict.grado_total = e.properties.grado_total;
                dict.zona = e.properties.zona;
                properties.push(dict);
            });
            avgCarr = d3.mean(properties,function(d) {
                    return d.grado_carretera;
            });
            avgFerr = d3.mean(properties,function(d) {
                    return d.grado_ferrocarril;
            });
            averages = {
                "id": -1,
                "nombre": "Promedio Nacional",
                "grado_carretera": avgCarr,
                "grado_ferrocarril": avgFerr,
                "grado_total": avgCarr + avgFerr,
                "zona": "Nacional"
            };
            
            var imcoAvgs = {
                "sis_dere": d3.mean(variables,function(d) {
                    return d.sis_dere;
                }),
                "man_ambi": d3.mean(variables,function(d) {
                    return d.man_ambi;
                }),
                "soc_incl": d3.mean(variables,function(d) {
                    return d.soc_incl;
                }),
                "sis_poli": d3.mean(variables,function(d) {
                    return d.sis_poli;
                }),
                "gob_efic": d3.mean(variables,function(d) {
                    return d.gob_efic;
                }),
                "merc_fac": d3.mean(variables,function(d) {
                    return d.merc_fac;
                }),
                "eco_esta": d3.mean(variables,function(d) {
                    return d.eco_esta;
                }),
                "precur": d3.mean(variables,function(d) {
                    return d.precur;
                }),
                "rela_inte": d3.mean(variables,function(d) {
                    return d.rela_inte;
                }),
                "inno_eco": d3.mean(variables,function(d) {
                    return d.inno_eco;
                })  
            };
            
            imcoAvgsRadar = [
                {
                    "name": "National Average",
                    "axes": [
                        {"axis": "sis_dere", "value":imcoAvgs.sis_dere},
                        {"axis": "man_ambi", "value":imcoAvgs.man_ambi},
                        {"axis": "soc_incl", "value":imcoAvgs.soc_incl},
                        {"axis": "gob_efic", "value":imcoAvgs.gob_efic},
                        {"axis": "merc_fac", "value":imcoAvgs.merc_fac},
                        {"axis": "eco_esta", "value":imcoAvgs.eco_esta},
                        {"axis": "precur", "value":imcoAvgs.precur},
                        {"axis": "rela_inte", "value":imcoAvgs.rela_inte},
                        {"axis": "inno_eco", "value":imcoAvgs.inno_eco},
                        {"axis": "sis_poli", "value":imcoAvgs.sis_poli}
                        
                    ]
                }
            ];
            varsImco = variables;
            //console.log(imcoAvgs);
            makeMap(regiones, ciudades);
            initChart();
	    var radarChartOptions = {
	        w: 290,
	        h: 300,
                maxValue: 100,
	        margin: { top: 10, right: 20, bottom: 10, left: 20 },
	        levels: 5,
	        roundStrokes: true,
	        color: d3.scaleOrdinal().range(d3.schemeCategory20),
	        format: '.0f',
                opacityArea: 0.1
	    };

	    // Draw the chart, get a reference the created svg element :
	    var svgRadar = RadarChart("#radarChart", imcoAvgsRadar, radarChartOptions);
        }
    });

var currentRegion = 0,
    lastClickedLayer = null,
    regionesLyr,
    ciudadesLyr;

function makeMap(regiones, ciudades){  
    quantile.domain(rateById.values())
    ciudadesLyr = L.geoJSON([ciudades], {
        style: function(feature){
            return {
                weight: 0.5,
                color: "#999",
                opacity: 1,
                fillColor: quantile(rateById.get(feature.properties.id)),
                fillOpacity: 0.8  
            };
        },
        interactive: false
    }).addTo(map);

    regionesLyr = L.geoJSON([regiones], {
        style: {weight: 2,
                color: "#604f83",
                opacity: 1,
                fillColor: "#604f83",
                fillOpacity: 0.3,
                className: 'regionStyle'
               },
        onEachFeature: onEachFeatureRegiones
    }).addTo(map);      
};

function onEachFeatureRegiones(feature, layer){
    // assign bounding box to each feature
    feature.properties.bounds_calculated = layer.getBounds();
    // assign a property to each feature to check if it's clicked
    feature.properties.is_clicked = false;
    // assign each layer an id that makes sense
    layer._leaflet_id = feature.properties.id_0;
    layer.on('click', layerClick);
}

function layerClick(event){
    layer = event.target;
    feature = layer.feature;
    noStyle = {weight: 1,
                color: "#AAAAAA",
                opacity: 0.1,
                fillColor: "#AAAAAA",
                fillOpacity: 0.1,
                className: 'regionStyle'
               };
    if (feature.properties.is_clicked == false){ // feature not clicked, so zoom in
        if (lastClickedLayer){ // when a region is clicked and you click another, reset previous one
            //regionesLyr.resetStyle(lastClickedLayer);
            lastClickedLayer.feature.properties.is_clicked = false;
            $(lastClickedLayer.getElement()).removeClass("regionZoomed");
            $(lastClickedLayer.getElement()).addClass("regionStyle");
        }
        lastClickedLayer = layer;
        currentRegion = feature.properties.id_0;
        ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);})
        ciudadesLyr.eachLayer(function(l){
            if (l.feature.properties.zona != idToName[currentRegion]){
                l.setStyle(noStyle);
            } 
        });
        if (currentRegion == 1){ // if first region, change button icon
            $(".icon-previous .fas").removeClass("fa-chevron-left");
            $(".icon-previous .fas").addClass("fa-reply");
            $(".icon-next .fas").removeClass("fa-reply");
            $(".icon-next .fas").addClass("fa-chevron-right");
        } else if (currentRegion == regionesLyr.getLayers().length){ // if last region, change button icon
            $(".icon-next .fas").removeClass("fa-chevron-right");
            $(".icon-next .fas").addClass("fa-reply");
            $(".icon-previous .fas").removeClass("fa-reply");
            $(".icon-previous .fas").addClass("fa-chevron-left");
        } else {
            $(".icon-previous .fas").removeClass("fa-reply");
            $(".icon-previous .fas").addClass("fa-chevron-left");
            $(".icon-next .fas").removeClass("fa-reply");
            $(".icon-next .fas").addClass("fa-chevron-right");
        }
        if (currentRegion > 0){ // if first region, show back button
            $(".icon-previous").css( "display", "block" );
        }
        
        
        $("#title").html('<h1>' + feature.properties.zona + '</h1>');
        var featBounds = feature.properties.bounds_calculated;
        map.flyToBounds(featBounds);
        regionesLyr.eachLayer(function(l){l.setStyle(noStyle);})
        $(layer.getElement()).removeClass("regionStyle");
        $(layer.getElement()).addClass("regionZoomed");
        feature.properties.is_clicked = true;
    } else if (feature.properties.is_clicked == true){ // feature already clicked, so zoom out
        map.flyTo([23.75, -101.9], 5);
        //regionesLyr.resetStyle(layer);
        regionesLyr.eachLayer(function(l){regionesLyr.resetStyle(l);})
        ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);})
        $(layer.getElement()).removeClass("regionZoomed");
        $(layer.getElement()).addClass("regionStyle");
        $("#title").html('<h1>México</h1>');
        feature.properties.is_clicked = false;
        currentRegion = 0;
        $(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");
        $(".icon-previous").css( "display", "none" );
    }
    updateChart();
    updateRadar();

}

$("#restart, .fas.fa-reply").on('click', function(){ 
    if (lastClickedLayer){
        //regionesLyr.resetStyle(lastClickedLayer);
        regionesLyr.eachLayer(function(l){regionesLyr.resetStyle(l);})
        ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);})
        $(lastClickedLayer.getElement()).removeClass("regionZoomed");
        $(lastClickedLayer.getElement()).addClass("regionStyle");
        lastClickedLayer.feature.properties.is_clicked = false;
    }
    lastClickedLayer = null;
    $("#title").html('<h1>México</h1>');
    map.flyTo([23.75, -101.9], 5);
    $(".icon-next .fas").removeClass("fa-reply");
    $(".icon-next .fas").addClass("fa-chevron-right");
    currentRegion = 0;
    updateRadar();
    updateChart();
});

$(".icon-next").on('click', function(){
    if (lastClickedLayer){ // if something is clicked, reset style
            //regionesLyr.resetStyle(lastClickedLayer);
            lastClickedLayer.feature.properties.is_clicked = false;
            $(lastClickedLayer.getElement()).removeClass("regionZoomed");
            $(lastClickedLayer.getElement()).addClass("regionStyle");
    }
    currentRegion++;
    if (currentRegion > 0 && currentRegion < regionesLyr.getLayers().length){ // cycle to next region
        if (currentRegion > 1) {
            $(".icon-previous .fas").removeClass("fa-reply");
            $(".icon-previous .fas").addClass("fa-chevron-left");   
        }
        regionesLyr._layers[currentRegion].fire('click');
    } else if (currentRegion == regionesLyr.getLayers().length){ // if last region
        regionesLyr._layers[currentRegion].fire('click');
        $(".icon-next .fas").removeClass("fa-chevron-right");
        $(".icon-next .fas").addClass("fa-reply");
        $(".icon-previous .fas").removeClass("fa-reply");
        $(".icon-previous .fas").addClass("fa-chevron-left");
    } else { // return to overview
        map.flyTo([23.75, -101.9], 5);
        $(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");
        $(".icon-previous").css( "display", "none" );
        currentRegion = 0;
        regionesLyr.eachLayer(function(l){regionesLyr.resetStyle(l);});
        ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);});
    }
});

$(".icon-previous").on('click', function(){
    if (lastClickedLayer){ // if something is clicked, reset style
            //regionesLyr.resetStyle(lastClickedLayer);
            lastClickedLayer.feature.properties.is_clicked = false;
            $(lastClickedLayer.getElement()).removeClass("regionZoomed");
            $(lastClickedLayer.getElement()).addClass("regionStyle");
    }
    currentRegion--;
    if (currentRegion > 1 && currentRegion < regionesLyr.getLayers().length){ // cycle to previous region
        regionesLyr._layers[currentRegion].fire('click');
        $(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");
    } else if (currentRegion == 1){ // if first region
        regionesLyr._layers[currentRegion].fire('click');
        $(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");
        $(".icon-previous .fas").removeClass("fa-chevron-left");
        $(".icon-previous .fas").addClass("fa-reply");
    } else { // return to overview
        map.flyTo([23.75, -101.9], 5);
        $(".icon-previous .fas").removeClass("fa-reply");
        $(".icon-previous .fas").addClass("fa-chevron-left");
        $(".icon-previous").css( "display", "none" );
        currentRegion = 0;
        regionesLyr.eachLayer(function(l){regionesLyr.resetStyle(l);});
        ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);});
    }
});

function updateChart(){
    if(currentRegion == 0){
        // at the national extent, display only top 15 values
        var chartData = properties.sort(function(x,y){
            return d3.descending(x.grado_total, y.grado_total);
        }).slice(0, 14);
        
        chartData.push(averages);
        chartData.sort(function(x,y){
            return d3.descending(x.grado_total, y.grado_total);
        })
        
    }else{
        var filtered = properties.filter(function(el){
            return el.zona == idToName[currentRegion];
        });
        filtered.push(averages)
        var chartData = filtered.sort(function(x,y){
            return d3.descending(x.grado_total, y.grado_total);
        });   
    };
    var stackColors = ['#d8b365','#5ab4ac'];
    var stack = d3.stack();
    var variables = ["grado_carretera", "grado_ferrocarril"]
    var stackedData = [];
    chartData.forEach(function(e){
        stackedData.push({"id":e.id,
                          "data":[{"id": e.id,
                                   "nombre": e.nombre,
                                   "start": 0,
                                   "end": e.grado_carretera},
                                  {"id": e.id,
                                   "nombre": e.nombre,
                                   "start": e.grado_carretera,
                                   "end": e.grado_ferrocarril + e.grado_carretera}]
                         });
        var lastValue = e.grado_ferrocarril;
    });

    x.domain(chartData.map(function(d) {return d.nombre;}));
    y.domain([0, d3.max(chartData, function(d) { return d.grado_total })]);
    
    var barsUpdate = gBar.selectAll(".ciudad")
        .data(stackedData, function(d){return d.id;});
    
    var t = barsUpdate.transition()
        .duration(500);
    
    barsUpdate.exit().style('opacity', 1)
        .transition(t)
        .style('opacity', 0)
        .remove();
    
    var barsEnter= barsUpdate.enter()
        .append("g")
        .attr("id", function(d){return d.id;})
        .attr("class", "ciudad")
        .selectAll("rect")
        .data(function(d){return d.data;}, function(d){return d.id;})
        .enter()
        .append("rect")
        .transition(t)
        .attr("class", "bar")
        .attr("x", function(d) {return x(d.nombre);})
        .attr("y", function(d, i) {return y(d.end);})
        .attr("fill", function(d,i) {return stackColors[i];})
        .attr("width", x.bandwidth())
        .attr("height", function(d,i) {return y(d.start) - y(d.end);});

    barsUpdate.selectAll("rect")
        .transition(t)
        .attr("x", function(d) {return x(d.nombre);})
        .attr("y", function(d, i) {return y(d.end);})
        .attr("fill", function(d,i) {return stackColors[i];})
        .attr("width", x.bandwidth())
        .attr("height", function(d,i) {return y(d.start) - y(d.end);});

    gBar.select(".axis--y").transition(t).call(yAxis);
    
    gBar.select(".axis--x").transition(t).call(xAxis)
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("dx", "0em")
        .attr("dy", "2em")
        .attr("transform", "rotate(45)");
};

function initChart(){
    var chartData = properties.sort(function(x,y){
        return d3.descending(x.grado_total, y.grado_total)
    }).slice(0, 14);
    chartData.push(averages);
    chartData.sort(function(x,y){
        return d3.descending(x.grado_total, y.grado_total)
    })
    var stackColors = ['#d8b365','#5ab4ac'];
    var stack = d3.stack();
    var variables = ["grado_carretera", "grado_ferrocarril"];
    var stackedData = [];
    chartData.forEach(function(e){
        stackedData.push({"id":e.id,
                          "data":[{"id": e.id,
                                   "nombre": e.nombre,
                                   "start": 0,
                                   "end": e.grado_carretera},
                                  {"id": e.id,
                                   "nombre": e.nombre,
                                   "start": e.grado_carretera,
                                   "end": e.grado_ferrocarril + e.grado_carretera}]
                         });
        var lastValue = e.grado_ferrocarril;
    });
    x.domain(chartData.map(function(d) { return d.nombre; }));
    y.domain([0, d3.max(chartData, function(d) { return d.grado_total })]);
    gBar.selectAll(".bar")
        .data(stackedData, function(d){return d.id;})
        .enter().append("g")
        .attr("id", function(d){return d.id;})
        .attr("class", "ciudad")
        .selectAll("rect")
        .data(function(d){return d.data;}, function(d){return d.id;})
        .enter()
        .append("rect")
        .attr("class", function(d){
            if(d.id == -1){
                return "bar-avg";
            } else{
                return "bar";
            }
        })
        .attr("x", function(d) {return x(d.nombre);})
        .attr("y", function(d, i) {return y(d.end);})
        .attr("fill", function(d,i) {return stackColors[i];})
        .attr("width", x.bandwidth())
        .attr("height", function(d,i) {return y(d.start) - y(d.end);});
    
    gBar.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," +  (height - margin.top) + ")")
        .call(xAxis)
        .selectAll("text")    
        .style("text-anchor", "start")
        .attr("dx", "0em")
        .attr("dy", "2em")
        .attr("transform", "rotate(45)");

    gBar.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis)
        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()))
        .attr("dy", "-2em")
        .attr("dx", "-2em")
        .attr("text-anchor", "start")
        .text("Degree");
        
    var legend = gBar.selectAll(".legend")
        .data(variables.reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
        .style("font", "10px sans-serif");

    legend.append("rect")
        .attr("x", width - 95)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", function(d,i){ return stackColors[i];});

    legend.append("text")
        .attr("x", width - 70)
        .attr("y", 9)
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .text(function(d) { return d; });    
}

function updateRadar(){
    if (currentRegion == 0) {
        // at the national extent, display only averages
        var chartData = imcoAvgsRadar;
    } else {
        var filtered = varsImco.filter(function(el){
            return el.zona == idToName[currentRegion];
        });
        var chartData = []
        filtered.forEach(function(d){
            chartData.push(
                {
                    "name": d.nom_ciudad,
                    "axes": [
                        {"axis": "sis_dere", "value":d.sis_dere},
                        {"axis": "man_ambi", "value":d.man_ambi},
                        {"axis": "soc_incl", "value":d.soc_incl},
                        {"axis": "gob_efic", "value":d.gob_efic},
                        {"axis": "merc_fac", "value":d.merc_fac},
                        {"axis": "eco_esta", "value":d.eco_esta},
                        {"axis": "precur", "value":d.precur},
                        {"axis": "rela_inte", "value":d.rela_inte},
                        {"axis": "inno_eco", "value":d.inno_eco},
                        {"axis": "sis_poli", "value":d.sis_poli}   
                    ]
                }
            )
        });
        chartData.push(imcoAvgsRadar[0]);
    }
    UpdateRadarChart("#radarChart", chartData);
};
