/**
 * Created by triton on 25/01/16.
 */

init_external();

/**
 * Initial resource loading done here before any UI or draw calls are made. Network connectivity is checked and
 * either remote library versions or local versions are loaded.
 */
function init_external () {
    var body = document.getElementsByTagName('body')[0];
    var head = document.getElementsByTagName('head')[0];


    var jquery_script = document.createElement('script');
    var bootstrap_css = document.createElement('link');
    bootstrap_css.rel = 'stylesheet';
    var bootstrap_script = document.createElement('script');

    // Graph Fisheye
    var fisheye_script = document.createElement('script');

    // Check for network connectivity and set correct paths
    if (navigator.onLine) {
        jquery_script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js';
        bootstrap_css.href = 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css';
        bootstrap_script.src = 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js';

        // Fisheye functionality for graph
        fisheye_script.src = 'http://bost.ocks.org/mike/fisheye/fisheye.js?0.0.3';
        head.appendChild(fisheye_script);
    } else {
        jquery_script.src = 'lib/jquery/jquery-1.12.0.min.js';
        bootstrap_css.href = 'lib/bootstrap/css/bootstrap.min.css';
        bootstrap_script.src = 'lib/bootstrap/js/bootstrap.min.js';

        // Fisheye functionality for graph
        load_external_features();
    }

    body.appendChild(jquery_script);
    head.appendChild(bootstrap_css);
    body.appendChild(bootstrap_script);
}

function load_external_features() {
    (function() {
        d3.fisheye = {
            scale: function(scaleType) {
                return d3_fisheye_scale(scaleType(), 3, 0);
            },
            circular: function() {
                var radius = 200,
                    distortion = 2,
                    k0,
                    k1,
                    focus = [0, 0];

                function fisheye(d) {
                    var dx = d.x - focus[0],
                        dy = d.y - focus[1],
                        dd = Math.sqrt(dx * dx + dy * dy);
                    if (!dd || dd >= radius) return {x: d.x, y: d.y, z: 1};
                    var k = k0 * (1 - Math.exp(-dd * k1)) / dd * .75 + .25;
                    return {x: focus[0] + dx * k, y: focus[1] + dy * k, z: Math.min(k, 10)};
                }

                function rescale() {
                    k0 = Math.exp(distortion);
                    k0 = k0 / (k0 - 1) * radius;
                    k1 = distortion / radius;
                    return fisheye;
                }

                fisheye.radius = function(_) {
                    if (!arguments.length) return radius;
                    radius = +_;
                    return rescale();
                };

                fisheye.distortion = function(_) {
                    if (!arguments.length) return distortion;
                    distortion = +_;
                    return rescale();
                };

                fisheye.focus = function(_) {
                    if (!arguments.length) return focus;
                    focus = _;
                    return fisheye;
                };

                return rescale();
            }
        };

        function d3_fisheye_scale(scale, d, a) {

            function fisheye(_) {
                var x = scale(_),
                    left = x < a,
                    v,
                    range = d3.extent(scale.range()),
                    min = range[0],
                    max = range[1],
                    m = left ? a - min : max - a;
                if (m == 0) m = max - min;
                return (left ? -1 : 1) * m * (d + 1) / (d + (m / Math.abs(x - a))) + a;
            }

            fisheye.distortion = function(_) {
                if (!arguments.length) return d;
                d = +_;
                return fisheye;
            };

            fisheye.focus = function(_) {
                if (!arguments.length) return a;
                a = +_;
                return fisheye;
            };

            fisheye.copy = function() {
                return d3_fisheye_scale(scale.copy(), d, a);
            };

            fisheye.nice = scale.nice;
            fisheye.ticks = scale.ticks;
            fisheye.tickFormat = scale.tickFormat;
            return d3.rebind(fisheye, scale, "domain", "range");
        }
    })();
}