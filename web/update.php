<?php
    $appos = $_GET['appos'];
    $appabi = $_GET['appabi'];
    $fn = "update-{$appos}_{$appabi}.rdf";
    if (file_exists($fn)) {
        $fp = fopen($fn, 'r');
        if ($fp) {
            header('Content-Type: text/xml');
            header('Content-Length: '.filesize($fn));
            fpassthru($fp);
        }
    }
    exit;
?>
