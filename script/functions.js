// Setup stuff for the bar chart
var svg = d3.select("svg"),
    margin = {top: 100, right: 30, bottom: 30, left: 45},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;


 var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1),
     y = d3.scaleLinear().rangeRound([height - margin.top, 0]);

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Set basic functions for styling the map
var rateById = d3.map(); // will hold the map from ids to property values
var colors5 = ['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']; // 5 color scheme
var quantile = d3.scaleQuantile() 
    .range(d3.range(5).map(function(i) { return colors5[i]; })); // quantile scale with 5 classes

// map and base layer
var map = L.map('mapdiv').setView([23.8, -80.9], 5);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Load json data
var properties; // properties for each city
var q = d3.queue();
q.defer(d3.json, "data/regiones.geojson")
    .defer(d3.json, "data/ciudades.geojson")
    .await(function(error, regiones, ciudades) {
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
                properties.push(dict)
            });

            makeMap(regiones, ciudades);
            makeChart();
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
            return{
                weight: 0.5,
                color: "#999",
                opacity: 1,
                fillColor: quantile(rateById.get(feature.properties.id)),
                fillOpacity: 0.8  
            };
        },
        interactive: false
    }).addTo(map);

    //var isClicked = false;

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
    makeChart()
    //console.log(feature, layer, event);
    //console.log('last clicked: '+lastClickedLayer.feature.properties.region);
    //console.log('is clicked: '+feature.properties.is_clicked);
    if (feature.properties.is_clicked == false){ // feature not clicked, so zoom in
        if (lastClickedLayer){ // when a region is clicked and you click another, reset previous one
            //console.log('last clicked: '+lastClickedLayer.feature.properties.region);
            regionesLyr.resetStyle(lastClickedLayer);
            lastClickedLayer.feature.properties.is_clicked = false;
            $(lastClickedLayer.getElement()).removeClass("regionZoomed");
            $(lastClickedLayer.getElement()).addClass("regionStyle");
        }
        lastClickedLayer = layer;
        currentRegion = feature.properties.id_0;
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
        
        //console.log('current: '+currentRegion, feature.properties.region);
        $("#title").html('<h1>' + feature.properties.zona + '</h1>');
        var featBounds = feature.properties.bounds_calculated;
        var diff = featBounds._southWest.lng - featBounds._northEast.lng
        var newSW = L.latLng(featBounds.getSouth(), featBounds.getWest() - diff);
        var newNE = L.latLng(featBounds.getNorth(), featBounds.getEast() - diff);
        map.flyToBounds(L.latLngBounds(newSW, newNE));
        //console.log(event);
        //layer.setStyle({color: 'red', fillOpacity: 0.0});
        $(layer.getElement()).removeClass("regionStyle");
        $(layer.getElement()).addClass("regionZoomed");
        feature.properties.is_clicked = true;
    } else if (feature.properties.is_clicked == true){ // feature already clicked, so zoom out
        map.flyTo([23.8, -80.9], 5);
        regionesLyr.resetStyle(layer);
        $(layer.getElement()).removeClass("regionZoomed");
        $(layer.getElement()).addClass("regionStyle");
        $("#title").html('<h1>México</h1>');
        feature.properties.is_clicked = false;
        currentRegion = 0;
        $(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");
        $(".icon-previous").css( "display", "none" );
    }
    makeChart()
}

$("#restart").on('click', function(){ 
    if (lastClickedLayer){
        regionesLyr.resetStyle(lastClickedLayer);
        $(lastClickedLayer.getElement()).removeClass("regionZoomed");
        $(lastClickedLayer.getElement()).addClass("regionStyle");
        lastClickedLayer.feature.properties.is_clicked = false;
    }
    lastClickedLayer = null;
    $("#title").html('<h1>México</h1>');
    map.flyTo([23.8, -80.9], 5);
    $(".icon-next .fas").removeClass("fa-reply");
    $(".icon-next .fas").addClass("fa-chevron-right");
});

$(".icon-next").on('click', function(){
    if (lastClickedLayer){ // if something is clicked, reset style
            regionesLyr.resetStyle(lastClickedLayer);
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
        map.flyTo([23.8, -80.9], 5);
        $(".icon-next .fas").removeClass("fa-reply");
        $(".icon-next .fas").addClass("fa-chevron-right");
        $(".icon-previous").css( "display", "none" );
        currentRegion = 0;
    }
});

$(".icon-previous").on('click', function(){
    if (lastClickedLayer){ // if something is clicked, reset style
            regionesLyr.resetStyle(lastClickedLayer);
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
        map.flyTo([23.8, -80.9], 5);
        $(".icon-previous .fas").removeClass("fa-reply");
        $(".icon-previous .fas").addClass("fa-chevron-left");
        $(".icon-previous").css( "display", "none" );
        currentRegion = 0;
    }
});

// function makeChart(){
//     // list of data objetcts (rows)
//     var idToName = {
//         1 : "Noreste",
//         2 : "Centro-Occidente",
//         3 : "Megalopolis",
//         4 : "Noroeste",
//         5 : "Golfo Oriente",
//         6 : "Centro Norte",
//         7 : "Peninsula"
//     };
//     var chartData;
//     if(currentRegion == 0){
//         // at the national extent, display only top 15 values
//         chartData = properties.sort(function(x,y){
//             return d3.descending(x.grado_total, y.grado_total)
//         }).slice(0, 15);
        
//     }else{
//         var filtered = properties.filter(function(el){
//             //console.log(idToName[currentRegion])
//             return el.zona == idToName[currentRegion]
//         });
//         chartData = filtered.sort(function(x,y){
//             return d3.descending(x.grado_total, y.grado_total)
//         });   
//     };
//     var stackColors = ["b33040", "#d25c4d", "#f2b447", "#d9d574"];
//     var variables = ["grado_carretera", "grado_ferrocarril"]
//     var stack = d3.stack();
//     var z = d3.scaleOrdinal(d3.schemeCategory20);
//     //stack.keys(data.columns.slice(1))(data)
//     stacked = stack.keys(variables)(chartData)
//     x.domain(chartData.map(function(d) { return d.nombre; }));
//     y.domain([0, d3.max(chartData, function(d) { return d.grado_total })]);
//     z.domain(variables);
//     //console.log(stacked)
//     g.selectAll(".serie")
//         .data(stacked)
//         .enter().append("g")
//         .attr("class", "serie")
//         .attr("fill", function(d) {
//             //console.log(d.key)
//             return z(d.key);
//         })
//         .selectAll("rect")
//         .data(function(d) {
//             console.log(d)
//             return d;
//         })
//         .enter().append("rect")
//         .attr("x", function(d) {
//             console.log(d.data.nombre)
//             return x(d.data.nombre);
//         })
//         .attr("y", function(d) { return y(d[1]); })
//         .attr("height", function(d) {
//             //console.log(d[0]) - y(d[1])
//             return y(d[0]) - y(d[1]);
//         })
//         .attr("width", x.bandwidth());

//     g.append("g")
//         .attr("class", "axis axis--x")
//         .attr("transform", "translate(0," + (height - margin.top) + ")")
//         .call(d3.axisBottom(x))
//         .selectAll("text")
//         .style("text-anchor", "start")
//         .attr("dx", "0.6em")
//         .attr("dy", "1.05em")
//         .attr("transform", "rotate(45)");

//     g.append("g")
//         .attr("class", "axis axis--y")
//         .call(d3.axisLeft(y).ticks(10, "s"))
//         .append("text")
//         .attr("x", 2)
//         .attr("y", y(y.ticks(10).pop()))
//         .attr("dy", "0.35em")
//         .attr("text-anchor", "start")
//         .attr("fill", "#000")
//         .text("Degree");
    
//     var legend = g.selectAll(".legend")
//         .data(variables.reverse())
//         .enter().append("g")
//         .attr("class", "legend")
//         .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
//         .style("font", "10px sans-serif");

//     legend.append("rect")
//         .attr("x", width - 95)
//         .attr("width", 18)
//         .attr("height", 18)
//         .attr("fill", z);

//     legend.append("text")
//         .attr("x", width - 70)
//         .attr("y", 9)
//         .attr("dy", ".35em")
//         .attr("text-anchor", "start")
//         .text(function(d) { return d; });
// }

function makeChart(){
    chartData = properties.sort(function(x,y){
        return d3.descending(x.grado_total, y.grado_total)
    }).slice(0, 15);
    var stackedData = [];
    chartData.forEach(function(e){stackedData.push({"id":e.id,
                                                    "data":[{"id": e.id,
                                                             "nombre": e.nombre,
                                                             "g0": e.grado_carretera,
                                                             "g1": e.grado_ferrocarril},
                                                            {"id": e.id,
                                                             "nombre": e.nombre,
                                                             "g0": e.grado_carretera,
                                                             "g1": e.grado_ferrocarril}]
                                                   })
                                 });
    x.domain(chartData.map(function(d) { return d.nombre; }));
    y.domain([0, d3.max(chartData, function(d) { return d.grado_total })]);
    var z = d3.scaleOrdinal(d3.schemeCategory20);
    var variables = ["grado_carretera", "grado_ferrocarril"]
    z.domain(variables);    
    // g.append("g")
    //     .attr("class", "axis axis--y")
    //     .call(d3.axisLeft(y).ticks())
    //     .append("text")
    //     .attr("transform", "rotate(-90)")
    //     .attr("y", 6)
    //     .attr("dy", "0.71em")
    //     .attr("text-anchor", "end")
    //     .text("Frequency");

    g.selectAll(".bar")
        .data(stackedData, function(d){return d.id;})
        .enter().append("g")
        .attr("id", function(d){return d.id;})
        .selectAll("rect")
        .data(function(d){
            //console.log(d.data)
            return d.data;
        })
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d) {
            //console.log(i)
            return x(d.nombre);
        })
        .attr("y", function(d, i) {
            if(i == 0){
                //console.log(d.g0)
                return y(d.g0);
            }else{
                console.log(d.g1)
                return y(d.g1);
            }
        })
        .attr("val", function(d,i){
            if(i == 0){
                return d.g0;
            }else{
                return d.g1;
            }
        })
        .attr("fill", function(d,i) {return z(i);})
        .attr("width", x.bandwidth())
        .attr("height", function(d,i) {
            if(i == 0){
                return  y(d.g0);
            }else{
                return y(d.g1);
            }            
        });
    
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")    
        .style("text-anchor", "start")
        .attr("dx", "0.6em")
        .attr("dy", "1.05em")
        .attr("transform", "rotate(45)");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y)        )
        .append("text")
        //ttr("x", 2)
        //ttr("y", y(y.ticks().pop()))
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .attr("fill", "#000")
        .text("Degree");

}