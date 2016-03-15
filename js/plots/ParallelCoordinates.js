function ParallelPlot(root, filePath, data_provider) {

    var instance = this;

    // Visualization type config
    this.vis_name = "Parallel Coordinate Plot";
    this.vis_id = "parallell_plot";

    this.data_provider = data_provider;

    this.config = {
        is_on: false,
        enabled_dimensions: [],
        graphic: {
            width: 0,
            height: 0,
            margin: undefined
        }
    };

    this.rootNode = root;

    this.path = filePath;

    // Local working copy of data(filtering, etc...)
    this.data_copy = null;

    this.csvDat;

    this.rendering = {
        features: {
            prototype: {
                is_on: false,
                initialize: function () {
                    return;
                },
                enable: function () {
                    return;
                },
                disable: function () {
                    return;
                },
                reset: function () {

                }
            },
            dragging: {
                is_on: false,
                initialize: function () {
                    return;
                },
                enable: function () {
                    return;
                },
                disable: function () {
                    return;
                },
                reset: function () {

                }
            }

        },
        data: {
            draw_data: {
                graphic: undefined,
                x_scale: undefined,
                y_scale: undefined,
                line: undefined,
                axis: undefined,
                background: undefined,
                foreground: undefined
            },
            raw_data: {

            },
            sample_map: {

            },
            gen_draw_data: function () {
                return null;
            }
        },
        model: {
        },
        draw: function () {
            instance.config.graphic.margin = {top: 30, right: 10, bottom: 10, left: 10};
            instance.config.graphic.width = 600 - instance.config.graphic.margin.left - instance.config.graphic.margin.right;
            instance.config.graphic.height = 500 - instance.config.graphic.margin.top - instance.config.graphic.margin.bottom;

            instance.rendering.data.draw_data.x_scale = d3.scale.ordinal().rangePoints([0, instance.config.graphic.width], 1);
            instance.rendering.data.draw_data.y_scale = {};
            instance.rendering.features.dragging = {};

            instance.rendering.data.draw_data.line = d3.svg.line();
            instance.rendering.data.draw_data.axis = d3.svg.axis().orient('left');

            instance.rendering.data.draw_data.graphic = instance.rootNode.append('svg')
                .attr("width", instance.config.graphic.width + instance.config.graphic.margin.left + instance.config.graphic.margin.right)
                .attr("height", instance.config.graphic.height + instance.config.graphic.margin.top + instance.config.graphic.margin.bottom)
                .append("g")
                .attr("transform", "translate(" + instance.config.graphic.margin.left + "," + instance.config.graphic.margin.top + ")");

            instance.data_copy = instance.sanitize(instance.data_provider.get_data());

            instance.rendering.data.draw_data.x_scale.domain(dimensions = d3.keys(instance.data_copy[0].rowdata).filter(function(d) {

                // Check for if data dimension is enabled && check if ordinal or number

                if (instance.config.enabled_dimensions.indexOf(d) < 0) {
                    return;
                }

                if (isNaN(Number(instance.data_copy[0].rowdata[d]))) {
                    instance.rendering.data.draw_data.y_scale[d] = d3.scale.ordinal()
                        .domain(instance.data_copy.map(function(p) {
                            return p.rowdata[d];
                        }))
                        .rangePoints([instance.config.graphic.height, 0]);
                } else {
                    instance.rendering.data.draw_data.y_scale[d] = d3.scale.linear()
                        .domain(d3.extent(instance.data_copy, function(p) {
                            return +p.rowdata[d];
                        }))
                        .range([instance.config.graphic.height, 0]);
                }

                return true;
            }));

            // Add grey background lines for context.
            instance.rendering.data.draw_data.background = instance.rendering.data.draw_data.graphic.append("g")
                .attr("class", "background")
                .selectAll("path")
                .data(instance.data_copy)
                .enter().append("path")
                .attr("d", path);

            // Add blue foreground lines for focus.
            instance.rendering.data.draw_data.foreground = instance.rendering.data.draw_data.graphic.append("g")
                .attr("class", "foreground")
                .selectAll("path")
                .data(instance.data_copy)
                .enter().append("path")
                .attr("d", path);

            // Add a group element for each dimension.
            var g = instance.rendering.data.draw_data.graphic.selectAll(".dimension")
                .data(dimensions)
                .enter().append("g")
                .attr("class", "dimension")
                .attr("transform", function(d) { return "translate(" + instance.rendering.data.draw_data.x_scale(d) + ")"; })
                .call(d3.behavior.drag()
                    .origin(function(d) { return {x: instance.rendering.data.draw_data.x_scale(d)}; })
                    .on("dragstart", function(d) {
                        instance.rendering.features.dragging[d] = instance.rendering.data.draw_data.x_scale(d);
                        instance.rendering.data.draw_data.background.attr("visibility", "hidden");
                    })
                    .on("drag", function(d) {
                        instance.rendering.features.dragging[d] = Math.min(instance.config.graphic.width, Math.max(0, d3.event.x));
                        instance.rendering.data.draw_data.foreground.attr("d", path);
                        dimensions.sort(function(a, b) { return position(a) - position(b); });
                        instance.rendering.data.draw_data.x_scale.domain(dimensions);
                        g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
                    })
                    .on("dragend", function(d) {
                        delete instance.rendering.features.dragging[d];
                        transition(d3.select(this)).attr("transform", "translate(" + instance.rendering.data.draw_data.x_scale(d) + ")");
                        transition(instance.rendering.data.draw_data.foreground).attr("d", path);
                        instance.rendering.data.draw_data.background
                            .attr("d", path)
                            .transition()
                            .delay(500)
                            .duration(0)
                            .attr("visibility", null);
                    }));

            // Add an axis and title.
            g.append("g")
                .attr("class", "axis")
                .each(function(d) { d3.select(this).call(instance.rendering.data.draw_data.axis.scale(instance.rendering.data.draw_data.y_scale[d])); })
                .append("text")
                .style("text-anchor", "middle")
                .attr("y", -9)
                .text(function(d) { return d; });

            // Add and store a brush for each axis.
            g.append("g")
                .attr("class", "brush")
                .each(function(d) {
                    d3.select(this).call(instance.rendering.data.draw_data.y_scale[d].brush = d3.svg.brush().y(instance.rendering.data.draw_data.y_scale[d]).on("brushstart", brushstart).on("brush", brush));
                })
                .selectAll("rect")
                .attr("x", -8)
                .attr("width", 16);

            function position(d) {
                var v = instance.rendering.features.dragging[d];
                return v == null ? instance.rendering.data.draw_data.x_scale(d) : v;
            }

            function transition(g) {
                return g.transition().duration(500);
            }

            // Returns the path for a given data point.
            function path(d) {
                return instance.rendering.data.draw_data.line(dimensions.map(function(p) { return [position(p), instance.rendering.data.draw_data.y_scale[p](d.rowdata[p])]; }));
            }

            function brushstart() {
                d3.event.sourceEvent.stopPropagation();
            }

            // Handles a brush event, toggling the display of foreground lines.
            function brush() {
                // Todo: do inter vis brushing only on brush stop
                instance.rendering.brushing.selected = [];
                var actives = dimensions.filter(function(p) {
                        return !instance.rendering.data.draw_data.y_scale[p].brush.empty();
                    }),
                    extents = actives.map(function(p) {
                        return instance.rendering.data.draw_data.y_scale[p].brush.extent();
                    });
                instance.rendering.data.draw_data.foreground.style("display", function(d) {
                    if (actives.every(function(p, i) {
                            var pos = 0;

                            if (isNaN(Number(d.rowdata[p]))) {
                                pos = instance.rendering.data.draw_data.y_scale[p](d.rowdata[p]);
                            } else {
                                pos = d.rowdata[p];
                            }

                            return extents[i][0] <= pos && pos <= extents[i][1];
                        })) {
                        instance.rendering.brushing.selected.push(Number(d.anomalyid));
                        return null;
                    } else {
                        return 'none';
                    }
                });
                if (extents.length > 0 && instance.rendering.brushing.selected.length > 0) {
                    nii_vis_config.renderer.brushing.brush(instance.rendering.brushing.selected, instance);
                } else {
                    nii_vis_config.renderer.brushing.reset(instance);
                }
            }
        },
        brushing: {
            selected: [],
            brush: function (selected) {
                instance.rendering.data.draw_data.foreground.style('display', function(d) {
                    return selected.indexOf(Number(d.anomalyid)) > -1 ? null : 'none';
                });
            },
            reset: function (selected) {
                instance.rendering.data.draw_data.foreground.style('display', function(d) {
                    return null;
                });
            }
        }
    }

    this.sanitize = function (data) {
        // Todo: might move sanitation to DB for faster sanitation
        // Todo: advantages: speed
        // Todo: disadvantages: less flexibility or per vis-type query
        var keys = d3.keys(data[0].rowdata);
        var new_data = [];

        data.forEach(function (row) {
            var has_invalid = false;
            for (var i = 0; i < keys.length; ++i) {
                if (instance.config.enabled_dimensions.indexOf(keys[i])) {
                    if (row.rowdata[keys[i]] === '' || row.rowdata[keys[i]] === 'undefined') {
                        has_invalid = true;
                    }
                }
            }

            if (!has_invalid) {
                new_data.push(row);
            }
        });

        return new_data;
    }

    this.ui = {
        ui_helper: {
            setup: {},
            sidepanel: {}
        },
        ui_building: {
            setup: {
                settings_box: function (dimension_list) {

                    var box_top = '<div id="box-' + instance.vis_id + '" class="hidden">'
                        + '<div class="panel panel-default">'
                        + '<div class="panel-heading">Parallell Plot - Select which axis to draw</div>'
                        + '<div class="panel-body">'
                        + '<span id="par-plot-content" class="panel-inline-content">'
                        + '<ul id="axis-list" class="list-group">';

                    var box_content = "";
                    for (var i = 0; i < dimension_list.length; i++) {
                        box_content += '<li class="list-group-item">'
                            + '<span>' + dimension_list[i] + '</span>'
                            + '<span class="dl-header-checkbox">'
                            + '<input id="pcp-' + dimension_list[i] + '" type="checkbox" checked>'
                            + '</span>'
                            + '</li>';
                    }

                    // Todo: insert other methods like sorting etc...

                    var box_bottom = '</ul>'
                        + '</span>'
                        + '<span class="panel-inline-content panel-inline-button">'
                        + '<button type="button" data-id="' + instance.vis_id + '" class="btn btn-default" aria-label="Left Align" onclick="nii_vis_config.ui.setup.next_vis_settings(this);"><span>Next</span><span class="glyphicon glyphicon-arrow-right next-glyphicon" aria-hidden="true"></span></button>'
                        + '</span>'
                        + '</div>'
                        + '</div>'
                        + '</div>';

                    return box_top + box_content + box_bottom;
                },

                parse_settings_box: function (dom_box) {

                    var box_content = dom_box.children[0].children[1].children[0];
                    var dimension_list = box_content.children[0].children;

                    for (var i = 0; i < dimension_list.length; i++) {
                        if (dimension_list[i].children[1].firstChild.checked) {
                            instance.config.enabled_dimensions.push(dimension_list[i].firstChild.textContent);
                        }
                    }
                    // Todo: parse more settings
                    // Todo: ideas for later - group values together (bigger networks etc)
                }},
            sidepanel: {
                get_sidepanel_settings: function () {
                    var html_start = '<div><h5>' + instance.vis_name + '</h5>';
                    var html_end = '</div>';

                    var visual = '<h6>Visual</h6>';
                    var features = '<h6>Features</h6>';
                    var mapping = '<h6>Mapping</h6>'; // Mapping dropdown / or multi dimension mapping

                    return html_start + visual + '<hr id="settings-sidepanel-section-splitter" noshade/>' + features + '<hr id="settings-sidepanel-section-splitter" noshade/>' + mapping + html_end;
                }
            }
        }
    }
}

