function NetworkGraph(rootNode, filePath, data_provider) {

    var instance = this;

    this.vis_name = "Graph Plot";
    this.vis_id = "graph_plot";

    this.data_provider = data_provider;

    this.root = rootNode;

    this.path = filePath;

    this.width = 450;

    this.height = 500;

    this.data_prepared = false;

    //Set up the colour scale
    var color = d3.scale.category20();

    this.config = {
        is_on: false,
        allow_empty: false,
        mapping: {
            directed: undefined,
            nodes: undefined,
            edges: {
                source: undefined,
                target: undefined,
                inter: undefined,
                value: undefined
            }
        }
    }

    this.ui = {
        ui_helper: {
            setup: {
                directed_change: function (checkbox) {
                    if (checkbox.checked) {
                        document.getElementById(instance.vis_id + '-node-single-target-container').hidden = false;
                        document.getElementById(instance.vis_id + '-node-multi-target-container').hidden = false;

                        document.getElementById(instance.vis_id + '-node-single-source-container').firstChild.firstChild.textContent = 'Source Nodes';
                        document.getElementById(instance.vis_id + '-node-multi-source-container').firstChild.hidden = false;
                    } else {
                        document.getElementById(instance.vis_id + '-node-single-target-container').hidden = true;
                        document.getElementById(instance.vis_id + '-node-multi-target-container').hidden = true;

                        document.getElementById(instance.vis_id + '-node-single-source-container').firstChild.firstChild.textContent = 'Nodes';
                        document.getElementById(instance.vis_id + '-node-multi-source-container').firstChild.hidden = true;
                    }
                },

                nan_change: function (checkbox) {
                    return;
                },

                multi_change: function (checkbox) {
                    if (checkbox.id === 'graph-setup-multi-node-checkbox') {
                        if (checkbox.checked) {
                            document.getElementById(instance.vis_id + '-node-single-container').hidden = true;
                            document.getElementById(instance.vis_id + '-node-multi-container').hidden = false;
                        } else {
                            document.getElementById(instance.vis_id + '-node-single-container').hidden = false;
                            document.getElementById(instance.vis_id + '-node-multi-container').hidden = true;
                        }
                    } else { // Change edges multi
                        if (checkbox.checked) {
                            document.getElementById(instance.vis_id + '-edge-single-container').hidden = true;
                            document.getElementById(instance.vis_id + '-edge-multi-container').hidden = false;
                        } else {
                            document.getElementById(instance.vis_id + '-edge-single-container').hidden = false;
                            document.getElementById(instance.vis_id + '-edge-multi-container').hidden = true;
                        }
                    }
                },

                create_dropdown: function (item_list, initial_value, dropdown_id, inline) {

                    var container = inline ? 'span' : 'div';

                    var html = '<' + container + ' id="' + dropdown_id + '_selection_container" class="dropdown">'
                        + '<button class="btn btn-default dropdown-toggle" type="button" id="' + dropdown_id + '_selector" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">'
                        + initial_value
                        + '<span class="caret"></span>'
                        + '</button>'
                        + '<ul class="dropdown-menu" aria-labelledby="' + dropdown_id + '_selector">';

                    for (var i = 0; i < item_list.length; i++) {
                        html = html + '<li><a href="#" onclick="nii_vis_config.ui.helper.set_dropdown_label(' +
                            '\'' + dropdown_id + '_selector\', this.innerText' +
                            ')">'+ item_list[i] +'</a></li>';
                    }

                    html = html + '</ul></' + container + '>';

                    return html;
                },

                create_checkbox_list: function (item_list, initial_value, list_id, inline, visible) {
                    var container = inline ? 'span' : 'div';

                    var html = '<' + container + ' id="' + list_id + '-list-container"' + (visible ? '' : 'hidden') + '>'
                            + '<ul id="' + list_id + '-list" class="list-group">';

                    for (var i = 0; i < nii_vis_config.available_dimensions.length; i++) {
                        html = html + '<li id="' + list_id + '-list-item" class="list-group-item">'
                            + '<span>' + nii_vis_config.available_dimensions[i] + '</span>'
                            + '<span class="dl-header-checkbox">'
                            + '<input id="' + nii_vis_config.available_dimensions[i] + '" type="checkbox">'
                            + '</span>'
                            + '</li>';
                    }

                    html = html + '</ul></' + container + '>';

                    return html;
                },

                parse_checkbox_list: function (id) {
                    var checkbox_list = document.getElementById(id);
                    var checked_items = [];

                    for(var i = 0; i < checkbox_list.childNodes.length; i++) {
                        if (checkbox_list.childNodes[i].lastChild.lastChild.checked) {
                            checked_items.push(checkbox_list.childNodes[i].innerText);
                        }
                    }

                    return checked_items;
                }
            },
            sidepanel: {
                toggle_label: function (checkbox) {
                    checkbox.checked ? instance.rendering.features.print_node_label.enable() : instance.rendering.features.print_node_label.disable();
                },
                toggle_connected_selection: function (checkbox) {
                    checkbox.checked ? instance.rendering.features.node_selection.enable() : instance.rendering.features.node_selection.disable();
                },
                toggle_thresholding: function (checkbox) {
                    var slider = document.getElementById('side-panel-graph-thresh-slider');
                    if (slider.hidden) {
                        slider.hidden = false;
                    } else {
                        slider.hidden = true;
                    }
                },
                toggle_fisheye: function (checkbox) {
                    checkbox.checked ? instance.rendering.features.fisheye.enable() : instance.rendering.features.fisheye.disable();
                },
                toggle_node_drag: function (checkbox) {
                    checkbox.checked ? instance.rendering.features.node_drag.enable() : instance.rendering.features.node_drag.disable();
                    var reset_button = document.getElementById('side-panel-graph-node-drag-reset');
                    reset_button.hidden ? reset_button.hidden = false : reset_button.hidden = true;
                },
                toggle_single_nodes: function (checkbox) {
                    checkbox.checked ? instance.rendering.features.hide_single_nodes.enable() : instance.rendering.features.hide_single_nodes.disable();
                }
            }
        },
        ui_building: {
            setup: {
                settings_box: function (dimension_list) {

                    // Todo: find proper handling of multiple dimensions mapping to same data (eg. srcip + dstip -> ip)


                    var box_top = '<div id="box-' + instance.vis_id + '" class="hidden">'
                        + '<div class="panel panel-default">'
                        + '<div class="panel-heading">Graph Plot - Select graph layout</div>'
                        + '<div class="panel-body">'
                        + '<span class="panel-inline-content">';

                    // Features checkbox list
                    var box_content = '<h3>Features</h3>'
                        + '<ul id="graph-setup-feature-list" class="list-group">'
                        + '<li class="list-group-item">'
                        + '<span>Directed Graph</span>'
                        + '<span id="graph-setup-directed" class="dl-header-checkbox">'
                        + '<input id="' + 'checkbox-graph-setup-directed" type="checkbox" onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.setup.directed_change(this)" checked>'
                        + '</span>'
                        + '</li>'
                        + '<li class="list-group-item">'
                        + '<span>Allow NaN\'s</span>'
                        + '<span id="graph-setup-nan" class="dl-header-checkbox">'
                        + '<input id="' + 'checkbox-graph-setup-nan" type="checkbox" onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.setup.nan_change(this)">'
                        + '</span>'
                        + '</li>'
                        + '<li class="list-group-item">'
                        + '<span>Multi Column Nodes</span>'
                        + '<span id="graph-setup-multi-node" class="dl-header-checkbox">'
                        + '<input id="graph-setup-multi-node-checkbox" type="checkbox" onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.setup.multi_change(this)">'
                        + '</span>'
                        + '</li>'
                        + '<li class="list-group-item">'
                        + '<span>Multi Column Edges</span>'
                        + '<span id="graph-setup-multi-edge" class="dl-header-checkbox">'
                        + '<input id="graph-setup-multi-edge-checkbox" type="checkbox" onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.setup.multi_change(this)">'
                        + '</span>'
                        + '</li>'
                        + '</ul>';

                    // Node settings
                    box_content = box_content + '<div id="' + instance.vis_id + '-node-container"><h3>Nodes</h3>' +
                        '<h5>Select which data dimension should map to nodes.</h5>';
                    box_content = box_content + '<div>' +
                        '<div id="' + instance.vis_id + '-node-single-container">' +
                        '<span id="' + instance.vis_id + '-node-single-source-container">' +
                        instance.ui.ui_helper.setup.create_dropdown(nii_vis_config.enabled_dimensions, 'Source Nodes', instance.vis_id + '-node', true) +
                        '</span>' +
                        '<span id="' + instance.vis_id + '-node-single-target-container">' +
                        instance.ui.ui_helper.setup.create_dropdown(nii_vis_config.enabled_dimensions, 'Target Nodes', instance.vis_id + '-node-target', true) +
                        '</span>' +
                        '</div>' +
                        '<div id="' + instance.vis_id + '-node-multi-container" hidden>' +
                        '<span id="' + instance.vis_id + '-node-multi-source-container"><p>Source:</p>' +
                        instance.ui.ui_helper.setup.create_checkbox_list(nii_vis_config.enabled_dimensions, 'Nodes', instance.vis_id + '-node-multi', true, true) +
                        '</span>' +
                        '<span id="' + instance.vis_id + '-node-multi-target-container"><p>Target:</p>' +
                        instance.ui.ui_helper.setup.create_checkbox_list(nii_vis_config.enabled_dimensions, 'Target' +
                            ' Nodes', instance.vis_id + '-node-multi-target', true, true) +
                        '</span>' +
                        '</div>' +
                        '</div></div>';

                    // Edge settings
                    box_content = box_content + '<div id="' + instance.vis_id + '-edge-container"><h3>Edges</h3>' +
                        '<h5>Select which data dimension should map to edges.</h5>';
                    box_content = box_content + '<div>' +
                        '<div id="' + instance.vis_id + '-edge-single-container">' +
                        instance.ui.ui_helper.setup.create_dropdown(nii_vis_config.enabled_dimensions, 'Edges', instance.vis_id + '-edge', true) +
                        '</div>' +
                        '<div id="' + instance.vis_id + '-edge-multi-container" hidden>' +
                        instance.ui.ui_helper.setup.create_checkbox_list(nii_vis_config.enabled_dimensions, 'Nodes', instance.vis_id + '-edge-multi', true, true) +
                        '</div>' +
                        '</div>' +
                        instance.ui.ui_helper.setup.create_dropdown(nii_vis_config.enabled_dimensions, 'Edge Value', instance.vis_id + '_edge_value', true) +
                        '</div>';

                    // Todo: insert other methods like sorting etc...

                    var box_bottom = '</span>'
                        + '<span class="panel-inline-content panel-inline-button">'
                        + '<button type="button" data-id="' + instance.vis_id + '" class="btn btn-default" aria-label="Left Align" onclick="nii_vis_config.ui.setup.next_vis_settings(this);"><span>Next</span><span class="glyphicon glyphicon-arrow-right next-glyphicon" aria-hidden="true"></span></button>'
                        + '</span>'
                        + '</div>'
                        + '</div>'
                        + '</div>';

                    return box_top + box_content + box_bottom;
                },

                parse_settings_box: function (dom_box) {

                    // Todo: check that selection is valid (not same selection, etc...)
                    // Todo: return true : false and check in UIHandler - also set for other types
                    var box_content = dom_box.children[0].children[1].children[0];

                    // Parse settings
                    instance.config.allow_empty = document.getElementById("checkbox-graph-setup-nan").checked;
                    instance.config.mapping.directed = document.getElementById("checkbox-graph-setup-directed").checked;

                    // Parse nodes
                    if (document.getElementById('graph-setup-multi-node-checkbox').checked) {
                        if (instance.config.mapping.directed) {
                            instance.config.mapping.edges.source = instance.ui.ui_helper.setup.parse_checkbox_list(instance.vis_id + '-node-multi-list');
                            instance.config.mapping.edges.target = instance.ui.ui_helper.setup.parse_checkbox_list(instance.vis_id + '-node-multi-target-list');
                        } else {
                            instance.config.mapping.nodes = instance.ui.ui_helper.setup.parse_checkbox_list(instance.vis_id + '-node-multi-list');
                        }
                    } else {
                        if (instance.config.mapping.directed) {
                            instance.config.mapping.edges.source = [document.getElementById(instance.vis_id + '-node_selector').innerText];
                            instance.config.mapping.edges.target = [document.getElementById(instance.vis_id + '-node-target_selector').innerText];
                        } else {
                            instance.config.mapping.nodes = [document.getElementById(instance.vis_id + '-node_selector').innerText];
                        }
                    }

                    // Parse edges
                    if (!instance.config.mapping.directed) {
                        if (document.getElementById('graph-setup-multi-edge-checkbox').checked) {
                            instance.config.mapping.edges.source = instance.ui.ui_helper.setup.parse_checkbox_list(instance.vis_id + '-edge-multi-list');
                        } else {
                            instance.config.mapping.edges.source = [document.getElementById(instance.vis_id + '-edge_selector').innerText];
                        }
                    } else {
                        if (document.getElementById('graph-setup-multi-edge-checkbox').checked) {
                            instance.config.mapping.edges.inter = instance.ui.ui_helper.setup.parse_checkbox_list(instance.vis_id + '-edge-multi-list');
                        } else {
                            instance.config.mapping.edges.inter = [document.getElementById(instance.vis_id + '-edge_selector').innerText];
                        }
                    }
                    instance.config.mapping.edges.value = document.getElementById(instance.vis_id + '_edge_value_selector').innerText;
                }
            },
            sidepanel: {
                get_sidepanel_settings: function () {
                    var html_start = '<div><h5>' + instance.vis_name + '</h5>';
                    var html_end = '</div>';

                    var visual = '<h6>Visual</h6>' +
                        '<div>Show Labels <input type="checkbox"' +
                        ' onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.sidepanel.toggle_label(this)"' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.print_node_label.is_on ? 'checked>' : '>') + '</div>' +
                        '<div>Selection (connected)<input type="checkbox"' +
                        ' onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.sidepanel.toggle_connected_selection(this)"' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.node_selection.is_on ? 'checked>' : '>') + '</div>' +
                        '<div' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.threshold.is_on ? '>' : ' hidden>') + 'Thresholding<input type="checkbox"' +
                        ' onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.sidepanel.toggle_thresholding(this)"' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.threshold.is_on ? 'checked>' : '>') + '</div>' +
                        '<div id="side-panel-graph-thresh-slider"' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.threshold.is_on ? '>' : ' hidden>') + 'Edge Threshold<input type="range" id="thersholdSlider" name="edge_threshold" value=0' +
                        ' min="0" max="10" onchange="nii_vis_config.avail_vis_types.graph_plot.rendering.features.threshold.threshold(this.value)"></div>' +
                        '<div' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.threshold.is_on ? '>' : ' hidden>') + 'Thresholding<input type="checkbox"' +
                        ' onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.sidepanel.toggle_thresholding(this)"' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.threshold.is_on ? 'checked>' : '>') + '</div>' +
                        '<div' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.fisheye.is_on ? '>' : ' hidden>') + 'Enable Fisheye <input type="checkbox"' +
                        ' onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.sidepanel.toggle_fisheye(this)"' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.fisheye.is_on ? 'checked>' : '>') + '</div>' +
                        '<div' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.hide_single_nodes.is_on ? '>' : ' hidden>') + 'Hide Single Nodes <input type="checkbox"' +
                        ' onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.sidepanel.toggle_single_nodes(this)"' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.hide_single_nodes.is_on ? 'checked>' : '>') + '</div>' +
                        '<div' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.node_drag.is_on ? '>' : ' hidden>') + 'Enable Node Dragging <input type="checkbox"' +
                        ' onclick="nii_vis_config.avail_vis_types.graph_plot.ui.ui_helper.sidepanel.toggle_node_drag(this)"' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.node_drag.is_on ? 'checked>' : '>') + '</div>' +
                        '<div id="side-panel-graph-node-drag-reset"' + (nii_vis_config.avail_vis_types.graph_plot.rendering.features.node_drag.is_on ? '>' : ' hidden>') + '<button type="button" class="btn btn-default btn-sm" onclick="nii_vis_config.avail_vis_types.graph_plot.rendering.features.node_drag.reset()">Reset <span class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span></button></div>';

                    var features = '<h6>Features</h6>';
                    var mapping = '<h6>Mapping</h6>'; // Mapping dropdown / or multi dimension mapping

                    return html_start + visual + '<hr id="settings-sidepanel-section-splitter" noshade/>' + features + '<hr id="settings-sidepanel-section-splitter" noshade/>' + mapping + html_end;
                }
            }
        }
    }

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
            show_details: {
                is_on: true,
                initialize: function () {
                    return;
                },
                enable: function () {
                    instance.rendering.data.draw_data.nodes.on('click',  instance.rendering.features.show_details.show);
                },
                reset: function () {

                },
                show: function (node, index) {
                    sample = instance.data_provider.get_data()[instance.rendering.data.sample_map.node_to_data.convert_index(index)];
                    nii_vis_config.ui.detail_panel.show_details(sample);
                }
            },
            threshold: {
                // Todo: auto-disable on graph setup if edge value is not number
                is_on: false,
                min: undefined,
                max: undefined,
                initialize: function () {
                    return;
                },
                enable: function () {
                    return;
                },
                reset: function () {
                    return;
                },
                threshold: function (thresh) {
                    if (this.is_on) {
                        this.split_edges(thresh);

                        this.restart();
                    }
                },
                split_edges: function (thresh) {
                    instance.rendering.data.raw_data.edges.splice(0, instance.rendering.data.raw_data.edges.length);

                    for (var i = 0; i < instance.rendering.data.raw_data.edges_orig.length; i++) {
                        if (instance.rendering.data.raw_data.edges_orig[i].value > thresh) {
                            instance.rendering.data.raw_data.edges.push(instance.rendering.data.raw_data.edges_orig[i]);
                        }
                    }
                },
                //Restart the visualisation after any node and link changes
                restart: function () {

                    // Todo: fix selection bug that does not redraw nodes after thresholding and selection

                    instance.rendering.data.draw_data.links = instance.rendering.data.draw_data.links.data(instance.rendering.data.raw_data.edges);
                    instance.rendering.data.draw_data.links.exit().remove();
                    instance.rendering.data.draw_data.links.enter().insert("line", ".node").attr("class", "link");

                    instance.rendering.data.draw_data.groups = instance.rendering.data.draw_data.groups.data(instance.rendering.data.raw_data.nodes);
                    instance.rendering.data.draw_data.groups.enter().insert('g').attr('class', 'node');

                    instance.rendering.data.draw_data.nodes = instance.rendering.data.draw_data.nodes.data(instance.rendering.data.raw_data.nodes);
                    instance.rendering.data.draw_data.nodes.enter().insert("circle", ".cursor").attr("class", "node").attr("r", 8).call(instance.rendering.data.draw_data.force_field.drag);

                    // Reset all enabled features - Todo: maybe create special reset function -> could save some runtime
                    for(var feature in instance.rendering.features) {
                        if (instance.rendering.features[feature].is_on) {
                            instance.rendering.features[feature].reset();
                        }
                    }

                    instance.rendering.data.draw_data.force_field.start();
                }
            },
            print_node_label: {
                is_on: true,
                labels: undefined,
                initialize: function () {
                    return;
                },
                enable: function () {
                    if (this.labels) {
                        this.labels.style('opacity', 1);
                    } else {
                        this.labels = instance.rendering.data.draw_data.groups.append("text")
                            .attr("dx", 10)
                            .attr("dy", ".35em")
                            .text(function (d) {
                                //return d.value;
                                return instance.rendering.data.raw_data.nodes[d.index].attribute;
                            })
                            .style("stroke", "gray");
                    }
                },
                disable: function () {
                    this.labels.style('opacity', 0);
                },
                reset: function () {
                    return;
                }
            },
            node_selection: {
                is_on: true,
                toggle: true,
                initialize: function () {
                    this.linked_nodes.initialize();
                },
                linked_nodes: {
                    nodes: {},
                    initialize: function () {
                        for (i = 0; i < instance.rendering.data.raw_data.nodes.length; i++) {
                            this.nodes[i + "," + i] = 1;
                        };

                        instance.rendering.data.raw_data.edges.forEach(function (d) {
                            instance.rendering.features['node_selection'].linked_nodes.nodes[d.source + "," + d.target] = 1;
                        });
                    }
                },
                enable: function () {
                    instance.rendering.data.draw_data.nodes.on('dblclick', instance.rendering.features.node_selection.connected_nodes);
                    instance.rendering.features.node_selection.is_on = true;
                    if (Object.keys(instance.rendering.features.node_selection.linked_nodes.nodes).length < 1) {
                        instance.rendering.features.node_selection.reset();
                    }
                },
                disable: function () {
                    instance.rendering.data.draw_data.nodes.on('dblclick', null);
                    instance.rendering.features.node_selection.is_on = false;
                },
                reset: function () {
                    this.linked_nodes.nodes = {};
                    this.linked_nodes.initialize();
                },
                neighboring: function (a, b) {
                    //return instance.features['node_selection'].linked_nodes[a.index + "," + b.index];
                    return this.linked_nodes.nodes[a.index + "," + b.index];
                },
                connected_nodes: function() {
                    if (instance.rendering.features['node_selection'].is_on) {
                        if (instance.rendering.features['node_selection'].toggle) {
                            //Reduce the opacity of all but the neighbouring nodes
                            d = d3.select(this).node().__data__;
                            instance.rendering.data.draw_data.groups.style("opacity", function (o) {
                                if (instance.rendering.features['node_selection'].neighboring(d, o) | instance.rendering.features['node_selection'].neighboring(o, d)) {
                                    // Todo: some weird group to o & d mapping happening here if nodes get hidden
                                    instance.rendering.brushing.selected.push(instance.rendering.data.sample_map.node_to_data[o.index]);
                                    return 1;
                                } else {
                                    return 0.1;
                                }
                                //return instance.rendering.features['node_selection'].neighboring(d, o) |
                                // instance.rendering.features['node_selection'].neighboring(o, d) ? 1 : 0.1;
                            });
                            instance.rendering.data.draw_data.links.style("opacity", function (o) {
                                return d.index == o.source.index | d.index == o.target.index ? 1 : 0.15;
                            });
                            nii_vis_config.renderer.brushing.brush(instance.rendering.brushing.selected, instance);
                            //Reduce the op
                            instance.rendering.features['node_selection'].toggle = false;
                        } else {
                            //Put them back target opacity=1
                            instance.rendering.data.draw_data.groups.style("opacity", 1);
                            instance.rendering.data.draw_data.links.style("opacity", 1);
                            instance.rendering.brushing.selected = [];
                            nii_vis_config.renderer.brushing.reset(instance);
                            instance.rendering.features['node_selection'].toggle = true;
                        }
                    }
                }
            },
            fisheye: {
                is_on: false,
                fisheye: undefined,
                initialize: function () {
                    this.fisheye = d3.fisheye.circular()
                        .radius(120);
                },
                enable: function () {
                    instance.rendering.data.draw_data.graphic.on("mousemove", function () {
                        instance.rendering.data.draw_data.force_field.stop();
                        instance.rendering.features.fisheye.fisheye.focus(d3.mouse(this));
                        d3.selectAll("circle").each(function (d) {
                                d.fisheye = instance.rendering.features.fisheye.fisheye(d);
                            })
                            .attr("cx", function (d) {
                                return d.fisheye.x;
                            })
                            .attr("cy", function (d) {
                                return d.fisheye.y;
                            })
                            .attr("r", function (d) {
                                return d.fisheye.z * 8;
                            });
                        instance.rendering.data.draw_data.links.attr("x1", function (d) {
                                return d.source.fisheye.x;
                            })
                            .attr("y1", function (d) {
                                return d.source.fisheye.y;
                            })
                            .attr("x2", function (d) {
                                return d.target.fisheye.x;
                            })
                            .attr("y2", function (d) {
                                return d.target.fisheye.y;
                            });

                        d3.selectAll("text").each(function (d) {
                                d.fisheye = instance.rendering.features.fisheye.fisheye(d);
                            })
                            .attr("x", function (d) {
                                return d.fisheye.x;
                            })
                            .attr("y", function (d) {
                                return d.fisheye.y;
                            });
                    });

                    instance.rendering.data.draw_data.graphic.on("mouseleave", function () { // or use: mouseout(als adds children)
                        instance.rendering.data.draw_data.force_field.resume();
                    });
                },
                disable: function () {
                    instance.rendering.data.draw_data.graphic.on("mousemove", null);
                    instance.rendering.data.draw_data.graphic.on("mouseleave", null);
                },
                reset: function () {

                }
            },
            node_drag: {
                is_on: false,
                node_drag: undefined,
                fixed_nodes: [],
                initialize: function () {
                    this.node_drag = d3.behavior.drag();
                },
                enable: function () {
                    this.node_drag.on("dragstart", this.dragstart)
                        .on("drag", this.dragmove)
                        .on("dragend", this.dragend);
                    instance.rendering.data.draw_data.groups.call(this.node_drag);
                },
                disable: function () {
                    this.node_drag.on("dragstart", null)
                        .on("drag", null)
                        .on("dragend", null);
                    instance.rendering.data.draw_data.groups.call(this.node_drag);
                },
                reset: function () {
                    for (var i = 0; i < this.fixed_nodes.length; i++) {
                        this.fixed_nodes[i].fixed = false;
                    }
                },
                dragstart: function (d, i) {
                    instance.rendering.data.draw_data.force_field.stop() // stops the force auto positioning before you start dragging
                },
                dragmove: function (d, i) {
                    d.px += d3.event.dx;
                    d.py += d3.event.dy;
                    d.x += d3.event.dx;
                    d.y += d3.event.dy;
                },
                dragend: function (d, i) {
                    d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
                    instance.rendering.features.node_drag.fixed_nodes.push(d);
                    instance.rendering.data.draw_data.force_field.resume();
                }
            },
            hide_single_nodes: {
                is_on: false,
                single_nodes: undefined,
                single_node_indices: undefined,
                connected_nodes_dat: undefined,
                initialize: function () {
                    // Todo: handle directed graph empty nodes
                    if (!instance.rendering.data.draw_data.nodes) {
                        return;
                    }
                    instance.rendering.data.draw_data.nodes.each(function(d, i) {
                        if (instance.rendering.data.raw_data.nodes[i].single) {
                            instance.rendering.features.hide_single_nodes.single_nodes.push(this);
                            instance.rendering.features.hide_single_nodes.single_node_indices.push(i);
                        } else {
                            instance.rendering.features.hide_single_nodes.connected_nodes_dat.push(d);
                        }
                    });
                    return;
                },
                enable: function () {
                    // Todo: do proper data handling: remove single nodes from dataset and add them
                    if (instance.rendering.data.draw_data.nodes) {
                        if (!this.single_nodes) {
                            this.reset();
                        }
                    }

                    d3.selectAll(this.single_nodes).style('opacity', 0);

                    instance.rendering.features.print_node_label.labels.style('opacity', function(d, i) {
                        return instance.rendering.features.hide_single_nodes.single_node_indices.indexOf(i) > -1 ? 0 : 1;
                    });

                    instance.rendering.data.draw_data.force_field.nodes(this.connected_nodes_dat).start();
                    return;
                },
                disable: function () {
                    instance.rendering.data.draw_data.force_field.nodes(instance.rendering.data.raw_data.nodes).start();

                    instance.rendering.features.print_node_label.labels.style('opacity', 1);

                    d3.selectAll(this.single_nodes).style('opacity', 1);
                    return;
                },
                reset: function () {
                    this.single_nodes = [];
                    this.single_node_indices = [];
                    this.connected_nodes_dat = [];
                    this.initialize();
                }
            }
        },
        data: {
            draw_data: {
                graphic: undefined,
                force_field: undefined,
                nodes: undefined,
                links: undefined,
                groups: undefined
            },
            raw_data: {
                nodes: [],
                node_key_list: [],
                edges: [],
                edges_orig: [],// Copy of edges to allow for manipulation of edges
                edge_key_set: [],
                edge_in_set: function(from, to) {
                    for (var i = 0; i < this.edges; i++) {
                        edge = this.edges[i];

                        if (edge.source === from && edge.target == to) {
                            return true;
                        }

                        if (!instance.config.mapping.directed) {
                            if (edge.target === from && edge.source == to) {
                                return true;
                            }
                        }

                        return false;
                    }
                }
            },
            sample_map: {
                node_to_data: {
                    convert_index: function (index) {
                        return this[index];
                    }
                },
                data_to_node: {
                    convert_index: function (index) {
                        return this[index];
                    }
                }
            },
            gen_draw_data: function () {

                var data = instance.data_provider.get_data();

                if (!instance.config.mapping.directed || true) {
                    var edge_mapping = {};

                    if (!instance.config.mapping.directed) {
                        var node_val_map = column_scan(instance.config.mapping.nodes, 'val_to_pos');
                        var edge_map = column_scan(instance.config.mapping.edges.source, 'val_to_pos');

                        var node_pos_map = create_nodes_new(node_val_map)[0];
                        create_edges_new(node_pos_map, edge_map);
                    } else {
                        // get both maps for from and to
                        // merge -> create nodes
                        // create edges
                        var from_val_map = column_scan(instance.config.mapping.edges.source, 'val_to_pos');
                        var to_val_map = column_scan(instance.config.mapping.edges.target, 'val_to_pos');
                        var inter_val_map = column_scan(instance.config.mapping.edges.inter, 'val_to_pos');

                        var merged = JSON.parse(JSON.stringify(from_val_map));

                        for(var attribute in to_val_map) {
                            if (merged[attribute] != undefined) {
                                var samples = to_val_map[attribute];
                                for (var i = 0; i < samples.length; i++) {
                                    merged[attribute].push(samples[i]);
                                }
                            } else {
                                merged[attribute] = to_val_map[attribute];
                            }
                        }

                        var node_pos_map = create_nodes_new(merged);

                        row_edge_creation(instance.config.mapping.edges.source, instance.config.mapping.edges.target, node_pos_map[1]);

                        create_edges_new(node_pos_map[0], from_val_map);
                        create_edges_new(node_pos_map[0], to_val_map);
                        create_edges_new(node_pos_map[0], inter_val_map);
                    }
                }

                function row_edge_creation(columns_s, columns_t, node_map) {
                    var structure = {};
                    for (var s = 0; s < data.length; s++) {
                        var sample = data[s];
                        for(var i = 0; i < columns_s.length; i++) {
                            var f_val = get_data_value(sample, columns_s[i]);
                            if (!instance.config.allow_empty && f_val === '') {
                                continue;
                            }
                            for (var j = 0; j < columns_t.length; j++) {
                                var t_val = get_data_value(sample, columns_t[j]);
                                var is_single = false;
                                if (!instance.config.allow_empty && t_val === '') {
                                    continue;
                                }
                                if (!(f_val === '' | t_val === '') & !(f_val === t_val)) {
                                    instance.rendering.data.raw_data.nodes[node_map[f_val]].single = is_single;
                                    instance.rendering.data.raw_data.nodes[node_map[t_val]].single = is_single;
                                }
                                instance.rendering.data.raw_data.edges.push(new instance.rendering.model.Edge(node_map[f_val], node_map[t_val], null, 'inner'));
                            }
                        }
                    }

                    return structure;
                }

                function create_nodes_new(value_map) {

                    var node_map = {};
                    var node_val_map = {};

                    for (var value in value_map) {

                        var node_attribute = value; // Todo: adapt this for seperate value

                        var node_index = instance.rendering.data.raw_data.nodes.push(new instance.rendering.model.Node(value, node_attribute)) - 1;
                        for (var i = 0; i < value_map[value].length; i++) {
                            var s_index = value_map[value][i][1];
                            // Todo: include node <-> sample mapping in this loop to allow multi occurance mapping

                            node_map[s_index] === undefined ? node_map[s_index] = [node_index] : node_map[s_index].push(node_index);
                        }
                        var sample_index = value_map[value][0][1];
                        instance.rendering.data.sample_map.node_to_data[node_index] = sample_index;
                        instance.rendering.data.sample_map.data_to_node[sample_index] = node_index;

                        node_val_map[value] = node_index;
                    }

                    return [node_map, node_val_map];
                }

                function create_edges_new(node_pos_map, edge_map) {
                    for (var value in edge_map) {

                        var map_entry = edge_map[value];

                        if (map_entry.length < 2) {
                            continue;
                        }

                        for (var i = 0; i < map_entry.length; i++) {
                            var src_node = node_pos_map[map_entry[i][1]][0];
                            var f_val = instance.rendering.data.raw_data.nodes[src_node].value;
                            for (var j = i+1; j < map_entry.length; j++) {
                                var is_single = false;
                                // add edge
                                var tar_node = node_pos_map[map_entry[j][1]][0];
                                var t_val = instance.rendering.data.raw_data.nodes[tar_node].value;

                                if (!(f_val === '' | t_val === '') & !(f_val === t_val)) {
                                    instance.rendering.data.raw_data.nodes[src_node].single = is_single;
                                    instance.rendering.data.raw_data.nodes[tar_node].single = is_single;
                                }
                                instance.rendering.data.raw_data.edges.push(new instance.rendering.model.Edge(src_node, tar_node, value, 'inter'));
                            }
                        }
                    }
                };

                function column_scan(columns, mode) {

                    var structure = {};

                    for (var c = 0; c < columns.length; c++) {
                        for (var r = 0; r < data.length; r++) {
                            var value = get_data_value(data[r], columns[c]);

                            if (!instance.config.allow_empty && value === '') {
                                continue;
                            }

                            if (mode === 'val_to_pos') {
                                structure[value] === undefined ? structure[value] = [[c, r]] : structure[value].push([c, r]);
                            }

                            if (mode == 'x_to_valpos') {
                                structure[r] === undefined ? structure[r] = [[c, value]] : structure[r].push([c, value]);
                            }

                            if (mode == 'y_to_valpos') {
                                structure[c] === undefined ? structure[c] = [[r, value]] : structure[c].push([r, value]);
                            }
                        }
                    }
                    return structure;
                }

                function get_data_value(sample, field) {
                    return sample.rowdata[field] == undefined ? sample.anomalyid : sample.rowdata[field];
                }

                // Initialized all enabled features
                for(var feature in instance.rendering.features) {
                    if (instance.rendering.features[feature].is_on) {
                        instance.rendering.features[feature].initialize();
                    }
                }

                instance.rendering.data.raw_data.edges_orig = instance.rendering.data.raw_data.edges.slice();
                instance.data_prepared = true;
            }
        },
        model: {
            Node: function (value, attribute) {
                this.value = value;
                this.attribute = attribute;
                this.single = true;
            },

            Edge: function (start, end, value, type) {
                this.source = start;
                this.target = end;
                this.value = value;
                this.type = type;
            }
        },
        init: function () {
            //Set up the force layout
            instance.rendering.data.draw_data.force_field = d3.layout.force()
                .charge(-120)
                .linkDistance(30)
                .size([instance.width, instance.height]);
        },
        draw: function () {
            if (!instance.data_prepared) {
                instance.rendering.data.gen_draw_data();
            }

            instance.rendering.data.draw_data.graphic = instance.root.append("svg")
                .attr("width", instance.width)
                .attr("height", instance.height);


            //Creates the graph data structure out of the json data
            instance.rendering.data.draw_data.force_field.nodes(instance.rendering.data.raw_data.nodes)
                .links(instance.rendering.data.raw_data.edges)
                .start();

            //Create all the line svgs but without locations yet
            instance.rendering.data.draw_data.links = instance.rendering.data.draw_data.graphic.selectAll(".link")
                .data(instance.rendering.data.raw_data.edges)
                .enter().append("line")
                .attr("class", function (d) {
                    return d.type === 'inner' ? 'inner-sample-link' : "link";
                })
                .style("stroke-width", function (d) {
                    // Todo: change this method for stroke width mapping
                    return 1;
                    //return Math.sqrt(d.value);
                })
                .style("marker-end", "url(#suit)");


            instance.rendering.data.draw_data.groups = instance.rendering.data.draw_data.graphic.selectAll(".node")
                .data(instance.rendering.data.raw_data.nodes)
                .enter().append("g")
                .attr("class", "node");
            instance.rendering.data.draw_data.nodes = instance.rendering.data.draw_data.groups.append("circle")
                //.attr("class", "node")
                .attr("r", 8)
                .style("fill", function (d) {
                    return '#444444';
                })
                .call(instance.rendering.data.draw_data.force_field.drag);

            //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using target update the attributes of the SVG elements
            instance.rendering.data.draw_data.force_field.on("tick", function () {
                instance.rendering.data.draw_data.links.attr("x1", function (d) {
                        return d.source.x;
                    })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });

                instance.rendering.data.draw_data.nodes.attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    });

                instance.rendering.data.draw_data.groups.selectAll("text").attr("x", function (d) {
                        return d.x;
                    })
                    .attr("y", function (d) {
                        return d.y;
                    });
                instance.rendering.data.draw_data.nodes.each(collide(0.5)); // COLLISION DETECTION remove target remove detection
            });

            // COLLISION DETECTION functions start

            var padding = 1, // separation between circles
                radius = 8;

            function collide(alpha) {
                var quadtree = d3.geom.quadtree(instance.rendering.data.raw_data.nodes);
                return function (d) {
                    var rb = 2 * radius + padding,
                        nx1 = d.x - rb,
                        nx2 = d.x + rb,
                        ny1 = d.y - rb,
                        ny2 = d.y + rb;
                    quadtree.visit(function (quad, x1, y1, x2, y2) {
                        if (quad.point && (quad.point !== d)) {
                            var x = d.x - quad.point.x,
                                y = d.y - quad.point.y,
                                l = Math.sqrt(x * x + y * y);
                            if (l < rb) {
                                l = (l - rb) / l * alpha;
                                d.x -= x *= l;
                                d.y -= y *= l;
                                quad.point.x += x;
                                quad.point.y += y;
                            }
                        }
                        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                    });
                };
            }

            // Initialized all enabled features
            for(var feature in instance.rendering.features) {
                if (instance.rendering.features[feature].is_on) {
                    instance.rendering.features[feature].enable();
                }
            }
        },
        brushing: {
            selected: [],
            brush: function (selected) {
                instance.rendering.data.draw_data.groups.style("opacity", function (o) {
                    return selected.indexOf(instance.rendering.data.sample_map.node_to_data[o.index]) > -1 ? 1 : 0.1;
                });
                instance.rendering.data.draw_data.links.style("opacity", function (o) {
                    if ((selected.indexOf(instance.rendering.data.sample_map.node_to_data[o.source.index]) > -1)
                        & (selected.indexOf(instance.rendering.data.sample_map.node_to_data[o.target.index]) > -1)) {
                        return 1;
                    } else {
                        return 0.15;
                    }
                    //return d.index == o.source.index | d.index == o.target.index ? 1 : 0.15;
                });
            },
            reset: function (selected) {
                instance.rendering.brushing.selected = [];
                instance.rendering.data.draw_data.groups.style("opacity", function (o) {
                    return 1;
                });
                instance.rendering.data.draw_data.links.style("opacity", function (o) {
                    return 1;
                });
            }
        }
    }

    this.rendering.init();
};