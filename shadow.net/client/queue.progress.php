<?

require ("usenet.db.php");


define ("HOME_PATH", "/home/sa/webroot/");
define ('QUEUE_DATA', HOME_PATH . "temp/queue");
define ('ARTICLE_MAX', 15000);


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

function SetProgress($id, $max, $value, $state, $caption="", $extra=NULL) 
{
    $queuePath = QUEUE_DATA . "/{$id}.queue";
    $breakPath = QUEUE_DATA . "/{$id}.break";
    if (file_exists($breakPath)) {
        unlink ($breakPath);
        return true;
    }
    $data = array('id'      => $id,
                   'max'     => $max,
                   'value'   => $value,
                   'state'   => $state,
                   'caption' => $caption);
    $Request   = array();
    $Request[] = "<Request>";
    while (list($name, $val) = each ($data)) {
        $Request[] = "<{$name}><![CDATA[{$val}]]></{$name}>";
    }
    if (is_array($extra)) {
        while (list($name, $val) = each ($extra)) {
            $Request[] = "<{$name}><![CDATA[{$val}]]></{$name}>";
        }
    }
    $Request[] = "</Request>";
    $Request = implode ("\n", $Request); 

      echo "-- {$caption}: {$value} of {$max}\n";

   # file_put_contents($queuePath, $Request);
   db_put_contents($id, $Request);

    return NULL;
}


function db_put_contents ($uuid, $request)
{    
    $Db  = new Usenet_Connector ();
    $b64 = base64_encode ($request);
    #$Db->Execute ("INSERT INTO Ns_Queue (uuid, message) VALUES ('{$uuid}', '{$b64}');");
    $Db->Execute ("DELETE FROM Ns_Queue WHERE uuid = '{$uuid}'");
    $Db->Execute ("INSERT INTO Ns_Queue (uuid, message) VALUES ('{$uuid}', '{$b64}')");
}


function OpenMessage ()
{    
    global $argv;
    $messageKey = $argv[1];  
    set_time_limit(0);

    $messageDoc = QUEUE_DATA . "/{$messageKey}.pend";
    if (!file_exists($messageDoc)) {
      echo "ERROR: {$messageDoc} was not found";
     return NULL;
    }
      echo "\n{$messageDoc}\n";
    $message = file_get_contents ($messageDoc);
    unlink ($messageDoc);
      echo $message;
      echo "\n\n"; 
    return simplexml_load_string($message);  
}

class Credential
{
    public $Key;
    public $Server; 
    public $Username; 
    public $Password; 
    public $UserKey;  
    function __construct($Key)
    { 
        $this->Key = $Key;
        $query = "SELECT * FROM Ns_Servers WHERE uuid = '{$Key}'"; 
        $Connector = new Usenet_Connector ();
        $result = $Connector -> Execute ($query);

        while($row = mysql_fetch_assoc($result))  
        {  
            $this->Server = $row["Address"];
            $this->Username = $row["Username"];
            $this->Password = $row["Password"]; 
            $this->UserKey = $row["UserKey"]; 
        }
 
    }
}


