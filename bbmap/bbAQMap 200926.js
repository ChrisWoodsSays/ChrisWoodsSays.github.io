var map, central_map_svg, narrowWindow, reallyNarrowWindow
var margin = { top: 10, right: 0, bottom: 0, left: 0 };
var chart_svg = d3.select("#chart").append("svg")
.append("g");

// set the dimensions and margins of the graph
var optionsNO2_unit = "\u03BCg m\u207B\u00B3"
var circleStrokeThin = 2,
    circleStrokeWide = 8,
    barStrokeWidth = 8
    minLimit = 30, mediumLimit = 36, highLimit = 40,
    colourMin = "#6699cc", colourMedium = "#FFA500",
    colourHigh = "#E74C3C", colourMax = "#bf0000",
    marginCircle = 0

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .style('z-index', '99999999999')
    .offset([-10, 0])
    .html(function (d) {
        return "<strong>" + d.name + "</strong><br>" + 
            //d.site_id + "<br>" + 
            d.site_type + " " + d.type +  "<br>" +  "<br>" +
            "Annual Mean " + d.annual_mean.toFixed(1) + " " + optionsNO2_unit + "<br>" +
            "<span class='colouredTextBackground' style='background-color:" + colourScale(d.annual_mean) + "'> Level " + levelScale(d.annual_mean) + " </span>"
    })

var tipOn = function (d) {
    d.visible = true;
    tip.show(d, document.getElementById("circle" + d.site_id));
    d3.select("#circle" + d.site_id)
        .attr("stroke-width", circleStrokeWide);
    d3.select("#outlineBar" + d.site_id)
        .attr("stroke", "white");
};
var tipOff = function (d) {
    d.visible = false;
    tip.hide(d, document.getElementById("circle" + d.site_id));
    d3.select("#circle" + d.site_id)
        .attr("stroke-width", circleStrokeThin)
    d3.select("#outlineBar" + d.site_id)
        .attr("stroke", "transparent");
};
var tipToggle = function (d) {
    d.visible ? tipOff(d) : tipOn(d);
};

var key = function(d) {
    return d.site_id;
}

function getMapCentreAndZoom(region, showHideBars) {
    var zoom, centre;
    switch (region) {
        case "Central":
            zoom = 15;
            centre = new L.LatLng(52.482672-0.0012, -1.897517-0.00);
            break;
        case "CAZ":
            zoom = 13;
            centre = new L.LatLng(52.482672-0.004, -1.897517-0.002);
            break;
        default:
            zoom = 11;
            centre = new L.LatLng(52.521644-0.03, -1.814379-0.05);
    }
    if (showHideBars != "true") { // Zoom for Bars Hidden needs to be zoomed in a bit more 
        zoom = zoom + 1;
    }
    if (narrowWindow == true) {// Zoom for narrow window needs to be zoomed out a bit more 
        zoom = zoom - 1;
    }
    if (reallyNarrowWindow == true) {// Zoom for narrow window needs to be zoomed out a bit more 
        zoom = zoom - 1;
    }
    return {
        centre: centre,
        zoom: zoom
    };
}


function plotRadialBar(filteredData, chart_svg, innerRadius, outerRadius) {
    //data = data.sort(function(a,b) { return +a.annual_mean - +b.annual_mean })
    filteredData = filteredData.sort(function(a,b) { return d3.ascending(a.name, b.name)})

    // X scale for Monitoring Stations
    var xScale = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. 
        .align(0)                  // This does nothing
        .domain(filteredData.map(function (d) { return d.name; })); // The domain of the X axis is the list of names.

    // Y scale for Outer limit of each colour on radial bar
    var yScale = d3.scaleRadial()
        .range([innerRadius, outerRadius])
        .domain([0, 70]); // Domain of Y is from 0 to the max seen in the data

    //chart_svg.remove();
    chart_svg.append("g").attr("class","lowGroup");
    chart_svg.append("g").attr("class","mediumGroup");
    chart_svg.append("g").attr("class","highGroup");
    chart_svg.append("g").attr("class","veryHighGroup");
    chart_svg.append("g").attr("class","outlineGroup");

    // Define LOW bars sub group
    // -------------------------
    var arcs = chart_svg.select(".lowGroup")
        .selectAll(".low")
        .data(filteredData);
    
    // exit, remove
    arcs.exit().remove();
    
    // enter
    var arcsEnter = arcs.enter()
        .append("g")
        .attr("class", "low");

    // append
    arcsEnter.append("path").attr("class", "node_path");

    // merge
    arcs = arcs.merge(arcsEnter);

    // apply properties
    arcs.select(".node_path")
        .attr("d", d3.arc()
            .innerRadius(function (d) {
                return yScale(0);
            })
            .outerRadius(function (d) {
                return yScale(Math.min(d.annual_mean, minLimit));
            })
            .startAngle(function (d) {
                return xScale(d.name);
            })
            .endAngle(function (d) {
                return xScale(d.name) + xScale.bandwidth();
            })
            .padAngle(0.02)
            .padRadius(innerRadius))
        .attr("fill", function (d) {
            return colourMin;
        })
        .attr("opacity", 0.65);

    // Define Medium bars sub group
    // ----------------------------
    var arcs = chart_svg.select(".mediumGroup")
        .selectAll(".medium")
        //.data(filteredData, function (key){key + "Medium"});
        .data(filteredData);
    
    // exit, remove
    arcs.exit().remove();
    
    // enter
    var arcsEnter = arcs.enter()
        .append("g")
        .attr("class", "medium");

    // append
    arcsEnter.append("path").attr("class", "node_path");

    // merge
    arcs = arcs.merge(arcsEnter);

    // apply properties
    arcs.select(".node_path")
        .attr("d", d3.arc()
            .innerRadius(function (d) {
                return yScale(Math.min(d.annual_mean, minLimit));
            })
            .outerRadius(function (d) {
                return yScale(Math.min(d.annual_mean, mediumLimit));
            })
            .startAngle(function (d) {
                return xScale(d.name);
            })
            .endAngle(function (d) {
                return xScale(d.name) + xScale.bandwidth();
            })
            .padAngle(0.02)
            .padRadius(innerRadius))
        .attr("fill", function (d) {
            return colourMedium;
        });

    // Define HIGH bars sub group
    // --------------------------
    var arcs = chart_svg.select(".highGroup")
        .selectAll(".high")
        .data(filteredData);
    
    // exit, remove
    arcs.exit().remove();
    
    // enter
    var arcsEnter = arcs.enter()
        .append("g")
        .attr("class", "high");

    // append
    arcsEnter.append("path").attr("class", "node_path");

    // merge
    arcs = arcs.merge(arcsEnter);

    // apply properties
    arcs.select(".node_path")
        .attr("d", d3.arc()
            .innerRadius(function (d) {
                return yScale(Math.min(d.annual_mean, mediumLimit));
            })
            .outerRadius(function (d) {
                return yScale(Math.min(d.annual_mean, highLimit));
            })
            .startAngle(function (d) {
                return xScale(d.name);
            })
            .endAngle(function (d) {
                return xScale(d.name) + xScale.bandwidth();
            })
            .padAngle(0.02)
            .padRadius(innerRadius))
        .attr("fill", function (d) {
            return colourHigh;
        });   

    // Define veryHigh bars sub group
    // -----------------------------
    var arcs = chart_svg.select(".veryHighGroup")
        .selectAll(".veryHigh")
        .data(filteredData);
    
    // exit, remove
    arcs.exit().remove();
    
    // enter
    var arcsEnter = arcs.enter()
        .append("g")
        .attr("class", "veryHigh");

    // append
    arcsEnter.append("path").attr("class", "node_path");

    // merge
    arcs = arcs.merge(arcsEnter);

    // apply properties
    arcs.select(".node_path")
        .attr("d", d3.arc()
            .innerRadius(function (d) {
                return yScale(highLimit);
            })
            .outerRadius(function (d) {
                return yScale(Math.max(d.annual_mean, highLimit));
            })
            .startAngle(function (d) {
                return xScale(d.name);
            })
            .endAngle(function (d) {
                return xScale(d.name) + xScale.bandwidth();
            })
            .padAngle(0.02)
            .padRadius(innerRadius))
        .attr("fill", function (d) {
            return colourMax;
        });   

    // Define OUTLINE bars sub group
    // -----------------------------
    var arcs = chart_svg.select(".outlineGroup")
        .selectAll(".outline")
        .data(filteredData);

    // exit, remove
    arcs.exit().remove();

    // enter
    var arcsEnter = arcs.enter()
        .append("g")
        .attr("class", "outline");

    // append
    arcsEnter.append("path").attr("class", "node_path");

    // merge
    arcs = arcs.merge(arcsEnter);

    // apply properties
    arcs.select(".node_path")
        .attr("d", d3.arc()
            .innerRadius(function (d) {
                return yScale(0);
            })
            .outerRadius(function (d) {
                return yScale(d.annual_mean);
            })
            .startAngle(function (d) {
                return xScale(d.name);
            })
            .endAngle(function (d) {
                return xScale(d.name) + xScale.bandwidth();
            })
            .padAngle(0.02)
            .padRadius(innerRadius))
        .attr("fill", function (d) {
            return "transparent";
        })
        .attr("id", function (d) { return "outlineBar" + d.site_id; })
        .attr("stroke-width", barStrokeWidth)
        .on('mouseover touchstart', tipOn, true)
        .on('mouseout touchend', tipOff, true);
}
    
function plotCircles(filteredData) {
        /* Add a LatLng object to each item in the dataset */
        filteredData.forEach(function (d) {
            d.LatLng = new L.LatLng(d.latitude, d.longitude);
            d.visible = false;
        })

    colourScale = d3
        .scaleThreshold()
        .domain([minLimit, mediumLimit, highLimit])
        .range([colourMin, colourMedium, colourHigh, colourMax]);

    levelScale = d3
        .scaleThreshold()
        .domain([minLimit, mediumLimit, highLimit])
        .range([1, 2, 3, 4]);

    // Define Station Circles
    // ----------------------
    var feature = central_map_svg
        .selectAll(".stationLocation")
        .data(filteredData, key);

    feature.exit()
        .remove();

    var featureEnter = feature.enter()
        .append("g").attr("class","stationLocation");
    featureEnter
        .append("circle")
        .attr("id", function (d) { return "circle" + d.site_id; })
        .attr("r", 12)
        .attr("fill", function (d) { return colourScale(d.annual_mean); })
        .style("fill-opacity", 1)
        .attr("stroke", function (d) { return "white"; })
        .attr("stroke-width", circleStrokeThin)
        .on('mouseover touchstart', tipOn)
        .on('mouseout touchend', tipOff);

    feature = feature
        .merge(featureEnter);

    function update() {
        feature.attr("transform",
            function (d) {
                return "translate(" +
                    map.latLngToLayerPoint(d.LatLng).x + "," +
                    map.latLngToLayerPoint(d.LatLng).y + ")";
            }
        );
    }

    map.on("zoom", update);
    
    update();
}

function plotCharts(chart_svg) {
    dataFile.forEach(function (data) {
    //d3.json("https://drawingwithdata.com/bbmap/bbAQData.json").then(function(data) {
        selectedRegion = d3.select('input[name="regionRadio"]:checked').node().value
        showHideBars = d3.select('input[name="barsRadio"]:checked').node().value

        var size = Math.min(window.innerHeight, window.innerWidth);
        console.log(window.innerWidth);
        if (window.innerWidth <= 700) {narrowWindow = true;} else {narrowWindow = false;}
        if (window.innerWidth <= 260) {reallyNarrowWindow = true;} else {reallyNarrowWindow = false;}

        var width = size - margin.left - margin.right,
            height = size - margin.top - margin.bottom,
            innerRadius = size * 2.3/8,
            outerRadius = Math.min(width, height) / 2;
        if (map != null) map.remove();
        var mapView  = getMapCentreAndZoom(selectedRegion, showHideBars);
        map = L.map('map-radial-all'
            //,{fullscreenControl: true}
            ).setView(mapView.centre, mapView.zoom);
        mapLink =
            '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; ' + mapLink + ' Contributors',
            maxZoom: 18//,
        }).addTo(map);
        
        $("#map-radial-all").height($(window).height()).width($(window).width());
        //$("#map-radial-all").height($(window).innerHeight()).width($(window).innerWidth());
/*         desiredWidth = Math.min(window.innerWidth, 1000);
        desiredHeight = Math.min(window.innerHeight, 800);
        $("#map-radial-all").height(desiredHeight).width(desiredWidth); */
        map.invalidateSize();
        
        // Add Clean Air Zone
        L.geoJson(data.caz).addTo(map);
        
        /* Initialize the SVG layer */
        L.svg().addTo(map);
        
        //map.scrollWheelZoom.disable();
        
        /* We simply pick up the SVG from the map object */
        var leaflet_svg = d3.select('#map-radial-all').select("svg");
        chart_svg.attr("transform", "translate(" + (window.innerWidth / 2 + margin.left) + "," + (window.innerHeight / 2 + margin.top) + ")"); 
        central_map_svg = leaflet_svg.append("g");

        filteredData = data.stations.filter(function(d){
            return (d.central && selectedRegion == 'Central') ||
                (d.caz && selectedRegion == 'CAZ') ||
                selectedRegion == 'All' ;});
        plotRadialBar(filteredData, chart_svg, innerRadius, outerRadius);
        plotCircles(filteredData);

        // Initialise Tooltips
        leaflet_svg.call(tip);
    });
}

// The main event - plot the charts for the first time
var dataFile = getData();
plotCharts(chart_svg);
chart_svg.style("display","none");

// Now set up some events for resizes and button presses
// Redraw based on the new size whenever the browser window is resized.
window.addEventListener("resize", function(){ plotCharts(chart_svg) });

// Setup Radio Button Events for Region
d3.selectAll("input.region")
    .on('change', function (e) {
        plotCharts(chart_svg);
    }); 

// Setup Radio Button Events for Show / Hide Map
d3.selectAll("input.showBars")
    .on('change', function (e) {
        var showHide = d3.select(this).property('value');
        if (showHide == "true") {  // Show Bars
            plotCharts(chart_svg);
            chart_svg.style("display","block");
            // Keep Legend on after all
            //d3.select("div.info.legend.leaflet-control").style("display","block");
        }
        else {  // Hide Bars
            //plotCharts(chart_svg);
            chart_svg.style("display","none");
            // Keep Legend on after all
            //d3.select("div.info.legend.leaflet-control").style("display","none");
        }
    });

function getData() {
    return ([
    {"stations":[{"site_id":"BAU1","site_type":"Urban Background","annual_mean":19,"longitude":-1.8301,"latitude":52.4377,"name":"Acocks Green","type":"Automatic","central":false,"caz":false},{"site_id":"BAU2","site_type":"Roadside","annual_mean":32,"longitude":-1.875,"latitude":52.4761,"name":"Birmingham A4540 Roadside","type":"Automatic","central":false,"caz":false},{"site_id":"BCA1","site_type":"Roadside","annual_mean":35,"longitude":-1.8987,"latitude":52.4818,"name":"Colmore Row","type":"Automatic","central":true,"caz":true},{"site_id":"BCA2","site_type":"Kerbside","annual_mean":51,"longitude":-1.8968,"latitude":52.4861,"name":"St Chads Queensway","type":"Automatic","central":true,"caz":true},{"site_id":"BCA3","site_type":"Roadside","annual_mean":43,"longitude":-1.9021,"latitude":52.4768,"name":"Lower Severn Street","type":"Automatic","central":true,"caz":true},{"site_id":"BCA4","site_type":"Urban Background","annual_mean":19,"longitude":-1.7864,"latitude":52.5681,"name":"New Hall","type":"Automatic","central":false,"caz":false},{"site_id":"BCA5","site_type":"Roadside","annual_mean":28,"longitude":-1.9346,"latitude":52.4451,"name":"Selly Oak (Bristol Road)","type":"Automatic","central":false,"caz":false},{"site_id":"BCA6","site_type":"Roadside","annual_mean":36,"longitude":-1.8716,"latitude":52.4592,"name":"Stratford Road","type":"Automatic","central":false,"caz":false},{"site_id":"BHM1","site_type":"Urban Background","annual_mean":15.148,"longitude":-1.8365,"latitude":52.4427,"name":"Fox Green Crescent","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM2","site_type":"Urban Background","annual_mean":14.4027,"longitude":-1.9414,"latitude":52.4371,"name":"Langleys Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM3","site_type":"Roadside","annual_mean":28.7896,"longitude":-1.8928,"latitude":52.4371,"name":"28 High Street","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM4","site_type":"Roadside","annual_mean":33,"longitude":-1.8926,"latitude":52.4362,"name":"75 High Street","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM5","site_type":"Roadside","annual_mean":34.0048,"longitude":-1.8674,"latitude":52.4553,"name":"448 Stratford Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM6","site_type":"Roadside","annual_mean":39.2392,"longitude":-1.8669,"latitude":52.4544,"name":"487 Stratford Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM7","site_type":"Roadside","annual_mean":31.004,"longitude":-1.9114,"latitude":52.4776,"name":"Broad Street - Brasshouse","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM8","site_type":"Roadside","annual_mean":34.79,"longitude":-1.9126,"latitude":52.4763,"name":"Broad Street - O'Neils","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM9","site_type":"Roadside","annual_mean":32.2947,"longitude":-1.8744,"latitude":52.52,"name":"Shelley Drive","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM10","site_type":"Roadside","annual_mean":31.8967,"longitude":-1.8717,"latitude":52.4592,"name":"Stratford Road AQ station","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM11","site_type":"Roadside","annual_mean":31.1747,"longitude":-1.8717,"latitude":52.4592,"name":"Stratford Road AQ station","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM12","site_type":"Roadside","annual_mean":31.526,"longitude":-1.8717,"latitude":52.4592,"name":"Stratford Road AQ station","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM16","site_type":"Roadside","annual_mean":40.776,"longitude":-1.8936,"latitude":52.4857,"name":"Childrens Hospital","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM17","site_type":"Roadside","annual_mean":33.9528,"longitude":-1.8539,"latitude":52.5078,"name":"Tyburn (39)","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM18","site_type":"Roadside","annual_mean":35.3353,"longitude":-1.853,"latitude":52.5078,"name":"Tyburn (40)","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM19","site_type":"Roadside","annual_mean":38.1547,"longitude":-1.9318,"latitude":52.4153,"name":"Middleton Hall Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM20","site_type":"Roadside","annual_mean":30.4036,"longitude":-1.936,"latitude":52.444,"name":"641 Bristol Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM21","site_type":"Roadside","annual_mean":48.5207,"longitude":-1.8807,"latitude":52.4844,"name":"Lawley Middleway","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM23","site_type":"Roadside","annual_mean":39.5853,"longitude":-1.9022,"latitude":52.4768,"name":"Lower Severn Street","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM24","site_type":"Roadside","annual_mean":37.7787,"longitude":-1.9039,"latitude":52.4819,"name":"Great Charles Street (1)","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM25","site_type":"Roadside","annual_mean":37.9616,"longitude":-1.875,"latitude":52.476,"name":"Watery Lane Middleway","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM26","site_type":"Urban Background","annual_mean":22.8785,"longitude":-1.9183,"latitude":52.4813,"name":"Nelson JI","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM27","site_type":"Roadside","annual_mean":34.6596,"longitude":-1.8861,"latitude":52.4903,"name":"Waterlinks","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM28","site_type":"Roadside","annual_mean":44.6507,"longitude":-1.9019,"latitude":52.4838,"name":"Great Charles Street (2)","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM29","site_type":"Roadside","annual_mean":43,"longitude":-1.9045,"latitude":52.4784,"name":"Sufflok Street Queensway","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM30","site_type":"Roadside","annual_mean":34.394,"longitude":-1.8841,"latitude":52.4822,"name":"Curzon Street","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM31","site_type":"Roadside","annual_mean":35.12,"longitude":-1.9048,"latitude":52.4781,"name":"Holiday Street","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM33","site_type":"Roadside","annual_mean":36.1207,"longitude":-1.9028,"latitude":52.4765,"name":"Severn Street","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM34","site_type":"Urban Centre","annual_mean":26.2756,"longitude":-1.8967,"latitude":52.48,"name":"Superdrug","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM35","site_type":"Urban Centre","annual_mean":28.264,"longitude":-1.8958,"latitude":52.4808,"name":"Café Nero","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM36","site_type":"Roadside","annual_mean":31.944,"longitude":-1.8953,"latitude":52.4815,"name":"Corporation Street Sq Peg","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM37","site_type":"Roadside","annual_mean":26.2792,"longitude":-1.9222,"latitude":52.4658,"name":"Church Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM39","site_type":"Roadside","annual_mean":37,"longitude":-1.8945,"latitude":52.4819,"name":"Corporation Street","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM40","site_type":"Roadside","annual_mean":47.3847,"longitude":-1.8924,"latitude":52.4817,"name":"Priory Queensway (1)","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM41","site_type":"Roadside","annual_mean":50.4022,"longitude":-1.8925,"latitude":52.4816,"name":"Priory Queensway (2)","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM42","site_type":"Roadside","annual_mean":39.75,"longitude":-1.8903,"latitude":52.4818,"name":"MSQ - Masshouse","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM43","site_type":"Roadside","annual_mean":39.5327,"longitude":-1.8894,"latitude":52.4819,"name":"Masshouse Lane - Masshouse","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM44","site_type":"Roadside","annual_mean":38.9818,"longitude":-1.8891,"latitude":52.482,"name":"Masshouse Lane - LP","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM45","site_type":"Roadside","annual_mean":35.5156,"longitude":-1.8898,"latitude":52.4811,"name":"Hotel La Tour - LP","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM46","site_type":"Roadside","annual_mean":50.0475,"longitude":-1.8903,"latitude":52.4813,"name":"Masshouse Lane Masshouse 2","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM50","site_type":"Roadside","annual_mean":44.6527,"longitude":-1.892,"latitude":52.4802,"name":"MSQ - No entry post","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM51","site_type":"Roadside","annual_mean":35.3964,"longitude":-1.8995,"latitude":52.4713,"name":"Bristol Street Monaco House","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM53","site_type":"Roadside","annual_mean":49.9724,"longitude":-1.8931,"latitude":52.4788,"name":"MSQ - no loading","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM55","site_type":"Roadside","annual_mean":52.0496,"longitude":-1.8932,"latitude":52.4784,"name":"Moor Street corner of","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM56","site_type":"Urban Centre","annual_mean":33.336,"longitude":-1.8928,"latitude":52.4799,"name":"New Meeting Street","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM57","site_type":"Roadside","annual_mean":28.1467,"longitude":-1.8883,"latitude":52.4482,"name":"Chantry Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM58","site_type":"Urban Centre","annual_mean":36.6249,"longitude":-1.8946,"latitude":52.4796,"name":"Carrs Lane High Street","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM59","site_type":"Urban Centre","annual_mean":37.1825,"longitude":-1.8943,"latitude":52.4803,"name":"Lower Bull Street corner of","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM61","site_type":"Urban Centre","annual_mean":29.748,"longitude":-1.8995,"latitude":52.4812,"name":"St Phillips Church yard","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM62","site_type":"Urban Centre","annual_mean":33.394,"longitude":-1.8979,"latitude":52.4826,"name":"Snow Hill","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM63","site_type":"Roadside","annual_mean":28.4415,"longitude":-1.8909,"latitude":52.4829,"name":"Chapel Lane","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM64","site_type":"Roadside","annual_mean":33.64,"longitude":-1.8988,"latitude":52.4786,"name":"Stephenson Street","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM65","site_type":"Roadside","annual_mean":36.99,"longitude":-1.8918,"latitude":52.4762,"name":"Digbeth","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM66","site_type":"Roadside","annual_mean":33.2067,"longitude":-1.8917,"latitude":52.4925,"name":"Newtown middleway","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM67","site_type":"Roadside","annual_mean":31.7695,"longitude":-1.8975,"latitude":52.4927,"name":"New John Street West (1)","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM68","site_type":"Roadside","annual_mean":32.376,"longitude":-1.9163,"latitude":52.4911,"name":"Icknield Street (1)","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM69","site_type":"Roadside","annual_mean":37.646,"longitude":-1.9159,"latitude":52.4909,"name":"Icknield Street (2)","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM70","site_type":"Roadside","annual_mean":25.416,"longitude":-1.9246,"latitude":52.4809,"name":"Ledsam Street","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM71","site_type":"Roadside","annual_mean":25.426,"longitude":-1.9234,"latitude":52.4758,"name":"Rann close","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM72","site_type":"Roadside","annual_mean":22.8496,"longitude":-1.9236,"latitude":52.4755,"name":"Leyburn Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM74","site_type":"Roadside","annual_mean":52.578,"longitude":-1.9129,"latitude":52.4713,"name":"Islington Row (2)","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM75","site_type":"Roadside","annual_mean":34.04,"longitude":-1.9079,"latitude":52.4695,"name":"Lee Bank MW by School","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM76","site_type":"Roadside","annual_mean":24.8007,"longitude":-1.9079,"latitude":52.469,"name":"Lee Bank MW opposite School","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM77","site_type":"Roadside","annual_mean":30.6247,"longitude":-1.8993,"latitude":52.467,"name":"Lee Bank MW - St Lukes","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM78","site_type":"Roadside","annual_mean":31.6872,"longitude":-1.8997,"latitude":52.4667,"name":"Lee Bank MW - opposite St Lukes","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM79","site_type":"Roadside","annual_mean":27.6773,"longitude":-1.8929,"latitude":52.4648,"name":"Alexandra Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM80","site_type":"Roadside","annual_mean":35.5313,"longitude":-1.8927,"latitude":52.4651,"name":"Belgrave Middleway","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM81","site_type":"Roadside","annual_mean":41.2822,"longitude":-1.8835,"latitude":52.4656,"name":"Moseley Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM82","site_type":"Roadside","annual_mean":28.5822,"longitude":-1.884,"latitude":52.4657,"name":"Highgate MW","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM83","site_type":"Roadside","annual_mean":61.042,"longitude":-1.8754,"latitude":52.4759,"name":"Watery Lane (2)","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM84","site_type":"Roadside","annual_mean":38.2655,"longitude":-1.8811,"latitude":52.4843,"name":"Lawley Middleway (2)","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM85","site_type":"Roadside","annual_mean":48.0293,"longitude":-1.8865,"latitude":52.4903,"name":"Dartmouth MW (2)","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM86","site_type":"Roadside","annual_mean":33.7411,"longitude":-1.8959,"latitude":52.4859,"name":"Ronald McDonald House","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM87","site_type":"Roadside","annual_mean":59.6253,"longitude":-1.896,"latitude":52.4863,"name":"St Chads (2)","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM88","site_type":"Roadside","annual_mean":58.1093,"longitude":-1.9013,"latitude":52.4837,"name":"Great Charles Street (3)","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM89","site_type":"Roadside","annual_mean":39.38,"longitude":-1.9043,"latitude":52.4819,"name":"Great Charles Street (4)","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM90","site_type":"Roadside","annual_mean":27.1887,"longitude":-1.9039,"latitude":52.4836,"name":"Lionel Street","type":"Diffusion Tube","central":true,"caz":true},{"site_id":"BHM91","site_type":"Roadside","annual_mean":27.144,"longitude":-1.8616,"latitude":52.4893,"name":"Adderley Street","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHM92","site_type":"Roadside","annual_mean":40.2267,"longitude":-1.9001,"latitude":52.4711,"name":"Bristol Street (2)","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM93","site_type":"Urban Centre","annual_mean":41,"longitude":-1.8976,"latitude":52.4924,"name":"New John Street (2)","type":"Diffusion Tube","central":false,"caz":true},{"site_id":"BHM99","site_type":"Roadside","annual_mean":40.0296,"longitude":-1.918,"latitude":52.4354,"name":"Pershore Road (Dogpool Hotel)","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHMPB1","site_type":"Roadside","annual_mean":31,"longitude":-1.9021,"latitude":52.5154,"name":"Wellington Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHMPB2","site_type":"Roadside","annual_mean":25,"longitude":-1.901,"latitude":52.519,"name":"Walsall Road - Seventh Trap","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHMPB3","site_type":"Roadside","annual_mean":31,"longitude":-1.8997,"latitude":52.5189,"name":"Harrier Way","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHMPB4","site_type":"Roadside","annual_mean":35,"longitude":-1.897,"latitude":52.5191,"name":"Aldridge Road","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHMPB5","site_type":"Roadside","annual_mean":33,"longitude":-1.8958,"latitude":52.5177,"name":"Wellhead Lane","type":"Diffusion Tube","central":false,"caz":false},{"site_id":"BHMPB6","site_type":"Roadside","annual_mean":35,"longitude":-1.8967,"latitude":52.5145,"name":"Stoneleigh Road","type":"Diffusion Tube","central":false,"caz":false}],"caz":{"type":["FeatureCollection"],"features":[{"type":"Feature","properties":{"name":"Birminagham CAZ 2020"},"geometry":{"type":"Polygon","coordinates":[[[-1.8992,52.4927],[-1.9017,52.493],[-1.9045,52.4934],[-1.9085,52.4939],[-1.9088,52.4938],[-1.9092,52.4937],[-1.911,52.4935],[-1.9145,52.4924],[-1.9148,52.4922],[-1.915,52.4919],[-1.9155,52.4915],[-1.916,52.4906],[-1.9165,52.4895],[-1.9168,52.4886],[-1.917,52.4879],[-1.9174,52.4872],[-1.918,52.4862],[-1.9184,52.4856],[-1.9189,52.4848],[-1.9192,52.4845],[-1.9197,52.4844],[-1.9205,52.4842],[-1.9212,52.4837],[-1.9227,52.4825],[-1.9246,52.4808],[-1.9257,52.4799],[-1.9262,52.4794],[-1.9264,52.4789],[-1.9265,52.4784],[-1.9263,52.478],[-1.926,52.4777],[-1.9257,52.4771],[-1.9251,52.4767],[-1.924,52.4761],[-1.9222,52.4751],[-1.9213,52.4746],[-1.9203,52.4742],[-1.9191,52.4737],[-1.9182,52.4735],[-1.9178,52.4733],[-1.9177,52.4729],[-1.9174,52.4727],[-1.9162,52.4724],[-1.9139,52.472],[-1.9116,52.4712],[-1.9097,52.4704],[-1.9076,52.4694],[-1.9053,52.4683],[-1.9034,52.4679],[-1.9015,52.4677],[-1.9008,52.4675],[-1.8985,52.4669],[-1.898,52.4669],[-1.8977,52.4669],[-1.8975,52.4668],[-1.8973,52.4665],[-1.8951,52.4659],[-1.8935,52.4653],[-1.8902,52.4643],[-1.8882,52.4638],[-1.8873,52.4638],[-1.8868,52.4639],[-1.8863,52.4641],[-1.8854,52.4647],[-1.8837,52.4659],[-1.8831,52.4664],[-1.8822,52.4672],[-1.881,52.4677],[-1.8799,52.4682],[-1.8796,52.4687],[-1.8792,52.4689],[-1.8788,52.469],[-1.8784,52.4691],[-1.8765,52.471],[-1.8756,52.4723],[-1.8754,52.4727],[-1.8756,52.4728],[-1.8756,52.473],[-1.8756,52.4733],[-1.8754,52.4735],[-1.8752,52.475],[-1.876,52.4774],[-1.8766,52.4793],[-1.8769,52.4796],[-1.877,52.4798],[-1.8777,52.4807],[-1.8781,52.4814],[-1.8797,52.4829],[-1.8801,52.4831],[-1.8805,52.4832],[-1.8805,52.4834],[-1.8813,52.4844],[-1.8826,52.4857],[-1.8834,52.4864],[-1.8876,52.4915],[-1.888,52.4917],[-1.8882,52.4917],[-1.8888,52.4918],[-1.8892,52.492],[-1.8894,52.4921],[-1.8899,52.4923],[-1.8944,52.492],[-1.8983,52.4926],[-1.8984,52.4922],[-1.8992,52.4923],[-1.8992,52.4927]]]}}]}}
 ])}