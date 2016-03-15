/**
 * Created by triton on 09/12/15.
 */
function Renderer() {
    /**
     * Documentation
     */
    var instance = this;

    this.draw = function (config) {
        if (!(data_loading_complete && ui_setup_complete)) {
            return;
        } else {
            // Todo: remove progress bar
            for (var i = 0; i < nii_vis_config.enabled_vis_types.length; i++) {
                nii_vis_config.enabled_vis_types[i].rendering.draw();
            }
        }
        // Todo: check if conditions are given and then iterate over all enabled visualizations and send .draw()
        // Todo: check in uihandler if is finished
        // Todo: check in datareader if is finished
        // Todo: if yes -> set up viewport and start drawing
    }

    this.brushing = {
        is_on: false,
        selected_samples: [],
        brush: function (selected, source) {
            if (instance.brushing.is_on) {
                for (var i = 0; i < nii_vis_config.enabled_vis_types.length; i++) {
                    if (nii_vis_config.enabled_vis_types[i].vis_id === source.vis_id) {
                        continue;
                    }
                    nii_vis_config.enabled_vis_types[i].rendering.brushing.brush(selected);
                }
            }
        },
        reset: function (source) {
            if (instance.brushing.is_on) {
                for (var i = 0; i < nii_vis_config.enabled_vis_types.length; i++) {
                    if (nii_vis_config.enabled_vis_types[i].vis_id === source.vis_id) {
                        continue;
                    }
                    nii_vis_config.enabled_vis_types[i].rendering.brushing.reset();
                }
            }
        }
    }
}