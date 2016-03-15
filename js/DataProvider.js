/**
 * Created by triton on 22/12/15.
 */
var dp_instance = null;

function DataProvider() {

    this.data_reader = null;

    this.config = {
        finished_loading: false
    }

    this.data = [];

    this.init = function () {
        this.data_reader = new DataReader();
        dp_instance = this;
        // Todo: init the rest
        return this;
    };

    this.set_data_reader = function (reader) {
        this.data_reader = reader;
    }

    // Todo: write function to prepare data sets
    this.prepare_data = function (filename) {
        this.data_reader.createDataBaseFromPath(filename);
    }

    this.read_from_source = function (data_config) {
        if (data_config.table_count < 1) {
            console.info("No table specified. Please provide a table to read from");
            return;
        }

        if (data_config.table_count < 2) {
            this.data_reader.readDatabase(data_config.tables,
                data_config.columns,
                this.set_data);
            return;
        }

        this.data_reader.readMultiTapleN(data_config.tables,
            data_config.columns,
            data_config.join_columns,
            data_config.join_mode,
            this.set_data);
        // Todo: parse data_config
        // Todo: set callback

    }

    this.set_data = function (loaded_data) {
        dp_instance.data = JSON.parse(loaded_data);
        data_loading_complete = true;
        console.log("INFO - loaded " + dp_instance.data.length + " entries.");
    }

    this.get_data = function () {
        return this.data;
    }

    this.get_table_headers = function (tables, callback) {
        this.data_reader.getTableHeaders(tables, callback);
    }
}

function DataConfig(num_tables, table_names, selection_cols, join_cols, mode) {
    join_cols = join_cols || null;
    mode = mode || null;
    return {
        table_count: num_tables,
        tables: table_names,
        columns: selection_cols,
        join_columns: join_cols,
        join_mode: mode
    }
}