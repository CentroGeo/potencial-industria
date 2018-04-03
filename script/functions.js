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

// Set basic functions for styling the map
var rateById = d3.map(); // will hold the map from ids to property values
var colors5 = ['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']; // 5 color scheme
var quantile = d3.scaleQuantile() 
    .range(d3.range(5).map(function(i) { return colors5[i]; })); // quantile scale with 5 classes
var regionColors = d3.scaleOrdinal().domain([1, 7]).range(d3.schemeCategory10);

// map and base layer
var map = L.map('mapdiv', {attributionControl: false}).setView([23.75, -101.9], 5);
//L.control.attribution({position: 'bottomleft'}).addTo(map);

var overlay = new L.map('overlaydiv', {
    zoomControl: false,
    //inertia: false,
    keyboard: false,
    //dragging: false,
    scrollWheelZoom: false,
    attributionControl: false,
    zoomAnimation: false
}).setView([23.75, -101.9], 5);

L.control.attribution({position: 'bottomright'}).addTo(overlay);

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

var properties, // properties for each city
    connectivityBar,
    connectivityData,
    imcoData,
    chData,
    regionNames,
    imcoRadar,
    imcoData,
    chRadar,
    chData;

// Load data
var q = d3.queue();
q.defer(d3.json, "data/regiones.geojson")
    .defer(d3.json, "data/ciudades.geojson")
    .defer(d3.json, "data/cpis_en.geojson")
    .defer(d3.csv, "data/variables-potencial-industrial.csv")
    .defer(d3.csv, "data/capital-humano-zonas.csv")
    .await(function(error, regiones, ciudades, cpis, variables, varsChZonas) {
        if (error) {
            console.error('Oh dear, something went wrong: ' + error);
        } else {
            ciudades.features.forEach(function(e) {
                // Populate the map
                rateById.set(e.properties.id, +e.properties.grado_total);
            });
            // properties = [];
            var cityNames = [],
                regionNames = [];
            
            ciudades.features.forEach(function(e) {
                cityNames.push(e.properties.nom_ciudad);
            });
            // Read connectivity from variables csv
            connectivityData = parseConnectivity(variables);
            // Read imco variables from csv
            imcoData = parseImcoData(variables);
            // Read human capital data from capital-humano.csv
            chData = parseChData(varsChZonas);
            // Read zone names
            regionNames = getZonesNames(varsChZonas);

            // Make map
            makeMap(regiones, ciudades, cpis);
            
            connectivityBar = stackedBarChart()
                .width(300)
                .height(250)
                .stackVariables(["grado_ferrocarril", "grado_carretera"])
                .displayName("nom_ciudad")
                .transitionTime(500)
                .id("id");
            
            connectivityBar.data(getBarData());
            d3.select("#barConectividad")
                .call(connectivityBar); // Draw chart in selected div

            imcoRadar = radarChart()
                .width(250)
                .height(200)
                .displayName("nom_ciudad")
                .id("id")
                .color(d3.scaleOrdinal()
                       .domain(cityNames).range(d3.schemeCategory20))
                .legend({ title: '', translateX: 100, translateY: 0 })
                .legendContainer('imcoLegend')
                .maxValue(100);

            imcoRadar.data(getRadarData()); // bind data to chart object
                 d3.select("#radarImco")
                .call(imcoRadar); // Draw chart in selected div

            chRadar = radarChart()
                .width(250)
                .height(200)
                .displayName("region")
                .id("id")
                .color(d3.scaleOrdinal()
                       .domain(regionNames).range(d3.schemeCategory20))
                .legend({ title: '', translateX: 100, translateY: 0 })
                .legendContainer('chLegend')
                .maxValue(2);

            chRadar.data(chData); // bind data to chart object
                 d3.select("#radarCH")
                .call(chRadar); // Draw chart in selected div
        }
    });

var currentRegion = 0,
    lastClickedLayer = null,
    regionesLyr,
    ciudadesLyr,
    cpisLayer;

function makeMap(regiones, ciudades, cpis){  
    quantile.domain(rateById.values())
    ciudadesLyr = L.geoJSON([ciudades], {
        style: function(feature){
            return {
                weight: 0.5,
                color: "#999",
                opacity: 1,
                fillOpacity: 0.8,
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
    
    cpisLayer = L.geoJSON([cpis], {
       pointToLayer: function(feature, latlng){
           var geojsonMarkerOptions = {
               opacity: .75,
               weight: 1,
               fillColor: feature.properties.main ? "#e81b44" : "#1ba3e8", // if sede is null paint red, else, blue. 
               color: "#03f", 
               fillOpacity: .75,
               radius: feature.properties.main ? "5" : "3" // if sede, radius is 4 (larger), else, 3 (smaller).
           }           
           return L.circleMarker(latlng, geojsonMarkerOptions)
            .on("mouseover", function(event){showPRC(event, feature);})
            .on("mouseout", hidePRC);
       }
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

function showPRC(e, f){
    var topics = f.properties.topics.split(";");
    topicsText = "<ul>";
    topics.forEach(function(t){
        topicsText += "<li>" + t + "</li>";
    });
    topicsText += "</ul>";
    $("#probe").html(f.properties.name + "<br/>" + f.properties.shortname + "<br/>Area: " + 
                    f.properties.area + "<br/>Research lines:<br/>" + topicsText);
                    
    var container = e.containerPoint;
    $("#probe").css({
        display: "block",
        left: Math.min(container.x + 10, $(window).width() - $("#probe").outerWidth() - 10) + "px",
        top: Math.max(5, container.y - $("#probe").outerHeight() + 100) + "px"
    });
}
    
function hidePRC(){
    $("#probe").css("display","none");
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
        /*if (currentRegion == 1){ // if first region, change button icon
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
        }*/
        if (currentRegion > 0){ // if first region, show back button
            $(".icon-previous").removeClass("text-muted");
            $(".icon-previous").removeClass("icon-disabled");
        }
        
        $("#title").html(feature.properties.zona);
        var featBounds = feature.properties.bounds_calculated;
        map.flyToBounds(featBounds);
        regionesLyr.eachLayer(function(l){l.setStyle(noStyle);})
        $(layer.getElement()).removeClass("regionStyle");
        $(layer.getElement()).addClass("regionZoomed");
        feature.properties.is_clicked = true;
    } else if (feature.properties.is_clicked == true){ // feature already clicked, so zoom out
        map.flyTo([23.75, -101.9], 5);
        regionesLyr.eachLayer(function(l){regionesLyr.resetStyle(l);})
        ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);})
        $(layer.getElement()).removeClass("regionZoomed");
        $(layer.getElement()).addClass("regionStyle");
        $("#title").html('México');
        feature.properties.is_clicked = false;
        currentRegion = 0;
        $(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");
        $(".icon-previous").addClass("text-muted");
        $(".icon-previous").addClass("icon-disabled");
    }
    map.once("moveend", function(){
        connectivityBar.data(getBarData());
        imcoRadar.data(getRadarData());
    });
}

$(".menu, .fas.fa-reply").on('click', function(){ 
    if (lastClickedLayer){
        regionesLyr.eachLayer(function(l){regionesLyr.resetStyle(l);})
        ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);})
        $(lastClickedLayer.getElement()).removeClass("regionZoomed");
        $(lastClickedLayer.getElement()).addClass("regionStyle");
        lastClickedLayer.feature.properties.is_clicked = false;
    }
    lastClickedLayer = null;
    $("#title").html('México');
    map.flyTo([23.75, -101.9], 5);
    /*$(".icon-next .fas").removeClass("fa-reply");
    $(".icon-next .fas").addClass("fa-chevron-right");*/
    $(".icon-previous").addClass("text-muted");
    $(".icon-previous").addClass("icon-disabled");
    currentRegion = 0;
    map.once("moveend", function(){
        connectivityBar.data(getBarData());
        imcoRadar.data(getRadarData());
    });
});

$(".icon-next").on('click', function(){
    if (lastClickedLayer){ // if something is clicked, reset style
            lastClickedLayer.feature.properties.is_clicked = false;
            $(lastClickedLayer.getElement()).removeClass("regionZoomed");
            $(lastClickedLayer.getElement()).addClass("regionStyle");
    }
    currentRegion++;
    if (currentRegion > 0 && currentRegion < regionesLyr.getLayers().length){ // cycle to next region
        /*if (currentRegion > 1) {
            $(".icon-previous .fas").removeClass("fa-reply");
            $(".icon-previous .fas").addClass("fa-chevron-left");   
        }*/
        regionesLyr._layers[currentRegion].fire('click');
    } else if (currentRegion == regionesLyr.getLayers().length){ // if last region
        regionesLyr._layers[currentRegion].fire('click');
        /*$(".icon-next .fas").removeClass("fa-chevron-right");
        $(".icon-next .fas").addClass("fa-reply");
        $(".icon-previous .fas").removeClass("fa-reply");
        $(".icon-previous .fas").addClass("fa-chevron-left");*/
    } else { // return to overview
        map.flyTo([23.75, -101.9], 5);
        /*$(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");*/
        $(".icon-previous").addClass("text-muted");
        $(".icon-previous").addClass("icon-disabled");
        currentRegion = 0;
        regionesLyr.eachLayer(function(l){regionesLyr.resetStyle(l);});
        ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);});
        $("#title").html('México');

        connectivityBar.data(getBarData());
        imcoRadar.data(getRadarData());
    }
});

$(".icon-previous").on('click', function(){    
    if (lastClickedLayer){ // if something is clicked, reset style
            lastClickedLayer.feature.properties.is_clicked = false;
            $(lastClickedLayer.getElement()).removeClass("regionZoomed");
            $(lastClickedLayer.getElement()).addClass("regionStyle");
    }
    currentRegion--;
    if (currentRegion > 1 && currentRegion < regionesLyr.getLayers().length){ // cycle to previous region
        regionesLyr._layers[currentRegion].fire('click');
        /*$(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");*/
    } else if (currentRegion == 1){ // if first region
        regionesLyr._layers[currentRegion].fire('click');
        /*$(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");
        $(".icon-previous .fas").removeClass("fa-chevron-left");
        $(".icon-previous .fas").addClass("fa-reply");*/
    } else { // return to overview
        map.flyTo([23.75, -101.9], 5);
        /*$(".icon-previous .fas").removeClass("fa-reply");
        $(".icon-previous .fas").addClass("fa-chevron-left");*/
        $(".icon-previous").addClass("text-muted");
        $(".icon-previous").addClass("icon-disabled");
        currentRegion = 0;
        regionesLyr.eachLayer(function(l){regionesLyr.resetStyle(l);});
        ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);});
        $("#title").html('México');
        
        connectivityBar.data(getBarData());
        imcoRadar.data(getRadarData());
    }
});

//////////////////////////////////////////////////
/// 
/// Utilty functions
///
///
/////////////////////////////////////////////////

// Update data for Imco chart
function getRadarData(){
    if (currentRegion == 0) {
        // at the national extent, display only averages
        var filtered = imcoData.filter(function(el){
            return el.zona === "National Averages";
        });
    } else {
        var filtered = imcoData.filter(function(el){
            return el.zona == idToName[currentRegion] || el.zona === "National Averages";
        });
    }
    return filtered;
}

// Update data for Connectivity chart
function getBarData(){
    // Stack variables: array
    var avg = connectivityData.filter(function(el){
        return el.zona === "Nacional"
    });
    if (currentRegion == 0){
        var chartData = connectivityData.sort(function(x,y){
            return d3.descending(x.grado_total, y.grado_total);
        }).slice(0, 14);
        chartData.push(avg[0]);
        // var chartData = connectivityData.sort(function(x,y){
        //     return d3.descending(x.grado_total, y.grado_total);
        // });
    } else {
        var filtered = connectivityData.filter(function(el){
            return el.zona === idToName[currentRegion] || el.zona === "Nacional";
        });
        var chartData = filtered.sort(function(x,y){
            return d3.descending(x.grado_total, y.grado_total);
        });   
    }
    return chartData;
}

// Swap keys with values in object
function swap(json){
    var ret = {};
    for(var key in json){
        ret[json[key]] = key;
    }
    return ret;
}

// Parse connectivity data
// Coerce strings to numbers, compute averages
// Return array of row objects. Average has id = -1
function parseConnectivity(rows){
    // Parse connectivity data as numbers
    connectivityData = [];
    rows.forEach(function(d) {
        connectivityData.push({
            id: d.id, 
            nom_ciudad: d.nom_ciudad,
            grado_carretera: +d.grado_carretera, 
            grado_ferrocarril: +d.grado_ferrocarril,
            grado_total: +d.grado_total,
            zona: d.zona
        });
    });
    // calculate national averages
    var avgCarr = d3.mean(connectivityData, function(d) {
        return d.grado_carretera;
    });
    var avgFerr = d3.mean(connectivityData, function(d) {
        return d.grado_ferrocarril;
    });
    var connectivityAverages = {
        "id": -1,
        "nom_ciudad": "National Average",
        "grado_carretera": avgCarr,
        "grado_ferrocarril": avgFerr,
        "grado_total": avgCarr + avgFerr,
        "zona": "Nacional"
    };
    connectivityData.push(connectivityAverages);
    return connectivityData;
}

function getImcoData(){
    if (currentRegion == 0){
        var chartData = imcoData.filter(function(el){
            return el.nom_ciudad === "National Average";
        });
    } else {
        var chartData = imcoData.filter(function(el){
            return el.zona === idToName[currentRegion] || el.nom_ciudad === "National Average";
        });
    }
    return chartData;
    
}

// Parse imco data
// Coerce strings to numbers, compute averages
// Return array of row objects. Average has id = -1
function parseImcoData(rows){
    var imcoData = [];
    rows.forEach(function(d) {
        imcoData.push({
            "id": d.id, 
            "nom_ciudad": d.nom_ciudad,
            "zona": d.zona,
            "Legal System": +d.sis_dere,
            "Environment": +d.man_ambi,
            "Inclusive Society": +d.soc_incl,
            "Efficent Government": +d.gob_efic,
            "Market Factors": +d.merc_fac,
            "Economic Stability": +d.eco_esta,
            "Infrastructure": +d.precur,
            "International Relationships": +d.rela_inte,
            "Economic Innovation": +d.inno_eco,
            "Political System": +d.sis_poli
        });
    });
    
    var imcoAvgs = {
        "id": -1,
        "nom_ciudad": "National Averages",
        "zona": "National Averages",
        "Legal System": d3.mean(rows,function(d) {
            return d.sis_dere;
        }),
        "Political System": d3.mean(rows,function(d) {
            return d.man_ambi;
        }),
        "Environment": d3.mean(rows,function(d) {
            return d.soc_incl;
        }),
        "Inclusive Society": d3.mean(rows,function(d) {
            return d.sis_poli;
        }),
        "Efficient Government": d3.mean(rows,function(d) {
            return d.gob_efic;
        }),
        "Market Factors": d3.mean(rows,function(d) {
            return d.merc_fac;
        }),
        "Economic Stability": d3.mean(rows,function(d) {
            return d.eco_esta;
        }),
        "Infrastructure": d3.mean(rows,function(d) {
            return d.precur;
        }),
        "International Relationships": d3.mean(rows,function(d) {
            return d.rela_inte;
        }),
        "Economic Innovation": d3.mean(rows,function(d) {
            return d.inno_eco;
        })  
    };
    imcoData.push(imcoAvgs);
    return imcoData;
}

// Parse imco data
// Coerce strings to numbers, compute averages
// Return array of row objects. Average has id = -1
function parseChData(rows){
    // TODO: we only have regional averages at the moment
    return rows
}

// Get all zones names
// Parse zone names (in english) from human capital data
function getZonesNames(rowsCh){
    var names = [];
    rowsCh.forEach(function(e){
        names.push(e.zona)
    });
    return names;
}
