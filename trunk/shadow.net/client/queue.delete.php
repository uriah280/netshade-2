<?
   
require("queue.progress.php");   
function Page_Load()
{
    global $argv;
    $messageKey = $argv[1];   
    set_time_limit(0);
    $messageDoc = QUEUE_DATA . "/{$messageKey}.pend";
    if (!file_exists($messageDoc)) return;
    echo "\n{$messageDoc}\n";
    $message = file_get_contents ($messageDoc);
    unlink ($messageDoc);
    echo $message;
    echo "\n\n";

    $unpacked     = simplexml_load_string($message);  
    $dir          = "{$unpacked->dir}"; 
    if (is_dir($dir)) passthru ("rm -rf {$dir}"); 
    SetProgress($messageKey, 1, 1, 'COMPLETE', ""); 
} 

Page_Load();


