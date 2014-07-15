/*
* element
* article
* caption 
* size
*/


var 
    Pane = {
        items   : [],  
        create : function (id, canvas, text) {
            var object = {
                id     : id,
                pics   : { stale : undefined, fresh : undefined },  
                canvas : canvas,
                text   : text,
                x      : -canvas.width,
                width  : canvas.width,
                height : canvas.height,

                runit  : function () {
                    var next = function () { Pane.items[id].runit() }
                   
                      var picture = this.pics.fresh , api = CanvasAPI , context = this.canvas.getContext('2d');
                        this.x -= -42; 
                       if (this.x > 0) this.x = 0;

                        var s = Sizer.fit (picture, this.width, this.height), x = s.x + this.x ;   

                        if (this.e&&this.e.batch&&this.e.batch.length==3) {
                              api.imagecopyresized (context, picture, 0, 0, picture.width, picture.height, this.x, 0, picture.width, picture.height); 
                        }
                        else {
                           api.imagecopyresized (context, picture, 0, 0, picture.width, picture.height, x, s.y, s.w, s.h); 
                        }

                        api.imagestring (context, "700 9pt Lato", 10, 16, this.text, "#fff", null,
                                      this.width - 20, 16, 5);
                        api.imagestring (context, "700 9pt Lato", 9, 15, this.text, "#222", null,
                                      this.width - 20, 16, 5);
                       // api.imagestring (context, "700 9pt Lato", 8, 14, this.text, "#922", null,
                        //              this.width - 20, 16, 5); 

                    if (this.x >= 0) return;
                    window.requestNextAnimationFrame (next);

                },

                invoke : function (sender, e) {
                    if (e.id != this.id) return;
 

                          this.x = -this.width;
                         this.pics.stale = this.pics.fresh;
                         this.pics.fresh = sender;
                         this.e = e;

 

                         this.text = e.text;
                                    var on = e.href + e.uuid; 

                               $(this.canvas).off ('click');
                               $(this.canvas).on ('click', function() {
                                    window.open( on );
                                });



                      this.runit ();

                }
            }
            Pane.items[id] = object;
            ServiceBus.Subscribe ("Fancy", object);
            return object;
        }
    },

     PANE_SIZE = 752,

     shuffle= function (o) { //v1.0
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    },
    Fancy = {

        loading : [],
        x       : -PANE_SIZE,  
        index   : -1,  
        limit   : -1,  
        span    : PANE_SIZE / 4,  
        items   : [],  
        pics    : { stale : undefined, fresh : undefined },  
        peek    : function () { 
            this.index++;
            if (this.index>=this.limit) this.index = 0;
            return this.items[this.index];
        },  

        init : function (arr) {
            Fancy.loading = arr;
            Fancy.limit = arr.length; 
            Fancy.go ();
        },  

        init_ : function () {
 
            
            var groupname = Fancy.loading.pop (), url = "/rpc/picsof/user/milton/name/" + groupname;
 document.title = Fancy.limit + ". "+groupname+"...";
            $.get(url, function (data) {
                  
                   try {

                        var xmlDoc = $.parseXML( data ),
                             xml = $( xmlDoc ), list = [];


                        $(xml).find('item').each(function(){ 
				var uuid = $(this).find('uuid').text();
				var subject = $(this).find('subject').text();
				var groupname = $(this).find('groupname').text();
				var count = $(this).find('count').text();
				var username = $(this).find('username').text();
				var ref = $(this).find('ref').text();
			list.push  ( {
                                  uuid : uuid,
                                  subject : subject,
                                  ref : ref,
                                  username : username,
                                  count : count,
                                  groupname : groupname 
                               } )
	 
			});
 
 
                        Fancy.add (groupname, list);
                        Fancy.proceed_ ();

                   } catch (ex) 
                   { 
                        Fancy.limit --;
                        Fancy.proceed ();
                   }

		});

        },

        add : function (name, list) {
            if (list.length < 5) return alert (name + " list only has " + list.length + " items"); 
            var id=this.items.length, object = {
                i    : 0
              , id   : id
              , name : name
              , list : list
              , list : shuffle(list)
              , peek : function () { 
                    this.i++;
                    if (this.i>=this.list.length) this.i = 0; 
                    return this.list[this.i];
                }
            }
            this.items.push (object);   
            return object;
        },


        sidebar   : function () {

            var group=Fancy.pics.fresh.group, articles = group.list, num = function (i) { return Math.floor (Math.random() * i);},  
                    sb=[], f=Fancy.pics.fresh.article, othergroups=[], ref=f.ref.split('|'), rnd2 = num(articles.length);
 
            while (group.i==rnd2) rnd2 = num(articles.length);

            var othergroup = articles[rnd2] ;
 
            for (var r = num(articles.length), subitem = [], e=0;e<3;e++)
            {  

                while (subitem.join (',').indexOf (articles[r].uuid) > -1)  
                    r = num(articles.length);

                subitem.push (articles[r].uuid);
            }
  
            for (var e,i=1;e=ref[i];i++) if (e!=f.groupname) othergroups.push (e );
            var also = othergroups.length > 0 ? ("Also in: "+othergroups.join(' ')) : "No other groups",
                  href = $("#text-page").val() + "/name/" + f.groupname + "/id/";                           

            sb[0] = { href:"/group/join/name/" + f.groupname + "/user/" + f.username + "/id/", id : 0, uuid : f.uuid, text:f.groupname, batch : subitem };  
            sb[1] = { href:href, id : 1, text:f.count + ": " + f.subject, uuid : f.uuid, batch : Fancy.pics.fresh.kids };   
            sb[2] = { href:href, id : 2, text:also, uuid : othergroup.uuid };    
 

            $(".info").each (function (){
                var tmp = this.className.split (" "), i=tmp[0], o=sb[i]
                if (o.batch && o.batch.length == 3) {                                    
                    Photobatch.create (o, 250, 140, 
                        function () { ServiceBus.Fancy (this.picture,  this.source) }, 
                        function () { alert ("An error occured!"); });
                    return; 
                }

                var src = '/rpc/small/id/' + o.uuid, pc = new Image(); 
                pc.onload = function () { ServiceBus.Fancy (this,  o); } 
                pc.src = src;   

             });
 
             setTimeout (Fancy.proceed, Fancy.loading.length > 0 ? 500 : 5000);

        },


        play   : function () {

                $("#i-can").each (function () { 

                    var that=this, z = PANE_SIZE;
                    
                    for (var p in Fancy.pics )
                    {
                        if (!Fancy.pics[p]) { z = 0 ; continue; }
                        var fresh = Fancy.pics[p], article = fresh.article, name = fresh.group.name,
                            picture = fresh.picture, api = CanvasAPI , context = this.getContext('2d');

                        Fancy.x += Fancy.span;


                        var s = Sizer.fit (picture, PANE_SIZE), x = s.x + Fancy.x + z ;  
                        if (x > z) x = z;


                        api.imagecopyresized (context, picture, 0, 0, picture.width, picture.height, x, s.y, s.w, s.h);

                        api.imagestring (context, "400 22pt Lato", 15, 40, name, "#fff", null,
                                      600, 18, 5);
                        api.imagestring (context, "400 22pt Lato", 14, 39, name, "#228", null,
                                      600, 18, 5);

                        //api.imagestring (context, "400 10pt Lato", 15, 61, article.subject, "#fff", null,
                        //              600, 18, 5);
                        //api.imagestring (context, "400 10pt Lato", 14, 60, article.subject, "#222", null,
                        //              600, 18, 5); 

                        z = 0;

                    }


                        if (Fancy.x >=0 )  return Fancy.sidebar();  

                       

                        window.setTimeout (Fancy.play, 150);
                 });




        },
        proceed : function () {

            if (Fancy.loading.length > 0) return Fancy.init_();
            Fancy.proceed_ ();
        },
        proceed_ : function () {
 
            var group=Fancy.peek(), article = group.peek(), 
                  command = "/rpc/randomof/id/" + article.uuid, 
               src = '/rpc/picture/id/' + article.uuid, tiny = '/rpc/small/id/' + article.uuid; 
 
            $.get( command, function( uuids ) { 
                var picture = new Image(), kids = uuids.split (",");  
                picture.onerror = Fancy.proceed;
                picture.onload = function () {  
                    if (this.width > 1999) return this.src = tiny;
                    Fancy.pics.stale = Fancy.pics.fresh;
                    Fancy.pics.fresh = { kids : kids, group : group, article : article, picture : this };
                    Fancy.x = -PANE_SIZE;
                    Fancy.play();
                }
                picture.src = src;  
            });  

        },
        go : function () { 
            $("header").each (function () {

            var w=PANE_SIZE,h=9*(PANE_SIZE/16) ;


                $(this).html ('<div class="splash main"><canvas id="i-can" width=' + w + ' height=' + h + '/></div>' + 
                              '<div class="0 splash info"><canvas width="250" height="140" class="i-canvas 0" /></div>' + 
                              '<div class="1 splash info"><canvas width="250" height="140" class="i-canvas 1" /></div>' + 
                              '<div class="2 splash info"><canvas width="250" height="140" class="i-canvas 2" /></div>');  

                 $(".i-canvas").each (function () {
                      var tmp=this.className.split (" "), id=tmp[1];
                      Pane.create (id, this);
                 })

  
                Fancy.items = shuffle (Fancy.items);

                Fancy.proceed();
            });
        }
    },

    Runit = {
        items   : [],  
        display : function (image, article, text) { 
            var canvas = document.createElement("canvas");
            canvas.style.width = image.width + "px"; 
            canvas.style.height = image.height + "px";
            canvas.width = image.width; 
            canvas.height = image.height;   

            var id=this.items.length, object = {
                id : id,
                picture  : image,
                w     : image.width,
                h     : image.height,
                s     : -image.width, 
                size  : THUMB_SIZE,
                text  : text,
                x  : 0,
                y  : 0,
                canvas  : canvas, 

                go : function () { 
                    var api = CanvasAPI, canvas = this.canvas, offset = 60,
                          context = canvas.getContext('2d'), next = function () { Runit.items[id].go() };  

                    this.s += 33;
                    if (this.s > 0) this.s = 0;

                    api.imagecopyresized (context, this.picture, 0, 0, this.w, this.h, 0, 0, this.w, this.h);
                    api.imagefilledrectangle (context, this.s, this.size - offset, this.w, offset, "rgba(255,255,255,0.5)");
                    api.imagestring (context, "9pt Lato", this.s + 9, this.size - 49, this.text, "#222", null,
                                      200, 14, 5);

                    this.picture.src = canvas.toDataURL();

                    if (this.s >= 0) return;
                    window.requestNextAnimationFrame (next);
                }
            }
 
                   $(image).off ("mousemove"); 

            this.items.push (object);  
            object.go();
            return object;
        },
        create : function (context, picture, caption, size, s, source) {

            

            var id=this.items.length, object = {
                context : context,
                picture : picture,
                caption : caption,
                source  : source,
                size : size,
                x  : s.x,
                y  : s.y,
                w  : s.w,
                h  : s.h,
                s  : s.x + s.w,
                z  : ( s.h / 3 ), 
                n  : 9 - s.w,
                renderText : function () {
                    var api = CanvasAPI, canvas = this.canvas, context = canvas.getContext('2d'), next = function () { Runit.items[id].renderText() },
                          Y = this.size - 50;
                    this.n += this.z; 
                    if (this.n > 9) this.n = 9;

                    api.imagecopyresized (context, this.picture, 0, 0, this.picture.width, this.picture.height, this.x, this.s, this.w, this.h);

                    api.imagestring (context, "9pt Lato", this.n, Y + 1, this.caption, "#fff", null,
                                      200, 14, 5);
                    api.imagestring (context, "9pt Lato", this.n - 1, Y, this.caption, "#000", null,
                                      200, 14, 5); 

                    this.image.src = canvas.toDataURL();

                    if (this.n >= 9) return;
                    window.requestNextAnimationFrame (next);

                },
              
                attach : function () {
                    var palette = document.createElement("canvas"), canvas = this.context.canvas, image = document.createElement("IMG"),
                         article = this.source.article, text = this.caption, picture = this.picture, size = this.source.size; 

                       palette.style.width  = this.w + "px"; 
                       palette.style.height = this.h + "px";
                       palette.width  = this.w; 
                       palette.height = this.h;    

                    image.width  = this.w;
                    image.height = this.h;
                    image.id = "T" + Math.floor (Math.random() * 10000);
                    this.image   = image; 
                    this.canvas  = palette; 

                   if (size < 0)
                   { 
                       image.invoke = function (sender, e) { 
                           var s = Sizer.fit (picture, size) 
                           this.width = s.w; 
                           this.height = s.h;    
                       }

                       ServiceBus.Subscribe ("OnPageResize", image);
                   }

                    canvas.parentNode.replaceChild(image, canvas);
                     
                   $(image).click (function() {
                       // alert (article);
                   })
                   $(image).on ("mousemove", function() {
                      //  Runit.display (this, article, text);
                   })
                   $(image).on ("mouseout", function() {
                      //  ServiceBus.Mouser (this, "");
                   })
                },


                renderFrame : function () {  
                    if (this.source.size < 1) return this.image.src = this.picture.src;
                    this.animFrame(); 
                },

                animFrame : function () { 

                    var api = CanvasAPI, canvas = this.canvas, context = canvas.getContext('2d'), next = function () { Runit.items[id].animFrame() };
                    this.s -= this.z; 
                    if (this.s < this.y) this.s = this.y;

                    api.imagecopyresized (context, this.picture, 0, 0, this.picture.width, this.picture.height, this.s, this.y, this.w, this.h);
                    this.image.src = canvas.toDataURL();
  
                    if (this.s <= this.y) return this.renderText();
                    
                    window.requestNextAnimationFrame (next);
                },

                staticFrame : function () {
                    var api = CanvasAPI, canvas = this.canvas, context = canvas.getContext('2d'),  Y = this.size - 50;
                                              canvas.style.width = this.w + "px"; 
                                              canvas.style.height = this.h + "px";
                                              canvas.width = this.w; 
                                              canvas.height = this.h;     

                    if (this.source.element.className.indexOf ("preview") > -1)
                    {
                        Y = 24; 
                    }

                    api.imagecopyresized (context, this.picture, 0, 0, this.picture.width, this.picture.height, this.x, this.y, this.w, this.h);

                    api.imagestring (context, "9pt Lato", 9, Y + 1, this.caption, "#fff", null,
                                      200, 14, 5);
                    api.imagestring (context, "9pt Lato", 8, Y, this.caption, "#00f", null,
                                      200, 14, 5); 

                    return canvas.toDataURL();
                },

                writeFrame : function () {
                    this.image.src = this.source.size < 1 ? this.picture.src : this.staticFrame(); 
                     ServiceBus.FrameLoaded (this, this.source)
                } 
            }

            object.attach (); 
            this.items.push (object);
            object.writeFrame ();
            //if ($.browser.android) object.writeFrame ();
            //else object.renderFrame ();

            return object;
        }
    },
   
    Thumbpane = {
        suffix : undefined , 
        table  : "" , 
        cache  : { },
        items  : [], 
        oncomplete : undefined,
        check  : function () { 
            if (!this.oncomplete) return;
            this.items.pop(); 
            if (this.items.length == 0) this.oncomplete(); 
        },
        create : function (element, article, caption, size, preview, css, rar) {
              

            var object = {
                element : element,
                article : article,
                caption : caption,
                preview : preview,
                count   : -1,
                css     : css,
                size    : size,
                rar     : rar,
                type    : size > 0 ? "small" : "picture",
                load : function () { 
                      if (this.element.className.indexOf ("unrar") > 0) this.rar = true;

                    var my=this, target = my.element, key = my.article, suffix = Thumbpane.suffix, 
                                 after = !my.rar?"":"/type/rar",
                               resize  = my.size, caption = my.caption, preview = my.preview,
                               command = "/rpc/thumb/article/" + key + "/" + suffix + after + Thumbpane.table,
                               showpic = function (){  
                                          var api = CanvasAPI, that=this, context = that.getContext('2d'), pic = new Image();
                                          pic.onload = function () {
                                              var s = Sizer.fit (this, resize), size = resize < 0 ? s.h : resize, 
                                                       prefix = my.count < 1 ? "" : (my.count + " items: "); 
                                              that.style.width = s.w + "px"; 
                                              that.style.height = s.h + "px";
                                              that.width = s.w; 
                                              that.height = s.h;    

                                                   Runit.create (context, this, prefix + caption, size, s, my);

                                              if (preview) { Controller.preview (); }
                                              Thumbpane.check();

                                              if (my.css) $(target).css ("border", my.css);
                                          } 
                                          pic.onerror = function () { 

                                              api.imagestring (context, "9pt Lato", 9, 36, "Image did not load", "#900", null,
                                                     200, 14, 5); 
                                              if (preview) { Controller.preview (); }
                                              Thumbpane.check();
                                          } 
                                          api.imagestring (context, "9pt Lato", 8, 18, "Drawing...", "#090"); 
                                          pic.src = that.className; 
                                          Thumbpane.cache [key] = key;
                                          ServiceBus.OnPageResize();
                               }, 
                               ondone = function () {
                                     var src  = "/rpc/" + my.type + "/id/" + my.article + after + Thumbpane.table, key = "I" + Math.floor( Math.random() * 1000000 ); 
                                     var img  = "<canvas id='" + key + "' class='" + src + "'></canvas>";   
                                     $(target).html (img);
                                     $("#" + key).each (showpic);  
                               },
                               onrespond = function () {
                                   var text=this.response.caption, p = "#prog" + key, t = "#text" + key;
                                       var percent = 100 * (this.response.value / this.response.max);
                                       if (isNaN(percent) || percent == 100) percent = false;

                                   $(t).each (function (){
                                       $(this).html (text);   
                                    }) 
                                   $(p).each (function (){ 
                                       $(this).progressbar({
                                           value: percent
                                        }); 
                                    }) 
                                 //  $(target).html (this.response.caption);
                               }, cnt = target.className.split (" "), count = isNaN(cnt[0]) ? -1 : cnt[0]; 

  
                     if (this.rar)
                     { 
                         return ondone ();
                     }
                     this.count = count;
                     
                     if (Thumbpane.cache [key] || target.className.indexOf ('cache') > 0) { 
                         return ondone();
                     }

                     var bar = "<div id='text" + key + "'></div><div id='prog" + key + "'></div>";
                     $(target).html (bar);

                     $.get( command, function( uuid ) { 
                          if (uuid == "-1") return ondone() ;
                          var q = Q.Message.create ("/rpc/receive/id/" + uuid, onrespond, ondone);
                          q.send(); 
                     }); 
                }
            }
            Thumbpane.items.push(object);
            object.load ();
            return object;
        }
    },

    Sizer = {
        fit : function (picture, size, height) { 
             if (size < 0) return this.scale (picture);
             var w = picture.width, h = picture.height, r = w/h, w1 = size, h1 = w1 / r, x = 0, y = 0;
             if (w > h) { // long 
                 h1 = size;
                 w1 = h1 * r; 
                 if (w1 > size) 
                 {
                     x = (size - w1) / 2;
                 }
             } 


            if (height && height < h1 && w > h) {
                y = -((h1 - height) / 2);
            }

            var object = {
                w : w1,
                h : h1,
                x : x,
                y : y
            };
            return object;
        },
       stretch : function (picture, w1, h1) {

           var w = picture.width, h = picture.height, r = w/h, H = h1, W = H * r , x = 0, y = 0;

            if (!h1) 
            {
                w1 = $(window).width() - 16
                H = $(window).height() - 16
                W = H * r 
            }

            while (w1 > W) {
                W ++;
                H = W / r;
            }

            if (W > w1) {
                x = -((W - w1) / 2);
            }

            if (H > h1) {
                y = -((H - h1) / 2);
            }

            var object = {
                w : Math.floor(W),
                h : Math.floor(H),
                x : Math.floor(x),
                y : Math.floor(y)
            };
            return object;

        },
       scale : function (picture) {

                       var w = picture.width, h = picture.height, r = w/h, W = $(window).width() - 16, w1 = W, h1 = w1 / r, 
                                H = $(window).height() - 40, h2 = H, x = 0, y = 0;

                       if (w > h) { // long  
                       } else {  
                           h1 = h2;
                           w1 = h1 * r; 
                       }  

            while (h1 > H || w1 > W) {
                w1 --;
                h1 = w1 / r;
            }

 

            var object = {
                w : w1,
                h : h1,
                x : x,
                y : y
            };
            return object;
       }
    },
    Q = {
        queue : [],
        clear : function () { this.queue = []; },
        Message : {
            create : function (command, onprogress, oncomplete) { 
                var id = Q.queue.length, object = {
                    command    : command,
                    onprogress : onprogress,
                    oncomplete : oncomplete,
		    id         : id, 
		    response   : Q.Response.create(),

                    send       : function () {
                        var my = Q.queue[id]; 
                        $.ajax({
			    type: "GET",
			    url: my.command,
			    cache: false,
			    dataType: "xml",
			    success: function(xml) {  
                                var tmp = { state : "PENDING" }; 
		                $(xml).find ('Request').each (function (){ 
		                   $(this).children().each(function() {   
		                       tmp[this.tagName]=$(this).text();
		                    });
		                }); 
                                if (! (my.response.state != "PENDING"  && tmp.state == "PENDING") ) {
                                    my.response = tmp;
				    if (my.response.state == "COMPLETE") { 
			                return my.oncomplete(); 
			            } 
                                    my.onprogress ();  
                                } 
			        setTimeout (my.send, 750);
			    }
			});
                    }
                };
 

                Q.queue[id] = object;
                return object;
            }
        },
        Response : {
            create : function () {
                return {
		    state : 'PENDING',
		    caption : 'Waiting...',
		    value : '',
		    max : ''
                }
            }
        }
    }
 
                       /*

{"index":"12",
"id":"422754",
"uuid":"08274184-05d5-4049-adbe-ddb6e3737988",
"group":"fe0acfba-aaab-492f-a853-3902b4e06090",
"parent":"\n",
"type":"picture",
"from":"Siham",
"date":"21 Feb 2014 10:49:52 GMT"
,"subject":"<katie idx2>1-52  All OK   [ThOrP]      \"[1\/1]\" - \"56_1adj.jpg\" -   52586  -  yEnc (1\/1)",
"ref":"Xref|alt.binaries.pictures.sandra|alt.binaries.ella.virginia.model","items":[],"alsoin":"",
"count":"0","cache":true,
"serverkey":"647895f4-070c-4b7c-a933-6f8dacf4d5b3",
"userkey":"64789c93-f109-4592-8bc7-269fc2b665c5",
"username":"milton",
"groupname":"alt.binaries.ella.virginia.model",
"bookmarked":false
}


*/ 
