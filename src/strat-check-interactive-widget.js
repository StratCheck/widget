(function() {
  "use strict";
  
  //create shadow dom
  //load: styles
  //Init widget there
  
  
  var utils = function () {

    var self = this;

    self.get_width = function (el) {
      el = d3.select(el);
      return parseInt(el.style('width'), 10) - parseInt(el.style('padding-left'), 10) - parseInt(el.style('padding-right'), 10);
    };

    self.get_height = function (el) {
      el = d3.select(el);
      return parseInt(el.style('height'), 10) - parseInt(el.style('padding-top'), 10) - parseInt(el.style('padding-bottom'), 10);
    }
    
    self.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };

  };
  
  
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
            return parseInt(d * 100) + "%";
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
        svgWidth  = utils.get_width(this.parentNode.parentNode) - svgMargin.left - svgMargin.right;
        svgHeight = utils.get_height(this.parentNode.parentNode) - svgMargin.top - svgMargin.bottom;
        width     = svgWidth - margin.left - margin.right;
        height    = svgHeight - margin.bottom;
        var lineData = {},
            xDomain = [undefined, undefined],
            yDomain = [undefined, undefined];

        _.each(data, function(value, key){
          // Convert data to standard representation greedily;
          // this is needed for nondeterministic accessors.
          data[key] = data[key].map(function(d, i) {
            return [parseDate(xValue.call(data[key], d, i)), yValue.call(data[key], d, i)];
          });

          var newXDomain = d3.extent(data[key], function (d) { return d[0]; }),
              newYDomain = d3.extent(data[key], function (d) { return d[1]; });
          xDomain = [d3.min([xDomain[0], newXDomain[0]]), d3.max([xDomain[1], newXDomain[1]])];
          yDomain = [d3.min([yDomain[0], newYDomain[0]]), d3.max([yDomain[1], newYDomain[1]])];
        });

        // Update the x-scale.
        xScale
            .domain(xDomain)
            .range([0, width]);
        xAxis.tickSize(-height, 0,0);

        // Update the y-scale.
        yScale
            .domain(yDomain)
            .range([height, 0]);
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
        gEnter.append("g").attr("class", "x axis")
        gEnter.append("g").attr("class", "y axis");

        // Update the x-axis.
        svg.select(".x.axis").transition().duration(1500)
            .attr("transform", "translate(0," + yScale.range()[0] + ")")
            .call(xAxis);
        svg.selectAll(".x.axis text").transition().duration(1500).attr("y", 10);

        gEnter.select('.x.axis')
          .append("g")
          .attr("class", "x brush")

        svg.select('.x.brush')
          .call(brush)
          .selectAll("rect")
          .attr("y", -height)
          .attr("height", height)
          .style('visibility', 'visible');

        gEnter.append('rect').attr('class', 'border-rect')
              .attr('x', 1)
              .attr('y', 1)
              .attr('width', width)
              .attr('height', height)

        var paths = gEnter.append('g').attr('class', 'paths');
        _.each(data, function(value, key){
          gEnter.select('.paths').append("path").attr("class", "line " + key.replace(' ', '-')).attr('d', line(value));
        })

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
         .attr('height', height)

        _.each(data, function(value, key){
          svg.select('.' + key.replace(' ', '-')).transition().duration(1500).attr('d', line(value));
        })

        svg.selectAll('.tick').attr('class', function(d){ 
          if((d == 0 && chart_type == 'relative') || (d == 1)){
            return "bold tick"
          } else { 
            return "tick"
          }
        });
        d3.select(this).selectAll(".domain").remove();

      });
    }

    chart.setActiveLine = function(element, className){
      d3.select(element).selectAll('path.line').classed({"active": false});
      d3.select(element).select('path.line.' + className).classed({"active": true});
    }

    chart.change_brush = function(element, start, end, triggered_by){
      if (brush !== undefined && chart_type != triggered_by){
        brush.extent([start, end]);
        d3.select(element).select('.x.brush').call(brush);
        brush.event(d3.select(element));
      }
    }

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
      if (!und.isFunction(_)) {
        throw Exception('The brush callback must be a function!');
      }
      brushCallback = _;
      return chart;
    }

    return chart;
  }

  

  var host = document.querySelector(_scw.id);
  var root = host.createShadowRoot();
  root.textContent = 'The shadow DOM';

  //TODO: Refactore it ro inline style tag!
  var style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "/src/charts.css";
  document.querySelector('head').appendChild(style);
  //-------------------
  
  console.log(root);


})(window, _scw);
