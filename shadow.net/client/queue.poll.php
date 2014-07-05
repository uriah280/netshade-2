<?
define ('QUEUE_PATH', '/var/www/shadow.net/client');
define ('QUEUE_DATA', '/var/www/temp/queue');

function Page_Load()
{ 
    global $argv;
    $notify = $argv[1];    
    if (!file_exists($notify)) return;
    $message      = file_get_contents($notify);
    $unpacked     = simplexml_load_string($message);

    rename ($notify, QUEUE_DATA . "/{$unpacked->id}.pend");
 

    $command  = "php " . QUEUE_PATH . "/{$unpacked->endpoint}.php {$unpacked->id}";
    echo "{$command}\n";
    passthru ($command);
    return Page_Load();
}


Page_Load();
