<?
define ('MEDIA_DIR', '/var/www/temp/data/download');
require ("usenet.db.php");

function Page_Load ()
{
    $db = new Usenet_Connector;
    $db->Execute ('DELETE FROM MediaIndex');
    Recurse (MEDIA_DIR);
}


function Recurse ($path)
{
    $db = new Usenet_Connector;

    $files = scandir ($path);
    $subs = array ();
    foreach ($files as $file) {
        if ($file=='.'||$file=='..') continue;
        $full = "{$path}/{$file}";
        if (is_dir ($full)) {
            $subs[] = $full;
            continue;
        }
        if (strpos($file, '.xml')!==false) {
            $unpacked = simplexml_load_file($full); 
            if (!$unpacked) continue;
            $temp  = explode ('/', $path);
            $group = array_pop($temp);
            $media = (string) $unpacked->media;
            $image = (string) $unpacked->image; 
            $id    = str_replace ('.xml', '', $file);
            if (!file_exists($image)) continue;


            $subject  = "";
            $data_uri = "/var/www/temp/data/index/{$group}.xml";
            $query    = "//article[contains(id, '{$id}')]";

            if (file_exists($data_uri)) {
                $data_xml = simplexml_load_file($data_uri); 
                $ret = $data_xml->xpath ($query);
                foreach ($ret as $x) {
                    $subject = str_replace("'", "", (string) $x->subject);
                }
            }

            $x = 0;
            while (++$x < 10 && strlen($subject) == 0) {
                $dir = "/var/www/temp/data/search/{$group}";
                $lst = scandir ($dir);
                foreach ($lst as $f) {
                    if ($f=='.'||$f=='..') continue;
                    $data_uri = "{$dir}/{$f}";
                    $data_xml = simplexml_load_file($data_uri); 
                    $ret = $data_xml->xpath ($query);
                    foreach ($ret as $x) {
                        $subject = str_replace("'", "", (string) $x->subject);
                    }
                }
            }
   
            $sql = "INSERT INTO MediaIndex (groupname, filename, mediauri, imageuri, articleid, subject) VALUES " . 
                   "('{$group}', '{$data_uri}', '{$media}', '{$image}', '{$id}', '{$subject}')" ;
            echo $sql . "\n-----------------------------------------------------------------------------\n";
            $result = $db->Execute ($sql);
            if (!$result) {
                var_dump ($db->Error);
            }
        }
        
    }
   
  #  $db->Close();
    
    foreach ($subs as $sub) Recurse ($sub);
}

Page_Load ();
