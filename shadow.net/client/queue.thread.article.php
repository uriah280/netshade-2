<?
define ('THREAD_COUNT', 4);
define ('QUEUE_PATH', '/var/www/shadow.net/client');
define ('ARTICLE_CLIENT', 'queue.article');
define ('DATA_PATH', '/var/www/temp/data'); 

require("queue.progress.php");   
require("../webnews/nntp.php");   
function Page_Load()
{
    global $argv;
    $messageKey = $argv[1];   

    $messageDoc = QUEUE_DATA . "/{$messageKey}.pend";
    if (!file_exists($messageDoc)) return;
    echo "\n{$messageDoc}\n";
    $message = file_get_contents ($messageDoc);
    unlink ($messageDoc);
    echo $message;
    echo "\n\n";

    $unpacked   = simplexml_load_string($message);  
    $groupName  = "{$unpacked->groupname}"; 
    $articleKey = "{$unpacked->article}";  
    $server = new Threaded_Download ;
    $unencoded = $server->Download ($articleKey, $groupName, $messageKey);
    file_put_contents ($messageKey.".txt", $unencoded);
    SetProgress($messageKey, 1, 1, 'COMPLETE', ""); 
} 

Page_Load();

class Threaded_Download 
{
    function SendMessage ($Param)
    { 
        $Id        = gen_uuid(); #time();  
        $notify    = QUEUE_DATA . "/notify/ping.{$Id}";  
        $Request   = array();
        $Request[] = "<Request>"; 
        $Request[] = "<id>{$Id}</id>";
        while (list($name, $value) = each ($Param)) {
            $Request[] = "<{$name}><![CDATA[{$value}]]></{$name}>";
        }
        $Request[] = "</Request>";
        $Request = implode ("\n", $Request); 
        file_put_contents ($notify, $Request);
        return $Id;
    } 

    function IsRunning($ID)
    { 
        $queuePath  = QUEUE_DATA . "/{$ID}.queue";
        $queueState = "";
        if (file_exists($queuePath)) {
            $queueData   = file_get_contents($queuePath);
            unlink ($queuePath);
            $unpacked   = simplexml_load_string($queueData);  
            $queueState = "{$unpacked->state}";  
            return $queueState != 'COMPLETE'; 
        } 
        return true;
    }


    function Run($Command, $Priority = 0)
    { 
        if($Priority)
            $PID = shell_exec("nohup nice -n $Priority $Command > /dev/null & echo $!");
        else
            $PID = shell_exec("nohup $Command > fn.txt & echo $!");
        return($PID);
    }

    function Download ($articleKeys, $groupName, $messageKey)
    {
        $dir     = QUEUE_DATA . "/thread." . time();
        mkdir ($dir);

        $thread  = array(); 
        $params  = array();
        $tmp     = array();
        $ret     = array();
        $keys    = explode ('-', $articleKeys);
        $size    = sizeof($keys);
        $span    = ceil ($size / THREAD_COUNT);      
        $bytes   = 0;
        $time    = time();
        
        for ($i=0;$i<sizeof($keys);$i++)
        { # TO DO: more efficient with array_slice
            $tmp[] = $keys[$i]; 
            if (sizeof($tmp) == $span)
            {
                $params[] = implode('/', $tmp);
                $tmp = array();
            }
        }
        
        if (sizeof($tmp) > 0)
        {
            $params[] = implode('/', $tmp); 
        }
         
        for ($i=0;$i<sizeof($params);$i++)
        {
            $param    = $params[$i];

            $data = array ('groupname'  => $groupName,
                            'endpoint'   => ARTICLE_CLIENT, 
                            'savedir'    => $dir, 
                            'article'    => $param );

            $thread[] = $this->SendMessage ($data);
 
        }
         
        while (true)
        {
             $run = false;
             for ($i=0;$i<sizeof($thread);$i++)
             {
                 $ing     = $this->IsRunning($thread[$i]);
                 echo $thread[$i] . " is " . ($ing ? "running" : "done") . "...\n";
                 $run     = $run || $ing; 
             }
                 $elapsed = time() - $time;
                 $count   = sizeof(scandir($dir)) - 2;
                 echo ". $count of $size ($elapsed)\n";
             
	         # 	 $this->Controller->LogEntry ("{$elapsed}. Checking thread", $count, $size, $group);
                 sleep(2);
                 
             if ($count == $size || !$run) break;
        } 
        
        for ($x=0;$x<sizeof($keys);$x++)
        {
            $path   = $dir . '/' . $keys[$x] . '.news'; 
            if (!file_exists($path)) continue;
            $body   = file_get_contents ($path);
            $bytes += filesize($path);
            $ret[]  = $body;        
                                                    
            if (strpos($body, "ybegin") !== false)                                             
            {  
                $this->Yenc = true;                            
            }                               
        }  
        
        $time = time() - $time;
        $per  = ceil ( $bytes/$time/1000 );
        echo "$bytes bytes in $time secs ($per kb/s).\n";
        
        # exec ("rm -rf $dir");
        
        return $ret;
    }
    
}
?>

