<?php

class Application_Model_Articlerar
{
    public $parent;
    public $source;
    public $uuid;
    public $filename;
    public $filetype;

    function __construct($row=NULL)
    {
        if ($row)
        {
            $this -> uuid      = $row["uuid"];
            $this -> parent    = $row["parent_uuid"];
            $this -> source    = $row["source_uuid"];
            $this -> filename  = $row["filename"]; 
            $this -> filetype  = $row["filetype"]; 
        }
    }


    public static function byId ($uuid)
    {  
        $Db     = new Application_Model_ShadeDb; 
        $query  = "SELECT * FROM Ns_Articlerar WHERE uuid = '{$uuid}'";
        $result = $Db -> Execute ($query);
        if ($row = mysql_fetch_assoc($result))  
        {  
            return new Application_Model_Articlerar ($row);
        } 
    } 


    function Render ($field = 'data')
    { 
        $Db     = new Application_Model_ShadeDb;   
        $result = $Db -> Execute ("SELECT {$field}, filetype FROM Ns_Articlerar WHERE uuid = '{$this->uuid}'"); 
        if($row = mysql_fetch_assoc($result))  
        {   
            $type =$row["filetype"];
            header("Content-Type: {$type}");  
            $data = base64_decode ($row[$field]);
             echo $data;  
        } 
    } 



}
 
