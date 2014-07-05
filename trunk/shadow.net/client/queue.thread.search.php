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
    set_time_limit(0);
    $messageDoc = QUEUE_DATA . "/{$messageKey}.pend";
    if (!file_exists($messageDoc)) return;
    echo "\n{$messageDoc}\n";
    $message = file_get_contents ($messageDoc);
    unlink ($messageDoc);
    echo $message;
    echo "\n\n";

    $unpacked    = simplexml_load_string($message);  
    $groupName   = "{$unpacked->groupname}"; 
    $searchParam = "{$unpacked->param}";  
    $server      = new Threaded_Search ;
    $unencoded   = $server->Search ($searchParam, $groupName, $messageKey);
    file_put_contents ($messageKey.".txt", $unencoded);
    SetProgress($messageKey, 1, 1, 'COMPLETE', ""); 
    exec ("rm " . QUEUE_DATA . "/*.txt");
} 

Page_Load();

class Threaded_Search 
{
    function __construct()
    {
        $info = array ('server'   => "news.usenet.net",
                        'username' => 'info@cyber8.net',
                        'password' => 'Password');
        $Server     = $info['server'];
        $Username   = $info['username'];
        $Password   = $info['password'];
        $Db         = array(); 
        $this->NNTP = new NNTP($Server, trim($Username), trim($Password));    
    }


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

    function GetMessage($ID)
    { 
        $queuePath  = QUEUE_DATA . "/{$ID}.queue";
        $queueState = "";
        if (file_exists($queuePath)) {
            $queueData   = file_get_contents($queuePath);
            unlink ($queuePath); 
            return simplexml_load_string($queueData);  
        } 
        return NULL;
    }


    function Run($Command, $Priority = 0)
    { 
        if($Priority)
            $PID = shell_exec("nohup nice -n $Priority $Command > /dev/null & echo $!");
        else
            $PID = shell_exec("nohup $Command > fn.txt & echo $!");
        return($PID);
    }

    function Search ($searchParam, $groupName, $messageKey)
    {



	$nntp   = $this->NNTP; 
	$time   = time();
	$thread = array(); 
        if (!$nntp->connect())                                                
        {                                                
            header("Content-Error: " . $nntp->get_error_message());                                               
            echo "<b>".$messages_ini["error"]["nntp_fail"]."</b><br>";                                                
            echo $nntp->get_error_message().$nntp_server."<br>";                                                
            return;                                               
        }  
		
        echo "Getting info for group {$groupName}\n"; 
        if ( !( $gi=$nntp->join_group(trim($groupName)) ))                                               
        {
            echo "Unable to join group {$groupName}.\n";
	}            
        $nntp->quit();   


	$min    = min ($gi['start_id'], $gi['end_id']);                  
        $max    = max ($gi['start_id'], $gi['end_id']);             
	$span   = ceil(($max - $min) / THREAD_COUNT);
	$params = array ();
		
        for ($i=$min;$i<$max;$i+=$span)
        {
            $params[] = array('x'=>$i, 'y'=>$i + $span - 1); 
        }

        $dir = DATA_PATH . "/search/{$groupName}";
        if (!is_dir ($dir)) mkdir ($dir);

        if (!is_dir ($dir)) {
             echo "FAILED TO CREATE $dir";
             return;
        }
        $name    = "{$dir}/{$searchParam}.xml";
        $thread  = array();  
        $tmp     = array();
        $ret     = array(); 
        $size    = sizeof($keys);      
        $bytes   = 0;
        $time    = time();
        
        
         
        for ($i=0;$i<sizeof($params);$i++)
        {
            $param    = $params[$i];

            $data = array ('groupname'  => $groupName,
                            'endpoint'   => 'queue.newsgroup',  
                            'start'      => $param['x'],
                            'end'        => $param['y'], 
                            'param'      => $searchParam );

            $thread[] = $this->SendMessage ($data);
 
        }
         
        $z = sizeof($thread);
        $arr=array();
        $sum=array();
        while ($z > 0)
        { 
             $max = 0;
             $amt = 0;

             for ($i=0;$i<sizeof($thread);$i++)
             {
                 $message = $this->GetMessage($thread[$i]);
                 if ($message && $message->caption) {  
                     $arr["caption_{$i}"] = "{$message->caption}";
                     $arr["max_{$i}"]     = "{$message->max}";
                     $arr["state_{$i}"]   = "{$message->state}";
                     $arr["value_{$i}"]   = "{$message->value}";
                     $max += $message->max;
                     $amt += $message->value;
                 } 

                 if ($message && $message->state == "COMPLETE") { 
                     $z --;
                 } 
 
             }

         
             $elapsed = time() - $time; 
             $sum[]   = $amt / $elapsed;
             $bitRate = array_sum($sum) / sizeof($sum);
             $remain  = $max - $amt;
             $togo    = floor($remain / $bitRate);
             $inf     = "{$remain} articles remaining @ $bitRate /sec.";

             SetProgress($messageKey, $max, $amt, 
                           'IN PROGRESS', "Searching {$groupName} for '{$searchParam}' ({$togo})...<br>{$inf}", $arr) ; 

         //    echo ".  ($elapsed)\n"; 
             sleep(5);      
        } 
         
        $tmp = fopen (QUEUE_DATA.'/'.$messageKey.'.cmd', 'a');

        for ($i=0;$i<sizeof($thread);$i++)
        {
            $text = file_get_contents ($thread[$i].'.dat');
            unlink ($thread[$i].'.dat');
            fwrite ($tmp, $text);
        }
        fclose ($tmp);

      
        $data = array ('groupname'  => $groupName,
                        'endpoint'   => 'queue.newsgroup',  
                        'saveas'     => $name,  
                        'decode'     => QUEUE_DATA.'/'.$messageKey.'.cmd' );

        $thread = $this->SendMessage ($data);
        $time   = time();
        while ($this->IsRunning($thread)) {

             $elapsed = time() - $time; 
             echo ".  ($elapsed)\n"; 
             SetProgress($messageKey, sizeof($thread), sizeof($thread), 
                           'IN PROGRESS', "Collating {$groupName} results {$elapsed}...") ; 
             sleep(5);      
        }

        return $ret;
    }
    
}
?>

