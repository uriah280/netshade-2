define(['servicebus', 'debug'], function (bus, debug) {
    var Bus = bus;
    var Bug = debug;
    return {
        enableClickableElements: function (elementObject) {
            for (var name in this.events) {
                this.enable(name, elementObject);
            }
        },

        enable: function (name, elementObject) {
            var that = this, element = elementObject, method = this.events[name];
            $(name).each(function () {
                if (this.tagName.toLowerCase() == "a") {
                    $(this).attr("href", "javascript:void(0)");
                }
                $(this).off("click");
                $(this).click(method);
            });

        },

        events: {



            ".group-join": function () {
                var re, name = $("#text-user").val(), tmp = this.className.split(" "),
                     rex = /most\/(\d+)/, most = !(re = rex.exec(location.href)) ? "" : ("/most/" + re[1]),
                       href = "/group/join/user/" + name + "/name/" + this.id +
                                "/start/" + tmp[1] + "/amount/" + tmp[2] + most;
                Bug.log(href);
                confirm(href);
                location.href = href;
            },
            ".group-renew": function (sender) {
                var name = $("#text-user").val(), href = "/group/join/user/" + name + "/name/" + this.id + "/renew/renew";
                location.href = href;
            },
            ".group-name": function (sender) {
                var name = getUsername(), href = "/group/join/user/" + name + "/name/" + this.id;
                //  return window.open (href);
                location.href = href;
            },
            ".a-group": function (sender) {
                var name = getUsername(), href = "/group/join/user/" + name + "/name/" + this.id;
                location.href = href;
            },
            ".li-sortas": function () {
                var rex = /\/sort\/\d+/, old = location.href.replace(rex, ""), href = rex.exec(location.href) ? old : (old + "/sort/1");
                location.href = href;
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
            }
        }
    };

})