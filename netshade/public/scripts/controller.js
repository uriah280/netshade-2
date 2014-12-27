var 
    DEFAULT_SIZE = 1024,
    THUMB_SIZE = 244,
    TINY_SIZE = 64,
    THUMB_SUFFIX = "",
    DIALOG_VISIBLE = true,
    DIALOG_HILO = true,
    SLIDE_OFFSET = 5,

    Rangefrom = function (options, start) {
        var countof = options.length, full = 11, SPAN = Math.floor(full / 2), range = [];

        if (start > 0) {
            range.push({ index: 0
                             , text: options[0].text
                             , article: options[0].value
            });
        }


        if ((countof - start) < 3) {
            SPAN = full - (countof - start);
        }

        if (start > SPAN) {
            var f = Math.max(1, Math.floor(start / SPAN)), o = f;
            while (o < start && range.length < SPAN) {
                range.push({ index: o
                               , text: options[o].text
                               , article: options[o].value
                });
                o += f;
            }
        }

        SPAN = full - range.length - 1;

        var o = start, spanof = countof - o, f = Math.max(1, Math.floor(spanof / SPAN));
        while (o < countof) {
            range.push({ index: o
                             , text: options[o].text
                             , article: options[o].value
            });
            o += f;
        }


        if (range[range.length - 1].index != (options.length - 1))
            range.push({ index: options.length - 1
                             , text: options[options.length - 1].text
                             , article: options[options.length - 1].value
            });

        return range;
    },

    Singleton = (function () {

        var instance;

        function createInstance(callback) {

            var onload = callback;
            var worker = new Worker('/scripts/async.js?' + new Date().getTime());
            worker.onmessage = function (e) {
                var msg = e.data.content;
                onload(msg);
            }
            worker.onerror = function (e) { confirm("Err:" + typeof (e.message)); }
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

    Click = {
        Event: {

            '.a-hi': function () {
                DIALOG_HILO = !DIALOG_HILO;
                $(this).html(DIALOG_HILO ? "Hilo" : "Sort");
                localStorage["hilo"] = DIALOG_HILO ? "on" : "off";
                Controller.preview();
            },
            '.link': function () {
                location.href = this.id;
            }

        },
        Load: function () {
            for (var label in this.Event) {
                $(label).click(this.Event[label]);
            }
        }
    },
    Controller = {


        nextPage: function (article) {
            location.href = $("#text-page").val() + article;
        },

        view: function (id, dir) {
            require(['element'], function (element) {
                element.displaySelected(thumb_worker, cache_worker, id, dir);
            });
        },


        dropSelect: function (index, article) {
            $("#article-select").each(function () {
                var selectedIndex = this.selectedIndex;
                this.selectedIndex = index;
                Controller.view(article, index - selectedIndex);
            });
        },

        preview: function () {
            require(['element'], function (element) {
                element.configurePreviewThumbnails(canvas_worker, cache_worker, DIALOG_VISIBLE, DIALOG_HILO);
            });
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
                Controller.view($(this).val());
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

        factory: {
            worker: [{
                name: 'canvas',
                path: '/scripts/worker/canvas.js'
            },
                  {
                      name: 'request',
                      path: '/scripts/worker/request.js'
                  },
                 {
                     name: 'slide',
                     path: '/scripts/worker/slider.js'
                 }
            ],
            open: function () {
                for (var bob, i = 0; bob = this.worker[i]; i++) {
                    Controller.require(bob);
                }
                Controller.start_();
            }
        }, //Controller.factory.

        require: function (bob) {
            require([bob.path], function (object) {
                Controller.factory[bob.name] = object;
            });
        },

        start_: function () {
            this.factory.open();
        },

        start: function () {
            var value = localStorage["dialog"], on = value && value == "on", hilo = localStorage["hilo"] && localStorage["hilo"] == "on";
            DIALOG_VISIBLE = on;
            DIALOG_HILO = hilo;
            BASE_WIDTH = $(document).width() - 48;
            THUMB_SIZE = (BASE_WIDTH / 4); // - 44;
            TINY_SIZE = BASE_WIDTH / 16;


            $.browser = {
                android: navigator.userAgent.indexOf("Android") > 0
            };

            this.orient();


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

            //            $(".leftButton").click(function () {
            //                location.href = this.id;
            //            });

            //            $(".rightButton").click(function () {
            //                DIALOG_VISIBLE = true;
            //                Controller.preview();
            //                $("#dialog").dialog({
            //                    autoOpen: true,
            //                    width: 600,
            //                    buttons: [{
            //                        text: "Okay",
            //                        class: "roundButton",
            //                        click: function () {
            //                            DIALOG_VISIBLE = false;
            //                            $(this).dialog("close");
            //                        }
            //                    }]

            //                });
            //            });

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
                var sender = this;
                require(['request'], function (req) {
                    req.msmq(sender);
                });

            });

             

            $(".li-sortas").click(function () {
                var rex = /\/sort\/\d+/, old = location.href.replace(rex, ""), href = rex.exec(location.href) ? old : (old + "/sort/1");
                location.href = href;
            });

            // TO DO: update carousel script to workers
            var tmp_c = [];
            $(".carousel").each(function () {
                tmp_c.push(this.id);
            })
            if (tmp_c.length) {
                Fancy.init(tmp_c);
            }

            // ----------------------------------------------------------'
            // TO DO: redo MEDIA actions
            // ----------------------------------------------------------'
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

            // TO DO: redo UNRAR actions
            $(".article-unrar").each(function () {
                Thumbpane.create(this, this.id, $(this).html(), THUMB_SIZE, false, false, true);
                $(this).click(function () {
                    var on = location.href.replace('/unrar/', '/onrar/') + "/of/" + this.id;
                    location.href = on;
                });
            });

            // TO DO: redo RAR actions
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
            // ----------------------------------------------------------'


            $(".article-lookup").css({ display: "none" });

            require(['element'], function (element) {
                element.configureThumbnails(thumb_worker);
                element.configurePreviewCanvas(canvas_worker, DIALOG_HILO, DIALOG_VISIBLE);
            });

        }
    };
 
  

$(document).ready (function () {
    Controller.start ();
});


 

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
