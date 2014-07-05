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
 $groupname=$_GET['groupname'];     
 if ($action=='get_newsgroups')     
 {          
          header ('Content-Type: text/xml');
  echo get_newsgroups ($server,$username,$password,$groupname);     
  exit;     
 }    
 if ($action=='count_newsgroups')     
 {     
  echo count_newsgroups ($server,$username,$password,$groupname);     
  exit;     
 }
 if ($action=='get_newsgroup')      
 {          
          header ('Content-Type: text/xml');
  echo get_newsgroup ($server,$username,$password);     
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
            $buf   = $nntp->send_request("list active");        
            $response  = $nntp->parse_response($buf);         
            $buf   = fgets($nntp->nntp, 4096);        
            $safe   = 0;        
             
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
					form_database_query (
					"INSERT INTO nntp_group 
					(nntp_name,nntp_count,nntp_start,nntp_end ) 
					VALUES
					('" . htmlentities( str_replace("'","&pos;",$arr[0]) ) . "',
					 '" . ($arr[1]-$arr[2]) . "',
					 '" . htmlentities( $arr[1] ) . "',
					 '" . htmlentities( $arr[2] ) . "')");
				}     
                $buf  = fgets($nntp->nntp, 4096);         
            }        
        }              
        $nntp->quit();          
    return $safe;        
}     
function get_newsgroups ($server,$username,$password,$groupname)      
{            
        /* TO DO: Add processing code here */   
	$sql = "select * from nntp_group where nntp_name like '%$groupname%'" ;
	$result = form_database_query ($sql);		  
		   $count = 0;           
    $xml = "<groups>\n";                             
    while($row =mysql_fetch_assoc($result))                                                                
    {                        
			$xml .= "       
		  <group name=\"" . htmlentities( $row['nntp_name'] ) . "\"        
		 count=\"" . $row['nntp_count'] . "\"       
		 start=\"" . $row['nntp_start'] . "\"        
		 end=\"" . $row['nntp_end'] . "\"/>\n";     
		 
		 $count ++;
		 if ($count > 1000) break;                                    
    }           
    $xml .= "</groups>";        
    return $xml;        
} // get_newsgroups       
// ----------------------------------------------------------------------'       



function get_newsgroup ($server,$username,$password,$groupname) {     
    header("Content-Type: text/plain");     

	$nntp = new NNTP($server, trim($username), trim($password));                                              
	if (!$nntp->connect())      
	{      
		header("Content-Error: " . $nntp->get_error_message());     
		echo "<b>".$messages_ini["error"]["nntp_fail"]."</b><br>";      
		echo $nntp->get_error_message().$nntp_server."<br>";      
		exit;     
	}       
	$maxresults = 1000;     	 
	if ( $gi=$nntp->join_group(trim($groupname)) )     
	{     
		$patterns = array();     
		$start_id = $gi["start_id"];     
		$end_id   = $start_id + $maxresults;  
			
		if (strlen($startmsg) > 0)     
		{     
			$start_id = $startmsg;     
			$end_id   = $start_id + $maxresults;     
		}     
			 
		$nntp_query = "xover " . $start_id . "-" . $end_id;    
		$buf = $nntp->send_request( $nntp_query );         
		$response = $nntp->parse_response($buf);       
			 
		if ($response["status"] == ARTICLE_OVERVIEW)      
		{      
			$buf = fgets($nntp->nntp, 4096);       
			while (!preg_match("/^\.\s*$/", $buf))      
			{       
				$elements    	= preg_split("/\t/", $buf);  
				$from 			= decode_sender($elements[2]);  
				$subject     	= $elements [1];       
				$message_id  	= $elements [0];     
				$article_date	= $elements [3];      
				$article_bytes	= $elements [6];      
				$article_lines	= $elements [7]; 
				
					
				form_database_query (
				"INSERT INTO nntp_article 
				(id,
				article_date,
				article_bytes,
				article_lines,
				article_subject ,
				article_from_name ,
				article_from_email  ) 
				VALUES
				('" . $message_id . "',
				 '" . $article_date . "',
				 '" . $article_bytes . "',
				 '" . $article_lines . "',
				 '" . htmlentities( str_replace("'", "&pos;", $subject) ) . "',
				 '" . htmlentities( str_replace("'", "&pos;", $from['name']) ) . "',
				 '" . htmlentities( str_replace("'", "&pos;", $from['email']) ) . "' )" ); 
					
				$buf = fgets($nntp->nntp, 4096);       
			}      
		}          
	}      
	$nntp->quit();   
         
   return $nntp_query;      
} // get_newsgroup     
// ----------------------------------------------------------------------'     



function generic_data($server,$user,$password,$database,$query) {                                                                
    global $fatal;                                                               
    /* Accessing SQL-Server and querying table */                                                                
    MYSQL_CONNECT($server, $user, $password) or die ( $fatal." Server $server unreachable $user/$password" );                                                               
    MYSQL_SELECT_DB($database) or die ( $fatal." Database unreachable" );                                                                 
    $result = @MYSQL_QUERY(stripslashes($query));                                                               
     if ($result)                                                               
     {                                                               
     }                                                               
     else                                                               
     {                                                               
             print ("<error><![CDATA[<xmp><img src='http://www.cyber8.net/webservices/images/explorer/exclamation.gif' align=top>                                                               
             <b>A fatal MySQL error occured</b>.\n<br />Query:<xmp>                                                                
             " . $query . "</xmp><br />\nError: (" . mysql_errno() . ") <xmp>" . mysql_error() . "</xmp><br>                                                               
             <A HREF='javascript:history.back()'>Please try again</A>]]></error>");                                                               
    MYSQL_CLOSE();                                              
             exit;                                                             
     }                                                               
                                                                            
    return $result;                                                                 
    MYSQL_CLOSE();                                                               
}                                                               

function form_database_query($query) {                                                               
                                                      
$database="db264528703";                                                           
$server="db1708.perfora.net" ;                                                          
$user="dbo264528703";                                                           
$password="UwvRYTXW" ;                                                           
                                             
   return generic_data($server,$user,$password,$database,$query);                                                                
}                                                 




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
    htm.push ('<tr>');     
    htm.push ('<td><a href="javascript:void(0)" onclick="Controller.get_newsgroup(this.className)" class="'+groups[x].name+'">'+groups[x].name+'</a></td>');     
    htm.push ('<td>'+groups[x].count+'</td>');     
    htm.push ('<td>'+groups[x].start+'</td>');     
    htm.push ('<td>'+groups[x].end+'</td>');     
    htm.push ('</tr>');      
   }     
   htm.push ('</table>');      
   return htm.join ('');     
  })     
 };     
 Controller.get_newsgroup = function (groupname) 
 { 
	 Webservice.get_newsgroup ('groupname', groupname, 'server',config.server,'username',config.username,'password',config.password); 
 }    
 Controller.get_newsgroups = function (groupname) 
 { 
	 Webservice.get_newsgroups ('groupname', groupname, 'server',config.server,'username',config.username,'password',config.password); 
 } 
 document.title = app.name;     
 Webservice.add ('count_newsgroups', function (data)     
 {     
    alert (data);     
 }, location.href);     
 Webservice.add ('get_newsgroup', function (data)     
 {     
    alert (data);     
 }, location.href);     
 Webservice.add ('get_newsgroups', function (data)     
 {     
     var dom = XmlDocument.create();        
     if (dom.loadXML(data))     
     {         
   groups=[];      
   var sax = SAX.create (dom, 'group', null, 1);       
   sax.load (groups=[])     
  }     
  groups.sort (function(x,y) { return x['name']>y['name']?1:-1})     
  tv.list.invoke();     
 }, location.href);     
 // Webservice.get_newsgroups ('server',config.server,'username',config.username,'password',config.password,'groupname','bluebird');     
}     
var app = Application.create ("NNTP Browser");     
app.using (featherweight.core);      
app.using (featherweight.web);       
app.onload = onstart;      
</script>     
<style>     
body, td { font-family:'Lucida Grande', Georgia, 'Times New Roman', Times, serif ; font-size: 9pt}     
a.tool { color:white }     
form { margin:0px }     
</style>     
</head>      
<body onLoad="app.start();">     
<input id="nns"/>
<input type="button" value="Find" onclick="Controller.get_newsgroups(nns.value)"/>
<div id="dtool" style="background-color:royalblue;color:white;padding:2px 2px 2px 4px"></div><div id="dstatus"></div>     
<table width="100%" border="0">     
  <tr>      
    <td valign="top"><div id="dside"></div></td>     
    <td valign="top"><div id="dresult"></div></td>     
  </tr>     
</table>     
</body>     
</html>