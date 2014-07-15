<?php

class Application_Model_Newsgroup
{

    public $Key;  
    public $Server;   
    public $Name; 
    public $LowID;
    public $HighID; 
    public $MinID;
    public $MaxID; 
    public $Count; 
    public $Tally; 
    public $Refs; 
    public $Articles; 
    public $Metrics; 
    public $startat; 


    function __construct($row=NULL, $ref=NULL)
    {
        $this->Metrics = array();
        $this->startat = time();
        $this->Metrics['start'] = time() - $this->startat;
 
        if ($row) { 
            $this->Key    = $row["uuid"]; 
            $this->Server = $row["Serverkey"]; 
            $this->Name   = $row["Address"]; 
            $this->MinID  = $row["Startat"];  
            $this->MaxID  = $row["Endat"]; 
            $this->Count  = $row["Countof"];  
            if ($ref) $this->GetRefs();
            $this->Metrics['refs'] = time() - $this->startat;
        }
        $this->Db = new Application_Model_ShadeDb; 
    } 

    function GetRange () 
    { 
        $query = "select MIN(message_id) as lo, MAX(message_id) as hi from Ns_Articleset WHERE group_uuid = '{$this->Key}' AND message_id > 0;"; 
        $result = $this->Db -> Execute ($query);
        if ($row = mysql_fetch_assoc($result))  
        {  
            $this->LowID = $row['lo'];
            $this->HighID = $row['hi'];
        } 
    }
 
    public static function byName ($user, $name)
    {  
        $Db     = new Application_Model_ShadeDb; 
        $query  = "SELECT g.* FROM Ns_Group as g INNER JOIN Ns_Servers as s ON " . 
                  " g.Serverkey = s.uuid INNER JOIN Ns_Users As u ON " . 
                  " s.UserKey = u.uuid" . 
                  " WHERE u.Username = '{$user}' AND g.Address = '{$name}'";
        $result = $Db -> Execute ($query);
        if ($row = mysql_fetch_assoc($result))  
        {  
            return new Application_Model_Newsgroup ($row, true);
        } 
    } 

    public static function Refsof ($uuid, $name)
    {  
        $query = " select na.message_ref " . 
                 " from Ns_Articleset na " .  
                 " where char_length (message_ref) > 0 " .  
                 "   AND na.group_uuid = '{$uuid}' " . 
                 " group by message_ref " . 
                 " order by message_ref;";
        $Refs = array();
        $Db     = new Application_Model_ShadeDb;  
        $result = $Db -> Execute ($query);
         
        while($row = mysql_fetch_array($result))  
        {  
            $str = explode ("|", str_replace ("Xref|", "", $row[0]));
            foreach ($str as $s)
            {
                if ($s != $name)
                    $Refs[$s] = $s; 
            }
        } 
        return $Refs;
    } 

    public static function byId ($uuid)
    {  
        $Db     = new Application_Model_ShadeDb; 
        $query  = "SELECT * FROM Ns_Group WHERE uuid = '{$uuid}'";
        $result = $Db -> Execute ($query);
        if ($row = mysql_fetch_assoc($result))  
        {  
            return new Application_Model_Newsgroup ($row);
        } 
    } 

    function GetPictures ()
    {
        $query = " select na.* FROM Ns_Articleset na INNER JOIN Ns_Articledata nd ON " .  
                 " na.uuid = nd.uuid" .  
                 " where na.children > 25 AND na.group_uuid = '{$this->Key}' AND CHAR_LENGTH (na.parent_uuid) < 36" . 
                 " ;"; # LIMIT 150

        $articles = array();
        $result   = $this-> Db -> Execute ($query);
        $count    = mysql_num_rows($result); 
        if ($count > 50)
        {
            $skip = rand(0, $count - 50);
            mysql_data_seek($result, $skip);
        }

        while($row = mysql_fetch_assoc($result))  
        {  
            $articles[] = new Application_Model_Articleset($row); 
            if (sizeof($articles) >= 50) break;
        } 
        shuffle($articles);
        return array_slice ($articles, 0, 50);
    } 

    function GetRefs ()
    {
        $this -> Refs = Application_Model_Newsgroup::Refsof($this->Key, $this->Name); 
    }

    function GetArticles ($startat = 0, $filter = "", $limit = "", $table = "Ns_Articleset")
    {
            $this->Metrics['GetArticles-start'] = time() - $this->startat;
        $where  = strlen ($filter) > 0 ? " AND subject LIKE '%{$filter}%'" : "";
        $and    = strlen($limit) == 0 ? "" : "children > {$limit} AND";
        $query  = "SELECT * FROM {$table} WHERE {$and} group_uuid = '{$this->Key}' AND CHAR_LENGTH(parent_uuid) < 36 AND CHAR_LENGTH(message_key) > 5 {$where}"; 
        $data   = Application_Model_Articleset::ArticlesbySql($query, $startat);
        $this -> Articles = $data['articles'];
        $this -> Tally = $data['tally']; 
            $this->Metrics['GetArticles-end'] = time() - $this->startat;
    }

}

