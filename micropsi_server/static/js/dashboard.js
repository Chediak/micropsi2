

$(function(){

    var container = $('#dashboard_container');

    var urges = $('<div id="dashboard_urges" class="dashboard-item"></div>');
    var modulators = $('<div id="dashboard_modulators" class="dashboard-item"></div>');
    var nodes = $('<div id="dashboard_nodes" class="dashboard-item"></div>');
    var datatable = $('<div id="dashboard_datatable" class="dashboard-item"></div>');
    var sensors = $('<div id="dashboard_sensors" class="dashboard-item"></div>');

    container.append(datatable, urges, modulators, nodes, sensors, $('<p style="break:both"></p>'));

    var d3graphs = {};

    function getPollParams(){
        return 1
    }

    function setData(data){
        draw_urges(data);
        draw_modulators(data);
        draw_nodes(data);
        draw_datatable(data);
    }

    register_stepping_function('dashboard', getPollParams, setData);

    $(document).trigger('runner_stepped');

    function draw_modulators(dashboard){
        var colors = {
            // base_number_of_active_motives: 0
            // base_number_of_expected_events: 0
            // base_number_of_unexpected_events: 0
            // base_sum_importance_of_intentions: 0
            // base_sum_urgency_of_intentions: 0
            // base_unexpectedness: 1
            // base_urge_change: 0
            emo_activation: 'orange',
            emo_competence: 'blue',
            emo_pleasure: 'red',
            emo_resolution: 'purple',
            emo_securing_rate: 'brown',
            emo_selection_threshold: 'gray',
            emo_sustaining_joy: 'green'
        }
        var data = [];
        for(var key in dashboard.modulators){
            if(key in colors){
                data.push({'name': key.substr(4).replace('_', ' '), 'value': dashboard.modulators[key], 'color': colors[key]});
            }
        }
        if(data.length) drawBarChart(data, '#dashboard_modulators');
    }

    function draw_nodes(dashboard){
        var total = parseInt(dashboard['count_nodes'])
        var data = [
            {'value': dashboard['count_negative_nodes'], 'name': 'failing', 'color': 'red'},
            {'value': dashboard['count_positive_nodes'], 'name': 'success', 'color': 'green'},
            {'value': total - dashboard['count_negative_nodes'] - dashboard['count_negative_nodes'], name: 'off', color: 'lightgrey'}
        ];
        var label = total + " Nodes"
        draw_circle_chart(data, '#dashboard_nodes', label);
    }

    function draw_urges(dashboard){
        var colors = {
            'Fool': 'purple',
            'eat': 'brown',
            'sleep': 'grey',
            'warmth': 'red',
            'coldness': 'blue',
            'heal': 'green'
        }
        var data = [];
        for(var key in dashboard.urges){
            data.push({'name': key, 'value': dashboard.urges[key], 'color': colors[key]});
        }
        if(data.length) drawBarChart(data, '#dashboard_urges')
    }

    function draw_datatable(dashboard){
        var html = '<table class="table-condensed table-striped dashboard-table">';

        if(dashboard.motive){
            html += "<tr><th><strong>Motive:</strong></th><th>"+dashboard.motive.motive+"</th></tr>"
            html += "<tr><td>Weight:</td><td>"+dashboard.motive.weight+"</td></tr>"
            html += "<tr><td>Gain:</td><td>"+dashboard.motive.gain+"</td></tr>"
        }
        if(dashboard.action){
            html += "<tr><th><strong>Action:</strong></th><th>"+dashboard.action+"</th></tr>"
        }

        html += "<tr><th><strong>sec/step:</strong></th><th>"+dashboard.stepping_rate+"</th></tr>"

        if(dashboard.concepts){
            var data = [
                {'value': dashboard.concepts.failed.length, 'name': 'failing', 'color': 'red'},
                {'value': dashboard.concepts.verified.length, 'name': 'success', 'color': 'green'},
                {'value': dashboard.concepts.checking.length, 'name': 'checking', 'color': 'lightgrey'},
                {'value': dashboard.concepts.off, 'name': 'off', 'color': 'darkgrey'}
            ];
            html += "<tr><th>Concepts:</th><th><div id=\"concept_graph\"></div></th></tr>";
            html += "<tr><td>Verified:</td><td>" + (dashboard.concepts.verified.sort().join('<br />') || '--') + "</td></tr>";
            html += "<tr><td>Checking:</td><td>" + (dashboard.concepts.checking.sort().join('<br />') || '--') + "</td></tr>";
            html += "<tr><td>Failed:</td><td>" + (dashboard.concepts.failed.sort().join('<br />') || '--') + "</td></tr>";
        }

        html += "</table>"
        datatable.html(html);
        if(dashboard.concepts && dashboard.concepts.total){
            draw_circle_chart(data, '#concept_graph', dashboard.concepts.total, 80, 5);
        }
    }



    function insertLinebreaks(d) {
        var el = d3.select(this);
        var words = d.split(' ');
        el.text('');

        for (var i = 0; i < words.length; i++) {
            var tspan = el.append('tspan').text(words[i]);
            if (i > 0)
                tspan.attr('x', 0).attr('dy', '15');
        }
    }

    function drawBarChart(data, selector){

            d3graphs[selector] = {};
            var margin = {top: 20, right: 20, bottom: 70, left: 40},
                width = 500 - margin.left - margin.right,
                height = 250 - margin.top - margin.bottom;

            var x = d3.scale.ordinal().rangeRoundBands([0, width], .05);
            var y = d3.scale.linear().range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(10);

            var svg = d3.select(selector).select("svg");

            if (svg.empty()){
                svg = d3.select(selector).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                    .attr("transform",
                          "translate(" + margin.left + "," + margin.top + ")");

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis)
                  .selectAll("text")
                    .style("text-anchor", "middle")
                    .style("font-size", "80%")

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                  .selectAll("text")
                    .style("font-size", "80%")

            }

            var ymin = 0;
            var ymax = 1;
            for(var i=0; i < data.length; i++){
                data[i].value = Math.max(0, data[i].value);
                if(data[i].value < ymin) ymin = data[i].value;
                else if(data[i].value > ymax) ymax = data[i].value;
            }
            x.domain(data.map(function(d) { return d.name; }));
            y.domain([ymin, ymax]);

            svg.select(".y.axis")
                .transition().duration(500).ease("sin-in-out")  // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
                .call(yAxis);
            svg.select(".x.axis")
                .transition().duration(500).ease("sin-in-out")  // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
                .call(xAxis);

            var bars = svg.selectAll('.bar')
                .data(data)
            //update
            bars
                .attr("fill", "#009")

            //enter
            bars.enter()
                .append("svg:rect")
                .attr("class", "bar")
                .attr("fill", "#900")


            //exit
            bars.exit()
            .transition()
            .duration(300)
            .ease("exp")
                .attr("height", 0)
                .remove()

            bars
            .transition()
            .duration(300)
            .ease("quad")
               .style("fill", function(d) { return d.color})
               .attr("x", function(d) { return x(d.name); })
               .attr("width", x.rangeBand())
               .attr("y", function(d) { return y(d.value); })
               .attr("height", function(d) { return height - y(d.value); });

           svg.selectAll('g.x.axis g text').each(insertLinebreaks);
    }

    var piecharts = {}



    function draw_circle_chart(data, selector, label, height, margin){

        var values = [];
        for(var i = 0; i < data.length; i++){
            values.push(data[i].value);
        }
        //Width and height
        var margin = margin || 20;
        var h = height || 180;
        var w = h - margin;

        var outerRadius = w / 2;
        var innerRadius = w / 3;
        var arc = d3.svg.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius);


        function arcTween(a) {
          var i = d3.interpolate(this._current, a);
          this._current = i(0);
          return function(t) {
            return arc(i(t));
          };
        }

        var svg = d3.select(selector).select("svg");
        if(!svg.empty() && piecharts[selector]){

            var text = svg.select("text");
            var pie = piecharts[selector]['pie']
            text.text(label)
            pie.value(function(d, i){return values[i]})
            path = piecharts[selector]['path'].data(pie); // compute the new angles
            path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
            return
        }

        piecharts[selector] = {}

        var pie = d3.layout.pie()
                    .value(function(d, i){return values[i]});

        piecharts[selector]['pie'] = pie;

        //Create SVG element
        var svg = d3.select(selector)
                    .append("svg")
                    .attr("width", w + margin)
                    .attr("height", h + margin);

        piecharts[selector]['path'] = svg.datum(values).selectAll("path")
                      .data(pie)
                      .enter()
                      .append("path")
                      .attr("class", "arc")
                      .attr("d", arc)
                      .attr("fill", function(d, i) {
                        return data[i].color;
                      })
                      .each(function(d) { this._current = d; })
                      .attr("transform", "translate(" + (outerRadius + margin) +"," + (outerRadius + margin) + ")")

        svg.append("text")
            .text(label)
            .style("text-anchor", "left")
            .attr("dx", w/2 - margin/1.5)
            .attr("dy", h/2 + margin/1.5)
    }

});