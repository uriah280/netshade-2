<?
/*
	This PHP script is licensed under the GPL

	Author: Terence Yim
	E-mail: chtyim@gmail.com
	Homepage: http://web-news.sourceforge.net
*/
$user = "1053900012";
$pass = "cyber8";
    $_SESSION["auth"] = TRUE;
 
?>
<font face="<? echo $font_family; ?>">
<table cellspacing="2" cellpadding="2" border="0" width="100%">
	<tr>
<?
                if (!is_requested("art_group") || (strcmp(get_request("art_group"), $_SESSION["newsgroup"]) == 0)) {
?>
		<td nowrap="true">
			<form action="newsgroups.php">
				<input type="hidden" name="compose" value="reply">
				<input type="hidden" name="mid" value="<? echo $article_id ?>">
				<input type="submit" value="<? echo $messages_ini["control"]["reply"]; ?>" style="<? echo $form_style_bold; ?>"></form></td>
<?
		}
?>
		<td nowrap="true" width="100%">
			<form action="newsgroups.php">
				<input type="hidden" name="mid" value="<? echo $article_id; ?>">
				<input type="hidden" name="renew" value="0">
<?
				if (isset($_SESSION["search_txt"])) {
?>
				<input type="submit" value="<? echo $messages_ini["control"]["return_search"]; ?>" style="<? echo $form_style_bold; ?>"></form></td>
<?
				} else {
?>
				<input type="submit" value="<? echo $messages_ini["control"]["return"]; ?>" style="<? echo $form_style_bold; ?>"></form></td>
<?
				}
?>
	</tr>
</table>

<?

 $nntp = new NNTP($nntp_server, $user, $pass);
	
	if (!$nntp->connect()) {
		echo "<b>".$messages_ini["error"]["nntp_fail"]."</b><br>";
		echo $nntp->get_error_message()."<br>";
	} else {
		if (is_requested("art_group")) {
			$group_info = $nntp->join_group(get_request("art_group"));
		} else {
			$group_info = $nntp->join_group($_SESSION["newsgroup"]);
		}
		
		if ($group_info == NULL) {
			echo "<b>".$messages_ini["error"]["group_fail"].$_SESSION["newsgroup"]." </b><br>";
			echo $nntp->get_error_message()."<br>";
		} else {
			$MIME_Message = $nntp->get_article($article_id);

			if ($MIME_Message == NULL) {
				echo "<b>".$messages_ini["error"]["article_fail"]."$article_id </b><br>";
				echo $nntp->get_error_message()."<br>";
			} else {
				include("webnews/article_template.php");
			}
		}	
	}
?>

</font>
