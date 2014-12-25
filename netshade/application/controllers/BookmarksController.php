<?php

class BookmarksController extends Zend_Controller_Action
{
    var $crumb;
    public function init()
    {
       $this->_helper->layout->setLayout('device');
       $this->view->addScriptPath(HOME_PATH . "netshade/application/views/partials");
       
        $home = array ('action' => 'display', 'controller' => 'index', 'article' => NULL, 'id' => NULL, 'page' => NULL, 'p' => NULL, 'pg' => NULL, 'key' => NULL, 'from' => NULL);   
        $self = array ('action' => 'index', 'controller' => 'bookmarks', 'article' => NULL, 'id' => NULL, 'page' => NULL, 'pg' => NULL, 'from' => NULL);   

       $this->crumb = array (
                  new Application_Model_Link ("Home", $this->view->url ($home)) 
                , new Application_Model_Link ("Bookmarks", $this->view->url ($self)) 
              );
        $this -> view -> nav     = $this->crumb;
      }

    public function indexAction()
    {
        $request    = $this->getRequest(); 
        $user       = $request->getParam('user');  
        $page       = $request->getParam('pg');  
        if (!isset($page)) $page = 1;
        $start      = ($page - 1) * PAGE_SIZE;

        $home = array ('action' => 'display', 'controller' => 'index', 'pg' => NULL);   

       $this->crumb = array (
                  new Application_Model_Link ("Home", $this->view->url ($home)) 
                , new Application_Model_Link ("Bookmarks") 
              );

        $this -> view -> nav     = $this->crumb;


        $this->view->title    = "Bookmarks";
        $next = array ('action' => 'list');   
        $this->view->next    = $this->view->url ($next) . "/article/"; 


        $this->view->User = new Application_Model_ShadeUser($user);  
        $this->view->List = $this->view->User->GetBookmarkList ($start);
        $this -> view -> pages  = Application_Model_Paginator::Pages ($this-> view-> User -> count, $page, 
                                     $this->view->url (array('pg'=>NULL)) . "/pg/");  
    }

    public function listAction()
    {
        $request    = $this->getRequest(); 
        $user       = $request->getParam('user');
        $article    = $request->getParam('article');  
        $page       = $request->getParam('p');  
        if (!isset($page)) $page = 1;
        $start      = ($page - 1) * PAGE_SIZE;

        $this->view->User = new Application_Model_ShadeUser($user);
        $_article   = Application_Model_Articleset::byId($article);  
        $_article -> GetInfo ();
 
         $this->view->List = $this->view->User->GetBookmarks ( $_article -> groupname, $start );
 

$back = array ('action' => 'index', 'article' => NULL, 'p' => NULL);   
$next = array ('action' => 'show');   
$this->view->next    = $this->view->url ($next) . "/id/"; 
$this->view->back    = $this->view->url ($back);
$this->view->title   = "Bookmarks in {$_article -> groupname}";


        $this->crumb[] = new Application_Model_Link ($_article -> groupname) ;
        $this -> view -> nav     = $this->crumb;

        $this->view->user =  $user ;
        $this->view->group =  $_article -> groupname ;

        $this -> view -> pages  = Application_Model_Paginator::Pages ($this-> view-> User -> count, $page, 
                                     $this->view->url (array('p'=>NULL)) . "/p/");  
    }

    public function showAction()
    {
        $request    = $this->getRequest(); 
        $id   = $request->getParam('id');   
        $page = $request->getParam('page');  
        $sort = $request->getParam('sort');  
        if (!isset($page)) $page = 1;
        $start  = ($page - 1) * PAGE_SIZE;

        $article = Application_Model_Articleset::byId ($id, $start);
        $counter = Application_Model_Articleset::byId ($id);
        $unrar   = "";

        $article -> GetRars ($start);  

        if (sizeof ($article -> items) > 0)
        {
            $counter -> GetRars (); 
            $unrar = "unrar";
        }
        else
        {
            $article -> GetArticles ($start, isset($sort));  
            $counter -> GetArticles (-1, isset($sort)); 
        }


$back = array ('action' => 'list', 'id' => NULL, 'page' => NULL, 'sort' => NULL);   
$next = array ('action' => 'display');  
 
$this->view->next    = $this->view->url ($next) . "/key/"; 
$this->view->back    = $this->view->url ($back);
$this->view->title   = $article -> subject;  

$this->crumb[] = new Application_Model_Link ($article -> groupname, $this->view->url ($back)) ;
$this->crumb[] = new Application_Model_Link ($article -> subject) ;


        $this -> view -> page    = $page; 
        $this -> view -> start   = $start;
        $this -> view -> unrar   = $unrar;
        $this -> view -> sort    = $sort; 
        $this -> view -> article = $article;
        $this -> view -> counter = $counter;
        $this -> view -> nav     = $this->crumb;
        $this -> view -> pages   = Application_Model_Paginator::Pages ($article -> count, $page, 
                                     $this->view->url(array('page'=>NULL)) . "/page/");
    }

    public function displayAction()
    {
        $request    = $this->getRequest();   
        $id         = $request->getParam('id');   
        $key        = $request->getParam('key'); 
        $sort       = $request->getParam('sort');     
        $unrar   = "";

        $article = Application_Model_Articleset::byId ($id);
        $article -> GetRars (); 
        if (sizeof ($article -> items) == 0) 
        {
            $article -> GetArticles (-1, isset($sort)); 
            $chosen  = Application_Model_Articleset::byId ($key);
        }
        else 
        {
            $chosen  = Application_Model_Articlerar::byId ($key);
            $unrar = "unrar";
        }



$prev = array ('action' => 'list', 'id' => NULL, 'page' => NULL, 'key' => NULL);   
$back = array ('action' => 'show', 'key' => NULL);   
$next = array ('key' => NULL);  
 
$this->crumb[] = new Application_Model_Link ($article -> groupname, $this->view->url ($prev)) ;
$this->crumb[] = new Application_Model_Link ($article -> subject, $this->view->url ($back)) ;
$this->crumb[] = new Application_Model_Link ($chosen -> subject) ;

$this->view->next    = $this->view->url ($next) . "/key/"; 
$this->view->back    = $this->view->url ($back);
$this->view->title   = $article -> subject;  
$this->view->option  = "Settings";  
$this->view->css     = "float";  


        $this -> view -> article = $article;
        $this -> view -> chosen  = $chosen;
        $this -> view -> unrar   = $unrar;
        $this -> view -> nav     = $this->crumb;
    }


}







