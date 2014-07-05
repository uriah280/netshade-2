<? 


require("queue.progress.php");   

# define ("HOME_PATH", "/home/milton/netshade-2/");
define ('DATA_PATH', HOME_PATH . 'temp/data');
define ('QUEUE_PATH', HOME_PATH . 'shadow.net/client'); 
 
require("../webnews/nntp.php");   


function Page_Load ()
{  
    $queueData  = OpenMessage ();
    $userKey    = "{$queueData->userkey}"; 
    $messageKey = "{$queueData->id}";  

    $p   = new Credential($userKey);    
    $server = new News_Server ($p);
 
        echo $server->GetGroups($messageKey);
        echo "\n\n";
    
    $server -> Db -> Close();

    SetProgress($messageKey, 1, 1, 'COMPLETE', ""); 
}

 Page_Load ();

class News_Server
{


    function __construct($Credential)
    {

        $Server     = $Credential -> Server;  
        $Username   = $Credential -> Username;  
        $Password   = $Credential -> Password;  
        $this -> Credential = $Credential;   
        $this -> Db = new Usenet_Connector ();
        $this -> NNTP = new NNTP($Server, trim($Username), trim($Password));   
        $this -> mark = time();

        $this -> CreateTempTable();
    }

    function CreateTempTable()
    {
        $sql = "CREATE TABLE IF NOT EXISTS Ns_Temp_Group ( " . 
               "  I VARCHAR (36) NOT NULL " . 
               ", N VARCHAR (255) NOT NULL  " . 
               ", a BIGINT (11) NULL  " . 
               ", b BIGINT (11) NULL " . 
               ", c BIGINT (11) NULL" . 
               ", PRIMARY KEY (I)" . 
               " );";
        $this -> Db -> Execute ($sql);
        if ($this -> Db -> Error) var_dump ($this -> Db -> Error);
    }

    function GetGroups($messageKey)
    {
 
       # $this -> Db -> Execute ("DELETE from Ns_Group WHERE ServerKey = '{$this->Credential->Key}'"); 

        if (!$this->NNTP->connect())                                                  
        {                                                                                                 
            header("Content-Error: " . $this->NNTP->get_error_message());                                                 
            echo $nntp_server."!<b>".$messages_ini["error"]["nntp_fail"]."</b><br>";                                                  
            echo "Error: " . $this->NNTP->get_error_message()."<br>";                                                  
        }                                                  
        else                                                 
        {                                                                
            $buf       = $this->NNTP->send_request("list active");                                                  
            $response  = $this->NNTP->parse_response($buf);                                                   
            $buf       = fgets($this->NNTP->nntp, 4096);                                                  
            $ret       = array();                                                  

            var_dump ($response);                                              

            while (strlen($buf) > 0)                                                  
            {                                                   
                if (trim($buf)==".")                                                 
                {                                                  
                    break;                                                 
                }                                                 
                $arr  = explode (" ", $buf);   
            
		if (preg_match('/alt\.binaries(.*)/',$arr[0]))                                             
		{ 	 
                    $numBegin  = $arr[1];
                    $numEnd    = $arr[2];
		    $groupname = htmlentities( str_replace("'","&apos;",$arr[0]) );     
                    $uuid  = gen_uuid(); 
                    $MinID = min($numBegin, $numEnd);
                    $MaxID = max($numBegin, $numEnd);
                    $Size  = $MaxID - $MinID;  
                    $this -> Db -> AddBatch ("$uuid\t{$groupname}\t{$MinID}\t{$MaxID}\t{$Size}"); 
		}                                               
                $buf  = fgets($this->NNTP->nntp, 4096);    
            }                                                  
        }                                 
        $this->NNTP->quit();  
       
        $this -> Db -> Send ("Ns_Temp_Group"); 

        $this -> Db -> Batch = array ();



        $key = $this -> Credential -> Key;
        $new = "select I,N,a,b,c from Ns_Temp_Group WHERE N NOT IN (SELECT Address from Ns_Group WHERE ServerKey = '{$this->Credential->Key}')";
        $old = "DELETE from Ns_Group WHERE ServerKey = '{$this->Credential->Key}' AND Address NOT IN (SELECT N from Ns_Temp_Group)";

        $result = $this -> Db -> Execute ($new);
        while ($row = mysql_fetch_assoc($result))  
        {    
            $uuid = $row['I']; 
            $N = $row['N']; 
            $a = $row['a']; 
            $b = $row['b']; 
            $c = $row['c'];   
            $this -> Db -> AddBatch ("{$uuid}\t{$key}\t{$N}\t{$a}\t{$b}\t{$c}"); 
        }

        $this -> Db -> Send ("Ns_Group"); 
        $this -> Db -> Execute ($old); 
        $this -> Db -> Execute ("DROP TABLE Ns_Temp_Group"); 


        if ($this -> Db -> Error) var_dump ($this -> Db -> Error);
        echo "Done!";
    }     
} 
