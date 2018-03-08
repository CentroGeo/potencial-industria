

// Set basic functions for styling the map
var rateById = d3.map(); // will hold the map from ids to property values
var colors5 = ['#ffffb2','#fecc5c','#fd8d3c','#f03b20','#bd0026']; // 5 color scheme
var quantile = d3.scale.quantile() 
    .range(d3.range(5).map(function(i) { return colors5[i]; })); // quantile scale with 5 classes

// map and base layer
var map = L.map('mapdiv').setView([23.8, -80.9], 5);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Load json data
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
            makeMap(regiones, ciudades)
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
    layer.on('click', layerClick);
}

function layerClick(event){
    layer = event.target;
    feature = layer.feature;
    //console.log(feature, layer, event);
    //console.log('last clicked: '+lastClickedLayer.feature.properties.region);
    //console.log('is clicked: '+feature.properties.is_clicked);
    if (feature.properties.is_clicked == false){ // feature not clicked, so zoom in
        if(lastClickedLayer){ // when a region is clicked and you click another, reset previous one
            //console.log('last clicked: '+lastClickedLayer.feature.properties.region);
            regionesLyr.resetStyle(lastClickedLayer);
            lastClickedLayer.feature.properties.is_clicked = false;
            $(lastClickedLayer.getElement()).removeClass("regionZoomed");
            $(lastClickedLayer.getElement()).addClass("regionStyle");
        }
        lastClickedLayer = layer;
        currentRegion = feature.properties.id;
        //console.log('current: '+currentRegion, feature.properties.region);
        $("#title").html('<h1>' + feature.properties.region + '</h1>');
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
    }
}

$("#restart").on('click', function(){ 
    if(lastClickedLayer){
        regionesLyr.resetStyle(lastClickedLayer);
        $(lastClickedLayer.getElement()).removeClass("regionZoomed");
        $(lastClickedLayer.getElement()).addClass("regionStyle");
        lastClickedLayer.feature.properties.is_clicked = false;
    }
    lastClickedLayer = null;
    $("#title").html('<h1>México</h1>');
    map.flyTo([23.8, -80.9], 5) 
});
