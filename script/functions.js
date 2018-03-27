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


// Set basic functions for styling the map
var rateById = d3.map(); // will hold the map from ids to property values
var colors5 = ['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']; // 5 color scheme
var quantile = d3.scaleQuantile() 
    .range(d3.range(5).map(function(i) { return colors5[i]; })); // quantile scale with 5 classes
var regionColors = d3.scaleOrdinal().domain([1, 7]).range(d3.schemeCategory10);

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
var svgBar;
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
            properties = [];
            var allNames = [];
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
                allNames.push(e.properties.nom_ciudad);
            });
            avgCarr = d3.mean(properties,function(d) {
                    return d.grado_carretera;
            });
            avgFerr = d3.mean(properties,function(d) {
                    return d.grado_ferrocarril;
            });
            averages = {
                "id": -1,
                "nombre": "National Average",
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
                        {"axis": "sis_dere", "value":imcoAvgs.sis_dere,
                         "name": "National Average"},
                        {"axis": "man_ambi", "value":imcoAvgs.man_ambi,
                        "name": "National Average"},
                        {"axis": "soc_incl", "value":imcoAvgs.soc_incl,
                        "name": "National Average"},
                        {"axis": "gob_efic", "value":imcoAvgs.gob_efic,
                        "name": "National Average"},
                        {"axis": "merc_fac", "value":imcoAvgs.merc_fac,
                        "name": "National Average"},
                        {"axis": "eco_esta", "value":imcoAvgs.eco_esta,
                        "name": "National Average"},
                        {"axis": "precur", "value":imcoAvgs.precur,
                        "name": "National Average"},
                        {"axis": "rela_inte", "value":imcoAvgs.rela_inte,
                        "name": "National Average"},
                        {"axis": "inno_eco", "value":imcoAvgs.inno_eco,
                        "name": "National Average"},
                        {"axis": "sis_poli", "value":imcoAvgs.sis_poli,
                        "name": "National Average"}
                        
                    ]
                }
            ];
            varsImco = variables;
            makeMap(regiones, ciudades);
            var barChartOptions ={
                "width": 350,
                "height": 300,
                "margin": {top: 100, right: 30, bottom: 30, left: 45},
                "transition_duration": 500
            };
            var barData = getBarData(["grado_carretera", "grado_ferrocarril"]);
            svgBar = initChart("#barChart", barData,
                               ["grado_carretera", "grado_ferrocarril"],
                               barChartOptions);
	    var radarChartOptions = {
	        w: 250,
	        h: 200,
                maxValue: 100,
	        margin: { top: 40, right: 75, bottom: 60, left: 75},
	        levels: 5,
	        roundStrokes: true,
	        color: d3.scaleOrdinal().domain(allNames).range(d3.schemeCategory20),
	        format: '.0f',
                opacityArea: 0.05,
                labelFactor: 1.35,
                strokeWidth: 1.2,
                opacityCircles: 0.05,
                dotRadius: 3,
                legend: { title: '', translateX: 100, translateY: 0 }
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
                fillOpacity: 0.8,
                //fillColor: quantile(rateById.get(feature.properties.id))
                fillColor: regionColors(swap(idToName)[feature.properties.zona])
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
    map.once("moveend", function(){
        updateChart("#barChart",
                getBarData(["grado_carretera", "grado_ferrocarril"]));
        updateRadar("#radarChart", getRadarData());
    });

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
    $(".icon-previous").css( "display", "none" );
    currentRegion = 0;
    map.once("moveend", function(){
        updateChart("#barChart",
                getBarData(["grado_carretera", "grado_ferrocarril"]));
        updateRadar("#radarChart", getRadarData());
    });
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
        $("#title").html('<h1>México</h1>');
        updateChart("#barChart",
                    getBarData(["grado_carretera", "grado_ferrocarril"]));
        updateRadar("#radarChart", getRadarData());
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
        $("#title").html('<h1>México</h1>');
        updateChart("#barChart",
                    getBarData(["grado_carretera", "grado_ferrocarril"]));
        updateRadar("#radarChart", getRadarData());
    }
});

function getRadarData(){
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
                        {"axis": "sis_dere", "value":d.sis_dere,
                         "name": d.nom_ciudad},
                        {"axis": "man_ambi", "value":d.man_ambi,
                        "name": d.nom_ciudad},
                        {"axis": "soc_incl", "value":d.soc_incl,
                        "name": d.nom_ciudad},
                        {"axis": "gob_efic", "value":d.gob_efic,
                        "name": d.nom_ciudad},
                        {"axis": "merc_fac", "value":d.merc_fac,
                        "name": d.nom_ciudad},
                        {"axis": "eco_esta", "value":d.eco_esta,
                        "name": d.nom_ciudad},
                        {"axis": "precur", "value":d.precur,
                        "name": d.nom_ciudad},
                        {"axis": "rela_inte", "value":d.rela_inte,
                        "name": d.nom_ciudad},
                        {"axis": "inno_eco", "value":d.inno_eco,
                        "name": d.nom_ciudad},
                        {"axis": "sis_poli", "value":d.sis_poli,
                        "name": d.nom_ciudad}   
                    ]
                }
            )
        });
        chartData.push(imcoAvgsRadar[0]);
    }
    return chartData;
}

function getBarData(stackVariables){
    // Stack variables: array
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
        filtered.push(averages);
        var chartData = filtered.sort(function(x,y){
            return d3.descending(x.grado_total, y.grado_total);
        });   
    };
    var stack = d3.stack();
    var stackedData = [];
    chartData.forEach(function(e){
        stackedData.push({"id":e.id,
                          "data":[{"id": e.id,
                                   "nombre": e.nombre,
                                   "start": 0,
                                   "end": e[stackVariables[0]]
                                  },
                                  {"id": e.id,
                                   "nombre": e.nombre,
                                   "start": e[stackVariables[0]],
                                   "end": e[stackVariables[1]] + e[stackVariables[0]]}]
                         });
    });
    return stackedData;
}

function swap(json){
    var ret = {};
    for(var key in json){
        ret[json[key]] = key;
    }
    return ret;
}
