<?php

class IndexController extends Zend_Controller_Action
{

    public function init()
    {
       $this->_helper->layout->setLayout('device');
    }

    public function indexAction()
    {
    }

    public function displayAction()
    {
        $request    = $this->getRequest(); 
        $user       = $request->getParam('user');  
        $test = new Application_Model_ShadeUser($user);
        $this->view->Groups   = $test -> SubscribedGroups;    
        $this->view->User     = $user;
        $this->view->title    = "Subscribed groups";
        $a=array();
        foreach ($this->view->Groups as $g)
        {
            $a[$g->Name] = $g->GetPictures ();
        } 
        $this->view->Pics     = $a;
        $this->view->css      = "float";

    }

    public function bookmarksAction()
    {
        $request    = $this->getRequest(); 
        $user       = $request->getParam('user');  
        $test = new Application_Model_ShadeUser($user);
        $this->view->Bookmarks   = $test -> Bookmarks;    
        $this->view->List        = $test -> GetBookmarkList();
        $this->view->User        = $test;
        $this->view->title    = "Bookmarks";
    }

    public function groupsAction()
    {
        $request    = $this->getRequest(); 
        $user       = $request->getParam('user');  
        $page       = $request->getParam('page');  
        $find       = $request->getParam('find');  
        if (!isset($page)) $page = 1;
        $suffix = isset ($find) ? "/find/{$find}" : "";
        $start      = ($page - 1) * 18;
        $test = new Application_Model_ShadeUser($user);
        $test->GetServerGroups ($start, $find, 18);
        $this->view->Groups   = $test -> Groups;    
        $this->view->User     = $user;

        $this->view->title    = "All groups";

         $this -> view -> pages  = Application_Model_Paginator::Pages ($test -> Groupcount, $page, 
                                     $this->view->url (array('page'=>NULL)) . '/page/', PAGE_PATTERN, 18);
    }


}







