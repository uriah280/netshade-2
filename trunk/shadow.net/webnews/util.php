<?php                                                                                                                                                                        
/*                                                                                                                                                                        
    This PHP script is licensed under the GPL                                                                                                                                                                        

    Author: Terence Yim                                                                                                                                                                        
    E-mail: chtyim@gmail.com                                                                                                                                                                        
    Homepage: http://web-news.sourceforge.net                                                                                                                                                                        
*/                                                                                                                                                                        
                                                                                               
    require("uucoder.php");                                                                                                                                                        
    require("yenc.php");                         
    require("nzb.php");  
#    require("xml.php");                                                                                  
#    require("addon/decoder.php");                                                                                                                                                                        
#    require("includes/actions/act_methods.php");                                                                                                                                                                           
    $MIME_TYPE_MAP = array("txt"=>"text/plain",                                                                                                                                                                        
                            "html"=>"text/html",                                                                                                                                                                        
                            "htm"=>"text/html",                                                                                                                                                                        
                            "aif"=>"audio/x-aiff",                                                                                                                                                                        
                            "aiff"=>"audio/x-aiff",                                                                                                                                                                        
                            "aifc"=>"audio/x-aiff",                                                                                                                                                                        
                            "wav"=>"audio/wav",                                                                                                                                                                        
                            "mp3"=>"audio/mp3",                                                                                                                                                                        
                            "wmv"=>"video/mpeg",                                                                                                                                                                        
                            "gif"=>"image/gif",                                                                                                                                                                        
                            "jpg"=>"image/jpeg",                                                                                                                                                                        
                            "jpeg"=>"image/jpeg",                                                                                                                                                                        
                            "tif"=>"image/tiff",                                                                                                                                                                        
                            "tiff"=>"image/tiff",                                                                                                                                                                        
                            "png"=>"image/x-png",                                                                                                                                                                        
                            "xbm"=>"image/x-xbitmap",                                                                                                                                                                        
                            "bmp"=>"image/bmp",                                                                                                                                                                        
                            "avi"=>"video/x-msvideo",                                                                                                                                                                        
                            "mpg"=>"video/mpeg",                                                                                                                                                                        
                            "mov"=>"video/mov",                                                                                                                                                                        
                            "mpeg"=>"video/mpeg",                                                                                                                                                                        
                            "mpe"=>"video/mpeg",                                                                                                                                                                        
                            "dll"=>"application/unknown",                                                                                                                                                                        
                            "exe"=>"application/unknown",                                                                                                                                                                        
                            "ai"=>"application/postscript",                                                                                                                                                                        
                            "eps"=>"application/postscript",                                                                                                                                                                        
                            "ps"=>"application/postscript",                                                                                                                                                                        
                            "hqx"=>"application/mac-binhex40",                                                                                                                                                                        
                            "pdf"=>"application/pdf",                                                                                                                                                                        
                            "rar"=>"application/x-zip-compressed",                                                                                                                                                                        
                            "par2"=>"application/x-zip-compressed",                                                                                                                                                                        
                            "zip"=>"application/x-zip-compressed",                                                                                                                                                                        
                            "gz"=>"application/x-gzip-compressed",                                                                                                                                                                        
                            "doc"=>"application/msword",                                                                                                                                                                        
                            "xls"=>"application/vnd.ms-excel",                                                                                                                                                                        
                            "ppt"=>"application/vnd.ms-powerpoint");                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function parse_MIME_header ($str)                                                                                                                                                                        
    {                                                                                                                                                                        
       global $MIME_TYPE_MAP;                                                                                                                                                                        
       reset ($MIME_TYPE_MAP);                                                                                                                                                                        
       $ret = "text/plain";                                                                                                                                                                        
       while (list ($a,$b) = each ($MIME_TYPE_MAP))                                                                                                                                                                        
       {                                                                                                                                                                        
          if (strpos (strtolower($str), "." . $a) !== false)                                                                                                                                                                        
          {                                                                                                                                                                        
              $ret= $b;                                                                                                                                                                        
              break;                                                                                                                                                                        
          }                                                                                                                                                                        
       }                                                                                                                                                                        
       return $ret;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
    function decode_MIME_header($str) {                                                                                                                                                                        
        while (preg_match("/(.*)=\?.*\?q\?(.*)\?=(.*)/i", $str, $matches)) {                                                                                                                                                                        
            $str = str_replace("_", " ", $matches[2]);                                                                                                                                                                        
            $str = $matches[1].quoted_printable_decode($str).$matches[3];                                                                                                                                                                        
        }                                                                                                                                                                        
        while (preg_match("/=\?.*\?b\?.*\?=/i", $str)) {                                                                                                                                                                        
            $str = preg_replace("/(.*)=\?.*\?b\?(.*)\?=(.*)/ie", "'$1'.base64_decode('$2').'$3'", $str);                                                                                                                                                                        
        }                                                                                                                                                                        

        return $str;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function encode_MIME_header($str) {                                                                                                                                                                        
        if (is_non_ASCII($str)) {                                                                                                                                                                        
            $result = "=?ISO-8859-1?Q?";                                                                                                                                                                        
            for ($i = 0;$i < strlen($str);$i++) {                                                                                                                                                                        
                $ascii = ord($str{$i});                                                                                                                                                                        
                if ($ascii == 0x20) {    // Space                                                                                                                                                                        
                    $result .= "_";                                                                                                                                                                        
                } else if (($ascii == 0x3D) || ($ascii == 0x3F) || ($ascii == 0x5F) || ($ascii > 0x7F)) {    // =, ?, _, 8 bit                                                                                                                                                                        
                    $result .= "=".dechex($ascii);                                                                                                                                                                        
                } else {                                                                                                                                                                        
                    $result .= $str{$i};                                                                                                                                                                        
                }                                                                                                                                                                        
            }                                                                                                                                                                        
            $result .= "?=";                                                                                                                                                                        
        } else {                                                                                                                                                                        
            $result = $str;                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        return $result;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function is_non_ASCII($str) {                                                                                                                                                                        
        for ($i = 0;$i < strlen($str);$i++) {                                                                                                                                                                        
            if (ord($str{$i}) > 0x7f) {                                                                                                                                                                        
                return true;                                                                                                                                                                        
            }                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        return FALSE;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function htmlescape($str) {                                                                                                                                                                        
        $str = htmlspecialchars($str);                                                                                                                                                                        
        return preg_replace("/&amp;#(x?[0-9A-F]+);/", "&#\\1;", $str);                                                                                                                                                                        
    }                                                                                                                                                                        


    function chop_str($str, $len) {                                                                                                                                                                        
        if (strlen($str) > $len) {                                                                                                                                                                        
            $str = substr($str, 0, $len - 3)."...";                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        return $str;                                                                                                                                                                        
    }                                                                                                                                                                        
                      
    function mid_str($str, $len) {                                                                                                                                                                        
        if (strlen($str) > $len) {                                                                                                                                                                        
            $str = substr($str, 0, floor($len/2)) . "..." . substr($str, strlen($str)-floor($len/2)) ;                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        return $str;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
    function wrap_str($str, $len) {                                                                                                                                                                        
        $ret = "";                                                                                                                                                                        
        for ($e=0;$e<strlen($str);$e++)                                                                                                                                                                        
        {                                                                                                                                                                         
           $ret .= substr($str,$e,1);                                                                                                                                                                        
           if ($e>0 && $e % $len==0)                                                                                                                                                                        
           {                                                                                                                                                                        
               $ret .= "\n<font color='red'>&not;</font><br>\n";                                                                                                                                                                        
           }                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        return $ret;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function format_date($date) {                                                                                                                                                                        
        global $today_color;                                                                                                                                                                        
        global $week_color;                                                                                                                                                                        
                                                                                                                                                                                
        $current = time();                                                                                                                                                                        
        $current_date = getdate($current);                                                                                                                                                                        
                                                                                                                                                                                
        $today = mktime(0, 0, 0, $current_date["mon"], $current_date["mday"], $current_date["year"]);                                                                                                                                                                        
//        $last_week = $today - ($current_date["wday"])*86400;                                                                                                                                                                        
        $last_week = $today - 518400;                                                                                                                                                                        

        if ($date >= $today) {                                                                                                                                                                        
            // Today                                                                                                                                                                        
            return "<font color=\"#".$today_color."\">"."Today ".date("h:i a", $date)."</font>";                                                                                                                                                                        
        } elseif ($date >= $last_week) {                                                                                                                                                                        
            // Within one week                                                                                                                                                                        
            return "<font color=\"#".$week_color."\">".date("D, h:i a", $date)."</font>";                                                                                                                                                                        
        } else {                                                                                                                                                                        
            return date("d-M-Y h:i a", $date);                                                                                                                                                                        
        }                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function decode_sender($sender) {                                                                                                                                                                        
        if (preg_match("/(['|\"])?(.*)(?(1)['|\"]) <([\w\-=!#$%^*'+\\.={}|?~]+@[\w\-=!#$%^*'+\\.={}|?~]+[\w\-=!#$%^*'+\\={}|?~])>/", $sender, $matches)) {                                                                                                                                                                        
            // Match address in the form: Name <email@host>                                                                                                                                                                        
            $result["name"] = $matches[2];                                                                                                                                                                        
            $result["email"] = $matches[sizeof($matches) - 1];                                                                                                                                                                        
        } elseif (preg_match("/([\w\-=!#$%^*'+\\.={}|?~]+@[\w\-=!#$%^*'+\\.={}|?~]+[\w\-=!#$%^*'+\\={}|?~]) \((.*)\)/", $sender, $matches)) {                                                                                                                                                                        
            // Match address in the form: email@host (Name)                                                                                                                                                                        
            $result["email"] = $matches[1];                                                                                                                                                                        
            $result["name"] = $matches[2];                                                                                                                                                                        
        } else {                                                                                                                                                                        
            // Only the email address present                                                                                                                                                                        
            $result["name"] = $sender;                                                                                                                                                                        
            $result["email"] = $sender;                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        $result["name"] = str_replace("\"", "", $result["name"]);                                                                                                                                                                        
        $result["name"] = str_replace("'", "", $result["name"]);                                                                                                                                                                        

        return $result;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function replace_links($matches) {                                                                                                                                                                        
        if (!preg_match("/^(?:http|https|ftp|ftps|news):\/\//i", $matches[1])) {                                                                                                                                                                        
            return "<a href=\"mailto:$matches[2]\">$matches[2]</a>";                                                                                                                                                                        
        } else {                                                                                                                                                                        
            return $matches[1].$matches[2];                                                                                                                                                                        
        }                                                                                                                                                                        
    }                                                                                                                                                                        

    function add_html_links($str) {                                                                                                                                                                        
        // Add link for e-mail address                                                                                                                                                                        
        $str = preg_replace_callback("/((?:http|https|ftp|ftps|news):\/\/.*)?([\w\-=!#$%^*'+\\.={}|?~]+@[\w\-=!#$%^*'+\\.={}|?~]+[\w\-=!#$%^*'+\\={}|?~])/i", "replace_links", $str);                                                                                                                                                                        

        // Add link for web and newsgroup                                                                                                                                                                        
        $str = preg_replace("/(http|https|ftp|ftps|news)(:\/\/[\w;\/?:@&=+$,\-\.!~*'()%#&]+)/i", "<a href=\"$1$2\">$1$2</a>", $str);                                                                                                                                                                        

        return $str;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function validate_email($email) {                                                                                                                                                                        
        return preg_match("/[\w\-=!#$%^*'+\\.={}|?~]+@[\w\-=!#$%^*'+\\.={}|?~]+[\w\-=!#$%^*'+\\={}|?~]/", $email);                                                                                                                                                                        
    }                                                                                                                                                                        

    function preview_square ($data)                                                                                                                                                                        
    {                                                                                                                                                                        
       $image_url = "newsgroups.php?message_id=X";                                                                                                                                                                        
       $image_url .= "&gp=" . $data["index"];                                                                                                                                                                        
       $image_url .= "&art_group=" . $data["group"];                                                                                                                                                                         
       $image_url .= "&pp_w=" . $data["width"];                                                                                                                                                                         
       $image_url .= "&pp_y=" . $data["top"];                                                                                                                                                                         
       $image_url .= "&pp_x=" . $data["left"];                                                                                                                                                                         
       $image_url .= "&pp_s=" . $data["fontsize"];                                                                                                                                                                        
       $image_url .= "&pp_a=" . $data["angle"]; ?>                                                                                                                                                                         
                                                                                                                                                                               
        <div style="width:<?= $data["width"] ?>;height:<?= $data["height"] ?>;overflow:hidden">                                                                                                                                                                        
         <a target="_blank" href="newsgroups.php?g=<?= $data["group"] ?>">                                                                                                                                                                        
         <img border='0' id='<?= $data["id"] ?>'                                                                                                                                                                        
              onerror="MM_findObj('<?= $data["id"] ?>').src='newsgroups.php?a=rand'"                                                                                                                                                                         
              src="<?= $image_url ?>"                                                                                                                                                                        
              ></a>                                                                                                                                                                        
          </div>  <?                                                                                                                                                                        
    }   

    function fsave ($name, $text)
    {
        $fp = fopen($name, 'w');
        fwrite ($fp, $text);
        fclose ($fp);
    }
                                                                                                                                                                            
    function decode_message_content($part, $test=false) {                                                                                                                                                                        
        $encoding = $part["header"]["content-transfer-encoding"];                                                                                                                                                                        
        if ($test) 
        {
            echo $encoding;
            fsave ('uudtext.txt', $part['body']);
        }
                                                                                                                                                                               
        if (stristr($encoding, "quoted-printable")) {                                                                                                                                                                        
            return quoted_printable_decode($part["body"]);                                                                                                                                                                        
        } else if (stristr($encoding, "base64")) {                                                                                                                                                                        
            return base64_decode($part["body"]);                                                                                                                                                                        
        } else if (stristr($encoding, "uuencode")) {                                                                                                                                                                        
            return uudecode($part["body"], $test);                                                                                                                                                                        
        } else if (stristr($encoding, "yenc")) {                                                                                                                                                                        
            $enc  = new yenc();                                                                                                                                                                         
            return $enc->decode($part["body"]);                                                                                                                                                                           
        } else {    // No need to decode                                                                                                                                                                        
            return $part["body"];                                                                                                                                                                        
        }                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
    function cache_file ($msgid, $limit,$gr=false)                                                                                                                                                                        
    {                                                                                                                                                                        
        return CACHE_PATH . "asset/" . base64_encode( "_____" . $msgid . ($gr?"_".$gr:"") . "_" . $limit . "_cache_") . ".jpg";                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function email_message_content($data, $fileatt_name, $fileatt_type="image/jpeg")                                                                                                                                                                        
    {                                                                                                                                                                        

        global $breadcrumb;                                                                                                                                                                        
        $to      = $_POST['email'];                                                                                                                                                                         
        $from    = get_profile_value($host, "email"); # "support@cyber8.net"; # $_POST['from'];                                                                                                                                                                         
        $subject = $_POST['esubj'];                                                                                                                                                                         
        $message = $_POST['etext'];                                                                                                                                                                         
        $headers = "From: $from";                                                                                                                                                                        
                                                                                                                                                                                 
        $breadcrumb .= "-" . $to;                                                                                                                                                                        
                                                                                                                                                                                
          // Generate a boundary string                                                                                                                                                                         
         $semi_rand = md5(time());                                                                                                                                                                         
         $mime_boundary = "==Multipart_Boundary_x{$semi_rand}x";                                                                                                                                                                         
                                                                                                                                                                                  
         // Add the headers for a file attachment                                                                                                                                                                         
         $headers .= "\nMIME-Version: 1.0\n" .                                                                                                                                                                         
                     "Content-Type: multipart/mixed;\n" .                                                                                                                                                                         
                     " boundary=\"{$mime_boundary}\"";                                                                                                                                                                        
                                                                                                                                                                                             
         // Add a multipart boundary above the plain message                                                                                                                                                                         
         $message = "This is a multi-part message in MIME format.\n\n" .                                                                                                                                                                         
                    "--{$mime_boundary}\n" .                                                                                                                                                                         
                    "Content-Type: text/plain; charset=\"iso-8859-1\"\n" .                                                                                                                                                                         
                    "Content-Transfer-Encoding: 7bit\n\n" .                                                                                                                                                                         
                    "+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=\n\n" .                                                
                    $message .                                                   
                    "\n\n+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=" .                                                
                    "\n\n For more, visit http://www.101stratford.com/nntp/skin.php now!\n\n";                                                                                                                                                                        
                                                                                                                                                                                
                                                                                                                                                                                             
         // Base64 encode the file data                                                                                                                                                                         
         $data = chunk_split(base64_encode($data));                                                                                                                                                                        
                                                                                                                                                                                             
         // Add file attachment to the message                                                                                                                                                                         
         $message .= "--{$mime_boundary}\n" .                                                                                                                                                                         
                     "Content-Type: {$fileatt_type};\n" .                                                                                                                                                                         
                     " name=\"{$fileatt_name}\"\n" .                                                                                                                                                                         
                     "Content-Disposition: attachment;\n" .                                                                                                                                                                         
                     " filename=\"{$fileatt_name}\"\n" .                                                                                                                                                                         
                     "Content-Transfer-Encoding: base64\n\n" .                                                                                                                                                                         
                     $data . "\n\n" .                                                                                                                                                                         
                     "--{$mime_boundary}--\n";                                                                                                                                                                         
                                                                                                                                                                                             
        // Send the message                                                                                                                                                                         
        return @mail($to, $subject, $message, $headers);                                                                                                                                                                          
    }                                                                                                                                                                        
                                                                                                                                                                            
     // This function return an appropriately encoded message body.                                                                                                                                                                        
    function create_message_body($message, $files, $boundary = "") {                                                                                                                                                                        
        $message_body = "";                                                                                                                                                                        
                                                                                                                                                                                
        // Need to process the message to change line begin with . to ..                                                                                                                                                                        
        $message = preg_replace(array("/\r\n/","/^\.(.*)/m", "/\n/"), array("\n","..$1", "\r\n"), $message);                                                                                                                                                                        

        if (sizeof($files) != 0) {    // Handling uploaded files. Format it as MIME multipart message                                                                                                                                                                        
            // Read the content of each file                                                                                                                                                                        
            $counter = 0;                                                                                                                                                                        
            $message_body .= "This is a multi-part message in MIME format\r\n";                                                                                                                                                                        
            $message_body .= $boundary."\r\n";                                                                                                                                                                        
            $message_body .= "Content-Type: text/plain\r\n";                                                                                                                                                                        
            $message_body .= "\r\n";                                                                                                                                                                        
            $message_body .= $message;                                                                                                                                                                        
            $message_body .= "\r\n\r\n";                                                                                                                                                                        

            foreach ($files as $file) {                                                                                                                                                                        
                $message_body .= $boundary."\r\n";                                                                                                                                                                        
                $message_body .= "Content-Type: ".$file['type']."\r\n";                                                                                                                                                                        
                $message_body .= "Content-Transfer-Encoding: base64\r\n";                                                                                                                                                                        
                $message_body .= "Content-Disposition: inline; filename=\"".$file['name']."\"\r\n";                                                                                                                                                                        
                $message_body .= "\r\n";                                                                                                                                                                        

                $fd = fopen($file['tmp_name'], "rb");                                                                                                                                                                        
                $tmp_buf = "";                                                                                                                                                                        
                while ($buf = fread($fd, 1024)) {                                                                                                                                                                        
                    $tmp_buf .= $buf;                                                                                                                                                                        
                }                                                                                                                                                                        
                fclose($fd);                                                                                                                                                                        
                $tmp_buf = base64_encode($tmp_buf);                                                                                                                                                                        
                $offset = 0;                                                                                                                                                                        
                while ($offset < strlen($tmp_buf)) {                                                                                                                                                                        
                    $message_body .= substr($tmp_buf, $offset, 72)."\r\n";                                                                                                                                                                        
                    $offset += 72;                                                                                                                                                                        
                }                                                                                                                                                                        
            }                                                                                                                                                                        
                                                                                                                                                                                    
            $message_body .= $boundary."--\r\n";                                                                                                                                                                        
        } else {    // Write the plain text only                                                                                                                                                                        
            $message_body .= $message;                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        return $message_body;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
    function filter_html($body) {                                                                                                                                                                        
        global $filter_script;                                                                                                                                                                        
                                                                                                                                                                                
        // rename the body tag                                                                                                                                                                        
        $body = preg_replace("/<(\s*)(\/?)(\s*)(body)(.*?)>/is", "<\\2x\\4\\5>", $body);                                                                                                                                                                        
                                                                                                                                                                                
        // Filter the unwanted tag block                                                                                                                                                                        
        $filter_list = "(style";                                                                                                                                                                        
        if ($filter_script) {                                                                                                                                                                        
            $filter_list .= "|script";                                                                                                                                                                        
        }                                                                                                                                                                        
        $filter_list .= ")";                                                                                                                                                                        
        return preg_replace("/<(\s*)".$filter_list."(.*?)>(.*?)<(\s*)\/(\s*)".$filter_list."(\s*)>/si", "", $body);                                                                                                                                                                        
    }                                                                                                                                                                        


/*                                                                                                                                                                        
    function check_email_list($email) {                                                                                                                                                                        
        global $namelist;                                                                                                                                                                        

        clearstatcache();                                                                                                                                                                        
        if (isset($namelist) && file_exists($namelist)) {                                                                                                                                                                        
            $db = dba_open($namelist, "r", "gdbm");                                                                                                                                                                        
            return dba_exists($email, $db);                                                                                                                                                                        
        } else {                                                                                                                                                                        
            return TRUE;                                                                                                                                                                        
        }                                                                                                                                                                        
    }                                                                                                                                                                        
*/                                                                                                                                                                        

                                                                                                                                                                            
    function get_content_type($file) {                                                                                                                                                                        
        global $MIME_TYPE_MAP;                                                                                                                                                                        
        $extension = strtolower(substr(strrchr($file, '.'), 1));                                                                                                                                                                        
                                                                                                                                                                                
        if (array_key_exists($extension, $MIME_TYPE_MAP)) {                                                                                                                                                                        
            return $MIME_TYPE_MAP[$extension];                                                                                                                                                                        
        }                                                                                                                                                                            
                                                                                                                                                                                
        return "application/octet-stream";                                                                                                                                                                        
    }                                                                                                                                                                            


    function is_requested($name) {                                                                                                                                                                        
        return (isset($_GET[$name]) || isset($_POST[$name]));                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function get_request($name) {                                                                                                                                                                        
        if (isset($_GET[$name])) {                                                                                                                                                                        
            return $_GET[$name];                                                                                                                                                                        
        } else if (isset($_POST[$name])) {                                                                                                                                                                        
            return $_POST[$name];                                                                                                                                                                        
        } else {                                                                                                                                                                        
            return "";                                                                                                                                                                        
        }                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function verify_login($username, $password) {                                                                                                                                                                        
        global $nntp_server;                                                                                                                                                                        
        global $proxy_server;                                                                                                                                                                        
        global $proxy_port;                                                                                                                                                                        
        global $proxy_user;                                                                                                                                                                        
        global $proxy_pass;                                                                                                                                                                        
                                                                                                                                                                            
        if (strlen($username) > 0) {    // Won't allow empty user name                                                                                                                                                                        
            // Create a dummy connection for authentication                                                                                                                                                                        
            $nntp = new NNTP($nntp_server, $username, $password, $proxy_server, $proxy_port, $proxy_user, $proxy_pass);                                                                                                                                                                        
            $result = $nntp->connect();                                                                                                                                                                        
                                                                                                                                                                                    
            $nntp->quit();                                                                                                                                                                        
                                                                                                                                                                                    
            return $result;                                                                                                                                                                        
        } else {                                                                                                                                                                        
            return FALSE;                                                                                                                                                                        
        }                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function construct_url($name) {                                                                                                                                                                        
        $result = parse_url($name);                                                                                                                                                                        
        $url = "";                                                                                                                                                                        
        $mark = FALSE;                                                                                                                                                                        
                                                                                                                                                                                
        if (!$result["scheme"]) {                                                                                                                                                                        
            if ($_SERVER["HTTPS"] != "on") {                                                                                                                                                                        
                $url = "http";                                                                                                                                                                        
            } else {                                                                                                                                                                        
                $url = "https";                                                                                                                                                                        
            }                                                                                                                                                                        
        } else {                                                                                                                                                                        
            $url = $result["scheme"];                                                                                                                                                                        
        }                                                                                                                                                                        
        $url .= "://";                                                                                                                                                                        
                                                                                                                                                                                
        if ($result["user"]) {                                                                                                                                                                        
            $url .= $result["user"];                                                                                                                                                                        
            $mark = TRUE;                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        if ($result["pass"]) {                                                                                                                                                                        
            $url .= ":".$result["pass"];                                                                                                                                                                        
            $mark = TRUE;                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        if ($mark) {                                                                                                                                                                        
            $url .= "@";                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        if ($result["host"]) {                                                                                                                                                                        
            $url .= $result["host"];                                                                                                                                                                        
        } else {                                                                                                                                                                        
            $url .= $_SERVER['HTTP_HOST'];                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        if ($result["path"][0] != '/') {                                                                                                                                                                                    
            $url .= dirname($_SERVER['REQUEST_URI'])."/";                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        $url .= $result["path"];                                                                                                                                                                        
                                                                                                                                                                                
        if ($result["query"]) {                                                                                                                                                                        
            $url .= "?".$result["query"];                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        if ($result["fragment"]) {                                                                                                                                                                        
            $url .= "#".$result["fragment"];                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        return $url;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function read_ini_file($file, $section=FALSE) {                                                                                                                                                                        
        $fp = fopen($file, "r");                                                                                                                                                                        
        if (!$fp) {                                                                                                                                                                        
            return FALSE;                                                                                                                                                                        
        }                                                                                                                                                                        
                                                                                                                                                                                
        $ini = array();                                                                                                                                                                        
        while (($buf = fgets($fp, 1024))) {                                                                                                                                                                        
            $buf = trim($buf);                                                                                                                                                                        
            if (strlen($buf) == 0) {                                                                                                                                                                        
                continue;                                                                                                                                                                        
            }                                                                                                                                                                        
            if ($buf{0} != ';') {    // Skip the comment                                                                                                                                                                        
                if ($buf{0} == '['){                                                                                                                                                                        
                    if ($section) {                                                                                                                                                                        
                        $pos = strpos($buf, ']');                                                                                                                                                                        
                        if (!$pos) {                                                                                                                                                                        
                            return FALSE;                                                                                                                                                                        
                        }                                                                                                                                                                        
                        $section_name = substr($buf, 1, $pos - 1);                                                                                                                                                                        
                        $ini[$section_name] = array();                                                                                                                                                                        
                    }                                                                                                                                                                        
                } else if (strpos($buf, "=") !== FALSE) {                                                                                                                                                                        
                    list($key, $value) = split("=", $buf, 2);                                                                                                                                                                        
                    $value = preg_replace("/^(['|\"])?(.*?)(?(1)['|\"])$/", "\\2", trim($value));                                                                                                                                                                        

                    if ((strlen($key) != 0) && (strlen($value) != 0)) {                                                                                                                                                                                            
                        if (isset($section_name)) {                                                                                                                                                                        
                            $ini[$section_name][$key] = $value;                                                                                                                                                                        
                        } else {                                                                                                                                                                        
                            $ini[$key] = $value;                                                                                                                                                                        
                        }                                                                                                                                                                        
                    }                                                                                                                                                                        
                }                                                                                                                                                                        
            }                                                                                                                                                                            
        }                                                                                                                                                                        
        fclose($fp);                                                                                                                                                                        
                                                                                                                                                                                
        return $ini;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            
    function make_search_pattern($query) {                                                                                                                                                                        
        $words = preg_split("/(['|\"])?(\w+[\w ]*?)(?(1)['|\"])/", $query, -1, PREG_SPLIT_NO_EMPTY | PREG_SPLIT_DELIM_CAPTURE);                                                                                                                                                                        
                                                                                                                                                                                
        $search_pat = "";                                                                                                                                                                        
        for ($i = 0;$i < sizeof($words);$i++) {                                                                                                                                                                        
            if (!preg_match("/^[\s'\"]*$/", $words[$i])) {                                                                                                                                                                        
                $search_pat .= "|(".preg_quote(trim($words[$i]),"/").")";                                                                                                                                                                        
            }                                                                                                                                                                        
        }                                                                                                                                                                        
        $search_pat = "/".substr($search_pat, 1)."/i";                                                                                                                                                                        
                                                                                                                                                                                
        return $search_pat;                                                                                                                                                                        
    }                                                                                                                                                                        
                                                                                                                                                                            
                                                                                                                                                                            

function exact_millisec()                                                                                                                                                                         
{                                                                                                                                                                         
    list($u,$s) = explode(" ",microtime());                                                                                                                                                                         
    $s = date("U");                         
 return $s+$u ; 
} 
 
 

function WriteToFile($path, $content) 
{ 
 if(file_exists($path)) 
 { 
  unlink ($path); 
 } 
 $fp = fopen($path, 'w'); 
 fwrite($fp, $content); 
 fclose($fp);
} 
