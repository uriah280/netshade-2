var
    DEFAULT_SIZE = 1024,
    THUMB_SIZE = 244,
    TINY_SIZE = 64,
    THUMB_SUFFIX = "",
    DIALOG_VISIBLE = true,
    DIALOG_HILO = true,
    SLIDE_OFFSET = 5,

    Rangefrom = function (options, start)
    { 
            var countof = options.length , full = 11, SPAN = Math.floor (full / 2), range = [];

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

        nextPage: function (article) {
            location.href = $("#text-page").val() + article;
        },

        view: function (id, direction) {

            thumb_worker.clear();

            $(".article-scale").each(function () {
                $(this).attr("data-scale-key", id);
                $(this).attr("data-direction", direction);
                $(this).data("scaleKey", id);
                $(this).data("direction", direction);
                thumb_worker.create(this, -1, "scaleKey", function () {
                    Controller.preview();
                    ServiceBus.OnPageResize();
                }, "data");
            });


            $("#article-select").each(function () {
                for (var f, x = this.selectedIndex, m = Math.min(x + 3, this.options.length - 1); (f = this.options[x]) && (x < m); x++) {
                    cache_worker.create(f.value);
                }
            });
        },

        multipass: function (keys) {


            var params = { keys: keys };
            var worker = new Worker('/scripts/async.js?' + new Date().getTime());
            worker.onmessage = function (e) {
                var msg = e.data.content;
                alert(msg);
            }
            worker.onerror = function (e) { confirm("Err:" + typeof (e.message)); }

            worker.postMessage(params);

        },

        dropSelect: function (index, article) {
            $("#article-select").each(function () {
                var selectedIndex = this.selectedIndex;
                this.selectedIndex = index;
                Controller.view(article, index - selectedIndex);
            });
        },

        preview: function () {


            $id = [];
            canvas_worker.clear();

            var selectedIndex = -1;
            $(".article-tiny").each(function () {

                if (!DIALOG_VISIBLE) return;
                var that = this, tinyIndex = this.id;
                $(this).empty();
                $(this).css("border", "none");

                if (DIALOG_HILO) {
                    $("#article-select").each(function () {
                        var drp = this, range = Rangefrom(drp.options, drp.selectedIndex), i = tinyIndex - (-SLIDE_OFFSET);
                        if (i < 0 || i >= range.length || range.length < 1) return;
                        var id = range[i].article, text = range[i].text, index = range[i].index;
                        $(that).click(function () { Controller.dropSelect(index, id); }); // drp.selectedIndex = index; Controller.view(id) });
                        canvas_worker.create(id, index);
                    });
                }
                else {
                    $("#article-select").each(function () {
                        selectedIndex = this.selectedIndex;
                        var drp = this, dropIndex = drp.selectedIndex, articleIndex = dropIndex - (-tinyIndex);
                        if (articleIndex < 0 || articleIndex >= drp.options.length || drp.options.length < 1) return;
                        var id = drp.options[articleIndex].value, text = drp.options[articleIndex].text;
                        canvas_worker.create(id, articleIndex);
                    }); 
                }
            });

            if (selectedIndex > 0) {
                $("#article-select").each(function () {
                    for (var f, x = selectedIndex + 1, m = Math.min(x + 4, this.options.length - 1); (f = this.options[x]) && (x < m); x++) {
                        cache_worker.create(f.value, "thumb");
                    }
                });
            }
        },

        setNext: function () {
            Controller.timer = 0;
            Controller.setNext_();

        },
        setNext_: function () {
            Controller.timer++;


            if (Controller.timer > 3) {
                return Controller.next();
            }
            setTimeout(Controller.setNext_, 3333);
        },
        next: function (i) {
            var index = i == undefined ? 1 : i;
            $("#article-select").each(function () {
                if (this.selectedIndex == (this.options.length - 1)) this.selectedIndex = 0;
                else this.selectedIndex -= -index;
                var id = $(this).val()
                Controller.view(id);
            });

        },

        orient: function () {
            return;
            var degree = Math.abs(window.orientation), big = Math.max(screen.width, screen.height), sm = Math.min(screen.width, screen.height);
            var screen_x = degree == 90 ? big : sm; //Math.max (screen.width,screen.height);
            var screen_y = degree != 90 ? big : sm; //Math.min (screen.width,screen.height);

            if (screen_x < DEFAULT_SIZE) {
                $('#meta-v').each(function () {

                    this.setAttribute('content', 'user-scalable=no, minimal-ui, initial-scale=1.0, width=' + screen_x);
                    THUMB_SIZE = (screen_x - 52) / 4;
                    $('.arrow').css('width', THUMB_SIZE + 'px');
                    $('.arrow').css('height', THUMB_SIZE + 'px');
                    $('.scroll').css('width', (screen_x - 16) + 'px');
                    $('.scroll').css('height', (screen_y - 172) + 'px');

                });
            }
        },

        getUsername: function () {
            var rex = /user\/(\w+)\//, test = rex.exec(location.href);
            if (test) return test[1];
            var rex2 = /user\/(\w+)/, test2 = rex2.exec(location.href);
            if (test2) return test2[1];
        },

        start: function () {
            var value = localStorage["dialog"], on = value && value == "on", hilo = localStorage["hilo"] && localStorage["hilo"] == "on";
            DIALOG_VISIBLE = on;
            DIALOG_HILO = hilo;


            $.browser = {
                android: navigator.userAgent.indexOf("Android") > 0
            };

            this.orient();

            BASE_WIDTH = $(document).width() - 48;
            THUMB_SIZE = (BASE_WIDTH / 4); // - 44;
            TINY_SIZE = BASE_WIDTH / 16;

            if (screen.width < 400) {
                var w = screen.width - 28, h = (w / (16 / 9)), sm = Math.floor((w - 16) / 5);
                $(".arrow").each(function () {
                    this.style.width = w + "px"
                    this.style.height = h + "px"
                    this.style.background = "#ffa"
                });
                $(".article-hilo").each(function () {
                    $(this).css("margin", "2px");
                    this.style.width = sm + "px"
                    this.style.height = sm + "px"
                    this.style.border = "none";
                    this.style.overflow = "hidden";
                });
                THUMB_SIZE = w;
                TINY_SIZE = sm;
                $(".column1").css("display", "none");
                $(".column2").css("display", "none");
            }

            $(".a-hi").attr("href", "javascript:void(0)");
            $(".a-hi").click(function () {
                DIALOG_HILO = !DIALOG_HILO;
                $(this).html(DIALOG_HILO ? "Hilo" : "Sort");
                localStorage["hilo"] = DIALOG_HILO ? "on" : "off";
                Controller.preview();
            });

            $(".link").attr("href", "javascript:void(0)");
            $(".link").click(function () {
                location.href = this.id;
            });


            $(".dyn-caption").each(function () {
                this.invoke = function (sender, e) {
                    $(this).html(e);
                }
                ServiceBus.Subscribe("OnDyntext", this);
            });

            $(".my-menu").mouseleave(function () {
                $(".my-menu").hide();
            });

            $(".settings-button").click(function () {


                $(".my-menu").css("width", "450px");
                $(".my-menu").css("display", "block");
                $(".my-menu").position({
                    my: "left top",
                    at: "right bottom",
                    of: ".settings-button"
                });
                $(".my-menu").menu();
            });

            $("#canvas-teeny").each(function () {
                $(this).click(function (e) {

                    var offset = $(this).offset(), ordinal = Math.floor((e.clientX - offset.left) / 64),
                               index = ordinal - SLIDE_OFFSET;



                    $("#article-select").each(function () {
                        var drp = this, o = drp.selectedIndex, i = o - (-index);


                        if (DIALOG_HILO) {
                            var cheat = canvas_worker.object[ordinal];
                            Controller.dropSelect(cheat.index, cheat.article);
                            //                            drp.selectedIndex = cheat.index;
                            //                            Controller.view(cheat.article);
                            return;
                        }

                        if (i < 0 || i >= drp.options.length || drp.options.length < 1) return alert(i + " is NOT valid  ");
                        var id = drp.options[i].value, text = drp.options[i].text;


                        Controller.dropSelect(i, id);
                        //                        drp.selectedIndex = i;
                        //                        Controller.view(id);
                    });


                });

                this.invoke = function (sender, e) {
                    $(this).css("display", DIALOG_VISIBLE ? "inline" : "none");
                }
                ServiceBus.Subscribe("OnPageResize", this);
            });


            $(".controller").each(function () {
                this.invoke = function (sender, e) {
                    var W = ($(window).width() - this.offsetWidth) / 2;

                    $(this).css({ height: DIALOG_VISIBLE ? "112px" : "24px",
                        overflow: "hidden",
                        left: W + "px"
                    });

                    var H = $(window).height() - this.offsetHeight - 8;
                    this.style.top = H + "px";
                }
                this.style.height = "112px";
                ServiceBus.Subscribe("OnPageResize", this);
            });
            window.onresize = function () { ServiceBus.OnPageResize(); }

            $("#progressbar").each(function () {
                this.invoke = function (sender, e) {
                    $(this).progressbar({
                        value: e
                    });
                }
                ServiceBus.Subscribe("Progress", this);
            });

            $(".article-menu").each(function () {
                // $(this).html (DIALOG_VISIBLE?"&#171;" : "&#187;");
                $(this).click(function () {
                    DIALOG_VISIBLE = !DIALOG_VISIBLE;
                    localStorage["dialog"] = DIALOG_VISIBLE ? "on" : "off";
                    ServiceBus.OnPageResize();
                    Controller.preview();
                });
            });

            $(".span-of").each(function () {
                var t = this.id.split('x'), lo = t[0], hi = t[1], mn = t[2], mx = t[3], key = "I" + Math.floor(Math.random() * 1000000), width = 500, w2 = width + 50; ;
                var img = "<canvas width='" + w2 + "' height='20' id='" + key + "'></canvas>";
                $(this).html(img);
                $("#" + key).each(function () {
                    var api = CanvasAPI, that = this, context = that.getContext('2d'), dm = mx - mn, dl = hi - lo, sx = lo - mn,
                             px = width * (dl / dm), x = width * (sx / dm);
                    context.fillStyle = '#ffc';
                    context.fillRect(0, 0, width + 50, 30);

                    context.fillStyle = '#ccf';
                    context.fillRect(25, 5, width, 10);

                    context.fillStyle = '#009';
                    context.fillRect(25 + x, 5, px, 10);

                    var mw = context.measureText(mx).width, ml = context.measureText(lo).width,
                             max_x = (width + 25) - (mw / 2), lo_x = 25 + x - (ml / 2), max_y = 9, lo_y = 19;

                    while ((lo_x + ml) >= (max_x - 10)) lo_x -= 10;

                    api.imagestring(context, '300 8pt Lato', 1, 9, mn, '#333');
                    api.imagestring(context, '300 8pt Lato', max_x, max_y, mx, '#333');
                    api.imagestring(context, '300 8pt Lato', lo_x, lo_y, lo, '#333');
                    api.imagestring(context, '300 8pt Lato', max_x, lo_y, hi, '#333');
                });
            });

            $(".a-next").each(function () {
                $(this).attr("href", "javascript:void(0)");
                $(this).click(function () {
                    var tmp = this.className.split(" "), i = tmp[1]
                    Controller.next(i);
                });
            });

            $(".a-swipe").on("swipeleft", function () {
                Controller.next(1);
            });
            $(".a-swipe").on("swiperight", function () {
                Controller.next(-1);
            });


            $(".a-ps").each(function () {
                var value = localStorage["playing"], on = value && value == "on";
                $(this).attr("href", "javascript:void(0)");
                $(this).html(on ? "Stop" : "Play");

                $(this).click(function () {
                    localStorage["playing"] = on ? "off" : "on";
                    $("#article-select").each(function () {
                        Controller.nextPage($(this).val());
                    });
                });

            });

            $(".a-count").click(function () {
                var old = location.href;
                old = old.replace(/\/most\/\d+/, "") + "/most/" + this.id;
                old = old.replace(/\/page\/\d+/, "") + "/page/1";
                location.href = old;
            });

            $(".leftButton").click(function () {
                location.href = this.id;
            });

            $(".rightButton").click(function () {
                DIALOG_VISIBLE = true;
                Controller.preview();
                $("#dialog").dialog({
                    autoOpen: true,
                    width: 600,
                    buttons: [{
                        text: "Okay",
                        class: "roundButton",
                        click: function () {
                            DIALOG_VISIBLE = false;
                            $(this).dialog("close");
                        }
                    }]

                });
            });

            $("#text-suffix").each(function () {
                THUMB_SUFFIX = ""; // $(this).val();
                Thumbpane.suffix = THUMB_SUFFIX;
            });

            $(".paginator").click(function () {
                var href = this.id, tmp = href.split("/"), page = tmp.pop(), group = this.title, command = "/rpc/get-articles/page/" + page + "/group/" + group;
                $.get(command, function (uuid) {
                    TPane.batch(document.getElementById("div-stat"), uuid.split(","), THUMB_SUFFIX,
                                     function () {
                                         location.href = href;
                                     });
                });
            });

            $("#article-select").change(function () {
                Controller.nextPage($(this).val());
            });


            $(".bookmark").click(function () {
                $.get(this.id, function (data) {
                    location.reload();
                });
            });


            $(".rpcparam").click(function () {
                var re, rex = /most\/(\d+)/,
                         most = !(re = rex.exec(location.href)) ? "" : ("/most/" + re[1]);
                var param = prompt("Find:", "");

                if (!param) return;
                var href = location.href.replace("group/list", "rpc/find/param/" + param + most);
                location.href = href;

            });

            $(".group-join").click(function () {
                var re, name = $("#text-user").val(), tmp = this.className.split(" "),
                     rex = /most\/(\d+)/, most = !(re = rex.exec(location.href)) ? "" : ("/most/" + re[1]),
                       href = "/group/join/user/" + name + "/name/" + this.id +
                                "/start/" + tmp[1] + "/amount/" + tmp[2] + most;
                location.href = href;
            });
            $(".group-renew").click(function () {
                var name = $("#text-user").val(), href = "/group/join/user/" + name + "/name/" + this.id + "/renew/renew";
                //  return window.open (href);
                location.href = href;
            });
            $(".group-name").click(function () {
                var t = Controller.getUsername();
                var name = t || Controller.getUsername(), href = "/group/join/user/" + name + "/name/" + this.id;
                //  return window.open (href);
                location.href = href;
            });
            $(".a-group").click(function () {
                var name = Controller.getUsername(), href = "/group/join/user/" + name + "/name/" + this.id;
                location.href = href;
            });
            $(".msmq-id").each(function () {
                var uuid = $(this).html(), url = this.id,
                     ondone = function () { location.href = url };
                var q = QMessage.create("/rpc/receive/id/" + uuid, ondone, this);
                q.send();
            });
            var id = "", that = undefined, title = undefined,
                     ondone = function () { alert("Done") },
                  batch = [];


            $(".li-sortas").click(function () {
                var rex = /\/sort\/\d+/, old = location.href.replace(rex, ""), href = rex.exec(location.href) ? old : (old + "/sort/1");
                location.href = href;
            });


            var tmp_c = [];
            $(".carousel").each(function () {
                tmp_c.push(this.id);
            })
            if (tmp_c.length) {
                Fancy.init(tmp_c);
            }


            $(".article-unrar").each(function () {
                Thumbpane.create(this, this.id, $(this).html(), THUMB_SIZE, false, false, true);
                $(this).click(function () {
                    var on = location.href.replace('/unrar/', '/onrar/') + "/of/" + this.id;
                    location.href = on;
                });
            });


            $(".article-all").each(function () {
                $(this).click(function () {
                    var on = location.href + "/all/1/get/" + this.id;
                    location.href = on;
                });
            });


            $(".article-rar").each(function () {
                var israrpage = location.href.indexOf("/rar/") > 0;

                if (this.className.indexOf("cache") > 0) {
                    Thumbpane.create(this, this.id, $(this).html(), THUMB_SIZE);
                    if (israrpage) {
                        $(this).click(function () {
                            var on = location.href.replace('/rar/', '/unrar/');
                            location.href = on + "/r/" + this.id;
                        });
                        return;
                    }
                }


                if (israrpage) {
                    $(this).click(function () {
                        var on = location.href;
                        location.href = on + "/get/" + this.id;
                    });
                    return;
                }

                $(this).click(function () {
                    var on = $("#text-page").val().replace('/index/', '/rar/');
                    location.href = on + this.id;
                });
            });

            $(".article-lookup").css({ display: "none" });


            $("*[data-article-index]").each(function () {
                var id = $(this).data("articleIndex"), value = $(this).html();
                thumb_worker.text[id] = value;
            });


            try {
                $("*[data-article-key]").each(function () {


                    $(this).css(
                      { width: THUMB_SIZE + "px",
                          height: THUMB_SIZE + "px"
                      }
                    );

                    if (this.className.indexOf("article-picture") >= 0) {

                        var that = this, drawCells = function () {
                            thumb_worker.clear();
                            $("*[data-small-key]").each(function () {
                                var ts = TINY_SIZE - 1;
                                $(this).css(
                                        { width: ts + "px",
                                            height: ts + "px"
                                        }
                                    );
                                $(this).click(function () {
                                    var old = location.href.replace(/\/page\/\d+/, "") + "/page/" + this.id;
                                    location.href = this.id;
                                });
                                thumb_worker.create(this, TINY_SIZE, "smallKey");
                            });
                        },


                        onClick = function (sender, e, regions) {

                            var offset = $(sender).offset(), x = e.clientX - offset.left, y = e.clientY - offset.top,
                                    article = $(sender).data("article"), worker = this;

                            for (var reg, i = 0; reg = regions[i]; i++) {
                                if (reg.contains(x, y)) {
                                    switch (reg.label) {
                                        case "pause":
                                            return slide_worker.create(that, article, worker.onclick);
                                            break;
                                        case "play":
                                            if (slide_worker.object[article]) {
                                                return slide_worker.object[article].pause(slide_worker.object[article].state);
                                            }
                                            return slide_worker.create(that, article, worker.onclick);
                                            break;
                                        case "bookmark":
                                            return thumb_worker.bookmark(article);
                                            break;
                                    }
                                }
                            }

                            if (slide_worker.object[article] && slide_worker.object[article].state) {
                                slide_worker.object[article].direct();
                                return;
                            }

                            Controller.nextPage(article);
                        }


                        thumb_worker.create(this, THUMB_SIZE, "articleKey", drawCells, "thumb", onClick);

                    }


                });
            }
            catch (e) {
                alert(e.message)
            }



            $(".article-scale").each(function () {
                $(this).attr("data-scale-key", this.id);
                thumb_worker.create(this, -1, "scaleKey", function () {
                    Controller.preview();
                    ServiceBus.OnPageResize();
                }, "data");
            });

            var mediaClick = function () {
                var src = "/rpc/picture/id/" + this.id, existing = $(this).html();
                if (this.className.indexOf('cache') > 0) {
                    $(this).click(function () {
                        window.open(src);
                    });
                    return TPane.bycache(this);
                }
                else $(this).click(function () {
                    return TPane.create(this);
                });
            };

            $(".article-wmv").each(mediaClick);
            $(".article-m4v").each(mediaClick);

            Attachprog();


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
                           Controller.setNext();//  setTimeout (Controller.next, 6000); 
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
var FAVEB64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABgUlEQVR42mNkoBAwUs2AnVJS3G7c3CVAphUQP3r150+f+P3710Fy9xQUlBRZWXOBTFkgPrHn27cprk+f/oAbMFVUlDlLQGA/kGmLZPjXr//+ufz6//+/IDPzbiCfF0nuwLJPn1yiX778Czbgs7JyOA8T0wosLrwOtUQDXeLP//+RrHfurAAb8E9FZTYjI2MKKX4HOmwu0507KWAD/iorr2NiYgokxYB///6tZ757NwhswDtp6VmCXFyppBjw4du3mYJPn2aADTjEze1hLSm5nYmRuFj99/8/w9nnz13Nvn7dA9fxUFh4o5yQkB8Rfmd49O7dKoV378IZGJDSQS8TE2+IoOB2WUFBa0YcLgFpfvju3d6NHz74Ffz79w3FABBoZGTkCOXhmaYiKprAysyMIvfrz5//d16/nrb269fCuv//f8PEsVp1iJU1VEdMbAYwYIVA/Pffvr299vp1is2vXxvQ1eIMtTmMjNLWPDxdQO8wn/3ypST6378n2NRRLzORCwCG2Y4RZzDtrAAAAABJRU5ErkJggg==";
