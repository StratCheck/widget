/* global __sc_tmpl */
/* global __sc_cs */
/* global _scw_data */
/* global Exception */
/* global _ */
//TODO: Remove and change to d3.time.format if it possible
/* global moment */
/* global d3 */
(function() {
  "use strict";
  
  var widgetStyles = __sc_cs,
      widgetTmpl   = __sc_tmpl,
      chartTypes   = ['relative_price', 'absolute'],
      types   	   = [],
      chosedType   = {label: '(none)', value: undefined};
  
  var utils = {
    isFunction : function(obj) {
      return typeof obj == 'function' || false;
    }
  };
  
  var assetPieChart = function() {
    
    var svgWidth  = 380,
        svgHeight = 240,
        width     = svgWidth,
        height    = svgHeight,
        radius    = Math.min(width, height) / 2;

    function chart(selection) {
      selection.each(function(data) {
        
        var svg = d3.select(this).selectAll("svg").data([data]);
        
        var gEnter = svg.enter().append("svg").append('g');
        
        gEnter.append("g")
          .attr("class", "slices");
        gEnter.append("g")
          .attr("class", "labels");
        gEnter.append("g")
          .attr("class", "lines");
        gEnter.append("g")
          .attr("class", "outer-arc")
          .append('circle')
          .attr('cx', 0).attr('cy', 0).attr('r', radius*0.8);
  
        var pie = d3.layout.pie()
          .sort(null)
          .value(function(d) {
            return d.value;
          });
          
        var arc = d3.svg.arc()
          .innerRadius(radius * 0.0)
          .outerRadius(radius * 0.8);
        
        var outerArc = d3.svg.arc()
          .innerRadius(radius * 0.9)
          .outerRadius(radius * 0.9);
        
        gEnter.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        svg.attr("width", width);
        svg.attr("height", height);
        
        
        //TODO:DSL
        var key = function(d){ return d.data.label; };

        var color = d3.scale.ordinal()
          .domain(["Lorem ipsum", "dolor sit", "amet", "consectetur", "adipisicing"])
          .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);
          
        function randomData (){
          var labels = color.domain();
          return labels.map(function(label){
            return { label: label, value: Math.random() }
          });
        }
        
        change(randomData());
        
        function change(data) {

          /* ------- PIE SLICES -------*/
          var slice = svg.select(".slices")
            .selectAll("path.slice")
            .data(pie(data), key);
          
          slice.enter()
            .insert("path")
            .style("fill", function(d) { return color(d.data.label); })
            .attr("class", "slice");
      
          slice.transition()
            .duration(1000)
            .attrTween("d", function(d) {
              this._current   = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current   = interpolate(0);
              return function(t) {
                return arc(interpolate(t));
              };
            });
      
          slice.exit().remove();
      
          /* ------- TEXT LABELS -------*/
      
          var text = svg
            .select(".labels")
            .selectAll("text")
            .data(pie(data), key);
      
          text.enter()
            .append("text")
            .attr("dy", ".35em")
            .text(function(d) {
                return d.data.label;
            });
          
          function midAngle(d){
            return d.startAngle + (d.endAngle - d.startAngle)/2;
          }
      
          text.transition().duration(1000)
            .attrTween("transform", function(d) {
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                var d2  = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0]  = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                return "translate("+ pos +")";
              };
            })
            .styleTween("text-anchor", function(d){
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                var d2 = interpolate(t);
                return midAngle(d2) < Math.PI ? "start":"end";
              };
            });
      
          text.exit().remove();
      
          /* ------- SLICE TO TEXT POLYLINES -------*/
      
          var polyline = svg
            .select(".lines")
            .selectAll("polyline")
            .data(pie(data), key);
          
          polyline
            .enter()
            .append("polyline");
      
          polyline
            .transition()
            .duration(1000)
            .attrTween("points", function(d){
              this._current   = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current   = interpolate(0);
              return function(t) {
                var d2 = interpolate(t),
                   pos = outerArc.centroid(d2);
                pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                var innerPos = _.map(arc.centroid(d2), function(a){
                  return a*1.9;
                });
                return [innerPos, outerArc.centroid(d2), pos];
              };
            });
          
          polyline.exit().remove();
      };

      });
    }
    
    return chart;
    
  };
    
  var timeSeriesChart = function(type) {

    var margin     = {top: 0, right: 20, bottom: 20, left: 50},
        svgWidth   = 580,
        svgHeight  = 340,
        width      = svgWidth,
        height     = svgHeight,
        chart_type = type,
        xValue = function(d) { return d[0]; },
        yValue = function(d) { return d[1]; },
        xScale = d3.time.scale(),
        yScale = d3.scale.linear(),
        xAxis  = d3.svg.axis().scale(xScale).orient("bottom").ticks(6),
        yAxis  = d3.svg.axis().scale(yScale).orient("left").ticks(6).tickFormat(function(d){
          if (chart_type == 'relative'){
            return Number(Number(d) * 100) + "%";
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

        width     = svgWidth - margin.left - margin.right;
        height    = svgHeight - margin.bottom;
        
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
        
        gEnter.append('rect')
          .attr('class', 'border-rect')
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

        gEnter.append('g').attr('class', 'paths');
        
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

  var host     = document.querySelector(_scw.id),
      root     = host.createShadowRoot(),
      styleElm = document.createElement('style'),
      tmplElm  = document.createElement('div');
      
  window.root = root;
  
  styleElm.innerHTML = widgetStyles;
  tmplElm.innerHTML  = widgetTmpl;
  root.appendChild(styleElm);
  root.appendChild(tmplElm);
  
  var mainGraph = root.querySelector('.mg'),
      apGraph   = root.querySelector('.cg');
  
  var chart = timeSeriesChart(chartTypes[0])
      .x(function(o){ return o.x; })
      .y(function(o){ return o.y; });
   
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

        d3.select(mainGraph)
          .datum(results)
          .call(chart);
      }
    };
    
   redrawChart(_scw_data);
   
   var apChart = assetPieChart();
   
   d3.select(apGraph)
    .datum([])
    .call(apChart);

})(window, _scw, _scw_data, __sc_cs, __sc_tmpl);
