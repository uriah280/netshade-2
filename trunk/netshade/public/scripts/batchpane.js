var
    Batchpane = {
        Batch : [],
        Dispose : function (id) {
            this.Batch[id] = null;
        },
        Poll : function (id) {
            this.Batch[id].poll();
        },
        Response : function (data) {
              var Doc = $.parseXML( data ), xml = $( Doc ), response = { } ,
                   done = true, hung = true; 
              $(xml).find ('Request').each (function (){ 
                   var tmp = { state : "PENDING" };
		   $(this).children().each(function() {   
		        tmp[this.tagName]=$(this).text();
		   }); 

                   hung = hung && tmp.state == 'PENDING';
                   done = done && tmp.state == 'COMPLETE';
                   response[tmp.id] = tmp;

                 }); 

            return { 
                done : done, hung : hung, response : response
            } 
        }, 
        Create : function (items, sizeof, tag, ondone) {
             
             var username = undefined, rex = /user\/(\w+)\//, test = rex.exec (location.href);
             if (test) username = test[1];
             if (!username) return alert ("Could not read username")
             
             var value = items.join (","), command = "/rpc/batch/article/{0}/user/{1}".format(value, username), 
                    ID = Batchpane.Batch.length, recheck = function () { Batchpane.Poll(ID)}; 

             var object = {
                  ID : ID,
                  tag : tag, 
                  size : sizeof, 
                  batchkeys : {}, 
                  ondone : ondone, 
                  batchkey : undefined, 
                  command : command,
                  tries : { },
                  started : false,
                  load : function () {  

                     $ajax( this.command, function( uuid ) {    
                               Batchpane.Batch [ID].attach (uuid);
                      }); 
                  },
                  retry : function (x) {
                      if (!this.tries[x]) this.tries[x] = 1;
                      this.tries[x] ++;
                      if (this.tries[x] > 4) return;
                       this.render (x);
                  },
                  render : function (x) {
                      var renderKey = x, div = findBydata (this.tag, x), resize = this.size, request = "/rpc/smalltextpicture/id/{0}".format (x);
                      $ajax( request, function( uuid ) {   

                            var pic = new Image(), src =  "data:image/jpeg;base64,{0}".format(uuid);


                                          pic.onload = function () {
                                                 Batchpane.Dispose(ID)
                                              var s = Sizer.fit (this, resize), size = resize < 0 ? s.h : resize, ex = "img-" + renderKey,
                                                  im = "<img src='{0}' width='{1}' height='{2}'>".format (src, s.w, s.h);
                                                   if ($(ex).length) {
                                                       $(ex).each (function (){
                                                           this.width = s.w;
                                                           this.height = s.h;
                                                           this.src = src; 
                                                       });
                                                       return;
                                                   }
                                                   div.html (im);
                                          } 

                               pic.onerror = function () {
                                    var retry = function () { Batchpane.Batch[ID].retry(renderKey) }
                                    setTimeout (retry, 3000);
                               }
                               pic.src = src;

//                          alert (request + "\n" + uuid);
                      }); 
                  },
                  poll : function () {
                      var that=this, ping = "/rpc/unbatch/batchkey/{0}".format(this.batchkey);

                       document.title = "Polling " + new Date().getSeconds();

                      $ajax( ping, function( response ) {    
                           // if (confirm (response)) {
                               var response = Batchpane.Response (response), ret = response.response; 
                               for (var id in ret) { 
                                   var x = that.batchkeys[id], div = findBydata (that.tag, x), obj = ret[id];
                                    if (obj.state != 'PENDING') that.started = true;
                                    if (x) {
                                       if (obj.state == "COMPLETE") {
                                            div.html ("COMPLETE<br/>{0}<br/>{1}".format(x, obj.id));
                                       }
                                       else div.html (obj.caption);
                                    }
                               }

                               if (!(response.done || (response.hung && that.started)))
                                   return setTimeout (recheck, 3000);
                          // }
                                   setTimeout (function () { that.final() }, 300)
                          
                        //  alert ("Done");
                      });  
                  },
                  final : function (data) {
                      var that=this
                          for (var n in this.batchkeys) {
                                var x = this.batchkeys[n]
                               this.render (x); 
                          }
                       if (this.ondone) 
                           this.ondone();
                  },
                  attach : function (data) {
                      var Doc = $.parseXML( data ), xml = $( Doc ), tmp = {}, that = this; 
 

                      $(xml).find ('batch').each (function (){ 
                            uuid = $(this).attr ("key");
                       }); 

                      $(xml).find ('item').each (function (){ 
                            var key = $(this).attr ("key");
                            tmp [key] = $(this).text();
                             var cell = findBydata (that.tag, tmp [key]);

                             $(cell).html ("Connected...");
                       }); 

                      if (!uuid) return alert ("Parser fail");

                      this.batchkeys = tmp;
                      this.batchkey = uuid;
                      this.poll ();
                  }
             } 

             Batchpane.Batch.push (object);
             object.load ();
        }
    }



   function findBydata (str,val) {
var query = "*[{0}='{1}']".format(str, val); 
       return $(query);
   }


