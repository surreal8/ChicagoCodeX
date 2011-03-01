<!DOCTYPE HTML>
<html>
    <head>
        <title><?php print $element['#node']->title; ?></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    </head>
    <body>
        <section class="root">
            <header>
                <h1><?php print $element['#node']->title; ?></h1>
            </header>
<?php
    foreach ($element as $k => $v) {
        if (strpos($k, 'field_osci_') === 0) {
//        if (is_array($v) && isset($v['#field_type']) && $v['#field_type'] === 'osci_body_copy') {
            print render($v);
        }
    }
?>
        </section>
    </body>
</html>
