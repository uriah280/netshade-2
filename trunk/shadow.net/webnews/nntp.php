<?                                      
/*                                      
    This PHP script is licensed under the GPL                                      

    Author: Terence Yim                                      
    E-mail: chtyim@gmail.com                                      
    Homepage: http://web-news.sourceforge.net                                      
*/                                      

    require("util.php");                                      
    require("MIME_Message.php");                                      

    define("NNTP_PORT", 119);                                      

    // Define the return status code                                      
    define("SERVER_READY", 200);                                      
    define("SERVER_READY_NO_POST", 201);                                      
                                                                       
    define("GROUP_SELECTED", 211);                                      
    define("GROUP_NEW_SELECTED", 230);                                      
                                                                       
    define("INFORMATION_FOLLOWS", 215);                                      
                                                                       
    define("ARTICLE_HEAD_BODY", 220);                                      
    define("ARTICLE_HEAD", 221);                                      
    define("ARTICLE_BODY", 222);                                      
    define("ARTICLE_OVERVIEW", 224);                                      
                                                                       
    define("ARTICLE_POST_OK", 240);                                      
    define("ARTICLE_POST_READY", 340);                                      

    define("AUTH_ACCEPT", 281);                                      
    define("MORE_AUTH_INFO", 381);                                      
    define("AUTH_REQUIRED", 480);                                      
    define("AUTH_REJECTED", 482);                                      
    define("NO_PERMISSION", 502);                                      


    class NNTP {                                      
                                                                       
        var $nntp;                                      
        var $server;                                      
        var $user;                                      
        var $pass;                                      
        var $group_count;                                      
        var $group_address;                                      
        var $group_start_id;                                      
        var $group_end_id;                                      
        var $proxy_server;                                      
        var $proxy_port;                                      
        var $proxy_user;                                      
        var $proxy_pass;                                      
        var $use_proxy;                                      
        var $error_number;                                      
        var $error_message;                                      
                                                                           
                                                                           
        function NNTP($server, $user = "", $pass = "", $proxy_server = "", $proxy_port = "", $proxy_user = "", $proxy_pass = "") {                                      
            $this->server = $server;                                      
            $this->user = $user;                                      
            $this->pass = $pass;                                      
            $this->proxy_server = $proxy_server;                                      
            $this->proxy_port = $proxy_port;                                      
            $this->proxy_user = $proxy_user;                                      
            $this->proxy_pass = $proxy_pass;                                      

            if ((strcmp($this->proxy_server, "") != 0) && (strcmp($this->proxy_port, "") != 0)) {                                      
                $this->use_proxy = TRUE;                                      
            } else {                                      
                $this->use_proxy = FALSE;                                      
            }                                      
        }                                      


        /* Open a TCP connection to the specific server                                      
            Return:    TRUE - open succeeded                                      
                    FALSE - open failed                                      
        */                                      
        function connect() {                                      
            # print "Connecting...";                                     
            if ($this->nntp) {    // We won't try to re-connect an already opened connection                                      
                return TRUE;                                      
            }                                      
$debug = " ** OPEN: Connecting to {$this->server}\n";             
echo $debug;                                                                  
            if ($this->use_proxy) {                                      
                $this->nntp = fsockopen($this->proxy_server, $this->proxy_port, $this->error_number, $this->error_message);                                      
            } else {                                      
                $this->nntp = fsockopen($this->server, NNTP_PORT, $this->error_number, $this->error_message);                                      
            }                                      
                                                                               
            if ($this->nntp) {                                      
                if ($this->use_proxy) {                                      
                    $response = "CONNECT ".$this->server.":".NNTP_PORT." HTTP/1.0\r\n";   
                    if ((strcmp($this->proxy_user, "") != 0) && (strcmp($this->proxy_pass, "") != 0)) {                                      
                        $response .= "Proxy-Authorization: Basic ";        // Only support Basic authentication type                                      
                        $response .= base64_encode($this->proxy_user.":".$this->proxy_pass);                                      
                        $response .= "\r\n";                                      
                    }                                      
                    $response = $this->send_request($response);                    
echo $response;                                                                                              
                    if (strstr($response, "200 Connection established")) {                                      
                        fgets($this->nntp, 4096);    // Skip an empty line                                      
                        $response = $this->parse_response(fgets($this->nntp, 4096));                                      
                    } else {                                      
                        $response["status"] = NO_PERMISSION;    // Assign it to something dummy                                      
                        $response["message"] = "No permission";                                      
                    }                                      
                } else {                                      
                    $response = $this->parse_response(fgets($this->nntp, 4096));                                      
                }                                      
                                                                                   
                if (($response["status"] == SERVER_READY) || ($response["status"] == SERVER_READY_NO_POST)) {                                      
                    $this->send_request("mode reader");                                      
                    if (strcmp($this->user, "") != 0) {                                      
                        $response = $this->parse_response($this->send_request("authinfo user ".$this->user));                                      
                                                                                           
                        if ($response["status"] == MORE_AUTH_INFO) {                                      
                            $response = $this->parse_response($this->send_request("authinfo pass ".$this->pass));                                      
                                                                                               
                            if ($response["status"] == AUTH_ACCEPT) {                                      
                                return TRUE;                                      
                            }                                      
                        }                                      
                    } else {                                      
                        return TRUE;                                      
                    }                                      
                }                                      
                                                                                   
                $this->error_number = $response["status"];                                      
                $this->error_message = $response["message"];                                      
            }                                      
                                                                       
            return FALSE;                                      
        }                                      
                                                                           

        /* Close the TCP Connection                                      
        */                                      
        function quit() {                                      
            # print "<font color='red'>Quitting...</font>";                                     
            if ($this->nntp) {                                      
                $this->send_request("quit");                                      
                fclose($this->nntp);                                       
                $this->nntp = NULL;               
$debug = " ** END: Quitting {$this->server}\n";             
echo $debug;                                                                           
            }                                      
        }                                      
                                                                           
                                                                           
        function parse_response($response) {                                      
            $status = substr($response, 0, 3);                                      
            $message = str_replace("\r\n", "", substr($response, 4));                                      
                                                                               
            return array("status" => intval($status),                                      
                        "message" => $message);                                      
        }                                      
                                                                           
                                                                           
        function send_request($request) {                                      
            if ($this->nntp) {                                      
                fputs($this->nntp, $request."\r\n");                                      
                fflush($this->nntp);                                      
                # add_loaded_bytes(4096);                                                                   
                return fgets($this->nntp, 4096);                                      
            }                                      
        }                                      
                                                                           
                                                                           
        function read_response_body()                              
        {                                      
            $bytes=0;                            
            if ($this->nntp) {                                                                               
                $result = "";                                      
                $buf = fgets($this->nntp, 1024);                                      
                $bytes += strlen($buf);                                     
                while (!preg_match("/^\.\s*$/", $buf))                               
                {                                      
                    $result .= $buf;                                      
                    $buf = fgets($this->nntp, 1024);                                
                    $bytes+=strlen($buf);                                  
                }                                                                  
                add_loaded_bytes($bytes);                                                                   
                return $result;                                      
            }                                      
        }                                      
                                                                       
                                                                           
        function join_group($group) {                                      
            if ($this->nntp) {                                                                               
                $buf = $this->send_request("group ".$group);                                       
                $response = $this->parse_response($buf);                                      
                                                      
                if (! ($response["status"] < 200 || $response["status"] > 299) ) {                                      
                    $this->group_address = $group;                                                               
                    $result = preg_split("/\s/", $response["message"]);                                          
                    $this->group_start_id=$result[1];                                     
                    $this->group_end_id=$result[2];                                     
                    $this->group_count=$result[0];                                     
                    return array("count" => $result[0],                                      
                                "start_id" => $result[1],                                      
                                "end_id" => $result[2],                                      
                                "group" => $result[3]);                                      
                }                                      
            }                                      

            $this->error_number = $response["status"];                                      
            $this->error_message = $response["message"];                                      
            return NULL;                                      
        }                                      
                                             
        function get_first_article ($group)                                     
        {                                     
            $bytes=0;                            
            $command = "listgroup ".$group;                                     
            $buf = $this->send_request($command);                                         
            $response = $this->parse_response($buf);                                        
            $buf = fgets($this->nntp, 1024);                                      
            $bytes += strlen($buf);                                     
            $idx = 0;                                     
            $result = "";                                     
            while (!preg_match("/^\.\s*$/", $buf)) {                                      
                $idx ++;                                     
                if ($idx>1)                                     
                {                                     
                   break;                                     
                }                                     
                $result .= $buf;                                      
                $buf = fgets($this->nntp, 1024);                                  
                $bytes+=strlen($buf);                                    
            }                                         
            add_loaded_bytes($bytes);                                                                   
            return $result;                                     
        }                                                                   
                                                                           
        function get_first_article_by_group($group, $noisy=true) // get_first_article_by_group                                     
        {                                                     
            $cache_path = "data/" . base64_encode($group) . ".DAT";                                                 
            if (file_exists($cache_path))                                     
            { # if this group was recently updated, then return the last                                      
              # known list of articles                                                 
                $content = implode ('', file ($cache_path));                                     
                $timestamp = filemtime($cache_path);                                     
                parse_str ($content);                                                     
                return $arr[0];                                     
            }                                   
            return false;                                  
        }                                                                   
                                                                           
        function get_article_list($group, $noisy=true) // get_article_list                                     
        {                                       
            $href = $_SERVER['SCRIPT_NAME'];                                     
            if ($noisy)                                     
            {                                     
                raise_event (EVENT_PROCESS_WORKING, "Opening ".$group."...");                                      
            }                                     
                                                 
            # CHECK FOR CACHED ARTICLES                                                     
            $cache_path = "data/" . base64_encode($group) . ".DAT";                                                 
            if (file_exists($cache_path))                                     
            { # if this group was recently updated, then return the last                                      
              # known list of articles                                                 
                $content = implode ('', file ($cache_path));                                     
                $timestamp = filemtime($cache_path);                                     
                parse_str ($content);                                                     
                if ($noisy)                                     
                {                                     
                    raise_event (EVENT_PROCESS_WORKING, " ".$group." last updated " . date("m-d-Y H:i:s", $timestamp) . " [<a href='$href?a=update.group&f=$cache_path&g=$group'>Update</a>]");                                      
                }                                                     
                if (time() - $timestamp < 14400)                                     
                {                                      
                    return $arr;                                     
                }                                     
            }                                     
                                                 
            # CHECK ARTICLE COUNT                                     
            $list_max_count = $this->group_end_id - $this->group_start_id;                                                 
            if ($list_max_count > 400000)                                     
            { # if this group has more than the maximum number of allowed articles                                     
              # load only the first 20% or 50000 whichever is lowest                                     
                $twenty_percent = min (50000, floor($list_max_count * .2));                                     
                $start_id = $this->group_end_id - $twenty_percent;                                     
                $command  = "xover " . $start_id . "-" . $end_id;                                       
            }                                     
            else                                     
            {                                     
                $command  = "listgroup " . $group;                                      
            }                                     
                                                  
            $result_arr = array();                                                       
            $get_date = mktime (0,0,0,date("m"),date("d")-7,date("Y"));                                                  
            if ($this->nntp)                                      
            {                                             
                if ($noisy)                                     
                {                                     
                    raise_event (EVENT_PROCESS_WORKING, "Sending ".$command." request...");                                      
                }                                     
                $bytes=0;                                                                     
                $content = "";                                     
                $buffer   = $this->send_request($command);                                         
                $response = $this->parse_response($buffer);                                   
                $bytes+=strlen($buffer);                                        
                                                     
                if ($noisy)                                     
                {                                        
                    raise_event (EVENT_PROCESS_WORKING, "Response received " . $response["status"] . ". Please wait...");                                      
                }                                     
                                                     
                $result_count = 0;                                     
                if ($response["status"] == ARTICLE_OVERVIEW)                                     
                {                                     
                    while (strlen($buffer) > 0) {                                      
                        $elements = preg_split("/\s/", $buffer);                                       
                        $i++;                                      
                        $buffer = fgets($this->nntp, 4096);                                   
                        $bytes+=strlen($buffer);                                                              
                        if (trim($buffer)==".")                                     
                        {                                      
                            break;                                     
                        }                                                             
                        if ($i % RESULT_PAGE_SIZE == 0)                                     
                        {                                     
                            $result_arr [] = $elements[0];                                           
                            $content .= ($content==""?"":"&") . "arr[]=" . $elements[0];                                         
                            raise_event (EVENT_PROCESS_WORKING, "" . $i . " articles loaded...");                                            
                        }                                      
                    }                                     
                                                         
                    $content .= "&timestamp=" . time();                                                  
                    WriteToFile($cache_path, $content);                                                     
                                                         
                                                         
                    if ($noisy)                                     
                    {                                     
                        raise_event (EVENT_PROCESS_WORKING, "Done. " . count($result_arr) . " pages found.");                                      
                    }                                     
                                                
                    add_loaded_bytes($bytes);                                       
                    return $result_arr;                                       
                }                                     
                else if ($response["status"] == GROUP_SELECTED || $response["status"] == GROUP_NEW_SELECTED)                                      
                {                                         
                    $body       = $this->read_response_body();                                        
                    $body_size  = strlen($body);                                      
                    $bytes      = number_format($body_size/1000,2,".",",") . " Kb. ";                                      
                                                         
                    if ($noisy)                                     
                    {                                     
                        raise_event (EVENT_PROCESS_WORKING, "Reading " . $bytes . "...");                                      
                    }                                     
                                                                             
                                                         
                    if ($body_size < 500000)                                     
                    { // smaller results use simple array                                      
                        $body_arr   = explode (chr(13).chr(10), $body);                                       
                        $body_count = count($body_arr) ;                                     
                        for ($e=0;$e<count($body_arr);$e+=RESULT_PAGE_SIZE)                                      
                        {                                       
                            $result_arr [] = $body_arr[$e];                                           
                            $content .= ($content==""?"":"&") . "arr[]=" . $body_arr[$e];                                               
                                                                 
                            if ($noisy)                                     
                            {                                     
                               raise_event (EVENT_PROCESS_WORKING, "" . $e . " of " . $body_count . "");                                      
                            }                                     
                                                                                            
                        }                                       
                        if ($noisy)                                     
                        {                                     
                           raise_event (EVENT_PROCESS_WORKING, "<font color=red size=1>Last updated " . date ("m/d/Y H:i:s") . "</font>");                                     
                        }                                     
                    }                                     
                    else if ($body_size < 4000000)                                     
                    { // for larger results, walk manually thru the text                                       
                        $delim  = chr(13).chr(10);                                     
                        $char_pos_cursor = 0;                                     
                        $char_pos_delim  = strpos ($body, $delim, $char_pos_cursor);                                     
                        while ($char_pos_delim !== false)                                      
                        {                                      
                            $message = substr ($body, $char_pos_cursor, $char_pos_delim-$char_pos_cursor);                                         
                            $result_arr[] = $message;                                     
                            $content .= ($content==""?"":"&") . "arr[]=" . $message;                                         
                            $char_pos_cursor += RESULT_PAGE_SIZE * (strlen($message) + strlen($delim));                                     
                            $char_pos_delim   = strpos ($body, $delim, $char_pos_cursor);                                         
                                                                  
                            if ($noisy)                                     
                            {                                     
                                raise_event (EVENT_PROCESS_WORKING, "" . $char_pos_cursor . " of " . $body_size . "");                                      
                            }                                                             
                        }                                        
                        if ($noisy)                                     
                        {                                     
                           raise_event (EVENT_PROCESS_WORKING, "<font color=red size=1>Last updated " . date ("m/d/Y H:i:s") . "</font>");                                     
                        }                                     
                    }                                         
                    else                                     
                    {                                     
                        if ($noisy)                                     
                        {                                     
                             raise_event (EVENT_PROCESS_WORKING, "To many results were returned ($bytes). Use search to narrow your results.");                                     
                        }                                     
                    }                                                            
                                                         
                    $content .= "&timestamp=" . time();                                                  
                    WriteToFile($cache_path, $content);                                                     
                                                         
                                                         
                    if ($noisy)                                     
                    {                                     
                        raise_event (EVENT_PROCESS_WORKING, "Done. " . count($result_arr) . " pages found.");                                      
                    }                                     
                                                             
                    return $result_arr;                                       
                }                                      
            }                                      

            $this->error_number = $response["status"];                                      
            $this->error_message = $response["message"];                                      
            return false;                                      
        }                                      
                                                                           

        function get_group_list($group_pattern) {                                      
            $bytes=0;                          
            $response = $this->parse_response($this->send_request("list active ".$group_pattern));                                      
            if ($response["status"] == INFORMATION_FOLLOWS) {                                      
                $result = array();                                      
                $buf = fgets($this->nntp, 4096);                                      
                $bytes += strlen($buf);                                     
                while (!preg_match("/^\.\s*$/", $buf)) {                                                                                       
                    list($group, $last, $first, $post) = preg_split("/\s+/", $buf, 4);                                      
                    $result[] = $group;                                      
                    $buf = fgets($this->nntp, 4096);                              
                    $bytes+=strlen($buf);                                  
                }                           
                add_loaded_bytes($bytes);                                          
                return $result;                                      
            }                                      
                                                                                   
            $this->error_number = $response["status"];                                      
            $this->error_message = $response["message"];                                      
            return FALSE;                                      
        }                                                                           



        // The $group can have wildcard like comp.lang.*                                      
        function get_groups_description($groups) {                                      
            $bytes=0;                          
            $response = $this->parse_response($this->send_request("list newsgroups ".$groups));                                      
            if ($response["status"] == INFORMATION_FOLLOWS) {                                      
                $result = array();                                      
                $buf = fgets($this->nntp, 4096);                                      
                $bytes += strlen($buf);                                     
                while (!preg_match("/^\.\s*$/", $buf)) {                                                                                       
                    list($key, $value) = preg_split("/\s+/", $buf, 2);                                      
                    $result[$key] = trim($value);                                      
                    $buf = fgets($this->nntp, 4096);                               
                    $bytes+=strlen($buf);                                     
                }                                      
                                                                                   
                add_loaded_bytes($bytes);                                          
                return $result;                                      
            }                                      
                                                                                   
            $this->error_number = $response["status"];                                      
            $this->error_message = $response["message"];                                      
            return FALSE;                                      
        }                                       

        // Get a message summary tree. The subject and sender will be matched with the reg_pat using regular expression                                      
        function get_message_summary($start_id=1, $end_id="", $reg_pat="//", $flat_tree=FALSE) {                                      
                                                                           
            $bytes=0;                          
            $buf = $this->send_request("xover " . $start_id . "-" . $end_id);                                  
            $bytes+=strlen($buf);                                                     
                                                                                     
                                          
#              print "[<xmp>".$buf ."</xmp>]";                                     

            $response = $this->parse_response($buf);                                                                           
            $message_tree_root = new MessageTreeNode(NULL);                                                                           
            $message_tree_root->set_show_children(TRUE);                                                                           
            $ref_list = array();                                                                           
            $line_count = 0;                                      
            $articles = array();                                      
            $indices  = array();                                      
            $pages = array();                                      
                                                             
               $p=0;                                           
            if ($response["status"] == ARTICLE_OVERVIEW) {                                      
                $buf = fgets($this->nntp, 4096);                                      
                while (!preg_match("/^\.\s*$/", $buf)) {                                      
                    $elements = preg_split("/\t/", $buf);                                      
                    $elements[1] = decode_MIME_header($elements[1]);    // Decode subject                                      
                    $elements[2] = decode_MIME_header($elements[2]);    // Decode from                                      
                    if (preg_match($reg_pat, $elements[1]) || preg_match($reg_pat, $elements[2])) {                       
                        $line_count ++;                                       
                        $message_info = new MessageInfo();                                      
                        $message_info->nntp_message_id = $elements[0];                                      
                        $message_info->subject = $elements[1];                                      
                        $message_info->from = decode_sender($elements[2]);                                      
                        $message_info->date = strtotime($elements[3]);                                      
                        if ($message_info->date == -1) {                                      
                            $message_info->date = $elements[3];                                      
                        }                                      
                        $message_info->message_id = $elements[4];                                      
                        if (strlen($elements[5]) != 0) {                                      
                            $message_info->references = preg_split("/\s+/", trim($elements[5]));                                      
                        } else {                                      
                            $message_info->references = array();                                      
                        }                                      
                        $message_info->byte_count = $elements[6];                                      
                        $message_info->line_count = $elements[7];                                      
                        if ($line_count<=RESULT_PAGE_SIZE)                                      
                        {     $p++;                                 
                             #  echo "<!-- $p ^ " . $elements[1] . " --> \n";                                 
                            $articles[count($articles)] = $message_info;                                      
                            $indices[count($indices)]   = $message_info->nntp_message_id;                                        
                        }                                      
                    }   $p++;  # echo "<!-- $p # [" . $elements[0] . "] --> \n ";                                    
                                                                                   
                    if ($line_count>RESULT_PAGE_SIZE)                                      
                    {                                      
                         break;                                      
                    } else if ($line_count % RESULT_PAGE_SIZE == 0)                                      
                    {                                      
                        $pages[count($pages)] = $message_info->nntp_message_id;                                      
                    }    
					                            

                    $buf = fgets($this->nntp, 4096);                                 
                    $bytes+=strlen($buf);                                    
                }                                               
                add_loaded_bytes($bytes);       
				echo "Done";                                                      
                return array("articles"=>$articles,"pages"=>$pages,"indices"=>$indices);                                      
            }                                                                       
            $this->error_number  = $response["status"];                                      
            $this->error_message = $response["message"];                                      
            return NULL;                                      
        }                                      
                                      
        function search_newsgroup($start_id=1, $reg_pat="", $head="subject", $abort=false, $maxlines=CACHE_MAX_LINE_COUNT, $saveas=false)                                      
        {                                        
           # $bytes=0;                          
           # $log=0;                          
           # $start_index = $start_id;                                    
          #  if ($start_index==1)                                 
           # {                                 
           #     $first = $this->get_first_article_by_group($this->group_address);                                 
           #     if ($first)                                 
           #     {                                 
            #        $start_index = $first;                                 
           #     }                                 
            #}                                  
//            $end_index   = "";                                       
//            $file_mode   = NULL;                                     
//            $file_name   = str_replace ("*", "", $reg_pat);                                     
//            $file_name   = base64_encode ("_______" . $this->group_address . "_" . $file_name . "");                                     
//            $file_name   = CACHE_PATH . "idx/" . $file_name . ".IDX";                                      
//                                                  
//                                                 
//            $execution_start_index = time();                                     
//            $execution_arr         = array();                                     
//                                                  
//            if (file_exists($file_name) && $saveas==true)                                     
//            {                                      
//                $check_time = time() - filemtime($file_name);                                     
//                if ($check_time > CACHE_AGE_LIMIT)                                     
//                {                                      
//                    $write_handle = fopen($file_name, "w");                                     
//                    $file_mode = "w";                                     
//                }                                     
//                else                                     
//                {   
//				    # echo "<pre>$file_name</pre>";                             
//                    $read_handle  = fopen($file_name, "r");                                     
//                    $file_mode = "r";                                     
//                }                                     
//            }                                     
//            else if ($saveas)                                     
//            {                                          
//                $write_handle = fopen($file_name, "w");                                     
//                $file_mode = "w";                                     
//            }                                     
//                                                 
                if ($saveas) $end_index = $saveas;                                 
            #if ($file_mode!="r" )                                     
            #{                                     
                $command    = "xpat " . $head . " " . $start_index . "-" . $end_index . " " . $reg_pat;                                        
                $buffer     = $this->send_request($command);                                        
                $response   = $this->parse_response($buffer);                                         
           #     $execution_arr[] = time()-$execution_start_index;                                     
           #     if (isset ($_POST["xnzb"]) || isset ($_POST["cnzb"]))                                                                                
           #     {                                    
           #         echo "Sending '" . $command . "'<br>";                                    
           #     }                                       
                                                                
           # }                                     
                                     
                                     
            $line_count = 0;                                              
            $articles   = array();                                      
            $indices    = array();                                      
            $pages      = array();                                         
                                                         
            if ($response["status"] == ARTICLE_HEAD )                                      
            {                                        
                $buffer = fgets($this->nntp, 4096);                               
//                $bytes += $file_mode=="r" ? 0 : strlen($buffer);                                              
//                $execution_arr[] = time()-$execution_start_index;                                      
                $item_count = 0;                                               
                while (!preg_match("/^\.\s*$/", $buffer)) {                                       
                                                       
                    if (trim($buffer)==".")                                     
                    {                                     
                        break;                                     
                    }                                     
//                    if ($file_mode=="w")                                     
//                    {                                     
//                        fwrite($write_handle, $buffer);                                     
//                        if ($item_count%100==0)                                     
//                        {                                     
//                            raise_event (EVENT_PROCESS_WORKING, $item_count . ". Writing cache file...");                                      
//                        }                                     
//                    }                                     
//                    else if ($file_mode=="r" && feof($read_handle))                                      
//                    {                                     
//                        break;                                     
//                    }                                     
                             #   echo $buffer . "<br>";                     
                    $char_pos_space = strpos($buffer, " ");                                       
                    if ($char_pos_space !== false)                                      
                    {                                      
                        $message_info = new MessageInfo();                                      
                        $message_info->nntp_message_id = substr($buffer,0,$char_pos_space);                                      
                        $message_info->subject         = substr($buffer,$char_pos_space);    
						
						if (preg_match('/re\:.*/i',$message_info->subject,$part)) 
						{           
//							$item_count --;                                     
//							$line_count --;      
						}
						else if (preg_match('/(.*)\((\d+)\/(\d+)\).*/i',$message_info->subject,$part)) 
						{
							if ($part[3]=='1') 
							{                                  
                                $articles[] = $message_info;     
								$indices[] = $message_info->nntp_message_id;                         
								$item_count ++;                                     
								$line_count ++;    
							}
							else if ($part[3]=='2') 
							{                                  
                                if (array_key_exists($part[1], $pages)===false)
								    $pages[$part[1]]=array();
								$pages[$part[1]][] = 	$message_info;                        
								$item_count ++;                                     
								$line_count ++;    
							}
							else
							{           
//								$item_count --;                                     
//								$line_count --;      
							}
						}	                                   
                        else                                     
                        {                     
                             $articles[] = $message_info;                     
                             $indices[] = $message_info->nntp_message_id;                           
							 $item_count ++;                                     
							 $line_count ++;                                          
                        }    
						           //                        
//                        if (isset ($_POST["xnzb"]) || isset ($_POST["cnzb"]))                                                                                
//                        {                          
//                            $log++;                                   
//                            echo $log . ". " . $message_info->subject . "<br>";                                    
//                        }                                       
//                        if ($abort&&$abort!=2)                                     
//                        {  
//						      
//							if (preg_match('/^re\:.*/i',$message_info->subject,$part)) 
//							{           
//								$item_count --;                                     
//								$line_count --;      
//							}
//							else if (preg_match('/.*\((\d+)\/(\d+)\).*/i',$message_info->subject,$part)) 
//							{
//								if ($part[2]=='1') $indices[] = $message_info->nntp_message_id;
//								else
//								{           
//									$item_count --;                                     
//									$line_count --;      
//								}
//							}	 
//							else $indices[] = $message_info->nntp_message_id;    
//					                             
////                            $multi_test = multipart_lookup ($message_info->subject, false, true);                                             
////                            if ($multi_test > 2)                                     
////                            {                                     
////                                $item_count --;                                     
////                                $line_count --;                                      
////                            }                                     
////                            else if (strpos(strtolower($message_info->subject),"re:")===false)                                     
////                            {                                     
////                                $indices[] = $message_info->nntp_message_id;                                        
////                            }                                     
////                            else                                     
////                            {                                     
////                                $item_count --;                                     
////                                $line_count --;                                      
////                            }                                     
//                        }                                     
//                        else                                     
//                        {                                     
//                             $indices[] = $message_info->nntp_message_id;                                        
//                        }                                     
//                        if ($line_count % RESULT_PAGE_SIZE == 0)                                     
//                        {                                     
//                            $pages[] = $message_info->nntp_message_id;                                     
//                        }                                       
                    }                                                     
                    if ($abort&&$line_count>$maxlines)                                     
                    {    
						#echo $maxlines;                                   
                        break;                                     
                    }                                     
//                    else if ($file_mode=="w" && $line_count > 15000)                                     
//                    {                                     
//                        break;                                     
//                    }                                     
                    $buffer = fgets($this->nntp, 4096);                                
//                    $bytes += $file_mode=="r" ? 0 : strlen($buffer);                                  
//                    $execution_arr[] = time()-$execution_start_index;                                      
                }                                           
                                                                  
//                if (isset ($_POST["xnzb"]) || isset ($_POST["cnzb"]))                                                                                
//                {                          
//                    echo $log . " articles loaded<br>";                                    
//                }                              
//                if ($file_mode=="w")                                     
//                {                                     
//                    fclose($write_handle);                                     
//                }                                       
//                if (isset ($_POST["xnzb"]) || isset ($_POST["cnzb"]))                                                                                
//                {                          
//                    echo $log . " output file saved<br>";                                    
//                }                              
//                add_loaded_bytes($bytes);                                                             
//                if (isset ($_POST["xnzb"]) || isset ($_POST["cnzb"]))                                                                                
//                {                          
//                    echo $log . " bytes added<br>";                                    
//                }                              
                return array("articles"=>$articles,"pages"=>$pages,"indices"=>$indices,"exectime"=>$execution_arr);                                      
            }                                         
                                                                        
           # $this->error_number  = $response["status"];                                      
           # $this->error_message = $response["message"];                                      
            return NULL;                                      
        }                                      


        // Similar to the get_message_summary function, except that the processing is much                                      
        // lightweight with the return is just an array of message summaries instead of                                      
        // a tree plus a reference list.                                      
        function get_summary($start_id, $end_id) {                                                                               
            $bytes=0;                          
            $buf = $this->send_request("xover ".$start_id."-".$end_id);                                      
            $response = $this->parse_response($buf);                                      
                                                                               
            if ($response["status"] == ARTICLE_OVERVIEW) {                                      
                $buf = fgets($this->nntp, 4096);                                         

                $bytes += strlen($buf);                                   
                $result = array();                                      
                while (!preg_match("/^\.\s*$/", $buf)) {                                      
                    $elements = preg_split("/\t/", $buf);    
echo ':: ' . $buf . "\n";                                  
                    $nntp_id = $elements[0];                                      
                    $result[$nntp_id]["subject"] = decode_MIME_header($elements[1]);                                      

                    $from = decode_sender(decode_MIME_header($elements[2]));                                      
                    $result[$nntp_id]["from_name"] = $from["name"];                                      
                    $result[$nntp_id]["from_email"] = $from["email"];                                      
                                                                                       
                    $result[$nntp_id]["date"] = strtotime($elements[3]);                                      
                    if ($result[$nntp_id]["date"] == -1) {                                      
                        $result[$nntp_id]["date"] = $elements[3];                                      
                    }                                      
                                                                                       
                    $result[$nntp_id]["message_id"] = $elements[4];                                                                                       
                    $result[$nntp_id]["references"] = trim($elements[5]);                                      
                    $result[$nntp_id]["byte_count"] = $elements[6];                                      
                    $result[$nntp_id]["line_count"] = $elements[7];                                      

                    $bytes += strlen($buf);                                  
                    $buf = fgets($this->nntp, 4096);                                      
                }                                      
                                                                                   
              #  add_loaded_bytes($bytes);                                                             
                return $result;                                      
            }                                                                               

            $this->error_number = $response["status"];                                      
            $this->error_message = $response["message"];                                      
            return NULL;                                      
        }                                      



        function get_header($message_id) {                                      
            $bytes=0;                          
            $response = $this->parse_response($this->send_request("head ".$message_id));                                      
            if (($response["status"] == ARTICLE_HEAD) || ($response["status"] == ARTICLE_HEAD_BODY)) {                                      
                $header = "";                                      
                $buf = fgets($this->nntp, 4096);                                      
                $bytes += strlen($buf);                                     
                while (!preg_match("/^\.\s*$/", $buf)) {                                      
                    $header .= $buf;                                      
                    $buf = fgets($this->nntp, 4096);                                      
                    $bytes += strlen($buf);                                  
                }                                      
                                                                        
            #    add_loaded_bytes($bytes);                                                     
                return new MIME_message($header);                                      
            }                                      
                                                                               
            $this->error_number = $response["status"];                                      
            $this->error_message = $response["message"];                                      
            return NULL;                                      
        }                                      
                                                                           


        function get_article($message_id) {                                      
            $bytes=0;                          
            $response = $this->parse_response($this->send_request("article ".$message_id));                                      
            if (($response["status"] == ARTICLE_BODY) || ($response["status"] == ARTICLE_HEAD_BODY))                                      
            {                                      
                $message = "";                                      
                $buf = fgets($this->nntp, 4096);                                      
                $bytes += strlen($buf);                                     
                while (!preg_match("/^\.\s*$/", $buf)) {                                      
                    $message .= $buf;                                      
                    $buf = fgets($this->nntp, 4096);                                      
                    $bytes += strlen($buf);                                  
                }                                      
                                                                                   
             #   add_loaded_bytes($bytes);                                                     
                return new MIME_Message($message);                                      
            }                                      

            $this->error_number = $response["status"];                                      
            $this->error_message = $response["message"];                                      
            return NULL;                                      
        }                                      
                                                          

        function get_body_only($message_id,$decode=false) {                                       
            $bytes=0;                          
            $response = $this->parse_response($this->send_request("body ".$message_id));                                      
            if (($response["status"] == ARTICLE_BODY) || ($response["status"] == ARTICLE_HEAD_BODY))                                      
            {                
			    $len = 4096;                      
                $message = "";                                       
                $buf = fgets($this->nntp, $len);                                      
                $bytes += strlen($buf);                                     
                while (!preg_match("/^\.\s*$/", $buf)) {                                      
                    $message .= $buf;                                      
                    if ($decode)                                     
                    {                                     
                        uudecode_output  (trim($buf));                                     
                    }                                     
                    $buf = fgets($this->nntp, $len);                                      
                    $bytes += strlen($buf);                                  
                }                                         
                add_loaded_bytes($bytes);                                                     
                return $message;                                        
            }                                         
            $this->error_number = $response["status"];                                      
            $this->error_message = $response["message"];                                      
            return NULL;                                       
        }                                      
                                                                           
                                                                           
        function post_article($subject, $name, $email, $newsgroups, $references, $message, $files) {                                      
            global $messages_ini;                                      
                                                                               
            $from = encode_MIME_header($name)." <".$email.">";                                      
            $groups = "";                                      
            foreach ($newsgroups as $news) {                                      
                $groups = $groups.",".$news;                                      
            }                                      
            $groups = substr($groups, 1);                                      
            $current_time = date("D, d M Y H:i:s O", time());                                      
                                                                               
            if (strlen($groups) != 0) {                                      
                $response = $this->parse_response($this->send_request("post"));                                      
                                                                                   
                if ($response["status"] == ARTICLE_POST_READY) {                                      
                    $send_message = "";                                      

                    // Send the header                                      
                    $send_message .= "Subject: ".encode_MIME_header($subject)."\r\n";                                      
                    $send_message .= "From: ".$from."\r\n";                                      
                    $send_message .= "Newsgroups: ".$groups."\r\n";                                      
                    $send_message .= "Date: ".$current_time."\r\n";                                      
                    $send_message .= "User-Agent: Web-News v.1.6.2 (by Terence Yim)\r\n";                                      
                    $send_message .= "Mime-Version: 1.0\r\n";                                      
                                                                                       
                    if (sizeof($files) != 0) {    // Handling uploaded files                                      
                        srand();                                      
                        $boundary = "----------".rand().time();                                      
                        $send_message .= "Content-Type: multipart/mixed; boundary=\"".$boundary."\"\r\n";                                      
                        $boundary = "--".$boundary;                                      
                    } else {                                      
                        $boundary = "";                                      
                        $send_message .= "Content-Type: text/plain\r\n";                                      
                    }                                      

                    if ($references && (strlen($references) != 0)) {                                      
                        $send_message .= "References: ".$references."\r\n";                                      
                    }                                      

                    $send_message .= "\r\n";    // Header body separator                                      

                    $send_message .= create_message_body($message, $files, $boundary);                                      
                                                                                       
                    // Send the body                                      
                    fputs($this->nntp, $send_message);                                      

                    $response = $this->parse_response($this->send_request("\r\n."));                                      

                    if ($response["status"] == ARTICLE_POST_OK) {                                      
                        // Return the message sent with all the attachments stripped                                      
                        if (sizeof($files) != 0) {    // There is attachment, strip it                                      
                            $len = strpos($send_message, $boundary, strpos($send_message, $boundary) + strlen($boundary));                                      
                            $send_message = substr($send_message, 0, $len);                                      
                                                                                               
                            $send_message .= "\r\n";                                      
                            $send_message .= sizeof($files);                                      
                            $send_message .= $messages_ini["text"]["post_attachments"];                                      
                            $send_message .= "\r\n".$boundary."--";                                      
                        }                                      
                                                                                           
                        return new MIME_Message($send_message);                                      
                    }                                      
                }                                      
            }                                      
            return NULL;                                      
        }                                      
                                                                           
                                                                           
        function get_error_number() {                                      
            return $this->error_number;                                      
        }                                      
                                                                           
                                                                           
        function get_error_message() {                                      
            return $this->error_message;                                      
        }                                      
    }                                      
                                                                       
                                                                       
    class MessageInfo {                                      
        var $nntp_message_id;                                      
        var $subject;                                      
        var $from;                                      
        var $date;                                      
        var $message_id;                                      
        var $references;                                      
        var $byte_count;                                      
        var $line_count;                                      
    }                                      
                                                                       
                                                                       
    class MessageTreeNode {                                      
        var $message_info;                                      
        var $children;                                      
        var $show_children;                                      
                                                                           
        function MessageTreeNode($message_info) {                                      
            $this->message_info = $message_info;                                      
            $this->children = array();                                      
            $this->show_children = FALSE;                                      
        }                                      


        function set_show_children($show) {                                      
            $this->show_children = $show;                                      
        }                                      
                                                                           

        function set_show_all_children($show) {                                      
            $this->set_show_children($show);                                      
                                                                               
            $keys = $this->get_children_keys();                                      
            foreach ($keys as $key) {                                      
                $child =& $this->get_child($key);                                      
                $child->set_show_all_children($show);                                      
            }                                      
        }                                      


        function is_show_children() {                                      
            return $this->show_children;                                      
        }                                      


        function set_message_info($message_info) {                                      
            $this->message_info = $message_info;                                      
        }                                      
                                                                           
                                                                           
        function get_message_info() {                                      
            return $this->message_info;                                      
        }                                      
                                                                           
                                                                           
        function set_child($key, &$child) {                                      
            $this->children[$key] = $child;                                      
        }                                      
                                                                           
                                                                           
        function &get_child($key) {                                      
            if (isset($this->children[$key])) {                                      
                return $this->children[$key];                                      
            } else {                                      
                return NULL;                                      
            }                                      
        }                                      
                                                                           
                                                                           
        function count_children() {                                      
            return sizeof($this->children);                                      
        }                                      


        function get_children_keys() {                                      
            return array_keys($this->children);                                      
        }                                      
                                                                           
                                                                           
        function get_children($start = 0, $length = -1) {                                      
            if ($length == -1) {                                      
                return array_slice($this->children, $start);                                      
            } else {                                      
                return array_slice($this->children, $start, $length);                                      
            }                                      
        }                                      


        function insert_message_info($message_info, $flat_tree) {                                      
            $node =& $this;                                      

            if (!$flat_tree) {                                      
                foreach ($message_info->references as $ref_no) {                                      
                    $tmpnode =& $node->get_child($ref_no);                                      
                                                                                       
                    if ($tmpnode != NULL) {                                      
                        $node =& $tmpnode;                                      
                    } else {                                      
                        $tmp_info = new MessageInfo();                                      
                        $tmp_info->nntp_message_id = -1;                                      
                        $tmp_info->message_id = $ref_no;                                      
                        $tmp_info->date = 0;                                      
                        $newnode = new MessageTreeNode($tmp_info);                                      
                        $node->set_child($ref_no, $newnode);                                      
                                                                                           
                        $node =& $node->get_child($ref_no);                                      
                    }                                      
                }                                      
            }                                      
                                                                               
            $child =& $node->get_child($message_info->message_id);                                      
                                                                               
            if ($child == NULL) {                                      
                $child = new MessageTreeNode($message_info);                                      
            } else {                                      
                $child->set_message_info($message_info);                                      
            }                                      

            $node->set_child($message_info->message_id, $child);                                      
        }                                      
                                                                           
                                                                           
        function merge_tree($root_node) {                                      
            // If 2 children have the same key, the new one will replace the current one                                      
            $keys = $root_node->get_children_keys();                                      
                                                                               
            foreach ($keys as $key) {                                      
                $child =& $root_node->get_child($key);                                      
                $message_info = $child->get_message_info();                                      
                $ref_list = $message_info->references;                                      
                $node =& $this;                                      
                                                                                   
                if (sizeof($ref_list) != 0) {                                      
                    foreach ($ref_list as $ref) {                                      
                        $tmp =& $node->get_child($ref);                                      
                        if ($tmp != NULL) {                                      
                            $node =& $tmp;                                      
                        }                                      
                    }                                      
                }                                      
                                                                                   
                $node->set_child($key, $child);                                      
            }                                      
        }                                      
                                                                           

        function compact_tree() {                                      

            $children_keys = $this->get_children_keys();                                      
                                                                               
            foreach ($children_keys as $child_key) {                                      
                $child =& $this->get_child($child_key);                                      
                $child->compact_tree();                                      
                                                                                   
                $info = $child->get_message_info();                                      
                if ($info->nntp_message_id == -1) {                                                                                       
                    // Need to remove this child and promote it's children                                      
                    $keys = $child->get_children_keys();                                      
                                                                                       
                    foreach ($keys as $key) {                                      
                        $tmp_node =& $child->get_child($key);                                      
                        $this->set_child($key, $tmp_node);                                      
                    }                                      
                    unset($this->children[$child_key]);                                      
                }                                      
            }                                      
        }                                      


        function sort_message($field, $asc) {                                      
            $function_name = "compare_by_".$field;                                      
                                                                               
            if ($asc) {                                      
                $function_name .= "_asc";                                      
            } else {                                      
                $function_name .= "_desc";                                      
            }                                      
                                                                               
            if (method_exists($this, $function_name)) {                                      
                if (sizeof($this->children) != 0) {                                      
                    uasort($this->children, array($this, $function_name));                                                                               
                }                                                                       
            }                                      
        }                                      


        function deep_sort_message($field, $asc) {                                      
            $this->sort_message($field, $asc);                                      
                                                                               
            if (sizeof($this->children) != 0) {                                      
                $keys = $this->get_children_keys();                                      
                                                                                   
                foreach ($keys as $key) {                                      
                    $child =& $this->get_child($key);                                      
                    $child->deep_sort_message($field, $asc);                                      
                }                                      
            }                                                                       
        }                                      
                                                                               
                                                                               
        function compare_by_subject_asc($node_1, $node_2) {                                      
            $subject_1 = $node_1->get_message_info();                                      
            $subject_2 = $node_2->get_message_info();                                      
                                                                               
            $subject_1 = $subject_1->subject;                                      
            $subject_2 = $subject_2->subject;                                      
                                                                               
            return strcasecmp($subject_1, $subject_2);                                      
        }                                      


        function compare_by_subject_desc($node_1, $node_2) {                                      
            $subject_1 = $node_1->get_message_info();                                      
            $subject_2 = $node_2->get_message_info();                                      
                                                                               
            $subject_1 = $subject_1->subject;                                      
            $subject_2 = $subject_2->subject;                                      
                                                                               
            return strcasecmp($subject_2, $subject_1);                                      
        }                                      


        function compare_by_from_asc($node_1, $node_2) {                                      
            $from_1 = $node_1->get_message_info();                                      
            $from_2 = $node_2->get_message_info();                                      
                                                                               
            $from_1 = $from_1->from["name"];                                      
            $from_2 = $from_2->from["name"];                                      
                                                                               
            return strcasecmp($from_1, $from_2);                                      
        }                                      


        function compare_by_from_desc($node_1, $node_2) {                                      
            $from_1 = $node_1->get_message_info();                                      
            $from_2 = $node_2->get_message_info();                                      
                                                                               
            $from_1 = $from_1->from["name"];                                      
            $from_2 = $from_2->from["name"];                                      
                                                                               
            return strcasecmp($from_2, $from_1);                                      
        }                                      


        function compare_by_date_asc($node_1, $node_2) {                                      
            $date_1 = $node_1->get_message_info();                                      
            $date_2 = $node_2->get_message_info();                                      
                                                                               
            $date_1 = $date_1->date;                                      
            $date_2 = $date_2->date;                                      
                                                                               
            if ($date_1 < $date_2) {                                      
                return -1;                                      
            } else if ($date_1 > $date_2) {                                      
                return 1;                                      
            } else {                                      
                return 0;                                      
            }                                      
        }                                      


        function compare_by_date_desc($node_1, $node_2) {                                      
            $date_1 = $node_1->get_message_info();                                      
            $date_2 = $node_2->get_message_info();                                      
                                                                               
            $date_1 = $date_1->date;                                      
            $date_2 = $date_2->date;                                      
                                                                               
            if ($date_1 > $date_2) {                                      
                return -1;                                      
            } else if ($date_1 < $date_2) {                                      
                return 1;                                      
            } else {                                      
                return 0;                                      
            }                                      
        }                                                                           
    }                                                                           
?>
