function barLineChart(){
    var data = [],
        width = 350,
        height = 350,
        margin = {top: 40, right: 75, bottom: 60, left: 75},
        id,  // variable in data to use as identifier
        barsVariables, // list of variables to display as bars
        lineVariables = null, // list of variables to display as lines
        displayName, // // variable in data to use as x axis labels
        transitionTime = 500,
        //color = d3.scaleOrdinal(d3.schemeCategory10),	//Color function,
        barColor = d3.scaleOrdinal(d3.schemeCategory10), //bar Color function
        lineColor = "#f7a1be",
        pointColor = "#f7a1be",
        barAxisLabel = "",
        lineAxisLabel = "",
        barAxisXLabelPos = "-2em",
        barAxisYLabelPos = "-2em",
        leftAxisFormat = '.2s',
        rightAxisFormat = '.0%',
        legend = false,
        //legend = {title: 'title', translateX: 100, translateY: 0, items:['item1','item2']}
        legendContainer = 'legendZone',
        updateData;

    function chart(selection){

        // set the ranges
        var xBar = d3.scaleBand().range([0, width])
            .paddingInner(0.5)
            .paddingOuter(0.25);
        var xGroups  = d3.scaleBand()
            .padding(0.05);
        var xLine = d3.scalePoint().range([0, width]).padding(0.5);
        var yBar = d3.scaleLinear().range([height, 0]);
        var yLine = d3.scaleLinear().range([height, 0]);
        
        // Scale the range of the data
        xBar.domain(data.map(function(d) {return d[displayName]; }));
        xGroups.domain(barsVariables).rangeRound([0, xBar.bandwidth()]);
        xLine.domain(data.map(function(d) { return d[displayName]; }));

        // TODO: Just one bar and one line
        // From here on this must be done for each lien and bar variable
        yBar.domain([0, d3.max(data, function(d) {
            return d[barsVariables[0]];
        })]).nice();
        yLine.domain([0, d3.max(data, function(d) {
            return d[lineVariables[0]];
        })]).nice();

        // define the 1st line
        var valueline = d3.line()
            .x(function(d) { return xLine(d[displayName]); })
            .y(function(d) { return yLine(d[lineVariables[0]]); });
        
        selection.each(function(){
            
            var svg = selection.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("class", "multiBar");

            var g = svg.append("g")
                .attr("class", "g-bar")
                .attr("transform", "translate(" + margin.right + "," +
                       margin.top + ")");

            // legend container variable
            var legendContainerId = this.id + "-" + legendContainer,
                barLegendId = this.id + "-barLegend";
                       
            // Draw bars
            var rect = g.selectAll("g")
                .data(data, function(d){ return d[id]; })
                .enter()
                .append("g")
                .attr("class", "bars")
                .attr("id", function(d){
                    return d[displayName]
                })
                .attr("transform", function(d) {
                    return "translate(" + xBar(d[displayName]) + ",0)"; })
                .selectAll("rect")
                .data(function(d) {
                    return barsVariables.map(function(key) {
                        return {key: key, value: d[key]};
                    });
                })
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("id", function(d){ return d.key;})
                .style("stroke", "none")
                .attr("x", function(d){ return xGroups(d.key); })
                .attr("width", function(d){ return xGroups.bandwidth(); })
                .attr("y", function(d) { return yBar(d.value); })
                .attr("height", function(d) { return height - yBar(d.value); })
                .attr("fill", function(d) { return barColor(d.key); });
            
            // Add the valueline path.
            g.append("path")
                .data([data])
                .attr("class", "line")
                .style("stroke", lineColor)
                .attr("fill", "none")
                .attr("d", valueline);

            // Points for line data (JUST ONE LINE)
            var points = g.selectAll("circle.point")
                .data(data, function(d){ return d[id]; })
                .enter()
                .append("circle")
                .attr("class", "point")
                .style("stroke", pointColor)
                .style("stroke-width", 3)
                .style("fill", "none")
                .attr("cx", function(d){
                    return xLine(d[displayName]);
                })
                .attr("cy", function(d){
                    return yLine(d[lineVariables[0]]);
                })
                .attr("r", function(d){
                    return 2.5;
                });
            
            // Add the X Axis
            var xAxis = d3.axisBottom(xLine)
                .tickSizeInner(0) // the inner ticks will be of size 0
                .tickSizeOuter(0);
                
            g.append("g")
                .attr("transform", "translate(0," + height + ")")
                .attr("class", "axis--x")
                .call(xAxis)
                .selectAll("text")    
                .style("text-anchor", "start")
                .attr("dx", "0em")
                .attr("dy", "2em")
                .attr("transform", "rotate(45)");

            var leftAxis = d3.axisLeft(yBar).tickFormat(d3.format(leftAxisFormat));
            var rightAxis = d3.axisRight(yLine).tickFormat(d3.format(rightAxisFormat));
            // Add the Y0 Axis
            g.append("g")
                .attr("class", "axis-left axisSteelBlue")
                .call(leftAxis)
                .append("text")
                .attr("x", 2)
                .attr("y", yBar(yBar.ticks().pop()))
                .attr("dy", barAxisYLabelPos)
                .attr("dx", barAxisXLabelPos)
                .attr("text-anchor", "start")
                .text(barAxisLabel);

            // Add the Y1 Axis
            g.append("g")
                .attr("class", "axis-right axisRed")
                .attr("transform", "translate( " + width + ", 0 )")
                .call(rightAxis)
                .append("text")
                .attr("x", 2)
                .attr("y", yLine(yLine.ticks().pop()))
                .attr("dy", "-2em")
                .attr("dx", "-2em")
                .attr("text-anchor", "start")
                .text(lineAxisLabel);
                
            // Draw legend box and items
            if (legend !== false & typeof legend === "object") {
                var legendZone = svg.append('g')
                                .attr("id", legendContainerId)
                                .attr("class", "legend");
                
                if (legend.title) {
                    var title = legendZone.append("text")
                        .attr("class", "title")
                        .attr('transform',
                                  `translate(${legend.translateX},${legend.translateY})`)
                        .attr("x", width - 70)
                        .attr("y", 10)
                        .attr("font-size", "12px")
                        .attr("fill", "#737373")
                        .text(legend.title);
                }
                
                var barLegend = legendZone.append("g")
                    .attr("id", barLegendId)
                    .attr("class", "legend")
                    .attr("height", 100)
                    .attr("width", 200)
                    .attr('transform',
                          `translate(${legend.translateX},${legend.translateY + 5})`);
                
                // Create rectangles markers
                barLegend.selectAll('rect')
                    .data(legend.itemsBar.reverse())
                    .enter()
                    .append("rect")
                    .attr("x", width - 55)
                    .attr("y", function(d, i){return i * 20 + 20; })
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("fill", function(d, i){ return barColor(d);})
                
                // Create labels
                barLegend.selectAll('text')
                    .data(legend.itemsBar.reverse())
                    .enter()
                    .append("text")
                    .attr("x", width - 40)
                    .attr("y", function(d, i){return i * 20 + 20; })
                    .attr("font-size", "11px")
                    .attr("fill", "#737373")
                    .attr("dy", ".75em")
                    .attr("text-anchor", "start")
                    .text(function(d) { return d; });
                    
                if (lineVariables != null){
                    
                    barLegend.selectAll('line')
                        .data(legend.itemsLine.reverse())
                        .enter()
                        .append("path")
                        .attr("d", function(d,i){
                            return "m " + (width - 55) + " " + (i * 20 + 65) +
                                " l 10 0"
                        })
                        .attr("stroke", lineColor);
                    
                    barLegend.selectAll("circle")
                    .data(legend.itemsLine.reverse())
                        .enter()
                        .append("circle")
                        .attr("cx", function(d,i){
                            return (width -50);
                        })
                        .attr("cy", function(d,i){
                            return (i * 20 + 65);
                        })
                        .attr("r", 2.5)
                        .attr("x", width - 55)
                    // TODO: The start point must be calculated
                        .attr("y", function(d, i){return i * 20 + 60; })
                        .attr("fill", lineColor);

                    barLegend.selectAll('text-line')
                        .data(lineVariables.reverse())
                        .enter()
                        .append("text")
                        .attr("x", width - 40)
                        .attr("y", function(d, i){return i * 20 + 60; })
                        .attr("font-size", "11px")
                        .attr("fill", "#737373")
                        .attr("dy", ".75em")
                        .attr("text-anchor", "start")
                        .text(function(d) { return d; });
                }
            }

            updateData = function(){
                // Scale the range of the data
                xBar.domain(data.map(function(d) {return d[displayName]; }));
                xGroups.domain(barsVariables).rangeRound([0, xBar.bandwidth()]);
                xLine.domain(data.map(function(d) { return d[displayName]; }));

                // TODO: Just one bar and one line
                // From here on this must be done for each lien and bar variable
                yBar.domain([0, d3.max(data, function(d) {
                    return d[barsVariables[0]];
                })]).nice();
                yLine.domain([0, d3.max(data, function(d) {
                    return d[lineVariables[0]];
                })]).nice();

                valueline = d3.line()
                    .x(function(d) { return xLine(d[displayName]); })
                    .y(function(d) { return yLine(d[lineVariables[0]]); });

                var barGroups = selection.select(".g-bar").selectAll(".bars")
                    .data(data, function(d){return d[id]});

                //console.log(barGroups.data())
                var xAxisUpdate = selection.select(".axis--x"),
                    leftAxisUpdate = selection.select(".axis-left"),
                    rightAxisUpdate = selection.select(".axis-right");
                
                leftAxisUpdate
                    .transition(transitionTime)
                    .call(leftAxis);
                rightAxisUpdate
                    .transition(transitionTime)
                    .call(rightAxis);
                xAxisUpdate
                    .transition(transitionTime)
                    .call(xAxis)
                    .selectAll("text")    
                    .style("text-anchor", "start")
                    .attr("dx", "0em")
                    .attr("dy", "2em")
                    .attr("transform", "rotate(45)");

                var barGroupsEnter = barGroups.enter()
                    .append("g")
                    .attr("class", "bars")
                    .attr("id", function(d){
                        return d[displayName]
                    })
                    .attr("transform", function(d) {
                        return "translate(" + xBar(d[displayName]) + ",0)"; })
                    .selectAll("rect")
                    .data(function(d) {
                        return barsVariables.map(function(key) {
                            return {key: key, value: d[key]};
                        });
                    })
                    .enter()
                    .append("rect")
                    .attr("id", function(d){ return d.key;})
                    .style("stroke", "none")
                    .attr("x", function(d){ return xGroups(d.key); })
                    .attr("width", function(d){ return xGroups.bandwidth(); })
                    .attr("y", function(d) { return yBar(d.value); })
                    .attr("height", function(d) { return height - yBar(d.value); })
                    .attr("fill", function(d) { return barColor(d.key); });

                barGroups.exit().remove();

                var lineUpdate = selection.select(".g-bar").select(".line")
                    .data([data])
                    .transition(transitionTime)
                    .attr("d", valueline);
                
                var points = selection.select(".g-bar").selectAll("circle.point")
                    .data(data, function(d){ return d[id]; });

                points
                    .transition(transitionTime)
                    .attr("cx", function(d){
                        return xLine(d[displayName]);
                    })
                    .attr("cy", function(d){
                        return yLine(d[lineVariables[0]]);
                    });

                points.enter()
                    .append("circle")
                    .transition(transitionTime)
                    .attr("class", "point")
                    .style("stroke", pointColor)
                    .style("stroke-width", 3)
                    .style("fill", "none")
                    .attr("cx", function(d){
                        return xLine(d[displayName]);
                    })
                    .attr("cy", function(d){
                        return yLine(d[lineVariables[0]]);
                    })
                    .attr("r", function(d){
                        return 2.5;
                    });
                
                points.exit().transition(transitionTime).remove();
                
            }

        })

    }
        
     chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.margin = function(value) {
        if (!arguments.length) return margin;
        margin = value;
        return chart;
    };

    chart.id = function(value) {
        if (!arguments.length) return id;
        id = value;
        return chart;
    };
    
    chart.lineVariables = function(value) {
        if (!arguments.length) return lineVariables;
        lineVariables = value;
        return chart;
    };

    chart.barsVariables = function(value) {
        if (!arguments.length) return barsVariables;
        barsVariables = value;
        return chart;
    };

    
    chart.displayName = function(value) {
        if (!arguments.length) return displayName;
        displayName = value;
        return chart;
    };


    chart.transitionTime = function(value) {
        if (!arguments.length) return transitionTime;
        transitionTime = value;
        return chart;
    };    

    chart.color = function(value) {
        if (!arguments.length) return color;
        color = value;
        return chart;
    };

    chart.legend = function(value) {
        if (!arguments.length) return legend;
        legend = value;
        return chart;
    };

    chart.legendContainer = function(value) {
        if (!arguments.length) return legendContainer;
        legendContainer = value;
        return chart;
    };

    chart.data = function(value) {        
        if (!arguments.length) return data;
        data = value;
        if (typeof updateData === 'function') updateData();
        return chart;
    };

    chart.barColor = function(value) {
        if (!arguments.length) return barColor;
        barColor = value;
        return chart;
    };
    
    chart.lineColor = function(value) {
        if (!arguments.length) return lineColor;
        lineColor = value;
        return chart;
    };
    
    chart.pointColor = function(value) {
        if (!arguments.length) return pointColor;
        pointColor = value;
        return chart;
    };
    
    chart.leftAxisFormat = function(value) {
        if (!arguments.length) return leftAxisFormat;
        leftAxisFormat = value;
        return chart;
    };
    
    chart.rightAxisFormat = function(value) {
        if (!arguments.length) return rightAxisFormat;
        rightAxisFormat = value;
        return chart;
    };

    chart.transitionTime = function(value) {
        if (!arguments.length) return transitionTime;
        transitionTime = value;
        return chart;
    };
    
    chart.barAxisLabel = function(value) {
        if (!arguments.length) return barAxisLabel;
        barAxisLabel = value;
        return chart;
    };

    chart.barAxisXLabelPos = function(value) {
        if (!arguments.length) return barAxisXLabelPos;
        barAxisXLabelPos = value;
        return chart;
    };

    chart.barAxisYLabelPos = function(value) {
        if (!arguments.length) return barAxisYLabelPos;
        barAxisYLabelPos = value;
        return chart;
    };

    chart.lineAxisLabel = function(value) {
        if (!arguments.length) return lineAxisLabel;
        lineAxisLabel = value;
        return chart;
    };

    return chart;

}
