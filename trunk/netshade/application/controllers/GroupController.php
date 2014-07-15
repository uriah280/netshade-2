<?php

class GroupController extends Zend_Controller_Action
{

    public function init()
    {
            $this->_helper->layout->setLayout('device');
    }

    public function indexAction()
    {
        // action body
    }

    public function listAction()
    {

        $s = time();
        $ms = array();

        $request    = $this->getRequest(); 
        $groupname  = $request->getParam('name');  
        $user       = $request->getParam('user');  
        $page       = $request->getParam('page');  
        $find       = $request->getParam('find');  
        $most       = $request->getParam('most'); 
        $search     = $request->getParam('search');  
        $start      = ($page - 1) * PAGE_SIZE;
 
        $ms['user_get'] = time() - $s;
        $agent      = new Application_Model_ShadeUser($user);
        $ms['user_got'] = time() - $s;
 

        $suffix = isset ($find) ? "/find/{$find}" : "";
        $suffix .= isset ($most) ? "/most/{$most}" : "";
        $table = "Ns_Articleset";


        $group = Application_Model_Newsgroup::byName ($user, $groupname);
        $ms['group_got'] = time() - $s;

$back = array ('controller' => 'index', 'action' => 'display', 'user' => $user, 'name' => NULL, 'page' => NULL, 'search' => NULL, 'find' => NULL, 'most' => NULL);  
$next = array ('controller' => 'article', 'action' => 'index', 'on' => $page, 'page' => NULL, 'id' => NULL);  
$this->view->back    = $this->view->url ($back);
$this->view->next    = $this->view->url ($next) . "/id/";
$this->view->option  = "Settings";
  
       $this->crumb = array (
                  new Application_Model_Link ("Home", $this->view->url ($back))  
              );



        if (isset($search))
        {
            $ms['search_get'] = time() - $s;
            $result = Application_Model_SearchResult::byParam ($group -> Key, $search);
            $ms['search_got'] = time() - $s;
            $ms['news_get'] = time() - $s;
            $result -> GetArticles ($start, $most); 
            $ms['news_got'] = time() - $s;
            $articles = $result -> Articles; 
            $tally = $result -> Tally;
            $this->view->title   = "Articles like '{$search}' in {$groupname}";
            $this->view->refs    = $result -> Refs;

             $this->crumb[] = new Application_Model_Link ($groupname, $this->view->url (array('search'=>NULL, 'page'=>1))) ;
             $this->crumb[] = new Application_Model_Link ($this->view->title) ;
        }
        else 
        {
            $ms['news_get'] = time() - $s;
            $group -> GetArticles ($start, $find, $most, $table); 
            $ms['news_got'] = time() - $s;
            $articles = $group -> Articles;
            $tally = $group -> Tally;
            $this->view->title   = $groupname;
            $this->view->refs    = $group -> Refs;
            
            if (isset($find))
            {
                $this->crumb[] = new Application_Model_Link ($groupname, $this->view->url (array('find'=>NULL, 'page'=>1))) ;
                $this->crumb[] = new Application_Model_Link ("Articles like '{$find}'") ;
            }
            else 
            {
                $this->crumb[] = new Application_Model_Link ($groupname) ;
            }

            $ms['range_get'] = time() - $s;
            $group -> GetRange();
            $ms['range_got'] = time() - $s;
   
        }

        $params = Application_Model_SearchResult::Paramsof ($group->Key);

        $this -> view -> nav     = $this->crumb;

         $this -> view -> most   = $most;
         $this -> view -> page   = $page;
         $this -> view -> user   = $user; 
         $this -> view -> search = $search; 
            $ms['ask_get'] = time() - $s;
         $this -> view -> saved  = $agent->Subscribed ($group->Key);
            $ms['ask_got'] = time() - $s;
         $this -> view -> group  = $group; 
         $this -> view -> articles  = $articles; 
         $this -> view -> pages  = Application_Model_Paginator::Pages ($tally, $page, 
                                     $this->view->url(array('page'=>NULL)) . "/page/");


         $this -> view -> searches = $params; 

         var_dump ($ms);
         var_dump ($group->Metrics); 
    }

    public function joinAction()
    {

        $request    = $this->getRequest(); 
        $groupname  = $request->getParam('name');  
        $user       = $request->getParam('user');  
        $start      = $request->getParam('start');  
        $renew      = $request->getParam('renew');  
        $amount     = $request->getParam('amount');  
        if (!isset($amount)) $amount = 50000;

        $test       = new Application_Model_ShadeUser($user);

        $data = array (
              "userkey" => $test -> Serverkey
             , "groupname" => $groupname
             , "start" => $start
             , "renew" => $renew
             , "count" => $amount
             , "endpoint" => "queue.newsgroup"
         );
     
         $key = Application_Model_QMessage::Send ($data);
         $this->view->title    = "Joining {$groupname}...";
         $this -> view -> key  = $key;
         $this -> view -> user = $user;
         $this -> view -> name = $groupname;
    }


}

 

