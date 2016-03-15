<?php

$operation = $_POST['optype'];

switch ($operation) {
    case "filelist":
        $filenameArray = [];
        $ignoreFiles = ['.', '..', '.DS_Store'];

        $handle = opendir($_SERVER['DOCUMENT_ROOT'].'/data/sample/');
        while($file = readdir($handle)){
            if(!in_array($file, $ignoreFiles)) {
                if (!is_dir($file)) {
                    array_push($filenameArray, "data/sample/$file");
                }
            }
        }

        closedir($handle);

        echo json_encode($filenameArray);
        break;

    case "filelistrecursive":
        echo json_encode(read_dir_content($_SERVER['DOCUMENT_ROOT'].'/data/sample/', "data/sample/"));
        break;

    case "fileheaders":
        $filePath = $_SERVER['DOCUMENT_ROOT']."/".$_POST['file'];

        $fp = fopen($filePath, "r");

        $headLine = "";

        if ($fp) {
            $headLine = fgets($fp);

            fclose($fp);
        } else {
            $headLine = "Error - could not open file.";
        }

        echo json_encode($headLine);
        break;
}

function read_dir_content($parent_dir, $parent_dir_short, $depth = 0) {
    $file_array = Array();
    $ignoreFiles = ['.', '..', '.DS_Store'];
    if ($handle = opendir($parent_dir))
    {
        while (false !== ($file = readdir($handle)))
        {
            if(in_array($file, $ignoreFiles)) continue;
            if( is_dir($parent_dir . "/" . $file) ){
                $file_array = array_merge($file_array, read_dir_content($parent_dir . "/" . $file, $parent_dir_short.$file."/", $depth++));
            } else {
                array_push($file_array, $parent_dir_short.$file);
            }
        }
        closedir($handle);
    }

    return $file_array;
}
?>