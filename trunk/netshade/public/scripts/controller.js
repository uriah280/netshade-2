var 
    DEFAULT_SIZE = 1024,
    THUMB_SIZE = 244,
    TINY_SIZE = 64,
    THUMB_SUFFIX = "",
    DIALOG_VISIBLE = true,
    DIALOG_HILO = true,
    SLIDE_OFFSET = 5,

    $ajax = function (uri, callback) {
        var onload = callback, params = { uri: uri };

        return $.ajax({
            type: "GET",
            url: uri,
            cache: false,
            success: callback
        });

    },


     shuffle = function (o) { //v1.0
         for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
         return o;
     },

    Controller = {


        nextPage: function (article) {
            location.href = $("#text-page").val() + article;
        },

        view: function (id, dir) {
            require(['debug'], function (debug) {
                debug.log("Controller.view: " + id);
            });
            require(['element'], function (element) {
                element.displaySelected(id, dir);
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
                element.configurePreviewThumbnails(DIALOG_VISIBLE, DIALOG_HILO);
            });
        },

        next: function (i) {
            var index = i == undefined ? 1 : i;
            $("#article-select").each(function () {
                if (this.selectedIndex == (this.options.length - 1)) this.selectedIndex = 0;
                else this.selectedIndex -= -index;
                Controller.view($(this).val());
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


        getUsername: function () {
            var rex = /user\/(\w+)\//, test = rex.exec(location.href);
            if (test) return test[1];
            var rex2 = /user\/(\w+)/, test2 = rex2.exec(location.href);
            if (test2) return test2[1];
        },

        start: function () {
            var value = localStorage["dialog"], on = value && value == "on", 
                            hilo = localStorage["hilo"] && localStorage["hilo"] == "on";
            DIALOG_VISIBLE = on;
            DIALOG_HILO = hilo;
            BASE_WIDTH = $(document).width() - 48;
            THUMB_SIZE = (BASE_WIDTH / 4); // - 44;
            TINY_SIZE = BASE_WIDTH / 16; 

            $.browser = {
                android: navigator.userAgent.indexOf("Android") > 0
            };

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

            $(".my-menu").mouseleave(function () {
                $(".my-menu").hide();
            }); 

            $(".msmq-id").each(function () {
                var sender = this;
                require(['request'], function (req) {
                    req.msmq(sender);
                });
            });

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
                element.configureThumbnails();
                element.configurePreviewCanvas(DIALOG_HILO, DIALOG_VISIBLE);
                element.displayGroupInfo();
                element.enableSlideController(); 
            });

            // TO DO: update carousel script to workers
            require(['fancy'], function (fancy) {
                fancy.load();
            });

        }
    };
  