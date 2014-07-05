<?php
define ('TYPE_IMAGE', '1');
define ('TYPE_MOVIE', '2');
define ('TYPE_RAR', '3');
define ('TYPE_AUDIO', '4');
define ('DATA_PATH', '/var/www/shadow.net/client');
define ('DEFAULT_KEY', 'a9d420f4-070c-4b7c-a933-6f8dacf4d5b3');

require("queue.progress.php");   
require("../webnews/nntp.php");   
 
function Page_Load ()
{ 
    $queueData  = OpenMessage ();
    $userKey    = "{$queueData->userkey}"; #DEFAULT_KEY;  
    $groupName  = "{$queueData->groupname}";  
    $groupStart = "{$queueData->start}"; 
    $groupCount = "{$queueData->count}"; 
    $messageKey = "{$queueData->id}"; 
    $groupRenew = "{$queueData->renew}"; 
    $groupParam = "{$queueData->param}"; 
    
    $bRenew     = strlen ($groupRenew) > 0;

    SetProgress($messageKey, 1, 0, "IN PROGRESS", "Opening {$groupName}..."); 

    $Credential = new Credential($userKey);  
    $newsserver = new News_Usenet_Server ($Credential);   
    if (strlen($groupParam) > 0)
    {

        $newsserver->SearchNewsGroup ($groupName, $groupParam, NULL, NULL, $messageKey);

    } else $database   = $newsserver->LoadNewsGroup($groupName, $groupStart, $groupCount, $messageKey, $bRenew);
     
    SetProgress($messageKey, 1, 1, 'COMPLETE', ""); 
}

 
function LoadSubstoDb()
{
    $key = "5b619c93-f109-4592-8bc7-269fc2b665c5";
    $f = "subdata.txt";
    $sub = file_get_contents ($f);
    parse_str ($sub);
        $Db = new Usenet_Connector ();
    for ($x=0;$x<sizeof($my);$x++)
    {
        $name = $my[$x];
        $query = "SELECT uuid FROM Ns_Group WHERE Address = '{$name}'";
        
        $result = $Db -> Execute ($query);
        if($row = mysql_fetch_assoc($result))  
        {  
            $uuid = $row['uuid'];   
            $line = "{$key}\t{$uuid}";
            $Db -> AddBatch ($line);
        } 
    }
    $Db -> Send("Ns_Subscription", true); 
} 

function LoadGroupstoDb()
{
    $key = DEFAULT_KEY;
    $f = "server-groups-list.ini";
    $groupList = simplexml_load_file($f);
    $node = $groupList->xpath('//group');
        $Db = new Usenet_Connector ();
    for ($x=0;$x<sizeof($node);$x++)
    {

            $uuid = gen_uuid();
            $element = $node[$x];
            $att=$element->attributes(); 
            $Name  = "{$att->name}"; 
            $MinID = $att['beginat'];
            $MaxID = $att['endat'];
            $Count = $att['count'];
       $line = "{$uuid}\t{$key}\t{$Name}\t{$MinID}\t{$MaxID}\t{$Count}";
        
                   $Db -> AddBatch ($line);
    }
    $Db -> Send("Ns_Group", true); 


} 
 # LoadSubstoDb();
Page_Load ();

class News_Usenet_Server
{
    public $List;
    public $NNTP; 
    public $Credential; 
    public $Groupkey; 
    public $messageKey; 
    public $Db; 
    function __construct($Credential)
    { 
        $Server     = $Credential -> Server; # $info['server'];
        $Username   = $Credential -> Username; # $info['username'];
        $Password   = $Credential -> Password; # $info['password']; 
        $this->Credential = $Credential;   
        $this -> Db = new Usenet_Connector ();
        $this->NNTP = new NNTP($Server, trim($Username), trim($Password));   
    }

    function Updategroup ($high, $low)
    {
        $query = "UPDATE Ns_Group SET Startat={$low}, Endat={$high} WHERE uuid = '{$this->Groupkey}'"; 
          echo "\n{$query}\n";
        $this -> Db -> Execute ($query);
    }

    function GroupkeyOf ($name)
    {
        $query = "SELECT uuid FROM Ns_Group WHERE Serverkey = '{$this->Credential->Key}' AND Address = '{$name}'"; 
        $result = $this -> Db -> Execute ($query);
        $Groupkey = gen_uuid();
        if($row = mysql_fetch_assoc($result))  
        {  
            $Groupkey = $row["uuid"]; 
        }
        else 
        {
            $query = "INSERT INTO Ns_Group (uuid, Serverkey, Address) VALUES ('$Groupkey', '{$this->Credential->Key}', '{$name}')"; 
            $this -> Db -> Execute ($query);
        }
        return $Groupkey;
    }

    function MessagesClear ()
    { 
        $query = "DELETE FROM Ns_Articledata WHERE uuid IN ( SELECT uuid FROM Ns_Articleset WHERE group_uuid = '{$this->Groupkey}' )" ;
        $result = $this -> Db -> Execute ($query);
         if ($this -> Db -> Error) var_dump ($this -> Db -> Error);
        $query = "DELETE FROM Ns_Articleset WHERE group_uuid = '{$this->Groupkey}'" ;
        $result = $this -> Db -> Execute ($query);
         if ($this -> Db -> Error) var_dump ($this -> Db -> Error);
    }

    function MessagesExist ($groupStart)
    { 
        if (strlen($groupStart) > 0 || $groupStart > 0) return false;
        $query = "SELECT * FROM Ns_Articleset WHERE group_uuid = '{$this->Groupkey}' LIMIT 1 " ;
          echo "\n {$query} \n";
        $result = $this -> Db -> Execute ($query);
        if ($row = mysql_fetch_assoc($result))  
        {  
            return true;
        }
        return false;
    }

    function LoadNewsGroup ($groupName, $groupStart, $numOfArticles, $messageKey, $Renew=NULL)
    { 

        $this->Groupkey = $this -> GroupkeyOf($groupName);
        $this->messageKey = $messageKey;

        $this->List = array();
        $nntp = $this->NNTP;
        if (!$nntp->connect())                                                
        {                                                
            header("Content-Error: " . $nntp->get_error_message());                                               
            echo "<b>".$messages_ini["error"]["nntp_fail"]."</b><br>";                                                
            echo $nntp->get_error_message().$nntp_server."<br>";                                                
            return;                                               
        }  
        
        if ( $gi=$nntp->join_group(trim($groupName)) )                                               
        {                                      
            $minimum    = $gi['start_id'];                               
            $maximum    = $gi['end_id'];                                 
            $start_id   = min ($minimum, $maximum);                        
            $max_id     = max ($minimum, $maximum);    
            
            if ($Renew) { 
                echo "\n Removing all articles from [{$groupName}]  \n";
               $this -> MessagesClear ();
            }

            $this->Updategroup ($max_id, $start_id);


            if ($this -> MessagesExist ($groupStart)) {
                echo "\n [{$groupStart}] group data already present \n";
                $nntp->quit();  
                return;
            }
 
            if (strlen($groupStart) > 0) $max_id = $groupStart;
	    $end_id     = $max_id; //$start_id + $numOfArticles;  
	    $start_id   = $end_id - $numOfArticles;   
             
	    $end_id     = $start_id + $numOfArticles;  
            $nntp_query = "XOVER " . $start_id . "-" . $max_id;  
            $buf        = $nntp->send_request( $nntp_query );                                                   
            $response   = $nntp->parse_response($buf);         
            $cursor	= 0;
            $xml        = ''; 
		   
            echo $nntp_query . "\n=============================================\n{$this->Groupkey}\n";
            print_r($response);

            if ($response["status"] == ARTICLE_OVERVIEW || $response["status"] == ARTICLE_HEAD)                                                
            {                                                             
                $buf = fgets($nntp->nntp, 4096);                    
                while (!preg_match("/^\.\s*$/", $buf))                                                
                {     
	            $art = new News_Usenet_Article($buf, 0, $groupName);
	
	            if (array_key_exists($art->regEx, $this->List))
	            {
	                if (array_key_exists($art->partKey, $this->List[$art->regEx]))
	                {
	                    $this->List[$art->regEx][$art->partKey][] = $art;
	                }
	                else
	                {
	                    $this->List[$art->regEx][$art->partKey] = array($art);
	                }
	            }
	            else
	            {
	                $this->List[$art->regEx] = array($art->partKey => array($art));
	            }                 
	                
                    $cursor ++;
                    if ($cursor >= $numOfArticles)  break;
                    if ($cursor % 1000 == 0) {
                        SetProgress($messageKey, $numOfArticles, $cursor, 'IN PROGRESS', "Retrieving {$groupName} information...") ; 
                    }
                    $buf = fgets($nntp->nntp, 4096);     
                }              
            }
        }    
        else 
        {
            echo "\n\nERROR: Unable to join group {$groupName}\n";
            return "Could not join group {$groupName}";
        }
               
        $nntp->quit();    

 

        $this->List = array_reverse($this->List); 
        echo "\n\nCollating...\n";
        return $this->Collate ($groupName, $messageKey);
    } 

 

    function Typeof ($text)
    {	
                 $enum  = $this->GetType ($text);
                 $type  = $enum == TYPE_IMAGE ? 'picture' : 'unknown';
                 $type  = $enum == TYPE_MOVIE ? 'wmv' : $type;
                 $type  = $enum == TYPE_RAR   ? 'rar' : $type;
                 $type  = $enum == TYPE_AUDIO ? 'wav' : $type;
                 if (preg_match ('/\.(m4v|flv|mpeg|mpg|mov|wmv|avi|mkv|mp4)/i', $text, $ext))
                    $type  = $ext[1] == 'm4v' || $ext[1] == 'mp4'   ? 'm4v' : $type;	
        return $type;
    } 

 

    function Collate ($groupName, $messageKey = NULL, $search_uuid = NULL)
    {		
                     
        $parentKey = $search_uuid ? $search_uuid : $this->Groupkey;   
        SetProgress($this->messageKey, 1, 1, 'IN PROGRESS', "Collating...") ; 
        $step   = 500;
        
        $cnt    = 0;      
        $total  = 0;
        $cursor = 0;
        $num    = sizeof ($this->List);
        $sql    = array();
        
        
        while (list($name, $item) = each($this->List))
        { 
            $box  = array(); 
            $post = array(); 

 
            $cursor ++; 
            if ($cursor % 100 == 0) {
                SetProgress($messageKey, $num, $cursor, 'IN PROGRESS', "Collating {$groupName} information...") ; 
            }
                 
  
            while (list($key, $cluster) = each($item))
            { 
                $ext     = array();
                $rar     = NULL;
                $first   = $cluster[0]; 
                $picture = preg_match ('/\.(jpg|jpeg|png|gif|bmp)/i', $first->Subject);
                $audio   = preg_match ('/\.(mp3|wav)/i', $first->Subject, $ext);
                $video   = preg_match ('/\.(m4v|flv|mpeg|mpg|mov|wmv|avi|mkv)/i', $first->Subject, $ext);
                $picture = $picture && !preg_match ('/(par2|RE\:)/i', $first->Subject);
                $video   = $video && !preg_match ('/(par2|RE\:|\.\d{3})/i', $first->Subject) && !$picture;
                if (!$video)
                {
                    $rar     = preg_match ('/\.(rar|r\d{2})/i', $first->Subject, $ext);
                    $rar     = $rar && !preg_match ('/(par2|RE\:|\.\d{3})/i', $first->Subject);
                }
                $picture = $picture && !$video && !$rar;
              
                if ($picture || $video || $rar || $audio)
                {
                    $post[] = $cluster;
                } 
            } 
         
            if (sizeof($post) > 0)
            {
                 $id    = $this->GetArticlesetId($post[0]);     
                 $ref   = $post[0][0]->Ref;              
                 $text  = $post[0][0]->Subject;        
                 $from  = $post[0][0]->From;
                 $date  = $post[0][0]->articleDate; 
                 $subj  =  iconv("ISO-8859-1", "UTF-8", $text); 
                 $type  = $this -> Typeof ($text);
 
 
        $tmp   = explode ("-", $id);
        $first  = strlen($tmp[0]) > 1 ? $tmp[0] : $NULL;
        $id_str = strlen($id) > 255 ? substr($id, 0, 255) : $id;
        $ref    = implode('|', $ref);
        $name = $from['name'];
        $email = $from['email'];  
        $uuid = gen_uuid(); 
        $subj = str_replace ("'", "&pos;", $subj);
        $childcount = sizeof($post) - 1;
 
            $NULL = "\\n";

            
            $tmp = array ($uuid, $parentKey, $NULL, $cnt, $first, $id, $type, $ref, $date, $name, $email, $subj, $childcount);




                # $this -> Db -> Execute ($query);
                # $this -> Db -> ExecuteIf ($exist, $query);
                   $this -> Db -> AddBatch (implode ("\t", $tmp));

                     #  $sql[] = implode ("\t", $tmp); #$query;

                 for ($i=1;$i<sizeof($post);$i++)
                 {
                     $id     = $this->GetArticlesetId($post[$i]);   
                     $tmp    = explode ("-", $id);
                     $first  = strlen($tmp[0]) > 1 ? $tmp[0] : $NULL;    
                     $text   = $post[$i][0]->Subject;
                     $id_str = strlen($id) > 255 ? substr($id, 0, 255) : $id;
                     $mykey  = gen_uuid(); 
                     $subj   = iconv("ISO-8859-1", "UTF-8", $text); 
                     $subj   = str_replace ("'", "&pos;", $subj);
                     $kind   = $this -> Typeof ($subj);
                     $addas  = $kind == $type ? $NULL : $kind;

                     $tmp    = array ($mykey, $parentKey, $uuid, $NULL, $first, $id, $addas, $NULL, $NULL, $NULL, $NULL, $subj, 0);
                    

                         $this -> Db -> AddBatch (implode ("\t", $tmp)); 

      
                 }



      
                 $cnt ++;
             }   
        }  
 
                SetProgress($messageKey, 1, 1, 'IN PROGRESS', "Updating {$groupName} information...") ; 
         $this -> Db -> Send ("Ns_Articleset");
                SetProgress($messageKey, 1, 1, 'IN PROGRESS', " {$groupName} Update Complete. Please wait...") ; 
         if ($this -> Db -> Error) var_dump ($this -> Db -> Error);
       
    }    

    function GetArticlesetId ($cluster)
    {
        $ret = array();
        $srt = array();

        for ($i=0;$i<sizeof($cluster);$i++)
        { 
            if (sizeof($cluster) > 1 && preg_match('/\((\d+)\/(\d+)\)/', $cluster[$i]->Subject, $matches))
            {
                $num = $matches[1];
                $cnt = $matches[2]; 
                $ret[$num - 1] = $cluster[$i]->messageId; 
            }
            else
            { 
                $ret[] = $cluster[$i]->messageId;
            }
        }
        $value = array();
        for ($i=0;$i<sizeof($ret);$i++) 
        {
            if (isset($ret[$i]))
            {
                $value[] = $ret[$i];
            }
        } 
        return implode('-', $value);
    }            

    function FoundinGroup ($param)
    {
         $sql  = "SELECT COUNT(1) as C FROM Ns_Search WHERE GroupKey = '{$this->Groupkey}' AND Parameter  = '{$param}'; ";

         $ask = $this->Db->Execute ($sql); 
        if ($row = mysql_fetch_array($ask))  
        {   
             return $row[0] > 0;
        } 
    }            

    function GetType ($str)
    {
        $picture = preg_match ('/\.(jpg|jpeg|png|gif|bmp)/i', $str);
        $video   = preg_match ('/\.(m4v|flv|mpeg|mpg|mov|wmv|avi|mkv)/i', $str); 
        $audio   = preg_match ('/\.(mp3|wav)/i', $str);
        if (!$video)
        {
            if ($audio) return TYPE_AUDIO;
            $rar = preg_match ('/\.(rar|r\d{2})/i', $str); 
            if ($rar)
            {
                return TYPE_RAR;
            } 
        }
        return $video && !$picture ? TYPE_MOVIE : TYPE_IMAGE;
    }


    function SearchNewsGroup ($groupName, $param = NULL, $start = NULL, $end = NULL, $messageKey = NULL)
    {

        $this->Groupkey = $this -> GroupkeyOf($groupName);
        $this->messageKey = $messageKey;

	echo $param . ',' . $start . ',' . $end;
	$nntp = $this->NNTP;
 
        $file = DATA_PATH . "/{$messageKey}.dat"; 
	 
		
        if (!$nntp->connect())                                                
        {                                                
            header("Content-Error: " . $nntp->get_error_message());                                               
            echo "<b>".$messages_ini["error"]["nntp_fail"]."</b><br>";                                                
            echo $nntp->get_error_message().$nntp_server."<br>";                                                
            return;                                               
        }   
	$table = "Ns_".str_replace("-", "_", $messageKey);	
        $search_uuid = gen_uuid(); 


           if ($this->FoundinGroup ($param)) 
           {
               return;
           }

         $sql  = "INSERT INTO Ns_Search ( uuid , GroupKey , Parameter ) " .
                     " VALUES ('{$search_uuid}', '{$this->Groupkey}', '{$param}'); ";

         $this->Db->Execute ($sql);


        echo "Searching group {$groupName} for '$param'\n"; 
        if ( $gi=$nntp->join_group(trim($groupName)) )                                               
        {
            if ($param) $param = strtolower($param);                                     
            $minimum    = $gi['start_id'];                               
            $maximum    = $gi['end_id'];                                 
            $start_id   = $start ? $start : min ($minimum, $maximum);                        
            $max_id     = $end   ? $end   : max ($minimum, $maximum);  
            $size       = $max_id - $start_id;
	    $count      = 0;
	    $span       = floor ($size / 25);
            $nntp_query = "XOVER {$start_id}-{$max_id}";    
            $buf        = $nntp->send_request( $nntp_query );    

            SetProgress($messageKey, $size, $count, 'IN PROGRESS', "Connected to {$groupName}. Waiting for response...") ; 
                                               
            $response   = $nntp->parse_response($buf);   
            $alike      = 0;
            echo "Searching $size articles\n"; 
	    echo "$nntp_query\n"; 
	    echo "$buf\n"; 

               var_dump ($response);
            $this->List = array();
             $year = 86400 * 365 * 2;
             $time = time();
            if ($response["status"] == ARTICLE_OVERVIEW || $response["status"] == ARTICLE_HEAD)                                                
            {           
                $date = "";                              
                $buf = fgets($nntp->nntp, 4096);    
                while (!preg_match("/^\.\s*$/", $buf))                                                
                {
                    if ($param == NULL || strpos(strtolower($buf), $param)!==false)
		    {

	                $art = new News_Usenet_Article($buf, 0, $groupName);
	               # $date = strtotime( $art->articleDate );

                       # $since = $time - $date;
                       # if ($since > $year) continue;

	                if (array_key_exists($art->regEx, $this->List))
	                {
	                    if (array_key_exists($art->partKey, $this->List[$art->regEx]))
	                    {
	                        $this->List[$art->regEx][$art->partKey][] = $art;
	                    }
	                    else
	                    {
	                        $this->List[$art->regEx][$art->partKey] = array($art);
	                    }
	                }
	                else
	                {
	                    $this->List[$art->regEx] = array($art->partKey => array($art));
	                } 
                        
                      #  fputs($fp, $buf);  
                        $alike ++;
                    }   
                    $count ++;
                    if ($count % 25000 == 0)
                    {
                         
                        SetProgress ($messageKey, $size, $count, 'IN PROGRESS', 
                           "Found $alike articles like $param in $start_id thru $max_id...");
                    } 
                    $buf = fgets($nntp->nntp, 4096);     
                }   
                SetProgress ($messageKey, $size, $count, 'IN PROGRESS', "Retrieving $sz bytes $start_id $max_id...");
            }
        }          
        SetProgress($messageKey, $size, $size, 'COMPLETE', 
                        "Found $alike articles like $param in $start_id thru $max_id...");              
        $nntp->quit();     
	 

        return $this->Collate ($groupName, $messageKey, $search_uuid);

	return $file; 	
    }  
}




class News_Usenet_Article
{
    var $messageId;
    var $Subject;
    var $From;
    var $articleDate;
    var $articleBytes;
    var $articleLines;
    var $Ref;
    var $regEx;
    var $articleList;
    var $partList;
    var $Level;
    var $prefix;
    var $matchKey;
    var $partKey;
    var $groupName;
    function News_Usenet_Article($buf, $level=1, $group='')
    {
        $this->groupName    = $group;
        $this->articleList  = array();
        $this->partList     = array();
        
        $elements           = preg_split("/\t/", $buf);                                            
        $this->messageId    = $elements [0];                                       
        $this->Subject      = $elements [1];                                                 
        $this->From         = decode_sender($elements[2]);                                            
        $this->articleDate  = $elements [3];                                        
        $this->articleBytes = $elements [6];                                                
        $this->articleLines = $elements [7];                                               
        $this->regEx        = $this->_getRegEx();
        $this->partKey      = $this->_getPartKey();
        
        $arr = preg_split("/\s+/", trim($elements [8]));
        $this->Ref = array();
        for ($i=0;$i<sizeof($arr);$i++)
        {
            $sp = explode (':', $arr[$i]);
            if (sizeof($sp) > 1)
            {
                $this->Ref[] = $sp[0];
            }
        } 
    }
    
    function _getRegEx()
    { 
        $regex        = preg_replace('/["\-\/\+\[\]\(\)\*]/', '.', $this->Subject);
        $regex        = preg_replace('/(\d+)/', '\d+', $regex);
        $regex        = preg_replace('/(\s+)/', '\s+', $regex); 
        
        if (preg_match('/\.(jpg|png|gif|bmp|wmv|rar|r\d{2})/i', $regex, $arr))
        {
            $regex = substr($regex, 0, strpos($regex, $arr[1]));
        }
        return $regex;
    }
    
    function _getPartKey()
    {
        $reg = '/(.*)\((\d+)\/(\d+)\)/';
        $key = $this->Subject;  
        if (preg_match($reg, $key, $info))
        {
            $key = $info[1]; 
        }
        
        return $key;
    }    
    
    function _getPrefix($buf)
    {
        $name = $this->_getSubject($buf);
        $pos   = strpos($name, '[')!==false;
        if ($pos)
        {
            return substr($name, 0, $pos);
        }
        return '';
    }
    
    function _getSubject($buf)
    {
        $elements = preg_split("/\t/", $buf);                            
        return $elements [1];         
    }    
    
    function _Parse($subject)
    {             
        if (preg_match('/(.*)\((\d+)\/(\d+)\)/', $subject, $info))
        {
            return $info[1];
        } 
        return NULL;
    } 
    
    function Match ($buf)
    {   
        return preg_match ('/' . $this->regEx . '/', $this->_getSubject($buf), $array); 
    }
    
    function AddPart($article, $index)
    {
        $this->partList[$index - 1] = $article;
    }
    
    function Add($buf, $keymatch=0)
    {
        $reg = '/(.*)\((\d+)\/(\d+)\)/';
        $key = $this->_getSubject($buf); 
        $tmp = new News_Usenet_Article($buf);
        $idx = -1;
        $sz  = 1;
        
        if (preg_match($reg, $key, $info))
        {
            $key = $info[1];
            $idx = $info[2];
            $sz  = $info[3]; 
        } 
        if (array_key_exists($this->regEx, $this->articleList))
        {
            $article = $this->articleList[$this->regEx];
            if (array_key_exists($key, $article))
            {
                $this->articleList[$this->regEx][$key][] = $tmp;
            }
            else 
            {
                $this->articleList[$this->regEx][$key] = array($tmp);
            }
        }
        else
        {
            $this->articleList[$this->regEx] = array($key=>array($tmp));
        }                      
    }
    
    function _getKey()
    {
        $ret = array();
        $ret[] = $this->messageId;
        if (sizeof($this->articleList) > 0)
        { 
	        foreach ($this->articleList as $item)
	        {
	            if (is_array($item))
	            {
	                foreach ($item as $i) 
	                    foreach ($i as $x)
	                        $ret[] = $x->_getKey(); 
	            }
	            else $ret[] = $item->_getKey();
	        } 
        } 
        return implode('-', $ret);
    } 
}
