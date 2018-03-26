var barCfg ={
    "parent_container": "#barChart",
    "width": 350,
    "height": 300,
    "margin": {top: 100, right: 30, bottom: 30, left: 45}
}

var x = d3.scaleBand().rangeRound([0,barCfg.width]).paddingInner(0.1),
    y = d3.scaleLinear().rangeRound([barCfg.height - barCfg.margin.top, 0]);

var xAxis = d3.axisTop()
    .tickSizeInner(0) // the inner ticks will be of size 0
    .tickSizeOuter(0)
    .scale(x);

var yAxis = d3.axisLeft()
    .tickSizeOuter(0)
    .scale(y);

var gBar


function initChart(){
    var parent = d3.select(barCfg.parent_container);

    //Remove whatever chart with the same id/class was present before
    parent.select("svg").remove();

    //Initiate the radar chart SVG
    var svgBar = parent.append("svg")    
	.attr("width",  barCfg.width + barCfg.margin.left + barCfg.margin.right)
	.attr("height", barCfg.height + barCfg.margin.top + barCfg.margin.bottom)
	.attr("class", "bar");

    // var svgBar = d3.select(barCfg["container_svg"]),
    // margin = barCfg["margin"],
    // width = +svgBar.attr(barCfg["width"]) - margin.left - margin.right,
    // height = +svgBar.attr(barCfg["width"]) - margin.top - margin.bottom;


 
 
    gBar = svgBar.append("g")
        .attr("transform", "translate(" + barCfg.margin.left + "," +
              barCfg.margin.top + ")");

    console.log(gBar)
    
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
        .attr("transform", "translate(0," +  (barCfg.height - barCfg.margin.top) + ")")
        .call(xAxis)
        .selectAll("text")    
        .style("text-anchor", "start")
        .attr("dx", "0em")
        .attr("dy", "2em")
        .attr("transform", "rotate(45)");

    gBar.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis.ticks())
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
        .attr("x", barCfg.width - 95)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", function(d,i){ return stackColors[i];});

    legend.append("text")
        .attr("x", barCfg.width - 70)
        .attr("y", 9)
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .text(function(d) { return d; });

    return svgBar;
}



function updateChart(element){

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

    // var gBar = element.selectAll("g")
    // console.log(gBar)
    
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
