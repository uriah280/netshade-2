<?

require("queue.progress.php");   

# define ("HOME_PATH", "/home/milton/netshade-2/");

define ('QUEUE_DATA', HOME_PATH . 'temp/queue');
define ('QUEUE_PATH', HOME_PATH . 'shadow.net/client'); 

 

function Page_Load()
{ 
    global $argv;
    $notify = $argv[1];    
    if (!file_exists($notify)) return;
    $message      = file_get_contents($notify);
    $unpacked     = simplexml_load_string($message);

    echo "\n\n{$message}\n\n";

    rename ($notify, QUEUE_DATA . "/{$unpacked->id}.pend"); 

    $command  = "php " . QUEUE_PATH . "/{$unpacked->endpoint}.php {$unpacked->id}";
    echo "{$command}\n";
    passthru ($command);
    return Page_Load();
}


Page_Load();
