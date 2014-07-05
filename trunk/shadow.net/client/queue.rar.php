<? 
define ('DATA_PATH', '/var/www/temp/data');
define ('QUEUE_PATH', '/var/www/shadow.net/client'); 

require("queue.progress.php");   
require("../webnews/nntp.php");   


function Page_Load ()
{  
    $queueData  = OpenMessage ();
    $userKey    = "{$queueData->userkey}"; 
    $articleKey = "{$queueData->article}"; 
    $messageKey = "{$queueData->id}"; 
    $groupName  = "{$queueData->groupname}";  

    $p   = new Credential($userKey);    
    $server = new Application_Model_NewsServer ($p);

        echo "$groupName, $articleKey, $messageKey\n\n"; 
        echo $server->GetRar($groupName, $articleKey, $messageKey);
        echo "\n\n";
    
    $server -> Db -> Close();

    SetProgress($messageKey, 1, 1, 'COMPLETE', ""); 
}

 
Page_Load();


 
class Application_Model_NewsServer
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
    public $subject = 1;
    public $value = 1;
    public $limit = 1;
    public $mark;
    public $type;

    function __construct($Credential, $filter='', $search='', $saveto='')
    {

        $Server     = $Credential -> Server; # $info['server'];
        $Username   = $Credential -> Username; # $info['username'];
        $Password   = $Credential -> Password; # $info['password']; 
        $this->Credential = $Credential;   
        $this -> Db = new Usenet_Connector ();
        $this->NNTP = new NNTP($Server, trim($Username), trim($Password));   
 
        $this->Filter = $filter;
        $this->Search = $search;
        $this->SaveTo = $saveto;
        $this->mark = time();
    }


    function GetPage($groupName, $pageNumber, $messageKey, $savedPages="") 
    {

        if (strlen($savedPages) > 0) {
 
            $DATA_URI = DATA_PATH . "/search/{$groupName}/{$savedPages}.xml"; 
        }
        else $DATA_URI = DATA_PATH . "/index/{$groupName}.xml";
        $articleList = simplexml_load_file($DATA_URI);
        $this->articlesets = array();

        $query = "//list/article";
        if ($this->Filter && strlen ($this->Filter) > 0) $query .= "[type='{$this->Filter}']";
        if ($this->Search && strlen ($this->Search) > 0) $query .= "[contains(subject, '{$this->Search}')]"; 

        $result = $articleList->xpath($query);  
        for($x=0;$x<sizeof($result);$x++)
        { 
            $this->articlesets[] = $result[$x];
        }
        echo "\n\n---{$pageNumber}---\n\n";
        $ms = time() - $this->mark;

        SetProgress($messageKey, 1, 0, 'IN PROGRESS', "{$ms} Beginning download...") ;
        $startIndex = ($pageNumber - 1) * 8;  
        $this->articlesets = array_slice ($this->articlesets, $startIndex, 8);
        $articleCount = sizeof($this->articlesets);

        $this->GroupName = $groupName;
        $this->KeepAlive = true;
        $this->Connect2Group();
        for($x=0;$x<$articleCount;$x++)
        { 
            if ($this->articlesets[$x]->type != 'picture') continue;
            $articleSet = $this->articlesets[$x];
            $articleKey = "{$articleSet->id}";
            $ms = time() - $this->mark;
            echo "{$x}. {$ms} Downloading {$articleSet->subject}...\n";
            SetProgress($messageKey, $articleCount, $x + 1, 'IN PROGRESS', "{$ms} Downloading {$articleSet->subject}...") ;
            echo $this->GetArticle($groupName, $articleKey, $messageKey) ;
            echo "\n\n"; 
        } 
        $this->Disconnect();
    }
 

    function GetRar($groupName, $articleKeys_, $messageKey) 
    {  

        $articleKeys = explode (",", $articleKeys_);
        $source_uuid =  $articleKeys[0];
        $ret = array ();

        if (strlen($groupName) > 0) {

            $this->GroupName = $groupName;
            $this->KeepAlive = true;
            $this->Connect2Group();

        }
        
        $this->limit = sizeof($articleKeys);
        $rar = NULL;
        $list = array();
        for($x=0;$x<sizeof($articleKeys);$x++)
        {  
            $subject = "article {$x}"; 
            $this->value = $x + 1; 
            $file = $this->GetArticle($groupName, $articleKeys[$x], $messageKey) ;
            $list[] = $file;
            if ($rar == NULL) $rar = $file;
            echo "\n\n"; 
        } 
        
        if (strlen($groupName) > 0) $this->Disconnect();

            $ms = time() - $this->mark;
        SetProgress($messageKey, $this->limit, $this->value, 'IN PROGRESS', "{$ms} Extracting {$file} ..."); 

        mkdir ($messageKey);
        $command = "unrar e \"{$file}\" {$messageKey}";
        passthru ($command);
 
            $ms = time() - $this->mark;
        SetProgress($messageKey, $this->limit, $this->value, 'IN PROGRESS', "{$ms} Saving {$file} ..."); 

        $this -> thumb = NULL;
        $this -> Recurse($messageKey, $source_uuid);

        if ($this -> thumb) {
            $this -> SaveDb ($this -> thumb ['data'], $source_uuid, $this -> thumb ['thumb']);
        }

        passthru ("rmdir {$messageKey}");
        foreach ($list as $file) passthru ("rm \"{$file}\"");

    }

    function Recurse($path, $source_uuid = "", $parent_uuid = "") 
    { 
        $dir   = scandir ($path);
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $size  = sizeof ($dir);
        for  ($i=0;$i<$size;$i++)
        {
            $file = $dir[$i];
            if ($i % 5 == 0)
            {
                $ms = time() - $this->mark;
                 SetProgress($path, $size - 2, $i, 'IN PROGRESS', "{$ms} Saving {$file} ..."); 
            }
            if ($file == '.' || $file == '..') continue;
            $filename = "{$path}/{$file}";
            $uuid     =  gen_uuid();
            if (is_dir ($filename)) 
            {
                $filetype = "folder";
                $sql = "INSERT INTO Ns_Articlerar (uuid, source_uuid, parent_uuid, filename, filetype) VALUES ".
                       " ('{$uuid}', '{$source_uuid}', '{$parent_uuid}', '{$file}', '{$filetype}')"; 
                $this -> Db -> Execute ($sql);
                $this->Recurse ($filename, $source_uuid, $uuid); 
                passthru ("rmdir \"{$filename}\"");
              #   rmdir ($filename);
            }
            else 
            {
                $filetype = finfo_file($finfo, $filename);
                $data     = file_get_contents ($filename) ;
                $thumb    = $this -> CreateThumb ($data, $uuid, strpos($filetype,'video') !== false);
                $b64      = base64_encode ( $data );
                $sql      = "INSERT INTO Ns_Articlerar (uuid, source_uuid, parent_uuid, filename, filetype, data, thumb) VALUES ".
                            " ('{$uuid}', '{$source_uuid}', '{$parent_uuid}', '{$file}', '{$filetype}', '{$b64}', '{$thumb}')"; 
                $this -> Db -> Execute ($sql); 
                if ($this -> Db -> Error) var_dump ($this -> Db -> Error);
                else {

                    passthru ("rm \"{$filename}\"");
                    if (! $this -> thumb ) $this -> thumb = array ('thumb'=>$thumb, 'data'=>$data); 

                }
               
            }
        }
    }

    function MakeDirectory($path) 
    { 
        mkdir ($path);
        passthru ("chmod -R 777 {$path}");
    } 

    function GetArticlefromId($articleKey) 
    { 
        $query = "SELECT subject, message_type, message_key FROM Ns_Articleset WHERE uuid = '{$articleKey}' ";
        $result = $this -> Db -> Execute ($query);
        if($row = mysql_fetch_assoc($result))  
        {  
            $this -> subject = $row['subject'];  
            $this -> type    = $row['message_type'];  
            return $row['message_key'];   
        }
    } 

    function ArticleExists($articleKey) 
    { 
        $query = "SELECT uuid FROM Ns_Articledata WHERE uuid = '{$articleKey}' and CHAR_LENGTH(data) > 0 ";
        $result = $this -> Db -> Execute ($query);
        if($row = mysql_fetch_assoc($result))  
        {  
            return $row['uuid'];   
        }
        return NULL;
    } 


    
    function ImageCreate($filename)
    {
        $im = @imagecreatefromjpeg ($filename);
        if (!$im) $im = @imagecreatefromgif ($filename);
        if (!$im) $im = @imagecreatefrompng ($filename);
        return $im;
    }

    function CreateThumb ($data, $_articleKey, $ismovie = NULL)
    {
        $path = "/var/www/temp/{$_articleKey}.png";
        if ($ismovie || $this -> type == "wmv" || $this -> type == "m4v" ) {
            file_put_contents("{$path}.tmp", $data);
            $im = $this->QuikPic("{$path}.tmp"); 
        } else $im = @imagecreatefromstring($data);

        if ($im)
        {
            $w1 = imagesx ($im); $h1 = imagesy ($im); $r = $w1/$h1; $h2 = 320; $w2 = floor ($r * $h2);
               $thumb = imagecreatetruecolor($w2, $h2);
               imagecopyresized($thumb, $im, 0, 0, 0, 0, $w2, $h2, $w1, $h1);
            imagepng($thumb, $path);
            $b64 = base64_encode (file_get_contents($path));
            imagedestroy($im);
            imagedestroy($thumb);
            unlink ($path); 
            return $b64;
        }
        return "";
    } 

    function SaveDb ($data, $_articleKey, $thumb = NULL)
    { 
          echo "Saving {$_articleKey}...\n";
          $thm  =  $thumb ? $thumb : $this->CreateThumb ($data, $_articleKey); 
          $b64  =  base64_encode ($data); 
          $this -> Db -> Execute ("DELETE FROM Ns_Articledata WHERE uuid = '{$_articleKey}'");  
          $this -> Db -> Execute ("INSERT INTO Ns_Articledata (uuid, data, thumb) VALUES ('{$_articleKey}', '{$b64}', '{$thm}')");    
          if ($this -> Db -> Error) var_dump ($this -> Db -> Error);
    }

    function QuikPic($filename)
    { 
        $command = "ffmpeg -ss 15 -t 1 -vframes 1 -i {$filename} -f mjpeg {$filename}.jpeg";
        passthru ($command);
        $im = $this->ImageCreate ("{$filename}.jpeg");
echo "\nCreated preview {$filename}.jpeg\n";
       # unlink ("{$filename}.jpeg");
        unlink ("{$filename}");
        return $im;
    }

    function QuikYenc ($body, $key)
    {
        preg_match("/^=ybegin.*name=([^\\r\\n]+)/im", $body[0], $header);   
        $filename = trim($header[1]);  
        $tmp = implode ("\n", $body);
        file_put_contents ("{$key}", $tmp);
        $command = "./ydec4 {$key}";
        passthru ($command);
        unlink ($key); 
        $data = "";

        $file = "ydec/{$filename}";
        if (!file_exists ($file)) {
            echo "\n {$file} was not found!! \n";
            return "ERROR";
        }
        return $file;
    }

    function GetArticle($groupName, $_articleKey, $messageKey) 
    { 
         $ms = time() - $this->mark;
        SetProgress($messageKey, $this->limit, $this->value, 'IN PROGRESS', "{$ms} Looking up {$_articleKey} data..."); 
        if ($this -> ArticleExists($_articleKey)) return "file exists..";
        $articleKey = $this -> GetArticlefromId($_articleKey);
       # SetProgress($messageKey, $this->limit, $this->value, 'IN PROGRESS', "Found {$articleKey}..."); 
        echo "\n ------------ [{$articleKey}] -----------\n";
        $this->GroupName  = $groupName;
 

        $base64Name       = base64_encode ($_articleKey);
        $assetFolder      = DATA_PATH . "/asset";
        $groupFolder      = "{$assetFolder}/{$this->GroupName}";
        $picturePath      = "{$groupFolder}/{$base64Name}";
        $pictureEncode    = ""; 
       # if (file_exists($picturePath)) return $picturePath; 
        if (!is_dir ($assetFolder)) $this->MakeDirectory ($assetFolder);
        if (!is_dir ($groupFolder)) $this->MakeDirectory ($groupFolder);


        echo "\n ------------ [Beginning download] -----------\n";

        $downloadedArticles = $this->DownloadArticles($articleKey, $this->GroupName, $messageKey);
        
         $ms = time() - $this->mark;
        SetProgress($messageKey, $this->limit, $this->value, 'IN PROGRESS', "{$ms} Decoding {$this->subject}..."); 

        $body  = array();        
        for ($x=0;$x < sizeof($downloadedArticles); $x++)
        { 
	    $body[] = trim($downloadedArticles[$x]['body']);
        }  

        if ($this->Yenc)
        {  
            $file = $this -> QuikYenc ($body, $_articleKey);
	    
            $success = file_exists ($file); 
 
             SetProgress($messageKey, $this->limit, $this->value, 'IN PROGRESS', "{$ms} Saving {$this->subject}..."); 

            return $file; 

        }


echo "\n ** ERROR: Not a YENC file\n";



        if ($this->Encoding) $pictureEncode = $this->Encoding; 
	if (strlen($pictureEncode) == 0) $pictureEncode = 'uuencode';		
		
        $messageContent = array ('header' => array('content-transfer-encoding' => $pictureEncode), 
                                  'body'   => implode("\n", $body));   

        $messageBody = $messageContent['body']; 
         file_put_contents("{$messageKey}.uue", $messageBody); 

        if (preg_match("/^begin\s+\d{3}\s+(.*)$/im", $messageBody, $header))
	{ 
             $filename = trim($header[1]);
             passthru ("uudecode {$messageKey}.uue");
             unlink ("{$messageKey}.uue");

             if (file_exists ($filename))
             {
	         return $filename;
              } 
             else 
              {
                  echo "\n\n ** ERROR: {$filename} was not decoded!!";
               }
            $messageBody = str_replace($header[0], "", $messageBody);   
            $messageContent['body'] = trim($messageBody);
	}   

        $data = decode_message_content($messageContent);
          $amt = strlen ($data);
          echo "{$amt} bytes {$pictureEncode} decoding..."; 
        SetProgress($messageKey, $this->limit, $this->value, 'IN PROGRESS', "{$ms} Saving {$amt} bytes in {$this->subject}..."); 
         file_put_contents($picturePath, $data); 

	     return $picturePath;


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

    function DownloadArticles ($id = '', $groupname = '', $messageKey = '')
    {       
        if (strlen($id) > 0) $this->Id = $id;
        $this->GroupName =  $groupname;
        $messages = array();
        $ids      = explode ('-', $this->Id);    
        if (!$this->KeepAlive) $this->Connect2Group();
       # if (sizeof($ids) > 12) return;
        $amount = sizeof($ids);
	for ($i=0;$i<$amount;$i++)
	{
            $key = $ids[$i];
            $z = $i + 1;
	    echo "Downloading article [$key]...\n";  
         $ms = time() - $this->mark;
            SetProgress($messageKey, $amount, $z, 'IN PROGRESS', "{$ms} Downloading article {$z} of {$amount} [{$this->subject}]..."); 
            $message = $this->NNTP->get_article($key);   
            if (gettype($message) == "string" )
            {
                $mb = strlen ($message);
                echo "Received {$mb} bytes\n"; 
            }
            else 
            {
                 echo "\n-----------------unreadable response -----------------\n\n"; 
            }
            $messages[] = $message;
	} 
        
        if (!$this->KeepAlive) $this->Disconnect();
        
        return $this->Assemble($messages, $messageKey);
    }


    function Assemble ($messages, $messageKey)
    {
           $amount = sizeof ($messages);
         $ms = time() - $this->mark;
            SetProgress($messageKey, $this->limit, $this->value, 'IN PROGRESS', "{$ms} Building {$amount}-part image {$this->subject}..."); 

        $content = array();        
		for ($i=0;$i<sizeof($messages);$i++)     
		{           
		    $MIME_Message = $messages[$i];
		    if (!$MIME_Message)
		    {
		        continue;
		    }
            $header = $MIME_Message->get_main_header();                                               
            $parts  = $MIME_Message->get_all_parts();                                                                
            $count  = 0;   
            $this->Yenc   = false;                                       
            foreach ($parts as $part)                                              
            {              
                $subject = isset($part["header"]["subject"]) ? $part["header"]["subject"] : "";    
                if (isset($part['header']['content-transfer-encoding']) && 
                    strlen($part['header']['content-transfer-encoding']) > 0)
                {
                    $this->Encoding = $part['header']['content-transfer-encoding'];  
                }                                              
                $body    = $part["body"];                                              
                if ( (strpos($body, "ybegin") !== false) || (strpos(strtolower($subject), "yenc") !== false) )                                             
                { // YENC decoding  
                    $arr = array ();                                             
                    $arr["header"]     = array ("content-type"=>"image/jpeg", "content-transfer-encoding" => "yenc");                                             
                    $arr["body"]       = $part["body"];   
                    $this->Yenc      = true;                            
                }                                               
                $attachment_id = $count;                                           
                $count++;                                              
            }                                               

                                                        
            if ($MIME_Message->get_total_part() > $attachment_id)                                              
            {                                             
                $header = $MIME_Message->get_part_header($attachment_id);                                             
                $body   = $MIME_Message->get_part_body($attachment_id);                                             
                if (strcmp($header["content-type"],"") == 0)                                              
                {                                             
                    header("Content-Type: text/html");                                             
                    echo $messages_ini["error"]["request_fail"];                                             
                }                                              
                else                                              
                {                          
                    $content[] = $MIME_Message->get_part($attachment_id);
                }                                             
            }                                              
            else                                              
            {                                             
                header("Content-Type: text/html");                                             
                echo $messages_ini["error"]["multipart_fail"];                                             
            }  
        }    
        return $content;
    }

 }
