<?php

// DB constants
$memory_limit = '1024M';
$lock_wait_time = 360; // in seconds

// Setting more memory for php
ini_set('memory_limit', $memory_limit);

$basedir = $_SERVER['DOCUMENT_ROOT'];
$dbdir = '/data/db/';
$dbname = 'networkdata';
$dbfileending = '.sqlite3';
$operation = $_POST['optype'];

// DEBUG flags
$debug = true;
$reset_table_on_create = true;

try {
    $sqlitePDO = new PDO('sqlite:' . $basedir . $dbdir . $dbname . $dbfileending);
    $sqlitePDO->query("SET LOCK MODE TO WAIT " . $lock_wait_time);
    $sqlitePDO->setAttribute(PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION);
    if (isset($_POST['options'])) {
        $options = (array)json_decode($_POST['options']);

        $options["table"] = "";
    } else {
        $options = array(
            "delimiter" => ",",
            "table" => "",
            "fields" => ""
        );
    }

    // Operation selection

    switch ($operation) {
        case "reset":
            $full_db_path = $basedir . $dbdir . $dbname . $dbfileending;
            if (is_writable($full_db_path)) {
                unlink($full_db_path);
            } else {
                echo "ERROR: database file is not writeable";
            }
            break;
        case "loadcsv":
            $csv_path = $_POST['csvp'];
            $opts = $_POST['options'];
            $fullcsvpath = $basedir . "/" . $csv_path;
            $options = array(
                "delimiter" => ",",
                "table" => "",
                "fields" => ""
            );

            $ret = import_csv_to_sqlite($sqlitePDO, $fullcsvpath, $options);

            echo json_encode($ret);
            break;

        case "loadmulticsv":
            $ret_sets = array();
            $csv_array = json_decode($_POST['csvarray']);

            foreach ($csv_array as $file) {
                $fullcsvpath = $basedir . "/" . $file;
                array_push($ret_sets, import_csv_to_sqlite($sqlitePDO, $fullcsvpath, $options));
            }

            echo json_encode($ret_sets);
            break;

        case "gettableheaders":
            $lu_tables = json_decode($_POST['lutables']);
            $header_sets = array();


            foreach ($lu_tables as $tablename) {
                array_push($header_sets, loadTableHeaders($sqlitePDO, strtolower(preg_replace("/[^A-Z0-9]/i", '', $tablename))));
            }

            echo json_encode($header_sets);
            break;

        case "loaddata":
            // LOAD necessary parameters
            $table_name = $_POST['tablename'];
            $table_name = strtolower(preg_replace("/[^A-Z0-9]/i", '', $table_name));

            $columns = array("*");

            if (isset($_POST['columns'])) {
                $columns = explode(";", $_POST['columns']);
                $columns = sanitize_identifier_array($columns);
            }

            echo loadDataAsJSON($sqlitePDO, $table_name, $columns);
            break;

        case "loadjoined":
            $table_names = $_POST['tables'];

            $join_cols = $_POST['joincols'];

            $join_mode = $_POST['joinmode'];

            $selection_columns = $_POST['selcols'];

            echo loadJoinedDataAsJSON($sqlitePDO, $join_mode, explode(";", $table_names), $join_cols, $selection_columns);
            break;

        case "optiontest":

            if (isset($_POST['options'])) {
                $opts = json_decode($_POST['options']);

                $options = (array)$opts;
            } else {
                $options = array(
                    "delimiter" => ",",
                    "table" => "",
                    "fields" => ""
                );
            }
            break;
    }

    $sqlitePDO = null; // Closing connection
} catch (PDOException $e) {
    echo "ERROR on line: " . $e->getLine() . ": " . $e->getMessage();
}

function import_csv_to_sqlite(&$pdo, $csv_path, $options = array())
{
    extract($options);

    if (($csv_handle = fopen($csv_path, "r")) === FALSE)
        throw new Exception('Cannot open CSV file');

    /** @var TYPE_NAME $delimiter */
    if (!$delimiter)
        $delimiter = ',';

    /** @var TYPE_NAME $table */
    if (!$table)
        $table = preg_replace("/[^A-Z0-9]/i", '', basename($csv_path));

    /** @var TYPE_NAME $fields */
    if (!$fields) {
        $fields = array_map(function ($field) {
            return sanitize_identifier(strtolower(preg_replace("/[^A-Z0-9]/i", '', $field)));
        }, fgetcsv($csv_handle, 0, $delimiter));
    }

    $create_fields_str = join(', ', array_map(function ($field) {

        return sanitize_identifier($field)." TEXT NULL";

    }, $fields));

    $pdo->beginTransaction();

    $reset_table_sql = "DROP TABLE IF EXISTS $table;";

    $create_table_sql = "CREATE TABLE IF NOT EXISTS $table ($create_fields_str);";

    if ($reset_table_sql) {
        $pdo->exec($reset_table_sql);
    }

    $pdo->exec($create_table_sql);
    $insert_fields_str = join(', ', $fields);
    $insert_values_str = join(', ', array_fill(0, count($fields), '?'));
    $insert_sql = "INSERT INTO $table ($insert_fields_str) VALUES ($insert_values_str)";

    $insert_sth = $pdo->prepare($insert_sql);

    $inserted_rows = 0;
    while (($data = fgetcsv($csv_handle, 0, $delimiter)) !== FALSE) {
        $insert_sth->execute($data);
        $inserted_rows++;
    }

    $pdo->commit();

    fclose($csv_handle);

    return array(
        'table' => $table,
        'fields' => $fields,
        'insert' => $insert_sth,
        'inserted_rows' => $inserted_rows
    );
}

function loadTableHeaders(&$pdo, $tab_name) {
    // Todo: create pragma statement -> fire statement -> parse result -> create array -> return
    $result = array();

    $resultSet = $pdo->query("pragma table_info(".$tab_name.")");

    $columnIndex = -1;
    $columnCnt = $resultSet->columnCount();

    for($i = 0; $i < $columnCnt; $i++) {
        if($resultSet->getColumnMeta($i)['name'] == "name") {
            $columnIndex = $i;
            break;
        }
    }

    while($row = $resultSet->fetch()) {
        array_push($result, $row[$columnIndex]);
    }

    return $result;
}

function loadJoinedDataAsJSON(&$pdo, $joinMode, $tables, $mergecols, $columns)
{

    $rows = array();

    $query_string = "SELECT ";

    // prepare $mergecol 2d array
    $merge_pairs = explode(";", $mergecols);
    $join_cols = array();

    for ($i = 0; $i < count($merge_pairs); $i++) {
        array_push($join_cols, explode(",", $merge_pairs[$i]));
    }

    $query_string = $query_string . buildJoinQueryColumnPart($tables, $columns)
        . " FROM " . buildQueryJoinPart($tables, $join_cols, $joinMode);

    // Query DB
    $resultSet = $pdo->query($query_string);

    foreach ($resultSet as $row) {
        $tmpArray = array();

        foreach ($row as $key => $value) {

            if (is_string($key)) {
                // Todo: if there are invalid values set them to NULL here
                $tmpArray[$key] = $value;
            }

        }

        $keyID = array_keys($tmpArray)[0];

        array_push($rows, array(
            $keyID => array_shift($tmpArray),
            'rowdata' => $tmpArray));
    }

    return json_encode($rows);
}

function loadDataAsJSON(&$pdo, $table, $columns)
{

    $rows = array();

    $selectStatement = "SELECT " . buildQueryColumnPart($columns) . "FROM " . $table . ";";
    $resultSet = $pdo->query($selectStatement);

    foreach ($resultSet as $row) {
        $tmpArray = array();
        for ($i = 1; $i < count($columns); $i++) {
            $tmpArray[$columns[$i]] = $row[$i];
        }

        array_push($rows, array(
            $columns[0] => $row[0],
            'rowdata' => $tmpArray
        ));
    }

    return json_encode($rows);
}

function buildQueryColumnPart($columns)
{
    $col_string = "";

    for ($i = 0; $i < count($columns); $i++) {
        $col_string = $col_string . $columns[$i];

        if ($i < count($columns) - 1) {
            $col_string = $col_string . ", ";
        } else {
            $col_string = $col_string . " ";
        }
    }

    return $col_string;
}

function buildJoinQueryColumnPart($tables, $columns)
{
    $col_string = "";

    $tablecols = explode(";", $columns);

    for ($i = 0; $i < count($tables); $i++) {

        $cols = explode(",", $tablecols[$i]);

        $t = $tables[$i];

        for ($j = 0; $j < count($cols); $j++) {
            $c = $cols[$j];

            $col_string = $col_string . $t . "." . $c . ' AS "' . $t . "." . $c . '"';

            if (!($i == count($tables) - 1 && $j == count($cols) - 1)) {
                $col_string = $col_string . ", ";
            }
        }
    }

    return $col_string;
}

function buildQueryJoinPart($tables, $join_cols, $join_method)
{
    $join_string = "";
    $join_string = $join_string . $tables[0];

    for ($i = 1; $i < count($tables); $i++) {
        $j = $i - 1;
        $join_string = $join_string . " " . $join_method . " " . $tables[$i];
        $join_string = $join_string . " ON "
            . $tables[0] . "." . $join_cols[$j][0] . " = " . $tables[$i] . "." . $join_cols[$j][1];
    }
    return $join_string;
}

function sanitize_identifier_array($identifiers) {
    for ($i = 1; $i < count($identifiers); $i++) {
        $identifiers[$i] = sanitize_identifier($identifiers[$i]);
    }

    return $identifiers;
}

function sanitize_identifier($identifier) {
    if (is_numeric(substr($identifier, 0, 1))) {
        return "'$identifier'";
    } else {
        return "$identifier";
    }
}

?>