/* global __sc_tmpl */
/* global __sc_cs */
/* global Exception */
/* global _ */
//TODO: Remove and change to d3.time.format if it possible
/* global moment */
/* global d3 */
(function() {
  "use strict";
  
  var __WidgetStyles, __WidgetTmpl, __WidgetData;
  
  var widgetStyles = __sc_cs,
      widgetTmpl   = __sc_tmpl,
      chartTypes   = ['relative_price', 'growth_of_one_dollar'];
  
  var ATTRS               = 'attrs',
      ABSOLUTE_METRICS    = 'abs_metrics',
      RELATIVE_METRICS    = 'rel_metrics',
      MODERATE_AGGRESSIVE = 'Moderate Aggressive';
  
  var utils = {
    isFunction : function(obj) {
      return typeof obj == 'function' || false;
    },
    yearToTimestamp : function (year) {
      var res = 'cumulative';
      if (_.isNumber(year)) {
        res = moment.utc(year+'-12-31').business(true).format("X")*1000;
      }
      return res; 
    },
    round: function (n) {
      var st = Math.pow(10, n);
      return function (v) {
        return Math.round(Number(v)*st)/st;
      };
    }
  };
  

  var timeSeriesChart = function() {

    var margin     = {top: 0, right: 20, bottom: 20, left: 50},
        svgWidth   = 580,
        svgHeight  = 350,
        width      = svgWidth,
        height     = svgHeight,
        
        chart_type = 'relative_price',
        xValue = function(d) { return d[0]; },
        yValue = function(d) { return d[1]; },
        xScale = d3.time.scale(),
        yScale = d3.scale.linear(),
        xAxis  = d3.svg.axis()
          .scale(xScale)
          .orient("bottom")
          .ticks(6),
        yAxis  = d3.svg.axis()
          .scale(yScale)
          .orient("left")
          .ticks(6)
          .tickFormat(function(d){
            if (chart_type == 'relative_price'){
              return Number(Number(d) * 100) + "%";
            } else {
              return "$" + d.toFixed(2);
            }
          }),
        parseDate = function (unixTime) { 
          return moment(unixTime, 'X').toDate(); 
        },
        line = d3.svg.line()
          .x(function(d) { return xScale(d[0]); })
          .y(function(d) { return yScale(d[1]); }),
        brush = d3.svg.brush()
          .x(xScale)
          .on("brushend", function(){
            var extent = brush.extent();
            if(utils.isFunction(brushCallback)) {
              brushCallback(extent, brush);
            } 
          }),
        brushCallback,
        chooseYearClb,
        crossIconCallback;
    
    function prepareData(newData){
      var intermediateRes, 
        results = {};
      
      intermediateRes = _.chain(chartTypes)
        .map(function(chartType){
          return newData[chartType][chartType];
        })
        .value();
      
      _.each(intermediateRes[chartTypes.indexOf(chart_type)], function(data, key){
        results[key] = _.chain(data)
          .map(function(k, v){
            return {
              x: Number(v)/1000,
              y: k };
          })
          .filter(function(o){ return !_.isNaN(o.x); })
          .sortBy(function(o){ return o.x; })
          .value();
        });
      return results;
    }
    
    function chart(selection) {
      selection.each(function(newData) {
        
        var data = prepareData(newData);

        width  = svgWidth - margin.left - margin.right;
        height = svgHeight - margin.bottom - 10;
        
        var xDomain = [undefined, undefined],
            yDomain = [undefined, undefined];

        _.each(data, function(value, key){
          // Convert data to standard representation greedily;
          // this is needed for nondeterministic accessors.
          data[key] = _.map(data[key], function(d, i) {
            return [
              parseDate(xValue.call(data[key], d, i)), 
              yValue.call(data[key], d, i)
            ];
          });

          var newXDomain = d3.extent(data[key], function (d) { return d[0]; }),
              newYDomain = d3.extent(data[key], function (d) { return d[1]; });
              
          xDomain = [
            d3.min([xDomain[0], newXDomain[0]]), 
            d3.max([xDomain[1], newXDomain[1]])
          ];
          yDomain = [
            d3.min([yDomain[0], newYDomain[0]]), 
            d3.max([yDomain[1], newYDomain[1]])
          ];
          
        });

        // Update the x-scale.
        xScale.domain(xDomain).range([0, width]);
        xAxis.tickSize(-height, 0,0);

        // Update the y-scale.
        yScale.domain(yDomain).range([height, 0]);
        yAxis.tickSize(-width, 0,0);

        // Select the svg element, if it exists.
        var svg = d3.select(this)
          .selectAll("svg")
          .data([data]);

        if (brush.empty()){
          brush.extent(xDomain);
        } else{
          // redraw selection on resize;
          brush.extent(brush.extent());
        }

        // Otherwise, create the skeletal chart.
        var gEnter = svg.enter()
          .append("svg")
          .append("g");
        
        gEnter.append('rect')
          .attr('class', 'border-rect')
          .attr('x', 1)
          .attr('y', 1)
          .attr('width', width)
          .attr('height', height);
        
        gEnter.append("g").attr("class", "x axis");
        gEnter.append("g").attr("class", "y axis");

        // Update the x-axis.
        svg.select(".x.axis")
          .transition()
          .duration(1500)
          .attr("transform", "translate(0," + yScale.range()[0] + ")")
          .call(xAxis);
        
        svg.selectAll(".x.axis > g > text")
          .transition()
          .duration(1500)
          .attr("y", 10)
          .attr('class', function(d){
            return 'tick-year y'+d.getFullYear();
          });

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
        
        var gEnterLoup = gEnter
             .selectAll(".x.axis .tick")
             .append('g')
             .attr('class', function(d){
                return 'loup-icon y'+d.getFullYear();
              });
            
          gEnterLoup
            .append('image')
            .attr('xlink:href', _scw.icons_prifex + 'build/loup.png')
            .attr('x', -34)
            .attr('y', 8)
            .attr('height', '14px')
            .attr('width', '14px');
          
          gEnterLoup
            .append('line')
            .attr('x1', -34)
            .attr('y1', 28)
            .attr('x2', 18)
            .attr('y2', 28);
          
        var gEnterCircle = gEnter
            .selectAll(".x.axis .tick")
            .append('g')
            .attr('class', function(d, i){
              return 'icon-cross y' + d.getFullYear();
            })
            .attr('style', 'visibility: hidden;')
            .on('click', function(d, i){
              if(utils.isFunction(crossIconCallback)){
                crossIconCallback(d, i);
              }
            });
            
            gEnterCircle
              .append('circle')
              .attr('r', '8px')
              .attr('cx', '-26px')
              .attr('cy', '14px');
            
            gEnterCircle
              .append('text')
              .attr('x', '-29.5px')
              .attr('y', '18px')
              .text('x');
        
        var enterLines = svg
          .select('.paths')
          .selectAll('.line')
          .data(_.values(data));
        
        enterLines.enter()
          .append("path")
          .attr('class', function(d){
            return 'line'; 
           });
        
        enterLines
          .transition(1500)
          .attr('d', function(d){
            return line(d); 
          });
           
         enterLines.exit().remove();

        // Update the outer dimensions.
        svg.attr("width", svgWidth)
           .attr("height", svgHeight);

        // Update the inner dimensions.
        var g = svg.select("g")
            .attr(
              "transform", 
              "translate(" + margin.left + "," + margin.top + ")"
             );

        g.select(".y.axis")
          .transition()
          .duration(1500)
          .call(yAxis);
          
        g.selectAll(".y.axis text")
          .transition()
          .duration(1500)
          .attr("x", -10);

        g.select('.x.brush').call(brush);
        
        g.select('.x.brush .resize').remove();
        
        g.select('.border-rect')
         .transition()
         .duration(1500)
         .attr('width', width)
         .attr('height', height);

        _.each(data, function(value, key){
          svg.select('.' + key.replace(' ', '-'))
            .transition()
            .duration(1500)
            .attr('d', line(value));
        });

        svg.selectAll('.tick').attr('class', function(d){ 
          if((d == 0 && chart_type == 'relative') || (d == 1)){
            return "bold tick";
          } else { 
            return "tick";
          }
        });
        
        var that = this;
        
        svg.selectAll(".x.axis .tick text")
          .on('mouseover', function(d, i){
            var _y = '.loup-icon.y' + d.getFullYear();
            svg.select(_y).attr('style', 'visibility:visible;');
          })
          .on('mouseout', function(d, i){
            var _y = '.loup-icon.y' + d.getFullYear();
            svg.select(_y).attr('style', 'visibility:hidden;');
          });
        
        svg.selectAll(".x.axis .tick text")
          .on('click', function(date, index){
            if(utils.isFunction(chooseYearClb)){
              chooseYearClb(date, index);
              var endDate = moment(date).add(1, 'year').toDate();
              chart.change_brush(that, date, endDate);
            }
          });
        
        d3.select(this).selectAll(".domain").remove();

      });
    }

    chart.setActiveLine = function(element, className){
      
      d3.select(element)
        .selectAll('path.line')
        .classed({"active": false});
        
      d3.select(element)
        .select('path.line.' + className)
        .classed({"active": true});
        
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
    
    chart.chooseYear = function(_) {
      if (!arguments.length) return chooseYearClb;
      if (!utils.isFunction(_)) {
        throw Exception('The year callback must be a function!');
      }
      chooseYearClb = _;
      return chart;
    };
    
    chart.setCrossIconCallback = function(_) {
      if (!arguments.length) return crossIconCallback;
      if (!utils.isFunction(_)) {
        throw Exception('The cross icon callback must be a function!');
      }
      crossIconCallback = _;
      return chart;
    };
    
    
    chart.chartType = function(_) {
      if (!arguments.length) return chart_type;
      chart_type = _;
      return chart;
    };

    return chart;
  };
  
  var relativeMetricsTable = function() {
    
     var horizontalMap = [
       'beta', 'risk_adjusted_excess_return', 
       'alpha', 'upcapture', 'downcapture'
        ],
     year;
     
     function mapData(inData){
       var dtKey = utils.yearToTimestamp(year),
       out = 
         _.chain(horizontalMap)
           .map(function(key){
              return inData[key][MODERATE_AGGRESSIVE][dtKey];
            })
            .map(utils.round(3))
            .value();
       return out;
     }
     
     function chart(selection) {
      selection.each(function(rawData){
        var data = mapData(rawData),
            line = d3.select(this).selectAll("td").data(data);

        line.transition().text(function(d){ return d; });

        
      });
     };
     
    chart.setYear = function(_y){
      if (!arguments.length) return year;
      if (_.isNumber(_y)) {
        year = _y;
      } else {
        throw 'Year must be a number!';
      }
      return chart;
    };
    
    chart.resetYear = function(){
      year = undefined;
      return chart;
    }
     
     return chart;
  };
  
  
  var absoluteMetricsTable = function() {
    
    var horizontalMap = [
         'annualized_return', 
         'annualized_vol', 
         'sharpe_ratio', 
         'sortino_ratio', 
         'max_drawdown'
          ],
        verticalMap = [
          'Client Strategy', 
          'Moderate Aggressive'],
        heatMap = {
          'annualized_return' : true,
          'annualized_vol'    : false,
          'sharpe_ratio'      : true,
          'sortino_ratio'     : true,
          'max_drawdown'      : false,
        },
        RED_CLS   = 'red-cell',
        GREEN_CLS = 'green-cell',
        year;
     
     function mapData(inData) {
       var out  = [[], []],
          dtKey = utils.yearToTimestamp(year);
       _.chain(horizontalMap)
         .each(function(key, index){
           _.each(_.range(2), function(r){
             var val = inData[key][verticalMap[r]][dtKey];
                 val = utils.round(3)(val);
             out[r].push(val);
           });
         })
         .value();
       return out;
     }
     
     function chart(selection) {
      selection.each(function(rawData){
        var data = mapData(rawData),
            line1 = d3.select(this).selectAll(".l1 td").data(data[0]),
            line2 = d3.select(this).selectAll(".l2 td").data(data[1]);
        
        function setHeatMap(k){
          return function(d, i){
            if(heatMap[horizontalMap[i]]){
              return d > data[k][i] ? GREEN_CLS : RED_CLS;
            } else {
              return d < data[k][i] ? GREEN_CLS : RED_CLS;
            }
          }
        }
        
        line1.transition()
          .attr('class', setHeatMap(1))
          .text(function(d){ return d; });
          
        line2.transition()
          .attr('class', setHeatMap(0))
          .text(function(d){ return d; });
        
      });
     };
     
    chart.setYear = function(_y){
      if (!arguments.length) return year;
      if (_.isNumber(_y)) {
        year = _y;
      } else {
        throw 'Year must be a number!';
      }
      return chart;
    };
    
    chart.resetYear = function(){
      year = undefined;
      return chart;
    }
    
     return chart;
     
  };
  
  var assetPieChart = function() {
    
    var svgWidth   = 380,
        svgHeight  = 240,
        width      = svgWidth,
        height     = svgHeight,
        radius     = Math.min(width, height) / 2,
        colorRange = ["#98A9B8", "#7C485A", "#F5A95F", "#E5DAC7", "#434E65"];
  
    var year;
    
    function prepareData(newData){
      var AC_WTS = 'ac_wts-mean';
      var keyToGet, dtCheck;
      if(_.isNumber(year)) {
        keyToGet = utils.yearToTimestamp(year);
      } else {
        keyToGet = 'cumulative';
      }
      var results = 
        _.chain(newData[AC_WTS])
          .map(function(val, key){
            return {
              label: key,
              value: val[keyToGet]
            }
          })
          .sort(function(val){
            return val.label;
          })
          .value();
      
      return results;
    }
    
    function chart(selection) {
      selection.each(function(newData) {
        var data = prepareData(newData);
        var svg = d3.select(this).selectAll("svg").data([data]);
        
        var gEnter = 
          svg.enter()
            .append("svg")
            .append('g')
            .attr('class', 'acw');
        
        gEnter.append("g")
          .attr("class", "slices");
          
        gEnter.append("g")
          .attr("class", "labels");
          
        gEnter.append("g")
          .attr("class", "lines");
          
        gEnter.append("g")
          .attr("class", "outer-arc")
          .append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', radius*0.8);
  
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
        
        gEnter.attr(
          "transform", 
          "translate(" + width / 2 + "," + height / 2 + ")"
        );
        svg.attr("width", width);
        svg.attr("height", height);
        
        var key = function(d){ return d.data.label; };
        
        var color = d3.scale.ordinal()
          .domain(_.map(data, function(d){ return d.label; }))
          .range(colorRange);
        
         function mapData (data){
            var labels = color.domain();
            return labels.map(function(label, i){
              return data[i];
            });
          }
          
        change(mapData(data));
        
        function change(data) {

          /* ------- PIE SLICES -------*/
          var slice = svg.select(".slices")
            .selectAll("path.slice")
            .data(pie(data), key);
          
          slice.enter()
            .insert("path")
            .style("fill", function(d) { 
              return color(d.data.label); 
             })
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
              this._current   = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current   = interpolate(0);
              return function(t) {
                var d2  = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0]  = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                return "translate("+ pos +")";
              };
            })
            .styleTween("text-anchor", function(d){
              this._current   = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current   = interpolate(0);
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
                  return a*1.75;
                });
                return [innerPos, outerArc.centroid(d2), pos];
              };
            });
          
          polyline.exit().remove();
      };

      });
    }
    
    chart.reRalcRadius = function(){
      radius = Math.min(width, height) / 2;
      return chart;
    }
    
    chart.width = function(_){
      if (!arguments.length) return width;
      width = _;
      return chart;
    };

    chart.height = function(_){
      if (!arguments.length) return height;
      height = _;
      return chart;
    };
    
    chart.setYear = function(_y){
      if (!arguments.length) return year;
      if (_.isNumber(_y)) {
        year = _y;
      } else {
        throw 'Year must be a number!';
      }
      return chart;
    };
    
    chart.resetYear = function(){
      year = undefined;
      return chart;
    }
    
    return chart;
    
  };
  
  var updateYear = function(root, year){
    var what = _.clone(year);
    if(!_.isNumber(year)){
      what = 'cumulative';
    }
    _.each(
      root.querySelectorAll('.year-title'), 
      function(t){ 
        return t.innerText = what; 
      }
    );
  }
  
  
  /* MAIN ROOT NODES */
  var root; 
  
  function main() {
    
    var host = document.querySelector(_scw.id);
    
    root = host.createShadowRoot();
      
    var styleElm    = document.createElement('style'),
        tmplElm     = document.createElement('div'),
        switcherElm = document.querySelector('.js');
  
    tmplElm.className  = 'widget strat-check-a04g5ewen4tggb9';
    styleElm.innerHTML = widgetStyles;
    tmplElm.innerHTML  = widgetTmpl;
    
    if(Platform.shadowDOM === 'polyfill') {
      document.querySelector('head').appendChild(styleElm);
    } else {
      root.appendChild(styleElm);
    }
    root.appendChild(tmplElm);
    
    var mainGraph   = root.querySelector('.mg'),
        apGraph     = root.querySelector('.cg'),
        amTable     = root.querySelector('.am'),
        rmTable     = root.querySelector('.rm'),
        switcherElm = root.querySelector('.js');
  
    var init = new Switchery(
      switcherElm, 
      {color: '#9a9a9a', secondaryColor: '#9a9a9a'}
     );
    /* GRAPH INITS */
    
    var apChart = 
      assetPieChart()
        .width(520)
        .height(240)
        .reRalcRadius();
    
    var drawCircleChart = function(newData, year) { 
      
      if(_.isNumber(year)) {
        apChart.setYear(year);
      } else {
        apChart.resetYear();
      }
      
      d3.select(apGraph)
        .datum(newData)
        .call(apChart);
    };
    
    
    var amTableD = absoluteMetricsTable();
    
    function drawAbsoluteTable(data, year){
      
      if(_.isUndefined(year)){
        amTableD.resetYear();
      } else {
        amTableD.setYear(year);
      }
      
      d3.select(amTable)
        .datum(data)
        .call(amTableD);
    };
    
    var rmTableD = relativeMetricsTable();
    
    function drawRelativeTable(data, year){
      
      if(_.isUndefined(year)){
        rmTableD.resetYear();
      } else {
        rmTableD.setYear(year);
      }
      
      d3.select(rmTable)
        .datum(data)
        .call(rmTableD);
    };
    
    
    function __ResetAndRenderGraphs() {
      updateYear(root);
      drawCircleChart(__WidgetData[ATTRS]);
      drawAbsoluteTable(__WidgetData[ABSOLUTE_METRICS]);
      drawRelativeTable(__WidgetData[RELATIVE_METRICS]);
      root.querySelector('.x.brush').style.opacity = '0';
    }
    
    var chart = 
      timeSeriesChart()
        .x(function(o){ return o.x; })
        .y(function(o){ return o.y; })
        .chartType(chartTypes[0])
        .chooseYear(function(dt, index){
          var y     = dt.getFullYear(),
              texts = root.querySelectorAll('.x.axis .tick text'),
              cross = root.querySelectorAll('.x.axis .tick .icon-cross');
           
           
          _.chain(texts)
            .each(function(elm, i){
              elm.style.fill = '#64b1e0';
            })
            .value();
           d3.selectAll(cross).attr('style', 'visibility: hidden;');
              
          if (y < 2015) {
            updateYear(root, y);
            drawCircleChart(__WidgetData[ATTRS], y);
            drawAbsoluteTable(__WidgetData[ABSOLUTE_METRICS], y);
            drawRelativeTable(__WidgetData[RELATIVE_METRICS], y);
            
            root.querySelector('.x.brush').style.opacity = '1';
            
            _.chain(texts)
              .filter(function(elm, i){
                return Number(elm.innerHTML) !== y;
              })
              .each(function(elm, i){
                elm.style.fill = '#999999';
              })
              .value(),
            _.chain(cross)
              .filter(function(elm, i){
                var cY = 
                  _.chain(elm.classList)
                    .tail()
                    .map(function(d){
                      return Number(d.replace('y', ''));
                    })
                    .head()
                    .value();
                    
                return cY === y;
              })
              .each(function(elm, i){
                elm.style.visibility = 'visible';
              })
              .value();
            
          } else {
            updateYear(root);
            drawCircleChart(__WidgetData[ATTRS]);
            drawAbsoluteTable(__WidgetData[ABSOLUTE_METRICS]);
            drawRelativeTable(__WidgetData[RELATIVE_METRICS]);
            
            root.querySelector('.x.brush').style.opacity = '0';
          }
        })
        .setCrossIconCallback(function(dt, index){
          var texts = root.querySelectorAll('.x.axis .tick text'),
              cross = root.querySelectorAll('.x.axis .tick .icon-cross');
              
          _.chain(texts)
            .each(function(elm, i){
              elm.style.fill = '#64b1e0';
            })
            .value();
            
          d3.selectAll(cross).attr('style', 'visibility: hidden;');
          __ResetAndRenderGraphs();
        });
     
    var drawMainChart = function(newData) {
      d3.select(mainGraph)
        .datum(newData)
        .call(chart);
    };
    
    switcherElm.onchange = function(){
      if (switcherElm.checked) {
        chart.chartType('growth_of_one_dollar');
      } else {
        chart.chartType('relative_price');
      }
      root.querySelector('.switch .l').classList.toggle('checked');
      root.querySelector('.switch .r').classList.toggle('checked');
      drawMainChart(__WidgetData);
    };
    
    drawCircleChart(__WidgetData[ATTRS]);
    drawAbsoluteTable(__WidgetData[ABSOLUTE_METRICS]);
    drawRelativeTable(__WidgetData[RELATIVE_METRICS]);
    drawMainChart(__WidgetData);
  
  }
  
  d3.json(
    'http://api.stratcheck.io/v1/widget/'+_scw.widget_id, 
    function(error, data){
      if(error) {
        console.log(error);
      } else {
        __WidgetData = data;
        main();
        document.querySelector('#test-widget').style.background = '';
          _.each(root.querySelectorAll('.row'), function(elm){
          elm.style.display = 'block';
        });
      }
    }
  );

})(window, __sc_cs, __sc_tmpl);
 