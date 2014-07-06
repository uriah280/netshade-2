<?php

class ArticleController extends Zend_Controller_Action
{

    var $crumb;
    public function init()
    {
       $this->_helper->layout->setLayout('device');
       $this->view->addScriptPath(HOME_PATH . "netshade/application/views/partials");

        $request    = $this->getRequest();  
        $find = $request->getParam('find');  
        $most = $request->getParam('most');  
        $on   = $request->getParam('on');    
        $id   = $request->getParam('id');  
        $suffix = isset ($find) ? "/find/{$find}" : "";
        $suffix .= isset ($most) ? "/most/{$most}" : "";
        $this -> view -> suffix  = $suffix;
        $this -> view -> on      = $on;
        $this -> view -> id      = $id;


        $home = array ('action' => 'display', 'controller' => 'index', 'on'=>NULL, 'id'=>NULL, 'page'=>NULL, 'find'=>NULL, 'most'=>NULL, 'name'=>NULL, 'sort'=>NULL);    
       $this->crumb = array (
                  new Application_Model_Link ("Home", $this->view->url ($home))  
              );
        $this -> view -> nav     = $this->crumb;


    }

    public function indexAction()
    {
        $request    = $this->getRequest(); 
        $id   = $request->getParam('id');  
        $on   = $request->getParam('on');  
        $page = $request->getParam('page');   
        $find = $request->getParam('find');  
        $most = $request->getParam('most');  
        $sort = $request->getParam('sort');  
        $suffix = isset ($find) ? "/find/{$find}" : "";
        $suffix .= isset ($most) ? "/most/{$most}" : "";
        $suffix .= isset ($sort) ? "/sort/{$sort}" : "";
        if (!isset($page)) $page = 1;
        $start  = ($page - 1) * PAGE_SIZE;

        $article = Application_Model_Articleset::byId ($id, $start);
        $article -> GetArticles ($start, isset($sort));


        $counter = Application_Model_Articleset::byId ($id);
        $counter -> GetArticles (-1, isset($sort));


$back = array ('controller' => 'group', 'action' => 'list', 'page' => $on, 'on' => NULL, 'id' => NULL
        , 'name' => $article->groupname, 'user' => $article->username);  

$next = array ('action' => 'list', 'from' => $article->uuid, 'id' => NULL);  
$this->view->back    = $this->view->url ($back);
$this->view->next    = $this->view->url ($next) . "/id/";
$this->view->title   = $article -> subject; 
$this->view->option  = "Settings"; 


        $this->crumb[] = new Application_Model_Link ($article -> groupname, $this->view->back) ;

        $this->crumb[] = new Application_Model_Link ($article -> subject) ;
        $this -> view -> nav     = $this->crumb;


        $this -> view -> page    = $page; 
        $this -> view -> start   = $start;
        $this -> view -> sort    = $sort; 
        $this -> view -> article = $article;
        $this -> view -> counter = $counter;
        $this -> view -> pages   = Application_Model_Paginator::Pages ($article -> count, $page, 
                                     $this->view->url (array('page'=>NULL)) . '/page/');
    }

    public function onrarAction()
    {
        $request    = $this->getRequest();  
        $of         = $request->getParam('of');   
        $rar        = $request->getParam('r');  
         
        $article = Application_Model_Articleset::byId ($rar);  
        $article -> GetRars (); 
        $article -> GetInfo ();

$back = array('controller' => 'article' , 'action' => 'unrar' , 'of' => NULL );
$this->view->back    = $this->view->url ($back);
$this->view->title   = $article -> subject;
$this->view->option  = "Settings"; 
$this->view->css     = "float";

        $this -> view -> article = $article; 
        $this -> view -> key = $of; 
 
    }

    public function listAction()
    {
        $request    = $this->getRequest();   
        $id         = $request->getParam('id');   
        $from = $request->getParam('from');  
        $page = $request->getParam('page');    

        $article = Application_Model_Articleset::byId ($from);
        $chosen  = Application_Model_Articleset::byId ($id);
        $article -> GetArticles ();


$main = array ('controller' => 'group', 'action' => 'list', 'page' => $on, 'on' => NULL, 'id' => NULL
        , 'name' => $article->groupname, 'user' => $article->username);  


$back = array ('action' => 'index', 'from' => NULL, 'id' => $from);  
$next = array ('id' => NULL);  
$this->view->back    = $this->view->url ($back);
$this->view->next    = $this->view->url ($next) . "/id/";
$this->view->title   = $article -> subject;
$this->view->css     = "float";
$this->view->option  = "Settings"; 


        $this->crumb[] = new Application_Model_Link ($article -> groupname, $this->view->url($main)) ;
        $this->crumb[] = new Application_Model_Link ($article -> subject, $this->view->back) ;
        $this->crumb[] = new Application_Model_Link ($chosen -> subject) ;
        $this -> view -> nav     = $this->crumb;


        $this -> view -> page    = $page;  
        $this -> view -> article = $article;
        $this -> view -> chosen  = $chosen;
    }

    public function rarAction()
    {
        $request    = $this->getRequest();  
        $id         = $request->getParam('id');   
        $page       = $request->getParam('page');  
        $on         = $request->getParam('on');   
        $get        = $request->getParam('get');  
        $all        = $request->getParam('all');  
        if (!isset($page)) $page = 1;
        $start  = ($page - 1) * PAGE_SIZE;

        $article = Application_Model_Articleset::byId ($id);
        $article -> GetArticles ($start);   
        $article -> GetInfo ();   

        $this -> view -> article = $article;  
        $this -> view -> pages   = Application_Model_Paginator::Pages ($article -> count, $page, 
                                     $this->view->url (array('page'=>NULL)) . '/page/');
 

$back = array ('controller' => 'group', 'action' => 'list', 'page' => $on, 'on' => NULL, 'id' => NULL);   
$this->view->back    = $this->view->url ($back); 
$this->view->title   = $article -> subject;  
$this->view->option  = "Settings"; 


        if (isset ($get))
        { 
            if (isset($all))
            {
                $temp = array($get);
                foreach ($article -> items as $i )
                {
                    $temp[] = $i -> uuid;
                }
                $get = implode (',', $temp); 
            }
            $ret = $_SERVER["REQUEST_URI"];
            $pos = strpos($ret, "/get/");
            $ret = $this->view->url (array('get'=>NULL));//substr ($ret, 0, $pos);
            $flashMessenger = $this->_helper->FlashMessenger;
            $flashMessenger->addMessage($ret);
   

            $urlOptions = array('controller'=>'rpc', 'action'=>'thumb'
                                  , 'name' => $article->groupname
                                  , 'article' => $get
                                  , 'user' => $article->username
                                  , 'type' => 'queue.rar');
 

            $this->_helper->redirector->gotoRoute($urlOptions);

        }
              
    }

    public function unrarAction()
    {
        $request    = $this->getRequest();  
        $rar        = $request->getParam('r');  
        $page       = $request->getParam('p');  
        if (!isset($page)) $page = 1;
        $start  = ($page - 1) * PAGE_SIZE;
        $article = Application_Model_Articleset::byId ($rar); 


        $counter = Application_Model_Articleset::byId ($rar);
        $counter -> GetRars ();

        $article -> GetInfo ();
        $article -> GetRars ($start);   


$back = array ('action' => 'rar', 'r'=>NULL, 'p'=>NULL); 
$this->view->back    = $this->view->url ($back); 
$this->view->title   = $article -> subject;  
$this->view->option  = "Settings"; 

        $this -> view -> article = $article; 
        $this -> view -> counter = $counter; 
        $this -> view -> start   = $start;
        $this -> view -> page    = $page;
        $this -> view -> pages   = Application_Model_Paginator::Pages ($article -> count, $page, 
                                     $this->view->url (array('p'=>NULL)) . '/p/');
    }



}









