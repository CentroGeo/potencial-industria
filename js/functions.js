// Try this to use hover on touch devices
//$('body').bind('touchstart', function() {});

$(function() {
    setTimeout(function(){
        $('body').removeClass('fade-out'); 
    }, 500);
});

// Change initial icons to carousel on click
$(".topic-icon").on('click', function(){
    var parentContainer = this.parentElement.id;
    $("#"+parentContainer).bind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function(){
        var topic = "#" + parentContainer.split("-")[0] + "_carouselContent";
        $(".topic-icon").each(function(){
            if (this.parentElement.id != parentContainer){
                var otherTopic = "#" + this.parentElement.id.split("-")[0] + "_carouselContent";
                $(otherTopic).css("display", "none");
            }
        });

    switch(parentContainer.split("-")[0]) {
        case "connectivity":
            var topic_name = "Connectivity";
            break;
        case "ch":
            var topic_name = "Human Capital";
            break;
        case "imco":
            var topic_name = "Bussinebility";
            break;
        case "industry":
            var topic_name = "Industries";
            break;
        case "top5":
            var topic_name = "Top 5";
            break;
        default:
            break;
    }

    $("#topic").html(topic_name + ":");

    //parentContainer de los markers
    if(parentContainer=="top5-div"){
        makercpis()
    }else{
        makerRegion()
    }
    
        $("#choose").css('display', 'none'); 
        $("#graphs").fadeIn("slow", "linear");
        $(topic).fadeIn( "slow", "linear" );
        $(this).removeClass("iconZoom");
    }).addClass("iconZoom");
});

// Change carousel back to initial icons when on click
$("#menu").on('click', function(){
    makerRegion()
    $("#graphs").css('display', 'none'); 
    $("#choose").fadeIn( "slow", "linear" ); 
    $(".topic-icon").each(function(){
        var parentContainer = this.parentElement.id;
        var topic = "#" + parentContainer.split("-")[0] + "_carouselContent";
        $(topic).css("display", "none");
    });
});

// Setup stuff for the bar chart

var idToName = {
    1 : "Northeast",
    2 : "Center-west",
    3 : "Megalopolis",
    4 : "Northwest",
    5 : "Gulf-east",
    6 : "Center-north",
    7 : "Yucatán peninsula"
};

// Set basic functions for styling the map

    // TODO: regionColors domain should match ordered region ids.

// var colorArray = ["#e62b65","#bb91f9","#dd2229","#4fab47","#8569ad",
//                   "#95c950","#ef5762","#be0040","#a93491","#0f7721"];
var colorArray = ["#eb126f","#8669aa","#e72230","#40ab4e","#b0358f",
                  "#90c85a","#f95765","#be0040","#a93491","#0f7721"];

var regionColors = d3.scaleOrdinal().range(colorArray).domain([3,1,2,6,7,4,5]);

//limites del mapa
var southWest = L.latLng(3.95, -83),
    northEast = L.latLng(40.00, -120.67),
    bounds = L.latLngBounds(southWest, northEast);

// map and base layer
var map = L.map('mapdiv', {maxBounds:bounds, zoomControl: false, minZoom: 5, attributionControl: false}).setView([23.75, -101.9], 5);

/*var overlay = new L.map('overlaydiv', {
    zoomControl: false,
    inertia: false,
    keyboard: false,
    //dragging: false,
    scrollWheelZoom: true,
    attributionControl: false,
    zoomAnimation: true
}).setView([23.75, -101.9], 5);*/

//L.control.attribution({position: 'bottomright'}).addTo(overlay);

var mapBase = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(map);

/*var overlayBase = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(overlay);

map.sync(overlay, {offsetFn: offsetGlobal});
*/
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
    chData,
    logroEBar,
    logroEData,
    ikaData,
    ikaBar,
    hhData,
    hhBar;

// Load data
var q = d3.queue();
q.defer(d3.json, "data/regiones.geojson")
    .defer(d3.json, "data/ciudades.geojson")
    .defer(d3.json, "data/cpis_en.geojson")
    .defer(d3.csv, "data/variables-potencial-industrial.csv")
    .defer(d3.csv, "data/capital-humano-zonas.csv")
    .defer(d3.csv, "data/logroeducativo.csv")
    .defer(d3.csv, "data/tamanomercado.csv")
    .defer(d3.csv, "data/hh_region.csv")
    .defer(d3.csv, "data/hh_ika.csv")
    
    .await(function(error, regiones, ciudades, cpis, variables,
                    varsChZonas, varsLogroE, varsIKA, varsRegionHH, varsIkaHH) {
        if (error) {
            console.error('Oh dear, something went wrong: ' + error);
        } else {
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
            // Read educational echievement data from logroeducativo.csv
            logroEData = parseLogroEData(varsLogroE);
            // Read IKA data
            ikaData = parseIkaData(varsIKA);
            // Read zone names
            regionNames = getZonesNames(varsChZonas);

            // Make map
            makeMap(regiones, ciudades);
            
            // Connectivity charts
            connectivityBar = stackedBarChart()
                .width(300)
                .height(250)
                .margin({top: 25, right: 50, bottom: 110, left: 25})
                .stackVariables(["grado_ferrocarril", "grado_carretera"])
                .displayName("nom_ciudad")
                .stackColors(["#40ab4e","#e36930"])
                .barAxisLabel("Degree")
                .legend({title: 'Connectivity', translateX: 0,
                         translateY: 0,
                         itemsBar:['Highway','Railroad']})
                .legendContainer('connectivityLegend')
                .transitionTime(500)
                .id("id");
            
            connectivityBar.data(getBarData());
            d3.select("#barConectividad")
                .call(connectivityBar);

                
            // Human Capital charts
            logroEBar = stackedBarChart()
                .width(280)
                .height(250)
                .margin({top: 30, right: 50, bottom: 100, left:60})
                .stackColors(["#eb126f","#8669aa"])
                .lineColors(d3.scaleLinear().range(colorArray).domain([0,1]))
                .pointColors(d3.scaleLinear().range(colorArray).domain([0,1]))
                .stackVariables(["Pop with bachelor",
                                 "Pop with grad"])
                .lineVariables(["Percentage bachelor", "Percentage grad"])
                .displayName("name")
                .barAxisXLabelPos("-5.5em")
                .barAxisYLabelPos("-4em")
                .barAxisLabel("Population")
                .lineAxisLabel("Percentage")
                .legend({title: 'Educational Achievement', translateX: -70, translateY: 0,
                         itemsLine:["Percentage bachelor", "Percentage grad"],
                         itemsBar: ["Pop with bachelor","Pop with grad"]})
                .id("name");
            
            logroEBar.data(getLogroEData());
                d3.select("#logroEBar")
                .call(logroEBar);
                
            chRadar = radarChart()
                .width(250)
                .height(200)
                .margin({top: 40, right: 60, bottom: 0, left: 50})
                .displayName("region")
                .opacityArea(0)
                .id("id")
                .levels(4)
                .format('.1f')
                .color(d3.scaleOrdinal().range(colorArray).domain(regionNames))
                .legend({ title: '', translateX: 135, translateY: 0 })
                .legendContainer('chLegend')
                .maxValue(2);

            chRadar.data(getChRadarData());
                 d3.select("#radarCH")
                .call(chRadar);
            
            ikaBar = barLineChart()
                .width(250)
                .height(250)
                //.margin({top: 10, right: 50, bottom: 110, left:60})
                .margin({top: 30, right: 50, bottom: 100, left:60})
                .barsVariables(["Labor market size", "IKAs market"])
                .barColor(d3.scaleOrdinal().range(colorArray).domain(["Labor market size", "IKAs market"]))
                .lineVariables(["IKAs Percentage"])
                .displayName("name")
                .barAxisXLabelPos("-4.5em")
                .barAxisYLabelPos("-2em")
                .barAxisLabel("Population")
                .lineAxisLabel("Percentage")
                .legend({title: '', translateX: -70, translateY: 0,
                         itemsLine:["IKAs Percentage"],
                         itemsBar: ["Labor market size", "IKAs market"]})
                .legendContainer('ikaBarLegend')
                .id("name");
            
            ikaBar.data(getIkaData());
                d3.select("#ikaBar")
                .call(ikaBar);
            
            hhRegionBar = horizontalBarChart()
                .width(250)
                .height(250)
                .margin({top: 10, right: 50, bottom: 26, left:100})
                .barsVariable("index")
                .barColor(d3.scaleOrdinal().range(colorArray).domain([1]))
                .displayName("region")
                .id("id")
                .axisFormat(d3.format('.0f'))
                .highlightColor('#40ab4e')
                .xOffsetStart(-132)
                .xOffsetEnd(48);
            
            hhRegionData = [];
            varsRegionHH.forEach(function(d) {
                hhRegionData.push({
                    region: d["region"], 
                    index: +d["index"]
                });
            });
            hhRegionData = hhRegionData.sort(function(x,y){
                return d3.descending(x["index"],
                                     y["index"]);
            });
            
            hhRegionBar.data(hhRegionData);
                d3.select("#hhRegionBar")
                .call(hhRegionBar);
                
            hhIkaBar = horizontalBarChart()
                .width(300)
                .height(250)
                .margin({top: 30, right: 50, bottom: 60, left:120})
                .barsVariable("index")
                .barColor(d3.scaleOrdinal().range(colorArray).domain([1]))
                .displayName("oic")
                .id("id")
                .xOffsetStart(-201976)
                .xOffsetEnd(46613);
            
            hhIkaData = [];
            
            varsIkaHH.forEach(function(d) {
                hhIkaData.push({
                    oic: d["OIC"], 
                    index: +d["Agglomeration Index"]
                });
            });
            hhIkaData = hhIkaData.sort(function(x,y){
                return d3.descending(x["Agglomeration Index"],
                                     y["Agglomeration Index"]);
            });
            
            hhIkaBar.data(hhIkaData);
                d3.select("#hhIkaBar")
                .call(hhIkaBar);
            
            // IMCO charts
            imcoRadar = radarChart()
                .width(200)
                .height(250)
                .margin({top: 40, right: 20, bottom: 0, left: 150})
                .displayName("nom_ciudad")
                .opacityArea(0)
                .id("id")
                .color(d3.scaleOrdinal().range(colorArray).domain(regionNames))
                .legend({ title: '', translateX: 240, translateY: 70 })
                .legendContainer('imcoLegend')
                .maxValue(100);

            imcoRadar.data(getRadarData()); // bind data to chart object
                 d3.select("#radarImco")
                .call(imcoRadar); // Draw chart in selected div
        }
    });

var currentRegion = 0,
    lastClickedLayer = null,
    lastClickedMaker = null, //new
    regionesLyr,
    ciudadesLyr,
    cpisLayer;

var sede_icon = L.icon({
   "iconUrl": "/img/icon_sede.png",
   "iconSize": [20,20],
});

var nosede_icon = L.icon({
   "iconUrl": "/img/icon_nosede.png",
   "iconSize": [20,20]
});

function makercpis(){
    var q = d3.queue()
    q.defer(d3.json, "data/cpis_en.geojson")
    
    .await(function(error, cpis) {
        if (error) console.error('Oh dear, something went wrong: ' + error);
        else {
            if(ciudadesLyr != undefined && regionesLyr!=undefined){
                ciudadesLyr.clearLayers();
                regionesLyr.clearLayers();
                ciudadesLyr=undefined;
                regionesLyr=undefined;
            }
            if(cpisLayer==undefined){
                makeMapCpis(cpis)
                map.flyTo([23.75, -101.9], 5, { duration: 1});
            }
        }
    })
    
}

function makerRegion(){
    var q = d3.queue()
    q.defer(d3.json, "data/regiones.geojson")
    .defer(d3.json, "data/ciudades.geojson")
    .await(function(error,regiones,ciudades){
        if(error) console.error('Oh dear, something went wrong: ' + error)
        else {
            if(cpisLayer!=undefined){
                cpisLayer.clearLayers();
                cpisLayer=undefined;
            }
            if(ciudadesLyr == undefined && regionesLyr == undefined){
                makeMap(regiones,ciudades);
                map.flyTo([23.75, -101.9], 5, { duration: 1});
            }
        }
    });
}

function makeMapCpis(cpis){
    cpisLayer = L.geoJSON([cpis], {
       pointToLayer: function(feature, latlng){
           var geojsonMarkerOptions = {
               opacity: feature.properties.main ? 1 : .70,
               icon: feature.properties.main ? sede_icon : nosede_icon,
           }           
           return L.marker(latlng, geojsonMarkerOptions)
            //.on("mouseover", function(event){showPRC(event, feature);})
            //.on("mouseout", hidePRC);
       },
       onEachFeature: onEachFeatureCpis /*new*/
    }).addTo(map)
}

function makeMap(regiones, ciudades){  
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
};

/*new*/
function onEachFeatureCpis(feature, layer){
    feature.properties.is_clicked = false;
    layer.on('click', makerClick);
}

function onEachFeatureRegiones(feature, layer){
    // assign bounding box to each feature
    feature.properties.bounds_calculated = layer.getBounds();
    // assign a property to each feature to check if it's clicked
    feature.properties.is_clicked = false;
    // assign each layer an id that makes sense
    layer._leaflet_id = feature.properties.id_0;
    layer.on('click', layerClick);
}

function showpopup(e,f){
    var topics = f.properties.topics.split(";");
    topicsText = "<ul>";
    topics.forEach(function(t){
        topicsText += "<li>" + t + "</li>";
    });
    topicsText += "</ul>";
    var Text = f.properties.name + "<br/>" + f.properties.shortname + "<br/>Area: " + 
                    f.properties.area + "<br/>Research lines:<br/>" + topicsText;
    return Text;
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

/*new*/
function makerClick(event){
    layer = event.target;
    feature = layer.feature;

    if (feature.properties.is_clicked == false){ // feature not clicked, so zoom in
        if (lastClickedMaker){ // when a region is clicked and you click another, reset previous one
            lastClickedMaker.feature.properties.is_clicked = false;
            lastClickedMaker.closePopup();
        }
        lastClickedMaker = layer;
        
        setTimeout(function(){
           layer.bindPopup(showpopup(event,feature)).openPopup();
        },300)
        map.flyTo(layer.getLatLng(), 13, { duration: 1});
        feature.properties.is_clicked = true;

    }else if(feature.properties.is_clicked == true){
        feature.properties.is_clicked = false;
        map.flyTo([23.75, -101.9], 5, { duration: 1});
        
        setTimeout(function(){
            lastClickedMaker.closePopup();
        },300)
    }
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
        var zone = feature.properties.zona;

        switch(zone) {
            case "Megalopolis":
                var bullet_name = "megalopolis_bullet.png";
                break;
            case "Northeast":
                var bullet_name = "northeast_bullet.png";
                break;
            case "Center-west":
                var bullet_name = "centerwest_bullet.png";
                break;
            case "Center-north":
                var bullet_name = "centernorth_bullet.png";
                break;
            case "Yucatan peninsula":
                var bullet_name = "yucatan_bullet.png";
                break;
            case "Northwest":
                var bullet_name = "northwest_bullet.png";
                break;
            case "Gulf-east":
                var bullet_name = "gulfeast_bullet.png";
                break;
            default:
                var bullet_name = "default_bullet.png";
                break;
        }
        
        Array.from(document.getElementsByClassName("bullet-li")).forEach(function(element) {
            element.style.backgroundImage = "url('/img/" + bullet_name + "')";
            element.style.backgroundSize = "20px 20px";
        });

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
        $("#title").html('Mexico');
        feature.properties.is_clicked = false;
        currentRegion = 0;
        /*$(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");*/
        $(".icon-previous").addClass("text-muted");
        $(".icon-previous").addClass("icon-disabled");

        Array.from(document.getElementsByClassName("bullet-li")).forEach(function(element) {
            element.style.backgroundImage = "url('/img/default_bullet.png')";
            element.style.backgroundSize = "20px 20px";
        });
    }
    map.once("moveend", function(){
        updateChartData();
    });
}

$("#global").on('click', function(){ 
    if(ciudadesLyr != undefined && regionesLyr !=undefined){
        makerRegion(); //default view of map
        if (lastClickedLayer){
            regionesLyr.eachLayer(function(l){regionesLyr.resetStyle(l);})
            ciudadesLyr.eachLayer(function(l){ciudadesLyr.resetStyle(l);})
            $(lastClickedLayer.getElement()).removeClass("regionZoomed");
            $(lastClickedLayer.getElement()).addClass("regionStyle");
            lastClickedLayer.feature.properties.is_clicked = false;
        }
        lastClickedLayer = null;
        $("#title").html('Mexico');
        map.flyTo([23.75, -101.9], 5);
        /*$(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");*/
        $(".icon-previous").addClass("text-muted");
        $(".icon-previous").addClass("icon-disabled");
        currentRegion = 0;
        map.once("moveend", function(){
            updateChartData();
        });
    }else if(cpisLayer!=undefined){
        makercpis()
        map.flyTo([23.75, -101.9], 5, { duration: 1});
    }

    Array.from(document.getElementsByClassName("bullet-li")).forEach(function(element) {
        element.style.backgroundImage = "url('/img/default_bullet.png')";
        element.style.backgroundSize = "20px 20px";
    });
});

$(".icon-next").on('click', function(){
    if(ciudadesLyr != undefined && regionesLyr !=undefined){
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
            $("#title").html('Mexico');

            map.once("moveend", function(){
                updateChartData();
            });
        }
    }
});

$(".icon-previous").on('click', function(){    
    if(ciudadesLyr != undefined && regionesLyr !=undefined){
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
            $("#title").html('Mexico');
            
            map.once("moveend", function(){
                updateChartData();
            });
        }
    }
});

//////////////////////////////////////////////////
/// 
/// Utility functions
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


// Update data for ch Radar
function getChRadarData(){
    if (currentRegion == 0){
        //console.log("Nacional");
    } else {
        //console.log(idToName[currentRegion]);
    }
    //console.log(chData)
    return chData;
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

// update data for imco chart
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
    
    /*var chData = [];
    rows.forEach(function(d) {
        chData.push({
            "CEOs": +d["CEOs"],
            "Creatives": +d["Creatives"],
            "Education": +d["Education"],
            "Engineering": +d["Engineering"],
            "Health": +d["Health"],
            "ITC": +d["ITC"],
            "Marketing and finance": +d["Marketing and finance"],
            "R&D": +d["R&D"],
            "region": d.region
        });
    });
    return chData;*/
    return rows;
}

// parse data for logro educatiivo
function parseLogroEData(rows){
    logroEData = [];
    rows.forEach(function(d) {
        logroEData.push({
            id: d["name"], 
            name: d.name, // lowercase
            region: d.region,
            "Pop with bachelor":
            +d["Population aged 25 and older with bachelor's degree"],
            "Pop with grad":
            +d["Population aged 25 and older with graduate degree"],
            "Percentage bachelor":
            +d["Percentage of population aged 25 and older with bachelor's degree"],
            "Percentage grad":
            +d["Percentage of population aged 25 and older with graduate degree"]
         });
    });
    return logroEData;
}

// update logro educativo data
function getLogroEData(){
    if (currentRegion == 0){
        var chartData = logroEData.filter(function(el){
            return el.region === "National";
        });
    } else {
        var chartData = logroEData.filter(function(el){
            return el.region === idToName[currentRegion];
        });
    }
    return chartData;
}

// parse ika data
function parseIkaData(rows){
    ikaData = [];
    rows.forEach(function(d) {
        ikaData.push({
            region: d["region"],
            name: d["name"],
            "Labor market size": +d["Labor market size"], 
            "IKAs market": +d["IKAs market"],
            "IKAs Percentage": +d["IKAs Percentage"]
        });
    });
    return ikaData;
}

// update ika data
function getIkaData() {
    if (currentRegion == 0){
        var chartData = ikaData.filter(function(el){
            return el.region === "National";
        });
    } else {
        var chartData = ikaData.filter(function(el){
            return el.region === idToName[currentRegion];
        });
    }
    return chartData;
}

// Get all zones names
// Parse zone names (in english) from human capital data
function getZonesNames(rowsCh){
    var names = [];
    rowsCh.forEach(function(e){
        names.push(e.region)
    });
    return names;
}

function updateChartData(){
    connectivityBar.data(getBarData());
    imcoRadar.data(getRadarData());
    chRadar.data(getChRadarData()).highlight(currentRegion);
    logroEBar.data(getLogroEData());
    ikaBar.data(getIkaData());
    hhRegionBar.highlight(idToName[currentRegion]);
}