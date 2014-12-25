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

                    if (this.x >= 0) return picture.dispose();
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
                                     location.href = on;//   window.open( on );
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
            Fancy.loading = arr; // shuffle( arr );
            Fancy.limit = arr.length; 
            Fancy.go ();
        },  

        init_ : function () {
 
            
            var groupname = Fancy.loading.pop (), username = Controller.getUsername(), url = "/rpc/picsof/user/" + username + "/name/" + groupname;
              document.title = Fancy.limit + ". "+groupname+"...";
            $ajax(url, function (data) { 
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
 
                        if (list.length == 0) {
//if (confirm(groupname + " has no items\n" + data ))
                             Fancy.limit --;
                             Fancy.proceed ();
                            return;
                        }
 
                        Fancy.add (groupname, list);
                        Fancy.proceed_ ();

                   } catch (ex) 
                   { 
 
//                    if (confirm(ex.message))
                        Fancy.limit --;
                        Fancy.proceed ();
                   }

		});

        },

        add : function (name, list) {
            if (list.length < 5) return;// alert (name + " list only has " + list.length + " items"); 
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

            sb[0] = { href:"/group/join/name/" + f.groupname + "/user/" + f.username + "/id/", id : 0, uuid : f.uuid, text:"Open " + f.groupname, batch : subitem };  
            sb[1] = { href:href, id : 1, text:"See all " + f.count + " items", uuid : f.uuid, batch : Fancy.pics.fresh.kids };   
            sb[2] = { href:href, id : 2, text:also, uuid : othergroup.uuid };    
 

            $(".info").each (function (){
                var tmp = this.className.split (" "), i=tmp[0], o=sb[i]
                if (o.batch && o.batch.length == 3) {                                    
                    Photobatch.create (o, canvas_w, canvas_h, 
                        function () { ServiceBus.Fancy (this.picture,  this.source) }, 
                        function () { alert ("An error occured!"); });
                    return; 
                }

                var src = '/rpc/small/id/' + o.uuid, pc = Snapshot.create();// new Image(); 
                pc.onload = function () { ServiceBus.Fancy (this,  o); } 
                pc.src = src;   

             });
 
             setTimeout (Fancy.proceed, 12000);

        },


        play   : function () {

                $("#center-main-canvas").each (function () { 

                    var that=this, z = PANE_SIZE, api = CanvasAPI , context = this.getContext('2d');

                    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

                    for (var p in Fancy.pics )
                    {
                        if (!Fancy.pics[p]) { z = 0 ; continue; }
                        var fresh = Fancy.pics[p], article = fresh.article, name = fresh.group.name,
                            picture = fresh.picture;

                        Fancy.x += Fancy.span;


                        var s = Sizer.fit (picture, PANE_SIZE, PANE_H), x = s.x + Fancy.x + z ;  
                        if (x > z) x = z;
                          
                        for (var f=[],i=0;i<3;i++)
                            f.push (100+Math.floor(Math.random() * 99))

                       // var hue = "rgb("+f[0]+","+f[1]+","+f[2]+")";
                        api.imagecopyresized (context, picture, 0, 0, picture.width, picture.height, x, s.y, s.w, s.h);

                            var imgd = context.getImageData(0, 0, 1, 1),  pix = imgd.data, r = 0;// Math.floor (pix.length/4);// (Math.random() * pix.length);
                          
                               
                        var rep=['alt.', 'binaries.', 'picture.', 'nospam.', 'erotica.', 'erotic.', 'pictures.'], hue = "rgb("+pix[r]+","+pix[r+1]+","+pix[r+2]+")";  
                        for (var f,i=0;f=rep[i++];name=name.replace(f,"")); 
                   name = "#" + name.split (".").join ("-")  
                     //name = name.charAt(0).toUpperCase() + name.substr(1);
 

                        api.imagestring (context, "700 44pt Lato", 38, PANE_H-82, name, hue, null,
                                      600, 18, 5);
                        api.imagestring (context, "300 44pt Lato", 35, PANE_H-90, name, "#fff", null,
                                      600, 18, 5);
                        api.imagestring (context, "300 44pt Lato", 34, PANE_H-89, name, "#333", null,
                                      600, 18, 5);

                           var metrics = context.measureText(name), subject_x = metrics.width + 64, subj_span = PANE_SIZE - subject_x - 40;
                             context.font = "300 12pt Lato";
                               metrics = context.measureText(article.subject);
                              var offY = metrics.width > subj_span ? 108 : 90, line_x = subject_x - 14;


                            api.imageline (context, line_x + 1, PANE_H - 123, line_x + 1, PANE_H - 79, "#333", 2) ;
                            api.imageline (context, line_x, PANE_H - 124, line_x, PANE_H - 80, hue, 2) ;

                        api.imagestring (context, context.font, subject_x+1, PANE_H-offY+1, article.subject, hue, null,
                                      subj_span, 18, 2);
                        api.imagestring (context, context.font, subject_x, PANE_H-offY, article.subject, "#000", null,
                                      subj_span, 18, 2);

                         picture.dispose ();
 

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
               Sweatshop.clear(); Icetag.clear(); Snapshot.clear(); 
            var that=this, group=Fancy.peek();

            try {
                var article = group.peek(), command = "/rpc/randomof/id/" + article.uuid, 
                   src = '/rpc/picture/id/' + article.uuid, tiny = '/rpc/small/id/' + article.uuid;  

//if (confirm(src)) 
                    $ajax( command, function( uuids ) {     
                        try {                            
                        var kids = uuids.split (","), picture = Snapshot.create (function () {  
                            //if (this.width > 1999) return this.src = tiny;
                            Fancy.pics.stale = Fancy.pics.fresh;
                            Fancy.pics.fresh = { kids : kids, group : group, article : article, picture : this };
                            Fancy.x = -PANE_SIZE;
                            Fancy.play();
                        }, Fancy.proceed);
                        picture.src = src; 
                        } catch (ex) {
                            that.proceed ();
                        } 
                    });  
            } catch (ex) {
//if (confirm(ex.message))
                that.proceed ();
            }
        }, 

        setSizes : function () {

            var thin = $(document).width() < $(document).height(), BASE_WIDTH = $(document).width() - 8;

            thin = false;

            if (thin) {
               alert ([$(document).width(), $(document).height()])
                BASE_WIDTH = $(document).width() - 4; 
                BASE_WIDTH = BASE_WIDTH - (BASE_WIDTH % 3);
                BASE_WIDTH += 2;
            }
 
            PANE_SIZE = thin ? BASE_WIDTH : (Math.floor (BASE_WIDTH * 0.75) + 2);

            canvas_w  = thin ? Math.floor ((BASE_WIDTH - 24) / 3) :  Math.floor (BASE_WIDTH * 0.25);
            PANE_H    = Math.floor (9*(PANE_SIZE/16));
            PANE_H    = PANE_H - (PANE_H % 3)
            canvas_h  = Math.floor ((PANE_H - 2) / 3);

                 $("#center-main-canvas").each (function () {
                      this.width = PANE_SIZE;
                      this.height = PANE_H;
                      $(this).css ("width", PANE_SIZE + "px");
                      $(this).css ("height", PANE_H + "px");
                 })

                 $(".info").each (function () {
                      $(this).css ("width", canvas_w + "px");
                      $(this).css ("height", canvas_h + "px");
                 })

                 $(".i-canvas").each (function () {
                      this.width = canvas_w;
                      this.height = canvas_h;
                      $(this).css ("width", canvas_w + "px");
                      $(this).css ("height", canvas_h + "px");
                 })

        },

        go : function () { 
 
                   Fancy.setSizes ();

            $(".header").each (function () {
 
                $(this).html ('<div class="splash main"><canvas id="center-main-canvas" width=' + PANE_SIZE + ' height=' + PANE_H + '/></div>' + 
                              '<div class="0 splash info"><canvas width="' + canvas_w + '" height="' + canvas_h + '" class="i-canvas 0" /></div>' + 
                              '<div class="1 splash info"><canvas width="' + canvas_w + '" height="' + canvas_h + '" class="i-canvas 1" /></div>' + 
                              '<div class="2 splash info"><canvas width="' + canvas_w + '" height="' + canvas_h + '" class="i-canvas 2" /></div>');  
 

                   Fancy.setSizes ();

                 $(".i-canvas").each (function () {
                      var tmp=this.className.split (" "), id=tmp[1];
                      Pane.create (id, this);
                 })

  
               // Fancy.items = shuffle (Fancy.items);

                Fancy.proceed();
            });
        }
    },

         canvas_w = 250, canvas_h = 140, PANE_H = 0,
     shopdata = { w : "", i : "", t : "" },

     Sweatshop = {
         worker  : [],
           countof : function () {
              var i=0;
               for (var x in this.worker)
                if (this.worker[x])
                   i++;
               shopdata.w = i + "x" + this.worker.length;
              document.title = shopdata.i + ", " + shopdata.w + ", " + shopdata.t + "W";
           },
         clear : function () { for (var i=0;i<this.worker.length;i++) this.worker[i]=null; },
         dispose : function (id) { this.worker[id] = null; this.countof(); },
         create : function (params, callback) {
             var onload = callback, id = Sweatshop.worker.length,object= new Worker('/scripts/async.js?' + new Date().getTime());
             object.onmessage = function(e) {
                          var msg = e.data.content; 
                          onload(msg);
                         Sweatshop.dispose (id);
                       }
             Sweatshop.worker.push (object);
             object.postMessage (params);
             return object;
         }
    },
// 
     Icetag = {
         tag  : [],
           countof : function () {
              var i=0;
               for (var x in this.tag)
                if (this.tag[x])
                   i++;
               shopdata.t = i + "x" + this.tag.length;
              document.title = shopdata.i + ", " + shopdata.w + ", " + shopdata.t + "T";
           },
         clear : function () { 
             for (var f, i=0;i<this.tag.length;i++) { 
                 if (f = $(this.tag[i])) f.remove();
                 this.tag[i]=null;
             }
         },
         dispose : function (id) { this.tag[id] = null; this.countof(); },
         create : function (name) {
             var id = Icetag.tag.length, object = document.createElement(name); 
             object.dispose = function (){ Icetag.dispose (id) };
             Icetag.tag.push (object);
             return object;
         }
     },

     Snapshot = {
         image  : [],
           countof : function () {
              var i=0;
               for (var x in this.image)
                if (this.image[x])
                   i++;
               shopdata.i = i + "x" + this.image.length;
              document.title = shopdata.i + ", " + shopdata.w + ", " + shopdata.t + "P";
           },
         clear : function () { for (var i=0;i<this.image.length;i++) this.image[i]=null; },
         dispose : function (id) { this.image[id] = null; this.countof(); },
         create : function (onload, onerror) {
             var id = Snapshot.image.length, object = new Image();
             object.onload  = onload;
             object.onerror = onerror;
             object.dispose = function (){ Snapshot.dispose (id) };
             Snapshot.image.push (object);
             return object;
         }
     },

    $ajax = function (uri, callback) {
                    var onload = callback, params = {  uri : uri };
                          
                      return  $.ajax({
			    type: "GET",
			    url: uri,
			    cache: false, 
			    success: callback
			});

      
                     var worker = Sweatshop.create(params, onload); /*new Worker('/scripts/async.js?' + new Date().getTime());

                    


                     worker.onmessage = function(e) {
                          var msg = e.data.content; 
                          onload(msg);
                       }
                       worker.onerror = function (e) { confirm("Err:" + typeof(e.message)); }
                         */     /*  */

                    // var worker = Singleton.getInstance (callback);
                   //  worker.postMessage (params);

    },

    Runit = {
        items   : [],  
        display : function (image, article, text) { 
            var canvas = Icetag.create("canvas");// document.createElement("canvas");
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

                    if (this.s >= 0) return canvas.dispose();
                    window.requestNextAnimationFrame (next);
                }
            }
 
                   $(image).off ("mousemove"); 

            this.items.push (object);  
            object.go();
            return object;
        },
        create : function (context, picture, caption, size, s, source) {
 

            var trueH=source.element.offsetHeight; var id=this.items.length, object = {
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
 
                    var palette = Icetag.create("canvas"), canvas = this.context.canvas, image = Icetag.create("IMG"),
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
                    var api = CanvasAPI, canvas = this.canvas, context = canvas.getContext('2d'),  Y = trueH - 50;
                                              canvas.style.width = this.w + "px"; 
                                              canvas.style.height = this.h + "px";
                                              canvas.width = this.w; 
                                              canvas.height = this.h;     

                    if (this.source.element.className.indexOf ("preview") > -1)
                    {
                        Y = 24; 
                    }
                         context.clearRect(0,0,this.w,this.h); 

                    api.imagecopyresized (context, this.picture, 0, 0, this.picture.width, this.picture.height, this.x, this.y, this.w, this.h);

                    api.imagestring (context, "9pt Lato", 9, Y + 1, this.caption, "#fff", null,
                                      canvas.width - 20, 14, 5);
                    api.imagestring (context, "9pt Lato", 8, Y, this.caption, "#00f", null,
                                      canvas.width - 20, 14, 5); 

                    return canvas.toDataURL();
                },

                writeFrame : function () { 

                    if (this.source.size > 0) this.image.src = this.staticFrame(); 
                    else { 

                        this.image.onload = null;
                       return this.image.src = this.picture.src;

                       this.canvas = this.context.canvas; 
                       this.staticFrame(); 

                    }
                   // this.image.src = this.source.size < 1 ? this.picture.src : this.staticFrame(); 
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
        old    : { },
        items  : [], 
        oncomplete : undefined,
        check  : function () { 
            this.items.pop(); 
            if (this.items.length == 0) { 
                if (!this.oncomplete) return;
                this.oncomplete(); 
            }
        },
        create : function (element, article, caption, size, preview, css, rar) {
              
            var old;
            if (old = Thumbpane.old[element.id]) {
                old.article = article;
                old.caption = caption;  
            }

          
            var object = {
                element : element,
                article : article,
                caption : caption,
                preview : preview,
                source  : undefined,
                target  : undefined,
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
                                          var api = CanvasAPI, that=this, context = that.getContext('2d'), pic =  Snapshot.create (); //new Image();


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
                                                 this.dispose ();
                                          } 

                                          pic.onerror = function () { 

                                              api.imagestring (context, "9pt Lato", 9, 36, caption + " did not load", "#900", null,
                                                     200, 14, 5); 
                                              if (preview) { Controller.preview (); }
                                              Thumbpane.check();
                                                 this.dispose ();
                                          } 
                                          api.imagestring (context, "9pt Lato", 8, 18, "Drawing...", "#090"); 
 
                                          pic.src = my.source; 
                                          Thumbpane.cache [key] = key;
                                          ServiceBus.OnPageResize();
                               }, 
                               ondone = function () {
                                     my.source  = "/rpc/" + my.type + "/id/" + my.article + after + Thumbpane.table, key = "I" + Math.floor( Math.random() * 1000000 ); 
                                     var img  = "<canvas id='" + key + "' class='" + my.source + "'></canvas>", tiny = target.className.indexOf ("for-canvas"); 
 
                                     if (false)//(tiny > 0) //(my.target && my.size < 0) 
                                     { 
                                          var api = CanvasAPI, that=Icetag.create("canvas"), context = that.getContext('2d'), pic = Snapshot.create(),// new Image(), 
                                               index = target.id - (-3); 

                                              that.style.width = "52px"; 
                                              that.style.height = "52px";
                                              that.width = 52; 
                                              that.height = 52;    

                                          pic.onload = function () {
                                              var s = Sizer.fit (this, 52, null, true), x = s.x + (index * 54) + 6, im = this;
 
                                              $("#canvas-teeny").each (function(){ 
                                                   var ctx = this.getContext('2d');   
                                                          ctx.clearRect(x,0,52,52);
                                                     api.imagecopyresized (ctx, im, 0, 0, im.width, im.height, x, s.y, s.w, s.h); 
                                                     if (index == 3)
                                                     {
                                                          var y = Math.min (52, s.h)
                                                             api.imageline (ctx, x, y, x + s.w, y, "#900", 6) ;
                                                     }
                                              });
                                              this.dispose ();
                                          }
                                          pic.src = my.source;
                                     }
                                     else 
                                     { 
                                         $(target).html (img);
                                         my.target = "#" + key;
                                         $(my.target).each (showpic);  
                                     }  
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
                     
                     if (object.size > 0)
                     {
                         var bar = "<div id='text" + key + "'></div><div id='prog" + key + "'></div>";
                         $(target).html (bar);
                     }

                     $ajax( command, function( uuid ) { 
                          if (uuid == "-1") return ondone() ;
                          var q = Q.Message.create ("/rpc/receive/id/" + uuid, onrespond, ondone);
                          q.send(); 
                     }); 
                }
            }
          //  Thumbpane.old[element.id] = object;
            Thumbpane.items.push(object);
            object.load ();
            return object;
        }
    },


    Sizer = {
        force: function () {
            for (var object, i = 0; object = arguments[i]; i++) {
                object.width = this.w;
                object.height = this.h;
            }
        },
        fit: function (picture, size, height, force) {
            if (size < 0) return this.scale(picture);
            var w = picture.width, h = picture.height, r = w / h, w1 = size, h1 = w1 / r, x = 0, y = 0;

            if (w > h && !force) { // long 
                h1 = size;
                w1 = h1 * r;
                if (w1 > size) {
                    x = (size - w1) / 2;
                }
            }

            if (height && height < h1 && w > h) {
                y = -((h1 - height) / 2);
            }

            var object = {
                w: w1,
                h: h1,
                x: x,
                y: y,
                fit: Sizer.force
            };
            return object;
        },
        stretch: function (picture, w1, h1) {

            var w = picture.width, h = picture.height, r = w / h, H = h1, W = H * r, x = 0, y = 0;

            if (!h1) {
                w1 = $(window).width() - 16
                H = $(window).height() - 116
                W = H * r
            }

            while (w1 > W) {
                W++;
                H = W / r;
            }

            if (W > w1) {
                x = -((W - w1) / 2);
            }

            if (H > h1) {
                y = -((H - h1) / 2);
            }

            var object = {
                w: Math.floor(W),
                h: Math.floor(H),
                x: Math.floor(x),
                y: Math.floor(y),
                fit: Sizer.force
            };
            return object;

        },
        scale: function (picture) {

            var w = picture.width, h = picture.height, r = w / h, W = $(window).width() - 16, w1 = W, h1 = w1 / r,
                                H = $(window).height() - 60, h2 = H, x = 0, y = 0;

            if (w > h) { // long  
            } else {
                h1 = h2;
                w1 = h1 * r;
            }

            while (h1 > H || w1 > W) {
                w1--;
                h1 = w1 / r;
            }



            var object = {
                w: w1,
                h: h1,
                x: x,
                y: y,
                fit: Sizer.force
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
                    worker     : new Worker('/scripts/async.js?' + new Date().getTime()),
		    id         : id, 
		    response   : Q.Response.create(),

                    send       : function () {
                        var my = Q.queue[id]; 

 /*
                     my.worker.onmessage = function(e) {
                          var data = e.data.content, xmlDoc = $.parseXML( data ),
                             xml = $( xmlDoc ), tmp = { state : "PENDING" }; 

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
                       my.worker.onerror = function (e) { confirm("Err:" + typeof(e.message)); }
                     return my.worker.postMessage ({uri:my.command});

 */




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
			        setTimeout (my.send, 2750);
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
