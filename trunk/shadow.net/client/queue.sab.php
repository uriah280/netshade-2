<?
define ('SAB_API', 'http://ubuntu:8080/sabnzbd/api');
define ('SAB_PATH', '/home/uriah/NNTP/wweb');
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

    $unpacked     = simplexml_load_string($message);  
    $groupName    = "{$unpacked->groupname}"; 
    $fileName     = "{$unpacked->filename}"; 
    $articleIndex = "{$unpacked->index}";  
    $articleId    = "{$unpacked->article}";  
    $response     =  CreateNZB($groupName, $fileName, $articleIndex, $articleId, $messageKey);
    echo $response;
   # SetProgress($messageKey, 1, 1, 'COMPLETE', ""); 
} 

function CreateNZBNode($groupName, $articles, $array=NULL, $title=NULL)
{
    $ret = array();
    $ret[] = '<'.'?xml version="1.0" encoding="iso-8859-1" ?'.'>';
    $ret[] = '<!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.0//EN" "http://www.newzbin2.es/DTD/nzb/nzb-1.0.dtd">';
    $ret[] = '<nzb xmlns="http://www.newzbin2.es/DTD/2003/nzb">';
    $ret[] = CreateFileNode ($groupName, $articles, $array, $title);
    $ret[] = '</nzb>';
    return implode ("\r\n", $ret);
}

function ContainsId ($ID, $array)
{ 
    foreach ($array as $a)
        if (strpos($a['id'], $ID)!==false)
            return true;
}
    
    function _getRegEx($s)
    { 
        $regex        = preg_replace('/["\-\/\+\[\]\(\)\*]/', '.', $s);
        $regex        = preg_replace('/(\d+)/', '\d+', $regex);
        $regex        = preg_replace('/(\s+)/', '\s+', $regex); 
        
    

        return "/{$regex}/";
    }
    
function CreateFileNode ($groupName, $articleList, $array=NULL, $title=NULL)
{ 
    $ret  = array();
	$data = $array ? $articleList : array($articleList);
	foreach ($data as $articles) {
	    $x     = 1;
	    $first = NULL; #$articles[0];
	    $seg   = array();
	
#	    foreach ($articles as $article) {
            while (list ($id, $article) = each ($articles)) {
                if ($array && ! ContainsId ($id, $array)) continue;
	        if (!$first) $first = $article;
	        $seg[] = CreateSegmentNode ($article, $x); 
	        $x ++;
	    }
#	if ($title && ! preg_match (_getRegex($title), $first['subject']) ) continue;

	    $ret[] = '<file subject="'.htmlentities($first['subject']).'" date="'.$first['date'].'" poster="'.$first['from_email'].'">';
	    $ret[] = '	<groups>';
	
	            $arr = explode ('|', $first['references']);
	   
		    for ($fn=0;$fn<sizeof($arr);$fn++) {
	                if ($arr[$fn]!='Xref') {
	                    $ret[] = '		<group>'.$arr[$fn].'</group>';  
	                }
	            }
	    $ret[] = '	</groups>';
	    $ret[] = '	<segments>';
	    $ret[] = implode ("\r\n", $seg);
	    $ret[] = '	</segments>';
	    $ret[] = '</file>';
	}
    return implode ("\r\n", $ret);
}

function CreateSegmentNode ($article, $index)
{

echo "[" . $article['references'] . "]\n\n";

    $id = str_replace ("<", "", str_replace (">", "", $article["message_id"])) ;
    $bytes = $article["byte_count"];
    return '<segment bytes="'.$bytes.'" number="'.$index.'"><![CDATA['.$id.']]></segment>'; 
}

function CreateNZB($groupName, $fileName, $articleIndex, $articleId, $messageKey)
{
    # get_summary($start_id, $end_id)  
    $articleList = simplexml_load_file($fileName);
    $articlesets = array();

    $query = "//list/article[@index='{$articleIndex}']";
    $result = $articleList->xpath($query);  

    if (sizeof ($result) < 1) return;
    $id    = (string) $result[0]->id;
    $title = (string) $result[0]->subject;
    $type  = (string) $result[0]->type;

    $query = "//list/article[@index='{$articleIndex}']/items/article";

    $temp = $articleList->xpath($query);  
    foreach ($temp as $node) {
        $id = (string) $node->id;
        if (strpos ($id, $articleId)!==false) {
            $target = $node;
            $id     = (string) $target->id;
            $title  = (string) $target->subject;
            break;
        }
    }

    if (!$target) {
        SetProgress($messageKey, 1, 1, 'ERROR', "Article '{$articleId}' not found! Please try again."); 
        return;
    }

    $array = explode ('-' ,$id);
    $Key   = $array[0];
    $Nick  = deSubject($title);
    $lo    = min($array);
    $hi    = max($array);
    $list  = NULL;
    $hash  = array();
    if ($type=="rar") {
	$list = array ();
        $kids = $result[0]->children();  
        foreach ($kids as $kid) { 
            if ($kid->getName()=='items') {
                $items = $kid->children();  
                foreach ($items as $item) {
              	    $array  = explode ('-' ,$item->id);
                    $list[] = array ('lo'=>min($array), 'hi'=>max($array), 'id'=>$item->id);
		    $hash[] = min($array);
                    $hash[] = max($array);
                } 
            }
        } 
        $lo    = min($hash);
        $hi    = max($hash);
    }

    SetProgress($messageKey, 100, 1, 'IN PROGRESS', "Looking up articles {$lo} thru {$hi}...") ;
    $sab = new Application_Model_SABConnector;
    $nzb = $sab->GetArticles ($groupName, $lo, $hi, $list, $title) ;		
    $uri = "/var/www/shadow.net/public/nzb/{$messageKey}.nzb";
    $api = SAB_API . "?mode=addurl&name=http://localhost/nzb/{$messageKey}.nzb&nzbname={$messageKey}"; 
    file_put_contents ($uri, $nzb); 
    $e   = file_get_contents($api);
    $get = SAB_API . "?mode=qstatus&output=xml";   

    $started = false;
    for ($i=0;$i<3600;$i++) {
        sleep (2);
        $e = GetSABQueue(); 
        $state = $e->xpath ("//state");

        if (sizeof ($state) < 1) continue;
        $state = (string) $state[0];
        if ($state=="DOWNLOADING") $started = true;
        if (!$started) {
            SetProgress($messageKey, 0,1, 'IN PROGRESS', "Waiting for download to start ($i) {$state}...") ; 
            if ($i > 15) break;
            continue;
        } 

        $jobs = $e->xpath ("//job[filename='{$messageKey}']");
        if (sizeof ($jobs) < 1) break;
        $job = $jobs[0];
        $max = (string) $job->mb;
        $mbl = (string) $job->mbleft;
        $amt = $max - $mbl;
        $kps = (string) $job->kbpersec;
        $sec = (string) $e->timeleft;

        SetProgress($messageKey, $max, $amt, 'IN PROGRESS', "Downloading {$title} at {$kps} kb/s. {$sec} remaining") ; 
        echo $e;
    }

    $loc = SAB_PATH . "/{$messageKey}";
    $x   = 0;

    while (sizeof ($e->xpath ("//job[filename='{$messageKey}']")) > 0) {
        echo "\nPOST-PROCESSING...\n";
        $e=GetSABQueue(); $x++;
        SetProgress($messageKey, 100, 1, 'IN PROGRESS', "Waiting ($x)..."); 
        sleep (5);
    }

    $x = 0;
    if (++$x < 20 & !is_dir($loc)) {
        SetProgress($messageKey, 100, 1, 'IN PROGRESS', "Still waiting ($x)..."); 
        sleep (5);
    }

    if (is_dir($loc)) {
        $dir    = DATA_PATH . "/download/{$groupName}";
        $dest   = "{$dir}/{$messageKey}";
        $mem    = "{$dir}/{$Key}.xml";
        if (!is_dir ($dir)) mkdir ($dir);
        rename ($loc, $dest);

        passthru ("chmod -R 777 {$dest}");
        SetProgress($messageKey, 100, 1, 'IN PROGRESS', "Taking snapshot..."); 
   
        $text = collate($dest, $type, $fileName, $articleId, $groupName, $title, $messageKey);
        if (strlen($text) > 0) {
            file_put_contents ($mem, $text);
       
            echo "\nDOWNLOAD COMPLETE...\n";
            SetProgress($messageKey, 1, 1, 'COMPLETE', "Download complete."); 
        
            GetSABQueue(); 
            return;
        }
        SetProgress($messageKey, 1, 1, 'ERROR', "Download failed (Invalid format in '{$dest}')! Please try again."); 
        return;
    }
    SetProgress($messageKey, 1, 1, 'ERROR', "Download failed ('{$loc}' not found)! Please try again."); 
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




function deSubject($str) {
	if (strpos($str, '&quot;')!==false)
	    $str = html_entity_decode($str);
//	if (preg_match('/.*\s+"(\S+\.\w{3})"/', $str, $temp))
	if (preg_match('/.*"([^"]*)".*/ims', $str, $temp))
	    return $temp[1];
	else if (preg_match('/.*\s+(\S+\.\w{3})/', $str, $temp))
	    return str_replace('&quot;', '', $temp[1]);
	else return $str;
}

function collate ($dir, $type, $fileName, $articleId, $groupName, $subject, $messageKey, $ret='')
{
    $kid = array ();
    $arr = scandir ($dir);
    foreach ($arr as $file) {
        if ($file == "." || $file == "..") continue;
        $media  = "{$dir}/{$file}";
        if (is_dir ($media)) {
            $kid[] = $media;
            continue;
        }

        if ($type=="wmv") {

            $data = array (
                     "endpoint"=>"queue.video",
                     "file"=>$media
                         );
            $key = SendMessage ($data);
            
            while (true) {

                 echo "Waiting for {$key}...\n";
                 $message = GetMessage($key);
                 if ($message && $message->caption) {   
                     SetProgress($messageKey, (string) $message->max, (string) $message->value, 'IN PROGRESS', (string) $message->caption); 
                 }  
 
                 if ($message && $message->state == "COMPLETE") { 
                     break;
                 } 
                 sleep(5);

            }

            $media = "{$media}.m4v";

        }
        if (!file_exists($media)) continue;
        $image   = snap ($media); 
        $idx     = array(); 
        $idx[]   = "<media>";
        $idx[]   = "  <image><![CDATA[{$image}]]></image>";
        $idx[]   = "  <media><![CDATA[{$media}]]></media>";
        $idx[]   = "</media>"; 
        $subject = str_replace("'", "", $subject);

        $sql = "INSERT INTO MediaIndex (groupname, filename, mediauri, imageuri, articleid, subject) VALUES " . 
               "  ('{$groupName}', '{$fileName}', '{$media}', '{$image}', '{$articleId}', '{$subject}') ";

        $db = new Usenet_Connector;
        $result = $db->Execute ($sql);
        $db->Close();

        Archive($fileName, $articleId, $media, $image);
    }
    foreach ($kid as $file) $idx[] = collate ($file, $type, $fileName, $articleId, $groupName, $subject, $messageKey, implode ("\n", $idx));
    return implode ("\n", $idx); 
}

    function Archive($fileName, $articleId, $media, $image) 
    {  
        $doc = new DOMDocument();
        $doc->load($fileName); 
        $xpath = new DOMXpath($doc);
        foreach($xpath->query("//article[contains(id, '{$articleId}']") as $node) {
            $node->setAttribute('media', $media);
            $node->setAttribute('image', $image);
        }
        $doc->save($fileName);  
    }

function snap ($videofile)
{
$image = "{$videofile}.jpeg";
$c=("ffmpeg -i \"{$videofile}\" -vcodec mjpeg -vframes 1 -ss 2 -an -f rawvideo -s 768x576 \"{$image}\"");
echo $c;
passthru($c); 
    return $image;
}

function GetSABQueue()
{ 
    $get = SAB_API . "?mode=qstatus&output=xml";   
    $queueData = file_get_contents($get); echo $queueData;
    return simplexml_load_string($queueData);  
}

class Application_Model_SABConnector
{

    public $Id;
    public $Yenc;
    public $Encoding = NULL;
    public $GroupName;
    public $NNTP;
    public $Filter = NULL;
    public $Search = NULL;
    public $KeepAlive = NULL;
    public $SaveTo = NULL;
    public $groups;

    function __construct($filter='', $search='', $saveto='')
    {
        $info = array ('server'   => "news.usenet.net",
                        'username' => 'info@cyber8.net',
                        'password' => 'Password');
        $Server     = $info['server'];
        $Username   = $info['username'];
        $Password   = $info['password'];
        $Db         = array(); 
        $this->NNTP = new NNTP($Server, trim($Username), trim($Password));   
        $this->Filter = $filter;
        $this->Search = $search;
        $this->SaveTo = $saveto;
    }

    function GetArticles ($groupName, $start_id, $end_id, $array=NULL, $title=NULL) 
    {
        
        if (strlen($groupName) > 0) {

            $this->GroupName = $groupName;
            $this->KeepAlive = true;
            $this->Connect2Group();

        }
        if ($array)
		{
			$ret = array();
			foreach ($array as $i) {
				$ret[] = $this->NNTP->get_summary($i['lo'], $i['hi']);
			}
		}
		else $ret = $this->NNTP->get_summary($start_id, $end_id);
		
		
        $this->Disconnect();
        $nzb =  CreateNZBNode($groupName, $ret, $array, $title);
        return $nzb;
    }

    
    function Connect2Group ()
    {      
        if (!$this->NNTP->connect())                                                
        {                                                
            echo "Unable to connect!";                                             
            return false;                                               
        }  
        
	if ( ! ( $gi=$this->NNTP->join_group(trim($this->GroupName)) ) )                    
	{
	    echo "Unable to join group [$this->GroupName]";  
	    $this->Disconnect();
	    return false;
	}   
        return $gi;
    }
    
    function Disconnect()
    {
        $this->NNTP->quit();
    } 


}



Page_Load();
