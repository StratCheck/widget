/* global _scw_data */
/* global Exception */
/* global _ */
//TODO: Remove and change to d3.time.format if it possible
/* global moment */
/* global d3 */
(function() {
  "use strict";
  
  //create shadow dom
  //load: styles
  //Init widget there
  
  var chartStyles = 'svg{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:14px;line-height:1.428571429;background-color:#fff;color:#333}.x.brush{opacity:0}.axis line,.axis path{fill:none;stroke:#000;shape-rendering:crispEdges}.x.axis path{display:none}.line{fill:none;stroke:#4682b4;stroke-width:1.5px}.arc path{stroke:#fff}circle{stroke-opacity:.2}.brush .extent{stroke:#fff;shape-rendering:crispEdges}.brush .resize{fill:url(/images/arrowUp.jpg)}g.custom_tick line,g.tick line{stroke:#ccc}path.line{opacity:.2}path.line:hover{opacity:.8}path.line.active{opacity:1}.brush .background{fill:#000;opacity:.1;visibility:visible}.brush .extent{fill:#fff;opacity:1;fill-opacity:1}.bold.tick line{stroke-dasharray:5,5}.border-rect{fill:none;stroke:#ccc;stroke-width:1}.line.Moderate-Aggressive{stroke:#2c363a}.line.Conservative{stroke:#2ab4c0}.line.Income{stroke:#dec458}.line.best-fitting-bmark{stroke:#B8AE51}.line.Aggressive{stroke:#157991}.line.Moderate{stroke:#d64434}.line.global-dynamic-strategy{stroke:#A5A581}.Moderate-Aggressive{color:#2c363a;border-color:#2c363a}.Conservative{color:#2ab4c0;border-color:#2ab4c0}.Income{color:#dec458;border-color:#dec458;border-width:inherit}.best-fitting-bmark{color:#B8AE51;border-color:#B8AE51;border-width:inherit}.Aggressive{color:#157991;border-color:#157991;border-width:inherit}.Moderate{color:#d64434;border-color:#d64434;border-width:inherit}.global-dynamic-strategy{color:#A5A581;border-color:#A5A581;border-width:inherit}.benchmark-select{margin-left:50px;margin-bottom:20px}.custom_tick,.tick{fill:#999}annualized-bar .custom_tick,annualized-bar .tick{stroke-dasharray:26,25}annualized-bar .custom_tick.bold line,annualized-bar .tick.bold line{stroke:#000}annualized-bar text.value{fill:#e9e9e9}annualized-bar text.name{font-size:14px;fill:#333}annualized-bar .axis_line{stroke:#ccc;stroke-width:1}slave-graph text{fill:#e9e9e9}slave-graph .arc text{text-anchor:middle;font-size:18px}slave-graph .arc line{stroke:#ddd;stroke-width:1;stroke-dasharray:2,4;stroke-opacity:.5}slave-graph .lines-text{fill:#999}slave-graph .lines{stroke:#ccc;stroke-width:1}.chart-stage h3{padding-top:20px;margin-top:0;font-size:16px;color:#333}.control_buttons a,.control_buttons button{color:#00b3e4}.top_buttons{padding-top:7px;padding-bottom:23px}bs-dropdown .dropdown{display:inline}.benchmark-select label{margin-right:5px}.benchmark-select a,.benchmark-select a:focus,.benchmark-select a:hover{text-decoration:none}.benchmark-select .dropdown-menu{padding-top:0;cursor:pointer;border:none;box-shadow:1px 1px 6px 1px rgba(0,0,0,.2);margin-top:10px}.benchmark-select .dropdown-menu a:focus,.benchmark-select .dropdown-menu li:focus{outline:0}.benchmark-select .dropdown-menu i{margin-right:10px}.benchmark-select .dropdown-menu:before{content:" ";background-image:url(/images/arrow.png);background-size:100% 100%;height:8px;width:24px;position:absolute;right:30px;top:-8px}';
  
  var utils = {
    get_width : function (el) {
      el = d3.select(el);
      return parseInt(el.style('width'), 10) - parseInt(el.style('padding-left'), 10) - parseInt(el.style('padding-right'), 10);
    },
    get_height : function (el) {
      el = d3.select(el);
      return parseInt(el.style('height'), 10) - parseInt(el.style('padding-top'), 10) - parseInt(el.style('padding-bottom'), 10);
    },
    isFunction : function(obj) {
      return typeof obj == 'function' || false;
    }
  };
  
  window.utils = utils;
  
  var timeSeriesChart = function(type) {

    var margin    = {top: 0, right: 20, bottom: 20, left: 50},
        svgMargin = {top: 46, right: 0, bottom: 0, left: 0},
        svgWidth  = 1000,
        svgHeight = 500,
        width  = svgWidth,
        height = svgHeight,
        chart_type = type,
        xValue = function(d) { return d[0]; },
        yValue = function(d) { return d[1]; },
        xScale = d3.time.scale(),
        yScale = d3.scale.linear(),
        xAxis  = d3.svg.axis().scale(xScale).orient("bottom").ticks(6),
        yAxis  = d3.svg.axis().scale(yScale).orient("left").ticks(6).tickFormat(function(d){
          if (chart_type == 'relative'){
            return parseInt(parseInt(d) * 100) + "%";
          } else {
            return "$" + d.toFixed(2);
          }
        }),
        parseDate = function (unixTime) { return moment(unixTime, 'X').toDate(); },
        line = d3.svg.line().x(function(d) { return xScale(d[0]); }).y(function(d) { return yScale(d[1]); }),

        brush = d3.svg.brush()
          .x(xScale)
          .on("brushend", function(){
            var extent = brush.extent();
            if(utils.isFunction(brushCallback)) {
              brushCallback(extent);
            } 
          }),
        brushCallback;

    function chart(selection) {
      selection.each(function(data) {
        console.log(this);
        //svgWidth  = utils.get_width(this.parentNode.parentNode) - svgMargin.left - svgMargin.right;
        //svgHeight = utils.get_height(this.parentNode.parentNode) - svgMargin.top - svgMargin.bottom;
        //width     = svgWidth - margin.left - margin.right;
        //height    = svgHeight - margin.bottom;
        
        //TODO:Fix that!
        width  = svgWidth; 
        height = svgHeight;
        
        
        var xDomain = [undefined, undefined],
            yDomain = [undefined, undefined];

        _.each(data, function(value, key){
          // Convert data to standard representation greedily;
          // this is needed for nondeterministic accessors.
          data[key] = _.map(data[key], function(d, i) {
            return [parseDate(xValue.call(data[key], d, i)), yValue.call(data[key], d, i)];
          });

          var newXDomain = d3.extent(data[key], function (d) { return d[0]; }),
              newYDomain = d3.extent(data[key], function (d) { return d[1]; });
          xDomain = [d3.min([xDomain[0], newXDomain[0]]), d3.max([xDomain[1], newXDomain[1]])];
          yDomain = [d3.min([yDomain[0], newYDomain[0]]), d3.max([yDomain[1], newYDomain[1]])];
        });

        // Update the x-scale.
        xScale.domain(xDomain).range([0, width]);
        xAxis.tickSize(-height, 0,0);

        // Update the y-scale.
        yScale.domain(yDomain).range([height, 0]);
        yAxis.tickSize(-width, 0,0);

        // Select the svg element, if it exists.
        var svg = d3.select(this).selectAll("svg").data([data]);

        if (brush.empty()){
          brush.extent(xDomain);
        }
        else{
          // redraw selection on resize;
          brush.extent(brush.extent());
        }

        // Otherwise, create the skeletal chart.
        var gEnter = svg.enter().append("svg").append("g");
        
        gEnter.append('rect').attr('class', 'border-rect')
              .attr('x', 1)
              .attr('y', 1)
              .attr('width', width)
              .attr('height', height);
              
        gEnter.append("g").attr("class", "x axis");
        gEnter.append("g").attr("class", "y axis");

        // Update the x-axis.
        svg.select(".x.axis").transition().duration(1500)
            .attr("transform", "translate(0," + yScale.range()[0] + ")")
            .call(xAxis);
        svg.selectAll(".x.axis text").transition().duration(1500).attr("y", 10);

        gEnter.select('.x.axis')
          .append("g")
          .attr("class", "x brush");

        svg.select('.x.brush')
          .call(brush)
          .selectAll("rect")
          .attr("y", -height)
          .attr("height", height)
          .style('visibility', 'visible');

        

        var paths = gEnter.append('g').attr('class', 'paths');
        _.each(data, function(value, key){
          gEnter.select('.paths').append("path").attr("class", "line " + key.replace(' ', '-')).attr('d', line(value));
        });

        // Update the outer dimensions.
        svg.attr("width", svgWidth)
           .attr("height", svgHeight);

        // Update the inner dimensions.
        var g = svg.select("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        gEnter.selectAll(".resize").append('image')
          .attr('xlink:href', '/images/arrowUp.jpg')
          .attr('width', "20px")
          .attr('height', "20px");
        gEnter.selectAll('.resize.w image').attr('x', "-10");
        gEnter.selectAll('.resize.e image').attr('x', "-8");

        g.select(".y.axis").transition().duration(1500).call(yAxis);
        g.selectAll(".y.axis text").transition().duration(1500).attr("x", -10);

        g.select('.x.brush').call(brush);

        g.select('.border-rect').transition().duration(1500)
         .attr('width', width)
         .attr('height', height);

        _.each(data, function(value, key){
          svg.select('.' + key.replace(' ', '-')).transition().duration(1500).attr('d', line(value));
        });

        svg.selectAll('.tick').attr('class', function(d){ 
          if((d == 0 && chart_type == 'relative') || (d == 1)){
            return "bold tick";
          } else { 
            return "tick";
          }
        });
        d3.select(this).selectAll(".domain").remove();

      });
    }

    chart.setActiveLine = function(element, className){
      d3.select(element).selectAll('path.line').classed({"active": false});
      d3.select(element).select('path.line.' + className).classed({"active": true});
    };

    chart.change_brush = function(element, start, end, triggered_by){
      if (brush !== undefined && chart_type != triggered_by){
        brush.extent([start, end]);
        d3.select(element).select('.x.brush').call(brush);
        brush.event(d3.select(element));
      }
    };

    // The x-accessor for the path generator; xScale ∘ xValue.
    function X(d) {
      return xScale(xValue(d));
    }

    // The x-accessor for the path generator; yScale ∘ yValue.
    function Y(d) {
      return yScale(yValue(d));
    }

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.width = function(_) {
      if (!arguments.length) return width;
      width = _;
      return chart;
    };

    chart.height = function(_) {
      if (!arguments.length) return height;
      height = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return xValue;
      xValue = _;
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return yValue;
      yValue = _;
      return chart;
    };

    chart.brushCallback = function(_) {
      if (!arguments.length) return brushCallback;
      if (!utils.isFunction(_)) {
        throw Exception('The brush callback must be a function!');
      }
      brushCallback = _;
      return chart;
    };

    return chart;
  };

  

  var host     = document.querySelector(_scw.id);
  var root     = host.createShadowRoot();
  var styleElm = document.createElement('style');
  styleElm.innerHTML = chartStyles;
  root.appendChild(styleElm);
  //root.textContent = 'The shadow DOM';

  //TODO: Refactore it ro inline style tag!
  var style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "/src/charts.css";
  document.querySelector('head').appendChild(style);
  //----------------------------------------------//
 
  //console.log(root);
  //console.log(d3.select(host));
  
  var chartTypes  = ['relative_price', 'absolute'];
  var date_format = 'YYYY-MM-DD hh:mm:ss';
  var thTimeout   = 1000;
  var types   	  = [];
  var chosedType  = {label: '(none)', value: undefined};
    
  
  var chart = timeSeriesChart(chartTypes[0])
      .x(function(o){ return o.x; })
      .y(function(o){ return o.y; })
      .brushCallback(_.throttle(function(extent) {
        
        var range = {begin: "2010-12-09 10:26:14", end: "2014-12-24 06:00:00"};
        var begin = moment(extent[0]).format(date_format);
        var end = moment(extent[1]).format(date_format);
        
      }, thTimeout));
   
   var redrawChart = function(newData) {
      if (_.isObject(newData)) {
        var results = {};
        _.each(newData.data, function(data, key){
          types.push({
            label: key.replace(' ', '-'),
            value: key.replace(' ', '-')
          });
          results[key] = _.chain(data)
            .map(function(k, v){
              return {
                x: Number(v)/1000,
                y: k };
            })
            .filter(function (o) { return !_.isNaN(o.x); })
            .sortBy(function(o){ return o.x; })
            .value();
        });

        if (chosedType.value === undefined){ 
          chosedType = types[0];
        } else {
          var renew_value = _.where(types, {value: chosedType.value});
          if (renew_value.length > 0){
            chosedType = renew_value[0];
          } else {
            chosedType = types[0];
          }
        };

        d3.select(root)
          .datum(results)
          .call(chart);
      }
    };
    
   redrawChart(_scw_data);

})(window, _scw, _scw_data);
