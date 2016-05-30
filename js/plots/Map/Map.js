/**
 * Created by triton on 10/02/16.
 */
function Map(rootNode, filePath, data_provider) {

    var instance = this;

    this.vis_name = "Map";
    this.vis_id = "map";

    this.data_provider = data_provider;

    this.root = rootNode;

    this.path = filePath;

    this.width = 700;

    this.height = 500;

    this.data_prepared = false;

    this.config = {
        is_on: false,
        allow_empty: false,
        map_data: {
            world: "js/plots/Map/maps/world-110m2.json"
        },
        mapping: {
            // Todo: add mapping config at setup time
        }
    }

    this.ui = {
        ui_helper: {
            setup: {
                // Todo: add setup helper functions
            },
            sidepanel: {
                // Todo: add sidepanel helper functions
            }
        },
        ui_building: {
            setup: {
                settings_box: function (dimension_list) {
                    var box_top = '<div id="box-' + instance.vis_id + '" class="hidden">'
                        + '<div class="panel panel-default">'
                        + '<div class="panel-heading">Graph Plot - Select graph layout</div>'
                        + '<div class="panel-body">'
                        + '<span class="panel-inline-content">';

                    // Todo: add HTML creation for setup settings box
                    var box_content = '';

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

                    var box_content = dom_box.children[0].children[1].children[0];

                    // Todo: parse the HTML created by settings_box
                }
            },
            sidepanel: {
                get_sidepanel_settings: function () {
                    var html_start = '<div><h5>' + instance.vis_name + '</h5>';
                    var html_end = '</div>';

                    // Todo: fill visual, features and mapping with UI HTML creation
                    // Todo: connect the form elements to ui_helper functions

                    var visual = '<h6>Visual</h6>';
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
                // Todo: create features of visualization
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
                // Todo: add SVG data created by D3
            },
            raw_data: {
                // Todo: add necessary sample -> pre-draw-data here
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

                // Todo: add data creation(model/raw_data) and keep sample<->raw_data mapping

                // Initialized all enabled features
                for(var feature in instance.rendering.features) {
                    if (instance.rendering.features[feature].is_on) {
                        instance.rendering.features[feature].initialize();
                    }
                }

                instance.data_prepared = true;
            }
        },
        model: {
            Sample: function (value, attribute) {
                // Todo: create necessary model objects for data handling
                this.value = value;
                this.attribute = attribute;
            }
        },
        init: function () {
            // Todo: add initialization before draw && dataloading
        },
        draw: function () {
            // Todo: add code to draw on assigned canvas

            if (!instance.data_prepared) {
                instance.rendering.data.gen_draw_data();
            }
        },
        brushing: {
            selected: [],
            brush: function (selected) {
                // Todo: add inter visualization brushing code here
            },
            reset: function (selected) {
                // Todo: reset the brush changes to show original visualization
            }
        }
    }

    this.rendering.init();
};