<?php 

define ('DATA_PATH', '/var/www/temp/data');
define ('QUEUE_PATH', '/var/www/shadow.net/client');


require("queue.progress.php");   
require("../webnews/nntp.php");   
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

    $converter    = new Application_Model_VideoConverter;
    $unpacked     = simplexml_load_string($message);  
    $videofile    = "{$unpacked->file}";  
    $response     =  $converter->Convert ($videofile, $messageKey);
    echo $response;
    SetProgress($messageKey, 1, 1, 'COMPLETE', ""); 
} 


class Application_Model_VideoConverter
{
    function Convert ($videofile, $messageKey)
    {
        $begun     = time();
        $command   = "HandBrakeCLI -i \"{$videofile}\" -o \"{$videofile}.m4v\" --preset=\"iPhone & iPod Touch\"";
        $id = $this->run_in_background($command);

        echo ":: {$id} is now running...\n";
        while ($this->is_process_running($id))
        {
            $elapsed = time() - $begun;
            echo "*  {$id} is still running " . $elapsed . "...\n"; 
            $info = $this->Readff();
            $percent = $info ['percent'];
            $fps     = $info ['fps'];
            $time    = $info ['time'];
          
            SetProgress($messageKey, 100, $percent, 'IN PROGRESS', "{$fps}. {$time} remaining..."); 
            sleep (5);
        } 
        return "{$videofile}.m4v";
    }
 
    function run_in_background($Command, $Priority = 0)
    {
        if (file_exists('/var/www/video.out')) unlink ('/var/www/video.out');
        if($Priority)
            $PID = shell_exec("nohup nice -n $Priority $Command > /dev/null & echo $!");
        else
            $PID = shell_exec("nohup $Command > /var/www/video.out & echo $!");
        return($PID);
    }

    function is_process_running($PID)
    {
        exec("ps $PID", $ProcessState);
        return(count($ProcessState) >= 2);
    }
 
    function Readff()
    {
        if (!file_exists('/var/www/video.out')) return "No polling file!"; 
        $fr = file_get_contents ('/var/www/video.out');
        $mark = min (strlen($fr), 64); 
        $frag = substr($fr, strlen($fr) - $mark);
        $regx = '/(\d+\.\d+)\s+.*\%*.\((\d+\.\d+)\s+fps.*ETA\s+(\S+h\S+m\S+s)/imU';
        if (preg_match ($regx, $frag, $array))
            return array (
                           "percent" => $array[1],
                           "fps"     => "Encoding at " . $array[2] . " fps",
                           "time"    => $array[3] 
                         );
        return array('percent'=>1, 'fps'=>"Waiting for encoder...", 'time'=>'00h00m00s'); 
    }

   
}


Page_Load();
