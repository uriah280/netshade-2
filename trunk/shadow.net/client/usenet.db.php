<?
 

class Usenet_Connector
{
    var $Server   = "localhost";
    var $Username = "root";
    var $Password = "sa";
    var $Database = "Netshade";
    var $Source   = "Client";
    var $Error    = NULL;
    var $Id       = NULL;
    var $Start    = NULL;
    var $State    = NULL;
    var $Alive    = NULL;
    var $Batch    = array();
 
    function __construct($alive = NULL, $source = 'Client')
    { 
        $this -> Batch  = array();
        $this -> Start  = time();
        $this -> Source = $source;
        $this -> Alive  = $alive;
        $this -> Id     = base64_encode( rand(0, 100000) );
        $this -> Open();
    }

    function Log ($line)
    {
        $delta = time() - $this->Start;
        $data  = "{$this -> Source}/{$this -> Id}/{$delta}: {$line}\n"; 

       // file_put_contents ( "/var/www/netshade/ShadeDb.log" , $data , FILE_APPEND );
    }


    function Send ($Table, $Erasefirst = false)
    {
         $size  = sizeof ($this -> Batch);
         $path  = realpath (".") . "/sql.CSV";
         $bat   = realpath (".") . "/sql.TXT"; 
         $query = "LOAD DATA LOCAL INFILE '{$path}' INTO TABLE {$Table}"; 
         $cmd   = "mysql --user={$this->Username} --password={$this->Password} {$this->Database} < {$bat}";  
         file_put_contents($path, implode ("\n", $this -> Batch));
         file_put_contents($bat, $query);
         if ($Erasefirst) 
            $this -> Execute ("DELETE FROM {$Table}");
         passthru ($cmd);

         echo "\n ------------ {$size} items added ------------ \n";
         
       #  unlink ($path);
         unlink ($bat);
    }

    function AddBatch ($Query)
    {
        $this -> Batch [] = $Query;
    }

    function ExecuteIf ($Exists, $Query, $Field = 'uuid')
    { //do 

         if (!$this->State) $this->Open ();


        $mykey = gen_uuid();
        $result = $this -> Execute ($Exists);
        if($row = mysql_fetch_assoc($result))  
        {  
            $mykey = $row[$Field];  
# echo " --{$mykey}\n";
        }
        else 
        {
            $this -> Execute ($Query);
# echo " {$Query}\n";
        }
        return $mykey;
    }

    function Open ()
    {
        $this->Log ("Opening database {$this->Database}...");
        MYSQL_CONNECT($this->Server, $this->Username, $this->Password) or die ( "Server '{$this->Server}' unreachable" );
        MYSQL_SELECT_DB($this->Database) or die ( "Database '{$this->Database}' unreachable" ); 
        $this->State = true;
        $this->Log ("Database {$this->Database} open!"); 
    }

    function Execute ($Query)
    {
        $this->Error = NULL;

         if (!$this->State) $this->Open ();

        if (!mysql_ping ()) { 
            $this->Close ();
            $this->Open ();
        }



        # MYSQL_CONNECT($this->Server, $this->Username, $this->Password) or die ( "Server '{$this->Server}' unreachable" );
        # MYSQL_SELECT_DB($this->Database) or die ( "Database '{$this->Database}' unreachable" ); 
        $result = @MYSQL_QUERY(stripslashes($Query));

        if (!$this -> Alive) $this -> Close();

        if ($result) 
        {
            $this->Log ("Query complete!");
            return $result;
        }

        $this->Error = array('number'=>mysql_errno(), 'message'=>mysql_error()); 
    }

    function Close ()
    {
        MYSQL_CLOSE();
        $this->State = false;
        $this->Log ("Database {$this->Database} closed!");
    }
}


