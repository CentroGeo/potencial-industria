/////////////////////////////////////////////////////////
/////////////// The Radar Chart Function ////////////////
/// mthh - 2017 /////////////////////////////////////////
// Inspired by the code of alangrafu and Nadieh Bremer //
// (VisualCinnamon.com) and modified for d3 v4 //////////
/////////////////////////////////////////////////////////

const max = Math.max;
const sin = Math.sin;
const cos = Math.cos;
const HALF_PI = Math.PI / 2;
var radarLine,
    radarCfg,
    wrap,
    radarLegend,
    pos;
var imcoVarsDict = {
    "sis_dere": "Legal System",
    "sis_poli": "Political System",
    "man_ambi": "Environment",
    "soc_incl": "Inclusive Society",
    "gob_efic": "Efficient Government",
    "merc_fac": "Market Factors",
    "eco_esta": "Economic Stability",
    "precur": "Infrastructure",
    "rela_inte": "International Relationships",
    "inno_eco": "Economic Innovation"
}


const RadarChart = function RadarChart(parent_selector, data, options) {
    //Wraps SVG text - Taken from http://bl.ocks.org/mbostock/7555321
    wrap = (text, width) => {
	text.each(function() {
	    var text = d3.select(this),
		words = text.text().split(/\s+/).reverse(),
		word,
		line = [],
		lineNumber = 0,
		lineHeight = 1.4, // ems
		y = text.attr("y"),
		x = text.attr("x"),
		dy = parseFloat(text.attr("dy")),
		tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

	    while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
	    }
	});
    }//wrap

    radarCfg = {
	w: 600,				//Width of the circle
	h: 600,				//Height of the circle
	margin: {top: 20, right: 20, bottom: 20, left: 20}, //The margins of the SVG
	levels: 3,				//How many levels or inner circles should there be drawn
	maxValue: 0, 			//What is the value that the biggest circle will represent
	labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
	wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
	opacityArea: 0.35, 	//The opacity of the area of the blob
	dotRadius: 4, 			//The size of the colored circles of each blog
	opacityCircles: 0.1, 	//The opacity of the circles of each blob
	strokeWidth: 2, 		//The width of the stroke around each blob
	roundStrokes: false,	//If true the area and stroke will follow a round path (2cardinal-closed)
	color: d3.scaleOrdinal(d3.schemeCategory10),	//Color function,
	format: '.2%',
	unit: '',
	legend: false,
    transition_duration: 500
    };

    //Put all of the options into a variable called radarRadarCfg
    if('undefined' !== typeof options){
	for(var i in options){
	    if('undefined' !== typeof options[i]){ radarCfg[i] = options[i]; }
	}//for i
    }//if

    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    // var maxValue = max(radarRadarCfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
    let maxValue = 0;
    for (let j=0; j < data.length; j++) {
	for (let i = 0; i < data[j].axes.length; i++) {
	    data[j].axes[i]['id'] = data[j].name;
	    if (data[j].axes[i]['value'] > maxValue) {
		maxValue = data[j].axes[i]['value'];
	    }
	}
    }
    maxValue = max(radarCfg.maxValue, maxValue);

    const allAxis = data[0].axes.map((i, j) => i.axis),	//Names of each axis
	  total = allAxis.length,					//The number of different axes
	  radius = Math.min(radarCfg.w/2, radarCfg.h/2), 	//Radius of the outermost circle
	  Format = d3.format(radarCfg.format),			 	//Formatting
	  angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

    //Scale for the radius
     rScale = d3.scaleLinear()
	  .range([0, radius])
	  .domain([0, maxValue]);

    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////
    const parent = d3.select(parent_selector);

    //Remove whatever chart with the same id/class was present before
    parent.select("svg").remove();

    //Initiate the radar chart SVG
    let svg = parent.append("svg")
	.attr("width",  radarCfg.w + radarCfg.margin.left + radarCfg.margin.right)
	.attr("height", radarCfg.h + radarCfg.margin.top + radarCfg.margin.bottom)
	.attr("class", "radar");

    //Append a g element
    let g = svg.append("g")
	.attr("transform", "translate(" + (radarCfg.w/2 + radarCfg.margin.left) + "," + (radarCfg.h/2 + radarCfg.margin.top) + ")");

    /////////////////////////////////////////////////////////
    ////////// Glow filter for some extra pizzazz ///////////
    /////////////////////////////////////////////////////////

    //Filter for the outside glow
    let filter = g.append('defs').append('filter').attr('id','glow'),
	feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
	feMerge = filter.append('feMerge'),
	feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
	feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');

    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////

    //Wrapper for the grid & axes
    let axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    axisGrid.selectAll(".levels")
	.data(d3.range(1,(radarCfg.levels+1)).reverse())
	.enter()
	.append("circle")
	.attr("class", "gridCircle")
	.attr("r", d => radius / radarCfg.levels * d)
	.style("fill", "#CDCDCD")
	.style("stroke", "#CDCDCD")
	.style("fill-opacity", radarCfg.opacityCircles)
	.style("filter" , "url(#glow)");

    //Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
	.data(d3.range(1,(radarCfg.levels+1)).reverse())
	.enter().append("text")
	.attr("class", "axisLabel")
	.attr("x", 4)
	.attr("y", d => -d * radius / radarCfg.levels)
	.attr("dy", "0.4em")
	.style("font-size", "10px")
	.attr("fill", "#737373")
	.text(d => Format(maxValue * d / radarCfg.levels) + radarCfg.unit);

    /////////////////////////////////////////////////////////
    //////////////////// Draw the axes //////////////////////
    /////////////////////////////////////////////////////////

    //Create the straight lines radiating outward from the center
    var axis = axisGrid.selectAll(".axis")
	.data(allAxis)
	.enter()
	.append("g")
	.attr("class", "axis");
    //Append the lines
    axis.append("line")
	.attr("x1", 0)
	.attr("y1", 0)
	.attr("x2", (d, i) => rScale(maxValue *1.1) * cos(angleSlice * i - HALF_PI))
	.attr("y2", (d, i) => rScale(maxValue* 1.1) * sin(angleSlice * i - HALF_PI))
	.attr("class", "line")
	.style("stroke", "white")
	.style("stroke-width", "2px");

    //Append the labels at each axis
    axis.append("text")
	.attr("class", "legend")
	.style("font-size", "11px")
	.attr("text-anchor", "middle")
	.attr("dy", "0.35em")
	.attr("x", (d,i) => rScale(maxValue * radarCfg.labelFactor) * cos(angleSlice * i - HALF_PI))
	.attr("y", (d,i) => rScale(maxValue * radarCfg.labelFactor) * sin(angleSlice * i - HALF_PI))
	.text(d => imcoVarsDict[d])
	.call(wrap, radarCfg.wrapWidth);

    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////

    //The radial line function
    radarLine = d3.radialLine()
	  .curve(d3.curveLinearClosed)
	  .radius(d => rScale(d.value))
	  .angle((d,i) => i * angleSlice);

    if(radarCfg.roundStrokes) {
	radarLine.curve(d3.curveCardinalClosed)
    }

    //Create a wrapper for the blobs
    const blobWrapper = g.selectAll(".radarWrapper")
	  .data(data, function(d){
              return d.name;
          })
	  .enter().append("g")
	  .attr("class", "radarWrapper");

    //Append the backgrounds
    blobWrapper
	.append("path")
	.attr("class", "radarArea")
	.attr("d", d => radarLine(d.axes))
	.style("fill", (d,i) => radarCfg.color(d))
	.style("fill-opacity", radarCfg.opacityArea)
	.on('mouseover', function(d, i) {
	    //Dim all blobs
	    parent.selectAll(".radarArea")
		.transition().duration(radarCfg.transition_duration)
		.style("fill-opacity", 0.1);
	    //Bring back the hovered over blob
	    d3.select(this)
		.transition().duration(radarCfg.transition_duration)
		.style("fill-opacity", 0.7);
	})
	.on('mouseout', () => {
	    //Bring back all blobs
	    parent.selectAll(".radarArea")
		.transition().duration(radarCfg.transition_duration)
		.style("fill-opacity", radarCfg.opacityArea);
	});

    //Create the outlines
    blobWrapper.append("path")
	.attr("class", "radarStroke")
	.attr("d", function(d,i) { return radarLine(d.axes); })
	.style("stroke-width", radarCfg.strokeWidth + "px")
	.style("stroke", (d,i) => radarCfg.color(d))
	.style("fill", "none")
	.style("filter" , "url(#glow)");

    //Append the circles
    blobWrapper.selectAll(".radarCircle")
	.data(d => d.axes)
	.enter()
	.append("circle")
	.attr("class", "radarCircle")
	.attr("r", radarCfg.dotRadius)
	.attr("cx", (d,i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
	.attr("cy", (d,i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
	.style("fill", (d) => radarCfg.color(d))
	.style("fill-opacity", 0.8);

    /////////////////////////////////////////////////////////
    //////// Append invisible circles for tooltip ///////////
    /////////////////////////////////////////////////////////

    //Wrapper for the invisible circles on top
    const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
	  .data(data)
	  .enter().append("g")
	  .attr("class", "radarCircleWrapper");

    //Append a set of invisible circles on top for the mouseover pop-up
    blobCircleWrapper.selectAll(".radarInvisibleCircle")
	.data(d => d.axes)
	.enter().append("circle")
	.attr("class", "radarInvisibleCircle")
	.attr("r", radarCfg.dotRadius * 1.5)
	.attr("cx", (d,i) => rScale(d.value) * cos(angleSlice*i - HALF_PI))
	.attr("cy", (d,i) => rScale(d.value) * sin(angleSlice*i - HALF_PI))
	.style("fill", "none")
	.style("pointer-events", "all")
	.on("mouseover", function(d,i) {
	    tooltip
		.attr('x', this.cx.baseVal.value - 10)
		.attr('y', this.cy.baseVal.value - 10)
		.transition()
		.style('display', 'block')
		.text(Format(d.value) + radarCfg.unit);
	})
	.on("mouseout", function(){
	    tooltip.transition()
		.style('display', 'none').text('');
	});

    const tooltip = g.append("text")
	  .attr("class", "tooltip")
	  .attr('x', 0)
	  .attr('y', 0)
	  .style("font-size", "12px")
	  .style('display', 'none')
	  .attr("text-anchor", "middle")
	  .attr("dy", "0.35em");

    if (radarCfg.legend !== false && typeof radarCfg.legend === "object") {
        let legendZone = svg.append('g').attr("id", "legendZone");
        let names = data.map(el => el.name);
        pos  = d3.scaleBand().rangeRound([0, radarCfg.h]);
        pos.domain(names);
        if (radarCfg.legend.title) {
            let title = legendZone.append("text")
        	.attr("class", "title")
        	.attr('transform', `translate(${radarCfg.legend.translateX},${radarCfg.legend.translateY})`)
        	.attr("x", radarCfg.w - 70)
        	.attr("y", 10)
        	.attr("font-size", "12px")
        	.attr("fill", "#404040")
        	.text(radarCfg.legend.title);
        }
        radarLegend = legendZone.append("g")
            .attr("id", "radarLegend")
            .attr("class", "legend")
            .attr("height", 100)
            .attr("width", 200)
            .attr('transform', `translate(${radarCfg.legend.translateX},${radarCfg.legend.translateY + 20})`);
        
        // Create rectangles markers
        radarLegend.selectAll('rect')
            .data(names, function(d){return d;})
            .enter()
            .append("rect")
            //.attr("x", radarCfg.w - 65)
            //.attr("y", (d,i) => i * 20)
            .attr("x", radarCfg.w - 55)
	    .attr("y", function(d){return pos(d)-9;})
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", (d,i) => radarCfg.color(d));
        // Create labels
        radarLegend.selectAll('text')
            .data(names, function(d){return d;})
            .enter()
            .append("text")
            //.attr("x", radarCfg.w - 52)
            //.attr("y", (d,i) => i * 20 + 9)
            .attr("x", radarCfg.w - 40)
	    .attr("y", function(d){return pos(d);})
            .attr("font-size", "11px")
            .attr("fill", "#737373")
            .text(d => d);
    }
    return svg;
}

function updateRadar(parent_selector, data) {
    var g = d3.select(parent_selector).select("g");
    const allAxis = data[0].axes.map((i, j) => i.axis),	
	  total = allAxis.length,
	  radius = Math.min(radarCfg.w/2, radarCfg.h/2),
	  Format = d3.format(radarCfg.format),
	  angleSlice = Math.PI * 2 / total;
    
    let maxValue = 0;
    for (let j=0; j < data.length; j++) {
	for (let i = 0; i < data[j].axes.length; i++) {
	    data[j].axes[i]['id'] = data[j].name;
	    if (data[j].axes[i]['value'] > maxValue) {
		maxValue = data[j].axes[i]['value'];
	    }
	}
    }
    maxValue = max(radarCfg.maxValue, maxValue);

     rScale = d3.scaleLinear()
	  .range([0, radius])
	  .domain([0, maxValue]);

    //Text indicating at what % each level is
    g.selectAll(".axisLabel")
	.text(d => Format(maxValue * d / radarCfg.levels) + radarCfg.unit).transition();

    g.selectAll(".axis line")
        .attr("x1", 0)
	.attr("y1", 0)
	.attr("x2", (d, i) => rScale(maxValue *1.1) * cos(angleSlice * i - HALF_PI))
	.attr("y2", (d, i) => rScale(maxValue* 1.1) * sin(angleSlice * i - HALF_PI))

    g.selectAll(".axis text")
        .attr("x", (d,i) => rScale(maxValue * radarCfg.labelFactor) * cos(angleSlice * i - HALF_PI))
	.attr("y", (d,i) => rScale(maxValue * radarCfg.labelFactor) * sin(angleSlice * i - HALF_PI))
	.text(d => imcoVarsDict[d])
	.call(wrap, radarCfg.wrapWidth);
    
    if (radarCfg.roundStrokes) {
	radarLine.curve(d3.curveCardinalClosed)
    }
    
    var radarWrapperUpdate = g.selectAll(".radarWrapper")
	.data(data, function(d){return d.name;});
    //Append the backgrounds

    var radarWrapperEnter = radarWrapperUpdate.enter().append("g")
	.attr("class", "radarWrapper");
    
    var radarAreaEnter = radarWrapperEnter.append("path")
        .transition(500)
	.attr("class", "radarArea")
	.attr("d", d => radarLine(d.axes))
	.style("fill", d => radarCfg.color(d.name))
	.style("fill-opacity", radarCfg.opacityArea);

    //Create the outlines
    var radarStrokeEnter = radarWrapperEnter.append("path")
        .transition(500)
	.attr("class", "radarStroke")
	.attr("d", function(d,i) { return radarLine(d.axes); })
	.style("stroke-width", radarCfg.strokeWidth + "px")
	.style("stroke", d => radarCfg.color(d.name))
	.style("fill", "none")
	.style("filter" , "url(#glow)");

            // var a = []
            // d.axes.forEach(function(e){
            //     a.push([d.name, d.axes])
            // })
            // return a;

    
    //Append the circles
    var radarCircleEnter = radarWrapperEnter.selectAll(".radarCircle")
	.data(d => d.axes)
	.enter()
	.append("circle")
        .transition(500)
	.attr("class", "radarCircle")
	.attr("r", radarCfg.dotRadius)
	.attr("cx", (d,i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
	.attr("cy", (d,i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
	.style("fill", d => radarCfg.color(d.name))
	.style("fill-opacity", 0.8);
    
    radarWrapperUpdate.exit().remove();

    let names = data.map(el => el.name);
    pos.domain(names);
    
    var radarLegendSquareUpdate = radarLegend.selectAll("rect")
        .data(names, function(d){ return d;})
        .attr("id", function(d,i){return i;})
	.attr("x", radarCfg.w - 55)
	.attr("y", function(d){return pos(d)-9;})
	.attr("width", 10)
	.attr("height", 10)
	.style("fill", (d,i) => radarCfg.color(d));
    
    var radarLegendTextUpdate = radarLegend.selectAll("text")
        .data(names, function(d){ return d;})
        .attr("x", radarCfg.w - 40)
	.attr("y", function(d){return pos(d);})
	.attr("font-size", "11px")
	.attr("fill", "#737373")
	.text(d => d);

    var radarLegendSquareEnter = radarLegendSquareUpdate.enter();
    var radarLegendTextEnter = radarLegendTextUpdate.enter();

    var legendSquares = radarLegendSquareEnter.append("rect")
        .attr("id", function(d,i){return i;})
	.attr("x", radarCfg.w - 55)
	.attr("y", function(d){return pos(d)-9;})
	.attr("width", 10)
	.attr("height", 10)
	.style("fill", (d,i) => radarCfg.color(d));

    var legendTexts = radarLegendTextEnter.append("text")
	.attr("x", radarCfg.w - 40)
	.attr("y", function(d){return pos(d);})
	.attr("font-size", "11px")
	.attr("fill", "#737373")
	.text(d => d);

    radarLegendSquareUpdate.exit().remove();
    radarLegendTextUpdate.exit().remove();    

};
