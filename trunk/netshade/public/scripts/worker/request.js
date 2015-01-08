define(function () {

    return {
        format: {
            command: function (key) {
                return "/rpc/thumb/article/{0}/user/{1}".format(key, getUsername());
            },
            picture: function (key, fieldname) {
                return "/rpc/smalltextpicture/id/{0}/field/{1}".format(key, fieldname);
            },
            bookmark: function (key) {
                return "/rpc/bookmark/id/{0}/user/{1}".format(key, getUsername());
            },
            request: function (key) {
                return "/rpc/receive/id/" + key;
            }
        },
        msmq: function (element) {
            var uuid = $(element).html(), url = element.id, tag = element, w = {
                command: this.format.request(uuid),
                element: {
                    show: function (response) {
                        if (response && response.caption)
                            return $(tag).html(response.caption + "...");
                        $(tag).html("No response");
                    },
                    done: function () { location.href = url; }
                }
            }
            this.create(w.element, w.command);
        },
        open: function (worker) {
            var that = this;

                // console.log("Connecting to: " + worker.command);
            try {
                $ajax(worker.command, function (uuid) {
                    // console.log("Response:  " + "[(" + uuid + ")]");
                    if (uuid == "-1") return worker.element.done();
                    that.create(worker.element, that.format.request(uuid));
                });
            }
            catch (ex) {
                // // console.log(ex.message);
            }
        },
        create: function (element, command) {
            var object = {
                element: element
            , command: command

            , response: {
                state: 'PENDING',
                caption: 'Waiting...',
                value: '',
                max: ''
            }

            , done: function () {
                this.element.done(this.response);
            }

            , show: function () {
                this.element.show(this.response);
            }

            , send: function () {
                var that = this;
                $.ajax({
                    type: "GET",
                    url: that.command,
                    cache: false,
                    dataType: "xml",
                    success: function (xml) {
                        var response = { state: "PENDING" };
                        $(xml).find('Request').each(function () {
                            $(this).children().each(function () {
                                response[this.tagName] = $(this).text();
                            })
                        });


                // console.log("ping...");
                        if (!(that.response.state != "PENDING" && response.state == "PENDING")) {
                            that.response = response;
                // console.log(that.response.state);
                            if (that.response.state == "COMPLETE") {
                                return that.done();
                            }
                            that.show();
                        }
                        return window.setTimeout(function () { that.send() }, 300);
                    }
                });

            }
            };
            object.send();
            return object;
        }
    }
});
