var 
    DEFAULT_SIZE = 1024,
    THUMB_SIZE = 244,
    TINY_SIZE = 64,
    THUMB_SUFFIX = "",
    DIALOG_VISIBLE = true,
    DIALOG_HILO = true,
    SLIDE_OFFSET = 5,

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

            $("#article-select").change(function () {
                Controller.nextPage($(this).val());
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


            $(".msmq-id").each(function () {
                var sender = this;
                require(['request'], function (req) {
                    req.msmq(sender);
                });
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


            // ----------------------------------------------------------'
            // element ONCLICK events
            // ----------------------------------------------------------'  
            require(['click'], function (req) {
                req.enableClickableElements();
            });
            // ----------------------------------------------------------' 

            require(['element'], function (element) {
                element.configureThumbnails(thumb_worker);
                element.configurePreviewCanvas(canvas_worker, DIALOG_HILO, DIALOG_VISIBLE);
                element.displayGroupInfo(); 
            }); 
        }
    };
 
  

$(document).ready (function () {
    Controller.start ();
});


 

$( window ).on( "orientationchange", function( event ) {
    Fancy.setSizes();
});
   


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