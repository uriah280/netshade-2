<?php

class Application_Model_QMessage
{
    public static function Send ($data)
    {
        $uuid       = gen_uuid();
        $QMessage   = array();
        $QMessage[] = "<QMessage>";
        while (list($name, $val) = each ($data)) 
        {
            $QMessage[] = "  <{$name}><![CDATA[{$val}]]></{$name}>";
        } 
        $QMessage[] = "<id>{$uuid}</id>";
        $QMessage[] = "</QMessage>";
        $QMessage = implode ("\n", $QMessage); 


        file_put_contents (QUEUE_SEND . "/{$uuid}.queue", $QMessage);
        return $uuid;
    } 

    public static function Receive ($uuid)
    {  /**/
        $Db      = new Application_Model_ShadeDb; 
        $query   = "SELECT id, message FROM Ns_Queue WHERE uuid = '{$uuid}' ORDER BY id LIMIT 1;"; 
        $result  = $Db -> Execute ($query);
        $message = "";
        if ($row = mysql_fetch_assoc($result))  
        {  
            $id = $row["id"];
            $message = base64_decode ($row['message']); 
        } 
        if (strlen($message) > 0)  
        {   
            $Db -> Execute ("DELETE FROM Ns_Queue WHERE id = '{$id}';");
            return $message;
        } 

        $uri = QUEUE_RECEIVE . "/{$uuid}.queue";
        $message = "<Request><state>PENDING</state></Request>";
        if (file_exists ($uri)) 
        {
            $message = file_get_contents ($uri);
            unlink ($uri);
        } 
        return $message;   
    } 
}

