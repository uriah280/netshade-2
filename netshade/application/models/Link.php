<?php

class Application_Model_Link
{
    var $Text;
    var $Href;
    function __construct($text, $href=NULL)
    { 
        $this -> Text = $text;
        $this -> Href = $href; 
    } 
}

