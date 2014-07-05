<?

define ("RESULT_PAGE_SIZE", 1000);  
//Public methods  
//========================================================================'  
/*   
get_newsgroups Function:  
Returns a list of newsgroups from the specifies server  
-------------------------------------------------------------------------'  
*/  

include("addon/events.php");     
include("webnews/nntp.php");    

page_load ();

function page_load ()
{
	$action=$_GET['action'];
	$server=$_GET['server'];
	$username=$_GET['username'];
	$password=$_GET['password'];
	if ($action=='get_newsgroups')
	{
		echo get_newsgroups ($server,$username,$password);
		exit;
	}
}

function count_newsgroups ($server,$username,$password) 
{  
	$safe=0;
 
        $nntp = new NNTP($server, trim($username), trim($password));      
 
        if (!$nntp->connect())   
        {   
 
            header("Content-Error: " . $nntp->get_error_message());  
            echo $nntp_server."!<b>".$messages_ini["error"]["nntp_fail"]."</b><br>";   
            echo "Error: " . $nntp->get_error_message()."<br>";   
        }   
        else  
        {   
       
            # lookup ---------------------------------------------------------'     
            $buf 		= $nntp->send_request("list active");   
            $response 	= $nntp->parse_response($buf);    
            $buf 		= fgets($nntp->nntp, 4096);   
            $safe 		= 0;   
        
            while (strlen($buf) > 0)   
            {    
                if (trim($buf)==".")  
                {   
                    break;  
                }  
                $arr  = explode (" ", $buf);  
				if (preg_match('/alt\.(.*)/',$arr[0]))
				{
                    $safe ++;   
				}
                $buf  = fgets($nntp->nntp, 4096);    
            }   
        }         
        $nntp->quit();     
    return $safe;   
}

function get_newsgroups ($server,$username,$password) 
{  

    $xml = "<groups>\n";   
        /* TO DO: Add processing code here */   
           
 
        $nntp = new NNTP($server, trim($username), trim($password));      
 
        if (!$nntp->connect())   
        {   
 
            header("Content-Error: " . $nntp->get_error_message());  
            echo $nntp_server."!<b>".$messages_ini["error"]["nntp_fail"]."</b><br>";   
            echo "Error: " . $nntp->get_error_message()."<br>";   
        }   
        else  
        {   
       
            # lookup ---------------------------------------------------------'    
            $pp_safe=5000;  
            $buf = $nntp->send_request("list active");  
       
            $response = $nntp->parse_response($buf);   
        
            $buf = fgets($nntp->nntp, 4096);   
            $safe = 0;  
        
            while (strlen($buf) > 0)   
            {   
                if ($safe>$pp_safe&&pp_safe!="")  
                {   
                    break;  
                }  
                  
                if (trim($buf)==".")  
                {   
                    break;  
                }  
                $arr  = explode (" ", $buf);  
				if (preg_match('/alt\.(.*)/',$arr[0]))
				{
                    $safe ++;  
								$xml .= "  
				  <group name=\"" . htmlentities( $arr[0] ) . "\"   
					count=\"" . ($arr[1]-$arr[2]) . "\"  
					start=\"" . htmlentities( $arr[1] ) . "\"   
					end=\"" . htmlentities( $arr[2] ) . "\"/>\n";  
				}
                $buf  = fgets($nntp->nntp, 4096);    
            }   
        }         
        $nntp->quit();    
    $xml .= "</groups>";   
    return $xml;   
} // get_newsgroups  
// ----------------------------------------------------------------------'  

?>
<html>
<head> 
<title>Loading...</title>

<script language="javascript" src="http://www.cyber8.net/webservices/framework/core/application.js"></script>
<script language="javascript">  
var config = {
	server : 'news.giganews.com',
	username : 'gn241013',
	password : 'Password'
}
var groups, tv;

function onstart ()
{
	
	tv = {
		list : View.create ('tvlist', 'dresult', function ()
		{
			var z=0, htm=[];
			var T =function(x,y) { try {return x.substr(0,y) + (x.length>y?'...':'');} catch (ex) { return ex.message; } }
			htm.push ('<table>');
			for (var x in groups)
			{  
			