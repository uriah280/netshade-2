<?
/*
	This PHP script is licensed under the GPL

	Author: Terence Yim
	E-mail: chtyim@gmail.com
	Homepage: http://web-news.sourceforge.net
*/

	$sort_by_list = array("subject", "from", "date");
	if (is_requested("sign")) {
		$sign = get_request("sign");
	}
	if (is_requested("sort")) {
		$sort = get_request("sort");
	}
	if ($renew || $change_mpp) {
		$page = 1;
	} else if (is_requested("page")) {
		$page = intval(get_request("page"));
		if (isset($_SESSION["search_txt"])) {
		    $renew = 0;
		} else {
		    $renew = 1;
		}
	} else if (isset($_SESSION["last_page"])) {
		$page = $_SESSION["last_page"];
	} else {
		$page = 1;
	}

	if (is_requested("search")) {
		unset($_SESSION["search_txt"]);
		$do_search = TRUE;
		$page = 1;
	}

/*
	if (is_requested("sch_option")) {
		$_SESSION["sch_option"] = !$_SESSION["sch_option"];
	}
*/
	if (is_requested("option")) {
		$_SESSION["more_option"] = !$_SESSION["more_option"];
	}

	if (isset($_COOKIE["wn_pref_mpp"])) {
		$message_per_page = $_COOKIE["wn_pref_mpp"];
	}

	$_SESSION["last_page"] = $page;


print "&lt!-------------connecting---------------&gt;";
	if (!$nntp->connect()) {
		$_SESSION["result"] = null;
		echo "<b>".$messages_ini["error"]["nntp_fail"]."</b><br>";
		echo $nntp->get_error_message()."<br>";
		exit;
	} else {
	
	
print "&lt!-------------connect successful---------------&gt;"; 
		$group_info = $nntp->join_group($_SESSION["newsgroup"]);

		if ($group_info == NULL) {
			$_SESSION["result"] = null;
			echo "<b>".$messages_ini["error"]["group_fail"].$_SESSION["newsgroup"]." </b><br>";
			echo $nntp->get_error_message()."<br>";
			exit;
		} else {			
		
print "&lt!-------------group joined---------------&gt;"; 
			if ($renew || $do_search || ($_SESSION["result"] == null)) {
				$renew = 1;
				$_SESSION["result"] = null; 
				
					
print "&lt!-------------group info---------------&gt;";  
				if ($group_info["count"] > 0) {
					$_SESSION["article_list"] = $nntp->get_article_list($_SESSION["newsgroup"]);
					
print "&lt!----------get_article_list------------&gt;"; 
 
					if ($_SESSION["article_list"] === FALSE) {
						unset($_SESSION["article_list"]);
						echo "<b>".$messages_ini["error"]["group_fail"].$_SESSION["newsgroup"]." </b><br>";
						echo $nntp->get_error_message()."<br>";
						exit;
					}			
					
print "&lt!-------------group info---------------&gt;"; 
 
					
					if ($do_search) {
						$search_txt = get_request("search_txt");
						if (get_magic_quotes_gpc()) {
							$search_txt = stripslashes($search_txt);
						} 
						$search_pat = make_search_pattern($search_txt);
						$flat_tree = TRUE;
						$_SESSION["search_txt"] = htmlescape($search_txt);
					} else {
						$search_pat = "//";
						$flat_tree = FALSE;
						unset($_SESSION["search_txt"]);
					}					
						
					
					
					
					
					if ((strcmp($message_per_page, "all") == 0) || $do_search) {
						// Search through all messages
						$start_id = 0;
						$end_id = sizeof($_SESSION["article_list"]) - 1;
					} else {
						$end_id = sizeof($_SESSION["article_list"]) - $message_per_page*($page - 1) - 1;
						$start_id = $end_id - $message_per_page + 1;
					}
					if ($start_id < 0) {
						$start_id = 0;
					}

					$result = $nntp->get_message_summary($_SESSION["article_list"][$start_id], $_SESSION["article_list"][$end_id], $search_pat, $flat_tree);
					if ($result) {
						$result[0]->compact_tree();						
						$need_sort = TRUE;
						krsort($result[1], SORT_NUMERIC);
						reset($result[1]);
					}
		
					// Set the tree sorting setting as previous group and force sorting
					if (!isset($sort) && isset($_SESSION["sort_by"]) && $need_sort) {
						$sort = $_SESSION["sort_by"];
						$_SESSION["sort_by"] = -1;
					}
				
					$_SESSION["result"] = $result;
				} else {
					$_SESSION["article_list"] = array();
					$_SESSION["result"] = array(new MessageTreeNode(NULL), array());
				}
			}
		}
		
		// Quit sooner to release resources
		$nntp->quit();
	}

// Control panel display section

print "&lt!-------------afterword---------------&gt;";
 



	if ($_SESSION["result"]) {
		$root_node =& $_SESSION["result"][0];
		$ref_list =& $_SESSION["result"][1];
		
		if (!isset($_SESSION["sort_by"])) {
			$_SESSION["sort_by"] = 2;
			$last_sort = -1;
			$_SESSION["sort_asc"] = 0;
			$last_sort_dir = 0;
		} else {
			$last_sort = $_SESSION["sort_by"];
			$last_sort_dir = $_SESSION["sort_asc"];
			if (isset($sort)) {				
				$_SESSION["sort_by"] = intval($sort);
				if ($_SESSION["sort_by"] == $last_sort) {
					$_SESSION["sort_asc"] = ($_SESSION["sort_asc"] == 1)?0:1;
				}
			} else {
				$_SESSION["sort_by"] = $last_sort;
			}
		}
			
		if (($_SESSION["sort_by"] != $last_sort) || ($_SESSION["sort_asc"] != $last_sort_dir)){
			$root_node->deep_sort_message($sort_by_list[$_SESSION["sort_by"]], $_SESSION["sort_asc"]);
		}
		
		
		if (isset($sign) && isset($mid)) {
			$message_id = $ref_list[$mid][0];
			$references = $ref_list[$mid][1];
			$node =& $root_node;
			
			
			
			// Search the reference list only when the expand node is not a child of the root
			if (!$node->get_child($message_id)) {	
				if (sizeof($references) != 0) {
					foreach ($references as $ref) {
						$child =& $node->get_child($ref);
						if ($child != NULL) {
							$node =& $child;
						}
					}
				}
			}

			$node =& $node->get_child($message_id);

			if ($node) {
				if (strcasecmp($sign, "minus") == 0) {
					$node->set_show_children(FALSE);
				} else if (strcasecmp($sign, "plus") == 0) {
					$node->set_show_all_children(TRUE);
				}
			}
		}
		
		if (isset($_SESSION["search_txt"])) {
			if (sizeof($root_node->get_children()) == 0) {
				$info_msg["msg"] = $messages_ini["text"]["sch_notfound"]." - ".$_SESSION["search_txt"];
			} else {
				$info_msg["msg"] = $messages_ini["text"]["sch_found1"]." ".sizeof($root_node->get_children())." ".$messages_ini["text"]["sch_found2"]." - ".$_SESSION["search_txt"].".";
			}
		}
		
		
?>

<form action="newsgroups.php">
<font face="<? echo $font_family; ?>">

<table cellspacing="2" cellpadding="0" border="0" width="100%">
	<tr>
		<td nowrap="true" width="1%">
			<font size="<? echo $font_size; ?>"><b><? echo $messages_ini["text"]["search"]; ?>:&nbsp;</b></font>
		</td>
		<td nowrap="true" align="left">
			<input type="text" size="40" name="search_txt" style="<?echo $form_style; ?>" value="<? echo isset($_SESSION["search_txt"])?$_SESSION["search_txt"]:""; ?>">
			<input type="submit" name="search" value="<? echo $messages_ini["control"]["search"]; ?>" style="<? echo $form_style_bold; ?>">
<?
/*
			if ($_SESSION["sch_option"]) {
				echo "<font size=\"($font_size - 1)\"><a href=\"newsgroups.php?sch_option=1\">Hide Search Options</a></font>";
			} else {
				echo "<font size=\"($font_size - 1)\"><a href=\"newsgroups.php?sch_option=1\">Search Options</a></font>";
			}
*/


		

?>
		</td>		
		<td width="100%">&nbsp;
			
		</td>
		<td align="right" valign="top" rowspan="2">
			<img src="<? echo $image_base."webnews.gif"; ?>" border="0" width="40" height="40">
		</td>
		<td align="right" valign="top" nowrap="true" rowspan="2"><font size="-2">
			Web-News v.1.6.2<br>by <a href="http://web-news.sourceforge.net/webnews.html" target="new">Terence Yim</a></font>
		</td>
	</tr>
	<tr>
		<td nowrap="true" width="1%">
			<font size="<? echo $font_size; ?>"><b><? echo $messages_ini["text"]["newsgroup"]; ?>:&nbsp;</b></font>
		</td>
		<td nowrap="true" align="left">
			<select name="group" style="<? echo $form_style_bold; ?>">
				<?
					while (list($key, $value) = each($newsgroups_list)) {
						echo "<option value=\"$value\"";
						if (strcmp($value, $_SESSION["newsgroup"]) == 0) {
							echo " selected";
						}
						echo ">$value\r\n";
					}
					reset($newsgroups_list);
				?>
			</select>
			<input type="submit" value="<? echo $messages_ini["control"]["go"]; ?>" style="<? echo $form_style_bold; ?>">
		</td>
		<td width="100%">&nbsp;
			
		</td>
	</tr>
<?




	if ($_SESSION["more_option"]) {
?>
	<tr>
		<td nowrap="true" width="1%">
			<font size="<? echo $font_size; ?>"><b><? echo $messages_ini["text"]["language"]; ?>:&nbsp;</b></font>
		</td>
		<td colspan="4" width="100%">
			<select name="language" style="<? echo $form_style_bold; ?>">
<?
			foreach ($locale_list as $key=>$value) {
				echo "<option value=\"$key\"";
				if (strcmp($_COOKIE["wn_pref_lang"], $key) == 0) {
					echo "selected";
				}
				echo ">";
				echo $value."\n";
			}
?>
			</select>
			&nbsp;
			<font size="<? echo $font_size; ?>"><b><? echo $messages_ini["text"]["messages_per_page"]; ?>:&nbsp;</b></font>
			<select name="msg_per_page" style="<? echo $form_style_bold; ?>">
<?
				foreach ($message_per_page_choice as $i) {
					echo "<option value=\"$i\"";
					if (strcmp($message_per_page, $i) == 0) {
						echo " selected";
					}
					if (strcmp($i, "all") == 0) {
						echo ">".$messages_ini["text"]["all"];
					} else {
						echo ">$i";
					}
				}
?>
			</select>
			<input type="submit" name="set" value="<? echo $messages_ini["control"]["set"]; ?>" style="<? echo $form_style_bold; ?>">
		</td>
	</tr>
<?
	}
	
	
?>
	<tr>
		<td nowrap="true" colspan="2">
			<font size="<? echo $font_size; ?>">
<?
				if (isset($_SESSION["search_txt"])) {
					echo "<a href=\"newsgroups.php?renew=1\" title=\"".$messages_ini["help"]["return"]."\">".$messages_ini["control"]["return"]."</a>";
				} else {
					echo "<a href=\"newsgroups.php?renew=1\" title=\"".$messages_ini["help"]["new_news"]."\">".$messages_ini["control"]["new_news"]."</a>";
				}
?>
				|
				<a href="newsgroups.php?compose=1" title="<? echo $messages_ini["help"]["compose"]; ?>"><? echo $messages_ini["control"]["compose"]; ?></a>
				|
				<a href="newsgroups.php?expand=1" title="<? echo $messages_ini["help"]["expand"]; ?>"><? echo $messages_ini["control"]["expand"]; ?></a>
				|
				<a href="newsgroups.php?collapse=1" title="<? echo $messages_ini["help"]["collapse"]; ?>"><? echo $messages_ini["control"]["collapse"]; ?></a>
				|
				<a href="newsgroups.php?rss_feed=<? echo $message_per_page; ?>&group=<? echo urlencode($_SESSION["newsgroup"]); ?>" target="_blank" title="<? echo $messages_ini["help"]["rss_feed"]; ?>">
					<? echo $messages_ini["control"]["rss_feed"]; ?></a>
				|
				<a href="newsgroups.php?option=1" 
<?
				if ($_SESSION["more_option"]) {
					echo "title=\"".$messages_ini["help"]["less_option"]."\">".$messages_ini["control"]["less_option"]."</a>";
				} else {
					echo "title=\"".$messages_ini["help"]["more_option"]."\">".$messages_ini["control"]["more_option"]."</a>";
				}
?>
			</font>
		</td>
		<td colspan="3" align="right">
<?
	if (($auth_level > 1) && $_SESSION["auth"]) {
?>
			<b><font size="<? echo $font_size; ?>"><?echo $messages_ini["text"]["login"].$user; ?>.</font></b>
			<input type="submit" name="logout" value="<? echo $messages_ini["control"]["logout"]; ?>" style="<? echo $form_style_bold; ?>">
<?
	} else {
		echo "&nbsp;";		
	}
?>
		</td>
	</tr>
<?
	if (strlen($info_msg["msg"]) != 0) {
		echo "<tr><td colspan=\"5\" align=\"center\" colspan=\"5\">";
		echo "<b><font size=\"".$font_size."\"";
		if (array_key_exists("color", $info_msg)) {
			echo "color=\"#".$info_msg["color"]."\"";
		}
		echo ">";
		echo $info_msg["msg"];
		echo "</b></font></td></tr>";
	}
?>
</table>

<? // Begin tree display section

 ?>
<table cellpadding="0" cellspacing="1" border="0" width="100%">
<!--
<tr bgcolor="<? echo $primary_color; ?>">
	<?
		if ($_SESSION["sort_asc"]) {
			$arrow_img = $image_base."sort_arrow_up.gif";
		} else {
			$arrow_img = $image_base."sort_arrow_down.gif";
		}

		echo "<td width=\"65%\"><font size=\"$font_size\" nowrap=\"true\"><b>";
		echo "<a href=\"newsgroups.php?renew=0&sort=0\">".$messages_ini["text"]["subject"]."</a>";
		if ($_SESSION["sort_by"] == 0) {
			echo "&nbsp;<img src=\"$arrow_img\" border=\"0\" align=\"absbottom\">";
		}
		echo "</b></font></td>";

		echo "<td width=\"23%\"><font size=\"$font_size\" nowrap=\"true\"><b>";
		echo "<a href=\"newsgroups.php?renew=0&sort=1\">".$messages_ini["text"]["sender"]."</a>";
		if ($_SESSION["sort_by"] == 1) {
			echo "&nbsp;<img src=\"$arrow_img\" border=\"0\" align=\"absbottom\">";
		}
		echo "</b></font></td>";

		echo "<td width=\"12%\"><font size=\"$font_size\" nowrap=\"true\"><b>";
		echo "<a href=\"newsgroups.php?renew=0&sort=2\">".$messages_ini["text"]["date"]."</a>";
		if ($_SESSION["sort_by"] == 2) {
			echo "&nbsp;<img src=\"$arrow_img\" border=\"0\" align=\"absbottom\">";
		}
		echo "</b></font></td>";
	?>
</tr>
<tr>
	<td colspan="3"><font size="<? echo ($font_size-1); ?>">&nbsp;</font></td>
</tr>
-->
<?
		if (is_requested("expand")) {
			$_SESSION["expand_all"] = TRUE;
			$need_expand = TRUE;
		} elseif (is_requested("collapse")) {
			$_SESSION["expand_all"] = FALSE;
			$need_expand = TRUE;
		} elseif ($renew) {
			$need_expand = TRUE;
			if (!isset($_SESSION["expand_all"])) {
				$_SESSION["expand_all"] = $default_expanded;
			}
		}

		if ($need_expand) {
			$root_node->set_show_all_children($_SESSION["expand_all"]);
			$root_node->set_show_children(TRUE);
		}

		$display_counter = 0;
		if (isset($_SESSION["search_txt"]) && (strcasecmp($message_per_page, "all") != 0)) {
			$nodes = array_slice($root_node->get_children(), ($page - 1)*$message_per_page, $message_per_page);
			display_tree($nodes, 0);
		} else {
			display_tree($root_node->get_children(), 0);
		}
	}


// Pagination number generation

	if (strcasecmp($message_per_page, "all") != 0) {
		if (isset($_SESSION["search_txt"])) {		// Count from the number of search results
			$page_count = ceil((float)sizeof($root_node->get_children())/(float)$message_per_page);
		} else {
			$page_count = ceil((float)sizeof($_SESSION["article_list"])/(float)$message_per_page);
		}
		$start_page = (ceil($page/$pages_per_page) - 1)*$pages_per_page + 1;
		$end_page = $start_page + $pages_per_page - 1;
		if ($end_page > $page_count) {
			$end_page = $page_count;
		}
	} else {	// Show All
		$page_count = 0;
	}
	
	

	if (($page_count != 0) && (($start_page != 1) || ($start_page != $end_page))) {
?>
		<tr bgcolor="#<? echo $tertiary_color; ?>">
			<td colspan="3">&nbsp;</td>
		</tr>

		<tr bgcolor="#<? echo $tertiary_color; ?>">
			<td colspan="4" align="center">
				<font size="<? echo $font_size; ?>">
					<b><?echo $messages_ini["text"]["page"]; ?>: </b>
	
	<?		
		if ($page != 1) {
			echo "<a href=\"newsgroups.php?page=".($page - 1)."\"><img src=\"".$image_base."previous_arrow.gif\" align=\"absmiddle\" border=\"0\"></a>";
		}
		echo "&nbsp;";

		for ($i = $start_page;$i <= $end_page;$i++) {
			if ($page == $i) {
				echo $i;
			} else {
				echo "<a href=\"newsgroups.php?page=$i\">$i</a>";
			}
			echo "&nbsp;";
		}
		
		if ($page != $page_count) {
			echo "<a href=\"newsgroups.php?page=".($page + 1)."\"><img src=\"".$image_base."next_arrow.gif\" align=\"absmiddle\" border=\"0\"></a>";
		}
	
		echo "&nbsp;&nbsp;&nbsp;&nbsp;";
	
	
		if ($start_page != 1) {
				echo "<b><a href=\"newsgroups.php?page=".($start_page - 1)."\">".$messages_ini["text"]["previous"]."$pages_per_page".$messages_ini["text"]["page_quality"]."</a></b>&nbsp;&nbsp;";
		}
		if ($end_page != $page_count) {
			echo "<b><a href=\"newsgroups.php?page=".($end_page + 1)."\">".$messages_ini["text"]["next"]."$pages_per_page".$messages_ini["text"]["page_quality"]."</a></b>\r\n";
		}
	?>
			</font></td>
		</tr>
<?
	}
?>

</table>
</form>
</font>

<?



	function display_tree($nodes, $level, $indent = "") {
		global $image_base;
		global $font_size;
		global $primary_color;
		global $secondary_color;
		global $tertiary_color;
		global $display_counter;
		global $subject_length_limit;
		global $sender_length_limit;
		 
		$count = 0;
		$last_index = sizeof($nodes) - 1;
		$old_indent = $indent;
		foreach ($nodes as $node) {
			$message_info = $node->get_message_info();
			$is_first = ($count == 0)?1:0;
			$is_last = ($count == $last_index)?1:0;
			
			if ($node->count_children() == 0) {
				if ($is_first && $is_last) {
					if ($level == 0) {
						$sign = "<img src=\"".$image_base."white.gif\" width=\"15\" height=\"19\" align=\"absbottom\" alt=\".\">";
					} else {
						$sign = "<img src=\"".$image_base."bar_L.gif\" width=\"15\" height=\"19\" align=\"absbottom\" alt=\"\\\">";
					}
				} elseif ($is_first) {
					if ($level == 0) {
						$sign = "<img src=\"".$image_base."bar_7.gif\" width=\"15\" height=\"19\" align=\"absbottom\" alt=\"*\">";
					} else {
						$sign = "<img src=\"".$image_base."bar_F.gif\" width=\"15\" height=\"19\" align=\"absbottom\" alt=\"|\">";
					}
				} elseif ($is_last) {
					$sign = "<img src=\"".$image_base."bar_L.gif\" width=\"15\" height=\"19\" align=\"absbottom\" alt=\"\\\">";
				} else {
					$sign = "<img src=\"".$image_base."bar_F.gif\" width=\"15\" height=\"19\" align=\"absbottom\" alt=\"|\">";
				}
			} else {
				if ($node->is_show_children()) {
					$sign = "minus";
					$alt = "-";
				} else {
					$sign = "plus";
					$alt = "+";
				}

				$link = "<a href=\"newsgroups.php?renew=0&mid=".$message_info->nntp_message_id."&sign=".$sign."\">";
				if ($is_first && $is_last && ($level == 0)) {
					$sign = $link."<img src=\"".$image_base."sign_".$sign."_single.gif\" width=\"15\" height=\"19\" align=\"absbottom\" border=\"0\" alt=\"".$alt."\"></a>";
				} elseif (($is_first) && ($level == 0)) {
					$sign = $link."<img src=\"".$image_base."sign_".$sign."_first.gif\" width=\"15\" height=\"19\" align=\"absbottom\" border=\"0\" alt=\"".$alt."\"></a>";
				} elseif ($is_last) {
					$sign = $link."<img src=\"".$image_base."sign_".$sign."_last.gif\" width=\"15\" height=\"19\" align=\"absbottom\" border=\"0\" alt=\"".$alt."\"></a>";
				} else {
					$sign = $link."<img src=\"".$image_base."sign_".$sign.".gif\" width=\"15\" height=\"19\" align=\"absbottom\" border=\"0\" alt=\"".$alt."\"></a>";
				}
			}

			$display_counter++;
//			echo "<tr>\r\n";
            $link  = "newsgroups.php?art_group=".urlencode($_SESSION["newsgroup"])."&article_id=".$message_info->nntp_message_id."";
            $mink  = "newsgroups.php?art_group=".urlencode($_SESSION["newsgroup"])."&message_id=".$message_info->nntp_message_id.""; 
			$otext = htmlescape(chop_str($message_info->subject, $subject_length_limit - $level*3));
			
			if (strlen($otext) > 20)
			{
			    $text = substr($otext,0,20) . "...";
			}
			else
			{
			    $text = $otext;
			}
			echo "<td nowrap=\"true\" align=center><font size=\"$font_size\">\r\n";
			echo "<a name=\"".$message_info->nntp_message_id."\">";
			#echo $old_indent;
			#echo $sign."<img src=\"".$image_base."message.gif\" width=\"13\" height=\"13\" align=\"absmiddle\" alt=\"#\">&nbsp;";
			
			
			if (strpos(strtolower($otext), "jpg") > 0)
			{
			    echo "<img src='../pimp/index.php?i=px' border='1' onclick=\"this.src='$mink&attachment_id=1'\" width='150'> <br>";
			}
			
			
			echo "<a href=\"$link\">";
			echo $text. "</a></font></td>\r\n";
					
					/*
			echo "<td nowrap=\"true\"><font size=\"$font_size\">\r\n";
			if ($_SESSION["auth"]) {
				echo "<a href=\"mailto:".htmlescape($message_info->from["email"])."\">";
			}
			echo htmlescape(chop_str($message_info->from["name"], $sender_length_limit));
			if ($_SESSION["auth"]) {
				echo "</a>";
			}
			echo "</font></td>\r\n";

			echo "<td nowrap=\"true\"><font size=\"$font_size\">".format_date($message_info->date)."</font></td>\r\n";
*/

			if (($display_counter % 5) == 0) {
				echo "</tr>\r\n";
				echo "<tr bgcolor=\"#".$secondary_color."\">\r\n";
			 }

			

			if ($is_last) {
				$indent = $old_indent."<img src=\"".$image_base."white.gif\" width=\"15\" height=\"19\" align=\"absbottom\" alt=\".\">";
			} else {
				$indent = $old_indent."<img src=\"".$image_base."bar_1.gif\" width=\"15\" height=\"19\" align=\"absbottom\" alt=\"|\">";
			}

			if ($node->is_show_children() && ($node->count_children() != 0)) {
				display_tree($node->get_children(), $level + 1, $indent);
			}
			$count++;
		}
	}
?>
