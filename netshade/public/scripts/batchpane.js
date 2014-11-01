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
        Create : function (items, sizeof, tag, ondone, field) {
             
             var username = undefined, rex = /user\/(\w+)\//, test = rex.exec (location.href);
             if (test) username = test[1];
             if (!username) return alert ("Could not read username")
             if (items.length == 0) return;

             var value = items.join (","), command = "/rpc/batch/article/{0}/user/{1}".format(value, username), 
                    ID = Batchpane.Batch.length, recheck = function () { Batchpane.Poll(ID)}; 

             var object = {
                  ID : ID,
                  tag : tag, 
                  size : sizeof, 
                  batchkeys : {}, 
                  field : field, 
                  ondone : ondone, 
                  batchkey : undefined, 
                  command : command,
                  tries : { },
                  caption : { },
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
                       this.render (x, 1);
                  },
                  render : function (x, i) {
                      var that=this, num=x, render = function () {
                           that.render_(num);
                       }
                      setTimeout (render, i * 100);
                  },
                  render_ : function (x) {
                      var renderKey = x, div = findBydata (this.tag, x), resize = this.size, 
                            request = "/rpc/smalltextpicture/id/{0}".format (x);

                            if (this.field) request += "/field/" + this.field;
 
                              var caption = this.caption [ x ]; 

                      $ajax( request, function( uuid ) {   

                            var pic = new Image(), src =  "data:image/jpeg;base64,{0}".format(uuid);


                                          pic.onload = function () {
                                            //   this.onload = null;
                                                 Batchpane.Dispose(ID);


                                              var exist, s = Sizer.fit (this, resize), size = resize < 0 ? s.h : resize, ex = "img-" + renderKey;

                                                          // this.width = s.w;
                                                          // this.height = s.h;
                                               var source = TextonPicture (this, caption, resize);
                                                  

                                 var im = "<img src='{0}' data-raw-src='{0}' data-inner-text=\"{4}\" >".format (
                                           source, s.w, s.h, resize, caption.replace (/"/g, ''));

 
                                                   div.children ("img").each (function () {

                                                           fadeIn (this, s.w, s.h, src);
 
                                                          exist = true;
                                                    });


                                                   if (exist) { 
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
                                            //   write2Cell(div, "COMPLETE<br/>{0}<br/>{1}".format(x, obj.id));
                                           // div.html ("COMPLETE<br/>{0}<br/>{1}".format(x, obj.id));
                                          //  div.css ( { border : "none" })
                                       }
                                       //else div.css ( { border : "solid 1px #0f0" });
                                       // else div.html (obj.caption);
                                    }
                               }

                               if (!(response.done || (response.hung && that.started)))
                                   return setTimeout (recheck, 1000);
                          // }
                                   setTimeout (function () { that.final() }, 300)
                          
                        //  alert ("Done");
                      });  
                  },
                  final : function (data) {
                      var that=this, i = 0;
                          for (var n in this.batchkeys) { 
                               this.render(this.batchkeys[n], i++); 
                          }
                       if (this.ondone) 
                           this.ondone();
                  },
                  attach : function (data) {
                      var uuid = undefined, Doc = $.parseXML( data ), xml = $( Doc ), tmp = {}, that = this;  

                      $(xml).find ('batch').each (function (){ 
                            uuid = $(this).attr ("key");
                       }); 

                      $(xml).find ('item').each (function (){ 
                            var key = $(this).attr ("key");
                            tmp [key] = $(this).text();
                             var cell = findBydata (that.tag, tmp [key]), caption = $(cell).html(), prefix = $(cell).data("articleCount");
                             if (!cell.length) return;// alert ("Cannot find cell " + that.tag);
                              if (prefix) caption = "{0} items - {1}".format(prefix, caption)
                               that.caption [ tmp [key] ] = caption;

                             write2Cell(cell, "Connected...");//$(cell).html ("Connected...");
                       }); 

                      if (!uuid) return;// alert ("Parser fail");

                      this.batchkeys = tmp;
                      this.batchkey = uuid;
                      this.poll ();
                  }
             } 

             Batchpane.Batch.push (object);
             object.load ();
        }
    }

    function faded (picture, w, h, alpha) {
         var api = CanvasAPI, canvas = document.createElement("canvas") , context = canvas.getContext('2d');
 
                  canvas.width = w;    
                  canvas.height = h;    
                  canvas.style.width = w + "px";   
                  canvas.style.height = h + "px";    

	    context.clearRect(0, 0, picture.width, picture.height);
	    context.globalAlpha = 1;
	    context.drawImage(picture, 0, 0);
           
           return canvas.toDataURL();

    }

var fader={
   ash:[],
   add:function (picture, w, h, src){
        var id=fader.ash.length,object = {
         picture:picture, w:w, h:h, src:src, alpha:.1,clone:undefined,
          next : function () {
               var next = function () { fader.ash[id].next(); }
               if (this.alpha >= 1) return;
		this.picture.src = faded(this.clone, this.w, this.h, this.alpha); 
                this.alpha -=- 0.1; 
               // setTimeout (next, 250)
             }, 
          invoke : function (pic) {
                this.clone = pic;
		this.picture.width = this.w;
		this.picture.height = this.h;
		$(this.picture).attr ('data-raw-src', this.src); 
                this.next ();
             }, 
          load : function () {
                var that=this, im = new Image ();
                im.onload = function () {
                     this.onload = null;
                     that.invoke (this);
                 }
                im.src = this.src;
            }
         }

        fader.ash.push (object);
        object.load ();
    }
}

    function fadeIn (picture, w, h, src) {
        picture.onload = null;
        // return fader.add (picture, w, h, src);

        picture.width = w;
        picture.height = h;
        picture.src = src; 
        $(picture).attr ('data-raw-src', src); 
    }

    function $a(im, w, h, size) {
 
       var text = $(im).data("innerText") || "No caption detected";
       im.onload = null; 
       im.src = TextonPicture (im, text, size); 
    }

    function TextonPicture (picture, text, size) {
         var api = CanvasAPI, canvas = document.createElement("canvas") , context = canvas.getContext('2d');

                  var s = Sizer.fit (picture, size)
                  canvas.width = s.w;    
                  canvas.height = s.h;    
                  canvas.style.width = s.w + "px";   
                  canvas.style.height = s.h + "px";    
           var x = size - picture.width, y = size - picture.height;
           api.imagecopyresized (context, picture, 0, 0, picture.width, picture.height, s.x, s.y, s.w, s.h);  
            var loc = { y : size > 0 ? (size - 50) : (s.h - 50)}
            api.imagestring (context, "700 9pt Lato", 10, loc.y, text, "#fff", null,
                                      s.w - 20, 16, 5);
            api.imagestring (context, "700 9pt Lato", 9, loc.y - 1, text, "#222", null,
                                      s.w - 20, 16, 5);

           return canvas.toDataURL();
    }

    function write2Cell (cell, value) {
       var im;
       if (im = (cell).children ("img")) { 
          document.title = value;
          return im;
       }
       $(cell).html (value);
       return false;
    }


   function findBydata (str,val) {
       var query = "*[{0}='{1}']".format(str, val); 
       return $(query);
   }


