var x,
    y,
    xAxis,
    yAxis,
    gBar,
    barCfg;

function initChart(container, stackedData, stackVariables, options){

    barCfg ={
        "width": 350,
        "height": 300,
        "margin": {top: 100, right: 30, bottom: 30, left: 45},
        "transition_duration": 500,
        "stackColors": ['#d8b365','#5ab4ac']
    };

    x = d3.scaleBand().rangeRound([0,barCfg.width]).paddingInner(0.1),
    y = d3.scaleLinear().rangeRound([barCfg.height - barCfg.margin.top, 0]);

    xAxis = d3.axisTop()
        .tickSizeInner(0) // the inner ticks will be of size 0
        .tickSizeOuter(0)
        .scale(x);

    yAxis = d3.axisLeft()
        .tickSizeOuter(0)
        .scale(y);

   // check if options are set, else use defaults
    if('undefined' !== typeof options){
	for(var i in options){
	    if('undefined' !== typeof options[i]){ barCfg[i] = options[i]; }
	}
    }  
    var parent = d3.select(container);

    //Remove whatever chart with the same id/class was present before
    parent.select("svg").remove();

    //Initiate the radar chart SVG
    var svgBar = parent.append("svg")    
	.attr("width",  barCfg.width + barCfg.margin.left + barCfg.margin.right)
	.attr("height", barCfg.height + barCfg.margin.top + barCfg.margin.bottom)
	.attr("class", "bar");

    gBar = svgBar.append("g")
        .attr("transform", "translate(" + barCfg.margin.left + "," +
              barCfg.margin.top + ")");

    x.domain(getxDomain(stackedData));
    y.domain(getyDomain(stackedData));
    gBar.selectAll(".bar")
        .data(stackedData, function(d){return d.id;})
        .enter().append("g")
        .attr("id", function(d){return d.id;})
        .attr("class", "ciudad")
        .selectAll("rect")
        .data(function(d){return d.data;}, function(d){return d.id;})
        .enter()
        .append("rect")
        /*.attr("class", function(d){
            if(d.id == -1){
                return "bar-avg";
            } else{
                return "bar";
            }
        })*/
        .attr("stroke-dasharray", function(d, i){
            if(d.id == -1){
                if (i == 1){ // if top bar
                    return (x.bandwidth()+y(d.start) - y(d.end)+", "+(x.bandwidth()));
                } else if (i == 0){ //if bottom bar
                    return ("0, "+x.bandwidth()+", "+2*(y(d.start) - y(d.end)+(x.bandwidth())));
                }
            } else{
                return "none";
            }
        })
        .attr("stroke", function(d){
            if(d.id == -1){
                return "blue";
            } else{
                return "none";
            }
        })
        .attr("stroke-width", 2)
        .attr("x", function(d) {return x(d.nombre);})
        .attr("y", function(d) {return y(d.end);})
        .attr("fill", function(d,i) {return barCfg.stackColors[i];})
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
        .data(stackVariables.reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; })
        .style("font", "10px sans-serif");

    legend.append("rect")
        .attr("x", barCfg.width - 95)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", function(d,i){ return barCfg.stackColors[i];});

    legend.append("text")
        .attr("x", barCfg.width - 70)
        .attr("y", 9)
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .text(function(d) { return d; });

    return svgBar;
}

function updateChart(element, data){

    x.domain(getxDomain(data));
    y.domain(getyDomain(data));
    
    var barsUpdate = gBar.selectAll(".ciudad")
        .data(data, function(d){return d.id;});
    
    var t = barsUpdate.transition()
        .duration(barCfg.transition_duration);
    
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
        .attr("fill", function(d,i) {return barCfg.stackColors[i];})
        .attr("width", x.bandwidth())
        .attr("height", function(d,i) {return y(d.start) - y(d.end);});

    barsUpdate.selectAll("rect")
        .transition(t)
        .attr("x", function(d) {return x(d.nombre);})
        .attr("y", function(d, i) {return y(d.end);})
        .attr("fill", function(d,i) {return barCfg.stackColors[i];})
        .attr("width", x.bandwidth())
        .attr("height", function(d,i) {return y(d.start) - y(d.end);})
        .attr("stroke-dasharray", function(d, i){
            if(d.id == -1){
                if (i == 1){ // if top bar
                    return (x.bandwidth()+y(d.start) - y(d.end)+", "+(x.bandwidth()));
                } else if (i == 0){ //if bottom bar
                    return ("0, "+x.bandwidth()+", "+2*(y(d.start) - y(d.end)+(x.bandwidth())));
                }
            } else{
                return "none";
            }
        })
        .attr("stroke", function(d){
            if(d.id == -1){
                return "blue";
            } else{
                return "none";
            }
        })
        .attr("stroke-width", 2);

    gBar.select(".axis--y").transition(t).call(yAxis);
    
    gBar.select(".axis--x").transition(t).call(xAxis)
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("dx", "0em")
        .attr("dy", "2em")
        .attr("transform", "rotate(45)");
};

function getxDomain(data){
    // get X domain from stacked data
    // Note it assumes x axis moves with nombre variable

    var xDomain = [];
    data.forEach(function(e){
        xDomain.push(e.data[0].nombre);
    });
    return xDomain;
};

function getyDomain(data){
    var yDomain = [];
    data.forEach(function(e){
        yDomain.push(e.data[1].end); // End always stores the sum of stacks.
    })
    return [0, d3.max(yDomain)];
}
