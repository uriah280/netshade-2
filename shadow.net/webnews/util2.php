<?php

require("webnews/uucoder.php");
require("webnews/yenc.php");
require("webnews/nzb.php");


function decode_MIME_header($str) {
    while (preg_match("/(.*)=\?.*\?q\?(.*)\?=(.*)/i", $str, $matches)) {
        $str = str_replace("_", " ", $matches[2]);
        $str = $matches[1].quoted_printable_decode($str).$matches[3];
    }
    while (preg_match("/=\?.*\?b\?.*\?=/i", $str)) {
        $str = preg_replace("/(.*)=\?.*\?b\?(.*)\?=(.*)/ie", "'$1'.base64_decode('$2').'$3'", $str);
    }
    return $str;
}



function decode_message_content($part) {
    $encoding = $part["header"]["content-transfer-encoding"];                                                                                                              
    if (stristr($encoding, "base64")) {
        return base64_decode($part["body"]);
    } else if (stristr($encoding, "uuencode")) {
        return uudecode($part["body"]);
    } else if (stristr($encoding, "yenc")) {
        $enc  = new yenc();
        return $enc->decode($part["body"]);
    } else {
        return $part["body"];
    }
}

function decode_sender($sender) {
    if (preg_match("/(['|\"])?(.*)(?(1)['|\"]) <([\w\-=!#$%^*'+\\.={}|?~]+@[\w\-=!#$%^*'+\\.={}|?~]+[\w\-=!#$%^*'+\\={}|?~])>/", $sender, $matches)) {
    // Match address in the form: Name <email@host>
        $result["name"] = $matches[2];
        $result["email"] = $matches[sizeof($matches) - 1];
    } elseif (preg_match("/([\w\-=!#$%^*'+\\.={}|?~]+@[\w\-=!#$%^*'+\\.={}|?~]+[\w\-=!#$%^*'+\\={}|?~]) \((.*)\)/", $sender, $matches)) {
        // Match address in the form: email@host (Name)
        $result["email"] = $matches[1];
        $result["name"] = $matches[2];
    } else {
        // Only the email address present
        $result["name"] = $sender;
        $result["email"] = $sender;
    }

    $result["name"] = str_replace("\"", "", $result["name"]);                                                                                                                                                                        
    $result["name"] = str_replace("'", "", $result["name"]);                                                                                                                                                                        
    return $result;                                                                                                                                                                        
}
