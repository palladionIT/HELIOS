// Todo: move file, table, headers etc to DataProvider (more sense)
var selectedFile = "";
var selectedTable = "";
var fileHeaders = "";
var dataProvider = new DataProvider().init();

var ui_setup_complete = false;

var nii_vis_config = {
    avail_vis_types: {
        parallell_plot: new ParallelPlot(d3.select('#left-container-hook'), null, dataProvider),
        graph_plot: new NetworkGraph(d3.select('#right-container-hook'), null, dataProvider),
        map: new Map(d3.select('#right-container-hook'), null, dataProvider)
    },
    enabled_vis_types: [],
    available_dimensions: [],
    enabled_dimensions: [],
    renderer: null,
    ui: new UI()
};

function UI() {
    var instance = this;

    this.container = {
        setup_container: undefined,
        draw_container: undefined,
        side_panel: undefined,
        details_panel: undefined
    }

    function init() {
        instance.container.details_panel = document.getElementById('detail-panel');
        instance.container.side_panel = document.getElementById('settings-side-panel');
        instance.container.draw_container = document.getElementById('graph_container');
    }

    this.helper = {
        fireAJAX: function (data, callback) {
            $.ajax({
                url: "/php/data_loader.php",
                method: "POST",
                data: data,
                dataType: "json",
                success: callback,
                error: function (request, errorString, exceptionString) {
                    console.log("ERROR: " + errorString + " - " + exceptionString);
                }
            });
        },
        pageSwipeIn: function (prev, next) {

            setTimeout(function () {
                prev.addClass('hidden');
                next.addClass('animated slideInRight').removeClass('hidden');
            }, 775);
        },
        set_dropdown_label: function (id, text) {
            document.getElementById(id).childNodes[0].textContent = text;
        }
    }

    this.setup = {
        loadFileDropdown: function () {
            instance.helper.fireAJAX({optype: "filelistrecursive"}, function (data) {
                $.each(data, function (i, filename) {
                    $('#file-dropdown').append('<li><a href="#" onclick="nii_vis_config.ui.setup.updateFileLabel(\''
                        + filename
                        + '\');">'
                        + filename
                        + '</a></li>');
                });
            });
        },

        get_table_headers: function(table_names) {

            if (typeof table_names === "string") {
                table_names = [table_names];
            }

            dataProvider.get_table_headers(table_names, function (data) {

                // Todo: handle case for multiple file selections
                fileHeaders = JSON.parse(data)[0];

                $.each(fileHeaders, function (i, header) {
                    nii_vis_config.available_dimensions.push(header);
                    $('#dl-file-header-list').append('<li class="list-group-item">'
                        + '<span>' + header + '</span>'
                        + '<span class="dl-header-checkbox">'
                        + '<input id="' + 'checkbox-' + header + '" type="checkbox" checked>'
                        + '</span>'
                        + '</li>');
                });
            })
        },

        updateFileLabel: function (file) {
            selectedFile = file;
            $('#file-loader-label').removeClass('hidden').text(file);
        },

        fileSelected: function () {

            $('#dl-filepicker').addClass('animated slideOutLeft');
            instance.helper.pageSwipeIn($('#dl-filepicker'), $('#dl-columnpicker'));

            dataProvider.prepare_data(selectedFile);

            var filename = selectedFile.split("/");

            selectedTable = filename[filename.length - 1].replace(".", "");

            instance.setup.get_table_headers(selectedTable);
        },

        headerSelected: function () {
            var checkboxes = $('#dl-file-header-list')[0].getElementsByTagName('input');

            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked) {
                    nii_vis_config.enabled_dimensions.push(checkboxes[i].id.replace('checkbox-', ''));
                }
            }

            for (var vis in nii_vis_config.avail_vis_types) {
                $('#vis-type-list').append('<li class="list-group-item">'
                    + '<span>' + nii_vis_config.avail_vis_types[vis].vis_name + '</span>'
                    + '<span class="dl-header-checkbox">'
                    + '<input id="' + nii_vis_config.avail_vis_types[vis].vis_id + '" type="checkbox">'
                    + '</span>'
                    + '</li>');
            }

            $('#dl-columnpicker').addClass('animated slideOutLeft');
            instance.helper.pageSwipeIn($('#dl-columnpicker'), $('#dl-vispicker'));

            dataProvider.read_from_source(new DataConfig(1, selectedTable, nii_vis_config.enabled_dimensions.join(';')))
        },

        graphsSelected: function() {

            var checkboxes = $('#vis-type-list')[0].getElementsByTagName('input');

            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].checked) {

                    var tmp_vis = nii_vis_config.avail_vis_types[checkboxes[i].id];

                    nii_vis_config.enabled_vis_types.push(tmp_vis);
                    tmp_vis.config.is_on = true;

                    $('#dl-vis-loop-container').append(tmp_vis.ui.ui_building.setup.settings_box(nii_vis_config.enabled_dimensions)); // Todo: call with dimension list
                }
            }

            instance.helper.pageSwipeIn($('#dl-vispicker'), $('#dl-vis-loop-container :first'));

        },

        next_vis_settings: function (caller) {

            var id = caller.getAttribute('data-id');

            var tmp_vis = nii_vis_config.avail_vis_types[id];

            tmp_vis.ui.ui_building.setup.parse_settings_box($('#box-' + tmp_vis.vis_id)[0]);

            if ($('#box-' + id).next().length > 0) {
                instance.helper.pageSwipeIn($('#box-' + id), $('#box-' + id).next());
            } else {

                $('#box-' + id).removeClass().addClass('animated fadeOutUp');
                setTimeout(function () {
                    $('#box-' + id).addClass('hidden');
                }, 500);

                if (!data_loading_complete) {
                    setTimeout(function () {
                        $('#dl-progress').removeClass('hidden');
                    }, 500);
                    return;
                }
                $('#graph_container').removeClass().addClass('animated fadeInUp');
                $('#detail-panel').removeClass().addClass('animated fadeInUp');

                // Add elements to sidepanel settings
                for (var i = 0; i < nii_vis_config.enabled_vis_types.length; i++) {
                    var html_string = nii_vis_config.enabled_vis_types[i].ui.ui_building.sidepanel.get_sidepanel_settings();
                    instance.container.side_panel.innerHTML = instance.container.side_panel.innerHTML + html_string;
                }

                ui_setup_complete = true;
                renderer.draw(nii_vis_config);
            }
        }
    }

    this.side_panel = {
        toggle_settings: function () {
            var s_panel = $('#settings-side-panel');
            var settings_button = $('#settings-button');
            if (instance.container.side_panel.hidden) {
                instance.container.side_panel.hidden = false;
                s_panel.removeClass().addClass('animated fadeInRight');
                settings_button.addClass('settings-button-hover');
            } else {
                s_panel.removeClass().addClass('animated fadeOutRight');
                setTimeout(function () {
                    s_panel.addClass('hidden');
                    instance.container.side_panel.hidden = true;
                    settings_button.removeClass('settings-button-hover');
                }, 500);
            }
        }
    }

    this.detail_panel = {
        show_details: function (sample) {
            while (instance.container.details_panel.firstChild) {
                instance.container.details_panel.removeChild(instance.container.details_panel.firstChild);
            }

            var headline = document.createElement('h3');
            headline.classList.add('detail-panel-text');
            headline.appendChild(document.createTextNode('Sample Details:'));
            instance.container.details_panel.appendChild(headline);

            var id_key = Object.keys(sample)[0];
            var data = sample[Object.keys(sample)[1]];

            $('#detail-panel')[0].appendChild(construct_info_span(id_key, sample[id_key]));

            for (var key in data) {
                $('#detail-panel')[0].appendChild(construct_info_span(key, data[key]));
            }

            function construct_info_span(label, value) {
                // Create nodes
                var container = document.createElement('span');
                container.classList.add('detail-panel-text');
                var label = document.createTextNode(label + ': ' + value);

                // Create node hirarchy
                container.appendChild(label);
                return container;
            }
        }
    }

    init();
}