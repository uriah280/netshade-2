<?php

class Application_Model_ShadeUser
{

    public $SubscribedGroups; 
    public $Groups; 
    public $Groupcount; 
    public $Username;
    public $Firstname;
    public $Lastname;
    public $Userkey;
    public $Serverkey;
    public $Bookmarks;
    public $Db;

    function __construct($Username)
    { 
        $this -> Username = $Username; 
        $this -> SubscribedGroups = array(); 
        $this -> Db = new Application_Model_ShadeDb(true, "ShadeUser"); 
        $this ->Open ();
        $this ->GetSubscribedGroups ();
        $this ->GetBookmarks ();
        $this -> Db -> Close();

    }

    function GetBookmarkList ($startat = -1)
    { 
        $result = $this -> Db -> Execute ("SELECT ns.UserKey, ns.Articlekey, na.group_uuid, na.uuid, na.subject FROM Ns_Bookmark As ns INNER JOIN Ns_Articleset As na ON ".
                                          " ns.ArticleKey = na.uuid WHERE ns.UserKey = '{$this->Userkey}' ");
 
        $array=array ();
        while ($row = mysql_fetch_assoc($result))  
        {   
             $art = Application_Model_Articleset::byId ($row['Articlekey']);
             $art->GetInfo();
            $key = $art->groupname;
            if (!$key) continue;

           # $key = $row ["group_uuid"];
            if (array_key_exists ( $key ,  $array ))
            {
                  $array [$key]['countof'] ++; 
            }
            else 
            {
                  $array [$key] = array('countof'    => 1
                                      , 'address' => $key 
                                      , 'UserKey'    => $row ['UserKey'] 
                                      , 'Articlekey' => $row ['uuid'] 
                                        ); 
            } 
        }

        $this -> count = sizeof($array); 

        $ret    = array(); 
        $i      = -1;
        $start  = $startat > -1 ? $startat : 0;
        $end    = $start + PAGE_SIZE;
        foreach ($array as $row)
        { 
             $i ++;
             if ($i < $start) continue; 
             if ($i >= $end) break; 
  
             $ret[] = $row; 
        }
 
return $ret;
        $query  = " SELECT COUNT(ng.Address) as countof, ng.Address, ns.* ".
                  " FROM Ns_Bookmark As ns INNER JOIN Ns_Articleset As na ON ".
                  " ns.ArticleKey = na.uuid LEFT JOIN Ns_Group as ng ON ".
                  " na.group_uuid = ng.uuid  ".
                  " WHERE ns.UserKey = '{$this->Userkey}' ".
                  " GROUP BY ng.Address ".
                  " ORDER BY ng.Address" ;
        $result = $this -> Db -> Execute ($query);
        $this -> count = mysql_num_rows($result); 
        if ($startat > -1) mysql_data_seek($result, $startat);
        while ($row = mysql_fetch_assoc($result))  
        { 
             $ret[] = $row;
             $count = sizeof($ret);
             if ($startat > -1 && $count >= PAGE_SIZE) break; 
        }
        return $ret;
    }

    function GetBookmarks ($group = "", $startat = -1)
    { 
        $this->Bookmarks = array(); 
        $where  =  " INNER JOIN Ns_Articleset As na ON ".
                   " bk.ArticleKey = na.uuid INNER JOIN Ns_Group as ng ON ".
                   " na.group_uuid = ng.uuid  ".
                   " WHERE ng.Address = '{$group}' AND bk.UserKey = '{$this->Userkey}' ";
        if (strlen($group) == 0) 
        {
            $where = "WHERE bk.UserKey = '{$this->Userkey}'";
        }
        $query  = "SELECT bk.ArticleKey FROM Ns_Bookmark As bk {$where}" ;
 
        $array  = array (); 
        $result = $this -> Db -> Execute ($query);
        while ($row = mysql_fetch_assoc($result))  $array[] = $row;


        $query2 = "SELECT bk.ArticleKey FROM Ns_Bookmark As bk INNER JOIN Ns_Articleset As na ON ".
                   " bk.ArticleKey = na.uuid INNER JOIN Ns_Search as ns ON ".
                   " na.group_uuid = ns.uuid INNER JOIN Ns_Group as ng ON ".
                   " ns.GroupKey = ng.uuid WHERE bk.UserKey = '{$this->Userkey}' AND ng.Address = '{$group}'";
        $result = $this -> Db -> Execute ($query2);
        while ($row = mysql_fetch_assoc($result))    $array[] = $row;


        $this -> count = sizeof ($array);# mysql_num_rows($result); 


        $i      = -1;
        $start  = $startat > -1 ? $startat : 0;
        $end    = $start + PAGE_SIZE;
        foreach ($array as $row)
        {  
             $i ++;
             if ($i < $start) continue; 
             if ($i >= $end) break; 
  
             $this->Bookmarks[] = Application_Model_Articleset::byId ($row["ArticleKey"]);
 
        }
  
        return;









        if ($startat > -1) mysql_data_seek($result, $startat);
        while ($row = mysql_fetch_assoc($result))  
        {
             $this->Bookmarks[] = Application_Model_Articleset::byId ($row["Articlekey"]);
             $count = sizeof($this -> Bookmarks);
             if ($startat > -1 && $count >= PAGE_SIZE) break;
        }

        $query2 = "SELECT bk.ArticleKey FROM Ns_Bookmark As bk INNER JOIN Ns_Articleset As na ON ".
                   " bk.ArticleKey = na.uuid INNER JOIN Ns_Search as ns ON ".
                   " na.group_uuid = ns.uuid INNER JOIN Ns_Group as ng ON ".
                   " ns.GroupKey = ng.uuid WHERE bk.UserKey = '{$this->Userkey}' AND ng.Address = '{$group}'";
        $result = $this -> Db -> Execute ($query2);
        while ($row = mysql_fetch_assoc($result))  
        {    
            var_dump ($row);
        }

    }

    function Subscribe ($id)
    { 
        if ($this->Subscribed($id))  
        {
             $this -> Db -> Execute ("DELETE FROM Ns_Subscription WHERE UserKey = '{$this->Userkey}' AND Groupkey = '{$id}'");
             return "Unsubscribed";
        }
        $this -> Db -> Execute ("INSERT INTO Ns_Subscription (UserKey,Groupkey) VALUES ('{$this->Userkey}', '{$id}')"); 
        return "Subscribed";
    }

    function Subscribed ($id)
    { 
        $query  = "SELECT * FROM Ns_Subscription WHERE UserKey = '{$this->Userkey}' AND Groupkey = '{$id}'" ; 
        $result = $this -> Db -> Execute ($query);
        if ($row = mysql_fetch_assoc($result))  
        { 
             return true;
        }
        return false;
    }

    function Bookmark ($id)
    { 
        $query  = "SELECT * FROM Ns_Bookmark WHERE UserKey = '{$this->Userkey}' AND Articlekey = '{$id}'" ;
        $result = $this -> Db -> Execute ($query);
        if ($row = mysql_fetch_assoc($result))  
        {
             $this -> Db -> Execute ("DELETE FROM Ns_Bookmark WHERE UserKey = '{$this->Userkey}' AND Articlekey = '{$id}'"); 
             return "Bookmark removed";
        }
        $this -> Db -> Execute ("INSERT INTO Ns_Bookmark (UserKey,Articlekey) VALUES ('{$this->Userkey}', '{$id}')"); 
        return "Bookmark added";
    }

    function Open ()
    { 
        $query = "SELECT * FROM Ns_Users WHERE Username = '{$this->Username}' " ;
        $result = $this -> Db -> Execute ($query);
        while($row = mysql_fetch_assoc($result))  
        {  
            $this -> Firstname = $row["Firstname"];
            $this -> Lastname  = $row["Lastname"];
            $this -> Userkey   = $row["uuid"];
            $this -> Firstname = $row["Firstname"];
        }
        $query = "SELECT s.uuid FROM Ns_Servers as s WHERE UserKey = '{$this->Userkey}' " ;
        $result = $this -> Db -> Execute ($query);
        while($row = mysql_fetch_assoc($result))  
        {  
            $this -> Serverkey = $row["uuid"];
        }
    }


    function GetServerGroups ($startat = 0, $filter = '', $size = PAGE_SIZE)
    {
        $where = strlen($filter) == 0 ? "" : " AND Address LIKE '%{$filter}%'";
        $query = "SELECT g.* " . 
                 "FROM Ns_Group As g  " . 
                 "WHERE g.Serverkey = '{$this->Serverkey}' {$where}" . 
                 "ORDER BY g.Countof DESC " ; 

        $count  = 0; 

        $result = $this -> Db -> Execute ($query);
        $this -> Groups = array();
        $this -> Groupcount = mysql_num_rows($result); 
        mysql_data_seek($result, $startat);
 

        while($row = mysql_fetch_assoc($result))  
        {  
            $this -> Groups[] = new Application_Model_Newsgroup($row);   
            $count ++;
            if ($count >= $size) break;
        }
 
    }

    function GetSubscribedGroups ()
    {
        $query = "SELECT g.* " . 
                 "FROM Ns_Group As g INNER JOIN Ns_Subscription as s ON " . 
                 "     g.uuid = s.Groupkey " . 
                 "WHERE s.Userkey = '{$this->Userkey}' " . 
                 "ORDER BY g.Address " ; 

        $result = $this -> Db -> Execute ($query); 

        while($row = mysql_fetch_assoc($result))  
        {  
            $this -> SubscribedGroups[] = new Application_Model_Newsgroup($row);   
        }
    }
}

