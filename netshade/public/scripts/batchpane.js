var
    Cellbrowse = {
        attach : function (cell) {
               var on = $("#text-page").val();
               return location.href = on + cell.id;

              $(cell).children ("img").each (function () {
                   var that = this, src = $(this).data ("rawSrc"), size = $(this).data ("sizeFactor"), im = new Image();
                   im.onload = function () {
                      that.src =  TextonPicture (this, "Eureka!", size) ;  
                   }
                   im.src = src;
              });
        } 
    },

    Sliderpane = {
   
        List : [],
        Square : {},
        Pic : {},
        Thumb : {},
        Caption : "",
        Picture : undefined,
        Canvas : undefined,
        Percent : -1,
        Unique : {},
        Full : false,
        Init : function (x, src) {
        //    if (this.Full) return;
            var ok = true, e = 0;
            this.Square [x].src = src;
            for (var n in this.Square) { e ++;
                if (!this.Square [x].src) {
                    ok = false;
                    break;
                }
            }
            if (!ok) return $(".estat").html (e + ". Not yet");
            this.Full = true;
            // $(".estat").html (e + " thumbnails")
            //this.Index = e;
            this.Draw ();
        },
       Clear : function (){

            this.List = [];
            this.Square = {};
            this.Index = 0;
 
		        if (!this.Canvas) return;
           
		                  var context = this.Canvas.getContext('2d');
		                  context.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
       },
        Write : function (caption) {  
            this.Caption = caption;
            this.Redraw();
            this.Render();
        },
        Add : function (caption, articleID, palette, index) {
              var chosen = index == SLIDE_OFFSET;
              if (chosen) this.caption = caption;

	      var object = { 
		             canvas   : palette, 
		             article  : articleID, 
		             index    : index, 
		             key      : /* !DIALOG_HILO ? index : */ Batchpane.Cheats[index].index, 
		             caption  : caption, 
		             thumb    : false,
		             image    : false,
		             old      : false,
		             src      : undefined,
		             w        : 64, 

		             set      : function (pic){ Sliderpane.Thumb[this.article] = pic; },
		             is       : function(){ return Sliderpane.Thumb[this.article]; },
		             draw     : function (CANVAS) {
                                  //Sliderpane.Unwind (1);

		                  if (!this.src) return; var cv = CANVAS;
		                   
		                  var thumbnail, that = this, api = CanvasAPI, span=this.w + 1, x = this.index * span, y = 1, context = cv.getContext('2d'), im = new Image(), 
		                         margin = 3, hash = this.article.substr (0,4);
		                   x += margin;

                                      if (Sliderpane.Unique[hash] == x) return;

                                     Sliderpane.Unique[hash] = x;

		                  var thumb = function (th, old) { 
		                          context.globalAlpha = chosen ? 1 : 0.55;
		                          context.clearRect(x, y - 1, span + 1, span + 1);
		                          if (chosen) {
		                              api.imagefilledrectangle  (context, x, y - 1, span + 1, span + 1, "#900") ;
		                          } else if (old) {
		                              api.imagefilledrectangle  (context, x, y - 1, span + 1, span + 1, "#333") ;
		                          } 
		                          api.imagecopyresized (context, th, 0, 0, th.width, th.height, x + 1, y, span - 1, span - 1); 
                                         Sliderpane.Unwind(-1);
		                   } 
 

		                  var picload = function (pic) {
		                      var src2 =  TextonPicture (pic, hash, span - 1) ; 
		                     // var src2 =  TextonPicture (pic, "#" + that.key, span - 1) ;   
		                      var t = new Image (); t.onload = function () {
		                          thumb (this);
		                      }
		                      t.src = src2;
		                      that.set(t);
		                  }  

		                  if (thumbnail = this.is()) return thumb (thumbnail, true);  

		                  im.onload = function () {
		                      picload(this);
		                  }
		                  im.onerror = function () {
		                      Sliderpane.Unwind(-1);
		                  }
		                  im.src = this.src;  
		             } 
                         } ;
            this.Square[ articleID ] = object;
            this.List.push(object);
           
            return object;
        },
        screen : function () {
             if (!this.Picture) {
               var that = this;
                for (var n in this.Square) {
                    $(this.Square[n].canvas).each (function (){
                        that.Picture = this;
                    }) 
                    break;
                }
                this.Canvas = document.createElement ("canvas"); 
                this.Canvas.width  = this.Picture.width;
                this.Canvas.height = this.Picture.height;
            }
            return this.Picture;
        },
        Index : 10,
        Unwind : function (i) { 
            this.Index -=- i;

             $(".dstat").html ("[[[ " + this.Index + " ]]]"); 

            if (this.Index < 3) this.Render();
        },
        Render : function () { 
             this.Picture.src = this.Canvas.toDataURL();
        },
        Redraw : function () { 

                  this.screen();

                     var api = CanvasAPI, context = this.Canvas.getContext('2d');
	              context.globalAlpha = 1.0;
	              context.clearRect(0, 68, this.Canvas.width, 20);

                      api.imagestring (context, "700 9pt Lato", 10, 80, Sliderpane.Caption, "#222" );

              return; 
        },
        Draw : function () { 
            this.Redraw ();
            for (var n in this.Square)
               this.Square[n].draw (this.Canvas);
        }
    }

    Batchpane = {
        Fave : new Image(),
        Batch : [],
        Index : {},
        Square : {},
        Pic : {},
        Thumb : {},
        Cheats : [], 
        Uncheat : function () { this.Cheats = [] },
        Cheat : function (id) { this.Cheats.push (id) },
        Dispose : function (id) {
            this.Batch[id] = null;
        },
        init : function () {
            this.Fave.src = FAVEB64;
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
             
             var test, username = Controller.getUsername();// undefined, rex = /user\/(\w+)\//, test = rex.exec (location.href);
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
                      var div = findBydata (this.tag, x), caption = this.caption [ x ]; 
                      if (!this.tries[x]) this.tries[x] = 1;
                      this.tries[x] ++;
                      if (this.tries[x] > 4) {
                          div.css ({color : "#900"})
                          write2Cell(div, "ERROR: Could not load {0}".format(caption)); 
                          return;
                      }
                      // div.html ("Retrying " + caption + "...");
                       this.render (x, 20);
                  },
                  render : function (x, i) {
                      var that=this, num=x, render = function () {
                           that.render_(num);
                       }
                      setTimeout (render, i * 100);
                  }, 
                  render_ : function (x) {
                      var that=this, renderKey = x, div = findBydata (this.tag, x), resize = this.size, 
                            request = "/rpc/smalltextpicture/id/{0}".format (x), marked = div.data ("bookMarked");

                            if (this.field) request += "/field/" + this.field;
 
                              var caption = this.caption [ x ];  
                       write2Cell(div, "Drawing {0} ({1})...".format(caption, this.tries[x]));

                      $ajax( request, function( uuid ) {   

                            var pic = new Image(), src =  "data:image/jpeg;base64,{0}".format(uuid);


                                          pic.onload = function () { 

                                               var exist, s = Sizer.fit (this, resize), size = resize < 0 ? s.h : resize, ex = "img-" + renderKey; 
                                               var source = TextonPicture (this, caption, resize, false, marked);
              
				                 var title = caption.replace (/"/g, ''), 
				                        im = "<img src='{3}' data-raw-src='{0}' data-size-factor='{2}' title=\"{1}\" data-inner-text=\"{1}\" />".format (
				                           this.src, title, resize, source); 
 
                                                    if (resize > 0 && Sliderpane.Square [x]) { 
                                                        return Sliderpane.Init(x, this.src);//Draw ();
                                                    }

                                                    div.children ("img").each (function () {
                                                           fadeIn (this, s.w, s.h, src, resize, caption); 
                                                          exist = true;
                                                    });

                                                   if (resize < 0 && localStorage ["playing"] && localStorage ["playing"]  == "on")
                                                       Controller.setNext() 

                                                   if (exist) { 
                                                      return;
                                                   } 

                                                   div.html (im);

                                                //   Batchpane.Dispose(ID);
                                                   
                                          } 
                               var onerror = function () {
                                    var retry = function () { Batchpane.Batch[ID].retry(renderKey) }
                                    setTimeout (retry, 300);
                               }
                               pic.onerror = onerror;
                               //if (src.indexOf ("Ns_Articledata") > 0) return onerror ();

                               pic.src = src;

//                          alert (request + "\n" + uuid);
                      }); 
                  },
                  poll : function () {
                      var that=this, ping = "/rpc/unbatch/batchkey/{0}".format(this.batchkey);

                       document.title = "Polling " + new Date().getSeconds();

                      $ajax( ping, function( response ) {    
                           
try 
{
                               var response = Batchpane.Response (response), ret = response.response; 
                               for (var id in ret) { 
                                   var x = that.batchkeys[id], div = findBydata (that.tag, x), obj = ret[id];
                                    if (obj.state != 'PENDING') that.started = true;
                                    if (x) {
                                       if (obj.state == "COMPLETE") {
                                               write2Cell(div, "Download complete...".format(x, obj.id)); 
                                       } else if (that.size < 0) { 
                                             write2Cell(div, obj.caption); 
                                       }
                                    }
                               }
}
catch (j)
{
    alert (j.message)
}

                               if (!(response.done || (response.hung && that.started)))
                                   return setTimeout (recheck, 1000);
                          
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
                      var uuid = undefined, Doc = $.parseXML( data ), xml = $( Doc ), tmp = {}, that = this , cnt = 0;

                      $(xml).find ('batch').each (function (){ 
                            uuid = $(this).attr ("key");
                       }); 

                         Sliderpane.Clear();

                      $(xml).find ('item').each (function (index){  

                            var key = $(this).attr ("key"), articleID = $(this).text();
                             var cell = findBydata (that.tag, articleID), caption = $(cell).html(), prefix = $(cell).data("articleCount"),
                                          palette = $(cell).data("canvasName"), innerText = Batchpane.Index[ articleID ] || caption, add2List = true;
                             if (!cell.length) return;  

                              if (prefix) innerText = "{0} items - {1}".format(prefix, innerText);
                               that.caption [ articleID ] =  innerText; 
                               that.tries [ articleID ] = 1;  

                              if (palette) {
                                  $(cell).css ("display", "none"); 
                                      var obj = Sliderpane.Add  (that.caption [ articleID ], articleID, palette, index);
                                }

                               tmp[key] = articleID;

                             write2Cell(cell, "Connected...");//$(cell).html ("Connected...");
                       }); 
                          Sliderpane.Index = Sliderpane.List.length; 
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

    function faded (picture, w, h, resize, alpha) {
         var api = CanvasAPI, canvas = document.createElement("canvas") , context = canvas.getContext('2d');
 
                  var s = Sizer.fit (picture, resize)
                  canvas.width = s.w;    
                  canvas.height = s.h;    
                  canvas.style.width = s.w + "px";   
                  canvas.style.height = s.h + "px";    


	    context.clearRect(0, 0, picture.width, picture.height);
	    context.globalAlpha = alpha;
             api.imagecopyresized (context, picture, 0, 0, picture.width, picture.height, s.x, s.y, s.w, s.h); 
           // api.imagestring (context, "700 19pt Lato", 50,50, alpha, "#f22"); 
	   // context.drawImage(picture, 0, 0);
           
           return canvas.toDataURL();

    }

    function fadex (before, after, w, h, resize, alpha) {
         var api = CanvasAPI, canvas = document.createElement("canvas") , context = canvas.getContext('2d');
 
                  var s = Sizer.fit (after, resize)
                  canvas.width = s.w;    
                  canvas.height = s.h;    
                  canvas.style.width = s.w + "px";   
                  canvas.style.height = s.h + "px";    


	    context.clearRect(0, 0, canvas.width, canvas.height);
	    context.globalAlpha = 1 - alpha;
             api.imagecopyresized (context, before, 0, 0, before.width, before.height, 0,0, s.w, s.h); 
	    context.globalAlpha = alpha;
             api.imagecopyresized (context, after, 0, 0, after.width, after.height, 0,0, s.w, s.h); 


            api.imagestring (context, "700 19pt Lato", 50,50, alpha, "#f22"); 
	   // context.drawImage(picture, 0, 0);
           
           return canvas.toDataURL();

    }

var fader={
   ash:[],
   add:function (picture, w, h, src, resize){
        var id=fader.ash.length,object = {
         picture:picture, w:w, h:h, src:src, resize:resize, alpha:1, i : -1, 
                  clone:undefined,before:undefined,after:undefined,


          go : function () { 
               var next = function () { fader.ash[id].go(); } 
               if (this.alpha > 1) return;
                this.alpha += 0.33;
		this.picture.src = faded(this.before, this.after, this.w, this.h, this.resize, this.alpha); 
                setTimeout (next, 333)
             }, 
          show : function (pic) { 
                this.after = pic;
		this.picture.width = this.w;
		this.picture.height = this.h;
		$(this.picture).attr ('data-raw-src', this.src); 
                this.go ();
             }, 
          getafter : function (pic) {
                this.before = pic;
                var that=this, im = new Image ();
                im.onload = function () {
                     this.onload = null;
                     that.show ();
                 }
                im.src = this.src;
             }, 
          getbefore : function () {
                var that=this, im = new Image ();
                this.alpha = 0;
                im.onload = function () {
                     this.onload = null;
                     that.getafter (this);
                 }
                im.src = this.picture.src;
             }, 




          next : function () {
               var next = function () { fader.ash[id].next(); }
               if (this.alpha < 0.5 && this.i == -1) return this.load ();
               if (this.alpha > 1) return;
                this.alpha += 0.33 * this.i; 
		this.picture.src = faded(this.clone, this.w, this.h, this.resize, this.alpha); 
                setTimeout (next, 333)
             }, 

          invoke : function (pic) {
                this.clone = pic;
		this.picture.width = this.w;
		this.picture.height = this.h;
		$(this.picture).attr ('data-raw-src', this.src); 
                this.next ();
             }, 


          hide : function () {
                var that=this, im = new Image ();
                im.onload = function () {
                     this.onload = null;
                     that.invoke (this);
                 }
                im.src = this.picture.src;
             }, 


          load : function () {
                this.i = 1;
                this.alpha = 0.33;
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

    function fadeIn (picture, w, h, src, resize, caption) {
        picture.onload = null; 

        var im = new Image (); im.onload = function () {
            picture.src = TextonPicture (this, caption, resize); 
            ServiceBus.OnPageResize();
        }

	if (resize < 1)  {
	    Controller.caption = caption;
	    Controller.marquee = picture;
	    Controller.src = src;
            Sliderpane.Write (caption);
	}

        picture.width = w;
        picture.height = h;
        im.src = src; 
        $(picture).data ('rawSrc', src); 
        $(picture).attr ('data-raw-src', src); 
    }

    function $a(im, w, h, size) { 
        var text = $(im).data("innerText") || "No caption detected";
        im.onload = null; 
        im.src = TextonPicture (im, text, size); 
    }

    function TextonPicture (picture, text, size, percent, marked) {
         var api = CanvasAPI, canvas = document.createElement("canvas") , context = canvas.getContext('2d'), 
                s = Sizer.fit (picture, size), x = size - picture.width, y = size - picture.height, 
                  w = size > 0 && size < 65 ? 64 : s.w, h = size > 0 && size < 65 ? 64 : s.h;

                  var s = Sizer.fit (picture, size)
                  canvas.width = w;    
                  canvas.height = h;    
                  canvas.style.width = w + "px";   
                  canvas.style.height = h + "px";  
  
           
           api.imagecopyresized (context, picture, 0, 0, picture.width, picture.height, s.x, s.y, s.w, s.h);  
           
           if (marked && marked.length > 0)
               context.drawImage(Batchpane.Fave, s.w - 24, 8);
            var loc = { y : size > 0 ? (size - 50) : (s.h - 50)}

  // text = [Math.round(w), h, '.', s.x, s.y].join ("x")

            api.imagestring (context, "700 9pt Lato", 10, loc.y, text, "#fff", null,
                                      s.w - 20, 16, 5);
            api.imagestring (context, "700 9pt Lato", 9, loc.y - 1, text, "#222", null,
                                      s.w - 20, 16, 5);

             if (percent != undefined) {
                    
                   api.imagefilledrectangle  (context, 0, s.h-4, s.w, 4, "#333") ;
                   api.imagefilledrectangle  (context, 0, s.h-4, s.w * percent, 4, "#0a0") ;
             }

           return canvas.toDataURL();
    }

    function write2Cell (cell, value) {
       var im, exist = false; 
       (cell).children ("img").each (function () { 
              // Sliderpane.Write (value); 
             var resize = $(this).data("sizeFactor"), src = $(this).data("rawSrc");
              im = this; 
              if (resize && src) {    
                  var i2 = new Image(); i2.onload = function () {
                      Sliderpane.Write (value); 
                        im.src =TextonPicture (this, value, resize);
                   } 
                  i2.src = src;
                  exist = true;
              } else document.title = resize + "::" + value; 
       })
       if (exist) return;
       else if (im) return im;
      document.title = value; 
      // $(cell).html (value);
       return false;
    }


   function findBydata (str,val) {
       try {
           var query = "*[{0}='{1}']".format(str, val); 
           return $(query);
       } catch (ex) { alert (ex.message) }
       return false;
   }
                                    
function connectRs(pic) {
   return;

         var picture = pic, resize = $(picture).data("sizeFactor"),
                w = picture.width, h=picture.height;
	 if (resize && resize < 0) { 
	         picture.invoke = function (sender, e) { 
                     document.title = resize + ": " + new Date().getMilliseconds();
		     this.width = w; 
		     this.height = h;    
		     var s = Sizer.fit (this, -1) 
		     this.width = s.w; 
		     this.height = s.h;    
	         } 
	         ServiceBus.Subscribe ("OnPageResize", picture); 
                 ServiceBus.OnPageResize(); 
	 } 

}

Batchpane.init ();

