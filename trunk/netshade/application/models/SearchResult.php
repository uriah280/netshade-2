<?php
# 
class Application_Model_SearchResult
{

    public $uuid;
    public $GroupKey;
    public $GroupName;
    public $Parameter;
    public $Tally;
    public $Articles;

    function __construct($row=NULL)
    {
        $this -> Articles = array();
        if ($row)
        {
            $this -> uuid         = $row["uuid"]; 
            $this -> GroupKey     = $row["GroupKey"]; 
            $this -> Parameter    = $row["Parameter"]; 
        }

        $this->Db  = new Application_Model_ShadeDb;   
        $result    = $this->Db -> Execute ("SELECT Address FROM Ns_Group WHERE uuid = '{$this->GroupKey}'"); 

        if ($this->Db -> Error) var_dump ($this->Db -> Error);
        else if($row = mysql_fetch_array($result))  
        {  
            $this -> GroupName = $row[0];
            $this -> Refs = Application_Model_Newsgroup::Refsof($this->uuid, $this->GroupName); 
        }   
    }

    function GetArticles ($startat = 0, $limit = "" )
    { 
        $and    = strlen($limit) == 0 ? "" : "children > {$limit} AND";
        $query  = "SELECT * FROM Ns_Articleset WHERE {$and} group_uuid = '{$this->uuid}' AND CHAR_LENGTH(parent_uuid) < 36 AND CHAR_LENGTH(message_key) > 5"; 
        $data = Application_Model_Articleset::ArticlesbySql($query, $startat);
        $this -> Articles = $data['articles'];
        $this -> Tally = $data['tally'];
        return;

        $count  = 0;
        #$Db     = new Application_Model_ShadeDb;    

  

        $result = $this->Db -> Execute ($query);
        $this -> Articles = array();
        $this -> Tally = mysql_num_rows($result); 
        mysql_data_seek($result, $startat);
        while($row = mysql_fetch_assoc($result))  
        {  
            $this -> Articles[] = new Application_Model_Articleset($row);
            $count ++;
            if ($count >= 8) break;
        } 
    }


    public static function Paramsof ($group)
    {  
        $ret = array();
        $Db     = new Application_Model_ShadeDb; 
        $query  = "SELECT Parameter FROM Ns_Search WHERE GroupKey = '{$group}'";
        $result = $Db -> Execute ($query);
        while ($row = mysql_fetch_array($result))  
        {  
            $ret[] = $row[0];
        } 
        return $ret;
    }


    public static function byParam ($group, $param)
    {  
        $Db     = new Application_Model_ShadeDb; 
        $query  = "SELECT * FROM Ns_Search WHERE Parameter = '{$param}' AND GroupKey = '{$group}'";
        $result = $Db -> Execute ($query);
        if ($row = mysql_fetch_assoc($result))  
        {  
            return new Application_Model_SearchResult ($row);
        } 
    } 


}

