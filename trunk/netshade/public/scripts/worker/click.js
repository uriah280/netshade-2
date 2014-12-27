define(function () {

    return {
        enableClickableElements: function () {
            for (var name in this.events) {
                var method = this.events[name];
                $(name).each(function () {
                    if (this.tagName.toLowerCase() == "a") {
                        $(this).attr("href", "javascript:void(0)");
                    }
                    $(this).click(method);
                });
            } 
        },

        events: { 

            ".group-join" : function () {
                var re, name = $("#text-user").val(), tmp = this.className.split(" "),
                     rex = /most\/(\d+)/, most = !(re = rex.exec(location.href)) ? "" : ("/most/" + re[1]),
                       href = "/group/join/user/" + name + "/name/" + this.id +
                                "/start/" + tmp[1] + "/amount/" + tmp[2] + most;
                location.href = href;
            },
            ".group-renew" : function () {
                var name = $("#text-user").val(), href = "/group/join/user/" + name + "/name/" + this.id + "/renew/renew"; 
                location.href = href;
            },
            ".group-name" : function () {
                var t = Controller.getUsername();
                var name = t || Controller.getUsername(), href = "/group/join/user/" + name + "/name/" + this.id;
                //  return window.open (href);
                location.href = href;
            },
            ".a-group" : function () {
                var name = Controller.getUsername(), href = "/group/join/user/" + name + "/name/" + this.id;
                location.href = href;
            },
            ".li-sortas" : function () {
                var rex = /\/sort\/\d+/, old = location.href.replace(rex, ""), href = rex.exec(location.href) ? old : (old + "/sort/1");
                location.href = href;
            },





            ".article-menu": function () {
                DIALOG_VISIBLE = !DIALOG_VISIBLE;
                localStorage["dialog"] = DIALOG_VISIBLE ? "on" : "off";
                ServiceBus.OnPageResize();
                Controller.preview();
            },
            ".a-ps": function () {
                var value = localStorage["playing"], on = value && value == "on";
                localStorage["playing"] = on ? "off" : "on";
                $(this).html(on ? "Stop" : "Play");
                $("#article-select").each(function () {
                    Controller.nextPage($(this).val());
                });
            },
            ".a-hi": function () {
                DIALOG_HILO = !DIALOG_HILO;
                $(this).html(DIALOG_HILO ? "Hilo" : "Sort");
                localStorage["hilo"] = DIALOG_HILO ? "on" : "off";
                Controller.preview();
            },
            ".link": function () {
                location.href = this.id;
            },
            ".settings-button": function () {
                $(".my-menu").css("width", "450px");
                $(".my-menu").css("display", "block");
                $(".my-menu").position({
                    my: "left top",
                    at: "right bottom",
                    of: ".settings-button"
                });
                $(".my-menu").menu();
            },
            ".a-count": function () {
                var old = location.href;
                old = old.replace(/\/most\/\d+/, "") + "/most/" + this.id;
                old = old.replace(/\/page\/\d+/, "") + "/page/1";
                location.href = old;
            },
            ".bookmark": function () {
                $.get(this.id, function (data) {
                    location.reload();
                });
            },
            ".rpcparam": function () {
                var re, rex = /most\/(\d+)/,
                         most = !(re = rex.exec(location.href)) ? "" : ("/most/" + re[1]);
                var param = prompt("Find:", "");

                if (!param) return;
                var href = location.href.replace("group/list", "rpc/find/param/" + param + most);
                location.href = href; 
            },
            ".a-next": function () {
                $(this).click(function () {
                    var tmp = this.className.split(" "), i = tmp[1]
                    Controller.next(i);
                });
            }
        }
    };

})