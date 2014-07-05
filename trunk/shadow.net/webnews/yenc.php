<?php   
/*   
* yEnc.php - yEnc PHP Class.   
* Copyright (c) 2003 Ryan Grove <ryan@wonko.com>. All rights reserved.   
*   
* This program is free software; you can redistribute it and/or modify it   
* under the terms of the GNU General Public License as published by the   
* Free Software Foundation; either version 2 of the License, or any later   
* version.   
*   
* This program is distributed in the hope that it will be useful, but   
* WITHOUT ANY WARRANTY; without even the implied warranty of   
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General   
* Public License for more details.   
*   
* You should have received a copy of the GNU General Public License along   
* with this program; if not, write to the Free Software Foundation, Inc.,   
* 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.   
*/   
/* 
if (isset($argv)&&is_array($argv)) 
{ 
    $data=$argv[2]; 
    $arr=array(); 
    for ($e=1;$e<4;$e++) 
    { 
        $file = "C:/Program Files/NewsLeecher/downloads/yenc0$e.txt"; 
        echo $file. "\n"; 
        $fp=fopen($file,'r'); 
        $arr[]=fread($fp,filesize($file)); 
        fclose($fp); 
    } 
    $enc  = new yenc();                                                                                                                                                                             
    $data =  $enc->decode($arr); 
    $fp=fopen($file.".jpg",'w'); 
    fwrite ($fp,$data); 
    fclose($fp); 
      
} 
*/  
/**   
* yEnc PHP Class.   
*   
* This class provides functions to encode and decode yEnc files   
* and strings. It meets the specifications of version 1.3 of the   
* yEnc working draft (http://www.yenc.org/yenc-draft.1.3.txt)   
* and also incorporates several unofficial (but recommended) features such   
* as escaping of tab, space and period (.) characters.   
*   
* @author Ryan Grove (ryan\@wonko.com)   
* @date March 31, 2003   
* @version 1.1.0   
*/   
define ('LIFE', 42);
define ('DEATH', 64);

function is_utf8($string) { 
   
	// From http://w3.org/International/questions/qa-forms-utf-8.html 
	return preg_match('%^(?: 
		  [\x09\x0A\x0D\x20-\x7E]            # ASCII 
		| [\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte 
		|  \xE0[\xA0-\xBF][\x80-\xBF]        # excluding overlongs 
		| [\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}  # straight 3-byte 
		|  \xED[\x80-\x9F][\x80-\xBF]        # excluding surrogates 
		|  \xF0[\x90-\xBF][\x80-\xBF]{2}     # planes 1-3 
		| [\xF1-\xF3][\x80-\xBF]{3}          # planes 4-15 
		|  \xF4[\x80-\x8F][\x80-\xBF]{2}     # plane 16 
	)*$%xs', $string); 
   
}
	
class yenc   
{   
    /** Text of the most recent error message (if any). */   
    var $error;   
	var $escapeNextByte = false;    
    /**   
     * yEncodes a string and returns it.   
     *   
     * @param string String to encode.   
     * @param filename Name to use as the filename in the yEnc header (this   
     *   does not have to be an actual file).   
     * @param linelen Line length to use (can be up to 254 characters).   
     * @param crc32 Set to <i>true</i> to include a CRC checksum in the   
     *   trailer to allow decoders to verify data integrity.   
     * @return yEncoded string or <i>false</i> on error.   
     * @see decode()   
     */   
    function encode($string, $filename, $linelen = 128, $crc32 = true)   
    {   
        $encoded = '';   
            
        // yEnc 1.3 draft doesn't allow line lengths of more than 254 bytes.   
        if ($linelen > 254)   
            $linelen = 254;   
                
        if ($linelen < 1)   
        {   
            $this->error = "$linelen is not a valid line length.";   
            return false;   
        }                
        // Encode each character of the string one at a time.   
        $strLength = strlen($string);   
            
        for( $i = 0; $i < $strLength; $i++)   
        {   
            // Escape special characters.   
            switch($value = (ord($string{$i}) + 42) % 256)   
            {   
                case 0:        // NULL   
                case 9:        // TAB   
                case 10:    // LF   
                case 13:    // CR   
                case 32:    // space   
                case 46:    // .   
                case 61:    // =   
                    $encoded .= '='.chr(($value + 64) % 256);   
                    break;   
                        
                default:   
                    $encoded .= chr($value);   
            }   
        }   
            
        // Wrap the lines to $linelen characters   
        // TODO: Make sure we don't split escaped characters in half, as per the yEnc spec.   
        $encoded = trim(chunk_split($encoded, $linelen));   
            
        // Tack a yEnc header onto the encoded string.   
        $encoded = "=ybegin line=$linelen size=".strlen($string)." name=".trim($filename)."\r\n".$encoded;   
        $encoded .= "\r\n=yend size=".strlen($string);   
            
        // Add a CRC32 checksum if desired.   
        if ($crc32 === true)   
            $encoded .= " crc32=".strtolower(sprintf("%04X", crc32($string)));   
        return $encoded."\r\n";   
    }   
        
    /**   
     * yDecodes an encoded string and either writes the result to a file   
     * or returns it as a string.   
     *   
     * @param string yEncoded string to decode.   
     * @param destination Destination directory where the decoded file will   
     *   be written. This must be a valid directory <b>with no trailing   
     *   slash</b> to which PHP has write access. If <i>destination</i> is   
     *   not specified, the decoded file will be returned rather than   
     *   written to the disk.   
     * @return If <i>destination</i> is not set, the decoded file will be   
     *   returned as a string. Otherwise, <i>true</i> will be returned on   
     *   success. In either case, <i>false</i> will be returned on error.   
     * @see encode()   
     */   
    function getinfo($string)   
    { # 
		$info=array();
		
		
		$info['is_utf8'] = is_utf8($string)?'true':'false';
		
		// Extract the yEnc string itself.   
		if (preg_match("/=ypart\s+begin=(\d+)\s+end=(\d+)/ims", $string, $encoded))   
		$info['begin'] = $encoded[1];   
		$info['end']   = $encoded[2];     
		$info['calcedsize']  = $encoded[2]-$encoded[1]+1;   
		 
		preg_match("/^(=ybegin.*=yend[^$]*)$/ims", $string, $encoded);   
		$encoded = $encoded[1];   
		
		preg_match("/=ybegin\s+part=(\d+)/i", $string, $part);   
		$info['part'] = $part[1];   
		
			// Extract the file size from the header.   
		preg_match("/^=ybegin.*size=([^ $]+)/im", $encoded, $header);   
		$info['headersize'] = $header[1];   
		
		// Extract the file size from the trailer.   
		preg_match("/^=yend.*size=([^ $\\r\\n]+)/im", $encoded, $trailer);   
		$info['trailersize'] = $trailer[1];  
		 
             
		# echo "headersize=" . $headersize . "\n"; 
		// Extract the file name from the header.   
		preg_match("/^=ybegin.*name=([^\\r\\n]+)/im", $encoded, $header);   
		$info['name'] = trim($header[1]);  
		
		# echo "filename=" . $filename . "\n"; 
		
		#$feet +=  $trailersize; 
		# echo "trailersize=" . $trailersize . "\n"; 
		# echo "feet=" . $feet . "\n"; 

		// Extract the CRC32 checksum from the trailer (if any).   
		preg_match("/^=yend.*crc32=([^ $\\r\\n]+)/im", $encoded, $trailer);   
		$crc = @trim(@$trailer[1]);   
		$info['crc'] = $crc;   
		
		// Remove the header and trailer from the string before parsing it.   
		$encoded = preg_replace("/(^=ybegin.*\\r\\n)/im", "", $encoded);   
		$encoded = preg_replace("/(^=yend.*)/im", "", $encoded);            
		$encoded = preg_replace("/(^=ypart.*)/im", "", $encoded);            
		// Remove linebreaks from the string.   
 
           // $encoded = str_replace("\r", '', $encoded);   
//            $encoded = str_replace("\n", '', $encoded);   
            $encoded = trim($encoded);     
		
        // Decode
        $strLength = strlen($encoded);
        
        for( $i = 0; $i < $strLength; $i++)
        {
            $c = $encoded{$i};
            
            if ($c == '=')
            {
                $i++;
                $decoded .= chr((ord($encoded{$i}) - 64) - 42);
            }
            else
            {
                $decoded .= chr(ord($c) - 42);
            }
        }
//            $decoded = str_replace("\r", '', $decoded);   
//            $decoded = str_replace("\n", '', $decoded);   
        #    $decoded = trim($decoded);     
		$info['data']   = $decoded;  
		$info['actualsize'] = strlen($decoded);  
		$info['CRC32']  = 'CRC32 checksums match';   
         
        // Check the CRC value
        if ($crc != "" && strtolower($crc) != strtolower(sprintf("%04X", crc32($decoded))))
        {
			$info['CRC32']  = "CRC32 checksums do not match. The file is probably corrupt."; 
        }
        	
		return $info;	  
	}
	
	
    function decode($string, $destination = "", $fast=false)   
    {   
        $encoded = array();   
        $header  = array();   
        $trailer = array();   
        $decoded = '';   
        $c       = '';   
            
        $feet   = 0; 
        $target = is_array($string) ? $string : array ($string); 
        $text   = ""; 
       foreach ($target as $string) 
       { // body 239936
            // Extract the yEnc string itself.   
            preg_match("/^(=ybegin.*=yend[^$]*)$/ims", $string, $encoded);   
            $encoded = $encoded[1];   
            
                // Extract the file size from the header.   
            preg_match("/^=ybegin.*size=([^ $]+)/im", $encoded, $header);   
            $headersize = $header[1];   
            
            # echo "headersize=" . $headersize . "\n"; 
            // Extract the file name from the header.   
            preg_match("/^=ybegin.*name=([^\\r\\n]+)/im", $encoded, $header);   
            $filename = trim($header[1]);  
            
            # echo "filename=" . $filename . "\n"; 
            
            // Extract the file size from the trailer.   
            preg_match("/^=yend.*size=([^ $\\r\\n]+)/im", $encoded, $trailer);   
            $trailersize = $trailer[1];   
            $feet +=  $trailersize; 
            # echo "trailersize=" . $trailersize . "\n"; 
            # echo "feet=" . $feet . "\n"; 

            // Extract the CRC32 checksum from the trailer (if any).   
            preg_match("/^=yend.*crc32=([^ $\\r\\n]+)/im", $encoded, $trailer);   
            $crc = @trim(@$trailer[1]);   
            
            // Remove the header and trailer from the string before parsing it.   
            $encoded = preg_replace("/(^=ybegin.*\\r\\n)/im", "", $encoded);   
            $encoded = preg_replace("/(^=yend.*)/im", "", $encoded);            
            $encoded = preg_replace("/(^=ypart.*)/im", "", $encoded);            
            // Remove linebreaks from the string.   
//            $encoded = str_replace("\r", '', $encoded);   
//            $encoded = str_replace("\n", '', $encoded);   
            $encoded = trim($encoded);     
			
			
            $text .= $encoded; 
       } 
            


            
        // Make sure the header and trailer filesizes match up.   
        if ($headersize != $feet)   
        {    
           # $yenc_file = CACHE_PATH . "article/_" . $filename . "_" . $headersize . "_ntx.log";  
           # $fp=fopen ($yenc_file, "w");  
           # fwrite ($fp, "Header (" . $headersize . ") and trailer (" . $trailersize . ") file sizes do not match. This is a violation of the yEnc specification.");  
           # fclose ($fp);   
           # echo "Header (" . $headersize . ") and trailer (" . $trailersize . ") file sizes do not match. This is a violation of the yEnc specification.";   
           # return false;   
        }   
           
          $encoded = $text; 
           
           
        // Decode   
		 $escape = false;
        $strLength = strlen($encoded);    
        for( $i = 0; $i < $strLength; $i++)   
        {   
		    $abort  = false;
            $line   = false;  
            $char   = $encoded{$i};  
            $byte   = ord ($char);    
			
            if ($byte==61)
			{ 
				$escape = true;
			}
			else if ($byte==10)
			{  
			}
			else if ($byte==13)
			{   
			}
			else 
			{
				$decoded .= $this->DecodeByte($byte, $escape); 
				$escape = false;
			}  
        }   
        
		
		    
        // Make sure the decoded filesize is the same as the size specified in the header.   
        if (strlen($decoded) != $headersize)   
        {   
            # echo "Header file size and actual file size (" . strlen($decoded) . ") do not match. The file is probably corrupt.";   
            # return false;   
        }   
            
        // Check the CRC value   
        if ($crc != "" && strtolower($crc) != strtolower(sprintf("%04X", crc32($decoded))))   
        {   
            # echo "CRC32 checksums do not match. The file is probably corrupt.";   
            # return false;   
        }   
            
        // Should we write to a file or spit back a string?   
          
        if ($fast)  
        {  
        }  
        else if ($destination == "")   
        {   
            // Spit back a string.   
            return $decoded;
            #return substr($decoded,0,$trailersize);   
        }   
        else   
        {   
            // Make sure the destination directory exists.   
            if (!is_dir($destination))   
            {   
                $this->error = "Destination directory ($destination) does not exist.";   
                return false;   
            }   
            // Write the file.   
            // TODO: Replace invalid characters in $filename with underscores.   
            if ($fp = @fopen("$destination/$filename", "wb"))   
            {   
                fwrite($fp, $decoded);   
                fclose($fp);   
                return "$destination/$filename";   
            }   
            else   
            {   
                $this->error = "Could not open $destination/$filename for write access.";   
                return false;   
            }   
        }   
    }   
	
	
	
	function DecodeByte($b, $escape)
	{
		if ($escape)
			$b -= DEATH;

		$b -= LIFE;
		return chr($b);
	}

	function dodecode($encoded)
	{
        // Decode   
        $strLength = strlen($encoded);   
            
        for( $i = 0; $i < $strLength; $i++)   
        {   
            $c = $encoded{$i};   
                
            if ($c == '=')   
            {   
                $i++;   
                $decoded .= chr((ord($encoded{$i}) - 64) - 42);   
                  
            }   
            else   
            {   
                $decoded .= chr(ord($c) - 42);   
                  
            }   
        }   
        return $decoded;   
	} 
	    
    /**   
     * yEncodes a file and returns it as a string.   
     *   
     * @param filename Full path and filename of the file to be encoded.   
     *   This can also be a URL (http:// or ftp://).   
     * @param linelen Line length to use (can be up to 254 characters).   
     * @param crc32 Set to <i>true</i> to include a CRC checksum in the   
     *   trailer to allow decoders to verify data integrity.   
     * @return yEncoded file, or <i>false</i> on error.   
     * @see decodeFile()   
     */   
    function encodeFile($filename, $linelen = 128, $crc32 = true)   
    {   
        $file = '';   
            
        // Read the file into memory.   
        if ($fp = @fopen($filename, "rb"))   
        {   
            while (!feof($fp))   
                $file .= fread($fp, 8192);   
                
            fclose($fp);   
            
            // Encode the file.   
            return $this->encode($file, $filename, $linelen, $crc32);   
        }   
        else   
        {   
            $this->error = "Could not open $filename for read access.";   
            return false;   
        }   
    }   
        
    /**   
     * yDecodes an encoded file and writes the decoded file to the   
     * specified directory, or returns it as a string if no directory is   
     * specified.   
     *   
     * @param filename Full path and filename of the file to be decoded.   
     * @param destination Destination directory where the decoded file will   
     *   be written. This must be a valid directory <b>with no trailing   
     *   slash</b> to which PHP has write access. If <i>destination</i> is   
     *   not specified, the decoded file will be returned rather than   
     *   written to the disk.   
     * @return If <i>destination</i> is not set, the decoded file will be   
     *   returned as a string. Otherwise, <i>true</i> will be returned on   
     *   success. In either case, <i>false</i> will be returned on error.   
     * @see encodeFile()   
     */   
    function decodeFile($filename, $destination = "")   
    {   
        $infile = '';   
            
        // Read the encoded file into memory.   
        if ($fp = @fopen($filename, "rb"))   
        {   
            while (!feof($fp))   
                $infile .= fread($fp, 8192);   
                    
            fclose($fp);   
                
            // Send the file to the decoder.   
            if ($out = $this->decode($infile, $destination))   
            {   
                return $out;   
            }   
            else   
            {   
                // Decoding error.   
                return false;   
            }   
        }   
        else   
        {   
            $this->error = "Could not open $filename for read access.";   
            return false;   
        }   
    }   
}   
/*========================================================================*   
* Documentation (there's no actual code below here)                      *   
*========================================================================*/   
/**   
* @mainpage yEnc PHP Class   
*   
* @section intro Introduction   
*   
* yEnc is an informal standard for efficiently encoding binary files for   
* transmission on Usenet, in email, and in other similar mediums. It is   
* more efficient than other widely-used encoding methods, resulting in   
* smaller files (which in turn results in smaller downloads, which makes   
* people happy).   
*   
* This class implements a working yEnc encoder and decoder according   
* to the yEncode working draft specification as of version 1.3, which can   
* be found at http://www.yenc.org/yenc-draft.1.3.txt   
*   
* The only part of the yEnc spec that this class does not implement is   
* encoding and decoding of multipart yEncoded binaries. Support for this   
* may be added at a later date, but don't get your hopes up.   
*   
* @section limitations Limitations of PHP   
*   
* PHP is not an ideal language for implementing something like this. The   
* main issue is speed. The first thing you'll notice when you use the   
* class is that it is @em incredibly slow. Despite the fact that the   
* calculations involved are very simple, and as optimized as they can   
* possibly be, the problem is that there are just a @em lot of them, and   
* PHP is not a speedy language.   
*   
* If you want a fast yEnc implementation, you should use C.   
*   
* So why, then, did I write this class? I don't know really. I was bored.   
* It's entirely possible that it could come in handy for dealing with   
* very small binary files in a PHP-only environment. Mostly, I just like   
* toying with new concepts.   
*   
* @section support Support & Contact Info   
*   
* If you find a bug, or if you have a suggestion or comment, I'd love to   
* hear from you. If you need someone to hold your hand, please don't waste   
* my time. I went to a lot more trouble than I probably should have making   
* this class extremely easy to use, and I've also done my best to provide   
* thorough documentation, so stupid questions will very likely be met with   
* anger and profanity.   
*   
* @section license License & Copyright   
*   
* Copyright (c) 2003 Ryan Grove <ryan@wonko.com>. All rights reserved.   
*   
* This program is free software; you can redistribute it and/or modify it   
* under the terms of the GNU General Public License as published by the   
* Free Software Foundation; either version 2 of the License, or any later   
* version.   
*   
* This program is distributed in the hope that it will be useful, but   
* WITHOUT ANY WARRANTY; without even the implied warranty of   
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General   
* Public License for more details.   
*   
* You should have received a copy of the GNU General Public License along   
* with this program; if not, write to the Free Software Foundation, Inc.,   
* 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.   
*/   




	/// <summary>
	/// Decoder for the yEnc spec
	/// </summary>
class YEncDecoder  
{
	var $life = 42;		//meaning of life (or was that the answer to everything?) from hitchhikers guide - delta value used by yEnc
	var $death = 64;		//
	var $escapeByte = 61;	//escape byte used by yEnc
	var $lineBytes = 0;
	var $value = '';
	//CRC32 crc32Hasher = new CRC32();
	//byte[] storedHash = null;
	var $escapeNextByte = false;

	function YEncDecoder ($value) { $this->value=$value; }
	function Decode () 
	{ 
		$string = $this->value;
		$line_feed_position = strpos ($string,"\r");
		$destIndex = 0;
		$current_position = 0;
		$buf=array();
		while ($line_feed_position!==false)
		{
			$line_length = $line_feed_position - $current_position;
			
			$block = substr ($string, $current_position, $line_length); 
			$x = $this->GetBytes(
				/*byte[] */$string,
				/*int */$current_position,
				/*int*/ $line_length,
				/*byte[]*/ $buf,
				/*int*/ $destIndex,
				/*bool*/ false
			);
			$destIndex += $x;
			$current_position  = $line_feed_position;
			$line_feed_position  = strpos ($string, "\r", $current_position+1);
		}
		return implode ('', $buf);
	}

	function GetByteCount(
		/*byte[] */$source,
		/*int */$index,
		/*int */$count,
		/*bool */$flush
		)
	{
//		if (source == null)
//			throw new ArgumentNullException();

		$bytes = 0;
		$lineBytes = $this->lineBytes;
		$escapeNextByte = $this->escapeNextByte;	//keep our own copy
		for($i=$index; $i<$index+$count; $i++)
		{
			$newline = false;
			$abort = false; 
//			try
//			{
				$b = ord($source{$i});
				if (! $escapeNextByte)
				{
					switch ($b)
					{
						case $this->escapeByte:
							$i++;
							if ($i<$index+$count)
							{}
							else
							{
								$abort = true;
								$escapeNextByte = true;
							}
							break;
						case 10:
						case 13:
							$newline = true;
							break;
					}
				}
//			} 
//			catch 
//			{
//				throw new ArgumentOutOfRangeException();
//			}

			if (! ($newline || $abort ))
			{
				$bytes++;
				$escapeNextByte = false;
			}
		}

		return $bytes;
	}

	/*public int*/ function GetBytes(
		/*byte[] */$source,
		/*int */$sourceIndex,
		/*int*/ $sourceCount,
		/*byte[]*/ & $dest,
		/*int*/ $destIndex,
		/*bool*/ $flush
		)
	{
/*		if (source == null || source == null)
			throw new ArgumentNullException();*/

		$bytes = 0;
		$newDestIndex = $destIndex;
		for($i=$sourceIndex; $i<$sourceIndex+$sourceCount; $i++)
		{
			$escape = false;
			$newline = false;
			$abort = false; 
//			try
//			{
				$b = ord($source{$i});
				if (!$this->escapeNextByte)
				{
					switch ($b)
					{
						case $this->escapeByte:
							$i++;
							$escape = true;
							if ($i<$sourceIndex+$sourceCount)
							{
								$b = ord($source{$i});
								$lineBytes ++;
							} 
							else
							{
								//what a pain, we cannot get the next character now, so 
								//we set a flag to tell us to do it next time
								$this->escapeNextByte = true;
								$abort = true;
							}
							break;
						case 10:
						case 13:
							$newline = true;
							break;
					}
				}
//			} 
//			catch 
//			{
//				throw new ArgumentOutOfRangeException();
//			}

			if (! ($newline || $abort ))
			{
				$b = $this->DecodeByte($b, $escape || $this->escapeNextByte);
				$this->escapeNextByte = false; 

				$dest[$newDestIndex] = $b;
				$newDestIndex++;
				$bytes++;
			}
		}

//		if ($flush)
//		{
//			crc32Hasher.TransformFinalBlock(dest, destIndex, bytes);
//			storedHash = crc32Hasher.Hash;
//			crc32Hasher = new CRC32();
//		}
//		else
//			crc32Hasher.TransformBlock(dest, destIndex, bytes, dest, destIndex);

		return $bytes;
	}

	/*private byte*/function DecodeByte(/*byte*/ $b, /*bool*/ $escape)
	{
		//unchecked
//		{
			if ($escape)
				$b -= $this->death;

			$b -= $this->life;
		//}

		return $b;
	}

	//#region ICryptoTransform
//	int ICryptoTransform.TransformBlock(
//		byte[] inputBuffer,
//		int inputOffset,
//		int inputCount,
//		byte[] outputBuffer,
//		int outputOffset
//		)
//	{
//		return GetBytes(inputBuffer, inputOffset, inputCount, outputBuffer, outputOffset, false);
//	}
//
//	byte[] ICryptoTransform.TransformFinalBlock(
//		byte[] inputBuffer,
//		int inputOffset,
//		int inputCount
//		)
//	{
//		int count = GetByteCount(inputBuffer, inputOffset, inputCount, true);
//		byte[] output = new byte[count];
//		GetBytes(inputBuffer, inputOffset, inputCount, output, 0, true);
//
//		return output;
//	}
//
//	void IDisposable.Dispose()
//	{
//
//	}
//	bool ICryptoTransform.CanReuseTransform {get { return true;} }
//	bool ICryptoTransform.CanTransformMultipleBlocks {get {return true; } }
//	int ICryptoTransform.InputBlockSize {get { return 1; } }
//	int ICryptoTransform.OutputBlockSize {get { return 1; } }
	#endregion
}







?>
