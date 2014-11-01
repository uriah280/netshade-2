var
    DEFAULT_SIZE = 1024,
    THUMB_SIZE = 244,
    TINY_SIZE = 64,
    THUMB_SUFFIX = "",
    DIALOG_VISIBLE = true,
    DIALOG_HILO = true,

    Rangefrom = function (options, start)
    { 
            var countof = options.length , full = 7, SPAN = Math.floor (full / 2), range = [];

        if (start > 0)
        {
            range.push( {      index   : 0
                             , text    : options[0].text
                             , article : options[0].value
                           }  );
        }


        if ((countof - start) < 3)
        {
            SPAN = full - (countof - start );
        } 

        if (start > SPAN)
        {
            var f = Math.max (1, Math.floor (start / SPAN)), o = f;
            while (o < start && range.length < SPAN)
            {  
                range.push( {    index   : o 
                               , text    : options[o].text
                               , article : options[o].value
                           }  );
                o += f;
            }  
        }

        SPAN = full - range.length - 1;

        var o = start, spanof  = countof - o , f = Math.max (1, Math.floor (spanof / SPAN));
        while (o < countof)
        {  
            range.push( {      index   : o 
                             , text    : options[o].text
                             , article : options[o].value
                           }  );
            o += f;
        }  


        if (range[range.length-1].index != (options.length - 1)) 
            range.push( {      index   : options.length - 1
                             , text    : options[options.length - 1].text
                             , article : options[ options.length - 1 ].value
                        });

        return range;
    },

    Singleton = (function () {

	    var instance;

	    function createInstance(callback) {

                    var onload = callback;
                     var worker = new Worker('/scripts/async.js?' + new Date().getTime());
                     worker.onmessage = function(e) {
                          var msg = e.data.content; 
                          onload(msg);
                       }
                       worker.onerror = function (e) { confirm("Err:" + typeof(e.message)); }
                   return worker;

	    }

	    return {
		getInstance: function (callback) {
		    if (!instance) {
		        instance = createInstance(callback);
		    }

		    return instance;
		}
	    };
    })(),

    Controller = {
        view : function (i) {
                  var on = $("#text-page").val(), id = i, o = this.id + "_old";  


             $(".article-scale").each (function () {   
                   $(this).attr ("data-scale-key", id);
        //     alert ($(this).attr ("data-scale-key"))
                  Batchpane.Create ([id], -1, 'data-scale-key', function (){
                       Controller.preview ();
                       ServiceBus.OnPageResize();
                  }, "data");
                 //  Thumbpane.create (this, this.id, $(this).html(), -1, true);
              });
 


              //   $(".article-scale").each (function () {     
              //         return Thumbpane.create (this, id, "", -1, true);
                       // TPane.create (this);
              //    }); 
        },

        multipass : function (keys) {


                    var params = {  keys : keys };
                     var worker = new Worker('/scripts/async.js?' + new Date().getTime());
                     worker.onmessage = function(e) {
                          var msg = e.data.content; 
                          alert(msg);
                       }
                       worker.onerror = function (e) { confirm("Err:" + typeof(e.message)); }
 
                     worker.postMessage (params);

        },

        preview : function () { 

              // Sweatshop.clear(); Icetag.clear(); Snapshot.clear(); 

            $("#canvas-teeny").each (function(){ 
                var context = this.getContext('2d');    
              // context.clearRect(0,0,this.width,this.height);
            })

             $id = []; 

             var batchKeys = []; 

 
             $(".article-tiny").each (function () {  
                  this.style.display = DIALOG_VISIBLE ? "inline" : "none";
                  if (!DIALOG_VISIBLE) return;
                  var that = this, n = this.id; 
                  $(this).empty();
                  $(this).css ("border", "none");
 

                  if (DIALOG_HILO) 
                  {
                      $("#article-select").each (function () {  
                           var drp=this,s = Rangefrom(drp.options, drp.selectedIndex), i = n - (-3); 
                           if (i < 0 || i >= s.length || s.length < 1) return;
                           var id =  s[i].article, text = s[i].text, index = s[i].index; 
                           $(that).click (function () { drp.selectedIndex = index; Controller.view (id) });

 

                           batchKeys.push (id); 
                           $(that).attr("data-small-key", id);
                           $(that).css ("border", id == drp.value ? "solid 1px red" : ""); 
                      }); 
                      return;
                  }

                  $("#article-select").each (function () {  
                       var drp=this, o=drp.selectedIndex, i = o - (-n);
                       if (i < 0 || i >= drp.options.length || drp.options.length < 1) return;
                       var id =  drp.options[i].value, text = drp.options[i].text; 
                       $(that).click (function () { drp.selectedIndex = i; Controller.view (id) });
                       $id.push (id);

                           batchKeys.push (id); 
                           $(that).attr("data-small-key", id); 
                          $(that).css ("border", id == drp.value ? "solid 1px red" : "");
                    //   return Thumbpane.create (that, id, i, TINY_SIZE, false, n == 0 ? "solid 1px red" : "none");
                  }); 
              });
 
             Batchpane.Create (batchKeys, TINY_SIZE, 'data-small-key');
          //    Controller.multipass ($id);

              if (localStorage ["playing"] && localStorage ["playing"]  == "on")
                  setTimeout (Controller.next, 10000); 
        },
        next : function (i) {
                 var index = i == undefined ? 1 : i; 
            $("#article-select").each (function () {
                  if (this.selectedIndex == (this.options.length - 1)) this.selectedIndex = 0;
                  else this.selectedIndex -=- index;
                  var id = $(this).val()
                  Controller.view (id);
             });

         }, 

        orient : function () {  
            return;
            var degree = Math.abs (window.orientation), big = Math.max (screen.width,screen.height), sm = Math.min (screen.width,screen.height); 
            var screen_x = degree == 90 ?  big : sm; //Math.max (screen.width,screen.height);
            var screen_y = degree != 90 ?  big : sm; //Math.min (screen.width,screen.height);

            if (screen_x < DEFAULT_SIZE) {
                $('#meta-v').each (function (){

                     this.setAttribute('content','user-scalable=no, minimal-ui, initial-scale=1.0, width=' + screen_x);
                     THUMB_SIZE = (screen_x - 52) / 4;
                     $('.arrow').css ('width', THUMB_SIZE + 'px');
                     $('.arrow').css ('height', THUMB_SIZE + 'px');
                     $('.scroll').css ('width', ( screen_x - 16 ) + 'px');
                     $('.scroll').css ('height', ( screen_y - 172 ) + 'px');

                });
            } 
         },

         getUsername : function (){
              var rex = /user\/(\w+)\//, test = rex.exec (location.href);
              if (test) return test[1];
         },

        start : function () {  
	          var value = localStorage ["dialog"], on = value && value == "on",  hilo = localStorage ["hilo"] && localStorage ["hilo"] == "on";
                DIALOG_VISIBLE = on;
                DIALOG_HILO    = hilo;

             $.browser = {
                   android : navigator.userAgent.indexOf ("Android") > 0
              };

             this.orient();

              if (screen.width < 400) {
                      var w = screen.width - 28, h = (w / (16/9)), sm = Math.floor((w - 16)/5);
                  $(".arrow").each (function(){
                      this.style.width = w + "px"
                      this.style.height = h + "px"
                      this.style.background = "#ffa"
                  });
                  $(".article-hilo").each (function(){
                     $(this).css ("margin", "2px");
                      this.style.width = sm + "px"
                      this.style.height = sm + "px" 
                      this.style.border = "none";
                      this.style.overflow = "hidden";
                  });
                  THUMB_SIZE = w;
                  TINY_SIZE = sm;
                  $(".column1").css ("display", "none");
                  $(".column2").css ("display", "none");
              }

             $(".a-hi").attr ("href", "javascript:void(0)");
             $(".a-hi").click (function (){
                 DIALOG_HILO = !DIALOG_HILO;
                 $(this).html (DIALOG_HILO ? "Hilo" : "Sort");
	         localStorage ["hilo"] = DIALOG_HILO ? "on" : "off";
                 Controller.preview();
             });

             $(".link").attr ("href", "javascript:void(0)");
             $(".link").click (function (){
                 location.href = this.id;
             });


             $(".dyn-caption").each (function (){
                 this.invoke = function (sender, e) {
                     $(this).html (e);
                 }
                 ServiceBus.Subscribe ("OnDyntext", this);
             });

            $(".my-menu").mouseleave (function(){
                $(".my-menu").hide(); 
            });

             $(".settings-button").click (function(){
 
                  
			$( ".my-menu" ).css ("width", "450px");
			$( ".my-menu" ).css ("display", "block");
			$( ".my-menu" ).position({
			  my: "left top",
			  at: "right bottom",
			  of: ".settings-button"
			});
	             $(".my-menu").menu();
              });


             $(".controller").each (function (){
                  this.invoke = function (sender, e) {
                       $(this).css ("height", DIALOG_VISIBLE ? "96px" : "24px"); 
                       var W = $(window).width() - this.offsetWidth - 8 , H = $(window).height() - this.offsetHeight - 8;
                       this.style.left = W + "px";
                       this.style.top  = H + "px";
                  }
                  this.style.height = "120px";
                  ServiceBus.Subscribe ("OnPageResize", this);
              });
             window.onresize = function ()  { ServiceBus.OnPageResize(); }

             $("#progressbar").each (function (){
                  this.invoke = function (sender, e) {
                      $(this).progressbar({
                              value: e 
                       });
                  }
                  ServiceBus.Subscribe ("Progress", this);
              });

              $(".article-menu").each (function (){ 
                   // $(this).html (DIALOG_VISIBLE?"&#171;" : "&#187;");
                   $(this).click (function (){
                       DIALOG_VISIBLE = !DIALOG_VISIBLE;
	               localStorage ["dialog"] = DIALOG_VISIBLE ? "on" : "off";
                         //  $(this).html (DIALOG_VISIBLE?"&#171;" : "&#187;");
                           ServiceBus.OnPageResize();
                           Controller.preview(); 
                   }); 
              });

             $(".span-of").each (function () {
                  var t=this.id.split('x'),lo=t[0],hi=t[1],mn=t[2],mx=t[3], key = "I" + Math.floor( Math.random() * 1000000 ), width = 500, w2 = width + 50; ;
                  var img  = "<canvas width='" + w2 + "' height='20' id='"+key+"'></canvas>";   
                  $(this).html (img);
                  $("#"+key).each (function (){
                      var api = CanvasAPI, that=this, context = that.getContext('2d'), dm = mx-mn, dl=hi-lo, sx=lo-mn,
                             px = width * (dl/dm), x = width * (sx/dm);
                      context.fillStyle = '#ffc';
                      context.fillRect(0,0, width + 50,30);

                      context.fillStyle = '#ccf';
                      context.fillRect(25,5,width,10);

                      context.fillStyle = '#009'; 
                      context.fillRect(25 + x,5,px,10);

                      var mw = context.measureText(mx).width, ml = context.measureText(lo).width,
                             max_x = (width + 25) - (mw / 2), lo_x = 25 + x - (ml / 2), max_y = 9, lo_y = 19;

                      while ((lo_x + ml) >= (max_x - 10)) lo_x -= 10;

                      api.imagestring  (context, '300 8pt Lato', 1,9, mn, '#333');
                      api.imagestring  (context, '300 8pt Lato', max_x, max_y, mx, '#333'); 
                      api.imagestring  (context, '300 8pt Lato', lo_x, lo_y, lo, '#333');
                      api.imagestring  (context, '300 8pt Lato', max_x, lo_y, hi, '#333');
                  });
              });
  
             $(".a-next").each (function () {
                  $(this).attr ("href", "javascript:void(0)");
                  $(this).click (function () { 
                      var tmp = this.className.split(" "), i = tmp[1]
                      Controller.next(i); 
                   }); 
             });

                   $(".a-swipe").on ("swipeleft", function () {
                         Controller.next(1); 
                    });
                   $(".a-swipe").on ("swiperight", function () {
                         Controller.next(-1); 
                    });


             $(".a-ps").each (function () {
	          var value = localStorage ["playing"], on = value && value == "on";
                  $(this).attr ("href", "javascript:void(0)");
                  $(this).html (on?"Stop":"Play");
                  $(this).click (function () {
		       localStorage ["playing"] = on ? "off" : "on"; 

                       $("#article-select").each (function (){ 
                           var on = $("#text-page").val(); 
                           location.href = on + $(this).val();
                       });

                      // location.reload();
                  });
             });  

             $(".a-count").click (function (){
                  var old = location.href;
                  old = old.replace (/\/most\/\d+/, "") + "/most/" + this.id;
                  old = old.replace (/\/page\/\d+/, "") + "/page/1";
                  location.href = old;
             });

             $(".leftButton").click (function (){
                location.href = this.id;
             });

             $(".rightButton").click (function (){
                 DIALOG_VISIBLE = true;
                 Controller.preview();
                 $( "#dialog" ).dialog({
                      autoOpen : true,
                      width    : 600,
                      buttons  : [{
                              text  : "Okay",
                              class  : "roundButton",
                              click : function () {
                                          DIALOG_VISIBLE = false;
                                          $(this).dialog("close");
                                      }
                             }]

                     }); 
             });

             $("#text-suffix").each(function (){
                 THUMB_SUFFIX = "";// $(this).val();
                 Thumbpane.suffix = THUMB_SUFFIX;
             });

             $(".paginator").click (function (){
                  var href=this.id, tmp=href.split("/"), page = tmp.pop(), group = this.title, command = "/rpc/get-articles/page/"+page+"/group/"+group;
                     $.get( command, function( uuid ) {  
                            TPane.batch (document.getElementById("div-stat"), uuid.split (","), THUMB_SUFFIX, 
                                     function (){
                                          location.href = href;
                                       });
                     });  
             });

             $("#article-select").change (function (){ 
                       var on = $("#text-page").val(); 
                       location.href = on + $(this).val();
              });
             $(".bookmark").click (function () {  
                     $.get( this.id, function( data ) { 
                          location.reload();
                     });  
             }); 
             $(".group-join").click (function () {
                 var name=$("#text-user").val(), tmp=this.className.split(" "), href = "/group/join/user/" + name + "/name/" + this.id + "/start/" + tmp[1] + "/amount/" + tmp[2]; 
              //   return window.open (href);
                 location.href = href;
             });
             $(".group-renew").click (function () {
                 var name=$("#text-user").val(), href = "/group/join/user/" + name + "/name/" + this.id + "/renew/renew"; 
               //  return window.open (href);
                 location.href = href;
             });
             $(".group-name").click (function () {
                  var t = Controller.getUsername (); 
                 var name=t||$("#text-user").val(), href = "/group/join/user/" + name + "/name/" + this.id;
               //  return window.open (href);
                 location.href = href;
             });
             $(".a-group").click (function () {
                 var name=$("#text-user").val(), href = "/group/join/user/" + name + "/name/" + this.id; 
                 location.href = href;
             });
             $(".msmq-id").each (function () { 
                  var uuid = $(this).html(), url = this.id, 
                     ondone=function(){ location.href=url };
                  var q = QMessage.create ("/rpc/receive/id/" + uuid, ondone, this);
                  q.send();
             });
              var id = "", that = undefined, title = undefined,
                     ondone=function(){ alert ("Done") },
                  batch = [];


             $(".li-sortas").click (function () {   
                         var rex=/\/sort\/\d+/, old = location.href.replace (rex, ""), href = rex.exec(location.href) ? old : ( old + "/sort/1");
                         location.href = href;
              });


              var tmp_c = [];
              $(".carousel").each (function (){
                  tmp_c.push (this.id);
              })
              if (tmp_c.length) {  
                 Fancy.init (tmp_c);  
              }


             $(".article-unrar").each (function () {   
                       Thumbpane.create (this, this.id, $(this).html(), THUMB_SIZE, false, false, true);  
                       $(this).click (function (){
                           var on = location.href.replace ('/unrar/', '/onrar/') + "/of/" + this.id; 
                           location.href = on;
                       });
              });


             $(".article-all").each (function () {   
                       $(this).click (function (){
                           var on = location.href + "/all/1/get/" + this.id; 
                           location.href = on;
                       });
              });


             $(".article-rar").each (function () {   
                   var israrpage = location.href.indexOf ("/rar/") > 0;

                   if (this.className.indexOf ("cache") > 0) 
                   {
                       Thumbpane.create (this, this.id, $(this).html(), THUMB_SIZE);  
                       if (israrpage) {
                           $(this).click (function (){
                               var on = location.href.replace ('/rar/', '/unrar/');
                               location.href = on + "/r/" + this.id;
                           });  
                           return;
                       }
                   }


                   if (israrpage) {
                       $(this).click (function (){
                           var on = location.href;
                           location.href = on + "/get/" + this.id;
                       });
                       return;  
                   }

                   $(this).click (function (){
                       var on = $("#text-page").val().replace ('/index/', '/rar/');
                       location.href = on + this.id;
                   });  
              });

             var batchKeys = [];
             $("*[data-article-key]").each (function (){
                 batchKeys.push ($(this).data("articleKey"));
                   $(this).click (function (){
                       var on = $("#text-page").val();
                       location.href = on + this.id;
                   });  
                // $(this).html ("Connecting...");
             });
             Batchpane.Create (batchKeys, THUMB_SIZE, 'data-article-key', function () {
                 var smallKeys = [];
                 $("*[data-small-key]").each (function () {   
                     $(this).click (function (){
                         var old = location.href.replace (/\/page\/\d+/, "") + "/page/" + this.id;
                         location.href = this.id;//old;
                      });   
                      smallKeys.push ($(this).data("smallKey"));
                 });
                  Batchpane.Create (smallKeys, TINY_SIZE, 'data-small-key');
             });

             
             $(".article-scale").each (function () {   
                   $(this).attr ("data-scale-key", this.id);
                  Batchpane.Create ([this.id], -1, 'data-scale-key', function (){
                       Controller.preview ();
                       ServiceBus.OnPageResize();
                  }, "data");
                 //  Thumbpane.create (this, this.id, $(this).html(), -1, true);
              });
 



/*THUMB_SIZE = 244,
    TINY_SIZE 
             $(".article-picture").each (function () {   
                   $(this).click (function (){
                       var on = $("#text-page").val();
                       location.href = on + this.id;
                   });  
                   return Thumbpane.create (this, this.id, $(this).html(), THUMB_SIZE); 
              });
*/

             var delay = function () {
                 Thumbpane.oncomplete = null; 
                 $(".article-hilo").each (function () {   
                     $(this).click (function (){
                         var old = location.href.replace (/\/page\/\d+/, "") + "/page/" + this.id;
                         location.href = this.id;//old;
                      });  
                      return Thumbpane.create (this, this.title, $(this).html(), TINY_SIZE); 
                 });
             };
             Thumbpane.oncomplete = delay;
           //  setTimeout (delay, 10000);

             var mediaClick = function (){ 
                   var src = "/rpc/picture/id/" + this.id, existing = $(this).html(); 
                   if (this.className.indexOf ('cache') > 0) { 
                      $(this).click (function (){
                           window.open (src);
                       });
                       return TPane.bycache(this);  
                   }  
                   else $(this).click(function (){ 
                     return TPane.create (this);
                  });  
             };

             $(".article-wmv").each (mediaClick);
             $(".article-m4v").each (mediaClick);

             Attachprog();

             $(".article-photo").each (function () {  
                   $(this).click (function (){
                       var on = $("#text-page").val();
                       location.href = on + this.id;
                   });
                   if (this.className.indexOf ('cache') > 0) { 
                       return TPane.bycache(this);
                   }
                   batch.push (this.id);
              });

              if (batch.length > 0) { 
                   TPane.batch (document.getElementById("div-stat"), batch, THUMB_SUFFIX)
              }
         }
    },
 

    TPane = {
         msg : { },
         done : { },

        bycache : function (tag) { 
                var tmp = tag.className.split (" "), count = isNaN(tmp[0]) ? -1 : tmp[0]; 
		var src = "/rpc/small/id/" + tag.id, existing = $(tag).html(); 
		TPane.draw(tag, src, "pre-thumb", existing, tag.id, count) ; 
         },

         draw : function (target, src, sizer, text, key, amount) { 
              var video = "", sizeof = target.className == "article-preview" ? "pre-view" : sizer;
 
              text = text.replace ('&lt;', '<').replace ('&gt;', '>');
              TPane.msg[key] = text;
              if (target.className.indexOf("article-wmv") > 0)
              {
                  $(target).click (function () {
                      var src = "/rpc/picture/id/" + this.id;
                      window.open (src);
                   });
                  video = "wmv";
              }

              var img = "<canvas class='"+amount+" "+sizeof+" "+key+" " + video + "' title='"+key+"' id='"+src+"'></canvas>";
              $(target).html (img);


              $(".pre-xy").each (function (){  
                   var api = CanvasAPI, that=this, context = this.getContext('2d'), pic = new Image();
                   pic.onload = function () {
                       var w = this.width, h = this.height, r = w/h, w1 = $(window).width() - 40, h1 = w1 / r;
                       if (w > h) { // long 
                           x = 0;
                           y = 0;

                       } else {  
                           h1 = $(window).height() - 100;
                           w1 = h1 * r;
                           y = 0;
                           x = 0;  
                       } 
                       that.style.width = w1 + "px"; 
                       that.style.height = h1 + "px";
                       that.width = w1; 
                       that.height = h1;   
                       api.imagecopyresized (context, this, 0, 0, this.width, this.height, x, y, w1, h1);
                       api.imagestring (context, "9pt Lato", 9, h1 - 39, TPane.msg[that.title], "#fff", null,
                              w1 - 10, 14, 4);
                       api.imagestring (context, "9pt Lato", 8, h1 - 40, TPane.msg[that.title], "#000", null,
                              w1 - 10, 14, 4);
                       TPane.done [that.title] = this;
                          if (localStorage ["playing"] && localStorage ["playing"]  == "on")
                             setTimeout (Controller.next, 6000); 
                          Controller.preview();
                   }
                   if (TPane.done [that.title]) return;
 
                   pic.src = this.id;  
              }); 
              $("." + key).each (function (){ 
                   var thumb_size = THUMB_SIZE;
                   if (this.className.indexOf ("pre-xy") > 0) return;
                   if (this.className.indexOf ("pre-view") > 0) thumb_size = 40;
                   this.width = this.height = thumb_size; 
                   var tmp = this.className.split (" "), prefix = isNaN(tmp[0]) ? "" : (tmp[0] + " items: "); 
                   var api = CanvasAPI, that=this, context = this.getContext('2d'), pic = new Image(); 
                   pic.onload = function () {
                       var w = this.width, h = this.height, r = w/h, w1 = thumb_size, h1 = w1 / r;
                       if (w > h) { // long 
                           h1 = thumb_size;
                           w1 = h1 * r;
                           x = 0;
                           y = 0;
                           if (w1 > thumb_size) 
                           {
                               x = (thumb_size - w1) / 2;
                           }
                       } else { 
                           y = 0;
                           x = 0;  
                       }   

                       api.imagecopyresized (context, this, 0, 0, this.width, this.height, x, y, w1, h1);
                       api.imagestring (context, "9pt Lato", 9, thumb_size - 49, prefix + TPane.msg[that.title], "#fff", null,
                              200, 14, 5);
                       api.imagestring (context, "9pt Lato", 8, thumb_size - 50, prefix + TPane.msg[that.title], "#000", null,
                              200, 14, 5);

                       if (that.className.indexOf("wmv") > 0)
                       { 
                           api.imagestring (context, "700 9pt Lato", 9, thumb_size - 64, "> Download video", "#333");
                           api.imagestring (context, "700 9pt Lato", 9, thumb_size - 65, "> Download video", "#ff0");
                       }


                       TPane.done [that.title] = this;
                   } 
                   pic.onerror = function () {
                       api.imagestring (context, "9pt Lato", 8, thumb_size - 50, TPane.msg[that.title] + " did not load!", "#900", null,
                              200, 14, 5);
                   }
                   pic.src = this.id;  
              }); 

          },

         batch : function (element, list, title, ondone) {
             var object = {
                 list : list.join (","),
                 element : element,
                 title : title,
                 ondone : ondone,
                 load : function () { 
                     var that=this.element, key=this.list, command = "/rpc/thumb/article/" + key + "/" + this.title,  
                           ondone=function() {  
                                   for (var f,sb=key.split(","),i=0;f=sb[i];i++) {
                                       $("#" + f).each (function (){
                                             var existing = $(this).html(), src = "/rpc/picture/id/" + this.id;
                                              TPane.draw(this, src, "pre-thumb", existing, this.id) 
                                        });
                                    } 
                                };  
                     if (this.ondone) ondone = this.ondone;
                     $.get( command, function( uuid ) { 
                          var q = QMessage.create ("/rpc/receive/id/" + uuid, ondone, that);
                          q.send(); 
                     });  
                 }
             }
             object.load ();
             return object;
          },

         create : function (element, ondone, id) {
             var tmp = element.className.split (" "), count = isNaN(tmp[0]) ? -1 : tmp[0];
             var object = {
                 element : element,
                 id : id,
                 count : count,
                 ondone : ondone,
                 load : function () { 
                     var that=this.element, key=this.id||that.id, command = "/rpc/thumb/article/" + key + "/" + that.title,
                             sizer = this.element.tagName == 'LI' ? "pre-thumb" : "pre-xy",
                                 usize = this.element.tagName == 'LI' ? "small" : "picture",
                          existing = $(that).html(), src = "/rpc/" + usize + "/id/" + key,  amt = this.count,
                           ondone=function(){ TPane.draw(that, src, sizer, existing, key, amt) };  
 
                     if (this.ondone) ondone = this.ondone;
                     $.get( command, function( uuid ) { 
                          var q = QMessage.create ("/rpc/receive/id/" + uuid, ondone, that);
                          q.send(); 
                     });  
                 }
             }
             object.load ();
             return object;
         }
    },
 

    QMessage = {
        queue : [],
        create : function (command, ondone, element) {
            
            var key = QMessage.queue.length, object = {

		text : $(element).html(),
		element : element,
		command : command,
		ondone : ondone,
		key : key,

                response : { 
		    state : 'PENDING',
		    caption : 'Waiting...',
		    value : '',
		    max : ''
                } ,
 
		send : function () {
                   var that = QMessage.queue[key], span = (key - (-1)) * 2000;   
		    $.ajax({
			    type: "GET",
			    url: that.command,
			    cache: false,
			    dataType: "xml",
			    success: function(xml) {  
                                var tmp = { state : "PENDING" };

		                $(xml).find ('Request').each (function (){ 
		                   $(this).children().each(function() {   
		                       tmp[this.tagName]=$(this).text();
		                    })
		                }); 
 
                                if (! (that.response.state != "PENDING"  && tmp.state == "PENDING") ) {

                                    that.response = tmp;

				    if (that.response.state == "COMPLETE") {
			                return that.ondone(); 
			            } 

			            if (that.response.state=="PENDING") $(that.element).html(that.text + " -- Pending...");
		                    else {
                                       var percent = 100 * (that.response.value / that.response.max);
                                       if (percent == 100) percent = false;
                                       var i=that.response.id, msg = that.response.caption + " - " + that.response.value + " of " + that.response.max;
                                       msg = "<div class='prog-in'>" + msg + "</div><div class='prog-out "+i+"'></div>";
                                       $(that.element).html(msg);  
                                       ServiceBus.Progress (that.response, percent);
                                    }
                                }
                                return window.requestNextAnimationFrame (that.send);
			        setTimeout (that.send, 500);
			    }
			});

		}
            }
            QMessage.queue[key] = object;
            return object;
        }
    }

$(document).ready (function () {
    Controller.start ();
});

function Attachprog()
{
    var object = {
        invoke : function (sender, e) {
            var id = sender.id, percent = e;
            $(".prog-out").each (function () {
                if (this.className.indexOf (id) < 0) return;
                $(this).progressbar({
                   value: percent
                }); 
            });
        }
    }
    ServiceBus.Subscribe ("Progress", object);
}

function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  }
  else {
    cancelFullScreen.call(doc);
  }
}


$( window ).on( "orientationchange", function( event ) {
    Fancy.setSizes();
});
  
function getPosition(e){
    var left = 0, top = 0;
    while (e.offsetParent){
        left += e.offsetLeft;
        top  += e.offsetTop;
        e     = e.offsetParent;
    }
    left += e.offsetLeft;
    top  += e.offsetTop;
    return {x : left, y : top};
}
String.prototype.truncate=function(y) { try { return this.length>y?(this.substr(0,y/2)+'...'+this.substr(this.length-(y/2))):this } catch (ex) { return ''} }; 
String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); }; 
String.prototype.format = function ()
{
    var o=this, r={x:0,r:/\{/g,s:'|+{+|',e:/\|\+\{\+\|/g,t:'{'};
    for (var i=0;i<arguments.length;i++) 
        while (o.indexOf ('{'+i+'}')>=0 && r.x++ < 32)
            try { o=o.replace ('{'+i+'}', arguments[i].toString().replace (r.r,r.s)); }
            catch (ex) { }
    return o.replace (r.e,r.t);
}
