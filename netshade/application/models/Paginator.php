<?php


class Application_Model_Paginator
{

	public static function Pages ($number, $page = '', $uri = '', $pattern = "<a href='%s%s'>%s</a>", $sizeof = PAGE_SIZE)
	{    

	    $ret  = array();  
	    if (strlen($page) == 0) $page = 1;
	    $size = ceil($number / $sizeof);
	    $min  = 1 + (floor (($page - 1) / PAGE_MAX) * PAGE_MAX);
	    $max  = $min + PAGE_MAX;  
 
	    
	    if ($page > 1)
	    {
	        $ret[] = sprintf($pattern, $uri, $page - 1, 'Prev');
	    }
	    
	    if ($min > PAGE_MAX)
	    {
	        $ret[] = sprintf($pattern, $uri, 1, 1);    
	        $ret[] = sprintf($pattern, $uri, $min - 1, '...'); 
	    } 

	    for ($x=$min;$x<$max&&$x<$size+1;$x++)
	    {
	        $ret[] = $x==$page ? "<b>{$x}</b>" :  sprintf($pattern, $uri, $x, $x);    
	    }

	    if ($max < $size)
	    {
	        $ret[] = sprintf($pattern, $uri, $max, '...');  
	        $ret[] = sprintf($pattern, $uri, $size, $size);   
	    }   
	
	    if ($page < $size)
	    {
	        $ret[] = sprintf($pattern, $uri, $page + 1, 'Next');
	    }
	    $delim  = ' - ';
            $text   = implode ($delim, $ret);
            $prefix = "";//"Go to page: ";
	    return $size > 1 ? ( $prefix . $text ) : "";#'no items in page list';
	}



}

