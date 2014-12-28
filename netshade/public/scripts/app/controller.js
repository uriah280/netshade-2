define(['lib/element', 'fancy', 'lib/click', 'lib/debug'], function (element, fancy, click, debug) {
    var elmntObject = element;
    var fancyObject = fancy;
    var clickObject = click;
    var debugObject = debug;

    debug.log("Starting controller...");
    var object = { 
        start: function () {

            var controller = this, value = localStorage["dialog"], on = value && value == "on",
                            hilo = localStorage["hilo"] && localStorage["hilo"] == "on",
                                playing = localStorage["playing"] && localStorage["playing"] == "on";

            NEXT_PAGE = $("#text-page").val();
            PLAYER_PLAYING = playing;
            DIALOG_VISIBLE = on;
            DIALOG_HILO = hilo;
            BASE_WIDTH = $(document).width() - 48;
            THUMB_SIZE = (BASE_WIDTH / 4); // - 44;
            TINY_SIZE = BASE_WIDTH / 16;

            $("#article-select").change(function () {
                controller.nextPage($(this).val());
            });

            $(".my-menu").mouseleave(function () {
                $(".my-menu").hide();
            });

            $(".msmq-id").each(function () {
                require('request').msmq(this); 
            });

            this.deprecatedActions();

            // ----------------------------------------------------------'
            // element ONCLICK events
            // ----------------------------------------------------------'  
            clickObject.enableClickableElements();


            // ----------------------------------------------------------'  
            elmntObject.configureThumbnails();
            elmntObject.configurePreviewCanvas();
            elmntObject.displayGroupInfo();
            elmntObject.enableSlideController();

            // ----------------------------------------------------------' 
            fancyObject.load(this);

            this.deprecatedActions();
        },

        deprecatedActions: function () {

            // ----------------------------------------------------------'
            // TO DO: redo MEDIA actions
            // ----------------------------------------------------------'
            var mediaClick = function () {
                debugObject.log("MEDIA actions not defined for {0}.{1}".format(this.tagName, this.className));
            };

            $(".article-wmv").each(mediaClick);
            $(".article-m4v").each(mediaClick);

            // TO DO: redo UNRAR actions
            $(".article-unrar").each(function () {
                debugObject.log("UNRAR actions not defined for {0}.{1}".format(this.tagName, this.className));
            });

            // TO DO: redo RAR actions
            $(".article-rar").each(function () {
                debugObject.log("RAR actions not defined for {0}.{1}".format(this.tagName, this.className));
            });
            // ----------------------------------------------------------' 

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

        }
    };
    return object;

});