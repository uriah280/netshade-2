<?php

         error_reporting(E_ALL & ~E_NOTICE);

function gen_uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        // 32 bits for "time_low"
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),

        // 16 bits for "time_mid"
        mt_rand( 0, 0xffff ),

        // 16 bits for "time_hi_and_version",
        // four most significant bits holds version number 4
        mt_rand( 0, 0x0fff ) | 0x4000,

        // 16 bits, 8 bits for "clk_seq_hi_res",
        // 8 bits for "clk_seq_low",
        // two most significant bits holds zero and one for variant DCE1.1
        mt_rand( 0, 0x3fff ) | 0x8000,

        // 48 bits for "node"
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
}

function nameOf($str) {
	if (strpos($str, '&quot;')!==false)
	    $str = html_entity_decode($str); 
	if (preg_match('/.*"([^"]*)".*/ims', $str, $temp))
	    return $temp[1];
	else if (preg_match('/.*\s+(\S+\.\w{3})/', $str, $temp))
	    return str_replace('&quot;', '', $temp[1]);
	else return $str;
}
 
function trunc($a, $b=50) { 
    return strlen($a) > $b
          ? ( substr($a,0,$b/2) . "..." . substr($a,strlen($a)-($b/2)))
          : $a;
}
 
function cmp($a, $b) { 
    return (nameOf($a->subject) < nameOf($b->subject)) ? -1 : 1;
}
define ("HOME_PATH", "/home/milton/netshade-4/");
define ('PAGE_PATTERN', "<a href='%s%s'>%s</a>");
define ('LOGFILE', HOME_PATH . "netshade/ShadeDb.log");
define ('PAGE_MAX', 10);
define ('PAGE_SIZE', 8);
define ('QUEUE_SEND', HOME_PATH . 'temp/queue/notify');
define ('QUEUE_RECEIVE', HOME_PATH . 'temp/queue');

// Define path to application directory
defined('APPLICATION_PATH')
    || define('APPLICATION_PATH', realpath(dirname(__FILE__) . '/../application'));

// Define application environment
defined('APPLICATION_ENV')
    || define('APPLICATION_ENV', (getenv('APPLICATION_ENV') ? getenv('APPLICATION_ENV') : 'production'));

// Ensure library/ is on include_path
set_include_path(implode(PATH_SEPARATOR, array(
    realpath(APPLICATION_PATH . '/../library'),
    get_include_path(),
)));

# if (file_exists (LOGFILE)) unlink (LOGFILE);

/** Zend_Application */
require_once 'Zend/Application.php'; 

// Create application, bootstrap, and run
$application = new Zend_Application(
    APPLICATION_ENV,
    APPLICATION_PATH . '/configs/application.ini'
);

$application->bootstrap()
            ->run();

