
var data_loading_complete = true;

function DataReader() {

    this.readCSV = function (path, accessor, data) {

        d3.text(path, function (text) {
            dat = d3.csv.parseRows(text, (accessor != null ? accessor : defaultAccessor));
        })
    }

    function defaultAccessor(d) {

        var src = new Host(d.srcIP, d.srcPort);
        var dst = new Host(d.dstIP, d.dstPort);
        var other = {
            id: d.anomalyID,
            distance: d.distance,
            heuristic: d.heuristic,
            label: d.label,
            detectorCount: d.nbDetectors,
            taxonomy: d.taxonomy
        };

        return new Connection(src, dst, other);
    }

    this.createDataBaseFromPath = function (path) {
        data_loading_complete = false;
        // TODO: start progress bar and update ui (disable next button etc)
        $.ajax({
            url: "/php/db_sqlite.php",
            method: "POST",
            data: {optype: "loadcsv", csvp: path, options: ""},
            success: function (data) {
                console.log("Database creation complete with following parameters: \n" + data);
                data_loading_complete = true;
                // TODO: INVOKE PROGRESSBAR STOP AND ENABLE OTHER UI ELEMENTS TO CONTINUE WITH WORKING
            },
            error: function (request, errorString, exceptionString) {
                console.log("ERROR on database creation: " + errorString + " - " + exceptionString);
            }
        });
    }

    this.resetDataBase = function () {
        $.ajax({
            url: "/php/db_sqlite.php",
            method: "POST",
            data: {optype: "reset"},
            success: function (data) {
                console.log("Successfully reset database.");
                console.log(data);
            },
            error: function (request, errorString, exceptionString) {
                console.log("ERROR on database reset: " + errorString + " - " + exceptionString);
            }
        });
    }

    this.createDataBaseFromArray = function (fileArray) {
        data_loading_complete = false;
        // Todo: send array to script -> in script iterate over array and load all tables
        // TODO: start progress bar and update ui (disable next button etc)
        $.ajax({
            url: "/php/db_sqlite.php",
            method: "POST",
            data: {
                optype: "loadmulticsv",
                csvarray: JSON.stringify(fileArray),
                options: JSON.stringify({
                    delimiter: " ",
                    fields: ["ClusterID", "Filename", "Unixtime", "IP", "Country", "ASN"]
                })
            },
            success: function (data) {
                console.log("Database creation of multiple files complete with following parameters: \n" + data);
                data_loading_complete = true;
                // TODO: INVOKE PROGRESSBAR STOP AND ENABLE OTHER UI ELEMENTS TO CONTINUE WITH WORKING
            },
            error: function (request, errorString, exceptionString) {
                console.log("ERROR on database creation: " + errorString + " - " + exceptionString);
            }
        });
    }

    this.readDatabase = function (table, cols, callback) {
        data_loading_complete = false;
        $.ajax({
            url: "/php/db_sqlite.php",
            method: "POST",
            data: {
                optype: "loaddata",
                tablename: table,
                columns: cols
            },
            success: callback,
            error: function (request, errorString, exceptionString) {
                console.log("ERROR on reading from database: " + errorString + " - " + exceptionString);
                data_loading_complete = undefined;
            }
        });
    }

    this.getTableHeaders = function (table_names, callback) {
        data_loading_complete = false;
        $.ajax({
            url: "/php/db_sqlite.php",
            method: "POST",
            data: {
                optype: "gettableheaders",
                lutables: JSON.stringify(table_names)
            },
            success: callback,
            error: function (request, errorString, exceptionString) {
                console.log("ERROR on reading from database: " + errorString + " - " + exceptionString);
                data_loading_complete = undefined;
            }
        });
    }
}

function Host(hostIP, p) {
    this.ip = hostIP;
    this.port = p;
}

function Connection(source, destination, o) {
    this.src = source;
    this.dst = destination;
    this.other = o;
}