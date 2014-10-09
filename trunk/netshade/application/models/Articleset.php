<?php

class Application_Model_Articleset
{

    public $index;
    public $id;
    public $uuid;
    public $group;
    public $parent;
    public $type;
    public $from;
    public $date;
    public $subject;
    public $ref;
    public $items; 
    public $alsoin;
    public $count;
    public $cache = false;

    public $serverkey;
    public $userkey;
    public $username;
    public $groupname;
    public $bookmarked = false;

    function __construct($row=NULL, $start = -1, $drill = true)
    {
        if ($row)
        {
            $this -> uuid    = $row["uuid"];
            $this -> parent  = $row["parent_uuid"];
            $this -> group   = $row["group_uuid"];
            $this -> index   = $row["ArticleIndex"];
            $this -> id      = $row["message_key"];
            $this -> type    = $row["message_type"];
            $this -> date    = $row["message_date"];
            $this -> ref     = $row["message_ref"];
            $this -> from    = $row["sender_name"];
            $this -> subject = str_replace("&amp;", "&", $row["subject"]);
            $this -> subject = str_replace("&pos;", "'", $this -> subject);
            $this -> items   = array();
            $this -> alsoin  = "";
            $this -> count   = $row["children"];
            if ($drill && strlen($this -> parent) < 36)
            { 
                $this ->  GetInfo();
            }

            if ($this->type == "rar")
            {
         #       $this ->  CheckRar();
            }
        }
    }


    public static function ArticlesbySql ($query, $startat = -1)
    {   
        $count    = 0;
        $Db       = new Application_Model_ShadeDb;    
        $result   = $Db -> Execute ($query);
        $articles = array();
        $tally    = mysql_num_rows($result); 
        mysql_data_seek($result, $startat);
        while($row = mysql_fetch_assoc($result))  
        {  
            $articles[] = new Application_Model_Articleset($row);
            $count ++;
            if ($count >= 8) break;
        } 
        mysql_free_result ($result );
        return array ('articles' => $articles
                    , 'tally' => $tally );
    }


    public static function byId ($uuid, $start = -1, $table = "Ns_Articleset")
    {  
        $Db     = new Application_Model_ShadeDb (false, "Articleset:byId"); 
        $query  = "SELECT * FROM {$table} WHERE uuid = '{$uuid}'";
        $result = $Db -> Execute ($query);
        if ($row = mysql_fetch_assoc($result))  
        {   
            mysql_free_result ($result );
            return new Application_Model_Articleset ($row, $start);
        } 
    } 
 
    function Rangefrom ($start, $sizeof = 15)
    {

        $range   = array();
        $o       = $start;
        $countof = sizeof( $this -> items );
        $spanof  = floor ($sizeof / 2); 
        $last    = $countof - 1;

        if ($start > 0)
        {
            $range[] =  array('index'   => 0
                             ,'page'    => 1
                             ,'article' => $this -> items [0]
                             );
        } 

 

        if (($countof - $start) < 3)
        {
            $spanof = $sizeof - ($countof - $start );
        } 


        if ($start > $spanof)
        {
            $f = max (1, floor ($start / $spanof));
            $o = $f;
            while ($o < $start && sizeof($range) < $spanof)
            {  
                $range[] =  array('index'   => $o
                                 ,'page'    => floor ($o / PAGE_SIZE) + 1
                                 ,'article' => $this -> items [$o]
                             );
                $o += $f;
            }  
        }

        $spanof = $sizeof - sizeof($range) - 1;

        $o     = $start; 
        $span  = $countof - $o;
        $f     = max (1, floor ($span / $spanof));
        while ($o < $countof)
        {  
                $range[] =  array('index'   => $o
                                 ,'page'    => floor ($o / PAGE_SIZE) + 1
                                 ,'article' => $this -> items [$o]
                             );
                $o += $f;
        }  


        if ($range[sizeof($range)-1] -> index != $last) 
                $range[] =  array('index'   => $last
                                 ,'page'    => floor ($last / PAGE_SIZE) + 1
                                 ,'article' => $this -> items [$last]
                             );

        return $range;


    } 
 
    function Rangefromx ($start, $sizeof = 15)
    {
        $o = $start;
        $countof = sizeof( $this -> items );
        $spanof  = $countof - $o;
        $f = max (1, floor ($spanof / $sizeof));
        $range = array();
        while ($o < $countof)
        {  
            $range[] =  array('index'   => $o
                             ,'page'    => floor ($o / PAGE_SIZE) + 1
                             ,'article' => $this -> items [$o]
                             );
            $o += $f;
        } 
        $o = $countof - 1;
        $range[] =  array('index'   => $o
                         ,'page'    => floor ($o / PAGE_SIZE) + 1
                         ,'article' => $this -> items [$o]
                         );
        return $range;
    }

    function Render ($field = 'data')
    { 
        if ($this->type == "wmv") $type = "video/mov";
        else $type = "image/jpeg"; 

        $Db     = new Application_Model_ShadeDb (false, "Articleset:Render");   
        $query  = "SELECT {$field}, filename FROM Ns_Articledata WHERE uuid = '{$this->uuid}'";
        $result = $Db -> Execute ($query);  
             

        if($row = mysql_fetch_array($result))  
        {   
            $file = $row[1];
            mysql_free_result ($result );
            if ($field == 'data' && strlen($file) > 1 && file_exists($file))
            {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $type  = finfo_file($finfo, $file);
                $data  = file_get_contents ($file);
                header("Content-Type: {$type}");  
 

              #  header("Content-Type: video/x-ms-asf");   
              #  header('Content-Type: application/octet-stream');
              #  header("Content-Transfer-Encoding: Binary");
              #  header("Content-Disposition: attachment; filename=\"um.asf\""); 

            }
            else
            {
                $data = base64_decode ($row[0]);
                header("Content-Type: {$type}");  
$im = @imagecreatefromstring ($data);
if ($im)
{
    imagejpeg ($im, "", 100);
    imagedestroy ($im);
    return;

}
            }
 
 
            echo $data;  
        } 
        else 
        {
            echo "Row not found!";
        }
    } 

    function Getchildren ($Db)
    {  
        if ($this->type == "rar") return;
        $Db -> Source = "Getchildren";
        $result = $Db -> Execute ("SELECT children FROM Ns_Articleset WHERE uuid = '{$this->uuid}' and children is not null"); 
        if ($row = mysql_fetch_array($result))  
        {  
            $this -> count = $row[0];
            mysql_free_result ($result );
            return;
        } 
        $result = $Db -> Execute ("SELECT COUNT(1) as cnt FROM Ns_Articleset WHERE parent_uuid = '{$this->uuid}'"); 
        if($row = mysql_fetch_array($result))  
        {  
            $this -> count = $row[0];
            $this -> Setchildren ($Db);
            mysql_free_result ($result );
        } 
    } 

    function Setchildren ($Db)
    { 
        $Db -> Source = "Setchildren";
        $Db -> Execute ("UPDATE Ns_Articleset SET children = {$this->count} WHERE uuid = '{$this->uuid}'"); 
    } 

    function Setgroupdata ($Db)
    { 
        $Db -> Source = "Setgroupdata";
        $query  = "SELECT Address,Serverkey FROM Ns_Group WHERE uuid = '{$this->group}'";
        $result = $Db -> Execute ($query); 
        if ($row = mysql_fetch_assoc($result))  
        {  
            $this -> groupname = $row["Address"];
            $this -> serverkey = $row["Serverkey"]; 
            mysql_free_result ($result );
            return true;
        } 
        return false;
    } 

    function GetInfo ()
    { 
        $Db     = new Application_Model_ShadeDb (true, "Articleset:GetInfo");    

        if (! $this-> Setgroupdata ($Db))  
        {  
            $query  = "SELECT GroupKey FROM Ns_Search WHERE uuid = '{$this->group}'";
            $result = $Db -> Execute ($query); 
            if ($row = mysql_fetch_array($result))  
            {   
                $this -> group = $row[0];
                $this-> Setgroupdata ($Db);
            }  
            mysql_free_result ($result );
        }  
        $Db -> Source = "Articleset:GetInfo";
        
        $query  = "SELECT UserKey FROM Ns_Servers WHERE uuid = '{$this->serverkey}'";
        $result = $Db -> Execute ($query); 
        while($row = mysql_fetch_assoc($result))  
        {  
            $this -> userkey = $row["UserKey"];
        } 
        mysql_free_result ($result );
        $query  = "SELECT Username FROM Ns_Users WHERE uuid = '{$this->userkey}'";
        $result = $Db -> Execute ($query); 
        while($row = mysql_fetch_assoc($result))  
        {  
            $this -> username = $row["Username"];
        } 
        mysql_free_result ($result );
        $this->GetCache ($Db);
        $query  = "SELECT * FROM Ns_Bookmark WHERE UserKey = '{$this->userkey}' AND Articlekey = '{$this->uuid}'" ;
        $result = $Db -> Execute ($query); 
        while($row = mysql_fetch_assoc($result))  
        {  
            $this -> bookmarked = true;  
        }  
        mysql_free_result ($result );

        if (strlen($this -> type) < 3 && strlen($this -> parent) == 36)
        {
            $query  = "SELECT message_type FROM Ns_Articleset WHERE uuid = '{$this->parent}'" ;
            $result = $Db -> Execute ($query); 
            while($row = mysql_fetch_assoc($result))  
            {  
                $this -> type = $row["message_type"];
            }   
             mysql_free_result ($result );
        }

        if ( (!is_numeric($this -> count)) || $this -> count < 1)
            $this -> Getchildren ($Db);

        if ($this -> type == "rar")
            $this -> CheckRar ($Db);

        $Db -> Close();
    }

    function Exists ()
    { 
        $Db = new Application_Model_ShadeDb (false, "Articleset:Exists");  
         $this->GetCache ($Db);
        return $this -> cache;
    }

    function GetCache ($Db)
    { 
        $result = $Db -> Execute ("SELECT uuid FROM Ns_Articledata WHERE uuid = '{$this->uuid}'"); 
        while($row = mysql_fetch_assoc($result))  
        {  
            $this -> cache = true;
        } 
        mysql_free_result ($result );
    }

    function CheckRar ($Db)
    {  
        if (strlen($this -> parent) == 36 &&  $this -> count > 1) return;
        $result = $Db -> Execute ("SELECT COUNT(1) as cnt FROM Ns_Articlerar WHERE source_uuid = '{$this->uuid}'"); 
        if($row = mysql_fetch_array($result))  
        {  
            $this -> count = $row[0];
            $this -> Setchildren ($Db);
        } 
        mysql_free_result ($result );
    }

    function GetRars ($startat = -1)
    { 
        $count  = 0;
        $Db     = new Application_Model_ShadeDb;   
        $result = $Db -> Execute ("SELECT * FROM Ns_Articlerar WHERE source_uuid = '{$this->uuid}' ORDER BY filename"); 
        $this -> count = mysql_num_rows($result); 
        if ($startat > -1) mysql_data_seek($result, $startat);
        while($row = mysql_fetch_assoc($result))  
        {  
            $set = new Application_Model_Articlerar($row); 
            $this -> items[] = $set; 
            $count ++;
            if ($startat > -1 && $count >= PAGE_SIZE) break;
        }  
        mysql_free_result ($result );
    }

    function Randomof ()
    { 
        $Db     = new Application_Model_ShadeDb;   
        $result = $Db -> Execute (" SELECT na.uuid FROM Ns_Articleset As na INNER JOIN Ns_Articledata nd ON ".
                                  " na.uuid = nd.uuid ".
                                  " WHERE na.parent_uuid = '{$this->uuid}' OR na.uuid = '{$this->uuid}' ".
                                  " ORDER BY na.subject"); 
 
        $ret   = array ();
        $ret2  = array ();

        while($row = mysql_fetch_array($result)) { 
              $ret2[] = $row[0]; 
        }
        mysql_free_result ($result );
 
        shuffle($ret2);
        foreach ($ret2 as $x) {
             $ret[] = $x;
            if (sizeof ($ret) > 2) break;
        }
        return implode (",", $ret);
    }

    function GetArticles ($startat = -1, $sort = NULL)
    { 
        $count  = 0;
        $Db     = new Application_Model_ShadeDb;   
        $result = $Db -> Execute ("SELECT * FROM Ns_Articleset WHERE parent_uuid = '{$this->uuid}' OR uuid = '{$this->uuid}' ORDER BY subject"); 

        $this -> count = mysql_num_rows($result); 
        if ($startat > -1 && !$sort) mysql_data_seek($result, $startat);

         $tmp = array(); 

        while($row = mysql_fetch_assoc($result))  
        {  
            $set = new Application_Model_Articleset($row, -1, false);
            if ($startat > -1 || $this->type == "rar") $set -> GetCache ($Db);
            if ($this->type == "rar") $set -> CheckRar ($Db);
 
            $tmp[] = $set; 
            $count = sizeof($tmp);// ++;
            if ($startat > -1 && $count >= PAGE_SIZE && !$sort) break;
        } 
        mysql_free_result ($result );

        if ($sort) {
            usort($tmp, 'cmp');
            $tmp = $startat > -1 ? array_slice ($tmp, $startat, PAGE_SIZE) : $tmp;
        }

        $this -> items = $tmp;
    }

}

 
