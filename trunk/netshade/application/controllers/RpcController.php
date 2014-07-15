<?php

class RpcController extends Zend_Controller_Action
{

    public function init()
    {
        $this->_helper->layout->disableLayout();
    }

    public function indexAction()
    {
        // action body
    }

    public function receiveAction()
    {
        $request    = $this->getRequest(); 
        $id         = $request->getParam('id');  
        echo Application_Model_QMessage::Receive ($id);
    }

    public function groupsAction()
    {
        $request    = $this->getRequest();   
        $user       = $request->getParam('user');  
        $test       = new Application_Model_ShadeUser($user);
        $data = array (
               "userkey" => $test -> Serverkey 
             , "endpoint" => "queue.server"
         );
         echo Application_Model_QMessage::Send ($data);
    }

    public function rarAction()
    {
        // action body
    }

    public function thumbAction()
    {

        $request    = $this->getRequest(); 
        $groupname  = $request->getParam('name'); 
        $article    = $request->getParam('article');  
        $table      = $request->getParam('table');  
        $user       = $request->getParam('user');  
        $type       = $request->getParam('type');  
        $test       = new Application_Model_ShadeUser($user);

        $uuid = $article;
        if ( strpos ($article, ",") !== false )
        {
            $temp = explode (",",  $article);
            $uuid = $temp[0];
        }

        $endpoint   = isset ($type) ? $type : "queue.article";
         

        $tmp = Application_Model_Articleset::byId ($uuid);
 

            $tmp ->  GetInfo();

        if ($tmp->Exists()) {
             echo "-1";
             return;
         }

        if ($tmp->type == "rar") {
             $endpoint = "queue.rar";
         }

        if (!isset($groupname))
        {
            $groupname = $tmp -> groupname;
        }

        $data = array (
              "userkey" => $tmp -> serverkey
             , "groupname" => $groupname 
             , "article" => $article 
             , "endpoint" => $endpoint
             , "uuid" => $uuid
         );


         $key = Application_Model_QMessage::Send ($data);
        if (isset ($type))
        { 
            $this->_helper->layout->setLayout('device');
            $aMessages = $this->_helper->FlashMessenger->getMessages();
            $url = $aMessages[0]; 
            $this->view->title = "Downloading {$tmp->subject}...";
            $this->view->back = $url;
            echo "<div class='msmq-id' id='{$url}'>{$key}</div>";
            return;
        }

         echo $key;

     
    }

    public function pictureAction()
    {
        $request    = $this->getRequest(); 
        $id         = $request->getParam('id'); 
        $type       = $request->getParam('type');   
        if ($type == "rar") $article = Application_Model_Articlerar::byId ($id); 
        else $article = Application_Model_Articleset::byId ($id);

        $article -> Render ();
    }

    public function subscribeAction()
    {
        $request    = $this->getRequest(); 
        $id         = $request->getParam('id'); 
        $user       = $request->getParam('user');  
        $test       = new Application_Model_ShadeUser($user);
        echo $test -> Subscribe ($id);
    }

    public function bookmarkAction()
    {
        $request    = $this->getRequest(); 
        $id         = $request->getParam('id'); 
        $user       = $request->getParam('user');  
        $test       = new Application_Model_ShadeUser($user);
        echo $test -> Bookmark ($id);
    }

    public function getArticlesAction()
    {
        $request    = $this->getRequest(); 
        $groupid    = $request->getParam('group');  
        $page       = $request->getParam('page');  
        $group      = Application_Model_Newsgroup::byId ($groupid);
        $start      = ($page - 1) * 8;
        $group -> GetArticles ($start);
        $array = array ();
        foreach ($group->Articles as $article)
        {
            if ($article->type == 'picture')
                $array[] = $article->uuid;
        }
        echo implode (',', $array);
    }

    public function smallAction()
    {
        $request    = $this->getRequest(); 
        $id         = $request->getParam('id'); 
        $type       = $request->getParam('type'); 
        $table      = $request->getParam('table');  
        if ($type == "rar") $article = Application_Model_Articlerar::byId ($id);
        else if (isset ($table)) $article = Application_Model_Articleset::byId ($id, -1, $table) ;
        else $article = Application_Model_Articleset::byId ($id);
        $article -> Render ("thumb");
    }

    public function getKeysAction()
    {
        $request    = $this->getRequest(); 
        $id         = $request->getParam('id'); 
        $article    = Application_Model_Articleset::byId ($id);
        echo $article->id;
    }

    public function findAction()
    {
        $request    = $this->getRequest(); 
        $groupname  = $request->getParam('name'); 
        $param      = $request->getParam('param');  
        $user       = $request->getParam('user');  
        $test       = new Application_Model_ShadeUser($user);
 

        $data = array (
              "userkey" => $test -> Serverkey
             , "groupname" => $groupname 
             , "param" => $param 
             , "endpoint" => "queue.newsgroup"
         );

            $this->_helper->layout->setLayout('device');
         $this->view->user  = $user;
         $this->view->param = $param;
         $this->view->name  = $groupname;
         $this->view->key   = Application_Model_QMessage::Send ($data);
    }

    public function randomofAction()
    {
        $request    = $this->getRequest(); 
        $id         = $request->getParam('id'); 
        $article    = Application_Model_Articleset::byId ($id);
        echo $article->Randomof();
    }

    public function connectAction()
    {
        $request    = $this->getRequest();  
        $user       = $request->getParam('user');  
        $test       = new Application_Model_ShadeUser($user);


        $data = array (
              "userkey" => $test -> Serverkey 
             , "renew" => "connect"
             , "endpoint" => "queue.newsgroup"
         );


            $this->_helper->layout->setLayout('device');
         $key = Application_Model_QMessage::Send ($data);

            echo "<div class='msmq-id' id='/index/groups/user/{$user}'>{$key}</div>";
 



    }

    public function picsofAction()
    {
        $request    = $this->getRequest(); 
        $groupname  = $request->getParam('name');  
        $user       = $request->getParam('user');  
        $group = Application_Model_Newsgroup::byName ($user, $groupname);
        $pics = $group->GetPictures ();
         $ret = array();

         foreach ($pics as $pic)
         {
              $ret[] = " <item>
   <uuid><![CDATA[{$pic -> uuid}]]></uuid>
   <subject><![CDATA[{$pic -> subject}]]></subject>
   <groupname><![CDATA[{$pic -> groupname}]]></groupname>
   <ref><![CDATA[{$pic -> ref}]]></ref>
   <count><![CDATA[{$pic -> count}]]></count>
   <username><![CDATA[{$pic -> username}]]></username></item>";
         }
            $ret = implode ("\n", $ret);
         echo "<list> {$ret} </list>" ; 
    }


}





























